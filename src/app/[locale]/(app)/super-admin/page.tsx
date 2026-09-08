"use client";

import { RefreshCw, Store, ExternalLink } from "lucide-react";
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

export default function SuperAdminPage() {
    const { data, isLoading, isFetching, error, refetch } = useGetSuperAdminDashboardQuery();
    const dash = data?.data;

    return (
        <DashboardFrame>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    eyebrow="Fanaye SaaS"
                    title="Platform dashboard"
                    description="Multi-tenant network GMV, operational reliability, and tenant provisioning."
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="self-start sm:self-auto gap-2 rounded-full border-border/80 bg-background text-xs font-medium shadow-none"
                >
                    <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                    <span>Refresh network</span>
                </Button>
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    Unable to load platform telemetry from backend. Please verify your super admin credentials.
                </div>
            )}

            {/* 1. Top Platform KPI Stat Cards */}
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Live tenants"
                    value={isLoading ? "..." : String(dash?.kpis.liveTenantsCount ?? 0)}
                    hint={`${dash?.kpis.provisionedTenantsCount ?? 0} provisioned`}
                    trend={{
                        value: dash?.kpis.tenantGrowthRate ?? "+25%",
                        direction: "up",
                        label: "active growth",
                    }}
                    sparkline={{
                        badge: dash?.kpis.tenantGrowthRate || "+25%",
                        color: "#e85d04",
                        variant: "wave1",
                    }}
                    tone="brand"
                />
                <KpiCard
                    label="Network GMV today"
                    value={isLoading ? "..." : (dash?.kpis.networkGmvTodayFormatted ?? "ETB 0")}
                    hint={dash?.kpis.networkGmvTrendLabel ?? "vs last week"}
                    trend={{
                        value: dash?.kpis.networkGmvTrend ?? "+12%",
                        direction: "up",
                        label: dash?.kpis.networkGmvTrendLabel ?? "vs last week",
                    }}
                    sparkline={{
                        badge: dash?.kpis.networkGmvTrend || "+12%",
                        color: "#046645",
                        variant: "wave2",
                    }}
                    tone="emerald"
                />
                <KpiCard
                    label="Active branches"
                    value={isLoading ? "..." : String(dash?.kpis.activeBranchesCount ?? 0)}
                    hint={dash?.kpis.branchesLocationSummary ?? "Across 4 cities"}
                    trend={{
                        value: `${dash?.kpis.citiesCount ?? 4} cities`,
                        direction: "neutral",
                        label: "geography",
                    }}
                    sparkline={{
                        badge: `${dash?.kpis.activeBranchesCount ?? 7}`,
                        color: "#f97316",
                        variant: "wave3",
                    }}
                    tone="amber"
                />
                <KpiCard
                    label="Digital settlement mix"
                    value={isLoading ? "..." : (dash?.kpis.digitalSettlementPercentage ?? "0.0%")}
                    hint="Verified transfers"
                    trend={{
                        value: dash?.kpis.digitalSettlementTrend ?? "+14%",
                        direction: "up",
                        label: "digital ratio",
                    }}
                    sparkline={{
                        badge: dash?.kpis.digitalSettlementPercentage || "0%",
                        color: "#c2410c",
                        variant: "wave4",
                    }}
                    tone="brand"
                />
            </div>

            {/* 2. Main Row: Area Growth Chart + Spider/Radar Operational Health Matrix */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <NetworkGmvGrowthChart data={dash?.gmvTrend} />
                </div>
                <div className="lg:col-span-1">
                    <PlatformHealthRadarChart data={dash?.healthRadar} />
                </div>
            </div>

            {/* 3. Secondary Row: Subscription Plan Mix + Platform Audit Activity Stream */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <PlanDistributionChart plans={dash?.planDistribution} />
                </div>
                <div className="lg:col-span-2">
                    <PlatformAuditStream events={dash?.recentAuditEvents} />
                </div>
            </div>

            {/* 4. Multi-Tenant Fleet Table */}
            <section className="overflow-hidden rounded-[16px] border border-hairline bg-card shadow-subtle">
                <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
                    <div>
                        <h2 className="text-[16px] font-semibold text-foreground">
                            Tenant fleet board
                        </h2>
                        <p className="text-[12px] text-slate-gray">
                            Live operational monitoring across active restaurant tenants
                        </p>
                    </div>
                    <Badge variant="outline" className="gap-1 border-orange-500/30 text-orange-600">
                        <Store className="size-3" />
                        <span>{dash?.tenants.length ?? 0} Restaurants</span>
                    </Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="bg-secondary/40 text-[12px] tracking-[0.06em] text-slate-gray uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">Restaurant</th>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium">City & Branches</th>
                                <th className="px-6 py-3 font-medium">Today GMV</th>
                                <th className="px-6 py-3 font-medium">Active Tables</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {(dash?.tenants ?? []).map(tenant => (
                                <tr
                                    key={tenant.id}
                                    className="transition-colors hover:bg-secondary/20"
                                >
                                    <td className="px-6 py-3.5 font-semibold text-foreground">
                                        {tenant.name}
                                        <span className="block text-[11px] font-normal text-slate-gray font-mono">
                                            {tenant.slug}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <Badge
                                            variant="secondary"
                                            className="text-[11px] font-medium"
                                        >
                                            {tenant.plan}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-gray text-[13px]">
                                        {tenant.city}
                                        <span className="text-muted-foreground text-[11px] block">
                                            {tenant.branchCount} {tenant.branchCount === 1 ? "branch" : "branches"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 font-mono text-[13px] font-semibold text-foreground">
                                        {tenant.gmvTodayFormatted}
                                    </td>
                                    <td className="px-6 py-3.5 font-mono text-[13px]">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            {tenant.activeTablesCount} tables
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <Badge
                                            variant={
                                                tenant.status === "ACTIVE"
                                                    ? "success"
                                                    : "secondary"
                                            }
                                        >
                                            {tenant.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <Link
                                            href={`/super-admin/tenants/${tenant.id}`}
                                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                        >
                                            <span>Manage</span>
                                            <ExternalLink className="size-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </DashboardFrame>
    );
}
