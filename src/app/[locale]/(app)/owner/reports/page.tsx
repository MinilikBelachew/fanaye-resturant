"use client";

import { RefreshCw } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PaymentChannelsBreakdown,
    PrepDurationBucketsChart,
    RevenueVsCollectionsChart,
    WeeklyCashMovementChart,
} from "@/components/custom/organisms/Charts";
import { useGetManagerDashboardQuery } from "@/context/services/managerDashboardApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export default function OwnerReportsPage() {
    const { data, isLoading, isFetching, isError, refetch } =
        useGetManagerDashboardQuery();
    const dash = data?.data;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="Business"
                    title="Reports"
                    description={
                        dash
                            ? `Collections and prep performance for ${dash.branchName} · ${dash.businessDate}`
                            : "Waiter collection stays attributed even after cash is dropped to cashier."
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
                    className="gap-2 rounded-full text-xs"
                >
                    <RefreshCw
                        className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>
            {isError ? (
                <p className="text-[13px] text-destructive">
                    Could not load reports.
                </p>
            ) : null}
            {isLoading ? (
                <p className="text-slate-gray">Loading reports…</p>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
                <RevenueVsCollectionsChart data={dash?.salesTrend} />
                <PrepDurationBucketsChart
                    buckets={dash?.prepBuckets}
                    avgSpeed={dash?.kpis.avgPrepTimeFormatted}
                />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <PaymentChannelsBreakdown channels={dash?.paymentChannels} />
                <WeeklyCashMovementChart movement={dash?.weeklyCashMovement} />
            </div>
        </DashboardFrame>
    );
}
