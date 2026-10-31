"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { API_BASE_URL } from "@/context/env";
import { formatEtb } from "@/lib/money";
import { GoldenClocheLogo } from "@/components/common/GoldenClocheLogo";

type PublicReceipt = {
    billId: string;
    billNumber: string;
    status: string;
    currencyCode: string;
    restaurantName: string;
    branchName: string;
    address?: string | null;
    phone?: string | null;
    tableName: string | null;
    isVip?: boolean;
    subtotal: string;
    total: string;
    amountPaid: string;
    generatedAt: string;
    paidAt: string | null;
    lines: Array<{
        itemName: string;
        quantity: number;
        unitPrice: string;
        lineTotal: string;
    }>;
    payments: Array<{
        method: string;
        amount: string;
        channel: string | null;
        status: string;
    }>;
};

export default function PublicReceiptPage({
    params,
}: {
    params: Promise<{ billId: string }>;
}) {
    const { billId } = use(params);
    const [receipt, setReceipt] = useState<PublicReceipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `${API_BASE_URL}/public/receipts/${billId}`,
                    { cache: "no-store" },
                );
                if (!res.ok) {
                    throw new Error(
                        res.status === 404
                            ? "Receipt not found"
                            : "Could not load receipt",
                    );
                }
                const data = (await res.json()) as PublicReceipt;
                if (!cancelled) setReceipt(data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Could not load receipt",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [billId]);

    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center gap-2 bg-zinc-50 text-sm text-zinc-600">
                <Loader2 className="size-4 animate-spin" />
                Loading e-receipt…
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
                <XCircle className="size-10 text-rose-500" />
                <h1 className="text-xl font-semibold text-zinc-900">
                    Receipt not found
                </h1>
                <p className="max-w-sm text-sm text-zinc-600">
                    {error ||
                        "This receipt link is invalid or no longer available."}
                </p>
            </div>
        );
    }

    const total = Number(receipt.total || 0);
    const paid = Number(receipt.amountPaid || 0);
    const isPaid =
        receipt.status === "PAID" ||
        receipt.status === "CLOSED" ||
        paid >= total - 0.01;
    const generated = new Date(receipt.generatedAt).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="min-h-svh bg-zinc-100 px-4 py-8">
            <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4 text-center">
                    <h1 className="text-[18px] font-semibold tracking-tight text-zinc-900">
                        {receipt.restaurantName}
                    </h1>
                    
                    <p className="mt-0.5 text-[12px] text-zinc-500">
                        {receipt.branchName}
                        {receipt.tableName ? ` · ${receipt.tableName}` : ""}
                        {receipt.isVip ? " · VIP" : ""}
                    </p>
                    {receipt.address ? (
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                            {receipt.address}
                        </p>
                    ) : null}
                    {receipt.phone ? (
                        <p className="text-[11px] text-zinc-500">
                            Tel: {receipt.phone}
                        </p>
                    ) : null}

                </div>

                <div className="space-y-4 px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                                Receipt
                            </p>
                            <p className="font-mono text-[14px] font-semibold text-zinc-900">
                                #{receipt.billNumber}
                            </p>
                            <p className="mt-1 text-[12px] text-zinc-500">
                                {generated}
                            </p>
                        </div>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                isPaid
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                            }`}
                        >
                            {isPaid ? (
                                <CheckCircle2 className="size-3.5" />
                            ) : null}
                            {isPaid ? "Paid" : receipt.status}
                        </span>
                    </div>

                    <div className="divide-y divide-zinc-100 border-y border-zinc-100">
                        {receipt.lines.map((line, idx) => (
                            <div
                                key={`${line.itemName}-${idx}`}
                                className="flex items-start justify-between gap-3 py-2.5 text-[13px]"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-zinc-900">
                                        {line.itemName}
                                    </p>
                                    <p className="text-[11px] text-zinc-500">
                                        {line.quantity} ×{" "}
                                        {formatEtb(Number(line.unitPrice))}
                                    </p>
                                </div>
                                <p className="shrink-0 tabular-nums text-zinc-800">
                                    {formatEtb(Number(line.lineTotal))}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1.5 text-[13px]">
                        <div className="flex justify-between border-t border-zinc-200 pt-2 text-[15px] font-semibold text-zinc-950">
                            <span>Total</span>
                            <span className="tabular-nums">
                                {formatEtb(total)}
                            </span>
                        </div>
                        {paid > 0 ? (
                            <div className="flex justify-between text-zinc-500">
                                <span>Paid</span>
                                <span className="tabular-nums">
                                    {formatEtb(paid)}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    {receipt.payments.length > 0 ? (
                        <div className="rounded-xl bg-zinc-50 p-3">
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                                Payments
                            </p>
                            <ul className="space-y-1.5">
                                {receipt.payments.map((payment, idx) => (
                                    <li
                                        key={`${payment.method}-${idx}`}
                                        className="flex justify-between text-[12px] text-zinc-700"
                                    >
                                        <span>
                                            {payment.method}
                                            {payment.channel
                                                ? ` · ${payment.channel}`
                                                : ""}
                                        </span>
                                        <span className="tabular-nums">
                                            {formatEtb(Number(payment.amount))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-600 font-mono">
                            *** FOR INTERNAL USE ONLY ***
                        </p>
                        <p className="text-[11px] text-zinc-400">
                            Thank you for dining with us.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
