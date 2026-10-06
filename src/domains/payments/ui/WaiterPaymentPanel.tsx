"use client";

import { useState } from "react";
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

            let resolvedReference = reference.trim();
            let resolvedBank: BankProvider =
                channel === "TELEBIRR" ? "telebirr" : bankProvider;

            // Prefer OCR when empty; typed reference always wins if already filled.
            if (resolvedReference.length < 4) {
                toast.info(t("readingReceipt"));
                try {
                    const extracted = await extractReceipt({
                        file: receiptFile,
                        transferChannel: channel,
                    }).unwrap();
                    if (
                        extracted.reference &&
                        extracted.reference.length >= 4
                    ) {
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
            }

            if (resolvedReference.length < 4) {
                setError(t("referenceRequired"));
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

                <div className="space-y-2 border-t border-hairline pt-3">
                    <label className="text-[13px] text-slate-gray">
                        {t("transferReference")}
                    </label>
                    <Input
                        value={reference}
                        onChange={event => setReference(event.target.value)}
                        placeholder={t("transferReferenceHint")}
                        autoCapitalize="characters"
                    />
                    <label className="text-[13px] text-slate-gray">
                        {t("bankProvider")}
                    </label>
                    <select
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-[14px]"
                        value={bankProvider}
                        onChange={event =>
                            setBankProvider(event.target.value as BankProvider)
                        }
                    >
                        <option value="cbe">CBE</option>
                        <option value="telebirr">Telebirr</option>
                        <option value="dashen">Dashen</option>
                        <option value="awash">Awash</option>
                        <option value="boa">Bank of Abyssinia</option>
                        <option value="cbebirr">CBE Birr</option>
                    </select>
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
                    <p className="text-[12px] text-slate-gray">
                        {t("verifyBeforeSettle")}
                    </p>
                </div>

                <Button
                    variant="outline"
                    className="h-11 w-full"
                    disabled={busy}
                    onClick={() => openTransferCamera("BANK")}
                >
                    {extracting ? t("readingReceipt") : t("bankTransferCamera")}
                </Button>
                <Button
                    variant="outline"
                    className="h-11 w-full"
                    disabled={busy}
                    onClick={() => openTransferCamera("TELEBIRR")}
                >
                    {extracting ? t("readingReceipt") : t("telebirrCamera")}
                </Button>
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
                    onCancel={() => setCameraFor(null)}
                    onCapture={dataUrl => {
                        void collectTransfer(cameraFor, dataUrl);
                    }}
                />
            ) : null}
        </>
    );
}
