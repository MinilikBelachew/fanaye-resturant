"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import KpiCard from "@/components/custom/organisms/KpiCard";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/context/hooks";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import {
    PAYMENT_METHOD_LABELS,
    type Payment,
} from "@/domains/payments/domain/payment";
import {
    selectLoggedPayments,
    selectPaymentTotals,
} from "@/domains/payments/application/selectors";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "cards";

function formatLoggedAt(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function waiterName(waiterId: string) {
    return DEMO_STAFF.find(person => person.id === waiterId)?.name ?? "Waiter";
}

export default function CashierPaymentsLog() {
    const payments = useAppSelector(selectLoggedPayments);
    const totals = useAppSelector(selectPaymentTotals);
    const [view, setView] = useState<ViewMode>("table");

    const columns: DataTableColumn<Payment>[] = useMemo(
        () => [
            {
                id: "table",
                header: "Table",
                sortValue: row => Number(row.tableNumber) || 0,
                cell: row => (
                    <span className="font-semibold">
                        Table {row.tableNumber}
                    </span>
                ),
            },
            {
                id: "waiter",
                header: "Waiter",
                sortValue: row => waiterName(row.waiterId),
                cell: row => waiterName(row.waiterId),
            },
            {
                id: "method",
                header: "Method",
                sortValue: row => PAYMENT_METHOD_LABELS[row.method],
                cell: row => (
                    <Badge variant="secondary">
                        {PAYMENT_METHOD_LABELS[row.method]}
                    </Badge>
                ),
            },
            {
                id: "amount",
                header: "Total",
                sortValue: row => row.amount,
                cell: row => (
                    <span className="font-semibold">
                        {formatEtb(row.amount)}
                    </span>
                ),
            },
            {
                id: "logged",
                header: "Logged",
                sortValue: row => row.confirmedAt ?? row.createdAt,
                cell: row =>
                    formatLoggedAt(row.confirmedAt ?? row.createdAt),
            },
        ],
        [],
    );

    const kpis: {
        label: string;
        value: string;
        hint: string;
        tone?: "brand";
        wave: "wave1" | "wave2" | "wave3" | "wave4";
    }[] = [
        {
            label: "Total logged",
            value: formatEtb(totals.total),
            hint: `${totals.count} payment${totals.count === 1 ? "" : "s"}`,
            tone: "brand",
            wave: "wave1",
        },
        {
            label: "Cash",
            value: formatEtb(totals.cash),
            hint: `${totals.cashCount} drop${totals.cashCount === 1 ? "" : "s"}`,
            wave: "wave2",
        },
        {
            label: "Telebirr",
            value: formatEtb(totals.telebirr),
            hint: `${totals.telebirrCount} transfer${totals.telebirrCount === 1 ? "" : "s"}`,
            wave: "wave3",
        },
        {
            label: "Bank transfer",
            value: formatEtb(totals.bank),
            hint: `${totals.bankCount} transfer${totals.bankCount === 1 ? "" : "s"}`,
            wave: "wave4",
        },
    ];

    return (
        <div className="space-y-5">
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map(kpi => (
                    <KpiCard
                        key={kpi.label}
                        label={kpi.label}
                        value={kpi.value}
                        hint={kpi.hint}
                        tone={kpi.tone}
                        sparkline={{ variant: kpi.wave }}
                    />
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-[16px] font-semibold">
                        All payments
                    </h2>
                    <p className="text-[13px] text-slate-gray">
                        Waiter collections log. Total is the bill — nothing to
                        confirm.
                    </p>
                </div>
                <div className="flex rounded-[12px] border border-hairline bg-card p-1">
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-medium",
                            view === "table"
                                ? "bg-secondary text-foreground"
                                : "text-slate-gray hover:bg-secondary/70",
                        )}
                        onClick={() => setView("table")}
                    >
                        <Table2 className="size-4" />
                        Table
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-medium",
                            view === "cards"
                                ? "bg-secondary text-foreground"
                                : "text-slate-gray hover:bg-secondary/70",
                        )}
                        onClick={() => setView("cards")}
                    >
                        <LayoutGrid className="size-4" />
                        Cards
                    </button>
                </div>
            </div>

            {view === "table" ? (
                <DataTable
                    columns={columns}
                    data={payments}
                    rowKey={row => row.id}
                    empty="No payments logged yet."
                    searchPlaceholder="Search table or waiter..."
                    searchText={row =>
                        `Table ${row.tableNumber} ${waiterName(row.waiterId)} ${PAYMENT_METHOD_LABELS[row.method]}`
                    }
                />
            ) : payments.length === 0 ? (
                <p className="rounded-[16px] border border-hairline bg-card p-6 text-slate-gray">
                    No payments logged yet.
                </p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {payments.map(payment => (
                        <article
                            key={payment.id}
                            className="rounded-[16px] border border-hairline bg-card p-4 shadow-subtle"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[12px] text-slate-gray">
                                        Table {payment.tableNumber}
                                    </p>
                                    <p className="text-[22px] font-semibold">
                                        {formatEtb(payment.amount)}
                                    </p>
                                </div>
                                <Badge>Logged</Badge>
                            </div>
                            <p className="mt-3 text-[13px]">
                                Waiter: {waiterName(payment.waiterId)}
                            </p>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {PAYMENT_METHOD_LABELS[payment.method]} ·{" "}
                                {formatLoggedAt(
                                    payment.confirmedAt ?? payment.createdAt,
                                )}
                            </p>
                            {payment.evidenceDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={payment.evidenceDataUrl}
                                    alt="Transfer receipt"
                                    className="mt-3 max-h-36 w-full rounded-[12px] object-cover"
                                />
                            ) : null}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
