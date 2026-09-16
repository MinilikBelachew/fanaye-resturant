"use client";

import { RefreshCw } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PaymentChannelsBreakdown,
    PrepDurationBucketsChart,
    RevenueVsCollectionsChart,
    TopDishesLeaderboard,
    WeeklyCashMovementChart,
} from "@/components/custom/organisms/Charts";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { Button } from "@/components/ui/button";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { toast } from "@/lib/toast";

export default function OwnerPage() {
    const { data, isLoading, isFetching, error, refetch } =
        useGetManagerDashboardQuery();
    const dash = data?.data;

    return (
        <DashboardFrame>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    eyebrow="Business Portal"
                    title="Owner Dashboard"
                    description={
                        dash
                            ? `${dash.branchName} · Real-time financial telemetry, station speed & floor operations`
                            : "Real-time financial telemetry, station speed, and floor operations."
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
                                    "Could not refresh dashboard metrics.",
                                );
                                return;
                            }
                            toast.success("Dashboard metrics updated");
                        });
                    }}
                    disabled={isFetching}
                    className="self-start sm:self-auto gap-2 rounded-full border-border/80 bg-background text-xs font-medium"
                >
                    <RefreshCw
                        className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                    />
                    <span>Refresh Telemetry</span>
                </Button>
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    Unable to load real-time telemetry from backend. Please
                    verify connection.
                </div>
            )}

            {/* 1. Live Executive KPI Cards */}
            {isLoading ? (
                <KpiStatsSkeleton />
            ) : (
                <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Today Net Revenue"
                        value={dash?.kpis.dailyRevenueFormatted ?? "ETB 0"}
                        trend={{
                            value: dash?.kpis.dailyRevenueTrend ?? "0%",
                            direction: dash?.kpis.dailyRevenueTrend?.startsWith(
                                "+",
                            )
                                ? "up"
                                : "neutral",
                            label:
                                dash?.kpis.dailyRevenueTrendLabel ??
                                "vs yesterday",
                        }}
                        sparkline={{
                            badge:
                                dash?.kpis.dailyRevenueTrend?.replace(
                                    /[^0-9%]/g,
                                    "",
                                ) || "0%",
                            color: "#e85d04",
                            variant: "wave1",
                        }}
                        tone="brand"
                    />
                    <KpiCard
                        label="TinaVerify Digital Mix"
                        value={dash?.kpis.tinaVerifyMixPercentage ?? "0%"}
                        trend={{
                            value: dash?.kpis.tinaVerifyTrend ?? "+14%",
                            direction: "up",
                            label:
                                dash?.kpis.tinaVerifyTrendLabel ??
                                "digital verified",
                        }}
                        sparkline={{
                            badge:
                                dash?.kpis.tinaVerifyTrend?.replace(
                                    /[^0-9%]/g,
                                    "",
                                ) || "0%",
                            color: "#0068f9",
                            variant: "wave2",
                        }}
                    />
                    <KpiCard
                        label="Floor Capacity / Tables"
                        value={
                            dash?.kpis.activeTablesFormatted ?? "0 / 0 tables"
                        }
                        trend={{
                            value: dash?.kpis.floorCapacityPercentage ?? "0%",
                            direction: "neutral",
                            label: "occupancy rate",
                        }}
                        sparkline={{
                            badge: dash?.kpis.floorCapacityPercentage ?? "0%",
                            color: "#16a34a",
                            variant: "wave3",
                        }}
                    />
                    <KpiCard
                        label="Avg Prep & Kitchen Speed"
                        value={dash?.kpis.avgPrepTimeFormatted ?? "0.0 min"}
                        trend={{
                            value: dash?.kpis.avgPrepTimeTrend ?? "-12%",
                            direction: "up",
                            label:
                                dash?.kpis.avgPrepTimeTrendLabel ??
                                "fulfillment velocity",
                        }}
                        sparkline={{
                            badge:
                                dash?.kpis.avgPrepTimeTrend?.replace(
                                    /[^0-9%]/g,
                                    "",
                                ) || "0%",
                            color: "#8b5cf6",
                            variant: "wave1",
                        }}
                    />
                </div>
            )}

            {/* 2. Charts Suite: Revenue Trend & Payment Breakdown */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueVsCollectionsChart data={dash?.salesTrend} />
                </div>
                <div>
                    <PaymentChannelsBreakdown
                        channels={dash?.paymentChannels}
                    />
                </div>
            </div>

            {/* 3. Charts Suite: Cash Movement, Station Prep & Top Dishes */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <WeeklyCashMovementChart movement={dash?.weeklyCashMovement} />
                <PrepDurationBucketsChart
                    buckets={dash?.prepBuckets}
                    avgSpeed={dash?.kpis.avgPrepTimeFormatted}
                />
                <TopDishesLeaderboard dishes={dash?.topDishes} />
            </div>

            {/* 4. Live Operations Table Floor Board */}
            <div className="space-y-3">
                <div>
                    <h3 className="text-[17px] font-semibold text-foreground">
                        Live Floor & Table Timeline
                    </h3>
                    <p className="text-[13px] text-slate-gray">
                        Active dining tables, waiter assignments, and real-time
                        billing states
                    </p>
                </div>
                <LiveFloorBoard />
            </div>
        </DashboardFrame>
    );
}
