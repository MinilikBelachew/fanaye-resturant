"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Crown,
    Eye,
    Receipt,
    RefreshCw,
    Search,
    TrendingUp,
    UtensilsCrossed,
    Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import {
    type TenantActivityDailyRow,
    type TenantActivityMovementItem,
    type TenantActivityTableItem,
    useGetSuperAdminTenantActivityQuery,
    useGetSuperAdminTenantsQuery,
} from "@/context/services/superAdminApi";
import { useImpersonation } from "@/domains/identity/application/useImpersonation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

function toYmd(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function daysAgoYmd(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return toYmd(d);
}

const MOVEMENT_CATEGORIES = [
    { id: "ALL", label: "All Movements" },
    { id: "SALES", label: "Sales & Payments" },
    { id: "TABLES", label: "Tables & Orders" },
    { id: "CASH", label: "Cash & Expenses" },
    { id: "INVENTORY", label: "Inventory & Stock" },
    { id: "SHIFTS", label: "Staff Shifts" },
    { id: "AUDIT", label: "Audit Events" },
] as const;

function categoryBadgeClass(cat: TenantActivityMovementItem["category"]) {
    switch (cat) {
        case "SALES":
            return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        case "TABLES":
            return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
        case "CASH":
            return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        case "INVENTORY":
            return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
        case "SHIFTS":
            return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
        case "AUDIT":
        default:
            return "bg-secondary text-muted-foreground border-border";
    }
}

export default function TenantActivityBoard({
    fixedTenantId,
}: {
    fixedTenantId?: string;
}) {
    const t = useTranslations("tenantActivity");
    const isAm = useLocale() === "am";
    const todayStr = useMemo(() => toYmd(new Date()), []);
    const [selectedTenantId, setSelectedTenantId] = useState<string>(
        fixedTenantId || "",
    );
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");
    const [datePreset, setDatePreset] = useState<
        "today" | "yesterday" | "7d" | "30d" | "custom"
    >("7d");
    const [startDate, setStartDate] = useState<string>(() => daysAgoYmd(6));
    const [endDate, setEndDate] = useState<string>(() => toYmd(new Date()));
    const [activeSection, setActiveSection] = useState<
        "daily" | "tables" | "movements"
    >("daily");
    const [tableFilter, setTableFilter] = useState<
        "all" | "occupied" | "available"
    >("all");
    const [movementCategory, setMovementCategory] = useState<string>("ALL");
    const [movementSearch, setMovementSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    const [dailyPage, setDailyPage] = useState<number>(1);
    const [dailyPageSize] = useState<number>(10);

    const [tablesPage, setTablesPage] = useState<number>(1);
    const tablesPerPage = 16;

    const [movementPage, setMovementPage] = useState<number>(1);
    const [movementPageSize, setMovementPageSize] = useState<number>(25);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(movementSearch);
            setMovementPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [movementSearch]);

    useEffect(() => {
        setDailyPage(1);
        setTablesPage(1);
        setMovementPage(1);
    }, [selectedTenantId, selectedBranchId, startDate, endDate]);

    const effectiveTenantId = fixedTenantId || selectedTenantId || undefined;

    const { data: tenantsRes } = useGetSuperAdminTenantsQuery(undefined, {
        skip: Boolean(fixedTenantId),
    });
    const tenants = tenantsRes?.data ?? [];

    const {
        data: activity,
        isLoading,
        isFetching,
        refetch,
    } = useGetSuperAdminTenantActivityQuery(
        {
            tenantId: effectiveTenantId,
            branchId: selectedBranchId || undefined,
            startDate,
            endDate,
            movementType: movementCategory,
            movementPage,
            movementLimit: movementPageSize,
            movementSearch: debouncedSearch.trim() || undefined,
        },
        {
            pollingInterval: 15_000,
            refetchOnFocus: true,
        },
    );

    const { impersonate, isStarting: isImpersonating } = useImpersonation();

    function applyPreset(preset: "today" | "yesterday" | "7d" | "30d") {
        setDatePreset(preset);
        if (preset === "today") {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === "yesterday") {
            const y = daysAgoYmd(1);
            setStartDate(y);
            setEndDate(y);
        } else if (preset === "7d") {
            setStartDate(daysAgoYmd(6));
            setEndDate(todayStr);
        } else if (preset === "30d") {
            setStartDate(daysAgoYmd(29));
            setEndDate(todayStr);
        }
    }

    const summary = activity?.summary;
    const branches = activity?.branches ?? [];
    const dailyRows = activity?.dailyBreakdown ?? [];
    const allTables = useMemo(
        () => activity?.activeTables ?? [],
        [activity?.activeTables],
    );
    const movements = useMemo(
        () => activity?.movements ?? [],
        [activity?.movements],
    );

    const filteredTables = useMemo(() => {
        if (tableFilter === "occupied") {
            return allTables.filter(t => t.isOccupied);
        }
        if (tableFilter === "available") {
            return allTables.filter(t => !t.isOccupied);
        }
        return allTables;
    }, [allTables, tableFilter]);

    const totalTablePages = Math.max(
        1,
        Math.ceil(filteredTables.length / tablesPerPage),
    );
    const paginatedTables = useMemo(() => {
        const start = (tablesPage - 1) * tablesPerPage;
        return filteredTables.slice(start, start + tablesPerPage);
    }, [filteredTables, tablesPage, tablesPerPage]);

    const totalMovements =
        activity?.movementPagination?.total ?? movements.length;
    const totalMovementPages =
        activity?.movementPagination?.totalPages ??
        Math.max(1, Math.ceil(totalMovements / movementPageSize));

    const dailyColumns: DataTableColumn<TenantActivityDailyRow>[] = useMemo(
        () => [
            {
                id: "date",
                header: t("columns.businessDate"),
                sortValue: row => row.date,
                cell: row => (
                    <span className="font-mono text-[12.5px] font-semibold text-foreground">
                        {row.date}
                    </span>
                ),
            },
            ...(!effectiveTenantId
                ? [
                      {
                          id: "tenant",
                          header: t("columns.restaurant"),
                          sortValue: (row: TenantActivityDailyRow) =>
                              row.tenantName,
                          cell: (row: TenantActivityDailyRow) => (
                              <span className="text-[13px] font-medium text-foreground">
                                  {row.tenantName}
                              </span>
                          ),
                      },
                  ]
                : []),
            {
                id: "branch",
                header: t("columns.branch"),
                sortValue: row => row.branchName,
                cell: row => (
                    <span className="text-[13px] font-medium text-foreground">
                        {row.branchName}
                    </span>
                ),
            },
            {
                id: "gmv",
                header: t("columns.totalSalesGmv"),
                sortValue: row => row.totalGmv,
                cell: row => (
                    <span className="font-semibold text-[13px] tabular-nums text-foreground">
                        {formatEtb(row.totalGmv)}
                    </span>
                ),
            },
            {
                id: "cashDigital",
                header: t("columns.cashVsDigital"),
                sortValue: row => row.cashSales,
                cell: row => (
                    <div className="text-[12px] tabular-nums">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {t("cash")}: {formatEtb(row.cashSales)}
                        </span>
                        <span className="mx-1.5 text-slate-gray">·</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                            {t("digitalTransfer")}:{" "}
                            {formatEtb(row.digitalSales)}
                        </span>
                    </div>
                ),
            },
            {
                id: "billsOrders",
                header: t("columns.billsOrders"),
                sortValue: row => row.billsCount,
                cell: row => (
                    <div className="text-[12px] text-foreground">
                        <span className="font-medium">
                            {row.paidBillsCount}/{row.billsCount}{" "}
                            {t("columns.billsSuffix")}
                        </span>
                        <span className="mx-1 text-slate-gray">·</span>
                        <span className="text-slate-gray">
                            {row.ordersCount} {t("columns.ordersSuffix")}
                        </span>
                    </div>
                ),
            },
            {
                id: "tablesShifts",
                header: t("columns.tablesShifts"),
                sortValue: row => row.tableSessionsCount,
                cell: row => (
                    <div className="text-[12px] text-slate-gray">
                        <span>
                            {row.tableSessionsCount}{" "}
                            {t("columns.tableVisitsSuffix")}
                        </span>
                        <span className="mx-1">·</span>
                        <span>
                            {row.shiftsCount} {t("columns.shiftsSuffix")}
                        </span>
                    </div>
                ),
            },
            {
                id: "dropsExpenses",
                header: t("columns.dropsExpenses"),
                sortValue: row => row.cashDropsTotal,
                cell: row => (
                    <div className="text-[12px] tabular-nums text-slate-gray">
                        <span>
                            {t("columns.dropsPrefix")}{" "}
                            {formatEtb(row.cashDropsTotal)}
                        </span>
                        {row.expensesTotal > 0 ? (
                            <>
                                <span className="mx-1">·</span>
                                <span className="text-rose-600 dark:text-rose-400">
                                    {t("columns.expPrefix")}{" "}
                                    {formatEtb(row.expensesTotal)}
                                </span>
                            </>
                        ) : null}
                    </div>
                ),
            },
            {
                id: "dailyClose",
                header: t("columns.dailyClose"),
                sortValue: row => row.dailyCloseStatus,
                cell: row => (
                    <div className="flex items-center gap-1.5">
                        <Badge
                            variant={
                                row.dailyCloseStatus === "LOCKED" ||
                                row.dailyCloseStatus === "APPROVED"
                                    ? "success"
                                    : "secondary"
                            }
                            className="text-[11px]"
                        >
                            {isAm
                                ? row.dailyCloseStatus === "LOCKED"
                                    ? "የተቆለፈ"
                                    : row.dailyCloseStatus === "APPROVED"
                                      ? "የጸደቀ"
                                      : row.dailyCloseStatus === "PENDING"
                                        ? "በመጠባበቅ ላይ"
                                        : row.dailyCloseStatus === "OPEN"
                                          ? "ክፍት"
                                          : row.dailyCloseStatus
                                : row.dailyCloseStatus}
                        </Badge>
                        {row.cashVariance !== 0 ? (
                            <span
                                className={cn(
                                    "text-[11px] font-mono",
                                    row.cashVariance < 0
                                        ? "text-destructive"
                                        : "text-amber-600",
                                )}
                            >
                                ({row.cashVariance > 0 ? "+" : ""}
                                {formatEtb(row.cashVariance)})
                            </span>
                        ) : null}
                    </div>
                ),
            },
        ],
        [effectiveTenantId, t, isAm],
    );

    const cashPct =
        summary && summary.cashVolume + summary.digitalVolume > 0
            ? Math.round(
                  (summary.cashVolume /
                      (summary.cashVolume + summary.digitalVolume)) *
                      100,
              )
            : 0;
    const digitalPct =
        summary && summary.cashVolume + summary.digitalVolume > 0
            ? 100 - cashPct
            : 0;

    return (
        <div className="space-y-5">
            {/* Filter Bar */}
            <div className="rounded-2xl border border-hairline bg-card p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                        {/* Tenant Filter (unless fixed inside TenantDetailView) */}
                        {!fixedTenantId ? (
                            <div className="min-w-[200px]">
                                <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                    {t("restaurantTenant")}
                                </label>
                                <select
                                    value={selectedTenantId}
                                    onChange={e => {
                                        setSelectedTenantId(e.target.value);
                                        setSelectedBranchId("");
                                    }}
                                    className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-[12.5px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">
                                        {t("allRestaurants", {
                                            count: tenants.length,
                                        })}
                                    </option>
                                    {tenants.map(tItem => (
                                        <option key={tItem.id} value={tItem.id}>
                                            {tItem.name} ({tItem.city})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {/* Branch Filter */}
                        <div className="min-w-[190px]">
                            <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                {t("branch")}
                            </label>
                            <select
                                value={selectedBranchId}
                                onChange={e =>
                                    setSelectedBranchId(e.target.value)
                                }
                                className="h-9 w-full rounded-xl border border-hairline bg-background px-3 text-[12.5px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">
                                    {t("allBranches", {
                                        count: branches.length,
                                    })}
                                </option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} (
                                        {effectiveTenantId
                                            ? b.displayCode
                                            : b.tenantName}
                                        )
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quick Date Presets */}
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                {t("period")}
                            </label>
                            <div className="inline-flex h-9 items-center rounded-xl border border-hairline bg-background p-0.5">
                                {(
                                    [
                                        { id: "today", label: t("today") },
                                        {
                                            id: "yesterday",
                                            label: t("yesterday"),
                                        },
                                        { id: "7d", label: t("days7") },
                                        { id: "30d", label: t("days30") },
                                    ] as const
                                ).map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => applyPreset(p.id)}
                                        className={cn(
                                            "h-8 rounded-lg px-2.5 text-[12px] font-medium transition-colors",
                                            datePreset === p.id
                                                ? "bg-foreground text-background"
                                                : "text-slate-gray hover:text-foreground",
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Date Range */}
                        <div className="flex items-end gap-2">
                            <div>
                                <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                    {t("from")}
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    max={endDate}
                                    onChange={e => {
                                        setStartDate(e.target.value);
                                        setDatePreset("custom");
                                    }}
                                    className="h-9 w-[140px] rounded-xl text-[12px]"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-medium text-slate-gray">
                                    {t("to")}
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={e => {
                                        setEndDate(e.target.value);
                                        setDatePreset("custom");
                                    }}
                                    className="h-9 w-[140px] rounded-xl text-[12px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right actions: Impersonate + Refresh */}
                    <div className="flex flex-wrap items-center gap-2">
                        {effectiveTenantId ? (
                            <>
                                <button
                                    type="button"
                                    disabled={isImpersonating}
                                    onClick={() =>
                                        void impersonate({
                                            tenantId: effectiveTenantId,
                                            targetRole: "OWNER_ADMIN",
                                            branchId:
                                                selectedBranchId || undefined,
                                        })
                                    }
                                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-background px-3 text-[12px] font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                                >
                                    <Crown className="size-3.5 text-amber-500" />
                                    <span>{t("viewAsOwner")}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isImpersonating}
                                    onClick={() =>
                                        void impersonate({
                                            tenantId: effectiveTenantId,
                                            targetRole: "MANAGER",
                                            branchId:
                                                selectedBranchId || undefined,
                                        })
                                    }
                                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-background px-3 text-[12px] font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                                >
                                    <Eye className="size-3.5 text-primary" />
                                    <span>{t("viewAsManager")}</span>
                                </button>
                            </>
                        ) : null}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="h-9 gap-1.5 rounded-xl px-3 text-[12px]"
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3.5",
                                    isFetching && "animate-spin",
                                )}
                            />
                            <span>{t("refresh")}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[12px] font-medium">
                            {t("periodSalesGmv")}
                        </span>
                        <TrendingUp className="size-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-[22px] font-bold tracking-tight tabular-nums text-foreground">
                        {formatEtb(summary?.totalGmv ?? 0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("avgPerActiveDay")}{" "}
                        <strong className="font-semibold text-foreground">
                            {formatEtb(summary?.avgDailyGmv ?? 0)}
                        </strong>
                    </p>
                </div>

                <div className="rounded-2xl border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[12px] font-medium">
                            {t("cashVsDigital")}
                        </span>
                        <Wallet className="size-4 text-blue-500" />
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-2 tabular-nums">
                        <div>
                            <p className="text-[11px] text-slate-gray">
                                {t("cash")}
                            </p>
                            <p className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">
                                {formatEtb(summary?.cashVolume ?? 0)}{" "}
                                <span className="text-[11px] font-normal">
                                    ({cashPct}%)
                                </span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] text-slate-gray">
                                {t("digitalTransfer")}
                            </p>
                            <p className="text-[16px] font-bold text-blue-600 dark:text-blue-400">
                                {formatEtb(summary?.digitalVolume ?? 0)}{" "}
                                <span className="text-[11px] font-normal">
                                    ({digitalPct}%)
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                            className="bg-emerald-500 transition-all"
                            style={{ width: `${cashPct}%` }}
                        />
                        <div
                            className="bg-blue-500 transition-all"
                            style={{ width: `${digitalPct}%` }}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[12px] font-medium">
                            {t("ordersBillsTableVisits")}
                        </span>
                        <Receipt className="size-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-[22px] font-bold tracking-tight tabular-nums text-foreground">
                        {summary?.totalBills ?? 0}{" "}
                        <span className="text-[13px] font-normal text-slate-gray">
                            {t("billsSummary", {
                                paid: summary?.paidBills ?? 0,
                                unpaid: summary?.unpaidBills ?? 0,
                            })}
                        </span>
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("ordersSummary", {
                            orders: summary?.totalOrders ?? 0,
                            sessions: summary?.totalTableSessions ?? 0,
                        })}
                    </p>
                </div>

                <div className="rounded-2xl border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between text-slate-gray">
                        <span className="text-[12px] font-medium">
                            {t("liveActiveTablesStaff")}
                        </span>
                        <UtensilsCrossed className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-[22px] font-bold tracking-tight tabular-nums text-foreground">
                        {summary?.activeTablesCount ?? 0}{" "}
                        <span className="text-[14px] font-normal text-slate-gray">
                            {t("tablesActiveNow", {
                                total: summary?.totalTablesCount ?? 0,
                            })}
                        </span>
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("staffOnDuty", {
                            staff: summary?.activeStaffShiftsCount ?? 0,
                        })}{" "}
                        · {t("drops")}{" "}
                        <strong className="font-semibold text-foreground">
                            {formatEtb(summary?.cashDropsVolume ?? 0)}
                        </strong>
                    </p>
                </div>
            </div>

            {/* Branch Quick Pills when multiple branches exist */}
            {branches.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedBranchId("")}
                        className={cn(
                            "rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-colors",
                            !selectedBranchId
                                ? "border-foreground bg-foreground text-background"
                                : "border-hairline bg-card text-foreground hover:bg-secondary",
                        )}
                    >
                        {t("allBranches", { count: branches.length })}
                    </button>
                    {branches.map(b => (
                        <button
                            key={b.id}
                            type="button"
                            onClick={() =>
                                setSelectedBranchId(
                                    selectedBranchId === b.id ? "" : b.id,
                                )
                            }
                            className={cn(
                                "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-colors",
                                selectedBranchId === b.id
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-hairline bg-card text-foreground hover:bg-secondary",
                            )}
                        >
                            <span>{b.name}</span>
                            <span
                                className={cn(
                                    "rounded-full px-1.5 py-0.2 text-[10px]",
                                    selectedBranchId === b.id
                                        ? "bg-background/20 text-background"
                                        : "bg-secondary text-slate-gray",
                                )}
                            >
                                {b.activeTables}/{b.totalTables} tables ·{" "}
                                {formatEtb(b.periodGmv)}
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}

            {/* Sub-navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveSection("daily")}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                            activeSection === "daily"
                                ? "bg-foreground text-background"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <Calendar className="size-3.5" />
                        <span>
                            {t("dailyBreakdownTab", {
                                count: dailyRows.length,
                            })}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("tables")}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                            activeSection === "tables"
                                ? "bg-foreground text-background"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <UtensilsCrossed className="size-3.5" />
                        <span>
                            {t("liveFloorTablesTab", {
                                active: summary?.activeTablesCount ?? 0,
                                total: summary?.totalTablesCount ?? 0,
                            })}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("movements")}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                            activeSection === "movements"
                                ? "bg-foreground text-background"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <Activity className="size-3.5" />
                        <span>
                            {t("allMovementsTab", { count: movements.length })}
                        </span>
                    </button>
                </div>
            </div>

            {/* Tab 1: Daily Breakdown */}
            {activeSection === "daily" ? (
                <DataTable
                    columns={dailyColumns}
                    data={dailyRows}
                    rowKey={row => `${row.date}-${row.branchId}`}
                    searchPlaceholder={t("searchDaily")}
                    searchText={row =>
                        `${row.date} ${row.tenantName} ${row.branchName} ${row.dailyCloseStatus}`
                    }
                    empty={isLoading ? t("loadingDaily") : t("noDailyActivity")}
                    pagination={{
                        page: dailyPage,
                        limit: dailyPageSize,
                        total: dailyRows.length,
                        totalPages: Math.max(
                            1,
                            Math.ceil(dailyRows.length / dailyPageSize),
                        ),
                        onPageChange: setDailyPage,
                    }}
                />
            ) : null}

            {/* Tab 2: Live Floor & Active Tables */}
            {activeSection === "tables" ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-xl border border-hairline bg-card p-1">
                            {(
                                [
                                    {
                                        id: "all",
                                        label: t("tableFilterAll", {
                                            count: allTables.length,
                                        }),
                                    },
                                    {
                                        id: "occupied",
                                        label: t("tableFilterOccupied", {
                                            count: allTables.filter(
                                                tbl => tbl.isOccupied,
                                            ).length,
                                        }),
                                    },
                                    {
                                        id: "available",
                                        label: t("tableFilterAvailable", {
                                            count: allTables.filter(
                                                tbl => !tbl.isOccupied,
                                            ).length,
                                        }),
                                    },
                                ] as const
                            ).map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                        setTableFilter(f.id);
                                        setTablesPage(1);
                                    }}
                                    className={cn(
                                        "rounded-lg px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer",
                                        tableFilter === f.id
                                            ? "bg-foreground text-background"
                                            : "text-slate-gray hover:text-foreground",
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredTables.length === 0 ? (
                        <div className="rounded-2xl border border-hairline bg-card p-8 text-center text-[13px] text-slate-gray">
                            {t("noTablesMatch")}
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginatedTables.map(
                                    (tblItem: TenantActivityTableItem) => (
                                        <div
                                            key={tblItem.tableId}
                                            className={cn(
                                                "rounded-2xl border p-3.5 transition-colors",
                                                tblItem.status ===
                                                    "BILL_REQUESTED"
                                                    ? "border-amber-500/40 bg-amber-500/5"
                                                    : tblItem.isOccupied
                                                      ? "border-emerald-500/40 bg-emerald-500/5"
                                                      : "border-hairline bg-card",
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[14px] font-bold text-foreground">
                                                            {tblItem.tableName}
                                                        </span>
                                                        {tblItem.isVip ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-amber-500/40 text-[10px] text-amber-600"
                                                            >
                                                                VIP
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <p className="text-[11px] text-slate-gray">
                                                        {tblItem.branchName}
                                                        {!effectiveTenantId
                                                            ? ` · ${tblItem.tenantName}`
                                                            : ""}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        tblItem.isOccupied
                                                            ? "success"
                                                            : "secondary"
                                                    }
                                                    className="text-[10.5px]"
                                                >
                                                    {tblItem.isOccupied
                                                        ? isAm
                                                            ? "የተያዘ"
                                                            : "Occupied"
                                                        : isAm
                                                          ? "ክፍት"
                                                          : "Available"}
                                                </Badge>
                                            </div>

                                            <div className="mt-3 space-y-1 border-t border-hairline pt-2.5 text-[12px]">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-gray">
                                                        {t("waiter")}
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {tblItem.waiterName ||
                                                            t("unassigned")}
                                                    </span>
                                                </div>
                                                {tblItem.isOccupied ? (
                                                    <>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-slate-gray">
                                                                {t(
                                                                    "ordersGuests",
                                                                )}
                                                            </span>
                                                            <span className="font-medium text-foreground">
                                                                {t(
                                                                    "orderCount",
                                                                    {
                                                                        count: tblItem.ordersCount,
                                                                    },
                                                                )}
                                                                {tblItem.guestCount
                                                                    ? ` ${t("guestCount", { count: tblItem.guestCount })}`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-slate-gray">
                                                                {t(
                                                                    "runningBill",
                                                                )}
                                                            </span>
                                                            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                                {formatEtb(
                                                                    tblItem.runningBillTotal,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-between text-slate-gray">
                                                        <span>
                                                            {t("session")}
                                                        </span>
                                                        <span>
                                                            {t("idleAvailable")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>

                            {totalTablePages > 1 ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-card px-4 py-3">
                                    <span className="text-[12px] text-slate-gray">
                                        {t("showingTables", {
                                            start:
                                                (tablesPage - 1) *
                                                    tablesPerPage +
                                                1,
                                            end: Math.min(
                                                tablesPage * tablesPerPage,
                                                filteredTables.length,
                                            ),
                                            total: filteredTables.length,
                                        })}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-[12px]"
                                            disabled={tablesPage <= 1}
                                            onClick={() =>
                                                setTablesPage(p =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                        >
                                            <ChevronLeft className="size-3.5 mr-1" />
                                            {t("previous")}
                                        </Button>
                                        <span className="px-2 font-mono text-[12px] text-muted-foreground">
                                            {t("pageOf", {
                                                page: tablesPage,
                                                total: totalTablePages,
                                            })}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-[12px]"
                                            disabled={
                                                tablesPage >= totalTablePages
                                            }
                                            onClick={() =>
                                                setTablesPage(p =>
                                                    Math.min(
                                                        totalTablePages,
                                                        p + 1,
                                                    ),
                                                )
                                            }
                                        >
                                            {t("next")}
                                            <ChevronRight className="size-3.5 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            ) : null}

            {/* Tab 3: All Movements Timeline */}
            {activeSection === "movements" ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {MOVEMENT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setMovementCategory(cat.id);
                                        setMovementPage(1);
                                    }}
                                    className={cn(
                                        "rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
                                        movementCategory === cat.id
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-hairline bg-card text-slate-gray hover:text-foreground",
                                    )}
                                >
                                    {t(`movementCategories.${cat.id}` as any)}
                                </button>
                            ))}
                        </div>

                        <div className="relative min-w-[240px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-gray" />
                            <Input
                                value={movementSearch}
                                onChange={e => {
                                    setMovementSearch(e.target.value);
                                    setMovementPage(1);
                                }}
                                placeholder={t("filterMovementsPlaceholder")}
                                className="h-9 rounded-xl pl-8 text-[12px]"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
                        {movements.length === 0 ? (
                            <div className="p-8 text-center text-[13px] text-slate-gray">
                                {isLoading || isFetching
                                    ? t("loadingMovements")
                                    : t("noMovements")}
                            </div>
                        ) : (
                            <>
                                <div
                                    className={cn(
                                        "divide-y divide-hairline",
                                        isFetching &&
                                            "opacity-60 pointer-events-none transition-opacity",
                                    )}
                                >
                                    {movements.map(m => (
                                        <div
                                            key={m.id}
                                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40"
                                        >
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span
                                                    className={cn(
                                                        "mt-0.5 inline-flex shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                        categoryBadgeClass(
                                                            m.category,
                                                        ),
                                                    )}
                                                >
                                                    {t(
                                                        `movementCategories.${m.category}` as any,
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold text-foreground">
                                                        {m.title}
                                                    </p>
                                                    <p className="mt-0.5 text-[12px] text-slate-gray">
                                                        {m.subtitle}
                                                        {" · "}
                                                        <span className="font-medium text-foreground">
                                                            {m.branchName}
                                                        </span>
                                                        {!effectiveTenantId
                                                            ? ` (${m.tenantName})`
                                                            : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-4 text-right">
                                                {m.amount != null ? (
                                                    <span className="font-mono text-[13px] font-bold tabular-nums text-foreground">
                                                        {formatEtb(m.amount)}
                                                    </span>
                                                ) : null}
                                                <div className="text-[11px] text-slate-gray">
                                                    <p className="font-medium text-foreground">
                                                        {m.actorName}
                                                    </p>
                                                    <p>
                                                        {new Date(
                                                            m.timestamp,
                                                        ).toLocaleString(
                                                            "en-GB",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 bg-card/60">
                                    <div className="flex items-center gap-3 text-[12px] text-slate-gray">
                                        <span>
                                            {t("showingMovements", {
                                                start:
                                                    (movementPage - 1) *
                                                        movementPageSize +
                                                    1,
                                                end: Math.min(
                                                    movementPage *
                                                        movementPageSize,
                                                    totalMovements,
                                                ),
                                                total: totalMovements,
                                            })}
                                        </span>
                                        <div className="flex items-center gap-1.5 pl-2 border-l border-hairline">
                                            <span className="text-[11px]">
                                                {t("perPage")}
                                            </span>
                                            {[15, 25, 50, 100].map(sz => (
                                                <button
                                                    key={sz}
                                                    type="button"
                                                    onClick={() => {
                                                        setMovementPageSize(sz);
                                                        setMovementPage(1);
                                                    }}
                                                    className={cn(
                                                        "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                                                        movementPageSize === sz
                                                            ? "bg-foreground text-background font-semibold"
                                                            : "text-slate-gray hover:text-foreground hover:bg-secondary",
                                                    )}
                                                >
                                                    {sz}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-[12px]"
                                            disabled={
                                                movementPage <= 1 || isFetching
                                            }
                                            onClick={() =>
                                                setMovementPage(p =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                        >
                                            <ChevronLeft className="size-3.5 mr-1" />
                                            {t("previous")}
                                        </Button>
                                        <span className="px-2 font-mono text-[12px] text-muted-foreground">
                                            {t("pageOf", {
                                                page: movementPage,
                                                total: totalMovementPages,
                                            })}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-[12px]"
                                            disabled={
                                                movementPage >=
                                                    totalMovementPages ||
                                                isFetching
                                            }
                                            onClick={() =>
                                                setMovementPage(p =>
                                                    Math.min(
                                                        totalMovementPages,
                                                        p + 1,
                                                    ),
                                                )
                                            }
                                        >
                                            {t("next")}
                                            <ChevronRight className="size-3.5 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
