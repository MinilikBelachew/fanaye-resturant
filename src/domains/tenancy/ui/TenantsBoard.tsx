"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import {
    PLATFORM_TENANTS,
    type PlatformTenant,
} from "@/domains/tenancy/infrastructure/platformDemo";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function TenantsBoard() {
    const [view, setView] = useState<"cards" | "table">("cards");

    const columns: DataTableColumn<PlatformTenant>[] = useMemo(
        () => [
            {
                id: "company",
                header: "Company",
                sortValue: row => row.name,
                cell: row => (
                    <Link
                        href={`/super-admin/tenants/${row.id}`}
                        className="flex items-center gap-3"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={row.logo}
                            alt=""
                            className="size-10 shrink-0 rounded-[12px] border border-hairline"
                        />
                        <div>
                            <p className="font-semibold">{row.name}</p>
                            <p className="text-[12px] text-slate-gray">
                                {row.area}, {row.city}
                            </p>
                        </div>
                    </Link>
                ),
            },
            {
                id: "location",
                header: "Location",
                sortValue: row => `${row.city} ${row.area}`,
                cell: row => (
                    <span>
                        {row.city}
                        <span className="text-slate-gray"> · {row.area}</span>
                    </span>
                ),
            },
            {
                id: "concept",
                header: "Concept",
                sortValue: row => row.concept,
                cell: row => row.concept,
            },
            {
                id: "plan",
                header: "Plan",
                sortValue: row => row.plan,
                cell: row => <span className="capitalize">{row.plan}</span>,
            },
            {
                id: "branches",
                header: "Branches",
                sortValue: row => row.branches,
                cell: row => row.branches,
            },
            {
                id: "today",
                header: "Today",
                sortValue: row => row.gmvToday,
                cell: row => formatEtb(row.gmvToday),
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
            <div className="mb-4 flex items-center justify-end">
                <div className="flex items-center rounded-full border border-hairline bg-surface-ivory p-0.5">
                    <button
                        type="button"
                        onClick={() => setView("cards")}
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full transition-colors",
                            view === "cards"
                                ? "border border-hairline bg-card text-foreground"
                                : "text-slate-gray hover:text-foreground",
                        )}
                        title="Card view"
                    >
                        <LayoutGrid className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("table")}
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full transition-colors",
                            view === "table"
                                ? "border border-hairline bg-card text-foreground"
                                : "text-slate-gray hover:text-foreground",
                        )}
                        title="Table view"
                    >
                        <TableIcon className="size-4" />
                    </button>
                </div>
            </div>

            {view === "table" ? (
                <DataTable
                    columns={columns}
                    data={PLATFORM_TENANTS}
                    rowKey={row => row.id}
                    searchPlaceholder="Search company or city..."
                    searchText={row =>
                        `${row.name} ${row.city} ${row.area} ${row.concept} ${row.plan}`
                    }
                    empty="No tenants provisioned."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {PLATFORM_TENANTS.map(tenant => (
                        <Link
                            key={tenant.id}
                            href={`/super-admin/tenants/${tenant.id}`}
                            className={cn(
                                "rounded-[16px] border border-hairline bg-card p-4 transition-colors hover:border-primary/40",
                                !tenant.active && "opacity-80",
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={tenant.logo}
                                    alt={`${tenant.name} logo`}
                                    className="size-12 rounded-[14px] border border-hairline"
                                />
                                <Badge
                                    variant={
                                        tenant.active ? "success" : "secondary"
                                    }
                                >
                                    {tenant.active ? "Active" : "Suspended"}
                                </Badge>
                            </div>
                            <h2 className="mt-3 text-[18px] font-semibold">
                                {tenant.name}
                            </h2>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {tenant.area}, {tenant.city}
                            </p>
                            <p className="mt-3 text-[12px] text-slate-gray">
                                <span className="capitalize">{tenant.plan}</span>
                                {" · "}
                                {tenant.branches} branch
                                {tenant.branches > 1 ? "es" : ""}
                                {" · "}
                                {formatEtb(tenant.gmvToday)} today
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
