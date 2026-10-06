"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    Building2,
    ChartNoAxesCombined,
    CookingPot,
    LayoutGrid,
    Radio,
    RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    HourlySalesChart,
    PaymentChannelsBreakdown,
    RevenueVsCollectionsChart,
    StationThroughputChart,
    TopDishesLeaderboard,
} from "@/components/custom/organisms/Charts";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";
import {
    type ManagerDashboardPeriod,
    useGetManagerDashboardQuery,
} from "@/context/services/managerDashboardApi";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import { useAppSelector } from "@/context/hooks";
import { Link } from "@/i18n/navigation";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { cn } from "@/lib/utils";

const POLL_DASH = 10000;

const PERIODS: ManagerDashboardPeriod[] = [
    "today",
    "week",
    "month",
    "quarter",
    "year",
    "custom",
];

export default function OwnerPage() {
    const tManager = useTranslations("manager");
    const tOwner = useTranslations("owner");
    const tCommon = useTranslations("common");
    const session = useAppSelector(state => state.identity.session);

    const [period, setPeriod] = useState<ManagerDashboardPeriod>("today");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [scope, setScope] = useState<"branch" | "all">("all");

    const queryArg = useMemo(() => {
        const base = {
            scope,
            ...(period === "custom"
                ? fromDate && toDate
                    ? { period, fromDate, toDate }
                    : { period: "today" as const }
                : { period }),
        };
        return base;
    }, [period, fromDate, toDate, scope]);

    const { data, isLoading, isFetching, error } = useGetManagerDashboardQuery(
        queryArg,
        { pollingInterval: POLL_DASH },
    );
    const { data: site } = useGetTenantSiteQuery();
    const dash = data?.data;
    const isToday = (dash?.period ?? period) === "today";
    const isAllBranches = scope === "all";

    const restaurantName =
        site?.data?.tenantName ||
        session?.branchName ||
        dash?.branchName ||
        tManager("yourRestaurant");

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

    const pendingCount = Number(
        String(dash?.kpis.pendingActionsFormatted ?? "0").replace(
            /[^\d]/g,
            "",
        ) || "0",
    );
    const backlogCount = Number(
        String(dash?.kpis.stationBacklogFormatted ?? "0").replace(
            /[^\d]/g,
            "",
        ) || "0",
    );

    const statusItems = [
        {
            title: tManager("needsAttention"),
            meta: `${dash?.kpis.pendingActionsFormatted ?? "0"} pending`,
            tone: pendingCount > 0 ? ("warn" as const) : ("ok" as const),
            href: "/owner/live",
        },
        {
            title: tManager("stationBacklog"),
            meta: `${dash?.kpis.stationBacklogFormatted ?? "0"} tickets`,
            tone: backlogCount > 5 ? ("warn" as const) : ("ok" as const),
            href: "/owner/live",
        },
        {
            title: tManager("openTables"),
            meta: `${dash?.kpis.activeTablesFormatted ?? "0 / 0"} · ${dash?.kpis.floorCapacityPercentage ?? "0%"}`,
            tone: "ok" as const,
            href: "/owner/live",
        },
        {
            title: tManager("collectionGap"),
            meta: dash?.kpis.collectionGapFormatted ?? "ETB 0",
            tone: "ok" as const,
            href: "/owner/branches",
        },
    ];

    const toneClass = {
        ok: "border-primary/20 text-primary bg-primary/5",
        warn: "border-border text-foreground bg-muted/40",
        bad: "border-destructive/25 text-destructive bg-destructive/5",
    };

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Business"
                    title="Owner Dashboard"
                    description={
                        dash
                            ? tOwner("dashboardRange", {
                                  restaurant: restaurantName,
                                  branch: dash.branchName,
                                  label: dash.periodLabel ?? dash.businessDate,
                              })
                            : tManager("ownerLiveDescription")
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
                    {error ? tCommon("offline") : tCommon("live")}
                    {isFetching ? (
                        <RefreshCw className="size-3 animate-spin" />
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-full border border-hairline bg-card p-1">
                        <button
                            type="button"
                            onClick={() => setScope("all")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                                scope === "all"
                                    ? "bg-brand text-white"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Building2 className="size-3.5" />
                            {tOwner("allBranches")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setScope("branch")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                                scope === "branch"
                                    ? "bg-brand text-white"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {tOwner("thisBranch")}
                            {session?.branchName ? (
                                <span className="opacity-80">
                                    · {session.branchName}
                                </span>
                            ) : null}
                        </button>
                    </div>
                </div>

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
                {scope === "branch" ? (
                    <p className="text-[12px] text-slate-gray">
                        {tOwner("useBranchSwitcherHint")}
                    </p>
                ) : (
                    <p className="text-[12px] text-slate-gray">
                        {tOwner("allBranchesHint")}
                    </p>
                )}
            </div>

            {error ? (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    {tManager("ownerLoadError")}
                </div>
            ) : null}

            {isLoading ? (
                <KpiStatsSkeleton />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        accent
                        label={
                            isToday
                                ? tManager("collectedToday")
                                : tManager("collected")
                        }
                        value={dash?.kpis.collectionsFormatted ?? "ETB 0"}
                        hint={
                            isToday
                                ? tManager("vsCollectedYesterday")
                                : tManager("vsPriorPeriod")
                        }
                        icon={<ChartNoAxesCombined className="size-3.5" />}
                        trend={{
                            value:
                                dash?.kpis.collectionsTrend ??
                                dash?.kpis.dailyRevenueTrend ??
                                "0%",
                            direction: (
                                dash?.kpis.collectionsTrend ??
                                dash?.kpis.dailyRevenueTrend ??
                                ""
                            ).startsWith("+")
                                ? "up"
                                : (
                                        dash?.kpis.collectionsTrend ??
                                        dash?.kpis.dailyRevenueTrend ??
                                        ""
                                    ).startsWith("-")
                                  ? "down"
                                  : "neutral",
                        }}
                        sparkline={null}
                    />
                    <KpiCard
                        label={tManager("openTables")}
                        value={dash?.kpis.activeTablesFormatted ?? "0 / 0"}
                        hint={tManager("floorOccupancy")}
                        icon={<LayoutGrid className="size-3.5" />}
                        trend={{
                            value: dash?.kpis.floorCapacityPercentage ?? "0%",
                            direction: "neutral",
                        }}
                        sparkline={null}
                    />
                    <KpiCard
                        label={tManager("stationBacklog")}
                        value={dash?.kpis.stationBacklogFormatted ?? "0"}
                        hint={
                            dash?.kpis.stationBacklogHint ??
                            tManager("stationsClear")
                        }
                        icon={<CookingPot className="size-3.5" />}
                        sparkline={null}
                    />
                    <KpiCard
                        label={tManager("needsAttention")}
                        value={dash?.kpis.pendingActionsFormatted ?? "0"}
                        hint={
                            dash?.kpis.pendingActionsHint ??
                            tManager("nothingWaiting")
                        }
                        icon={<AlertTriangle className="size-3.5" />}
                        sparkline={null}
                    />
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-4">
                    <StationThroughputChart
                        data={dash?.stationThroughput ?? []}
                    />
                </div>
                <div className="min-w-0 lg:col-span-5">
                    <RevenueVsCollectionsChart data={dash?.salesTrend} />
                </div>
                <section className="rounded-2xl border border-border bg-background p-5 lg:col-span-3">
                    <div className="mb-4">
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
                    <ul className="space-y-3">
                        {statusItems.map(item => (
                            <li key={item.title}>
                                <Link
                                    href={item.href}
                                    className="block rounded-xl border border-border p-3 transition-colors hover:border-primary/40"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[13px] font-medium">
                                            {item.title}
                                        </p>
                                        <span
                                            className={cn(
                                                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                                                toneClass[item.tone],
                                            )}
                                        >
                                            {item.tone === "ok"
                                                ? "Clear"
                                                : "Watch"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {item.meta}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <HourlySalesChart data={dash?.hourlySales ?? []} />
                <PaymentChannelsBreakdown channels={dash?.paymentChannels} />
            </div>

            <TopDishesLeaderboard dishes={dash?.topDishes} />

            <div className="space-y-3">
                <div>
                    <h3 className="text-[16px] font-semibold tracking-tight sm:text-[17px]">
                        {tManager("liveFloor")}
                    </h3>
                    <p className="text-[12px] text-slate-gray sm:text-[13px]">
                        {isAllBranches
                            ? tOwner("liveFloorAllBranchesHint")
                            : tManager("liveFloorDesc", {
                                  branch:
                                      dash?.branchName ??
                                      tManager("thisBranch"),
                              })}
                    </p>
                </div>
                {isAllBranches ? (
                    <div className="rounded-2xl border border-dashed border-hairline bg-card px-5 py-10 text-center text-[13px] text-slate-gray">
                        {tOwner("switchToBranchForFloor")}
                    </div>
                ) : (
                    <LiveFloorBoard />
                )}
            </div>
        </DashboardFrame>
    );
}
