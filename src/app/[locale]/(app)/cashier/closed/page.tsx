"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Radio, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useCashierPaymentsQuery } from "@/context/services/billingApi";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const POLL_MS = 5000;

function methodLabel(method: string, channel: string | null) {
    const key = method.toUpperCase();
    if (key === "CASH") return "Cash";
    if ((channel || "").toUpperCase().includes("TELE")) return "Telebirr";
    if (key === "TRANSFER") return "Transfer";
    return method;
}

export default function CashierClosedPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isFetching, isError } = useCashierPaymentsQuery(
        undefined,
        { pollingInterval: POLL_MS },
    );
    const logged = useMemo(() => data?.data ?? [], [data?.data]);
    const totalPages = Math.max(1, Math.ceil(logged.length / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return logged.slice(start, start + PAGE_SIZE);
    }, [logged, page]);

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    eyebrow="Close"
                    title="Closed bills"
                    description="Closed tables from waiter collections. Reopen needs manager approval."
                    compact
                />
                <div
                    className={cn(
                        "inline-flex items-center gap-1.5 self-start rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate-gray",
                        isFetching && "opacity-80",
                    )}
                >
                    <Radio
                        className={cn(
                            "size-3",
                            isError ? "text-red-500" : "text-emerald-500",
                        )}
                    />
                    {isError ? "Offline" : "Live"}
                    {isFetching ? (
                        <RefreshCw className="size-3 animate-spin" />
                    ) : null}
                </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-hairline bg-card">
                {isLoading ? (
                    <p className="px-4 py-6 text-[12px] text-slate-gray sm:px-5">
                        Loading closed bills…
                    </p>
                ) : null}
                {isError ? (
                    <p className="px-4 py-6 text-[12px] text-red-600 sm:px-5">
                        Could not load closed bills.
                    </p>
                ) : null}
                {!isLoading && !isError && logged.length === 0 ? (
                    <p className="px-4 py-6 text-[12px] text-slate-gray sm:px-5">
                        No closed bills yet. They appear when a waiter collects
                        the total.
                    </p>
                ) : null}
                {!isLoading && !isError && logged.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] text-left text-[12px]">
                                <thead className="border-b border-hairline text-[10px] tracking-[0.08em] text-slate-gray uppercase">
                                    <tr>
                                        <th className="px-4 py-2.5 font-medium sm:px-5">
                                            Table
                                        </th>
                                        <th className="px-4 py-2.5 font-medium sm:px-5">
                                            Waiter
                                        </th>
                                        <th className="px-4 py-2.5 font-medium sm:px-5">
                                            Total
                                        </th>
                                        <th className="px-4 py-2.5 font-medium sm:px-5">
                                            Method
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map(payment => (
                                        <tr
                                            key={payment.paymentId}
                                            className="border-b border-hairline last:border-0"
                                        >
                                            <td className="px-4 py-2.5 font-medium sm:px-5">
                                                {payment.tableDisplayName}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-gray sm:px-5">
                                                {payment.waiterName}
                                            </td>
                                            <td className="px-4 py-2.5 tabular-nums sm:px-5">
                                                {formatEtb(
                                                    Number(payment.amount),
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 sm:px-5">
                                                <Badge className="rounded-full px-2 py-0 text-[10px] font-normal">
                                                    {methodLabel(
                                                        payment.method,
                                                        payment.transferChannel,
                                                    )}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 py-2.5 text-[11px] text-slate-gray sm:px-5">
                            <span>
                                Page {page} of {totalPages} · {logged.length}{" "}
                                total
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="h-7 gap-1 rounded-full px-2.5 text-[11px] font-normal"
                                >
                                    <ChevronLeft className="size-3.5" />
                                    Prev
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="h-7 gap-1 rounded-full px-2.5 text-[11px] font-normal"
                                >
                                    Next
                                    <ChevronRight className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </DashboardFrame>
    );
}
