"use client";

import { RefreshCw } from "lucide-react";
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
    PaymentChannelsTable,
    SalesTrendTable,
    TopDishesTable,
} from "@/domains/reporting/ui/ManagerDashboardTables";
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";

export default function ManagerReportsPage() {
    const { data, isLoading, isFetching, isError, refetch } =
        useGetManagerDashboardQuery(undefined, { pollingInterval: 15000 });
    const dash = data?.data;
    const k = dash?.kpis;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Control"
                    title="Reports"
                    description={
                        dash
                            ? `Live ops for ${dash.branchName} · ${dash.businessDate}`
                            : "Queue time, prep time, and payment mix for tonight."
                    }
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        void refetch().then(result => {
                            if (result.error) {
                                toast.fromUnknown(
                                    result.error,
                                    "Could not refresh reports.",
                                );
                                return;
                            }
                            toast.success("Reports refreshed");
                        });
                    }}
                    disabled={isFetching}
                    className="self-start gap-2 rounded-full text-xs font-medium sm:self-auto"
                >
                    <RefreshCw
                        className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>

            {isError ? (
                <p className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Could not load reports. Sign in as manager and check the
                    API.
                </p>
            ) : null}

            {isLoading ? (
                <KpiStatsSkeleton />
            ) : (
                <>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Net revenue today"
                            value={k?.dailyRevenueFormatted ?? "ETB 0"}
                            trend={{
                                value: k?.dailyRevenueTrend ?? "0%",
                                direction: k?.dailyRevenueTrend?.startsWith("+")
                                    ? "up"
                                    : "neutral",
                                label:
                                    k?.dailyRevenueTrendLabel ?? "vs yesterday",
                            }}
                            sparkline={{
                                badge:
                                    k?.dailyRevenueTrend?.replace(
                                        /[^0-9%]/g,
                                        "",
                                    ) || "0%",
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label="Collected today"
                            value={k?.collectionsFormatted ?? "ETB 0"}
                            trend={{
                                value: k?.collectionGapFormatted ?? "ETB 0",
                                direction: "neutral",
                                label: "still outstanding",
                            }}
                            sparkline={{
                                badge: k?.tinaVerifyMixPercentage || "0%",
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label="Avg prep time"
                            value={k?.avgPrepTimeFormatted ?? "0.0 min"}
                            trend={{
                                value: k?.avgPrepTimeTrend ?? "0%",
                                direction: k?.avgPrepTimeTrend?.startsWith("+")
                                    ? "up"
                                    : "neutral",
                                label:
                                    k?.avgPrepTimeTrendLabel ??
                                    "fulfillment speed",
                            }}
                            sparkline={{
                                badge:
                                    k?.avgPrepTimeFormatted?.replace(
                                        " min",
                                        "",
                                    ) || "0",
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label="TinaVerify mix"
                            value={k?.tinaVerifyMixPercentage ?? "0.0%"}
                            trend={{
                                value: k?.tinaVerifyTrend ?? "0%",
                                direction: k?.tinaVerifyTrend?.startsWith("+")
                                    ? "up"
                                    : "neutral",
                                label:
                                    k?.tinaVerifyTrendLabel ??
                                    "digital verified",
                            }}
                            sparkline={{
                                badge: k?.tinaVerifyMixPercentage || "0%",
                                color: "#c2410c",
                                variant: "wave4",
                            }}
                            tone="brand"
                        />
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Floor capacity"
                            value={k?.activeTablesFormatted ?? "0 / 0"}
                            trend={{
                                value: k?.floorCapacityPercentage ?? "0%",
                                direction: "neutral",
                                label: "active tables",
                            }}
                            sparkline={{
                                badge: k?.floorCapacityPercentage || "0%",
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label="Avg check"
                            value={k?.avgCheckFormatted ?? "ETB 0"}
                            trend={{
                                value: k?.ordersFormatted ?? "0",
                                direction: "neutral",
                                label: "orders today",
                            }}
                            sparkline={{
                                badge: k?.coversFormatted || "0",
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label="Covers today"
                            value={k?.coversFormatted ?? "0"}
                            trend={{
                                value: k?.ordersFormatted ?? "0",
                                direction: "neutral",
                                label: "ticketed orders",
                            }}
                            sparkline={{
                                badge: k?.coversFormatted || "0",
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label="Cancelled items"
                            value={k?.cancelledItemsFormatted ?? "0"}
                            hint={
                                k?.cancelledItemsCount
                                    ? "voids / cancels today"
                                    : "no voids today"
                            }
                            sparkline={{
                                badge: k?.cancelledItemsFormatted || "0",
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
                <PaymentChannelsBreakdown channels={dash?.paymentChannels} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <HourlySalesChart data={dash?.hourlySales ?? []} />
                <OrderVolumeChart data={dash?.orderVolumeTrend ?? []} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
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

            <TopDishesTable dishes={dash?.topDishes} />
        </DashboardFrame>
    );
}
