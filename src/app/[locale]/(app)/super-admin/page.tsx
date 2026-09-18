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

const POLL_MS = 15_000;

export default function SuperAdminPage() {
    const { data, isLoading, isFetching, error, refetch } =
        useGetSuperAdminDashboardQuery(undefined, {
            pollingInterval: POLL_MS,
            refetchOnFocus: true,
        });
    const dash = data?.data;
    const ops = dash?.opsHealth;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="Platform SaaS"
                    title="Platform dashboard"
                    description="Live network GMV, ops health, and tenant fleet — real data only."
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="gap-2 self-start rounded-full border-border/80 bg-background text-xs font-medium shadow-none sm:self-auto"
                >
                    <RefreshCw
                        className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                    />
                    <span>Refresh</span>
                </Button>
            </div>

            {error ? (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    Unable to load platform telemetry. Check super-admin access.
                </div>
            ) : null}

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Live tenants"
                    value={
                        isLoading
                            ? "..."
                            : String(dash?.kpis.liveTenantsCount ?? 0)
                    }
                    hint={`${dash?.kpis.provisionedTenantsCount ?? 0} provisioned`}
                    tone="brand"
                />
                <KpiCard
                    label="Network GMV today"
                    value={
                        isLoading
                            ? "..."
                            : (dash?.kpis.networkGmvTodayFormatted ?? "ETB 0")
                    }
                    hint={dash?.kpis.networkGmvTrendLabel ?? "today"}
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
                    tone="emerald"
                />
                <KpiCard
                    label="Active branches"
                    value={
                        isLoading
                            ? "..."
                            : String(dash?.kpis.activeBranchesCount ?? 0)
                    }
                    hint={
                        dash?.kpis.branchesLocationSummary ??
                        "Active branch network"
                    }
                    tone="amber"
                />
                <KpiCard
                    label="Digital settlement mix"
                    value={
                        isLoading
                            ? "..."
                            : (dash?.kpis.digitalSettlementPercentage ?? "0%")
                    }
                    hint="Transfer payments today"
                    tone="brand"
                />
            </div>

            <section className="overflow-hidden rounded-[16px] border border-hairline bg-card shadow-subtle">
                <div className="border-b border-hairline px-5 py-3.5 sm:px-6">
                    <h2 className="text-[16px] font-semibold text-foreground">
                        Ops health
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        Daily close, stations, cash, and floor signals across
                        the network
                    </p>
                </div>
                <div className="grid gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                    <OpsMetric
                        label="Daily close compliance"
                        value={
                            isLoading
                                ? "…"
                                : `${ops?.dailyCloseCompliancePct ?? 0}%`
                        }
                        hint={`${ops?.branchesClosedToday ?? 0}/${ops?.activeBranches ?? 0} branches locked`}
                    />
                    <OpsMetric
                        label="Stations online"
                        value={
                            isLoading
                                ? "…"
                                : `${ops?.stationAvailabilityPct ?? 0}%`
                        }
                        hint={`${ops?.offlineStations ?? 0} offline · ${ops?.totalStations ?? 0} total`}
                    />
                    <OpsMetric
                        label="Cash health"
                        value={isLoading ? "…" : `${ops?.cashHealthPct ?? 0}%`}
                        hint={`${ops?.cashVarianceBranches ?? 0} variance · ETB ${ops?.cashVarianceAbsTotal ?? 0}`}
                    />
                    <OpsMetric
                        label="Pending cash drops"
                        value={
                            isLoading ? "…" : String(ops?.pendingCashDrops ?? 0)
                        }
                        hint="Initiated / undeclared drops"
                    />
                    <OpsMetric
                        label="Open sessions"
                        value={isLoading ? "…" : String(ops?.openSessions ?? 0)}
                        hint="Tables open today"
                    />
                    <OpsMetric
                        label="Unpaid bills"
                        value={isLoading ? "…" : String(ops?.unpaidBills ?? 0)}
                        hint="Network-wide unpaid"
                    />
                    <OpsMetric
                        label="Open exceptions"
                        value={
                            isLoading
                                ? "…"
                                : String(ops?.openProductionExceptions ?? 0)
                        }
                        hint="Production cannot-prepare"
                    />
                    <OpsMetric
                        label="Digital mix"
                        value={
                            isLoading
                                ? "…"
                                : `${ops?.digitalSettlementPct ?? 0}%`
                        }
                        hint="Transfer share of payments"
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

            <section className="overflow-hidden rounded-[16px] border border-hairline bg-card shadow-subtle">
                <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                    <div>
                        <h2 className="text-[16px] font-semibold text-foreground">
                            Tenant fleet
                        </h2>
                        <p className="text-[12px] text-slate-gray">
                            Live tenants from the database
                        </p>
                    </div>
                    <Badge
                        variant="outline"
                        className="gap-1 border-orange-500/30 text-orange-600"
                    >
                        <Store className="size-3" />
                        <span>{dash?.tenants.length ?? 0} restaurants</span>
                    </Badge>
                </div>
                <div className="overflow-x-auto">
                    {(dash?.tenants.length ?? 0) === 0 && !isLoading ? (
                        <p className="px-6 py-10 text-center text-[13px] text-slate-gray">
                            No tenants provisioned yet.
                        </p>
                    ) : (
                        <table className="w-full text-left text-[14px]">
                            <thead className="bg-secondary/40 text-[12px] tracking-[0.06em] text-slate-gray uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium">
                                        Restaurant
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Plan
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        City & Branches
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Today GMV
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Active Tables
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right font-medium">
                                        Action
                                    </th>
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
                                            <span className="block font-mono text-[11px] font-normal text-slate-gray">
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
                                        <td className="px-6 py-3.5 text-[13px] text-slate-gray">
                                            {tenant.city}
                                            <span className="block text-[11px] text-muted-foreground">
                                                {tenant.branchCount}{" "}
                                                {tenant.branchCount === 1
                                                    ? "branch"
                                                    : "branches"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 font-mono text-[13px] font-semibold text-foreground">
                                            {tenant.gmvTodayFormatted}
                                        </td>
                                        <td className="px-6 py-3.5 font-mono text-[13px]">
                                            {tenant.activeTablesCount} tables
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
        <div className="rounded-[12px] border border-hairline bg-background/60 p-3.5">
            <p className="text-[11px] font-medium text-slate-gray">{label}</p>
            <p className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
                {value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-gray">{hint}</p>
        </div>
    );
}
