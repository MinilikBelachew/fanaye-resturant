"use client";

import {
    Activity,
    Building2,
    ExternalLink,
    RefreshCw,
    ScrollText,
    Store,
    Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    NetworkGmvGrowthChart,
    PlanDistributionChart,
    PlatformAuditStream,
    PlatformHealthRadarChart,
} from "@/components/custom/organisms/SuperAdminCharts";
import { useGetSuperAdminDashboardQuery } from "@/context/services/superAdminApi";

const POLL_MS = 15_000;

const SHORTCUTS = [
    {
        href: "/super-admin/tenants",
        label: "Tenants",
        hint: "Companies & branches",
        icon: Building2,
    },
    {
        href: "/super-admin/live-ops",
        label: "Live ops",
        hint: "Open floors now",
        icon: Activity,
    },
    {
        href: "/super-admin/staff",
        label: "Staff",
        hint: "Directory & access",
        icon: Users,
    },
    {
        href: "/super-admin/audit",
        label: "Audit",
        hint: "Platform events",
        icon: ScrollText,
    },
] as const;

export default function SuperAdminPage() {
    const t = useTranslations("superAdmin");
    const tTenancy = useTranslations("tenancy");
    const { data, isLoading, isFetching, error, refetch } =
        useGetSuperAdminDashboardQuery(undefined, {
            pollingInterval: POLL_MS,
            refetchOnFocus: true,
        });
    const dash = data?.data;
    const ops = dash?.opsHealth;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Platform"
                    title="Super admin"
                    description="Network health, tenant fleet, and live GMV across every restaurant."
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="h-8 gap-1.5 self-start rounded-full px-3 text-[11px] font-medium sm:self-auto"
                >
                    <RefreshCw
                        className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                    />
                    <span>{t("refresh")}</span>
                </Button>
            </div>

            {error ? (
                <div className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    {t("dashboard.errorLoadTelemetry")}
                </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {SHORTCUTS.map(item => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-[14px] border border-hairline bg-card px-3.5 py-3 transition-colors hover:bg-secondary/50"
                        >
                            <span className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-secondary text-foreground">
                                <Icon className="size-4" />
                            </span>
                            <span>
                                <span className="block text-[13px] font-semibold text-foreground">
                                    {item.label}
                                </span>
                                <span className="block text-[11px] text-slate-gray">
                                    {item.hint}
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    compact
                    label={t("dashboard.kpiLiveTenants")}
                    value={
                        isLoading
                            ? "..."
                            : String(dash?.kpis.liveTenantsCount ?? 0)
                    }
                    hint={t("dashboard.kpiProvisionedHint", {
                        count: dash?.kpis.provisionedTenantsCount ?? 0,
                    })}
                />
                <KpiCard
                    compact
                    label={t("dashboard.kpiNetworkGmvToday")}
                    value={
                        isLoading
                            ? "..."
                            : (dash?.kpis.networkGmvTodayFormatted ?? "ETB 0")
                    }
                    hint={dash?.kpis.networkGmvTrendLabel ?? t("today")}
                    trend={
                        dash?.kpis.networkGmvTrend
                            ? {
                                  value: dash.kpis.networkGmvTrend,
                                  direction:
                                      dash.kpis.networkGmvTrend.startsWith("-")
                                          ? "down"
                                          : "up",
                                  label: dash.kpis.networkGmvTrendLabel,
                              }
                            : undefined
                    }
                />
                <KpiCard
                    compact
                    label={t("dashboard.kpiActiveBranches")}
                    value={
                        isLoading
                            ? "..."
                            : String(dash?.kpis.activeBranchesCount ?? 0)
                    }
                    hint={
                        dash?.kpis.branchesLocationSummary ??
                        t("dashboard.kpiActiveBranchNetworkFallback")
                    }
                />
                <KpiCard
                    compact
                    label={t("dashboard.kpiDigitalSettlementMix")}
                    value={
                        isLoading
                            ? "..."
                            : (dash?.kpis.digitalSettlementPercentage ?? "0%")
                    }
                    hint={t("dashboard.kpiTransferPaymentsToday")}
                />
            </div>

            <section className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                <div className="border-b border-hairline px-5 py-3 sm:px-6">
                    <h2 className="text-[15px] font-semibold text-foreground">
                        {t("dashboard.opsHealthTitle")}
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        {t("dashboard.opsHealthSubtitle")}
                    </p>
                </div>
                <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                    <OpsMetric
                        label={t("dashboard.opsDailyCloseCompliance")}
                        value={
                            isLoading
                                ? "…"
                                : `${ops?.dailyCloseCompliancePct ?? 0}%`
                        }
                        hint={t("dashboard.opsBranchesLockedHint", {
                            closed: ops?.branchesClosedToday ?? 0,
                            total: ops?.activeBranches ?? 0,
                        })}
                    />
                    <OpsMetric
                        label={t("dashboard.opsStationsOnline")}
                        value={
                            isLoading
                                ? "…"
                                : `${ops?.stationAvailabilityPct ?? 0}%`
                        }
                        hint={t("dashboard.opsStationsHint", {
                            offline: ops?.offlineStations ?? 0,
                            total: ops?.totalStations ?? 0,
                        })}
                    />
                    <OpsMetric
                        label={t("dashboard.opsCashHealth")}
                        value={isLoading ? "…" : `${ops?.cashHealthPct ?? 0}%`}
                        hint={t("dashboard.opsCashVarianceHint", {
                            branches: ops?.cashVarianceBranches ?? 0,
                            amount: ops?.cashVarianceAbsTotal ?? 0,
                        })}
                    />
                    <OpsMetric
                        label={t("dashboard.opsPendingCashDrops")}
                        value={
                            isLoading ? "…" : String(ops?.pendingCashDrops ?? 0)
                        }
                        hint={t("dashboard.opsPendingCashDropsHint")}
                    />
                    <OpsMetric
                        label={t("dashboard.opsOpenSessions")}
                        value={isLoading ? "…" : String(ops?.openSessions ?? 0)}
                        hint={t("dashboard.opsOpenSessionsHint")}
                    />
                    <OpsMetric
                        label={t("dashboard.opsUnpaidBills")}
                        value={isLoading ? "…" : String(ops?.unpaidBills ?? 0)}
                        hint={t("dashboard.opsUnpaidBillsHint")}
                    />
                    <OpsMetric
                        label={t("dashboard.opsOpenExceptions")}
                        value={
                            isLoading
                                ? "…"
                                : String(ops?.openProductionExceptions ?? 0)
                        }
                        hint={t("dashboard.opsOpenExceptionsHint")}
                    />
                    <OpsMetric
                        label={t("dashboard.opsDigitalMix")}
                        value={
                            isLoading
                                ? "…"
                                : `${ops?.digitalSettlementPct ?? 0}%`
                        }
                        hint={t("dashboard.opsDigitalMixHint")}
                    />
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <NetworkGmvGrowthChart data={dash?.gmvTrend} />
                </div>
                <div className="lg:col-span-1">
                    <PlatformHealthRadarChart data={dash?.healthRadar} />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <PlanDistributionChart plans={dash?.planDistribution} />
                </div>
                <div className="lg:col-span-2">
                    <PlatformAuditStream events={dash?.recentAuditEvents} />
                </div>
            </div>

            <section className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                <div className="flex items-center justify-between border-b border-hairline px-5 py-3 sm:px-6">
                    <div>
                        <h2 className="text-[15px] font-semibold text-foreground">
                            {t("dashboard.tenantFleetTitle")}
                        </h2>
                        <p className="text-[12px] text-slate-gray">
                            {t("dashboard.tenantFleetSubtitle")}
                        </p>
                    </div>
                    <Badge variant="outline" className="gap-1 text-foreground">
                        <Store className="size-3" />
                        <span>
                            {t("dashboard.tenantFleetBadge", {
                                count: dash?.tenants.length ?? 0,
                            })}
                        </span>
                    </Badge>
                </div>
                <div className="overflow-x-auto">
                    {(dash?.tenants.length ?? 0) === 0 && !isLoading ? (
                        <p className="px-6 py-10 text-center text-[13px] text-slate-gray">
                            {t("dashboard.tenantFleetEmpty")}
                        </p>
                    ) : (
                        <table className="w-full text-left text-[13px]">
                            <thead className="border-b border-hairline text-[11px] tracking-[0.06em] text-slate-gray uppercase">
                                <tr>
                                    <th className="px-5 py-2.5 font-medium sm:px-6">
                                        {t("dashboard.tableRestaurant")}
                                    </th>
                                    <th className="px-5 py-2.5 font-medium sm:px-6">
                                        {t("dashboard.tablePlan")}
                                    </th>
                                    <th className="px-5 py-2.5 font-medium sm:px-6">
                                        {t("dashboard.tableCityBranches")}
                                    </th>
                                    <th className="px-5 py-2.5 font-medium sm:px-6">
                                        {t("dashboard.tableTodayGmv")}
                                    </th>
                                    <th className="px-5 py-2.5 font-medium sm:px-6">
                                        {t("dashboard.tableActiveTables")}
                                    </th>
                                    <th className="px-5 py-2.5 font-medium sm:px-6">
                                        {t("dashboard.tableStatus")}
                                    </th>
                                    <th className="px-5 py-2.5 text-right font-medium sm:px-6">
                                        {t("dashboard.tableAction")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(dash?.tenants ?? []).map(tenant => (
                                    <tr
                                        key={tenant.id}
                                        className="border-b border-hairline last:border-0 hover:bg-secondary/40"
                                    >
                                        <td className="px-5 py-3 font-semibold text-foreground sm:px-6">
                                            {tenant.name}
                                            <span className="block font-mono text-[11px] font-normal text-slate-gray">
                                                {tenant.slug}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 sm:px-6">
                                            <Badge
                                                variant="secondary"
                                                className="text-[11px] font-medium"
                                            >
                                                {tenant.plan}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-[13px] text-slate-gray sm:px-6">
                                            {tenant.city}
                                            <span className="block text-[11px] text-muted-foreground">
                                                {t("dashboard.branchCount", {
                                                    count: tenant.branchCount,
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-mono text-[13px] font-semibold tabular-nums sm:px-6">
                                            {tenant.gmvTodayFormatted}
                                        </td>
                                        <td className="px-5 py-3 font-mono text-[13px] sm:px-6">
                                            {t("dashboard.activeTablesCount", {
                                                count: tenant.activeTablesCount,
                                            })}
                                        </td>
                                        <td className="px-5 py-3 sm:px-6">
                                            <Badge
                                                variant={
                                                    tenant.status === "ACTIVE"
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {tenant.status === "ACTIVE"
                                                    ? tTenancy("active")
                                                    : tTenancy("suspended")}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-right sm:px-6">
                                            <Link
                                                href={`/super-admin/tenants/${tenant.id}`}
                                                className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:underline"
                                            >
                                                <span>{t("manage")}</span>
                                                <ExternalLink className="size-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </DashboardFrame>
    );
}

function OpsMetric({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <div className="rounded-[12px] border border-hairline bg-background/70 p-3">
            <p className="text-[11px] font-medium text-slate-gray">{label}</p>
            <p className="mt-0.5 text-[18px] font-semibold tracking-tight tabular-nums text-foreground">
                {value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-gray">{hint}</p>
        </div>
    );
}
