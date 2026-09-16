"use client";

import { Bot, RefreshCw } from "lucide-react";
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
import { useTranslations } from "next-intl";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";

export default function ManagerPage() {
    const tManager = useTranslations("manager");
    const tNav = useTranslations("appNav");
    const tRoles = useTranslations("roles");
    const tTopBar = useTranslations("topbar");
    const { data, isLoading, isFetching, error, refetch } =
        useGetManagerDashboardQuery();
    const dash = data?.data;

    return (
        <DashboardFrame>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    eyebrow={tNav("house")}
                    title={`${tRoles("manager")} ${tTopBar("dashboard")}`}
                    description={
                        dash
                            ? `${dash.branchName} · Live telemetry for business date ${dash.businessDate}`
                            : "Live station throughput, revenue analytics, and fulfillment channels."
                    }
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="self-start sm:self-auto gap-2 rounded-full border-border/80 bg-background text-xs font-medium"
                >
                    <RefreshCw
                        className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                    />
                    <span>{tManager("refreshData")}</span>
                </Button>
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    Unable to load real-time telemetry from backend. Please
                    check connection and permissions.
                </div>
            )}

            {/* 1. Top Modern KPI Stat Cards */}
            {isLoading ? (
                <KpiStatsSkeleton />
            ) : (
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label={tManager("dailyRevenue")}
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
                        label={tManager("avgPrepTime")}
                        value={dash?.kpis.avgPrepTimeFormatted ?? "0.0 min"}
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
                        label={tManager("activeTables")}
                        value={dash?.kpis.activeTablesFormatted ?? "0 / 0"}
                        trend={{
                            value: dash?.kpis.floorCapacityPercentage ?? "0%",
                            direction: "neutral",
                            label: "floor capacity",
                        }}
                        sparkline={{
                            badge: dash?.kpis.floorCapacityPercentage || "0%",
                            color: "#f97316",
                            variant: "wave3",
                        }}
                        tone="amber"
                    />
                    <KpiCard
                        label={tManager("tinaVerifyMix")}
                        value={dash?.kpis.tinaVerifyMixPercentage ?? "0.0%"}
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
            )}

            {/* 2. Main Dashboard Charts: Revenue vs Collections + Payment Channels */}
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

            {/* 3. Operational Drill-down */}
            <div className="grid gap-4 md:grid-cols-3">
                <PrepDurationBucketsChart
                    buckets={dash?.prepBuckets}
                    avgSpeed={dash?.kpis.avgPrepTimeFormatted}
                />
                <WeeklyCashMovementChart movement={dash?.weeklyCashMovement} />
                <TopDishesLeaderboard dishes={dash?.topDishes} />
            </div>

            {/* 4. Floating AI Assistant Quick-Insight Pill */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                >
                    <Bot className="size-4 transition-transform group-hover:rotate-12" />
                    <span>Ask Mila AI</span>
                    <span className="flex size-2 rounded-full bg-emerald-300 animate-pulse" />
                </button>
            </div>
        </DashboardFrame>
    );
}
