"use client";

import { Loader2, Radio } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useGetSuperAdminLiveOpsQuery } from "@/context/services/superAdminApi";

export default function LiveOpsPage() {
    const { data, isLoading, isFetching, error, refetch } =
        useGetSuperAdminLiveOpsQuery(undefined, {
            pollingInterval: 10_000,
            refetchOnFocus: true,
        });
    const summary = data?.summary;
    const branches = data?.branches ?? [];

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="Overview"
                    title="Live ops"
                    description="Open floors, unpaid bills, and active branches across every tenant."
                />
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium text-foreground hover:bg-surface-ivory"
                >
                    <Radio
                        className={`size-3.5 text-brand ${isFetching ? "animate-pulse" : ""}`}
                    />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Unable to load live ops telemetry.
                </div>
            )}

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                <KpiCard
                    label="Open sessions"
                    value={isLoading ? "…" : String(summary?.openSessions ?? 0)}
                    hint="Tables currently open"
                    tone="brand"
                />
                <KpiCard
                    label="Open orders"
                    value={isLoading ? "…" : String(summary?.openOrders ?? 0)}
                    hint="On live floors"
                    tone="amber"
                />
                <KpiCard
                    label="Unpaid bills"
                    value={isLoading ? "…" : String(summary?.unpaidBills ?? 0)}
                    hint="Awaiting settlement"
                    tone="emerald"
                />
                <KpiCard
                    label="Active branches"
                    value={
                        isLoading ? "…" : String(summary?.activeBranches ?? 0)
                    }
                    hint="Status ACTIVE"
                />
                <KpiCard
                    label="Live tenants"
                    value={isLoading ? "…" : String(summary?.liveTenants ?? 0)}
                    hint="With open floor activity"
                />
            </div>

            <div className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                <div className="border-b border-hairline bg-surface-ivory/50 px-5 py-3.5">
                    <h2 className="text-[15px] font-semibold">
                        Branch network
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        Real-time activity by branch
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-gray">
                        <Loader2 className="size-4 animate-spin text-brand" />
                        Loading live floors…
                    </div>
                ) : branches.length === 0 ? (
                    <p className="px-5 py-10 text-center text-[13px] text-slate-gray">
                        No active branches yet. Provision a tenant to see live
                        ops.
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
                                                {hot ? "Live" : "Quiet"}
                                            </Badge>
                                            <span className="text-[11px] text-slate-gray">
                                                {branch.branchCode}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[12px] text-slate-gray">
                                            <Link
                                                href={`/super-admin/tenants/${branch.tenantId}`}
                                                className="text-brand hover:underline"
                                            >
                                                {branch.tenantName}
                                            </Link>
                                            {" · "}
                                            {branch.tableCount} tables
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-[12px]">
                                        <span>
                                            <strong>
                                                {branch.openSessions}
                                            </strong>{" "}
                                            sessions
                                        </span>
                                        <span>
                                            <strong>{branch.openOrders}</strong>{" "}
                                            orders
                                        </span>
                                        <span>
                                            <strong>
                                                {branch.unpaidBills}
                                            </strong>{" "}
                                            unpaid
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
