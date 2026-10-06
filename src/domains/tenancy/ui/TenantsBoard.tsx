"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import dynamic from "next/dynamic";

const CreateTenantSheet = dynamic(() => import("./CreateTenantSheet"), {
    ssr: false,
});

export default function TenantsBoard() {
    const t = useTranslations("tenancy");
    const [view, setView] = useState<"cards" | "table">("table");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const {
        data: response,
        isLoading,
        isFetching,
        refetch,
    } = useGetSuperAdminTenantsQuery(undefined, {
        pollingInterval: 20_000,
        refetchOnFocus: true,
    });

    const tenants = response?.data || [];

    const columns: DataTableColumn<TenantDetail>[] = useMemo(
        () => [
            {
                id: "company",
                header: t("board.columnRestaurantCompany"),
                sortValue: row => row.name,
                cell: row => (
                    <Link
                        href={`/super-admin/tenants/${row.id}`}
                        className="flex items-center gap-3 group"
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-hairline bg-secondary font-semibold text-foreground">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <p className="font-semibold group-hover:text-foreground transition-colors">
                                {row.name}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {row.area ? `${row.area}, ` : ""}
                                {row.city}
                            </p>
                        </div>
                    </Link>
                ),
            },
            {
                id: "location",
                header: t("board.columnLocationAddress"),
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
                header: t("board.columnConcept"),
                sortValue: row => row.concept,
                cell: row => (
                    <span className="text-[13px] text-slate-gray">
                        {row.concept || t("concepts.casualDining")}
                    </span>
                ),
            },
            {
                id: "plan",
                header: t("board.columnPlanSla"),
                sortValue: row => row.plan,
                cell: row => (
                    <Badge variant="outline" className="capitalize text-[12px]">
                        {row.plan}
                    </Badge>
                ),
            },
            {
                id: "branches",
                header: t("board.columnBranches"),
                sortValue: row => row.branches,
                cell: row => (
                    <span className="font-medium text-[13px]">
                        {t("board.branchCount", { count: row.branches })}
                    </span>
                ),
            },
            {
                id: "today",
                header: t("board.columnTodayGmv"),
                sortValue: row => row.gmvToday,
                cell: row => (
                    <span className="font-semibold text-[13px] tabular-nums">
                        {row.gmvTodayFormatted || formatEtb(row.gmvToday)}
                    </span>
                ),
            },
            {
                id: "status",
                header: t("board.columnStatus"),
                sortValue: row => (row.active ? t("active") : t("suspended")),
                cell: row => (
                    <Badge variant={row.active ? "success" : "secondary"}>
                        {row.active ? t("active") : t("suspended")}
                    </Badge>
                ),
            },
        ],
        [t],
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
                        title={t("board.refreshTitle")}
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin",
                            )}
                        />
                        <span>{t("board.sync")}</span>
                    </button>
                    <span className="text-[12px] text-slate-gray">
                        {isLoading
                            ? t("board.loadingFleet")
                            : t("board.tenantsProvisioned", {
                                  count: tenants.length,
                              })}
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
                            title={t("board.tableViewTitle")}
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
                            title={t("board.cardViewTitle")}
                        >
                            <LayoutGrid className="size-4" />
                        </button>
                    </div>

                    {/* Provision Tenant CTA */}
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90 transition-all"
                    >
                        <Plus className="size-4" />
                        <span>{t("board.provisionTenant")}</span>
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
                    searchPlaceholder={t("board.searchPlaceholder")}
                    searchText={row =>
                        `${row.name} ${row.city} ${row.area || ""} ${row.concept || ""} ${row.plan} ${row.manager}`
                    }
                    empty={t("board.emptyState")}
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
                                    {tenant.active
                                        ? t("active")
                                        : t("suspended")}
                                </Badge>
                            </div>
                            <h2 className="mt-3 text-[18px] font-semibold group-hover:text-brand transition-colors">
                                {tenant.name}
                            </h2>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {tenant.area ? `${tenant.area}, ` : ""}
                                {tenant.city}
                            </p>
                            <p className="mt-3 text-[12px] text-slate-gray">
                                <span className="capitalize">
                                    {tenant.plan}
                                </span>
                                {" · "}
                                {t("board.branchCount", {
                                    count: tenant.branches,
                                })}
                                {" · "}
                                {tenant.gmvTodayFormatted ||
                                    formatEtb(tenant.gmvToday)}{" "}
                                {t("board.cardToday")}
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            {isCreateOpen ? (
                <CreateTenantSheet
                    open={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => refetch()}
                />
            ) : null}
        </div>
    );
}
