"use client";

import { useState } from "react";
import {
    Building2,
    Calendar,
    CheckCircle2,
    DollarSign,
    GitBranch,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Shield,
    Store,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useGetSuperAdminTenantByIdQuery } from "@/context/services/superAdminApi";
import { formatEtb } from "@/lib/money";
import EditTenantSheet from "./EditTenantSheet";

interface TenantDetailViewProps {
    tenantId: string;
}

export default function TenantDetailView({ tenantId }: TenantDetailViewProps) {
    const [editOpen, setEditOpen] = useState(false);
    const { data: response, isLoading, error, refetch } =
        useGetSuperAdminTenantByIdQuery(tenantId);
    const tenant = response?.data;

    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
                    <Loader2 className="size-8 animate-spin text-brand" />
                    <p className="text-[13px] text-slate-gray">
                        Loading tenant details & operational telemetry...
                    </p>
                </div>
            </DashboardFrame>
        );
    }

    if (error || !tenant) {
        return (
            <DashboardFrame>
                <Link
                    href="/super-admin/tenants"
                    className="text-[14px] text-brand hover:underline font-medium"
                >
                    ← Back to Tenants
                </Link>
                <div className="mt-8 rounded-[16px] border border-destructive/20 bg-destructive/10 p-8 text-center">
                    <h2 className="text-[18px] font-semibold text-destructive">
                        Tenant Not Found
                    </h2>
                    <p className="mt-2 text-[13px] text-slate-gray">
                        The requested tenant ID &quot;{tenantId}&quot; could not be retrieved from the database.
                    </p>
                    <div className="mt-4">
                        <Link
                            href="/super-admin/tenants"
                            className="inline-flex rounded-xl bg-foreground px-4 py-2 text-[13px] font-medium text-background"
                        >
                            Return to Fleet Table
                        </Link>
                    </div>
                </div>
            </DashboardFrame>
        );
    }

    const facts = [
        { label: "City", value: tenant.city, icon: MapPin },
        { label: "Area / District", value: tenant.area || "Downtown", icon: MapPin },
        { label: "Physical Address", value: tenant.address, icon: Store },
        { label: "Primary Phone", value: tenant.phone, icon: Phone },
        { label: "Contact Email", value: tenant.email, icon: Mail },
        { label: "House Manager", value: tenant.manager, icon: Users },
        { label: "Operating Hours", value: tenant.hours, icon: Calendar },
        { label: "Concept / Cuisine", value: tenant.concept, icon: UtensilsCrossed },
        { label: "Active Branches", value: String(tenant.branches), icon: GitBranch },
        { label: "Dining Tables", value: String(tenant.tableCount), icon: UtensilsCrossed },
        { label: "Staff Members", value: String(tenant.staffCount), icon: Users },
        { label: "Subscription SLA", value: tenant.plan, icon: Shield },
        { label: "Provisioned On", value: tenant.provisionedAt, icon: Calendar },
        { label: "Tenant UUID", value: tenant.id, icon: CheckCircle2 },
    ];

    return (
        <DashboardFrame>
            <Link
                href="/super-admin/tenants"
                className="text-[14px] text-brand hover:underline font-medium inline-flex items-center gap-1"
            >
                ← Back to Tenants Fleet
            </Link>

            {/* Tenant Title & Header Capsule */}
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-[18px] border border-hairline bg-surface-ivory text-brand shadow-xs">
                        <Building2 className="size-8" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-[28px] font-bold tracking-tight text-foreground">
                                {tenant.name}
                            </h1>
                            <Badge variant={tenant.active ? "success" : "secondary"}>
                                {tenant.active ? "Active" : "Suspended"}
                            </Badge>
                            <Badge variant="outline" className="capitalize text-[12px]">
                                {tenant.plan} SLA
                            </Badge>
                        </div>
                        <p className="mt-1 text-[14px] text-slate-gray">
                            {tenant.concept} · {tenant.area ? `${tenant.area}, ` : ""}{tenant.city}
                            {tenant.legalName && (
                                <span className="text-slate-gray/70"> ({tenant.legalName})</span>
                            )}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand/90"
                >
                    <Pencil className="size-3.5" />
                    Edit tenant
                </button>
            </div>

            {/* Live Metrics Row */}
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">Today GMV</span>
                        <DollarSign className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.gmvTodayFormatted || formatEtb(tenant.gmvToday)}
                    </p>
                </div>
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">Physical Branches</span>
                        <GitBranch className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.branches}
                    </p>
                </div>
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">Floor Tables</span>
                        <UtensilsCrossed className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.tableCount}
                    </p>
                </div>
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">Staff Members</span>
                        <Users className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.staffCount}
                    </p>
                </div>
            </div>

            {/* Provisioned Branches Section */}
            {tenant.branchesList && tenant.branchesList.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-[15px] font-semibold mb-3">Provisioned Branches</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {tenant.branchesList.map(b => (
                            <div
                                key={b.id}
                                className="rounded-[14px] border border-hairline bg-card p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-surface-ivory text-foreground font-semibold text-xs border border-hairline">
                                        {b.displayCode || "MAIN"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[14px]">{b.name}</p>
                                        <p className="text-[12px] text-slate-gray">
                                            {b.tablesCount} Tables · {b.staffCount} Staff · {b.timezone}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={b.status === "ACTIVE" ? "success" : "secondary"}>
                                    {b.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Restaurant Detail Facts */}
            <div className="mt-6 overflow-hidden rounded-[16px] border border-hairline bg-card">
                <div className="border-b border-hairline px-5 py-3.5 bg-surface-ivory/50">
                    <h2 className="text-[15px] font-semibold">Restaurant & Operations Specification</h2>
                    <p className="text-[12px] text-slate-gray">
                        Complete configuration metadata from database
                    </p>
                </div>
                <dl className="divide-y divide-hairline">
                    {facts.map(fact => {
                        const Icon = fact.icon;
                        return (
                            <div
                                key={fact.label}
                                className="grid gap-1 px-5 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center hover:bg-surface-ivory/30 transition-colors"
                            >
                                <dt className="flex items-center gap-2 text-[12px] font-medium text-slate-gray">
                                    <Icon className="size-3.5 text-slate-gray/70" />
                                    <span>{fact.label}</span>
                                </dt>
                                <dd
                                    className={
                                        fact.label === "Subscription SLA"
                                            ? "text-[14px] font-semibold text-brand capitalize"
                                            : fact.label === "Tenant UUID"
                                              ? "text-[13px] font-mono text-slate-gray"
                                              : "text-[14px] font-medium text-foreground"
                                    }
                                >
                                    {fact.value}
                                </dd>
                            </div>
                        );
                    })}
                </dl>
            </div>

            <EditTenantSheet
                open={editOpen}
                tenant={tenant}
                onClose={() => setEditOpen(false)}
                onSuccess={() => {
                    void refetch();
                }}
            />
        </DashboardFrame>
    );
}
