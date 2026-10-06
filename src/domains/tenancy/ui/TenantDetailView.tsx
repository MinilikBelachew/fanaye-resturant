"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import {
    useDeleteSuperAdminTenantMutation,
    useGetSuperAdminTenantByIdQuery,
} from "@/context/services/superAdminApi";
import {
    useListBranchesQuery,
    useUpdateBranchMutation,
} from "@/context/services/branchesApi";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const EditTenantSheet = dynamic(() => import("./EditTenantSheet"), {
    ssr: false,
});
const AddBranchSheet = dynamic(() => import("./AddBranchSheet"), {
    ssr: false,
});

interface TenantDetailViewProps {
    tenantId: string;
}

function Fact({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-gray">{label}</p>
            <p
                className={
                    mono
                        ? "mt-0.5 truncate font-mono text-[12px] text-slate-gray"
                        : "mt-0.5 truncate text-[13px] font-medium text-foreground"
                }
                title={value}
            >
                {value || "—"}
            </p>
        </div>
    );
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
    const [updateBranch] = useUpdateBranchMutation();
    const { data: branchesRes, refetch: refetchBranches } =
        useListBranchesQuery({ tenantId });
    const [deleteTenant, { isLoading: isDeleting }] =
        useDeleteSuperAdminTenantMutation();
    const tenant = response?.data;

    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
                    <Loader2 className="size-6 animate-spin text-slate-gray" />
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
                    className="text-[13px] font-medium text-slate-gray hover:text-foreground"
                >
                    {t("detail.backToTenants")}
                </Link>
                <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center">
                    <h2 className="text-[16px] font-semibold text-destructive">
                        {t("detail.notFoundTitle")}
                    </h2>
                    <p className="mt-2 text-[13px] text-slate-gray">
                        {t("detail.notFoundBody", { tenantId })}
                    </p>
                    <div className="mt-4">
                        <Link
                            href="/super-admin/tenants"
                            className="inline-flex rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background"
                        >
                            {t("detail.returnToFleetTable")}
                        </Link>
                    </div>
                </div>
            </DashboardFrame>
        );
    }

    const metrics = [
        {
            label: t("todayGmv"),
            value: tenant.gmvTodayFormatted || formatEtb(tenant.gmvToday),
        },
        {
            label: t("detail.metricPhysicalBranches"),
            value: String(tenant.branches),
        },
        {
            label: t("detail.metricFloorTables"),
            value: String(tenant.tableCount),
        },
        {
            label: t("detail.metricStaffMembers"),
            value: String(tenant.staffCount),
        },
    ];

    const branches = branchesRes?.data ?? tenant.branchesList ?? [];

    return (
        <DashboardFrame>
            <Link
                href="/super-admin/tenants"
                className="text-[13px] font-medium text-slate-gray hover:text-foreground"
            >
                {t("detail.backToTenantsFleet")}
            </Link>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-secondary text-foreground">
                        <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                                {tenant.name}
                            </h1>
                            <Badge
                                variant={
                                    tenant.active ? "success" : "secondary"
                                }
                            >
                                {tenant.active ? t("active") : t("suspended")}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                                {tenant.plan}
                            </Badge>
                        </div>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {[tenant.concept, tenant.area, tenant.city]
                                .filter(Boolean)
                                .join(" · ")}
                            {tenant.legalName ? (
                                <span className="text-slate-gray/80">
                                    {" "}
                                    · {tenant.legalName}
                                </span>
                            ) : null}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[12px] font-medium text-background hover:bg-foreground/90"
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
                        className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="size-3.5" />
                        {t("detail.deleteRestaurant")}
                    </button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-hairline bg-card sm:grid-cols-4">
                {metrics.map((metric, index) => (
                    <div
                        key={metric.label}
                        className={cn(
                            "px-4 py-3.5",
                            index % 2 === 1 && "border-l border-hairline",
                            index >= 2 &&
                                "border-t border-hairline sm:border-t-0",
                            index > 0 && "sm:border-l sm:border-hairline",
                        )}
                    >
                        <p className="text-[11px] font-medium text-slate-gray">
                            {metric.label}
                        </p>
                        <p className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>

            <section className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-[14px] font-semibold text-foreground">
                            {t("detail.provisionedBranches")}
                        </h2>
                        {branchesRes ? (
                            <p className="mt-0.5 text-[12px] text-slate-gray">
                                {tOwner("branchLimit", {
                                    active: branchesRes.activeCount,
                                    max: branchesRes.maxBranches,
                                })}
                            </p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={() => setAddBranchOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-hairline bg-card px-3 text-[12px] font-medium text-foreground hover:bg-secondary"
                    >
                        <Plus className="size-3.5" />
                        {tOwner("addBranch")}
                    </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {branches.map(
                        (b: {
                            id: string;
                            name: string;
                            displayCode?: string | null;
                            status: string;
                            tableCount?: number;
                            tablesCount?: number;
                            staffCount: number;
                            timezone?: string;
                            serviceMode?: string;
                            manager?: { name: string | null } | null;
                        }) => (
                            <div
                                key={b.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-card px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-gray">
                                            {b.displayCode ||
                                                t("detail.branchFallbackCode")}
                                        </span>
                                        <p className="truncate text-[13px] font-semibold text-foreground">
                                            {b.name}
                                        </p>
                                        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-slate-gray">
                                            {b.serviceMode === "BAKERY"
                                                ? "Bakery"
                                                : "Restaurant"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[12px] text-slate-gray">
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
                                        {b.manager?.name
                                            ? ` · ${b.manager.name}`
                                            : ""}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <Badge
                                        variant={
                                            b.status === "ACTIVE"
                                                ? "success"
                                                : "secondary"
                                        }
                                    >
                                        {b.status}
                                    </Badge>
                                    <button
                                        type="button"
                                        className="text-[11px] text-slate-gray underline-offset-2 hover:underline"
                                        onClick={() =>
                                            void updateBranch({
                                                branchId: b.id,
                                                body: {
                                                    tenantId,
                                                    serviceMode:
                                                        b.serviceMode ===
                                                        "BAKERY"
                                                            ? "RESTAURANT"
                                                            : "BAKERY",
                                                },
                                            })
                                                .unwrap()
                                                .then(() => refetchBranches())
                                                .catch(() =>
                                                    toast.error(
                                                        "Could not update branch type.",
                                                    ),
                                                )
                                        }
                                    >
                                        {b.serviceMode === "BAKERY"
                                            ? "Make restaurant"
                                            : "Make bakery"}
                                    </button>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-card">
                <div className="border-b border-hairline px-4 py-3">
                    <h2 className="text-[14px] font-semibold text-foreground">
                        {t("detail.specTitle")}
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        {t("detail.specSubtitle")}
                    </p>
                </div>
                <div className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Fact label={t("detail.factCity")} value={tenant.city} />
                    <Fact
                        label={t("detail.factAreaDistrict")}
                        value={tenant.area || t("detail.defaultArea")}
                    />
                    <Fact
                        label={t("detail.factPhysicalAddress")}
                        value={tenant.address}
                    />
                    <Fact
                        label={t("detail.factPrimaryPhone")}
                        value={tenant.phone}
                    />
                    <Fact
                        label={t("detail.factContactEmail")}
                        value={tenant.email}
                    />
                    <Fact
                        label={t("detail.factHouseManager")}
                        value={tenant.manager}
                    />
                    <Fact
                        label={t("detail.factOperatingHours")}
                        value={tenant.hours}
                    />
                    <Fact
                        label={t("detail.factConceptCuisine")}
                        value={tenant.concept}
                    />
                    <Fact
                        label={t("detail.factSubscriptionSla")}
                        value={tenant.plan}
                    />
                    <Fact
                        label={t("detail.factProvisionedOn")}
                        value={tenant.provisionedAt}
                    />
                    <Fact
                        label={t("detail.factTenantUuid")}
                        value={tenant.id}
                        mono
                    />
                </div>
            </section>

            {addBranchOpen ? (
                <AddBranchSheet
                    open={addBranchOpen}
                    tenantId={tenantId}
                    onClose={() => {
                        setAddBranchOpen(false);
                        void refetch();
                        void refetchBranches();
                    }}
                />
            ) : null}
            {editOpen ? (
                <EditTenantSheet
                    open={editOpen}
                    tenant={tenant}
                    onClose={() => setEditOpen(false)}
                    onSuccess={() => {
                        void refetch();
                    }}
                />
            ) : null}

            {deleteOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-tenant-title"
                        className="w-full max-w-md rounded-2xl border border-hairline bg-card p-5 shadow-lg"
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
                            className="mt-2 h-10 rounded-xl"
                            value={deleteConfirmName}
                            onChange={e => setDeleteConfirmName(e.target.value)}
                            placeholder={t("detail.deleteConfirmPlaceholder")}
                            autoFocus
                        />
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteOpen(false)}
                                className="h-8 rounded-full px-3 text-[12px] font-medium text-slate-gray hover:bg-secondary"
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
                                className="inline-flex h-8 min-w-[120px] items-center justify-center gap-1.5 rounded-full bg-destructive px-3.5 text-[12px] font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="size-3.5 animate-spin" />
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
