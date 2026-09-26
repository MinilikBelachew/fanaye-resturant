"use client";

import { useState } from "react";
import { Building2, MapPin, Radio, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { RevenueVsCollectionsChart } from "@/components/custom/organisms/Charts";
import {
    useGetBranchRevenueQuery,
    type BranchRevenuePeriod,
} from "@/context/services/managerDashboardApi";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import { useAppSelector } from "@/context/hooks";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { cn } from "@/lib/utils";

const POLL_MS = 12000;

const PERIOD_IDS: BranchRevenuePeriod[] = ["month", "quarter", "year"];

export default function BranchesPage() {
    const t = useTranslations("owner");
    const tManager = useTranslations("manager");
    const tCommon = useTranslations("common");
    const session = useAppSelector(state => state.identity.session);
    const [period, setPeriod] = useState<BranchRevenuePeriod>("month");
    const { data, isLoading, isFetching, isError } = useGetBranchRevenueQuery(
        { period },
        { pollingInterval: POLL_MS },
    );
    const { data: site } = useGetTenantSiteQuery();
    const revenue = data?.data;

    const branchName =
        revenue?.branchName || session?.branchName || t("currentBranch");
    const restaurantName = site?.data?.tenantName || branchName;
    const hasBranch = Boolean(revenue?.branchName || session?.branchId);

    const periodLabel = (id: BranchRevenuePeriod) => {
        if (id === "month") return t("periodMonth");
        if (id === "quarter") return t("periodQuarter");
        return t("periodYear");
    };

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Business"
                    title="Branches"
                    description={
                        revenue
                            ? `${restaurantName} · ${revenue.periodLabel}`
                            : restaurantName
                              ? t("revenueFor", { name: restaurantName })
                              : t("branchRevenueByPeriod")
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
                            isError ? "text-red-500" : "text-emerald-500",
                        )}
                    />
                    {isError ? tCommon("offline") : tCommon("live")}
                    {isFetching ? (
                        <RefreshCw className="size-3 animate-spin" />
                    ) : null}
                </div>
            </div>

            <div className="flex max-w-full gap-1.5 overflow-x-auto pb-0.5">
                {PERIOD_IDS.map(id => {
                    const active = period === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setPeriod(id)}
                            className={cn(
                                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                                active
                                    ? "border-transparent bg-brand text-white"
                                    : "border-hairline bg-card text-slate-gray hover:bg-muted/50",
                            )}
                        >
                            {periodLabel(id)}
                        </button>
                    );
                })}
            </div>

            {isError ? (
                <p className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
                    {t("loadBranchError")}
                </p>
            ) : null}

            {isLoading ? <KpiStatsSkeleton /> : null}

            {!isLoading && !hasBranch ? (
                <div className="rounded-[16px] border border-dashed border-hairline bg-card p-6 text-[13px] text-slate-gray">
                    {t("noBranchLinked")}
                </div>
            ) : null}

            {!isLoading && hasBranch && revenue ? (
                <>
                    <article className="rounded-[16px] border border-hairline bg-card p-4 shadow-subtle sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                    <Building2 className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-[15px] font-semibold tracking-tight">
                                        {branchName}
                                    </h2>
                                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-gray">
                                        <MapPin className="size-3.5 shrink-0" />
                                        {revenue.fromDate} → {revenue.toDate}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="success">{tCommon("live")}</Badge>
                        </div>
                    </article>

                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label={t("revenue")}
                            value={revenue.revenueFormatted}
                            trend={{
                                value: revenue.revenueTrend,
                                direction: revenue.revenueTrend.startsWith("+")
                                    ? "up"
                                    : "neutral",
                                label: revenue.revenueTrendLabel,
                            }}
                            sparkline={{
                                badge:
                                    revenue.revenueTrend.replace(
                                        /[^0-9%]/g,
                                        "",
                                    ) || "0%",
                                color: "#e85d04",
                                variant: "wave1",
                            }}
                            tone="brand"
                        />
                        <KpiCard
                            label={t("collected")}
                            value={revenue.collectionsFormatted}
                            trend={{
                                value: revenue.billedFormatted,
                                direction: "neutral",
                                label: t("billedInPeriod"),
                            }}
                            sparkline={{
                                badge: revenue.ordersFormatted,
                                color: "#046645",
                                variant: "wave2",
                            }}
                            tone="emerald"
                        />
                        <KpiCard
                            label={t("orders")}
                            value={revenue.ordersFormatted}
                            hint={t("billsInPeriod")}
                            sparkline={{
                                badge: revenue.coversFormatted,
                                color: "#f97316",
                                variant: "wave3",
                            }}
                            tone="amber"
                        />
                        <KpiCard
                            label={tManager("avgCheck")}
                            value={revenue.avgCheckFormatted}
                            trend={{
                                value: revenue.coversFormatted,
                                direction: "neutral",
                                label: t("covers"),
                            }}
                            sparkline={{
                                badge: revenue.coversFormatted,
                                color: "#c2410c",
                                variant: "wave4",
                            }}
                            tone="brand"
                        />
                    </div>

                    <div className="min-w-0">
                        <RevenueVsCollectionsChart data={revenue.series} />
                    </div>
                </>
            ) : null}
        </DashboardFrame>
    );
}
