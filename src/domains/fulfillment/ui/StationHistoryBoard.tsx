"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flame,
    History,
    RefreshCw,
    Search,
    XCircle,
} from "lucide-react";
import {
    useMarkItemReadyMutation,
    useStartPreparationMutation,
    useStationHistoryQuery,
    type StationHistoryItem,
    type StationHistoryPeriod,
} from "@/context/services/stationsApi";
import { useCurrentStationQueue } from "@/domains/fulfillment/application/useCurrentStationQueue";
import {
    isQuickServeWorkflow,
    stationStateLabel,
} from "@/domains/fulfillment/domain/stationTicket";
import type { StationRole } from "@/domains/identity/domain/role";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { useAppSelector } from "@/context/hooks";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const PERIOD_OPTIONS: Array<{ key: StationHistoryPeriod; label: string }> = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "Last 7 days" },
    { key: "month", label: "Last 30 days" },
    { key: "all", label: "All time" },
    { key: "custom", label: "Custom" },
];

const STATE_OPTIONS: Array<{ key: string; label: string }> = [
    { key: "", label: "All statuses" },
    { key: "MISSED", label: "Missed (Closed table)" },
    { key: "UNFINISHED", label: "Unfinished" },
    { key: "QUEUED", label: "New" },
    { key: "IN_PREPARATION", label: "In progress" },
    { key: "READY", label: "Ready" },
    { key: "SERVED", label: "Served" },
    { key: "CANCELLED", label: "Cancelled" },
];

const ACTIVE_STATES = new Set(["QUEUED", "ACKNOWLEDGED", "IN_PREPARATION"]);

function todayYmd() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDateTime(iso?: string | null) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

function stateBadgeClass(state: string, seatingClosed: boolean) {
    if (state === "SERVED") {
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    }
    if (state === "READY") {
        return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
    }
    if (state === "CANCELLED" || state === "CANNOT_PREPARE") {
        return "bg-destructive-soft text-destructive border-destructive/30";
    }
    if (seatingClosed && ACTIVE_STATES.has(state)) {
        return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40";
    }
    if (state === "IN_PREPARATION") {
        return "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30";
    }
    return "bg-secondary text-foreground border-hairline";
}

function RowStatusActions({
    item,
    workflowMode,
    compact = false,
}: {
    item: StationHistoryItem;
    workflowMode?: string;
    compact?: boolean;
}) {
    const [startPrep, { isLoading: starting }] = useStartPreparationMutation();
    const [markReady, { isLoading: readying }] = useMarkItemReadyMutation();
    const busy = starting || readying;

    if (!ACTIVE_STATES.has(item.state)) {
        const doneTime =
            item.state === "SERVED"
                ? formatDateTime(item.servedAt ?? item.readyAt)
                : item.state === "READY"
                  ? formatDateTime(item.readyAt)
                  : null;
        return (
            <span className="text-[12px] text-slate-gray">
                {doneTime
                    ? `${stationStateLabel(item.state)} · ${doneTime}`
                    : stationStateLabel(item.state)}
            </span>
        );
    }

    const quickServe = isQuickServeWorkflow(workflowMode);
    const canMarkReadyDirectly =
        quickServe || item.seatingClosed || item.state === "IN_PREPARATION";

    async function handleStart() {
        try {
            await startPrep({
                orderItemId: item.id,
                expectedVersion: item.version,
            }).unwrap();
            toast.success("Marked in progress", item.itemName);
        } catch (err) {
            toast.fromUnknown(err, "Could not update order status.");
        }
    }

    async function handleReady() {
        try {
            await markReady({
                orderItemId: item.id,
                expectedVersion: item.version,
            }).unwrap();
            toast.success("Marked ready", item.itemName);
        } catch (err) {
            toast.fromUnknown(err, "Could not mark order ready.");
        }
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2",
                compact ? "flex-wrap" : "justify-end",
            )}
        >
            {!item.seatingClosed &&
                !quickServe &&
                item.state !== "IN_PREPARATION" && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void handleStart()}
                        className={cn(
                            "cursor-pointer border-hairline text-[12px]",
                            compact ? "h-9 flex-1 sm:flex-none" : "h-8 px-2.5",
                        )}
                    >
                        <Flame className="size-3.5 mr-1 text-orange-500" />
                        Start prep
                    </Button>
                )}
            {canMarkReadyDirectly && (
                <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void handleReady()}
                    className={cn(
                        "cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 text-[12px]",
                        compact ? "h-9 flex-1 sm:flex-none" : "h-8 px-3",
                    )}
                >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    Mark Ready
                </Button>
            )}
        </div>
    );
}

export default function StationHistoryBoard({ role }: { role: StationRole }) {
    const home = homePathForRole(role);
    const sessionStationName = useAppSelector(
        state => state.identity.session?.stationName,
    );
    const { stationId } = useCurrentStationQueue(role);

    const [period, setPeriod] = useState<StationHistoryPeriod>("today");
    const [fromDate, setFromDate] = useState<string>(todayYmd);
    const [toDate, setToDate] = useState<string>(todayYmd);
    const [stateFilter, setStateFilter] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);

    const queryParams = useMemo(
        () => ({
            stationId: stationId ?? "",
            period,
            ...(period === "custom" ? { fromDate, toDate } : {}),
            ...(stateFilter ? { state: stateFilter } : {}),
            ...(search.trim() ? { q: search.trim() } : {}),
            page,
            limit: 25,
        }),
        [stationId, period, fromDate, toDate, stateFilter, search, page],
    );

    const { data, isLoading, isFetching, refetch } = useStationHistoryQuery(
        queryParams,
        {
            skip: !stationId,
            refetchOnFocus: true,
        },
    );

    const items = data?.data ?? [];
    const summary = data?.summary;
    const pagination = data?.pagination;
    const workflowMode = data?.workflowMode;
    const stationName = data?.stationName ?? sessionStationName ?? "Station";

    function selectPeriod(next: StationHistoryPeriod) {
        setPeriod(next);
        setPage(1);
    }

    function selectState(next: string) {
        setStateFilter(next);
        setPage(1);
    }

    if (!stationId) {
        return (
            <div className="rounded-[16px] border border-hairline bg-card p-8 text-center">
                <History className="mx-auto size-8 text-slate-gray/60" />
                <p className="mt-2 text-[14px] font-medium text-foreground">
                    No station assigned
                </p>
                <p className="mt-1 text-[12px] text-slate-gray">
                    Assign a station to this account to view order history.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] tracking-[0.08em] text-steel-gray uppercase sm:text-[12px]">
                        {stationName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-[18px] font-normal sm:text-[22px]">
                            Order History
                        </h1>
                        {data?.periodLabel && (
                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-slate-gray">
                                {data.periodLabel}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="h-9 px-2.5 sm:px-3 text-[12px] border-hairline cursor-pointer"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5 sm:mr-1.5",
                                isFetching && "animate-spin",
                            )}
                        />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5 sm:px-3 text-[12px] border-hairline"
                    >
                        <Link href={home}>
                            <ArrowLeft className="size-3.5 mr-1.5" />
                            <span>Live Queue</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Missed closed-table banner */}
            {(summary?.missedClosed ?? 0) > 0 && stateFilter !== "MISSED" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-950 dark:text-amber-200">
                    <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                            <strong>{summary?.missedClosed} order(s)</strong>{" "}
                            had their table closed without a status update. You
                            can mark them Ready below.
                        </span>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => selectState("MISSED")}
                        className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-medium cursor-pointer"
                    >
                        Show missed ({summary?.missedClosed})
                    </Button>
                </div>
            )}

            {/* Date Filter Pills (scrollable on phone/tablet) */}
            <div className="space-y-2">
                <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 sm:gap-2">
                    <Calendar className="size-4 shrink-0 text-slate-gray mr-0.5" />
                    {PERIOD_OPTIONS.map(opt => {
                        const active = period === opt.key;
                        return (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => selectPeriod(opt.key)}
                                className={cn(
                                    "shrink-0 rounded-[12px] border px-3 py-1.5 text-[12px] sm:text-[13px] font-medium transition-colors cursor-pointer",
                                    active
                                        ? "border-brand/70 bg-brand-soft text-foreground ring-1 ring-brand/30"
                                        : "border-hairline bg-card text-slate-gray hover:text-foreground hover:bg-secondary/60",
                                )}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                {period === "custom" && (
                    <div className="grid grid-cols-1 gap-2 rounded-[14px] border border-hairline bg-card p-3 sm:grid-cols-2 sm:max-w-md">
                        <label className="space-y-1 text-[11px] font-medium text-slate-gray">
                            <span>From date</span>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={e => {
                                    setFromDate(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 text-[13px]"
                            />
                        </label>
                        <label className="space-y-1 text-[11px] font-medium text-slate-gray">
                            <span>To date</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={e => {
                                    setToDate(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 text-[13px]"
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* Summary KPI Cards — 2x2 on phone/tablet, 4-across on desktop */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                <button
                    type="button"
                    onClick={() => selectState("")}
                    className={cn(
                        "rounded-[14px] border p-3 text-left transition-all cursor-pointer",
                        stateFilter === ""
                            ? "border-brand/60 bg-brand-soft/60"
                            : "border-hairline bg-card hover:bg-secondary/40",
                    )}
                >
                    <p className="text-[11px] text-slate-gray">Total orders</p>
                    <p className="mt-1 text-[20px] sm:text-[22px] font-medium text-foreground">
                        {summary?.total ?? 0}
                    </p>
                </button>
                <button
                    type="button"
                    onClick={() => selectState("SERVED")}
                    className={cn(
                        "rounded-[14px] border p-3 text-left transition-all cursor-pointer",
                        stateFilter === "SERVED" || stateFilter === "READY"
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-hairline bg-card hover:bg-secondary/40",
                    )}
                >
                    <p className="text-[11px] text-slate-gray">
                        Ready / Served
                    </p>
                    <p className="mt-1 text-[20px] sm:text-[22px] font-medium text-emerald-700 dark:text-emerald-400">
                        {summary?.completed ?? 0}
                    </p>
                </button>
                <button
                    type="button"
                    onClick={() =>
                        selectState(
                            (summary?.missedClosed ?? 0) > 0
                                ? "MISSED"
                                : "UNFINISHED",
                        )
                    }
                    className={cn(
                        "rounded-[14px] border p-3 text-left transition-all cursor-pointer",
                        stateFilter === "MISSED" || stateFilter === "UNFINISHED"
                            ? "border-amber-500/70 bg-amber-500/15"
                            : (summary?.missedClosed ?? 0) > 0
                              ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                              : "border-hairline bg-card hover:bg-secondary/40",
                    )}
                >
                    <p className="text-[11px] text-slate-gray">
                        Needs status
                        {(summary?.missedClosed ?? 0) > 0
                            ? ` (${summary?.missedClosed} closed)`
                            : ""}
                    </p>
                    <p
                        className={cn(
                            "mt-1 text-[20px] sm:text-[22px] font-medium",
                            (summary?.unfinished ?? 0) > 0
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-foreground",
                        )}
                    >
                        {summary?.unfinished ?? 0}
                    </p>
                </button>
                <button
                    type="button"
                    onClick={() => selectState("CANCELLED")}
                    className={cn(
                        "rounded-[14px] border p-3 text-left transition-all cursor-pointer",
                        stateFilter === "CANCELLED"
                            ? "border-destructive/60 bg-destructive-soft/60"
                            : "border-hairline bg-card hover:bg-secondary/40",
                    )}
                >
                    <p className="text-[11px] text-slate-gray">Cancelled</p>
                    <p className="mt-1 text-[20px] sm:text-[22px] font-medium text-slate-gray">
                        {summary?.cancelled ?? 0}
                    </p>
                </button>
            </div>

            {/* Search + Status Filter Pills */}
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                    <Input
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search dish, table, waiter…"
                        className="h-9 pl-9 text-[13px]"
                    />
                </div>
                <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0">
                    {STATE_OPTIONS.map(opt => {
                        const active = stateFilter === opt.key;
                        return (
                            <button
                                key={opt.key || "all"}
                                type="button"
                                onClick={() => selectState(opt.key)}
                                className={cn(
                                    "shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer",
                                    active
                                        ? "border-transparent bg-accent text-accent-foreground"
                                        : "border-hairline bg-card text-slate-gray hover:text-foreground",
                                )}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-2.5">
                    {[1, 2, 3, 4].map(n => (
                        <div
                            key={n}
                            className="h-20 animate-pulse rounded-[14px] border border-hairline bg-card/60"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card p-10 text-center">
                    <XCircle className="mx-auto size-7 text-slate-gray/50" />
                    <p className="mt-2 text-[14px] font-medium text-foreground">
                        No orders found
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Try changing the date range or status filter.
                    </p>
                </div>
            ) : (
                <>
                    {/* Phone & Tablet Card List (< lg) */}
                    <div className="space-y-2.5 lg:hidden">
                        {items.map(item => (
                            <div
                                key={item.id}
                                className={cn(
                                    "rounded-[14px] border bg-card p-3.5 space-y-2.5",
                                    item.seatingClosed &&
                                        ACTIVE_STATES.has(item.state)
                                        ? "border-amber-500/45 bg-amber-500/[0.03]"
                                        : "border-hairline",
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-medium text-foreground leading-snug">
                                            <span className="mr-1.5 font-semibold text-brand">
                                                {item.quantity}×
                                            </span>
                                            {item.itemName}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-gray">
                                            <span className="font-medium text-foreground/85">
                                                {item.tableDisplayName}
                                            </span>
                                            {item.seatingClosed && (
                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-slate-gray">
                                                    Table closed
                                                </span>
                                            )}
                                            {item.waiterName && (
                                                <span>· {item.waiterName}</span>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                            stateBadgeClass(
                                                item.state,
                                                item.seatingClosed,
                                            ),
                                        )}
                                    >
                                        {stationStateLabel(item.state)}
                                    </Badge>
                                </div>

                                {item.specialInstruction && (
                                    <p className="rounded-lg bg-secondary/60 px-2.5 py-1.5 text-[12px] text-slate-gray">
                                        Note: {item.specialInstruction}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline/70 pt-2.5 text-[11px] text-slate-gray">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="size-3.5" />
                                        <span>
                                            {item.businessDate} ·{" "}
                                            {formatDateTime(item.confirmedAt)}
                                        </span>
                                    </div>
                                    {!ACTIVE_STATES.has(item.state) && (
                                        <RowStatusActions
                                            item={item}
                                            workflowMode={workflowMode}
                                            compact
                                        />
                                    )}
                                </div>

                                {ACTIVE_STATES.has(item.state) && (
                                    <RowStatusActions
                                        item={item}
                                        workflowMode={workflowMode}
                                        compact
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table (lg+) */}
                    <div className="hidden lg:block overflow-x-auto rounded-[16px] border border-hairline bg-card">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-hairline bg-secondary/40 text-[11px] uppercase tracking-wider text-slate-gray">
                                    <th className="px-4 py-3 font-medium">
                                        Date & Time
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Table / Room
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Waiter
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {items.map(item => (
                                    <tr
                                        key={item.id}
                                        className={cn(
                                            "transition-colors hover:bg-secondary/30",
                                            item.seatingClosed &&
                                                ACTIVE_STATES.has(item.state) &&
                                                "bg-amber-500/[0.04]",
                                        )}
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-slate-gray">
                                            <div className="font-medium text-foreground">
                                                {formatDateTime(
                                                    item.confirmedAt,
                                                )}
                                            </div>
                                            <div className="text-[11px]">
                                                {item.businessDate}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="font-medium text-foreground">
                                                    {item.tableDisplayName}
                                                </span>
                                                {item.seatingClosed && (
                                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-slate-gray">
                                                        Closed
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">
                                                <span className="mr-1.5 font-semibold text-brand">
                                                    {item.quantity}×
                                                </span>
                                                {item.itemName}
                                            </div>
                                            {item.specialInstruction && (
                                                <div className="mt-0.5 text-[11px] text-slate-gray">
                                                    {item.specialInstruction}
                                                </div>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-slate-gray">
                                            {item.waiterName ?? "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                                    stateBadgeClass(
                                                        item.state,
                                                        item.seatingClosed,
                                                    ),
                                                )}
                                            >
                                                {stationStateLabel(item.state)}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            <RowStatusActions
                                                item={item}
                                                workflowMode={workflowMode}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[12px] text-slate-gray">
                            <span>
                                Page {pagination.page} of{" "}
                                {pagination.totalPages} ({pagination.total}{" "}
                                items)
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() =>
                                        setPage(p => Math.max(1, p - 1))
                                    }
                                    className="h-9 px-3 border-hairline cursor-pointer"
                                >
                                    <ChevronLeft className="size-4 mr-1" />
                                    Prev
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        pagination.page >= pagination.totalPages
                                    }
                                    onClick={() =>
                                        setPage(p =>
                                            Math.min(
                                                pagination.totalPages,
                                                p + 1,
                                            ),
                                        )
                                    }
                                    className="h-9 px-3 border-hairline cursor-pointer"
                                >
                                    Next
                                    <ChevronRight className="size-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
