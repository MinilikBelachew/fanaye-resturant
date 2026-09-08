"use client";

import { useCashierPaymentsQuery } from "@/context/services/billingApi";
import { formatEtb } from "@/lib/money";

function methodLabel(method: string, channel: string | null) {
    if (method === "CASH") return "Cash";
    if (channel === "TELEBIRR") return "Telebirr";
    if (channel === "BANK") return "Bank transfer";
    return "Transfer";
}

export default function CashierPaymentsLog() {
    const { data, isLoading, isError } = useCashierPaymentsQuery(undefined, {
        pollingInterval: 5000,
    });
    const payments = data?.data ?? [];

    if (isLoading) {
        return <p className="text-slate-gray">Loading payments…</p>;
    }

    if (isError) {
        return <p className="text-red-600">Could not load payments.</p>;
    }

    if (payments.length === 0) {
        return (
            <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray">
                No waiter collections yet. When a waiter takes cash or logs a
                transfer receipt, it shows here.
            </p>
        );
    }

    return (
        <ul className="space-y-3">
            {payments.map(payment => (
                <li
                    key={payment.paymentId}
                    className="rounded-[16px] border border-hairline bg-card p-5"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[13px] text-slate-gray">
                                Table {payment.tableDisplayName} ·{" "}
                                {payment.waiterName}
                            </p>
                            <p className="text-[20px] font-semibold">
                                {formatEtb(Number(payment.amount))}
                            </p>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {methodLabel(
                                    payment.method,
                                    payment.transferChannel,
                                )}{" "}
                                · {payment.billNumber}
                                {payment.tableClosed
                                    ? " · table closed"
                                    : " · paid, table still open"}
                            </p>
                        </div>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-slate-gray">
                            Recorded
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
}
