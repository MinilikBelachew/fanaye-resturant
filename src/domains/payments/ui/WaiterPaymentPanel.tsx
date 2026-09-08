"use client";

import { useState } from "react";
import {
    usePayCashMutation,
    usePayTransferMutation,
    useUploadReceiptMutation,
} from "@/context/services/billingApi";
import type { Bill } from "@/domains/billing/domain/billingApi";
import CameraCapture from "@/domains/payments/ui/CameraCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";

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

export default function WaiterPaymentPanel({
    bill,
    tableSessionId,
}: {
    bill: Bill;
    tableSessionId: string;
}) {
    const due = Number(bill.total) - Number(bill.amountPaid);
    const [tendered, setTendered] = useState(due.toFixed(2));
    const [cameraFor, setCameraFor] = useState<"TELEBIRR" | "BANK" | null>(
        null,
    );
    const [error, setError] = useState("");
    const [payCash, { isLoading: payingCash }] = usePayCashMutation();
    const [payTransfer, { isLoading: payingTransfer }] =
        usePayTransferMutation();
    const [uploadReceipt, { isLoading: uploading }] =
        useUploadReceiptMutation();

    const busy = payingCash || payingTransfer || uploading;
    const paid = bill.status === "PAID" || bill.status === "CLOSED";

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
        } catch {
            setError("Could not record cash. Check tendered amount and try again.");
        }
    }

    async function collectTransfer(
        channel: "TELEBIRR" | "BANK",
        dataUrl: string,
    ) {
        setError("");
        try {
            const uploaded = await uploadReceipt(
                dataUrlToFile(dataUrl, `${channel.toLowerCase()}-receipt.jpg`),
            ).unwrap();
            await payTransfer({
                billId: bill.billId,
                tableSessionId,
                amount: due.toFixed(2),
                expectedBillVersion: bill.version,
                transferChannel: channel,
                fileId: uploaded.file.id,
            }).unwrap();
            setCameraFor(null);
        } catch {
            setError(
                "Could not submit the transfer receipt. Check the photo and try again.",
            );
        }
    }

    if (paid) {
        return (
            <div className="rounded-[16px] border border-hairline bg-accent/50 p-4">
                <p className="text-[13px] font-medium text-accent-foreground">
                    Paid
                </p>
                <p className="mt-1 text-[14px] text-slate-gray">
                    {formatEtb(Number(bill.total))} · you can close this table.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3 rounded-[16px] border border-hairline bg-card p-4">
                <div>
                    <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                        Collect · {bill.billNumber}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold">
                        {formatEtb(due)}
                    </p>
                </div>
                <div className="space-y-2">
                    <label className="text-[13px] text-slate-gray">
                        Cash tendered
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
                            ? "Recording…"
                            : `Collect cash · ${formatEtb(due)}`}
                    </Button>
                </div>
                <Button
                    variant="outline"
                    className="h-11 w-full"
                    disabled={busy}
                    onClick={() => setCameraFor("BANK")}
                >
                    Bank transfer · camera
                </Button>
                <Button
                    variant="outline"
                    className="h-11 w-full"
                    disabled={busy}
                    onClick={() => setCameraFor("TELEBIRR")}
                >
                    Telebirr · camera
                </Button>
                {error ? (
                    <p className="text-[13px] text-red-600">{error}</p>
                ) : null}
            </div>
            {cameraFor ? (
                <CameraCapture
                    title={
                        cameraFor === "TELEBIRR"
                            ? "Telebirr receipt"
                            : "Bank transfer receipt"
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
