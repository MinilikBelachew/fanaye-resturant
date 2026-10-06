"use client";

import { Loader2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useGetSuperAdminLiveOpsQuery } from "@/context/services/superAdminApi";

export default function LiveOpsPage() {
    const t = useTranslations("superAdmin");
    const { data, isLoading, isFetching, error, refetch } =
        useGetSuperAdminLiveOpsQuery(undefined, {
            pollingInterval: 10_000,
            refetchOnFocus: true,
        });
    const summary = data?.summary;
    const branches = data?.branches ?? [];

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Platform"
                    title="Live ops"
                    description="Open floors, unpaid bills, and active branches across every tenant."
                />
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex h-8 items-center gap-1.5 self-start rounded-full border border-hairline px-3 text-[11px] font-medium text-foreground hover:bg-secondary/50"
                >
                    <Radio
                        className={`size-3.5 ${isFetching ? "animate-pulse" : ""}`}
                    />
                    {t("refresh")}
                </button>
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4 text-[13px] text-destructive">
                    {t("liveOps.errorLoadTelemetry")}
                </div>
            )}

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                <KpiCard
                    compact
                    label={t("liveOps.kpiOpenSessions")}
                    value={isLoading ? "…" : String(summary?.openSessions ?? 0)}
                    hint={t("liveOps.kpiOpenSessionsHint")}
                />
                <KpiCard
                    compact
                    label={t("liveOps.kpiOpenOrders")}
                    value={isLoading ? "…" : String(summary?.openOrders ?? 0)}
                    hint={t("liveOps.kpiOpenOrdersHint")}
                />
                <KpiCard
                    compact
                    label={t("liveOps.kpiUnpaidBills")}
                    value={isLoading ? "…" : String(summary?.unpaidBills ?? 0)}
                    hint={t("liveOps.kpiUnpaidBillsHint")}
                />
                <KpiCard
                    compact
                    label={t("liveOps.kpiActiveBranches")}
                    value={
                        isLoading ? "…" : String(summary?.activeBranches ?? 0)
                    }
                    hint={t("liveOps.kpiActiveBranchesHint")}
                />
                <KpiCard
                    compact
                    label={t("liveOps.kpiLiveTenants")}
                    value={isLoading ? "…" : String(summary?.liveTenants ?? 0)}
                    hint={t("liveOps.kpiLiveTenantsHint")}
                />
            </div>

            <div className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                <div className="border-b border-hairline bg-surface-ivory/50 px-5 py-3.5">
                    <h2 className="text-[15px] font-semibold">
                        {t("liveOps.branchNetworkTitle")}
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        {t("liveOps.branchNetworkSubtitle")}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-gray">
                        <Loader2 className="size-4 animate-spin" />
                        {t("liveOps.loadingLiveFloors")}
                    </div>
                ) : branches.length === 0 ? (
                    <p className="px-5 py-10 text-center text-[13px] text-slate-gray">
                        {t("liveOps.emptyNoBranches")}
                    </p>
                ) : (
                    <ul className="divide-y divide-hairline">
                        {branches.map(branch => {
                            const hot =
                                branch.openSessions > 0 ||
                                branch.openOrders > 0;
                            return (
                                <li
                                    key={branch.branchId}
                                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-[14px]">
                                                {branch.branchName}
                                            </p>
                                            <Badge
                                                variant={
                                                    hot
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {hot
                                                    ? t("liveOps.badgeLive")
                                                    : t("liveOps.badgeQuiet")}
                                            </Badge>
                                            <span className="text-[11px] text-slate-gray">
                                                {branch.branchCode}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[12px] text-slate-gray">
                                            <Link
                                                href={`/super-admin/tenants/${branch.tenantId}`}
                                                className="font-medium text-foreground hover:underline"
                                            >
                                                {branch.tenantName}
                                            </Link>
                                            {" · "}
                                            {t("liveOps.branchTableCount", {
                                                count: branch.tableCount,
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-[12px]">
                                        <span>
                                            {t("liveOps.metricSessions", {
                                                count: branch.openSessions,
                                            })}
                                        </span>
                                        <span>
                                            {t("liveOps.metricOrders", {
                                                count: branch.openOrders,
                                            })}
                                        </span>
                                        <span>
                                            {t("liveOps.metricUnpaid", {
                                                count: branch.unpaidBills,
                                            })}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </DashboardFrame>
    );
}
