"use client";

import { useMemo, useState } from "react";
import {
    Activity,
    Check,
    Clock,
    Copy,
    FileText,
    QrCode,
    Receipt,
    RefreshCw,
    Shield,
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
    useListAuditEventsQuery,
    type AuditCategory,
    type AuditEventRow,
} from "@/context/services/auditApi";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type CategoryFilter = "all" | AuditCategory;
type DateFilter = "all" | "today" | "yesterday" | "7days";

const CATEGORY_TABS = [
    { id: "all", labelKey: "categories.all" },
    { id: "orders", labelKey: "categories.orders" },
    { id: "fulfillment", labelKey: "categories.fulfillment" },
    { id: "payments", labelKey: "categories.payments" },
    { id: "system", labelKey: "categories.system" },
] as const satisfies ReadonlyArray<{
    id: CategoryFilter;
    labelKey: string;
}>;

const DATE_PRESETS = [
    { id: "today", labelKey: "datePresets.today" },
    { id: "yesterday", labelKey: "datePresets.yesterday" },
    { id: "7days", labelKey: "datePresets.7days" },
    { id: "all", labelKey: "datePresets.all" },
] as const satisfies ReadonlyArray<{
    id: DateFilter;
    labelKey: string;
}>;

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export default function ManagerAuditPage() {
    const t = useTranslations("managerAudit");
    const tCommon = useTranslations("common");

    const [selectedCategory, setSelectedCategory] =
        useState<CategoryFilter>("all");
    const [dateFilter, setDateFilter] = useState<DateFilter>("7days");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
        useListAuditEventsQuery(
            {
                category:
                    selectedCategory === "all" ? undefined : selectedCategory,
                q: searchQuery.trim() || undefined,
                page,
                limit,
                startDate,
                endDate,
            },
            { pollingInterval: 15000 },
        );

    const events = data?.data ?? [];
    const summary = data?.summary;
    const paginationMeta = data?.pagination;

    function handleCopy(id: string) {
        void navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast.success(t("toastUuidCopied"), {
            description: id,
        });
        setTimeout(() => setCopiedId(null), 2000);
    }

    const columns: DataTableColumn<AuditEventRow>[] = useMemo(
        () => [
            {
                id: "timestamp",
                header: t("colTimestamp"),
                sortValue: row => new Date(row.occurredAt).getTime(),
                cell: row => (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Clock className="size-3.5 text-slate-gray" />
                            <span>{row.timestampLabel}</span>
                        </div>
                        <span className="text-[11px] text-slate-gray font-mono">
                            {new Date(row.occurredAt).toLocaleTimeString(
                                "en-GB",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                },
                            )}
                        </span>
                    </div>
                ),
            },
            {
                id: "action",
                header: t("colEventAction"),
                sortValue: row => row.actionLabel,
                cell: row => {
                    const icon =
                        row.category === "orders" ? (
                            <UtensilsCrossed className="size-3.5 text-slate-gray" />
                        ) : row.category === "fulfillment" ? (
                            <FileText className="size-3.5 text-slate-gray" />
                        ) : row.category === "payments" ? (
                            <Receipt className="size-3.5 text-slate-gray" />
                        ) : (
                            <Shield className="size-3.5 text-slate-gray" />
                        );

                    return (
                        <div className="flex items-start gap-2.5 max-w-[280px]">
                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-slate-gray">
                                {icon}
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="font-semibold text-foreground text-[13px] leading-tight">
                                    {row.actionLabel}
                                </span>
                                <div>
                                    <Badge
                                        variant="outline"
                                        className="text-[10.5px] px-1.5 py-0 font-normal text-slate-gray border-hairline"
                                    >
                                        {row.badgeLabel}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "category",
                header: t("colDomain"),
                sortValue: row => row.category,
                cell: row => {
                    const categoryKey = `categories.${row.category}` as const;
                    const label = t.has(categoryKey)
                        ? t(categoryKey)
                        : row.category;

                    return (
                        <span className="inline-flex items-center rounded-md border border-hairline bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-slate-gray">
                            {label}
                        </span>
                    );
                },
            },
            {
                id: "details",
                header: t("colContextRemarks"),
                cell: row => (
                    <div className="max-w-[320px]">
                        {row.details ? (
                            <p className="text-[12.5px] text-foreground font-medium leading-snug">
                                {row.details}
                            </p>
                        ) : (
                            <span className="text-[12px] text-slate-gray italic">
                                {t("standardActivity")}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                id: "actor",
                header: t("colStaffActor"),
                sortValue: row => row.actorName,
                cell: row => (
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-slate-gray font-semibold text-[11px] border border-hairline">
                            {row.actorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground text-[13px]">
                                {row.actorName}
                            </span>
                            <span className="text-[11px] text-slate-gray">
                                {row.actorRole}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                id: "entity",
                header: t("colEntityLogId"),
                cell: row => (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-gray bg-secondary/80 px-2 py-0.5 rounded-md border border-hairline">
                            {row.entityType}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCopy(row.id)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-gray hover:text-foreground hover:bg-secondary transition-colors"
                            title={t("copyAuditUuidTitle")}
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
        [copiedId, t],
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
                    compact
                    eyebrow="Security & Operations"
                    title="Audit Trail"
                    description="Tenant-scoped activity log — auto-refreshes every 15s."
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
                        {tCommon("refresh")}
                    </Button>
                </div>
            </div>

            {/* KPI Metric Summary Cards - Neutral Monochrome Style */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            {t("kpiLoggedToday")}
                        </p>
                        <Activity className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading ? "…" : (summary?.totalToday ?? 0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("kpiTotalBranchEvents")}
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            {t("kpiPaymentsLogged")}
                        </p>
                        <QrCode className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading ? "…" : (summary?.paymentToday ?? 0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("kpiPaymentsSub")}
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            {t("kpiStationCompletions")}
                        </p>
                        <FileText className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading ? "…" : (summary?.fulfillmentToday ?? 0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("kpiStationSub")}
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300 shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            {t("kpiAuditLedger")}
                        </p>
                        <Shield className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {t("kpiLocked")}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("kpiAppendOnly")}
                    </p>
                </div>
            </div>

            {/* Quick Date Filters & Category Bar */}
            <div className="flex flex-col gap-3 rounded-[16px] border border-hairline bg-card p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1">
                    {CATEGORY_TABS.map(tab => {
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
                                {t(tab.labelKey)}
                            </button>
                        );
                    })}
                </div>

                {/* Date Presets & Page Size */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline lg:border-t-0 lg:pt-0">
                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-hairline">
                        {DATE_PRESETS.map(preset => (
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
                                {t(preset.labelKey)}
                            </button>
                        ))}
                    </div>

                    <select
                        aria-label={t("rowsPerPageAria")}
                        value={limit}
                        onChange={e => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="h-8 rounded-xl border border-hairline bg-card px-2.5 text-[12px] text-foreground outline-none cursor-pointer"
                    >
                        {PAGE_SIZE_OPTIONS.map(size => (
                            <option key={size} value={size}>
                                {t("perPage", { count: size })}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {isError ? (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
                    {t("loadError")}
                </div>
            ) : null}

            {/* DataTable Component */}
            <DataTable<AuditEventRow>
                columns={columns}
                data={events}
                rowKey={row => row.id}
                searchPlaceholder={t("searchPlaceholder")}
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
                            {t("emptyTitle")}
                        </p>
                        <p className="mt-1 max-w-sm text-[13px] text-slate-gray">
                            {t("emptyDesc")}
                        </p>
                        {(selectedCategory !== "all" ||
                            dateFilter !== "today" ||
                            searchQuery) && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedCategory("all");
                                    setDateFilter("today");
                                    setSearchQuery("");
                                    setPage(1);
                                }}
                                className="mt-4 rounded-xl text-[12.5px]"
                            >
                                {t("resetAllFilters")}
                            </Button>
                        )}
                    </div>
                }
            />
        </DashboardFrame>
    );
}
