"use client";

import { use, useMemo, useState } from "react";
import {
    ArrowLeft,
    Clock,
    Loader2,
    RefreshCw,
    Ticket,
    UserRound,
    UtensilsCrossed,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import DataTable, {
    type DataTableColumn,
    type DataTablePagination,
} from "@/components/custom/organisms/DataTable";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useStationDetailQuery,
    useStationHistoryQuery,
    useUpdateStationMutation,
    type StationHistoryItem,
    type StationHistoryPeriod,
} from "@/context/services/stationsApi";
import { openEditStation } from "@/context/slices/stationSlice";
import { useAppDispatch } from "@/context/hooks";
import AddEditStationSheet from "@/domains/fulfillment/ui/AddEditStationSheet";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const PERIODS: StationHistoryPeriod[] = [
    "today",
    "week",
    "month",
    "quarter",
    "year",
    "custom",
];

const STATE_FILTERS = [
    "all",
    "QUEUED",
    "ACKNOWLEDGED",
    "IN_PREPARATION",
    "READY",
    "SERVED",
    "CANCELLED",
    "CANNOT_PREPARE",
] as const;

const POLL_MS = 8000;

function stateTone(
    state: string,
): "secondary" | "warning" | "success" | "danger" {
    switch (state) {
        case "QUEUED":
            return "secondary";
        case "ACKNOWLEDGED":
        case "IN_PREPARATION":
            return "warning";
        case "READY":
        case "SERVED":
            return "success";
        case "CANCELLED":
        case "CANNOT_PREPARE":
            return "danger";
        default:
            return "secondary";
    }
}

export default function ManagerStationDetailPage({
    params,
}: {
    params: Promise<{ stationId: string }>;
}) {
    const { stationId } = use(params);
    const t = useTranslations("managerStations");
    const tManager = useTranslations("manager");
    const tCommon = useTranslations("common");
    const dispatch = useAppDispatch();

    const [period, setPeriod] = useState<StationHistoryPeriod>("today");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [stateFilter, setStateFilter] =
        useState<(typeof STATE_FILTERS)[number]>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const historyArgs = useMemo(() => {
        const base = {
            stationId,
            q: searchQuery.trim() || undefined,
            state: stateFilter === "all" ? undefined : stateFilter,
            page,
            limit,
        };
        if (period === "custom") {
            if (!fromDate || !toDate) {
                return { ...base, period: "today" as const };
            }
            return { ...base, period, fromDate, toDate };
        }
        return { ...base, period };
    }, [stationId, searchQuery, stateFilter, page, period, fromDate, toDate]);

    const {
        data: detail,
        isLoading: detailLoading,
        isError: detailError,
        refetch: refetchDetail,
        isFetching: detailFetching,
    } = useStationDetailQuery(stationId, { pollingInterval: POLL_MS });

    const {
        data: history,
        isLoading: historyLoading,
        isError: historyError,
        refetch: refetchHistory,
        isFetching: historyFetching,
    } = useStationHistoryQuery(historyArgs, { pollingInterval: POLL_MS });

    const [updateStation, { isLoading: isToggling }] =
        useUpdateStationMutation();

    const rows = history?.data ?? [];
    const paginationMeta = history?.pagination;

    const periodLabel = (id: StationHistoryPeriod) => {
        if (id === "today") return tManager("periodToday");
        if (id === "week") return tManager("periodWeek");
        if (id === "month") return tManager("periodMonth");
        if (id === "quarter") return tManager("periodQuarter");
        if (id === "year") return tManager("periodYear");
        return tManager("periodCustom");
    };

    const stateLabel = (state: string) => {
        const map: Record<string, string> = {
            QUEUED: t("state_QUEUED"),
            ACKNOWLEDGED: t("state_ACKNOWLEDGED"),
            IN_PREPARATION: t("state_IN_PREPARATION"),
            READY: t("state_READY"),
            SERVED: t("state_SERVED"),
            CANCELLED: t("state_CANCELLED"),
            CANNOT_PREPARE: t("state_CANNOT_PREPARE"),
        };
        return map[state] ?? state.replace(/_/g, " ");
    };

    const columns: DataTableColumn<StationHistoryItem>[] = useMemo(
        () => [
            {
                id: "time",
                header: t("colTime"),
                cell: row => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium text-foreground">
                            {new Date(row.confirmedAt).toLocaleTimeString(
                                undefined,
                                { hour: "2-digit", minute: "2-digit" },
                            )}
                        </span>
                        <span className="text-[11px] text-slate-gray">
                            {row.businessDate}
                        </span>
                    </div>
                ),
            },
            {
                id: "item",
                header: t("colItem"),
                cell: row => (
                    <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-foreground">
                            {row.quantity > 1 ? `${row.quantity}× ` : ""}
                            {row.itemName}
                        </p>
                        {row.specialInstruction ? (
                            <p className="mt-0.5 truncate text-[11px] text-slate-gray">
                                {row.specialInstruction}
                            </p>
                        ) : null}
                    </div>
                ),
            },
            {
                id: "table",
                header: t("colTable"),
                cell: row => (
                    <span className="text-[13px] text-foreground">
                        {row.tableDisplayName}
                    </span>
                ),
            },
            {
                id: "waiter",
                header: t("colWaiter"),
                cell: row => (
                    <span className="text-[13px] text-slate-gray">
                        {row.waiterName || "—"}
                    </span>
                ),
            },
            {
                id: "state",
                header: t("colState"),
                cell: row => (
                    <Badge
                        variant={stateTone(row.state)}
                        className="rounded-full px-2 py-0 text-[10px] font-normal capitalize"
                    >
                        {stateLabel(row.state)}
                    </Badge>
                ),
            },
            {
                id: "prep",
                header: t("colPrep"),
                cell: row => (
                    <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-slate-gray">
                        <Clock className="size-3" />
                        {row.prepMinutes != null
                            ? t("min", { count: row.prepMinutes })
                            : "—"}
                    </span>
                ),
            },
        ],
        [t],
    );

    const pagination: DataTablePagination = useMemo(
        () => ({
            page: paginationMeta?.page ?? page,
            totalPages: Math.max(paginationMeta?.totalPages ?? 1, 1),
            total: paginationMeta?.total ?? rows.length,
            limit: paginationMeta?.limit ?? limit,
            onPageChange: next => setPage(next),
        }),
        [paginationMeta, page, rows.length],
    );

    const handleToggle = async () => {
        if (!detail) return;
        try {
            await updateStation({
                id: detail.id,
                enabled: !detail.enabled,
            }).unwrap();
            toast.success(
                !detail.enabled
                    ? t("toastOnlineTitle")
                    : t("toastOfflineTitle"),
                !detail.enabled
                    ? t("toastOnlineBody", { name: detail.name })
                    : t("toastOfflineBody", { name: detail.name }),
            );
            void refetchDetail();
        } catch {
            toast.error(t("toastToggleErrorTitle"), t("toastToggleErrorBody"));
        }
    };

    const ownersLabel =
        detail?.owners
            ?.map(o => o.displayName)
            .filter(Boolean)
            .join(", ") || t("noOwner");

    if (detailLoading) {
        return (
            <DashboardFrame>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card py-16">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="mt-2 text-[12px] text-slate-gray">
                        {t("loadingDetail")}
                    </p>
                </div>
            </DashboardFrame>
        );
    }

    if (detailError || !detail) {
        return (
            <DashboardFrame>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("loadDetailError")}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href="/manager/stations">
                                <ArrowLeft className="size-3.5" />
                                {t("backToStations")}
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-full text-[12px]"
                            onClick={() => void refetchDetail()}
                        >
                            {t("tryAgain")}
                        </Button>
                    </div>
                </div>
            </DashboardFrame>
        );
    }

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3">
                <Link
                    href="/manager/stations"
                    className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate-gray transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {t("backToStations")}
                </Link>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <PageHeader
                        compact
                        eyebrow={t("detailEyebrow")}
                        title={detail.name}
                        description={
                            detail.code
                                ? t("detailDescWithCode", { code: detail.code })
                                : t("detailDesc")
                        }
                    />
                    <div className="flex flex-wrap items-center gap-2 self-start">
                        <div
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate-gray",
                                (detailFetching || historyFetching) &&
                                    "opacity-80",
                            )}
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3",
                                    detailFetching || historyFetching
                                        ? "animate-spin"
                                        : "",
                                )}
                            />
                            {history?.periodLabel || periodLabel(period)}
                        </div>
                        <Badge
                            variant={detail.enabled ? "success" : "secondary"}
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-normal"
                        >
                            {detail.enabled ? t("online") : t("offline")}
                        </Badge>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isToggling}
                            onClick={() => void handleToggle()}
                            className="h-8 rounded-full text-[12px] font-normal"
                        >
                            {detail.enabled ? t("turnOff") : t("turnOn")}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                                dispatch(
                                    openEditStation({
                                        id: detail.id,
                                        name: detail.name,
                                        code: detail.code,
                                        enabled: detail.enabled,
                                        status: detail.status,
                                        avgPrepMin: detail.avgPrepMin,
                                        defaultDelayThresholdMinutes:
                                            detail.defaultDelayThresholdMinutes,
                                        sortOrder: detail.sortOrder,
                                    }),
                                )
                            }
                            className="h-8 rounded-full text-[12px] font-normal"
                        >
                            {tCommon("edit")}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        icon: UserRound,
                        label: t("stationOwner"),
                        value: ownersLabel,
                        tabular: false,
                    },
                    {
                        icon: Ticket,
                        label: t("ticketsToday"),
                        value: String(detail.ticketsToday),
                        tabular: true,
                    },
                    {
                        icon: Clock,
                        label: t("openTickets"),
                        value: String(detail.openTickets),
                        tabular: true,
                    },
                    {
                        icon: UtensilsCrossed,
                        label: t("servedToday"),
                        value: String(detail.servedToday),
                        tabular: true,
                    },
                ].map(stat => (
                    <div key={stat.label} className="bg-card px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-gray">
                            <stat.icon className="size-3" />
                            {stat.label}
                        </div>
                        <p
                            className={cn(
                                "mt-1.5 text-[15px] font-medium tracking-tight text-foreground",
                                stat.tabular && "text-[22px] tabular-nums",
                            )}
                        >
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                    {PERIODS.map(id => {
                        const active = period === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    setPage(1);
                                    if (id !== "custom") {
                                        setPeriod(id);
                                        setFromDate("");
                                        setToDate("");
                                    } else {
                                        setPeriod("custom");
                                    }
                                }}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                                    active
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-hairline bg-card text-slate-gray hover:text-foreground",
                                )}
                            >
                                {periodLabel(id)}
                            </button>
                        );
                    })}
                </div>

                {period === "custom" ? (
                    <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                            {tManager("fromDate")}
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] text-foreground"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                            {tManager("toDate")}
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] text-foreground"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                if (!customFrom || !customTo) return;
                                setFromDate(customFrom);
                                setToDate(customTo);
                                setPage(1);
                            }}
                            className="h-8 rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground"
                        >
                            {tManager("applyRange")}
                        </button>
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-1.5">
                    {STATE_FILTERS.map(id => {
                        const active = stateFilter === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    setStateFilter(id);
                                    setPage(1);
                                }}
                                className={cn(
                                    "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                                    active
                                        ? "border-foreground/20 bg-secondary text-foreground"
                                        : "border-transparent text-slate-gray hover:text-foreground",
                                )}
                            >
                                {id === "all" ? t("stateAll") : stateLabel(id)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {historyError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("loadHistoryError")}
                    </p>
                    <button
                        type="button"
                        onClick={() => void refetchHistory()}
                        className="mt-2 text-[12px] text-foreground underline"
                    >
                        {t("tryAgain")}
                    </button>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    rowKey={row => row.id}
                    empty={
                        historyLoading ? t("loadingHistory") : t("historyEmpty")
                    }
                    searchPlaceholder={t("historySearch")}
                    searchQuery={searchQuery}
                    onSearchChange={q => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                    serverSide
                    pagination={pagination}
                    showColumnToggle={false}
                    className="rounded-2xl"
                />
            )}

            <AddEditStationSheet />
        </DashboardFrame>
    );
}
