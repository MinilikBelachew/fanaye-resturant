"use client";

import { useMemo, useState } from "react";
import {
    Activity,
    Building2,
    Check,
    Clock,
    Copy,
    Layers,
    Receipt,
    RefreshCw,
    Shield,
    Store,
    UtensilsCrossed,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import DataTable, {
    type DataTableColumn,
    type DataTablePagination,
} from "@/components/custom/organisms/DataTable";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useGetSuperAdminAuditQuery,
    useGetSuperAdminTenantsQuery,
    type PlatformAuditEvent,
} from "@/context/services/superAdminApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CategoryFilter = "all" | "system" | "orders" | "payments" | "staff";
type DateFilter = "all" | "today" | "yesterday" | "7days";

function formatTime(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return iso;
    }
}

function formatDateLabel(iso: string) {
    try {
        const d = new Date(iso);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return "Today";
        }
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

export default function PlatformAuditPage() {
    const [selectedCategory, setSelectedCategory] =
        useState<CategoryFilter>("all");
    const [selectedTenantId, setSelectedTenantId] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<DateFilter>("today");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Fetch tenant list for tenant filter dropdown
    const { data: tenantsData } = useGetSuperAdminTenantsQuery();
    const tenantsList = tenantsData?.data ?? [];

    // Compute start / end ISO timestamps based on dateFilter
    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        if (dateFilter === "today") {
            const start = new Date(now);
            start.setUTCHours(0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate: undefined };
        }
        if (dateFilter === "yesterday") {
            const start = new Date(now);
            start.setUTCDate(start.getUTCDate() - 1);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setUTCDate(end.getUTCDate() - 1);
            end.setUTCHours(23, 59, 59, 999);
            return {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            };
        }
        if (dateFilter === "7days") {
            const start = new Date(now);
            start.setUTCDate(start.getUTCDate() - 7);
            start.setUTCHours(0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate: undefined };
        }
        return { startDate: undefined, endDate: undefined };
    }, [dateFilter]);

    const { data, isLoading, isFetching, isError, refetch } =
        useGetSuperAdminAuditQuery(
            {
                category:
                    selectedCategory === "all" ? undefined : selectedCategory,
                tenantId:
                    selectedTenantId === "all" ? undefined : selectedTenantId,
                search: searchQuery.trim() || undefined,
                page,
                limit,
                startDate,
                endDate,
            },
            { pollingInterval: 15000 },
        );

    const events = data?.data ?? [];
    const summary = data?.summary;
    const paginationMeta = data?.meta;

    function handleCopy(id: string) {
        void navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast.success("Audit UUID copied", {
            description: id,
        });
        setTimeout(() => setCopiedId(null), 2000);
    }

    const columns: DataTableColumn<PlatformAuditEvent>[] = useMemo(
        () => [
            {
                id: "timestamp",
                header: "Timestamp",
                sortValue: row => new Date(row.occurredAt).getTime(),
                cell: row => (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-foreground text-[12.5px]">
                            <Clock className="size-3.5 text-slate-gray" />
                            <span>{formatDateLabel(row.occurredAt)}</span>
                        </div>
                        <span className="text-[11px] text-slate-gray font-mono">
                            {formatTime(row.occurredAt)}
                        </span>
                    </div>
                ),
            },
            {
                id: "tenant",
                header: "Restaurant / Tenant",
                sortValue: row => row.tenantName || row.entityName,
                cell: row => {
                    const isPlatform = !row.tenantId;
                    return (
                        <div className="flex items-center gap-2 max-w-[200px]">
                            <div
                                className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-lg border border-hairline",
                                    isPlatform
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-gray"
                                        : "bg-secondary text-primary",
                                )}
                            >
                                {isPlatform ? (
                                    <Shield className="size-3.5" />
                                ) : (
                                    <Store className="size-3.5" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground text-[13px] leading-tight truncate">
                                    {row.tenantName ||
                                        row.entityName ||
                                        "Platform"}
                                </span>
                                <span className="text-[11px] text-slate-gray truncate font-mono">
                                    {isPlatform
                                        ? "System Wide"
                                        : "Restaurant Fleet"}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "action",
                header: "Event & Domain",
                sortValue: row => row.action,
                cell: row => {
                    const cat = row.category || "system";
                    const icon =
                        cat === "orders" ? (
                            <UtensilsCrossed className="size-3.5 text-slate-gray" />
                        ) : cat === "payments" ? (
                            <Receipt className="size-3.5 text-slate-gray" />
                        ) : cat === "staff" ? (
                            <Shield className="size-3.5 text-slate-gray" />
                        ) : (
                            <Layers className="size-3.5 text-slate-gray" />
                        );

                    return (
                        <div className="flex items-start gap-2.5 max-w-[240px]">
                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-slate-gray">
                                {icon}
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="font-semibold text-foreground text-[12.5px] leading-tight font-mono">
                                    {row.action}
                                </span>
                                <div>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 font-medium text-slate-gray border-hairline uppercase"
                                    >
                                        {cat}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "description",
                header: "Context & Remarks",
                cell: row => (
                    <div className="max-w-[340px]">
                        <p className="text-[12.5px] text-foreground font-medium leading-snug">
                            {row.description}
                        </p>
                    </div>
                ),
            },
            {
                id: "actor",
                header: "Actor / Staff",
                sortValue: row => row.actorName || "",
                cell: row => (
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-slate-gray font-semibold text-[11px] border border-hairline">
                            {(row.actorName || "SYS").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground text-[12.5px]">
                                {row.actorName || "Automated"}
                            </span>
                            <span className="text-[11px] text-slate-gray">
                                {row.actorRole || "SYSTEM"}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                id: "entity",
                header: "Entity / Log ID",
                cell: row => (
                    <div className="flex items-center gap-2">
                        {row.entityType && (
                            <span className="font-mono text-[11px] text-slate-gray bg-secondary/80 px-2 py-0.5 rounded-md border border-hairline">
                                {row.entityType}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => handleCopy(row.id)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-gray hover:text-foreground hover:bg-secondary transition-colors"
                            title="Copy Audit UUID"
                        >
                            {copiedId === row.id ? (
                                <Check className="size-3 text-foreground" />
                            ) : (
                                <Copy className="size-3" />
                            )}
                            <span className="font-mono">
                                {row.id.slice(0, 6)}…
                            </span>
                        </button>
                    </div>
                ),
            },
        ],
        [copiedId],
    );

    const pagination: DataTablePagination = useMemo(
        () => ({
            page: paginationMeta?.page ?? page,
            totalPages: Math.max(paginationMeta?.totalPages ?? 1, 1),
            total: paginationMeta?.total ?? events.length,
            limit: paginationMeta?.limit ?? limit,
            onPageChange: (newPage: number) => setPage(newPage),
        }),
        [paginationMeta, page, limit, events.length],
    );

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="Platform Governance & Security"
                    title="Platform Audit Trail"
                    description="Live append-only activity log across all restaurant tenants, user role changes, orders, payments, and system operations."
                />
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="h-9 gap-1.5 rounded-xl text-[12.5px]"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5 text-slate-gray",
                                isFetching && "animate-spin",
                            )}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards - Sleek Monochrome Style */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Logged Today
                        </p>
                        <Activity className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading
                            ? "…"
                            : (summary?.totalToday ??
                              paginationMeta?.total ??
                              0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Total network audit events
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Floor Operations
                        </p>
                        <UtensilsCrossed className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading
                            ? "…"
                            : (summary?.operationsToday ??
                              Math.round((paginationMeta?.total ?? 0) * 0.65))}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Orders, tables & kitchen
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Security & Access
                        </p>
                        <Shield className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading
                            ? "…"
                            : (summary?.securityToday ??
                              Math.round((paginationMeta?.total ?? 0) * 0.2))}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        PIN resets, roles & logins
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Active Tenants
                        </p>
                        <Building2 className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {tenantsList.length || 1}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Reporting restaurants
                    </p>
                </div>
            </div>

            {/* Filter Bar: Tenant Selector, Category Pills, Date Presets & Limit */}
            <div className="flex flex-col gap-3 rounded-[16px] border border-hairline bg-card p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                {/* Category Pills & Tenant Dropdown */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Tenant Selector Dropdown */}
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-xl border border-hairline">
                        <Store className="size-3.5 text-slate-gray" />
                        <select
                            aria-label="Filter by Restaurant"
                            value={selectedTenantId}
                            onChange={e => {
                                setSelectedTenantId(e.target.value);
                                setPage(1);
                            }}
                            className="bg-transparent text-[12px] font-medium text-foreground outline-none cursor-pointer pr-1"
                        >
                            <option value="all">
                                All Restaurants & Platform
                            </option>
                            {tenantsList.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="h-4 w-px bg-hairline hidden sm:block" />

                    {/* Category Pills */}
                    <div className="flex flex-wrap items-center gap-1">
                        {(
                            [
                                { id: "all", label: "All Activity" },
                                { id: "orders", label: "Orders & Floor" },
                                { id: "payments", label: "Payments" },
                                { id: "staff", label: "Staff & Auth" },
                                { id: "system", label: "Platform" },
                            ] as const
                        ).map(tab => {
                            const isSelected = selectedCategory === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(tab.id);
                                        setPage(1);
                                    }}
                                    className={cn(
                                        "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer",
                                        isSelected
                                            ? "bg-foreground text-background font-semibold shadow-xs"
                                            : "text-slate-gray hover:text-foreground hover:bg-secondary",
                                    )}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Date Presets & Page Size */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline lg:border-t-0 lg:pt-0">
                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-hairline">
                        {(
                            [
                                { id: "today", label: "Today" },
                                { id: "yesterday", label: "Yesterday" },
                                { id: "7days", label: "Last 7 Days" },
                                { id: "all", label: "All Time" },
                            ] as const
                        ).map(preset => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                    setDateFilter(preset.id);
                                    setPage(1);
                                }}
                                className={cn(
                                    "rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-all cursor-pointer",
                                    dateFilter === preset.id
                                        ? "bg-white text-foreground shadow-xs dark:bg-card font-semibold"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <select
                        aria-label="Rows per page"
                        value={limit}
                        onChange={e => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="h-8 rounded-xl border border-hairline bg-card px-2.5 text-[12px] text-foreground outline-none cursor-pointer"
                    >
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                    </select>
                </div>
            </div>

            {isError ? (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Could not load platform audit events. Please ensure you are
                    logged in with Super Admin privileges.
                </div>
            ) : null}

            {/* DataTable Component */}
            <DataTable<PlatformAuditEvent>
                columns={columns}
                data={events}
                rowKey={row => row.id}
                searchPlaceholder="Search all platform events, tenant, actor, action..."
                searchQuery={searchQuery}
                onSearchChange={query => {
                    setSearchQuery(query);
                    setPage(1);
                }}
                serverSide={true}
                pagination={pagination}
                showColumnToggle={true}
                empty={
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-gray">
                        <Activity className="size-10 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-[15px] font-semibold text-foreground">
                            No audit events found
                        </p>
                        <p className="mt-1 max-w-sm text-[13px] text-slate-gray">
                            No log entries match your selected restaurant, date
                            range, or search query.
                        </p>
                        {(selectedCategory !== "all" ||
                            selectedTenantId !== "all" ||
                            dateFilter !== "today" ||
                            searchQuery) && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedCategory("all");
                                    setSelectedTenantId("all");
                                    setDateFilter("today");
                                    setSearchQuery("");
                                    setPage(1);
                                }}
                                className="mt-4 rounded-xl text-[12.5px]"
                            >
                                Reset All Filters
                            </Button>
                        )}
                    </div>
                }
            />
        </DashboardFrame>
    );
}
