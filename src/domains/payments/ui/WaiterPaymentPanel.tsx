"use client";

import { useState } from "react";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";
import {
    useExtractReceiptMutation,
    usePayCashMutation,
    usePayTransferMutation,
    useUploadReceiptMutation,
} from "@/context/services/billingApi";
import type { Bill } from "@/domains/billing/domain/billingApi";
import CameraCapture from "@/domains/payments/ui/CameraCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

function dataUrlToFile(dataUrl: string, name: string): File {
    const [meta, data] = dataUrl.split(",");
    const mime = /data:(.*?);/.exec(meta)?.[1] ?? "image/jpeg";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], name, { type: mime });
}

function readTransferUnderDue(err: unknown): {
    verifiedAmount: number;
    remainingAmount: number;
} | null {
    if (!err || typeof err !== "object") return null;
    const data = (
        err as {
            data?: {
                code?: string;
                verifiedAmount?: string | number;
                remainingAmount?: string | number;
            };
        }
    ).data;
    if (data?.code !== "TRANSFER_UNDER_DUE") return null;
    const verifiedAmount = Number(data.verifiedAmount);
    const remainingAmount = Number(data.remainingAmount);
    if (!Number.isFinite(verifiedAmount) || !Number.isFinite(remainingAmount)) {
        return null;
    }
    return { verifiedAmount, remainingAmount };
}

type BankProvider = "cbe" | "boa" | "telebirr" | "dashen" | "awash" | "cbebirr";

const BANK_OPTIONS: BankProvider[] = [
    "cbe",
    "telebirr",
    "dashen",
    "awash",
    "boa",
    "cbebirr",
];

function asBankProvider(value: string | null | undefined): BankProvider | null {
    if (!value) return null;
    return BANK_OPTIONS.includes(value as BankProvider)
        ? (value as BankProvider)
        : null;
}

export default function WaiterPaymentPanel({
    bill,
    tableSessionId,
}: {
    bill: Bill;
    tableSessionId: string;
}) {
    const t = useTranslations("waiter");
    const due = Number(bill.total) - Number(bill.amountPaid);
    const [tendered, setTendered] = useState(due.toFixed(2));
    const [reference, setReference] = useState("");
    const [bankProvider, setBankProvider] = useState<BankProvider>("cbe");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [accountSuffix, setAccountSuffix] = useState("");
    const [cameraFor, setCameraFor] = useState<"TELEBIRR" | "BANK" | null>(
        null,
    );
    const [showManual, setShowManual] = useState(false);
    const [error, setError] = useState("");
    const [payCash, { isLoading: payingCash }] = usePayCashMutation();
    const [payTransfer, { isLoading: payingTransfer }] =
        usePayTransferMutation();
    const [uploadReceipt, { isLoading: uploading }] =
        useUploadReceiptMutation();
    const [extractReceipt, { isLoading: extracting }] =
        useExtractReceiptMutation();

    const busy = payingCash || payingTransfer || uploading || extracting;
    const paid = bill.status === "PAID" || bill.status === "CLOSED";

    function openTransferCamera(channel: "TELEBIRR" | "BANK") {
        setError("");
        setCameraFor(channel);
    }

    async function collectCash() {
        setError("");
        try {
            await payCash({
                billId: bill.billId,
                tableSessionId,
                amount: due.toFixed(2),
                cashTendered: tendered,
                expectedBillVersion: bill.version,
            }).unwrap();
            toast.success(t("cashRecorded"), formatEtb(due));
        } catch (err) {
            const message = t("couldNotRecordCash");
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function collectTransfer(
        channel: "TELEBIRR" | "BANK",
        dataUrl: string,
    ) {
        setError("");
        try {
            const receiptFile = dataUrlToFile(
                dataUrl,
                `${channel.toLowerCase()}-receipt.jpg`,
            );

            let resolvedReference = "";
            let resolvedBank: BankProvider =
                channel === "TELEBIRR" ? "telebirr" : bankProvider;

            // Automatically extract reference number from photo via OCR
            toast.info(t("readingReceipt"));
            try {
                const extracted = await extractReceipt({
                    file: receiptFile,
                    transferChannel: channel,
                }).unwrap();
                if (extracted.reference && extracted.reference.length >= 4) {
                    resolvedReference = extracted.reference.trim();
                    setReference(resolvedReference);
                    const detected = asBankProvider(extracted.bankProvider);
                    if (channel === "TELEBIRR") {
                        resolvedBank = "telebirr";
                    } else if (detected && detected !== "telebirr") {
                        resolvedBank = detected;
                        setBankProvider(detected);
                    }
                    toast.info(
                        t("referenceExtracted", {
                            reference: resolvedReference,
                        }),
                    );
                }
            } catch (extractErr) {
                toast.fromUnknown(extractErr, t("couldNotReadReference"));
            }

            // Fallback to typed reference only if OCR couldn't read from photo
            if (!resolvedReference && reference.trim().length >= 4) {
                resolvedReference = reference.trim();
            }

            if (resolvedReference.length < 4) {
                setError(t("referenceRequired"));
                setShowManual(true);
                setCameraFor(null);
                return;
            }

            const uploaded = await uploadReceipt(receiptFile).unwrap();
            const result = await payTransfer({
                billId: bill.billId,
                tableSessionId,
                amount: due.toFixed(2),
                expectedBillVersion: bill.version,
                transferChannel: channel,
                fileId: uploaded.file.id,
                reference: resolvedReference,
                bankProvider: resolvedBank,
                accountSuffix:
                    channel === "BANK" && resolvedBank === "boa"
                        ? accountSuffix.trim() || undefined
                        : undefined,
                phoneNumber:
                    channel === "BANK" && resolvedBank === "cbebirr"
                        ? phoneNumber.trim() || undefined
                        : undefined,
            }).unwrap();
            setCameraFor(null);
            setReference("");
            if (result.tipAmount && Number(result.tipAmount) > 0) {
                toast.success(
                    t("transferPaidWithTip", {
                        tip: formatEtb(Number(result.tipAmount)),
                    }),
                    formatEtb(due),
                );
            } else {
                toast.success(
                    channel === "TELEBIRR"
                        ? t("telebirrRecorded")
                        : t("bankTransferRecorded"),
                    formatEtb(due),
                );
            }
        } catch (err) {
            const under = readTransferUnderDue(err);
            if (under) {
                const message = t("transferUnderDue", {
                    verified: formatEtb(under.verifiedAmount),
                    remaining: formatEtb(under.remainingAmount),
                });
                setError(message);
                toast.error(t("transferUnderDueTitle"), message);
                setCameraFor(null);
                return;
            }
            const message = t("couldNotSubmitTransfer");
            setError(message);
            toast.fromUnknown(err, message);
            setCameraFor(null);
        }
    }

    async function collectManualTransfer() {
        setError("");
        const resolvedRef = reference.trim();
        if (resolvedRef.length < 4) {
            setError(t("referenceRequired"));
            return;
        }

        try {
            const channel = bankProvider === "telebirr" ? "TELEBIRR" : "BANK";
            // Create a minimal synthetic slip for manual entry
            const canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, 400, 200);
                ctx.fillStyle = "#111827";
                ctx.font = "16px sans-serif";
                ctx.fillText(`Manual Reference: ${resolvedRef}`, 20, 50);
                ctx.fillText(`Bank: ${bankProvider.toUpperCase()}`, 20, 80);
                ctx.fillText(`Amount: ${due.toFixed(2)} ETB`, 20, 110);
            }
            const blob = await new Promise<Blob | null>(res =>
                canvas.toBlob(res, "image/jpeg", 0.7),
            );
            const manualFile = new File(
                [blob || new Uint8Array()],
                "manual-entry.jpg",
                { type: "image/jpeg" },
            );
            const uploaded = await uploadReceipt(manualFile).unwrap();

            const result = await payTransfer({
                billId: bill.billId,
                tableSessionId,
                amount: due.toFixed(2),
                expectedBillVersion: bill.version,
                transferChannel: channel,
                fileId: uploaded.file.id,
                reference: resolvedRef,
                bankProvider,
                accountSuffix:
                    channel === "BANK" && bankProvider === "boa"
                        ? accountSuffix.trim() || undefined
                        : undefined,
                phoneNumber:
                    channel === "BANK" && bankProvider === "cbebirr"
                        ? phoneNumber.trim() || undefined
                        : undefined,
            }).unwrap();

            setReference("");
            if (result.tipAmount && Number(result.tipAmount) > 0) {
                toast.success(
                    t("transferPaidWithTip", {
                        tip: formatEtb(Number(result.tipAmount)),
                    }),
                    formatEtb(due),
                );
            } else {
                toast.success(
                    channel === "TELEBIRR"
                        ? t("telebirrRecorded")
                        : t("bankTransferRecorded"),
                    formatEtb(due),
                );
            }
        } catch (err) {
            const under = readTransferUnderDue(err);
            if (under) {
                const message = t("transferUnderDue", {
                    verified: formatEtb(under.verifiedAmount),
                    remaining: formatEtb(under.remainingAmount),
                });
                setError(message);
                toast.error(t("transferUnderDueTitle"), message);
                return;
            }
            const message = t("couldNotSubmitTransfer");
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    if (paid) {
        return (
            <div className="rounded-[16px] border border-hairline bg-accent/50 p-4">
                <p className="text-[13px] font-medium text-accent-foreground">
                    {t("paid")}
                </p>
                <p className="mt-1 text-[14px] text-slate-gray">
                    {t("paidCanClose", {
                        amount: formatEtb(Number(bill.total)),
                    })}
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3 rounded-[16px] border border-hairline bg-card p-4">
                <div>
                    <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                        {t("collect")} · {bill.billNumber}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold">
                        {formatEtb(due)}
                    </p>
                </div>
                <div className="space-y-2">
                    <label className="text-[13px] text-slate-gray">
                        {t("cashTendered")}
                    </label>
                    <Input
                        value={tendered}
                        onChange={event => setTendered(event.target.value)}
                        inputMode="decimal"
                    />
                    <Button
                        className="h-11 w-full"
                        disabled={busy}
                        onClick={collectCash}
                    >
                        {payingCash
                            ? t("recording")
                            : t("collectCash", { amount: formatEtb(due) })}
                    </Button>
                </div>

                <div className="space-y-3 border-t border-hairline pt-3">
                    <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                        Digital / Transfer Verification
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="h-12 w-full gap-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[13px]"
                            disabled={busy}
                            onClick={() => openTransferCamera("TELEBIRR")}
                        >
                            <Camera className="h-4 w-4" />
                            {extracting && cameraFor === "TELEBIRR"
                                ? t("readingReceipt")
                                : "Scan Telebirr"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 w-full gap-2 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium text-[13px]"
                            disabled={busy}
                            onClick={() => openTransferCamera("BANK")}
                        >
                            <Camera className="h-4 w-4" />
                            {extracting && cameraFor === "BANK"
                                ? t("readingReceipt")
                                : "Scan Bank Slip"}
                        </Button>
                    </div>

                    {/* Manual Fallback Toggle */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowManual(prev => !prev)}
                            className="flex items-center gap-1.5 text-[12px] text-slate-gray hover:text-foreground"
                        >
                            {showManual ? (
                                <>
                                    <ChevronUp className="h-3.5 w-3.5" />
                                    Hide manual entry
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3.5 w-3.5" />
                                    Or enter reference manually
                                </>
                            )}
                        </button>

                        {showManual ? (
                            <div className="mt-3 space-y-2.5 rounded-lg border border-hairline bg-accent/20 p-3">
                                <div>
                                    <label className="text-[12px] text-slate-gray">
                                        {t("transferReference")}
                                    </label>
                                    <Input
                                        value={reference}
                                        onChange={event =>
                                            setReference(event.target.value)
                                        }
                                        placeholder="e.g. DIU19ZFMTL or FT..."
                                        autoCapitalize="characters"
                                    />
                                </div>
                                <div>
                                    <label className="text-[12px] text-slate-gray">
                                        {t("bankProvider")}
                                    </label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-[13px]"
                                        value={bankProvider}
                                        onChange={event =>
                                            setBankProvider(
                                                event.target
                                                    .value as BankProvider,
                                            )
                                        }
                                    >
                                        <option value="cbe">CBE</option>
                                        <option value="telebirr">
                                            Telebirr
                                        </option>
                                        <option value="dashen">Dashen</option>
                                        <option value="awash">Awash</option>
                                        <option value="boa">
                                            Bank of Abyssinia
                                        </option>
                                        <option value="cbebirr">
                                            CBE Birr
                                        </option>
                                    </select>
                                </div>
                                {bankProvider === "boa" ? (
                                    <Input
                                        value={accountSuffix}
                                        onChange={event =>
                                            setAccountSuffix(event.target.value)
                                        }
                                        placeholder={t("accountSuffixHint")}
                                        inputMode="numeric"
                                    />
                                ) : null}
                                {bankProvider === "cbebirr" ? (
                                    <Input
                                        value={phoneNumber}
                                        onChange={event =>
                                            setPhoneNumber(event.target.value)
                                        }
                                        placeholder={t("phoneHint")}
                                        inputMode="tel"
                                    />
                                ) : null}
                                <Button
                                    className="h-10 w-full text-[13px]"
                                    disabled={
                                        busy || reference.trim().length < 4
                                    }
                                    onClick={() => void collectManualTransfer()}
                                >
                                    {payingTransfer
                                        ? t("recording")
                                        : "Verify & Settle Transfer"}
                                </Button>
                            </div>
                        ) : null}
                    </div>

                    <p className="text-[11px] text-slate-gray">
                        {t("verifyBeforeSettle")}
                    </p>
                </div>
                {error ? (
                    <p className="text-[13px] text-red-600">{error}</p>
                ) : null}
            </div>
            {cameraFor ? (
                <CameraCapture
                    title={
                        cameraFor === "TELEBIRR"
                            ? t("telebirrReceipt")
                            : t("bankTransferReceipt")
                    }
                    isProcessing={busy}
                    onCancel={() => setCameraFor(null)}
                    onCapture={dataUrl => {
                        void collectTransfer(cameraFor, dataUrl);
                    }}
                />
            ) : null}
        </>
    );
}
