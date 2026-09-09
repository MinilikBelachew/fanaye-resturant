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
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export default function ManagerReportsPage() {
    const { data, isLoading, isFetching, isError, refetch } =
        useGetManagerDashboardQuery();
    const dash = data?.data;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="Control"
                    title="Reports"
                    description={
                        dash
                            ? `Queue time, prep time, and payment mix for ${dash.branchName} · ${dash.businessDate}`
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
                    Could not load reports. Sign in as manager and check the API.
                </p>
            ) : null}

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Net revenue today"
                    value={
                        isLoading
                            ? "…"
                            : (dash?.kpis.dailyRevenueFormatted ?? "ETB 0")
                    }
                    trend={{
                        value: dash?.kpis.dailyRevenueTrend ?? "0%",
                        direction: dash?.kpis.dailyRevenueTrend?.startsWith("+")
                            ? "up"
                            : "neutral",
                        label: dash?.kpis.dailyRevenueTrendLabel ?? "vs yesterday",
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
                    label="Avg prep time"
                    value={
                        isLoading
                            ? "…"
                            : (dash?.kpis.avgPrepTimeFormatted ?? "0.0 min")
                    }
                    trend={{
                        value: dash?.kpis.avgPrepTimeTrend ?? "0%",
                        direction: "up",
                        label:
                            dash?.kpis.avgPrepTimeTrendLabel ??
                            "fulfillment speed",
                    }}
                    sparkline={{
                        badge:
                            dash?.kpis.avgPrepTimeFormatted?.replace(
                                " min",
                                "",
                            ) || "0",
                        color: "#046645",
                        variant: "wave2",
                    }}
                    tone="emerald"
                />
                <KpiCard
                    label="Floor capacity"
                    value={
                        isLoading
                            ? "…"
                            : (dash?.kpis.activeTablesFormatted ?? "0 / 0")
                    }
                    trend={{
                        value: dash?.kpis.floorCapacityPercentage ?? "0%",
                        direction: "neutral",
                        label: "active tables",
                    }}
                    sparkline={{
                        badge: dash?.kpis.floorCapacityPercentage || "0%",
                        color: "#f97316",
                        variant: "wave3",
                    }}
                    tone="amber"
                />
                <KpiCard
                    label="TinaVerify mix"
                    value={
                        isLoading
                            ? "…"
                            : (dash?.kpis.tinaVerifyMixPercentage ?? "0.0%")
                    }
                    trend={{
                        value: dash?.kpis.tinaVerifyTrend ?? "0%",
                        direction: "up",
                        label:
                            dash?.kpis.tinaVerifyTrendLabel ??
                            "digital verified",
                    }}
                    sparkline={{
                        badge: dash?.kpis.tinaVerifyMixPercentage || "0%",
                        color: "#c2410c",
                        variant: "wave4",
                    }}
                    tone="brand"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueVsCollectionsChart data={dash?.salesTrend} />
                </div>
                <PaymentChannelsBreakdown channels={dash?.paymentChannels} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <PrepDurationBucketsChart
                    buckets={dash?.prepBuckets}
                    avgSpeed={dash?.kpis.avgPrepTimeFormatted}
                />
                <WeeklyCashMovementChart movement={dash?.weeklyCashMovement} />
            </div>

            <TopDishesLeaderboard dishes={dash?.topDishes} />
        </DashboardFrame>
    );
}
