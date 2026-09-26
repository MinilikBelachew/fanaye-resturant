"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
    Plus,
    Shield,
    Store,
    Trash2,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import {
    useDeleteSuperAdminTenantMutation,
    useGetSuperAdminTenantByIdQuery,
} from "@/context/services/superAdminApi";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import EditTenantSheet from "./EditTenantSheet";
import AddBranchSheet from "./AddBranchSheet";

interface TenantDetailViewProps {
    tenantId: string;
}

export default function TenantDetailView({ tenantId }: TenantDetailViewProps) {
    const t = useTranslations("tenancy");
    const tOwner = useTranslations("owner");
    const router = useRouter();
    const [editOpen, setEditOpen] = useState(false);
    const [addBranchOpen, setAddBranchOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const {
        data: response,
        isLoading,
        error,
        refetch,
    } = useGetSuperAdminTenantByIdQuery(tenantId);
    const { data: branchesRes, refetch: refetchBranches } =
        useListBranchesQuery({ tenantId });
    const [deleteTenant, { isLoading: isDeleting }] =
        useDeleteSuperAdminTenantMutation();
    const tenant = response?.data;

    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
                    <Loader2 className="size-8 animate-spin text-brand" />
                    <p className="text-[13px] text-slate-gray">
                        {t("detail.loading")}
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
                    {t("detail.backToTenants")}
                </Link>
                <div className="mt-8 rounded-[16px] border border-destructive/20 bg-destructive/10 p-8 text-center">
                    <h2 className="text-[18px] font-semibold text-destructive">
                        {t("detail.notFoundTitle")}
                    </h2>
                    <p className="mt-2 text-[13px] text-slate-gray">
                        {t("detail.notFoundBody", { tenantId })}
                    </p>
                    <div className="mt-4">
                        <Link
                            href="/super-admin/tenants"
                            className="inline-flex rounded-xl bg-foreground px-4 py-2 text-[13px] font-medium text-background"
                        >
                            {t("detail.returnToFleetTable")}
                        </Link>
                    </div>
                </div>
            </DashboardFrame>
        );
    }

    const facts = [
        {
            id: "city",
            label: t("detail.factCity"),
            value: tenant.city,
            icon: MapPin,
        },
        {
            id: "area",
            label: t("detail.factAreaDistrict"),
            value: tenant.area || t("detail.defaultArea"),
            icon: MapPin,
        },
        {
            id: "address",
            label: t("detail.factPhysicalAddress"),
            value: tenant.address,
            icon: Store,
        },
        {
            id: "phone",
            label: t("detail.factPrimaryPhone"),
            value: tenant.phone,
            icon: Phone,
        },
        {
            id: "email",
            label: t("detail.factContactEmail"),
            value: tenant.email,
            icon: Mail,
        },
        {
            id: "manager",
            label: t("detail.factHouseManager"),
            value: tenant.manager,
            icon: Users,
        },
        {
            id: "hours",
            label: t("detail.factOperatingHours"),
            value: tenant.hours,
            icon: Calendar,
        },
        {
            id: "concept",
            label: t("detail.factConceptCuisine"),
            value: tenant.concept,
            icon: UtensilsCrossed,
        },
        {
            id: "branches",
            label: t("detail.factActiveBranches"),
            value: String(tenant.branches),
            icon: GitBranch,
        },
        {
            id: "tables",
            label: t("detail.factDiningTables"),
            value: String(tenant.tableCount),
            icon: UtensilsCrossed,
        },
        {
            id: "staff",
            label: t("detail.factStaffMembers"),
            value: String(tenant.staffCount),
            icon: Users,
        },
        {
            id: "subscriptionSla",
            label: t("detail.factSubscriptionSla"),
            value: tenant.plan,
            icon: Shield,
        },
        {
            id: "provisionedOn",
            label: t("detail.factProvisionedOn"),
            value: tenant.provisionedAt,
            icon: Calendar,
        },
        {
            id: "tenantUuid",
            label: t("detail.factTenantUuid"),
            value: tenant.id,
            icon: CheckCircle2,
        },
    ];

    return (
        <DashboardFrame>
            <Link
                href="/super-admin/tenants"
                className="text-[14px] text-brand hover:underline font-medium inline-flex items-center gap-1"
            >
                {t("detail.backToTenantsFleet")}
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
                            <Badge
                                variant={
                                    tenant.active ? "success" : "secondary"
                                }
                            >
                                {tenant.active ? t("active") : t("suspended")}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="capitalize text-[12px]"
                            >
                                {t("detail.planSlaBadge", {
                                    plan: tenant.plan,
                                })}
                            </Badge>
                        </div>
                        <p className="mt-1 text-[14px] text-slate-gray">
                            {tenant.concept} ·{" "}
                            {tenant.area ? `${tenant.area}, ` : ""}
                            {tenant.city}
                            {tenant.legalName && (
                                <span className="text-slate-gray/70">
                                    {" "}
                                    ({tenant.legalName})
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand/90"
                    >
                        <Pencil className="size-3.5" />
                        {t("editTenant")}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setDeleteConfirmName("");
                            setDeleteOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-[13px] font-semibold text-destructive hover:bg-destructive/15"
                    >
                        <Trash2 className="size-3.5" />
                        {t("detail.deleteRestaurant")}
                    </button>
                </div>
            </div>

            {/* Live Metrics Row */}
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">
                            {t("todayGmv")}
                        </span>
                        <DollarSign className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.gmvTodayFormatted || formatEtb(tenant.gmvToday)}
                    </p>
                </div>
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">
                            {t("detail.metricPhysicalBranches")}
                        </span>
                        <GitBranch className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.branches}
                    </p>
                </div>
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">
                            {t("detail.metricFloorTables")}
                        </span>
                        <UtensilsCrossed className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.tableCount}
                    </p>
                </div>
                <div className="rounded-[14px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[11px] font-medium">
                            {t("detail.metricStaffMembers")}
                        </span>
                        <Users className="size-4 text-brand" />
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground">
                        {tenant.staffCount}
                    </p>
                </div>
            </div>

            {/* Provisioned Branches Section */}
            <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-[15px] font-semibold">
                        {t("detail.provisionedBranches")}
                    </h2>
                    <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setAddBranchOpen(true)}
                    >
                        <Plus className="size-3.5" />
                        {tOwner("addBranch")}
                    </Button>
                </div>
                {branchesRes ? (
                    <p className="mb-3 text-[12px] text-slate-gray">
                        {tOwner("branchLimit", {
                            active: branchesRes.activeCount,
                            max: branchesRes.maxBranches,
                        })}
                    </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                    {(branchesRes?.data ?? tenant.branchesList ?? []).map(
                        (b: {
                            id: string;
                            name: string;
                            displayCode?: string | null;
                            status: string;
                            tableCount?: number;
                            tablesCount?: number;
                            staffCount: number;
                            timezone?: string;
                            manager?: { name: string | null } | null;
                        }) => (
                            <div
                                key={b.id}
                                className="rounded-[14px] border border-hairline bg-card p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-surface-ivory text-foreground font-semibold text-xs border border-hairline">
                                        {b.displayCode ||
                                            t("detail.branchFallbackCode")}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[14px]">
                                            {b.name}
                                        </p>
                                        <p className="text-[12px] text-slate-gray">
                                            {t("detail.branchMeta", {
                                                tablesCount:
                                                    b.tableCount ??
                                                    b.tablesCount ??
                                                    0,
                                                staffCount: b.staffCount,
                                                timezone:
                                                    b.timezone ||
                                                    "Africa/Addis_Ababa",
                                            })}
                                        </p>
                                        {b.manager?.name ? (
                                            <p className="mt-0.5 text-[11px] text-slate-gray">
                                                {tOwner("managerLabel")}:{" "}
                                                {b.manager.name}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        b.status === "ACTIVE"
                                            ? "success"
                                            : "secondary"
                                    }
                                >
                                    {b.status}
                                </Badge>
                            </div>
                        ),
                    )}
                </div>
            </div>

            <AddBranchSheet
                open={addBranchOpen}
                tenantId={tenantId}
                onClose={() => {
                    setAddBranchOpen(false);
                    void refetch();
                    void refetchBranches();
                }}
            />
            {/* Restaurant Detail Facts */}
            <div className="mt-6 overflow-hidden rounded-[16px] border border-hairline bg-card">
                <div className="border-b border-hairline px-5 py-3.5 bg-surface-ivory/50">
                    <h2 className="text-[15px] font-semibold">
                        {t("detail.specTitle")}
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        {t("detail.specSubtitle")}
                    </p>
                </div>
                <dl className="divide-y divide-hairline">
                    {facts.map(fact => {
                        const Icon = fact.icon;
                        return (
                            <div
                                key={fact.id}
                                className="grid gap-1 px-5 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center hover:bg-surface-ivory/30 transition-colors"
                            >
                                <dt className="flex items-center gap-2 text-[12px] font-medium text-slate-gray">
                                    <Icon className="size-3.5 text-slate-gray/70" />
                                    <span>{fact.label}</span>
                                </dt>
                                <dd
                                    className={
                                        fact.id === "subscriptionSla"
                                            ? "text-[14px] font-semibold text-brand capitalize"
                                            : fact.id === "tenantUuid"
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

            {deleteOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-tenant-title"
                        className="w-full max-w-md rounded-[16px] border border-hairline bg-card p-5 shadow-lg"
                    >
                        <h3
                            id="delete-tenant-title"
                            className="text-[16px] font-semibold text-foreground"
                        >
                            {t("detail.deleteConfirmTitle")}
                        </h3>
                        <p className="mt-2 text-[13px] text-slate-gray">
                            {t("detail.deleteConfirmBody", {
                                name: tenant.name,
                            })}
                        </p>
                        <p className="mt-4 text-[12px] font-medium text-foreground">
                            {t("detail.deleteConfirmHint")}
                        </p>
                        <Input
                            className="mt-2 h-11 rounded-[12px]"
                            value={deleteConfirmName}
                            onChange={e => setDeleteConfirmName(e.target.value)}
                            placeholder={t("detail.deleteConfirmPlaceholder")}
                            autoFocus
                        />
                        <div className="mt-5 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteOpen(false)}
                                className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-gray hover:bg-secondary"
                            >
                                {t("detail.deleteCancelling")}
                            </button>
                            <button
                                type="button"
                                disabled={
                                    isDeleting ||
                                    deleteConfirmName.trim() !== tenant.name
                                }
                                onClick={async () => {
                                    try {
                                        await deleteTenant(tenantId).unwrap();
                                        toast.success(
                                            t("detail.deleteSuccess"),
                                            tenant.name,
                                        );
                                        setDeleteOpen(false);
                                        router.push("/super-admin/tenants");
                                    } catch (err: unknown) {
                                        const errObj = err as {
                                            data?: {
                                                message?: string | string[];
                                            };
                                        };
                                        const message = Array.isArray(
                                            errObj?.data?.message,
                                        )
                                            ? errObj.data.message.join(", ")
                                            : errObj?.data?.message ||
                                              t("detail.deleteFailed");
                                        toast.error(message);
                                    }
                                }}
                                className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Trash2 className="size-3.5" />
                                )}
                                {t("detail.deleteConfirmAction")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </DashboardFrame>
    );
}
