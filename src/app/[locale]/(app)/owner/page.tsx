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
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import { useAppSelector } from "@/context/hooks";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { cn } from "@/lib/utils";

const POLL_DASH = 10000;

export default function OwnerPage() {
    const session = useAppSelector(state => state.identity.session);
    const { data, isLoading, isFetching, error } = useGetManagerDashboardQuery(
        undefined,
        { pollingInterval: POLL_DASH },
    );
    const { data: site } = useGetTenantSiteQuery();
    const dash = data?.data;
    const restaurantName =
        site?.data?.tenantName ||
        session?.branchName ||
        dash?.branchName ||
        "Your restaurant";

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Business"
                    title="Owner Dashboard"
                    description={
                        dash
                            ? `${restaurantName} · ${dash.branchName} · ${dash.businessDate}`
                            : "Live revenue, collections, floor, and station performance."
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
                    {error ? "Offline" : "Live"}
                    {isFetching ? (
                        <RefreshCw className="size-3 animate-spin" />
                    ) : null}
                </div>
            </div>

            {error ? (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    Unable to load owner telemetry. Check connection and
                    permissions.
                </div>
            ) : null}

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
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label="Open tables"
                            value={dash?.kpis.activeTablesFormatted ?? "0 / 0"}
                            trend={{
                                value:
                                    dash?.kpis.floorCapacityPercentage ?? "0%",
                                direction: "neutral",
                                label: "floor occupancy",
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
                            label="Needs attention"
                            value={dash?.kpis.pendingActionsFormatted ?? "0"}
                            hint={
                                dash?.kpis.pendingActionsHint ??
                                "nothing waiting"
                            }
                            sparkline={{
                                badge:
                                    dash?.kpis.stationBacklogFormatted ?? "0",
                                color: "#c2410c",
                                variant: "wave4",
                            }}
                            tone="brand"
                        />
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
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
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label="Covers"
                            value={dash?.kpis.coversFormatted ?? "0"}
                            hint="guests seated today"
                            sparkline={{
                                badge: dash?.kpis.coversFormatted ?? "0",
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label="TinaVerify mix"
                            value={dash?.kpis.tinaVerifyMixPercentage ?? "0%"}
                            trend={{
                                value: dash?.kpis.tinaVerifyTrend ?? "0%",
                                direction: "neutral",
                                label:
                                    dash?.kpis.tinaVerifyTrendLabel ??
                                    "digital verified",
                            }}
                            sparkline={{
                                badge:
                                    dash?.kpis.tinaVerifyMixPercentage || "0%",
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
                                    "kitchen speed",
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
                <div className="min-w-0 lg:col-span-2">
                    <RevenueVsCollectionsChart data={dash?.salesTrend} />
                </div>
                <div className="min-w-0">
                    <PaymentChannelsBreakdown
                        channels={dash?.paymentChannels}
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                    <HourlySalesChart data={dash?.hourlySales ?? []} />
                </div>
                <div className="min-w-0">
                    <OrderVolumeChart data={dash?.orderVolumeTrend ?? []} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <PrepDurationBucketsChart
                    buckets={dash?.prepBuckets}
                    avgSpeed={dash?.kpis.avgPrepTimeFormatted}
                />
                <WeeklyCashMovementChart movement={dash?.weeklyCashMovement} />
                <StationThroughputChart data={dash?.stationThroughput ?? []} />
            </div>

            <TopDishesLeaderboard dishes={dash?.topDishes} />

            <div className="space-y-3">
                <div>
                    <h3 className="text-[16px] font-semibold tracking-tight sm:text-[17px]">
                        Live floor
                    </h3>
                    <p className="text-[12px] text-slate-gray sm:text-[13px]">
                        Tables, waiters, and billing state for{" "}
                        {dash?.branchName ?? "this branch"}
                    </p>
                </div>
                <LiveFloorBoard />
            </div>
        </DashboardFrame>
    );
}
