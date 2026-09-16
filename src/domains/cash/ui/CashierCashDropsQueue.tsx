"use client";

import { useState } from "react";
import {
    useCashierCashDropsQuery,
    useReceiveCashDropMutation,
    useResolveCashDropDisputeMutation,
} from "@/context/services/cashApi";
import type { CashDrop } from "@/domains/cash/domain/cashApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    Calendar,
    RefreshCw,
    ReceiptText,
} from "lucide-react";
import CashDropReceiptModal from "./CashDropReceiptModal";

function DropCard({
    drop,
    onViewReceipt,
}: {
    drop: CashDrop;
    onViewReceipt: (drop: CashDrop) => void;
}) {
    const [counted, setCounted] = useState(drop.declaredAmount);
    const [error, setError] = useState("");
    const [receive, { isLoading: receiving }] = useReceiveCashDropMutation();
    const [resolve, { isLoading: resolving }] =
        useResolveCashDropDisputeMutation();

    async function onReceive() {
        setError("");
        try {
            await receive({
                cashDropId: drop.cashDropId,
                countedAmount: Number(counted).toFixed(2),
                expectedVersion: drop.version,
            }).unwrap();
        } catch {
            setError("Could not receive this drop. Refresh and try again.");
        }
    }

    async function onResolve(resolution: "ACCEPT_COUNTED" | "ACCEPT_DECLARED") {
        if (!drop.disputeId) return;
        setError("");
        try {
            await resolve({
                disputeId: drop.disputeId,
                resolution,
            }).unwrap();
        } catch {
            setError("Could not resolve the dispute.");
        }
    }

    return (
        <article className="rounded-[16px] border border-border/80 bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground">
                    {drop.waiterName ?? "Waiter"}
                </span>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={
                            drop.status === "DISPUTED"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                : "border-primary/30 bg-primary/10 text-primary"
                        }
                    >
                        {drop.status}
                    </Badge>
                </div>
            </div>
            <p className="mt-2 text-[22px] font-bold text-foreground">
                {formatEtb(Number(drop.declaredAmount))}
            </p>
            {drop.status === "INITIATED" ? (
                <div className="mt-3 space-y-2">
                    <label className="text-[12px] font-medium text-muted-foreground">
                        Counted amount in drawer
                    </label>
                    <div className="flex gap-2">
                        <Input
                            value={counted}
                            onChange={event => setCounted(event.target.value)}
                            inputMode="decimal"
                            className="font-mono text-base"
                        />
                        <Button disabled={receiving} onClick={onReceive}>
                            {receiving ? "Receiving…" : "Receive into drawer"}
                        </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Matching amount marks as Received. Different amount
                        triggers dispute flow.
                    </p>
                </div>
            ) : null}
            {drop.status === "DISPUTED" ? (
                <div className="mt-3 space-y-2">
                    <p className="text-[13px] text-muted-foreground">
                        Counted: {formatEtb(Number(drop.countedAmount ?? 0))}
                        {drop.variance
                            ? ` · Variance: ${formatEtb(Number(drop.variance))}`
                            : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            disabled={resolving}
                            onClick={() => {
                                void onResolve("ACCEPT_COUNTED");
                            }}
                        >
                            Accept counted
                        </Button>
                        <Button
                            variant="outline"
                            disabled={resolving}
                            onClick={() => {
                                void onResolve("ACCEPT_DECLARED");
                            }}
                        >
                            Accept declared
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewReceipt(drop)}
                            className="gap-1 text-xs"
                        >
                            <ReceiptText className="size-3.5" />
                            Voucher
                        </Button>
                    </div>
                </div>
            ) : null}
            {error ? (
                <p className="mt-2 text-[12px] text-destructive">{error}</p>
            ) : null}
        </article>
    );
}

export default function CashierCashDropsQueue() {
    const [dateFilter, setDateFilter] = useState<
        "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "ALL"
    >("TODAY");
    const [statusFilter, setStatusFilter] = useState<
        "ALL" | "RECEIVED" | "INITIATED" | "DISPUTED"
    >("ALL");
    const [selectedDropForReceipt, setSelectedDropForReceipt] =
        useState<CashDrop | null>(null);

    // 1. Pending Queue Query (real-time polling)
    const {
        data: pendingData,
        isLoading: loadingPending,
        refetch: refetchPending,
    } = useCashierCashDropsQuery(
        { status: "INITIATED,DISPUTED" },
        { pollingInterval: 4000 },
    );

    // 2. History Table Query
    const historyStatusParam = statusFilter === "ALL" ? "ALL" : statusFilter;
    const {
        data: historyData,
        isLoading: loadingHistory,
        isFetching: fetchingHistory,
        refetch: refetchHistory,
    } = useCashierCashDropsQuery(
        {
            status: historyStatusParam,
            dateFilter,
        },
        { pollingInterval: 6000 },
    );

    const pendingDrops = pendingData?.data ?? [];
    const historyDrops = historyData?.data ?? [];

    const totalCounted = historyDrops
        .filter(d => d.status === "RECEIVED" || d.status === "RESOLVED")
        .reduce(
            (sum, d) => sum + Number(d.countedAmount ?? d.declaredAmount ?? 0),
            0,
        );

    return (
        <div className="space-y-6">
            {/* Pending Inbox Section */}
            {pendingDrops.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 text-amber-500" />
                        <h3 className="text-[15px] font-semibold text-foreground">
                            Pending Cash Drops ({pendingDrops.length})
                        </h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {pendingDrops.map(drop => (
                            <DropCard
                                key={drop.cashDropId}
                                drop={drop}
                                onViewReceipt={setSelectedDropForReceipt}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Received Cash History & Filter Section */}
            <div className="rounded-[18px] border border-border/80 bg-card p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[17px] font-semibold text-foreground">
                            Received Cash Drops Ledger
                        </h3>
                        <p className="text-[13px] text-muted-foreground">
                            Verified cash custody turned in by waiters with
                            voucher slips
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                void refetchPending();
                                void refetchHistory();
                            }}
                            disabled={fetchingHistory}
                            className="gap-1.5 rounded-full text-xs"
                        >
                            <RefreshCw
                                className={`size-3.5 ${fetchingHistory ? "animate-spin" : ""}`}
                            />
                            <span>Refresh</span>
                        </Button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/50 py-3">
                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] font-medium text-muted-foreground mr-1 flex items-center gap-1">
                            <Calendar className="size-3.5" /> Date:
                        </span>
                        {(
                            [
                                { key: "TODAY", label: "Today" },
                                { key: "YESTERDAY", label: "Yesterday" },
                                { key: "LAST_7_DAYS", label: "Last 7 Days" },
                                { key: "ALL", label: "All Dates" },
                            ] as const
                        ).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setDateFilter(tab.key)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                    dateFilter === tab.key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] font-medium text-muted-foreground mr-1">
                            Status:
                        </span>
                        {(
                            [
                                { key: "ALL", label: "All" },
                                { key: "RECEIVED", label: "Received" },
                                { key: "DISPUTED", label: "Disputed" },
                                { key: "INITIATED", label: "Pending" },
                            ] as const
                        ).map(st => (
                            <button
                                key={st.key}
                                onClick={() => setStatusFilter(st.key)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                    statusFilter === st.key
                                        ? "bg-foreground text-background"
                                        : "bg-secondary text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Total Received Summary Badge */}
                <div className="flex items-center justify-between rounded-[12px] bg-secondary/50 px-4 py-3">
                    <span className="text-xs font-medium text-muted-foreground">
                        Total Counted Cash in Selected Period:
                    </span>
                    <span className="text-base font-bold text-foreground">
                        {formatEtb(totalCounted)}
                    </span>
                </div>

                {/* Drops History Table */}
                {loadingHistory ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                        Loading cash drops history…
                    </p>
                ) : historyDrops.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                        No cash drops found for this filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-border/60 text-xs font-medium text-muted-foreground">
                                    <th className="pb-2.5 pt-1 font-medium">
                                        Waiter
                                    </th>
                                    <th className="pb-2.5 pt-1 font-medium">
                                        Date & Time
                                    </th>
                                    <th className="pb-2.5 pt-1 font-medium text-right">
                                        Declared
                                    </th>
                                    <th className="pb-2.5 pt-1 font-medium text-right">
                                        Counted
                                    </th>
                                    <th className="pb-2.5 pt-1 font-medium text-right">
                                        Variance
                                    </th>
                                    <th className="pb-2.5 pt-1 font-medium text-center">
                                        Status
                                    </th>
                                    <th className="pb-2.5 pt-1 font-medium text-right">
                                        Voucher
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {historyDrops.map(drop => {
                                    const dateObj = drop.receivedAt
                                        ? new Date(drop.receivedAt)
                                        : drop.initiatedAt
                                          ? new Date(drop.initiatedAt)
                                          : null;
                                    const formattedTime = dateObj
                                        ? `${dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
                                        : "—";

                                    return (
                                        <tr
                                            key={drop.cashDropId}
                                            className="hover:bg-muted/40 transition-colors"
                                        >
                                            <td className="py-3 font-medium text-foreground">
                                                {drop.waiterName ?? "Waiter"}
                                            </td>
                                            <td className="py-3 text-muted-foreground font-mono text-xs">
                                                {formattedTime}
                                            </td>
                                            <td className="py-3 text-right font-mono text-muted-foreground">
                                                {formatEtb(
                                                    Number(drop.declaredAmount),
                                                )}
                                            </td>
                                            <td className="py-3 text-right font-mono font-semibold text-foreground">
                                                {drop.countedAmount
                                                    ? formatEtb(
                                                          Number(
                                                              drop.countedAmount,
                                                          ),
                                                      )
                                                    : formatEtb(
                                                          Number(
                                                              drop.declaredAmount,
                                                          ),
                                                      )}
                                            </td>
                                            <td className="py-3 text-right font-mono text-xs">
                                                {drop.variance ? (
                                                    <span className="text-amber-600 font-semibold">
                                                        {formatEtb(
                                                            Number(
                                                                drop.variance,
                                                            ),
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        drop.status ===
                                                            "RECEIVED" ||
                                                        drop.status ===
                                                            "RESOLVED"
                                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                                            : drop.status ===
                                                                "DISPUTED"
                                                              ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                                              : "border-primary/30 bg-primary/10 text-primary"
                                                    }
                                                >
                                                    {drop.status ===
                                                        "RECEIVED" && (
                                                        <CheckCircle2 className="size-3 mr-1 inline" />
                                                    )}
                                                    {drop.status ===
                                                        "DISPUTED" && (
                                                        <AlertTriangle className="size-3 mr-1 inline" />
                                                    )}
                                                    {drop.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedDropForReceipt(
                                                            drop,
                                                        )
                                                    }
                                                    className="h-8 gap-1 rounded-full px-2.5 text-xs text-primary hover:bg-primary/10"
                                                >
                                                    <ReceiptText className="size-3.5" />
                                                    <span>Receipt</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Receipt / Voucher Modal Preview */}
            <CashDropReceiptModal
                open={Boolean(selectedDropForReceipt)}
                onOpenChange={open => {
                    if (!open) setSelectedDropForReceipt(null);
                }}
                drop={selectedDropForReceipt}
            />
        </div>
    );
}
