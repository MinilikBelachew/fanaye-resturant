"use client";

import { Radio, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
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
    const tManager = useTranslations("manager");
    const tCommon = useTranslations("common");
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
        tManager("yourRestaurant");

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

            {error ? (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    {tManager("ownerLoadError")}
                </div>
            ) : null}

            {isLoading ? (
                <KpiStatsSkeleton />
            ) : (
                <>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label={tManager("collectedToday")}
                            value={dash?.kpis.collectionsFormatted ?? "ETB 0"}
                            trend={{
                                value: dash?.kpis.dailyRevenueTrend ?? "0%",
                                direction:
                                    dash?.kpis.dailyRevenueTrend?.startsWith(
                                        "+",
                                    )
                                        ? "up"
                                        : "neutral",
                                label: tManager("vsBilledYesterday"),
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
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label={tManager("openTables")}
                            value={dash?.kpis.activeTablesFormatted ?? "0 / 0"}
                            trend={{
                                value:
                                    dash?.kpis.floorCapacityPercentage ?? "0%",
                                direction: "neutral",
                                label: tManager("floorOccupancy"),
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
                            label={tManager("needsAttention")}
                            value={dash?.kpis.pendingActionsFormatted ?? "0"}
                            hint={tManager("nothingWaiting")}
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
                            label={tManager("avgCheck")}
                            value={dash?.kpis.avgCheckFormatted ?? "ETB 0"}
                            trend={{
                                value: dash?.kpis.ordersFormatted ?? "0",
                                direction: "neutral",
                                label: tManager("ordersToday"),
                            }}
                            sparkline={{
                                badge: dash?.kpis.coversFormatted ?? "0",
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label={tManager("covers")}
                            value={dash?.kpis.coversFormatted ?? "0"}
                            hint={tManager("guestsSeatedToday")}
                            sparkline={{
                                badge: dash?.kpis.coversFormatted ?? "0",
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label={tManager("tinaVerifyMix")}
                            value={dash?.kpis.tinaVerifyMixPercentage ?? "0%"}
                            trend={{
                                value: dash?.kpis.tinaVerifyTrend ?? "0%",
                                direction: "neutral",
                                label: tManager("digitalTransferShare"),
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
                            label={tManager("avgPrep")}
                            value={dash?.kpis.avgPrepTimeFormatted ?? "0 min"}
                            trend={{
                                value: dash?.kpis.avgPrepTimeTrend ?? "0%",
                                direction: "neutral",
                                label:
                                    !dash?.kpis.avgPrepTimeFormatted ||
                                    dash.kpis.avgPrepTimeFormatted.startsWith(
                                        "0",
                                    )
                                        ? tManager("noTicketsCompleted")
                                        : tManager("kitchenSpeed"),
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
                        {tManager("liveFloor")}
                    </h3>
                    <p className="text-[12px] text-slate-gray sm:text-[13px]">
                        {tManager("liveFloorDesc", {
                            branch: dash?.branchName ?? tManager("thisBranch"),
                        })}
                    </p>
                </div>
                <LiveFloorBoard />
            </div>
        </DashboardFrame>
    );
}
