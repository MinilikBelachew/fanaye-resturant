"use client";

import { useMemo, useState } from "react";
import {
    Building2,
    LayoutGrid,
    Plus,
    RefreshCw,
    Table as TableIcon,
} from "lucide-react";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import {
    type TenantDetail,
    useGetSuperAdminTenantsQuery,
} from "@/context/services/superAdminApi";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import CreateTenantSheet from "./CreateTenantSheet";

export default function TenantsBoard() {
    const [view, setView] = useState<"cards" | "table">("table");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const {
        data: response,
        isLoading,
        isFetching,
        refetch,
    } = useGetSuperAdminTenantsQuery();

    const tenants = response?.data || [];

    const columns: DataTableColumn<TenantDetail>[] = useMemo(
        () => [
            {
                id: "company",
                header: "Restaurant Company",
                sortValue: row => row.name,
                cell: row => (
                    <Link
                        href={`/super-admin/tenants/${row.id}`}
                        className="flex items-center gap-3 group"
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-hairline bg-surface-ivory font-semibold text-brand transition-colors group-hover:border-brand/40 group-hover:bg-brand/5">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <p className="font-semibold group-hover:text-brand transition-colors">
                                {row.name}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {row.area ? `${row.area}, ` : ""}{row.city}
                            </p>
                        </div>
                    </Link>
                ),
            },
            {
                id: "location",
                header: "Location & Address",
                sortValue: row => `${row.city} ${row.area}`,
                cell: row => (
                    <div>
                        <p className="text-[13px] font-medium text-foreground">
                            {row.city}
                        </p>
                        <p className="text-[11px] text-slate-gray line-clamp-1">
                            {row.address || row.area}
                        </p>
                    </div>
                ),
            },
            {
                id: "concept",
                header: "Concept",
                sortValue: row => row.concept,
                cell: row => (
                    <span className="text-[13px] text-slate-gray">
                        {row.concept || "Casual Dining"}
                    </span>
                ),
            },
            {
                id: "plan",
                header: "Plan SLA",
                sortValue: row => row.plan,
                cell: row => (
                    <Badge variant="outline" className="capitalize text-[12px]">
                        {row.plan}
                    </Badge>
                ),
            },
            {
                id: "branches",
                header: "Branches",
                sortValue: row => row.branches,
                cell: row => (
                    <span className="font-medium text-[13px]">
                        {row.branches} {row.branches === 1 ? "branch" : "branches"}
                    </span>
                ),
            },
            {
                id: "today",
                header: "Today GMV",
                sortValue: row => row.gmvToday,
                cell: row => (
                    <span className="font-semibold text-[13px] tabular-nums">
                        {row.gmvTodayFormatted || formatEtb(row.gmvToday)}
                    </span>
                ),
            },
            {
                id: "status",
                header: "Status",
                sortValue: row => (row.active ? "Active" : "Suspended"),
                cell: row => (
                    <Badge variant={row.active ? "success" : "secondary"}>
                        {row.active ? "Active" : "Suspended"}
                    </Badge>
                ),
            },
        ],
        [],
    );

    return (
        <div>
            {/* Action Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 py-1.5 text-[12px] font-medium text-slate-gray hover:text-foreground transition-colors disabled:opacity-50"
                        title="Refresh Tenant Fleet"
                    >
                        <RefreshCw
                            className={cn("size-3.5", isFetching && "animate-spin")}
                        />
                        <span>Sync</span>
                    </button>
                    <span className="text-[12px] text-slate-gray">
                        {isLoading ? "Loading fleet..." : `${tenants.length} tenants provisioned`}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher: Default Table */}
                    <div className="flex items-center rounded-full border border-hairline bg-surface-ivory p-0.5">
                        <button
                            type="button"
                            onClick={() => setView("table")}
                            className={cn(
                                "flex size-8 items-center justify-center rounded-full transition-colors",
                                view === "table"
                                    ? "border border-hairline bg-card text-foreground shadow-xs"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                            title="Table view (Default)"
                        >
                            <TableIcon className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("cards")}
                            className={cn(
                                "flex size-8 items-center justify-center rounded-full transition-colors",
                                view === "cards"
                                    ? "border border-hairline bg-card text-foreground shadow-xs"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                            title="Card view"
                        >
                            <LayoutGrid className="size-4" />
                        </button>
                    </div>

                    {/* Provision Tenant CTA */}
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-brand/90 transition-all"
                    >
                        <Plus className="size-4" />
                        <span>Provision Tenant</span>
                    </button>
                </div>
            </div>

            {/* Loading Skeleton */}
            {isLoading ? (
                <div className="rounded-[16px] border border-hairline bg-card p-6 space-y-4">
                    <div className="h-6 w-1/4 bg-surface-ivory animate-pulse rounded-lg" />
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="h-12 w-full bg-surface-ivory/60 animate-pulse rounded-xl"
                            />
                        ))}
                    </div>
                </div>
            ) : view === "table" ? (
                <DataTable
                    columns={columns}
                    data={tenants}
                    rowKey={row => row.id}
                    searchPlaceholder="Search restaurant, city, area, concept, or plan..."
                    searchText={row =>
                        `${row.name} ${row.city} ${row.area || ""} ${row.concept || ""} ${row.plan} ${row.manager}`
                    }
                    empty="No tenants provisioned yet. Click 'Provision Tenant' to onboard your first restaurant company."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {tenants.map(tenant => (
                        <Link
                            key={tenant.id}
                            href={`/super-admin/tenants/${tenant.id}`}
                            className={cn(
                                "rounded-[16px] border border-hairline bg-card p-4 transition-colors hover:border-brand/40 group",
                                !tenant.active && "opacity-80",
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex size-12 items-center justify-center rounded-[14px] border border-hairline bg-surface-ivory text-brand group-hover:bg-brand/5 transition-colors">
                                    <Building2 className="size-6" />
                                </div>
                                <Badge
                                    variant={
                                        tenant.active ? "success" : "secondary"
                                    }
                                >
                                    {tenant.active ? "Active" : "Suspended"}
                                </Badge>
                            </div>
                            <h2 className="mt-3 text-[18px] font-semibold group-hover:text-brand transition-colors">
                                {tenant.name}
                            </h2>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {tenant.area ? `${tenant.area}, ` : ""}{tenant.city}
                            </p>
                            <p className="mt-3 text-[12px] text-slate-gray">
                                <span className="capitalize">{tenant.plan}</span>
                                {" · "}
                                {tenant.branches} branch
                                {tenant.branches > 1 ? "es" : ""}
                                {" · "}
                                {tenant.gmvTodayFormatted || formatEtb(tenant.gmvToday)} today
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            {/* Slide-over Provisioning Sheet */}
            <CreateTenantSheet
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
}

