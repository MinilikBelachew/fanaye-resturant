"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    Ban,
    ChartNoAxesCombined,
    CheckCircle,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    CookingPot,
    FileText,
    Layers,
    Package,
    Radio,
    Receipt,
    RefreshCw,
    ShoppingBag,
    UserX,
    X,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    HourlySalesChart,
    PaymentChannelsBreakdown,
    PaymentMixTrendChart,
    PrepDurationBucketsChart,
    RevenueVsCollectionsChart,
    StationThroughputChart,
    TopDishesLeaderboard,
    WeeklyCashMovementChart,
} from "@/components/custom/organisms/Charts";
import {
    FloorSnapshotTable,
    RecentAuditTable,
    WaiterPerformanceTable,
} from "@/domains/reporting/ui/ManagerDashboardTables";
import { useListAuditEventsQuery } from "@/context/services/auditApi";
import { useFloorTablesQuery } from "@/context/services/floorApi";
import {
    type LatePrepItemDetail,
    type ReadyTooLongItemDetail,
    type PendingActionItemDetail,
    type StaffOfflineItemDetail,
    type LowStockItemDetail,
    type UnpaidBillItemDetail,
    type StationBacklogItemDetail,
    type ManagerDashboardPeriod,
    useGetManagerDashboardQuery,
} from "@/context/services/managerDashboardApi";
import { useTranslations } from "next-intl";
import DualCalendarDatePicker from "@/components/custom/molecules/DualCalendarDatePicker";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";
import { cn } from "@/lib/utils";

const POLL_DASH_FALLBACK = 20_000;
const POLL_FLOOR_FALLBACK = 15_000;
const POLL_AUDIT_FALLBACK = 30_000;

const PERIODS: ManagerDashboardPeriod[] = [
    "today",
    "week",
    "month",
    "quarter",
    "year",
    "custom",
];

function trendDirection(value?: string): "up" | "down" | "neutral" {
    if (!value || value === "0%") return "neutral";
    if (value.startsWith("-")) return "down";
    if (value.startsWith("+")) return "up";
    return "neutral";
}

export default function ManagerPage() {
    const tManager = useTranslations("manager");
    const tNav = useTranslations("appNav");
    const tRoles = useTranslations("roles");
    const tTopBar = useTranslations("topbar");

    const [period, setPeriod] = useState<ManagerDashboardPeriod>("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [customPickerOpen, setCustomPickerOpen] = useState(false);
    const [inspectItem, setInspectItem] = useState<{
        kind:
            | "latePrep"
            | "readyTooLong"
            | "needsAttention"
            | "stationBacklog"
            | "staffOffline"
            | "lowStock"
            | "unpaidToday";
        title: string;
        badge: string;
        badgeTone: "warn" | "bad" | "info";
        details: { label: string; value: string; highlight?: boolean }[];
        notes?: string | null;
        alertBox?: {
            title: string;
            value: string;
            description?: string;
            progressPercent?: number;
        };
        ticketLines?: Array<{
            id: string;
            itemName: string;
            quantity: number;
            tableDisplayName: string;
            waiterName: string;
            state: string;
            waitMinutes: number;
        }>;
    } | null>(null);
    const [hoverTooltip, setHoverTooltip] = useState<{
        title: string;
        badge?: string;
        badgeTone?: "warn" | "bad" | "info";
        rows: { label: string; value: string; highlight?: boolean }[];
        hint?: string;
        x: number;
        y: number;
    } | null>(null);

    const queryArg = useMemo(() => {
        if (period === "custom") {
            if (!fromDate || !toDate) return { period: "today" as const };
            return { period, fromDate, toDate };
        }
        return { period };
    }, [period, fromDate, toDate]);

    const dashPoll = useRealtimePollMs(POLL_DASH_FALLBACK);
    const floorPoll = useRealtimePollMs(POLL_FLOOR_FALLBACK);
    const auditPoll = useRealtimePollMs(POLL_AUDIT_FALLBACK);
    const { data, isLoading, isFetching, error } = useGetManagerDashboardQuery(
        queryArg,
        { pollingInterval: dashPoll },
    );
    const { data: audit } = useListAuditEventsQuery(
        { page: 1, limit: 8 },
        { pollingInterval: auditPoll },
    );
    const { data: floor } = useFloorTablesQuery(undefined, {
        pollingInterval: floorPoll,
    });
    const dash = data?.data;
    const kpis = dash?.kpis;
    const isToday = (dash?.period ?? period) === "today";

    const periodLabel = (id: ManagerDashboardPeriod) => {
        if (id === "today") return tManager("periodToday");
        if (id === "week") return tManager("periodWeek");
        if (id === "month") return tManager("periodMonth");
        if (id === "quarter") return tManager("periodQuarter");
        if (id === "year") return tManager("periodYear");
        return tManager("periodCustom");
    };

    const collectionsTrend =
        kpis?.collectionsTrend ?? kpis?.dailyRevenueTrend ?? "0%";
    const collectionsTrendLabel =
        kpis?.collectionsTrendLabel ??
        (isToday
            ? tManager("vsCollectedYesterday")
            : tManager("vsPriorPeriod"));

    const actNow = dash?.actNow;
    const pendingCount =
        actNow?.pendingActionItems?.length ??
        (Number(kpis?.pendingActionsFormatted ?? "0") || 0);
    const backlogCount = Number(kpis?.stationBacklogFormatted ?? "0") || 0;

    const statusItems = [
        {
            id: "needsAttention",
            title: tManager("needsAttention"),
            count: pendingCount,
            meta:
                pendingCount > 0
                    ? (kpis?.pendingActionsHint ?? tManager("nothingWaiting"))
                    : tManager("nothingWaiting"),
            tone: pendingCount > 0 ? ("warn" as const) : ("ok" as const),
            href: "/manager/approvals",
        },
        {
            id: "stationBacklog",
            title: tManager("stationBacklog"),
            count: backlogCount,
            meta: kpis?.stationBacklogHint ?? tManager("stationsClear"),
            tone: backlogCount > 0 ? ("warn" as const) : ("ok" as const),
            href: "/manager/stations",
        },
        {
            id: "readyTooLong",
            title: tManager("readyTooLong"),
            count: actNow?.readyTooLongCount ?? 0,
            meta: actNow?.readyTooLongHint ?? tManager("readyTooLongOk"),
            tone:
                (actNow?.readyTooLongCount ?? 0) > 0
                    ? ("warn" as const)
                    : ("ok" as const),
            href: "/manager/live",
        },
        {
            id: "latePrep",
            title: tManager("latePrep"),
            count: actNow?.latePrepCount ?? 0,
            meta: actNow?.latePrepHint ?? tManager("latePrepOk"),
            tone:
                (actNow?.latePrepCount ?? 0) > 0
                    ? ("warn" as const)
                    : ("ok" as const),
            href: "/manager/stations",
        },
        {
            id: "staffOffline",
            title: tManager("staffOffline"),
            count: actNow?.staffOfflineCount ?? 0,
            meta: actNow?.staffOfflineHint ?? tManager("staffOfflineOk"),
            tone:
                (actNow?.staffOfflineCount ?? 0) > 0
                    ? ("warn" as const)
                    : ("ok" as const),
            href: "/manager/staff",
        },
        {
            id: "lowStock",
            title: tManager("lowStock"),
            count: actNow?.lowStockCount ?? 0,
            meta: actNow?.lowStockHint ?? tManager("lowStockOk"),
            tone:
                (actNow?.lowStockCount ?? 0) > 0
                    ? ("warn" as const)
                    : ("ok" as const),
            href: "/manager/inventory",
        },
        {
            id: "unpaidToday",
            title: tManager("unpaidToday"),
            count: actNow?.unpaidBillsCount ?? 0,
            meta:
                actNow && (actNow.unpaidBillsCount ?? 0) > 0
                    ? `${actNow.unpaidGapFormatted} · ${actNow.unpaidGapHint}`
                    : (actNow?.unpaidGapHint ?? tManager("unpaidTodayOk")),
            tone:
                (actNow?.unpaidGapValue ?? 0) > 0
                    ? ("warn" as const)
                    : ("ok" as const),
            href: "/manager/live",
        },
    ];
    const hasLivePressure = statusItems.some(item => item.tone === "warn");

    const toneClass = {
        ok: "border-border text-muted-foreground bg-muted/40",
        warn: "border-amber-500/25 text-amber-800 bg-amber-500/10",
        bad: "border-destructive/25 text-destructive bg-destructive/5",
    };

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow={tNav("house")}
                    title={`${tRoles("manager")} ${tTopBar("dashboard")}`}
                    description={
                        dash
                            ? tManager("periodRange", {
                                  branch: dash.branchName,
                                  label: dash.periodLabel ?? dash.businessDate,
                              })
                            : tManager("liveDescription")
                    }
                />
                <div
                    className={cn(
                        "inline-flex items-center gap-1.5 self-start rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-slate-gray",
                        isFetching && "opacity-80",
                    )}
                >
                    <Radio
                        className={cn(
                            "size-3",
                            error ? "text-red-500" : "text-emerald-500",
                        )}
                    />
                    {error ? tManager("offline") : tManager("autoUpdating")}
                    {isFetching ? (
                        <RefreshCw className="size-3 animate-spin" />
                    ) : null}
                </div>
            </div>

            <div className="relative z-[55] flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                    {PERIODS.map(id => {
                        const active = period === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    if (id !== "custom") {
                                        setPeriod(id);
                                        setFromDate("");
                                        setToDate("");
                                        setCustomPickerOpen(false);
                                    } else {
                                        setPeriod("custom");
                                        setCustomPickerOpen(open =>
                                            period === "custom" ? !open : true,
                                        );
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
                {period === "custom" && customPickerOpen ? (
                    <DualCalendarDatePicker
                        variant="popover"
                        from={fromDate || undefined}
                        to={toDate || undefined}
                        defaultSelectionMode="range"
                        applyLabel={tManager("applyRange")}
                        onDismiss={() => setCustomPickerOpen(false)}
                        onApply={({ from, to }) => {
                            setFromDate(from);
                            setToDate(to);
                            setPeriod("custom");
                            setCustomPickerOpen(false);
                        }}
                        onClear={() => {
                            setFromDate("");
                            setToDate("");
                            setPeriod("today");
                            setCustomPickerOpen(false);
                        }}
                    />
                ) : null}
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    {tManager("loadError")}
                </div>
            )}

            {isLoading ? (
                <KpiStatsSkeleton />
            ) : (
                <>
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-gray">
                            {tManager("sectionMoney")}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <KpiCard
                                compact
                                accent
                                label={
                                    isToday
                                        ? tManager("collectedToday")
                                        : tManager("collected")
                                }
                                value={kpis?.collectionsFormatted ?? "ETB 0"}
                                hint={collectionsTrendLabel}
                                icon={
                                    <ChartNoAxesCombined className="size-3" />
                                }
                                trend={{
                                    value: collectionsTrend,
                                    direction: trendDirection(collectionsTrend),
                                }}
                                sparkline={null}
                            />
                            <KpiCard
                                compact
                                label={tManager("billed")}
                                value={kpis?.billedFormatted ?? "ETB 0"}
                                hint={tManager("billedHint")}
                                icon={<Receipt className="size-3" />}
                                sparkline={null}
                            />
                            <KpiCard
                                compact
                                label={tManager("orders")}
                                value={kpis?.ordersFormatted ?? "0"}
                                hint={
                                    isToday
                                        ? tManager("ordersToday")
                                        : tManager("ordersInPeriod")
                                }
                                icon={<ShoppingBag className="size-3" />}
                                sparkline={null}
                            />
                            <KpiCard
                                compact
                                label={tManager("collectionGap")}
                                value={kpis?.collectionGapFormatted ?? "ETB 0"}
                                hint={tManager("gapHint")}
                                icon={<CircleDollarSign className="size-3" />}
                                sparkline={null}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-gray">
                            {tManager("sectionOps")}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <KpiCard
                                compact
                                label={tManager("avgPrep")}
                                value={kpis?.avgPrepTimeFormatted ?? "—"}
                                hint={
                                    kpis?.avgPrepTimeTrendLabel ??
                                    tManager("kitchenSpeed")
                                }
                                icon={<Clock3 className="size-3" />}
                                trend={{
                                    value: kpis?.avgPrepTimeTrend ?? "0%",
                                    direction: trendDirection(
                                        kpis?.avgPrepTimeTrend,
                                    ),
                                }}
                                sparkline={null}
                            />
                            <KpiCard
                                compact
                                label={tManager("stationBacklog")}
                                value={kpis?.stationBacklogFormatted ?? "0"}
                                hint={
                                    kpis?.stationBacklogHint ??
                                    tManager("stationsClear")
                                }
                                icon={<CookingPot className="size-3" />}
                                sparkline={null}
                            />
                            <KpiCard
                                compact
                                label={tManager("needsAttention")}
                                value={kpis?.pendingActionsFormatted ?? "0"}
                                hint={
                                    kpis?.pendingActionsHint ??
                                    tManager("nothingWaiting")
                                }
                                icon={<AlertTriangle className="size-3" />}
                                sparkline={null}
                            />
                            <KpiCard
                                compact
                                label={tManager("cancelledItems")}
                                value={kpis?.cancelledItemsFormatted ?? "0"}
                                hint={
                                    (kpis?.cancelledItemsCount ?? 0) > 0
                                        ? tManager("voidsInPeriod")
                                        : tManager("noVoids")
                                }
                                icon={<Ban className="size-3" />}
                                sparkline={null}
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-8">
                    <RevenueVsCollectionsChart data={dash?.salesTrend} />
                </div>
                <section className="flex h-[338px] flex-col rounded-2xl border border-border bg-background p-5 lg:col-span-4">
                    <div className="mb-3 shrink-0">
                        <h3 className="text-[15px] font-medium">
                            {tManager("liveFloor")}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {tManager("liveFloorDesc", {
                                branch:
                                    dash?.branchName ?? tManager("thisBranch"),
                            })}
                        </p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        {!hasLivePressure ? (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border px-4 py-6 text-center text-[12px] text-muted-foreground">
                                {tManager("actNowEmpty")}
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {statusItems
                                    .filter(item => item.tone !== "ok")
                                    .map(item => (
                                        <li key={item.title}>
                                            <div className="rounded-xl border border-border p-3 transition-colors hover:border-primary/40">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[13px] font-medium text-foreground">
                                                            {item.title}
                                                            <span className="ml-1.5 tabular-nums text-muted-foreground">
                                                                ({item.count})
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                                            toneClass[
                                                                item.tone
                                                            ],
                                                        )}
                                                    >
                                                        {tManager(
                                                            "insightWatch",
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    {item.meta}
                                                </p>

                                                {/* 1. LATE PREP */}
                                                {item.id === "latePrep" &&
                                                    actNow?.latePrepItems &&
                                                    actNow.latePrepItems
                                                        .length > 0 && (
                                                        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2">
                                                            {actNow.latePrepItems.map(
                                                                dish => (
                                                                    <button
                                                                        key={
                                                                            dish.orderItemId
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInspectItem(
                                                                                {
                                                                                    kind: "latePrep",
                                                                                    title: `${dish.quantity}× ${dish.itemName}`,
                                                                                    badge: dish.tableDisplayName,
                                                                                    badgeTone:
                                                                                        "bad",
                                                                                    details:
                                                                                        [
                                                                                            {
                                                                                                label: "Table",
                                                                                                value: dish.tableDisplayName,
                                                                                            },
                                                                                            {
                                                                                                label: "Station",
                                                                                                value: dish.stationName,
                                                                                            },
                                                                                            {
                                                                                                label: "Assigned Waiter",
                                                                                                value: dish.waiterName,
                                                                                            },
                                                                                            {
                                                                                                label: "State",
                                                                                                value: dish.state,
                                                                                            },
                                                                                            {
                                                                                                label: "Queued Time",
                                                                                                value: new Date(
                                                                                                    dish.queuedAt,
                                                                                                ).toLocaleTimeString(
                                                                                                    [],
                                                                                                    {
                                                                                                        hour: "2-digit",
                                                                                                        minute: "2-digit",
                                                                                                    },
                                                                                                ),
                                                                                            },
                                                                                            ...(dish.modifiersSummary
                                                                                                ? [
                                                                                                      {
                                                                                                          label: "Modifiers",
                                                                                                          value: dish.modifiersSummary,
                                                                                                      },
                                                                                                  ]
                                                                                                : []),
                                                                                        ],
                                                                                    notes: dish.specialInstruction,
                                                                                    alertBox:
                                                                                        {
                                                                                            title: "Preparation Time Delay",
                                                                                            value: `+${dish.overdueMinutes} min overdue`,
                                                                                            description: `Target: ${dish.targetMinutes}m · Elapsed: ${dish.elapsedMinutes}m`,
                                                                                            progressPercent:
                                                                                                Math.min(
                                                                                                    100,
                                                                                                    Math.round(
                                                                                                        (dish.elapsedMinutes /
                                                                                                            Math.max(
                                                                                                                1,
                                                                                                                dish.targetMinutes,
                                                                                                            )) *
                                                                                                            100,
                                                                                                    ),
                                                                                                ),
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        onMouseEnter={e => {
                                                                            const rect =
                                                                                e.currentTarget.getBoundingClientRect();
                                                                            setHoverTooltip(
                                                                                {
                                                                                    title: tManager(
                                                                                        "hoverLateTitle",
                                                                                        {
                                                                                            minutes:
                                                                                                dish.overdueMinutes,
                                                                                        },
                                                                                    ),
                                                                                    badge: dish.state,
                                                                                    badgeTone:
                                                                                        "bad",
                                                                                    rows: [
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverDish",
                                                                                            ),
                                                                                            value: `${dish.quantity}× ${dish.itemName}`,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverTable",
                                                                                            ),
                                                                                            value: dish.tableDisplayName,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverStation",
                                                                                            ),
                                                                                            value: dish.stationName,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverWaiter",
                                                                                            ),
                                                                                            value: dish.waiterName,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverTiming",
                                                                                            ),
                                                                                            value: tManager(
                                                                                                "hoverTargetElapsed",
                                                                                                {
                                                                                                    target: dish.targetMinutes,
                                                                                                    elapsed:
                                                                                                        dish.elapsedMinutes,
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                        ...(dish.modifiersSummary
                                                                                            ? [
                                                                                                  {
                                                                                                      label: tManager(
                                                                                                          "hoverModifiers",
                                                                                                      ),
                                                                                                      value: dish.modifiersSummary,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                    ],
                                                                                    hint: tManager(
                                                                                        "hoverInspectTicket",
                                                                                    ),
                                                                                    x: rect.left,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        6,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() =>
                                                                            setHoverTooltip(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="group/dish flex w-full items-center justify-between gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-2.5 py-1.5 text-left text-[11px] transition-all hover:bg-destructive/10 hover:border-destructive/40 cursor-pointer"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                                            <span className="shrink-0 rounded bg-destructive/15 px-1.5 py-0.5 font-bold text-destructive text-[10px]">
                                                                                {
                                                                                    dish.tableDisplayName
                                                                                }
                                                                            </span>
                                                                            <span className="truncate font-medium text-foreground">
                                                                                {
                                                                                    dish.quantity
                                                                                }

                                                                                ×{" "}
                                                                                {
                                                                                    dish.itemName
                                                                                }
                                                                            </span>
                                                                            <span className="hidden sm:inline-block text-[10px] text-muted-foreground truncate">
                                                                                ·{" "}
                                                                                {
                                                                                    dish.stationName
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive text-[10px]">
                                                                                +
                                                                                {
                                                                                    dish.overdueMinutes
                                                                                }

                                                                                m
                                                                            </span>
                                                                            <ChevronRight className="size-3 text-muted-foreground group-hover/dish:text-foreground transition-transform group-hover/dish:translate-x-0.5" />
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* 2. READY TOO LONG */}
                                                {item.id === "readyTooLong" &&
                                                    actNow?.readyTooLongItems &&
                                                    actNow.readyTooLongItems
                                                        .length > 0 && (
                                                        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2">
                                                            {actNow.readyTooLongItems.map(
                                                                dish => (
                                                                    <button
                                                                        key={
                                                                            dish.orderItemId
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInspectItem(
                                                                                {
                                                                                    kind: "readyTooLong",
                                                                                    title: `${dish.quantity}× ${dish.itemName}`,
                                                                                    badge: dish.tableDisplayName,
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    details:
                                                                                        [
                                                                                            {
                                                                                                label: "Table",
                                                                                                value: dish.tableDisplayName,
                                                                                            },
                                                                                            {
                                                                                                label: "Station",
                                                                                                value: dish.stationName,
                                                                                            },
                                                                                            {
                                                                                                label: "Assigned Waiter",
                                                                                                value: dish.waiterName,
                                                                                            },
                                                                                            {
                                                                                                label: "Ready Since",
                                                                                                value: new Date(
                                                                                                    dish.readyAt,
                                                                                                ).toLocaleTimeString(
                                                                                                    [],
                                                                                                    {
                                                                                                        hour: "2-digit",
                                                                                                        minute: "2-digit",
                                                                                                    },
                                                                                                ),
                                                                                            },
                                                                                        ],
                                                                                    alertBox:
                                                                                        {
                                                                                            title: "Food Sitting on Pass",
                                                                                            value: `Ready for ${dish.readyMinutes} min`,
                                                                                            description:
                                                                                                "Waiting for pickup / delivery to guest table",
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        onMouseEnter={e => {
                                                                            const rect =
                                                                                e.currentTarget.getBoundingClientRect();
                                                                            setHoverTooltip(
                                                                                {
                                                                                    title: tManager(
                                                                                        "hoverReadyWaitingTitle",
                                                                                        {
                                                                                            minutes:
                                                                                                dish.readyMinutes,
                                                                                        },
                                                                                    ),
                                                                                    badge: "READY",
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    rows: [
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverDish",
                                                                                            ),
                                                                                            value: `${dish.quantity}× ${dish.itemName}`,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverTable",
                                                                                            ),
                                                                                            value: dish.tableDisplayName,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverStation",
                                                                                            ),
                                                                                            value: dish.stationName,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverWaiter",
                                                                                            ),
                                                                                            value: dish.waiterName,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverReadyTime",
                                                                                            ),
                                                                                            value: new Date(
                                                                                                dish.readyAt,
                                                                                            ).toLocaleTimeString(
                                                                                                [],
                                                                                                {
                                                                                                    hour: "2-digit",
                                                                                                    minute: "2-digit",
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                    ],
                                                                                    hint: tManager(
                                                                                        "hoverInspectTicket",
                                                                                    ),
                                                                                    x: rect.left,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        6,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() =>
                                                                            setHoverTooltip(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="group/dish flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-1.5 text-left text-[11px] transition-all hover:bg-amber-500/10 hover:border-amber-500/40 cursor-pointer"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                                            <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 font-bold text-amber-700 dark:text-amber-400 text-[10px]">
                                                                                {
                                                                                    dish.tableDisplayName
                                                                                }
                                                                            </span>
                                                                            <span className="truncate font-medium text-foreground">
                                                                                {
                                                                                    dish.quantity
                                                                                }

                                                                                ×{" "}
                                                                                {
                                                                                    dish.itemName
                                                                                }
                                                                            </span>
                                                                            <span className="hidden sm:inline-block text-[10px] text-muted-foreground truncate">
                                                                                ·{" "}
                                                                                {
                                                                                    dish.stationName
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-700 dark:text-amber-400 text-[10px]">
                                                                                Ready{" "}
                                                                                {
                                                                                    dish.readyMinutes
                                                                                }

                                                                                m
                                                                            </span>
                                                                            <ChevronRight className="size-3 text-muted-foreground group-hover/dish:text-foreground transition-transform group-hover/dish:translate-x-0.5" />
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* 3. NEEDS ATTENTION / PENDING ACTIONS */}
                                                {item.id === "needsAttention" &&
                                                    actNow?.pendingActionItems &&
                                                    actNow.pendingActionItems
                                                        .length > 0 && (
                                                        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2">
                                                            {actNow.pendingActionItems.map(
                                                                req => (
                                                                    <button
                                                                        key={
                                                                            req.id
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInspectItem(
                                                                                {
                                                                                    kind: "needsAttention",
                                                                                    title: req.title,
                                                                                    badge: req.kind.replace(
                                                                                        "_",
                                                                                        " ",
                                                                                    ),
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    details:
                                                                                        [
                                                                                            {
                                                                                                label: "Request Type",
                                                                                                value: req.title,
                                                                                            },
                                                                                            ...(req.tableDisplayName
                                                                                                ? [
                                                                                                      {
                                                                                                          label: "Table",
                                                                                                          value: req.tableDisplayName,
                                                                                                      },
                                                                                                  ]
                                                                                                : []),
                                                                                            ...(req.staffName
                                                                                                ? [
                                                                                                      {
                                                                                                          label: "Requested By",
                                                                                                          value: req.staffName,
                                                                                                      },
                                                                                                  ]
                                                                                                : []),
                                                                                            ...(req.amountFormatted
                                                                                                ? [
                                                                                                      {
                                                                                                          label: "Amount",
                                                                                                          value: req.amountFormatted,
                                                                                                      },
                                                                                                  ]
                                                                                                : []),
                                                                                            {
                                                                                                label: "Time",
                                                                                                value: new Date(
                                                                                                    req.createdAt,
                                                                                                ).toLocaleTimeString(
                                                                                                    [],
                                                                                                    {
                                                                                                        hour: "2-digit",
                                                                                                        minute: "2-digit",
                                                                                                    },
                                                                                                ),
                                                                                            },
                                                                                        ],
                                                                                    notes: req.description,
                                                                                    alertBox:
                                                                                        {
                                                                                            title: "Manager Action Required",
                                                                                            value: req.title,
                                                                                            description:
                                                                                                req.description,
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        onMouseEnter={e => {
                                                                            const rect =
                                                                                e.currentTarget.getBoundingClientRect();
                                                                            setHoverTooltip(
                                                                                {
                                                                                    title: req.title,
                                                                                    badge: req.kind,
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    rows: [
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverDetails",
                                                                                            ),
                                                                                            value: req.description,
                                                                                        },
                                                                                        ...(req.tableDisplayName
                                                                                            ? [
                                                                                                  {
                                                                                                      label: tManager(
                                                                                                          "hoverTable",
                                                                                                      ),
                                                                                                      value: req.tableDisplayName,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                        ...(req.staffName
                                                                                            ? [
                                                                                                  {
                                                                                                      label: tManager(
                                                                                                          "hoverStaff",
                                                                                                      ),
                                                                                                      value: req.staffName,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                        ...(req.amountFormatted
                                                                                            ? [
                                                                                                  {
                                                                                                      label: tManager(
                                                                                                          "hoverAmount",
                                                                                                      ),
                                                                                                      value: req.amountFormatted,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                    ],
                                                                                    hint: tManager(
                                                                                        "hoverInspectRequest",
                                                                                    ),
                                                                                    x: rect.left,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        6,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() =>
                                                                            setHoverTooltip(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="group/req flex w-full items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-left text-[11px] transition-all hover:bg-primary/10 hover:border-primary/35 cursor-pointer"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                                            <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 font-bold text-primary text-[10px] uppercase">
                                                                                {req.kind ===
                                                                                "BILL_REQUEST"
                                                                                    ? tManager(
                                                                                          "hoverKindBill",
                                                                                      )
                                                                                    : req.kind ===
                                                                                        "CASH_DROP"
                                                                                      ? tManager(
                                                                                            "hoverKindCash",
                                                                                        )
                                                                                      : req.kind ===
                                                                                          "CANCELLATION"
                                                                                        ? tManager(
                                                                                              "hoverKindVoid",
                                                                                          )
                                                                                        : req.kind ===
                                                                                            "PRODUCTION_EXCEPTION"
                                                                                          ? tManager(
                                                                                                "hoverKind86",
                                                                                            )
                                                                                          : tManager(
                                                                                                "hoverKindEdit",
                                                                                            )}
                                                                            </span>
                                                                            <span className="truncate font-medium text-foreground">
                                                                                {req.tableDisplayName
                                                                                    ? `${req.tableDisplayName} · `
                                                                                    : ""}
                                                                                {
                                                                                    req.description
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            {req.amountFormatted && (
                                                                                <span className="text-[10px] font-semibold text-primary">
                                                                                    {
                                                                                        req.amountFormatted
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            <ChevronRight className="size-3 text-muted-foreground group-hover/req:text-foreground transition-transform group-hover/req:translate-x-0.5" />
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* 4. STATION BACKLOG */}
                                                {item.id === "stationBacklog" &&
                                                    actNow?.stationBacklogItems &&
                                                    actNow.stationBacklogItems
                                                        .length > 0 && (
                                                        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2">
                                                            {actNow.stationBacklogItems.map(
                                                                st => (
                                                                    <button
                                                                        key={
                                                                            st.stationName
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInspectItem(
                                                                                {
                                                                                    kind: "stationBacklog",
                                                                                    title: `${st.stationName} Queue`,
                                                                                    badge: `${st.queuedCount + st.inPrepCount} Active`,
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    details:
                                                                                        [
                                                                                            {
                                                                                                label: tManager(
                                                                                                    "hoverStation",
                                                                                                ),
                                                                                                value: st.stationName,
                                                                                            },
                                                                                            {
                                                                                                label: tManager(
                                                                                                    "hoverQueued",
                                                                                                ),
                                                                                                value: tManager(
                                                                                                    "hoverTicketsQueued",
                                                                                                    {
                                                                                                        count: st.queuedCount,
                                                                                                    },
                                                                                                ),
                                                                                            },
                                                                                            {
                                                                                                label: tManager(
                                                                                                    "hoverInPrep",
                                                                                                ),
                                                                                                value: tManager(
                                                                                                    "hoverTicketsQueued",
                                                                                                    {
                                                                                                        count: st.inPrepCount,
                                                                                                    },
                                                                                                ),
                                                                                            },
                                                                                            {
                                                                                                label: tManager(
                                                                                                    "hoverOldestWait",
                                                                                                ),
                                                                                                value: tManager(
                                                                                                    "hoverMinutesShort",
                                                                                                    {
                                                                                                        count: st.oldestWaitMinutes,
                                                                                                    },
                                                                                                ),
                                                                                            },
                                                                                        ],
                                                                                    alertBox:
                                                                                        {
                                                                                            title: tManager(
                                                                                                "stationLoadLevel",
                                                                                            ),
                                                                                            value: tManager(
                                                                                                "hoverTicketsWaiting",
                                                                                                {
                                                                                                    count:
                                                                                                        st.queuedCount +
                                                                                                        st.inPrepCount,
                                                                                                },
                                                                                            ),
                                                                                            description:
                                                                                                tManager(
                                                                                                    "stationLoadDesc",
                                                                                                    {
                                                                                                        queued: st.queuedCount,
                                                                                                        prep: st.inPrepCount,
                                                                                                    },
                                                                                                ),
                                                                                        },
                                                                                    ticketLines:
                                                                                        (
                                                                                            st.tickets ??
                                                                                            []
                                                                                        ).map(
                                                                                            t => ({
                                                                                                id: t.orderItemId,
                                                                                                itemName:
                                                                                                    t.itemName,
                                                                                                quantity:
                                                                                                    t.quantity,
                                                                                                tableDisplayName:
                                                                                                    t.tableDisplayName,
                                                                                                waiterName:
                                                                                                    t.waiterName,
                                                                                                state: t.state,
                                                                                                waitMinutes:
                                                                                                    t.waitMinutes,
                                                                                            }),
                                                                                        ),
                                                                                },
                                                                            )
                                                                        }
                                                                        onMouseEnter={e => {
                                                                            const rect =
                                                                                e.currentTarget.getBoundingClientRect();
                                                                            setHoverTooltip(
                                                                                {
                                                                                    title: tManager(
                                                                                        "hoverStationBacklogTitle",
                                                                                        {
                                                                                            station:
                                                                                                st.stationName,
                                                                                        },
                                                                                    ),
                                                                                    badge: tManager(
                                                                                        "hoverTickets",
                                                                                        {
                                                                                            count:
                                                                                                st.queuedCount +
                                                                                                st.inPrepCount,
                                                                                        },
                                                                                    ),
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    rows: [
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverQueued",
                                                                                            ),
                                                                                            value: tManager(
                                                                                                "hoverTicketsQueued",
                                                                                                {
                                                                                                    count: st.queuedCount,
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverInPrep",
                                                                                            ),
                                                                                            value: tManager(
                                                                                                "hoverTicketsQueued",
                                                                                                {
                                                                                                    count: st.inPrepCount,
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverOldestWait",
                                                                                            ),
                                                                                            value: tManager(
                                                                                                "hoverMinutesShort",
                                                                                                {
                                                                                                    count: st.oldestWaitMinutes,
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                    ],
                                                                                    hint: tManager(
                                                                                        "hoverInspectStation",
                                                                                    ),
                                                                                    x: rect.left,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        6,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() =>
                                                                            setHoverTooltip(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="group/st flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-left text-[11px] transition-all hover:bg-muted/70 cursor-pointer"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                                            <span className="font-semibold text-foreground">
                                                                                {
                                                                                    st.stationName
                                                                                }
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                                (
                                                                                {
                                                                                    st.queuedCount
                                                                                }{" "}
                                                                                queued,{" "}
                                                                                {
                                                                                    st.inPrepCount
                                                                                }{" "}
                                                                                prep)
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground text-[10px]">
                                                                                Oldest{" "}
                                                                                {
                                                                                    st.oldestWaitMinutes
                                                                                }

                                                                                m
                                                                            </span>
                                                                            <ChevronRight className="size-3 text-muted-foreground group-hover/st:text-foreground transition-transform group-hover/st:translate-x-0.5" />
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* 5. STAFF OFFLINE */}
                                                {item.id === "staffOffline" &&
                                                    actNow?.staffOfflineItems &&
                                                    actNow.staffOfflineItems
                                                        .length > 0 && (
                                                        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2">
                                                            {actNow.staffOfflineItems.map(
                                                                staff => (
                                                                    <button
                                                                        key={
                                                                            staff.staffMembershipId
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInspectItem(
                                                                                {
                                                                                    kind: "staffOffline",
                                                                                    title: staff.staffName,
                                                                                    badge: staff.role,
                                                                                    badgeTone:
                                                                                        "bad",
                                                                                    details:
                                                                                        [
                                                                                            {
                                                                                                label: "Employee",
                                                                                                value: staff.staffName,
                                                                                            },
                                                                                            {
                                                                                                label: "Scheduled Role",
                                                                                                value: staff.role,
                                                                                            },
                                                                                            {
                                                                                                label: "Shift Start",
                                                                                                value: staff.shiftStartFormatted,
                                                                                            },
                                                                                            {
                                                                                                label: "Delay",
                                                                                                value: `+${staff.minutesLate} min late`,
                                                                                            },
                                                                                        ],
                                                                                    alertBox:
                                                                                        {
                                                                                            title: "Scheduled Staff Not Clocked In",
                                                                                            value: `+${staff.minutesLate} min late`,
                                                                                            description: `Shift was scheduled to begin at ${staff.shiftStartFormatted}`,
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        onMouseEnter={e => {
                                                                            const rect =
                                                                                e.currentTarget.getBoundingClientRect();
                                                                            setHoverTooltip(
                                                                                {
                                                                                    title: tManager(
                                                                                        "hoverStaffOfflineTitle",
                                                                                        {
                                                                                            name: staff.staffName,
                                                                                        },
                                                                                    ),
                                                                                    badge: staff.role,
                                                                                    badgeTone:
                                                                                        "bad",
                                                                                    rows: [
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverScheduledStart",
                                                                                            ),
                                                                                            value: staff.shiftStartFormatted,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverDelay",
                                                                                            ),
                                                                                            value: tManager(
                                                                                                "hoverMinutesLate",
                                                                                                {
                                                                                                    minutes:
                                                                                                        staff.minutesLate,
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                    ],
                                                                                    hint: tManager(
                                                                                        "hoverInspectAttendance",
                                                                                    ),
                                                                                    x: rect.left,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        6,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() =>
                                                                            setHoverTooltip(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="group/staff flex w-full items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-left text-[11px] transition-all hover:bg-destructive/10 hover:border-destructive/35 cursor-pointer"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                                            <span className="font-semibold text-foreground truncate">
                                                                                {
                                                                                    staff.staffName
                                                                                }
                                                                            </span>
                                                                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase">
                                                                                {
                                                                                    staff.role
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive text-[10px]">
                                                                                +
                                                                                {
                                                                                    staff.minutesLate
                                                                                }

                                                                                m
                                                                                late
                                                                            </span>
                                                                            <ChevronRight className="size-3 text-muted-foreground group-hover/staff:text-foreground transition-transform group-hover/staff:translate-x-0.5" />
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* 6. LOW STOCK */}
                                                {item.id === "lowStock" &&
                                                    actNow?.lowStockItems &&
                                                    actNow.lowStockItems
                                                        .length > 0 && (
                                                        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2">
                                                            {actNow.lowStockItems.map(
                                                                ing => (
                                                                    <button
                                                                        key={
                                                                            ing.ingredientId
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInspectItem(
                                                                                {
                                                                                    kind: "lowStock",
                                                                                    title: ing.ingredientName,
                                                                                    badge: "Low Stock",
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    details:
                                                                                        [
                                                                                            {
                                                                                                label: "Ingredient",
                                                                                                value: ing.ingredientName,
                                                                                            },
                                                                                            {
                                                                                                label: "Current On Hand",
                                                                                                value: `${ing.onHandQty} ${ing.unit}`,
                                                                                            },
                                                                                            {
                                                                                                label: "Reorder Par Level",
                                                                                                value: `${ing.parLevel} ${ing.unit}`,
                                                                                            },
                                                                                        ],
                                                                                    alertBox:
                                                                                        {
                                                                                            title: "Stock At or Below Par Level",
                                                                                            value: `${ing.onHandQty} ${ing.unit} remaining`,
                                                                                            description: `Par level is ${ing.parLevel} ${ing.unit}. Consider reordering or prep stock transfer.`,
                                                                                            progressPercent:
                                                                                                Math.min(
                                                                                                    100,
                                                                                                    Math.round(
                                                                                                        (ing.onHandQty /
                                                                                                            Math.max(
                                                                                                                0.1,
                                                                                                                ing.parLevel,
                                                                                                            )) *
                                                                                                            100,
                                                                                                    ),
                                                                                                ),
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        onMouseEnter={e => {
                                                                            const rect =
                                                                                e.currentTarget.getBoundingClientRect();
                                                                            setHoverTooltip(
                                                                                {
                                                                                    title: `${tManager("lowStock")}: ${ing.ingredientName}`,
                                                                                    badge: tManager(
                                                                                        "lowStock",
                                                                                    ),
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    rows: [
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverOnHand",
                                                                                            ),
                                                                                            value: `${ing.onHandQty} ${ing.unit}`,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverPar",
                                                                                            ),
                                                                                            value: `${ing.parLevel} ${ing.unit}`,
                                                                                        },
                                                                                    ],
                                                                                    hint: tManager(
                                                                                        "hoverInspectIngredient",
                                                                                    ),
                                                                                    x: rect.left,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        6,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() =>
                                                                            setHoverTooltip(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="group/ing flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-left text-[11px] transition-all hover:bg-amber-500/10 hover:border-amber-500/35 cursor-pointer"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                                            <span className="font-semibold text-foreground truncate">
                                                                                {
                                                                                    ing.ingredientName
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-700 dark:text-amber-400 text-[10px]">
                                                                                {
                                                                                    ing.onHandQty
                                                                                }

                                                                                /
                                                                                {
                                                                                    ing.parLevel
                                                                                }{" "}
                                                                                {
                                                                                    ing.unit
                                                                                }
                                                                            </span>
                                                                            <ChevronRight className="size-3 text-muted-foreground group-hover/ing:text-foreground transition-transform group-hover/ing:translate-x-0.5" />
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* 7. UNPAID TODAY */}
                                                {item.id === "unpaidToday" &&
                                                    actNow?.unpaidBillItems &&
                                                    actNow.unpaidBillItems
                                                        .length > 0 && (
                                                        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2">
                                                            {actNow.unpaidBillItems.map(
                                                                b => (
                                                                    <button
                                                                        key={
                                                                            b.billId
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInspectItem(
                                                                                {
                                                                                    kind: "unpaidToday",
                                                                                    title: `Bill ${b.tableDisplayName}`,
                                                                                    badge: "Unpaid Balance",
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    details:
                                                                                        [
                                                                                            {
                                                                                                label: "Table",
                                                                                                value: b.tableDisplayName,
                                                                                            },
                                                                                            {
                                                                                                label: "Total Check",
                                                                                                value: b.totalAmountFormatted,
                                                                                            },
                                                                                            {
                                                                                                label: "Unpaid Gap",
                                                                                                value: b.unpaidAmountFormatted,
                                                                                            },
                                                                                            {
                                                                                                label: "Billed At",
                                                                                                value: new Date(
                                                                                                    b.billedAt,
                                                                                                ).toLocaleTimeString(
                                                                                                    [],
                                                                                                    {
                                                                                                        hour: "2-digit",
                                                                                                        minute: "2-digit",
                                                                                                    },
                                                                                                ),
                                                                                            },
                                                                                        ],
                                                                                    alertBox:
                                                                                        {
                                                                                            title: "Uncollected Bill Amount",
                                                                                            value: b.unpaidAmountFormatted,
                                                                                            description: `Total check amount: ${b.totalAmountFormatted}`,
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        onMouseEnter={e => {
                                                                            const rect =
                                                                                e.currentTarget.getBoundingClientRect();
                                                                            setHoverTooltip(
                                                                                {
                                                                                    title: tManager(
                                                                                        "hoverUnpaidCheckTitle",
                                                                                        {
                                                                                            table: b.tableDisplayName,
                                                                                        },
                                                                                    ),
                                                                                    badge: tManager(
                                                                                        "hoverDue",
                                                                                    ),
                                                                                    badgeTone:
                                                                                        "warn",
                                                                                    rows: [
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverUnpaidDue",
                                                                                            ),
                                                                                            value: b.unpaidAmountFormatted,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverTotalBill",
                                                                                            ),
                                                                                            value: b.totalAmountFormatted,
                                                                                        },
                                                                                        {
                                                                                            label: tManager(
                                                                                                "hoverTime",
                                                                                            ),
                                                                                            value: new Date(
                                                                                                b.billedAt,
                                                                                            ).toLocaleTimeString(
                                                                                                [],
                                                                                                {
                                                                                                    hour: "2-digit",
                                                                                                    minute: "2-digit",
                                                                                                },
                                                                                            ),
                                                                                        },
                                                                                    ],
                                                                                    hint: tManager(
                                                                                        "hoverInspectCheck",
                                                                                    ),
                                                                                    x: rect.left,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        6,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() =>
                                                                            setHoverTooltip(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="group/b flex w-full items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-left text-[11px] transition-all hover:bg-primary/10 hover:border-primary/35 cursor-pointer"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                                            <span className="font-semibold text-foreground truncate">
                                                                                {
                                                                                    b.tableDisplayName
                                                                                }
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                                (Total:{" "}
                                                                                {
                                                                                    b.totalAmountFormatted
                                                                                }

                                                                                )
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-semibold text-primary text-[10px]">
                                                                                Due{" "}
                                                                                {
                                                                                    b.unpaidAmountFormatted
                                                                                }
                                                                            </span>
                                                                            <ChevronRight className="size-3 text-muted-foreground group-hover/b:text-foreground transition-transform group-hover/b:translate-x-0.5" />
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {isToday ? (
                    <HourlySalesChart
                        data={dash?.hourlySales ?? []}
                        timezone={dash?.timezone}
                    />
                ) : (
                    <PaymentMixTrendChart data={dash?.paymentMixTrend ?? []} />
                )}
                <StationThroughputChart data={dash?.stationThroughput ?? []} />
            </div>

            {isToday ? (
                <PaymentMixTrendChart data={dash?.paymentMixTrend ?? []} />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
                <PrepDurationBucketsChart
                    stations={dash?.stationPrepAvg ?? []}
                    avgSpeed={kpis?.avgPrepTimeFormatted}
                />
                <WeeklyCashMovementChart movement={dash?.weeklyCashMovement} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <PaymentChannelsBreakdown channels={dash?.paymentChannels} />
                <TopDishesLeaderboard dishes={dash?.topDishes} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <WaiterPerformanceTable rows={dash?.waiterPerformance ?? []} />
                <FloorSnapshotTable tables={floor?.data ?? []} />
            </div>

            <RecentAuditTable events={audit?.data ?? []} />

            {/* Unified Floating Detail Tooltip */}
            {hoverTooltip && (
                <div
                    className="fixed z-[90] pointer-events-none -translate-x-2 w-72 rounded-xl border border-border bg-popover/95 p-3 text-popover-foreground shadow-2xl backdrop-blur-md text-xs animate-in fade-in duration-150"
                    style={{
                        top: Math.min(
                            hoverTooltip.y,
                            typeof window !== "undefined"
                                ? window.innerHeight - 240
                                : 300,
                        ),
                        left: Math.max(
                            12,
                            Math.min(
                                hoverTooltip.x,
                                typeof window !== "undefined"
                                    ? window.innerWidth - 300
                                    : 200,
                            ),
                        ),
                    }}
                >
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5 mb-2">
                        <span
                            className={cn(
                                "font-semibold flex items-center gap-1.5 truncate text-xs",
                                hoverTooltip.badgeTone === "bad"
                                    ? "text-destructive"
                                    : hoverTooltip.badgeTone === "warn"
                                      ? "text-amber-700 dark:text-amber-400"
                                      : "text-foreground",
                            )}
                        >
                            <Clock3 className="size-3.5 shrink-0" />
                            <span className="truncate">
                                {hoverTooltip.title}
                            </span>
                        </span>
                        {hoverTooltip.badge && (
                            <span
                                className={cn(
                                    "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0",
                                    hoverTooltip.badgeTone === "bad"
                                        ? "bg-destructive/15 text-destructive"
                                        : hoverTooltip.badgeTone === "warn"
                                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                          : "bg-muted text-muted-foreground",
                                )}
                            >
                                {hoverTooltip.badge}
                            </span>
                        )}
                    </div>
                    <div className="space-y-1 text-muted-foreground text-[11px]">
                        {hoverTooltip.rows.map((row, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center gap-2"
                            >
                                <span className="shrink-0">{row.label}:</span>
                                <span
                                    className={cn(
                                        "font-medium truncate text-right",
                                        row.highlight
                                            ? "text-primary font-semibold"
                                            : "text-foreground",
                                    )}
                                >
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground text-center font-medium">
                        {hoverTooltip.hint ?? "Click to inspect details"}
                    </p>
                </div>
            )}

            {/* Unified Act Now Inspection Modal — above period filters (z-55) + calendar popover (z-70) */}
            {inspectItem && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setInspectItem(null)}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                            inspectItem.badgeTone === "bad"
                                                ? "bg-destructive/15 text-destructive"
                                                : inspectItem.badgeTone ===
                                                    "warn"
                                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                                  : "bg-primary/15 text-primary",
                                        )}
                                    >
                                        <AlertTriangle className="size-3.5" />
                                        {inspectItem.badge}
                                    </span>
                                </div>
                                <h3 className="mt-2 text-lg font-bold tracking-tight text-foreground truncate">
                                    {inspectItem.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInspectItem(null)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Content Details */}
                        <div className="mt-4 space-y-4 text-xs">
                            {/* Alert Box (if present) */}
                            {inspectItem.alertBox && (
                                <div
                                    className={cn(
                                        "rounded-xl border p-4",
                                        inspectItem.badgeTone === "bad"
                                            ? "border-destructive/20 bg-destructive/5"
                                            : "border-amber-500/20 bg-amber-500/5",
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={cn(
                                                "font-semibold flex items-center gap-1.5",
                                                inspectItem.badgeTone === "bad"
                                                    ? "text-destructive"
                                                    : "text-amber-700 dark:text-amber-400",
                                            )}
                                        >
                                            <Clock3 className="size-4" />
                                            {inspectItem.alertBox.title}
                                        </span>
                                        <span
                                            className={cn(
                                                "font-bold text-sm",
                                                inspectItem.badgeTone === "bad"
                                                    ? "text-destructive"
                                                    : "text-amber-700 dark:text-amber-400",
                                            )}
                                        >
                                            {inspectItem.alertBox.value}
                                        </span>
                                    </div>

                                    {inspectItem.alertBox.description && (
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            {inspectItem.alertBox.description}
                                        </p>
                                    )}

                                    {inspectItem.alertBox.progressPercent !==
                                        undefined && (
                                        <div className="mt-3">
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        inspectItem.badgeTone ===
                                                            "bad"
                                                            ? "bg-destructive"
                                                            : "bg-amber-500",
                                                    )}
                                                    style={{
                                                        width: `${Math.min(100, inspectItem.alertBox.progressPercent)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Key-Value Details Grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                                {inspectItem.details.map((detail, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl border border-border bg-muted/30 p-2.5"
                                    >
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                            {detail.label}
                                        </p>
                                        <p
                                            className={cn(
                                                "mt-0.5 font-semibold truncate text-[12px]",
                                                detail.highlight
                                                    ? "text-primary"
                                                    : "text-foreground",
                                            )}
                                        >
                                            {detail.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Notes / Special Instructions (if present) */}
                            {inspectItem.notes && (
                                <div className="space-y-1 rounded-xl border border-border bg-muted/20 p-3">
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Notes / Description:{" "}
                                    </span>
                                    <p className="text-[11px] italic text-foreground mt-0.5">
                                        "{inspectItem.notes}"
                                    </p>
                                </div>
                            )}

                            {inspectItem.ticketLines &&
                            inspectItem.ticketLines.length > 0 ? (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        {tManager("backlogTickets")}
                                    </p>
                                    <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
                                        {inspectItem.ticketLines.map(line => (
                                            <li
                                                key={line.id}
                                                className="rounded-lg border border-border bg-muted/25 px-2.5 py-2"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[12px] font-semibold text-foreground">
                                                            {line.quantity}×{" "}
                                                            {line.itemName}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                            {
                                                                line.tableDisplayName
                                                            }{" "}
                                                            · {line.waiterName}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                                                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium uppercase text-muted-foreground">
                                                            {line.state ===
                                                            "IN_PREPARATION"
                                                                ? tManager(
                                                                      "hoverInPrep",
                                                                  )
                                                                : tManager(
                                                                      "hoverQueued",
                                                                  )}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                                            {tManager(
                                                                "hoverMinutesShort",
                                                                {
                                                                    count: line.waitMinutes,
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>

                        {/* Actions: Strictly in-place close without page redirect */}
                        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
                            <button
                                type="button"
                                onClick={() => setInspectItem(null)}
                                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardFrame>
    );
}
