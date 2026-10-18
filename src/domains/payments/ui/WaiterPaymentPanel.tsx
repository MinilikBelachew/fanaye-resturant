"use client";

import { useEffect, useState } from "react";
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

function clampMoney(value: string, max: number): string {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n > max) return max.toFixed(2);
    return n.toFixed(2);
}

export default function WaiterPaymentPanel({
    bill,
    tableSessionId,
}: {
    bill: Bill;
    tableSessionId: string;
}) {
    const t = useTranslations("waiter");
    const total = Number(bill.total);
    const paidSoFar = Number(bill.amountPaid);
    const due = Math.max(0, total - paidSoFar);
    const [amount, setAmount] = useState(due.toFixed(2));
    const [reference, setReference] = useState("");
    const [bankProvider, setBankProvider] = useState<BankProvider>("cbe");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [accountSuffix, setAccountSuffix] = useState("");
    const [cameraOpen, setCameraOpen] = useState(false);
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
    const paid = bill.status === "PAID" || bill.status === "CLOSED" || due <= 0;

    useEffect(() => {
        setAmount(due.toFixed(2));
    }, [due, bill.version]);

    async function collectCash() {
        setError("");
        const portion = clampMoney(amount, due);
        if (!portion) {
            setError(t("portionAmountRequired"));
            return;
        }
        try {
            const result = await payCash({
                billId: bill.billId,
                tableSessionId,
                amount: portion,
                cashTendered: portion,
                expectedBillVersion: bill.version,
            }).unwrap();
            const remaining = Number(result.remainingAmount ?? 0);
            if (remaining > 0) {
                toast.success(
                    t("partialCashRecorded"),
                    t("remainingDue", { amount: formatEtb(remaining) }),
                );
            } else {
                toast.success(t("cashRecorded"), formatEtb(Number(portion)));
            }
        } catch (err) {
            const message = t("couldNotRecordCash");
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function settleTransfer(args: {
        channel: "TELEBIRR" | "BANK";
        fileId: string;
        reference: string;
        bank: BankProvider;
        portion: string;
    }) {
        const result = await payTransfer({
            billId: bill.billId,
            tableSessionId,
            amount: args.portion,
            expectedBillVersion: bill.version,
            transferChannel: args.channel,
            fileId: args.fileId,
            reference: args.reference,
            bankProvider: args.bank,
            accountSuffix:
                args.channel === "BANK" && args.bank === "boa"
                    ? accountSuffix.trim() || undefined
                    : undefined,
            phoneNumber:
                args.channel === "BANK" && args.bank === "cbebirr"
                    ? phoneNumber.trim() || undefined
                    : undefined,
        }).unwrap();

        setReference("");
        const remaining = Number(result.remainingAmount ?? 0);
        if (result.tipAmount && Number(result.tipAmount) > 0) {
            toast.success(
                t("transferPaidWithTip", {
                    tip: formatEtb(Number(result.tipAmount)),
                }),
                remaining > 0
                    ? t("remainingDue", { amount: formatEtb(remaining) })
                    : formatEtb(Number(args.portion)),
            );
        } else if (remaining > 0) {
            toast.success(
                args.channel === "TELEBIRR"
                    ? t("telebirrRecorded")
                    : t("bankTransferRecorded"),
                t("remainingDue", { amount: formatEtb(remaining) }),
            );
        } else {
            toast.success(
                args.channel === "TELEBIRR"
                    ? t("telebirrRecorded")
                    : t("bankTransferRecorded"),
                formatEtb(Number(args.portion)),
            );
        }
    }

    async function collectTransfer(dataUrl: string) {
        setError("");
        const portion = clampMoney(amount, due);
        if (!portion) {
            setError(t("portionAmountRequired"));
            setCameraOpen(false);
            return;
        }
        try {
            const receiptFile = dataUrlToFile(dataUrl, "transfer-receipt.jpg");

            let resolvedReference = "";
            let resolvedBank: BankProvider = bankProvider;

            toast.info(t("readingReceipt"));
            try {
                const extracted = await extractReceipt({
                    file: receiptFile,
                }).unwrap();
                if (extracted.reference && extracted.reference.length >= 4) {
                    resolvedReference = extracted.reference.trim();
                    setReference(resolvedReference);
                }
                const detected = asBankProvider(extracted.bankProvider);
                if (detected) {
                    resolvedBank = detected;
                    setBankProvider(detected);
                }
                if (resolvedReference) {
                    toast.info(
                        t("referenceExtracted", {
                            reference: resolvedReference,
                        }),
                    );
                }
            } catch (extractErr) {
                toast.fromUnknown(extractErr, t("couldNotReadReference"));
            }

            if (!resolvedReference && reference.trim().length >= 4) {
                resolvedReference = reference.trim();
            }

            if (resolvedReference.length < 4) {
                setError(t("referenceRequired"));
                setShowManual(true);
                setCameraOpen(false);
                return;
            }

            const channel: "TELEBIRR" | "BANK" =
                resolvedBank === "telebirr" ? "TELEBIRR" : "BANK";

            const uploaded = await uploadReceipt(receiptFile).unwrap();
            await settleTransfer({
                channel,
                fileId: uploaded.file.id,
                reference: resolvedReference,
                bank: resolvedBank,
                portion,
            });
            setCameraOpen(false);
        } catch (err) {
            const under = readTransferUnderDue(err);
            if (under) {
                const message = t("transferUnderClaimed", {
                    verified: formatEtb(under.verifiedAmount),
                    short: formatEtb(under.remainingAmount),
                });
                setError(message);
                toast.error(t("transferUnderDueTitle"), message);
                setCameraOpen(false);
                return;
            }
            const message = t("couldNotSubmitTransfer");
            setError(message);
            toast.fromUnknown(err, message);
            setCameraOpen(false);
        }
    }

    async function collectManualTransfer() {
        setError("");
        const portion = clampMoney(amount, due);
        if (!portion) {
            setError(t("portionAmountRequired"));
            return;
        }
        const resolvedRef = reference.trim();
        if (resolvedRef.length < 4) {
            setError(t("referenceRequired"));
            return;
        }

        try {
            const channel = bankProvider === "telebirr" ? "TELEBIRR" : "BANK";
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
                ctx.fillText(`Amount: ${portion} ETB`, 20, 110);
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
            await settleTransfer({
                channel,
                fileId: uploaded.file.id,
                reference: resolvedRef,
                bank: bankProvider,
                portion,
            });
        } catch (err) {
            const under = readTransferUnderDue(err);
            if (under) {
                const message = t("transferUnderClaimed", {
                    verified: formatEtb(under.verifiedAmount),
                    short: formatEtb(under.remainingAmount),
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
                        amount: formatEtb(total),
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
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
                        <div className="rounded-xl border border-hairline bg-secondary/30 px-3 py-2">
                            <p className="text-[11px] text-slate-gray">
                                {t("paidSoFar")}
                            </p>
                            <p className="font-semibold">
                                {formatEtb(paidSoFar)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-hairline bg-secondary/30 px-3 py-2">
                            <p className="text-[11px] text-slate-gray">
                                {t("remainingLabel")}
                            </p>
                            <p className="font-semibold">{formatEtb(due)}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[13px] text-slate-gray">
                        {t("payAmountNow")}
                    </label>
                    <Input
                        value={amount}
                        onChange={event => setAmount(event.target.value)}
                        inputMode="decimal"
                    />
                    <Button
                        className="h-11 w-full"
                        disabled={busy}
                        onClick={() => void collectCash()}
                    >
                        {payingCash
                            ? t("recording")
                            : t("collectCash", {
                                  amount: formatEtb(Number(amount) || 0),
                              })}
                    </Button>
                </div>

                <div className="space-y-3 border-t border-hairline pt-3">
                    <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                        Digital / Transfer Verification
                    </p>
                    <Button
                        variant="outline"
                        className="h-12 w-full gap-2 border-foreground/15 bg-secondary/40 hover:bg-secondary/70 font-medium text-[13px]"
                        disabled={busy}
                        onClick={() => {
                            setError("");
                            setCameraOpen(true);
                        }}
                    >
                        <Camera className="h-4 w-4" />
                        {extracting ? t("readingReceipt") : t("scanReceipt")}
                    </Button>

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
                        {t("verifySplitHint")}
                    </p>
                </div>
                {error ? (
                    <p className="text-[13px] text-red-600">{error}</p>
                ) : null}
            </div>
            {cameraOpen ? (
                <CameraCapture
                    title={t("scanReceipt")}
                    isProcessing={busy}
                    onCancel={() => setCameraOpen(false)}
                    onCapture={dataUrl => {
                        void collectTransfer(dataUrl);
                    }}
                />
            ) : null}
        </>
    );
}
