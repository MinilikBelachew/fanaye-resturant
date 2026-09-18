"use client";

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
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { useTranslations } from "next-intl";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { cn } from "@/lib/utils";

const POLL_DASH = 10000;
const POLL_FLOOR = 8000;
const POLL_AUDIT = 15000;

export default function ManagerPage() {
    const tManager = useTranslations("manager");
    const tNav = useTranslations("appNav");
    const tRoles = useTranslations("roles");
    const tTopBar = useTranslations("topbar");
    const { data, isLoading, isFetching, error } = useGetManagerDashboardQuery(
        undefined,
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

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow={tNav("house")}
                    title={`${tRoles("manager")} ${tTopBar("dashboard")}`}
                    description={
                        dash
                            ? `${dash.branchName} · Live for ${dash.businessDate}`
                            : "Live revenue, floor, and station telemetry."
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
                    {error ? "Offline" : "Auto-updating"}
                    {isFetching ? (
                        <RefreshCw className="size-3 animate-spin" />
                    ) : null}
                </div>
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    Unable to load live telemetry. Check connection and
                    permissions.
                </div>
            )}

            {isLoading ? (
                <KpiStatsSkeleton />
            ) : (
                <>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Collected today"
                            value={dash?.kpis.collectionsFormatted ?? "ETB 0"}
                            trend={{
                                value: dash?.kpis.dailyRevenueTrend ?? "0%",
                                direction:
                                    dash?.kpis.dailyRevenueTrend?.startsWith(
                                        "+",
                                    )
                                        ? "up"
                                        : "neutral",
                                label: "vs billed / yesterday",
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
                            label="Open tables"
                            value={dash?.kpis.activeTablesFormatted ?? "0 / 0"}
                            trend={{
                                value:
                                    dash?.kpis.floorCapacityPercentage ?? "0%",
                                direction: "neutral",
                                label: "floor capacity",
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
                            label="Station backlog"
                            value={dash?.kpis.stationBacklogFormatted ?? "0"}
                            hint={
                                dash?.kpis.stationBacklogHint ??
                                "stations clear"
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
                            label="Needs attention"
                            value={dash?.kpis.pendingActionsFormatted ?? "0"}
                            hint={
                                dash?.kpis.pendingActionsHint ??
                                "nothing waiting"
                            }
                            sparkline={{
                                badge: tManager("tinaVerifyMix"),
                                color: "#c2410c",
                                variant: "wave4",
                            }}
                            tone="brand"
                        />
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Net billed"
                            value={dash?.kpis.billedFormatted ?? "ETB 0"}
                            trend={{
                                value:
                                    dash?.kpis.collectionGapFormatted ??
                                    "ETB 0",
                                direction: "neutral",
                                label: "collection gap",
                            }}
                            sparkline={{
                                badge: dash?.kpis.avgCheckFormatted ?? "0",
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label="Avg check"
                            value={dash?.kpis.avgCheckFormatted ?? "ETB 0"}
                            trend={{
                                value: dash?.kpis.ordersFormatted ?? "0",
                                direction: "neutral",
                                label: "orders today",
                            }}
                            sparkline={{
                                badge: dash?.kpis.coversFormatted ?? "0",
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label="Covers"
                            value={dash?.kpis.coversFormatted ?? "0"}
                            hint="guests seated today"
                            sparkline={{
                                badge: dash?.kpis.coversFormatted ?? "0",
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label="Avg prep"
                            value={dash?.kpis.avgPrepTimeFormatted ?? "0 min"}
                            trend={{
                                value: dash?.kpis.avgPrepTimeTrend ?? "0%",
                                direction: "neutral",
                                label:
                                    dash?.kpis.avgPrepTimeTrendLabel ??
                                    "fulfillment",
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
                <HourlySalesChart data={dash?.hourlySales ?? []} />
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
