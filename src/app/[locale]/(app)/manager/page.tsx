"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    Ban,
    ChartNoAxesCombined,
    CircleDollarSign,
    Clock3,
    CookingPot,
    Radio,
    Receipt,
    RefreshCw,
    ShoppingBag,
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
    type ManagerDashboardPeriod,
    useGetManagerDashboardQuery,
} from "@/context/services/managerDashboardApi";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { cn } from "@/lib/utils";

const POLL_DASH = 10000;
const POLL_FLOOR = 8000;
const POLL_AUDIT = 15000;

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
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const queryArg = useMemo(() => {
        if (period === "custom") {
            if (!fromDate || !toDate) return { period: "today" as const };
            return { period, fromDate, toDate };
        }
        return { period };
    }, [period, fromDate, toDate]);

    const { data, isLoading, isFetching, error } = useGetManagerDashboardQuery(
        queryArg,
        { pollingInterval: POLL_DASH },
    );
    const { data: audit } = useListAuditEventsQuery(
        { page: 1, limit: 8 },
        { pollingInterval: POLL_AUDIT },
    );
    const { data: floor } = useFloorTablesQuery(undefined, {
        pollingInterval: POLL_FLOOR,
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

    const applyCustom = () => {
        if (!customFrom || !customTo) return;
        setFromDate(customFrom);
        setToDate(customTo);
        setPeriod("custom");
    };

    const collectionsTrend =
        kpis?.collectionsTrend ?? kpis?.dailyRevenueTrend ?? "0%";
    const collectionsTrendLabel =
        kpis?.collectionsTrendLabel ??
        (isToday
            ? tManager("vsCollectedYesterday")
            : tManager("vsPriorPeriod"));

    const pendingCount = Number(kpis?.pendingActionsFormatted ?? "0") || 0;
    const backlogCount = Number(kpis?.stationBacklogFormatted ?? "0") || 0;
    const actNow = dash?.actNow;

    const statusItems = [
        {
            title: tManager("needsAttention"),
            count: pendingCount,
            meta: kpis?.pendingActionsHint ?? tManager("nothingWaiting"),
            tone: pendingCount > 0 ? ("warn" as const) : ("ok" as const),
            href: "/manager/approvals",
        },
        {
            title: tManager("stationBacklog"),
            count: backlogCount,
            meta: kpis?.stationBacklogHint ?? tManager("stationsClear"),
            tone: backlogCount > 0 ? ("warn" as const) : ("ok" as const),
            href: "/manager/stations",
        },
        {
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

            <div className="flex flex-col gap-2">
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
                            onClick={applyCustom}
                            disabled={!customFrom || !customTo}
                            className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {tManager("applyRange")}
                        </button>
                    </div>
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
                                            <Link
                                                href={item.href}
                                                className="block rounded-xl border border-border p-3 transition-colors hover:border-primary/40"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-[13px] font-medium">
                                                        {item.title}
                                                        <span className="ml-1.5 tabular-nums text-muted-foreground">
                                                            ({item.count})
                                                        </span>
                                                    </p>
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
                                            </Link>
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
        </DashboardFrame>
    );
}
