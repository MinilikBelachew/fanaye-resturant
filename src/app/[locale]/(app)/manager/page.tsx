"use client";

import { useMemo, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    HourlySalesChart,
    OrderVolumeChart,
    PaymentChannelsBreakdown,
    PrepDurationBucketsChart,
    RevenueVsCollectionsChart,
    StationThroughputChart,
    TopDishesLeaderboard,
    WeeklyCashMovementChart,
} from "@/components/custom/organisms/Charts";
import {
    FloorSnapshotTable,
    PaymentChannelsTable,
    RecentAuditTable,
    SalesTrendTable,
    TopDishesTable,
} from "@/domains/reporting/ui/ManagerDashboardTables";
import { useListAuditEventsQuery } from "@/context/services/auditApi";
import { useFloorTablesQuery } from "@/context/services/floorApi";
import {
    type ManagerDashboardPeriod,
    useGetManagerDashboardQuery,
} from "@/context/services/managerDashboardApi";
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
        dash?.kpis.collectionsTrend ?? dash?.kpis.dailyRevenueTrend ?? "0%";
    const collectionsTrendLabel =
        dash?.kpis.collectionsTrendLabel ??
        (isToday
            ? tManager("vsCollectedYesterday")
            : tManager("vsPriorPeriod"));

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
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label={
                                isToday
                                    ? tManager("collectedToday")
                                    : tManager("collected")
                            }
                            value={dash?.kpis.collectionsFormatted ?? "ETB 0"}
                            trend={{
                                value: collectionsTrend,
                                direction: collectionsTrend.startsWith("+")
                                    ? "up"
                                    : collectionsTrend.startsWith("-")
                                      ? "down"
                                      : "neutral",
                                label: collectionsTrendLabel,
                            }}
                            sparkline={{
                                badge:
                                    dash?.kpis.tinaVerifyMixPercentage || "0%",
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label={tManager("openTables")}
                            value={dash?.kpis.activeTablesFormatted ?? "0 / 0"}
                            trend={{
                                value:
                                    dash?.kpis.floorCapacityPercentage ?? "0%",
                                direction: "neutral",
                                label: tManager("floorCapacity"),
                            }}
                            sparkline={{
                                badge:
                                    dash?.kpis.floorCapacityPercentage || "0%",
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label={tManager("stationBacklog")}
                            value={dash?.kpis.stationBacklogFormatted ?? "0"}
                            hint={
                                dash?.kpis.stationBacklogHint ??
                                tManager("stationsClear")
                            }
                            sparkline={{
                                badge:
                                    dash?.kpis.avgPrepTimeFormatted ?? "0 min",
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label={tManager("needsAttention")}
                            value={dash?.kpis.pendingActionsFormatted ?? "0"}
                            hint={
                                dash?.kpis.pendingActionsHint ??
                                tManager("nothingWaiting")
                            }
                            sparkline={{
                                badge:
                                    dash?.kpis.pendingActionsHint ||
                                    tManager("nothingWaiting"),
                                color: "#c2410c",
                                variant: "wave4",
                            }}
                            tone="brand"
                        />
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label={tManager("netBilled")}
                            value={dash?.kpis.billedFormatted ?? "ETB 0"}
                            trend={{
                                value:
                                    dash?.kpis.collectionGapFormatted ??
                                    "ETB 0",
                                direction: "neutral",
                                label: tManager("collectionGap"),
                            }}
                            sparkline={{
                                badge: dash?.kpis.avgCheckFormatted ?? "0",
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label={tManager("avgCheck")}
                            value={dash?.kpis.avgCheckFormatted ?? "ETB 0"}
                            trend={{
                                value: dash?.kpis.ordersFormatted ?? "0",
                                direction: "neutral",
                                label: isToday
                                    ? tManager("ordersToday")
                                    : tManager("ordersInPeriod"),
                            }}
                            sparkline={{
                                badge: dash?.kpis.coversFormatted ?? "0",
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label={tManager("covers")}
                            value={dash?.kpis.coversFormatted ?? "0"}
                            hint={
                                isToday
                                    ? tManager("guestsSeatedToday")
                                    : tManager("guestsInPeriod")
                            }
                            sparkline={{
                                badge: dash?.kpis.coversFormatted ?? "0",
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label={tManager("avgPrep")}
                            value={dash?.kpis.avgPrepTimeFormatted ?? "0 min"}
                            trend={{
                                value: dash?.kpis.avgPrepTimeTrend ?? "0%",
                                direction: "neutral",
                                label:
                                    dash?.kpis.avgPrepTimeTrendLabel ??
                                    tManager("fulfillment"),
                            }}
                            sparkline={{
                                badge:
                                    dash?.kpis.avgPrepTimeFormatted?.replace(
                                        " min",
                                        "",
                                    ) ?? "0",
                                color: "#c2410c",
                                variant: "wave4",
                            }}
                            tone="brand"
                        />
                    </div>
                </>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueVsCollectionsChart data={dash?.salesTrend} />
                </div>
                <div className="lg:col-span-1">
                    <PaymentChannelsBreakdown
                        channels={dash?.paymentChannels}
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <HourlySalesChart
                    data={dash?.hourlySales ?? []}
                    timezone={dash?.timezone}
                />
                <OrderVolumeChart data={dash?.orderVolumeTrend ?? []} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <PrepDurationBucketsChart
                    buckets={dash?.prepBuckets}
                    avgSpeed={dash?.kpis.avgPrepTimeFormatted}
                />
                <WeeklyCashMovementChart movement={dash?.weeklyCashMovement} />
                <StationThroughputChart data={dash?.stationThroughput ?? []} />
            </div>

            <TopDishesLeaderboard dishes={dash?.topDishes} />

            <div className="grid gap-4 xl:grid-cols-2">
                <SalesTrendTable data={dash?.salesTrend} />
                <PaymentChannelsTable channels={dash?.paymentChannels} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <TopDishesTable dishes={dash?.topDishes} />
                <FloorSnapshotTable tables={floor?.data ?? []} />
            </div>

            <RecentAuditTable events={audit?.data ?? []} />
        </DashboardFrame>
    );
}
