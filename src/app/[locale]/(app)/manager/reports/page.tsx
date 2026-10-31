"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Ban,
    CalendarRange,
    ChefHat,
    ChevronRight,
    Clock3,
    Loader2,
    Package,
    RefreshCw,
    Replace,
    UserRound,
    UtensilsCrossed,
    Wallet,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DualCalendarDatePicker from "@/components/custom/molecules/DualCalendarDatePicker";
import {
    useManagerReportsQuery,
    useFbReportQuery,
    type ManagerReportsData,
    type ReportsPeriod,
    type ReportsSection,
} from "@/context/services/managerReportsApi";
import {
    ApprovalDecisionDonut,
    CancelledItemsBarChart,
    CashByWaiterChart,
    InventoryMixDonut,
    InventoryWasteBarChart,
    StationPrepBarChart,
    WaiterSalesBarChart,
} from "@/domains/reporting/ui/ManagerReportCharts";
import FbReportView from "@/domains/reporting/ui/FbReportView";
import IngredientStockPanel from "@/domains/finance/ui/IngredientStockPanel";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

type TReports = ReturnType<typeof useTranslations<"managerReports">>;

const SECTIONS: Array<{
    id: Exclude<ReportsSection, "all">;
    icon: typeof UserRound;
}> = [
    { id: "waiters", icon: UserRound },
    { id: "cancels", icon: Ban },
    { id: "inventory", icon: Package },
    { id: "cash", icon: Wallet },
    { id: "stations", icon: UtensilsCrossed },
    { id: "fb", icon: ChefHat },
];

const VALID_PERIODS: ReportsPeriod[] = ["day", "week", "month"];

function ManagerReportsContent() {
    const t = useTranslations("managerReports");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const sectionParam = searchParams.get("section");
    const periodParam = searchParams.get("period");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const section: Exclude<ReportsSection, "all"> =
        SECTIONS.some(s => s.id === sectionParam)
            ? (sectionParam as Exclude<ReportsSection, "all">)
            : "waiters";

    const period: ReportsPeriod =
        periodParam && VALID_PERIODS.includes(periodParam as ReportsPeriod)
            ? (periodParam as ReportsPeriod)
            : "day";

    const fromDate = fromParam ?? "";
    const toDate = toParam ?? "";
    const isCustomRange = Boolean(fromDate && toDate);

    const updateUrl = useCallback(
        (updates: {
            section?: Exclude<ReportsSection, "all">;
            period?: ReportsPeriod;
            from?: string;
            to?: string;
        }) => {
            const params = new URLSearchParams(searchParams.toString());
            if (updates.section !== undefined) {
                if (updates.section === "waiters") params.delete("section");
                else params.set("section", updates.section);
            }
            if (updates.period !== undefined) {
                if (updates.period === "day") params.delete("period");
                else params.set("period", updates.period);
                if (updates.from === undefined) params.delete("from");
                if (updates.to === undefined) params.delete("to");
            }
            if (updates.from !== undefined) {
                if (updates.from) params.set("from", updates.from);
                else params.delete("from");
            }
            if (updates.to !== undefined) {
                if (updates.to) params.set("to", updates.to);
                else params.delete("to");
            }
            const qs = params.toString();
            router.replace(`${pathname}${qs ? `?${qs}` : ""}`, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );

    const { data, isLoading, isError, isFetching, refetch } =
        useManagerReportsQuery(
            {
                period,
                section,
                ...(isCustomRange ? { from: fromDate, to: toDate } : {}),
            },
            { skip: section === "fb" },
        );

    const {
        data: fbData,
        isLoading: isFbLoading,
        isError: isFbError,
        isFetching: isFbFetching,
        refetch: refetchFb,
    } = useFbReportQuery(
        {
            period,
            ...(isCustomRange ? { from: fromDate, to: toDate } : {}),
        },
        { skip: section !== "fb" },
    );

    const activeLoading = section === "fb" ? isFbLoading : isLoading;
    const activeFetching = section === "fb" ? isFbFetching : isFetching;
    const activeError = section === "fb" ? isFbError : isError;
    const handleRefresh = () => {
        if (section === "fb") refetchFb();
        else refetch();
    };

    const report = data?.data;
    const periods: Array<{ id: ReportsPeriod; label: string }> = [
        { id: "day", label: t("periodDay") },
        { id: "week", label: t("periodWeek") },
        { id: "month", label: t("periodMonth") },
    ];

    const sectionMeta = useMemo(
        () => SECTIONS.find(s => s.id === section)!,
        [section],
    );

    const rangeLabel =
        isCustomRange
            ? `${fromDate} → ${toDate}`
            : null;

    return (
        <DashboardFrame>
            {/* Reduced, Sleek Top Header Bar */}
            <div className="relative z-30 flex flex-col gap-3 rounded-2xl border border-hairline bg-card p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-gray">
                        <span>{t("eyebrow")}</span>
                        {report?.branchName ? (
                            <>
                                <span className="opacity-40">·</span>
                                <span className="font-normal normal-case text-slate-gray">
                                    {report.branchName}
                                </span>
                            </>
                        ) : null}
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-2">
                        <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                            {t("title")}
                        </h1>
                        <span className="text-[11.5px] tabular-nums text-slate-gray">
                            {report ? `(${report.from} → ${report.to})` : ""}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Period pills + Custom date range */}
                    <div className="flex items-center rounded-xl border border-hairline bg-secondary/40 p-0.5">
                        {periods.map(entry => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => {
                                    setDatePickerOpen(false);
                                    updateUrl({
                                        period: entry.id,
                                        from: "",
                                        to: "",
                                    });
                                }}
                                className={cn(
                                    "cursor-pointer rounded-lg px-2.5 py-1 text-[12px] font-medium transition-all",
                                    period === entry.id && !isCustomRange
                                        ? "bg-foreground font-semibold text-background shadow-xs"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                {entry.label}
                            </button>
                        ))}

                        {/* Custom Range Pill */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setDatePickerOpen(open => !open)}
                                className={cn(
                                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-all",
                                    isCustomRange
                                        ? "bg-foreground font-semibold text-background shadow-xs"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                <CalendarRange className="size-3.5" />
                                <span>{rangeLabel ?? "Custom"}</span>
                                {isCustomRange ? (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Clear range"
                                        onClick={e => {
                                            e.stopPropagation();
                                            updateUrl({ from: "", to: "" });
                                            setDatePickerOpen(false);
                                        }}
                                        className="ml-0.5 rounded-full p-0.5 text-background hover:bg-background/20"
                                    >
                                        <X className="size-3" />
                                    </span>
                                ) : null}
                            </button>

                            {/* DualCalendarDatePicker dropdown popover */}
                            {datePickerOpen ? (
                                <DualCalendarDatePicker
                                    variant="popover"
                                    align="right"
                                    from={fromDate || undefined}
                                    to={toDate || undefined}
                                    defaultSelectionMode="range"
                                    applyLabel="Apply range"
                                    onDismiss={() => setDatePickerOpen(false)}
                                    onApply={({ from, to }) => {
                                        updateUrl({ from, to });
                                        setDatePickerOpen(false);
                                    }}
                                    onClear={() => {
                                        updateUrl({ from: "", to: "" });
                                        setDatePickerOpen(false);
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>

                    {/* Refresh */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl px-2.5 text-[12px]"
                        disabled={activeFetching}
                        onClick={handleRefresh}
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                activeFetching && "animate-spin",
                            )}
                        />
                        <span className="hidden sm:inline">
                            {tCommon("refresh")}
                        </span>
                    </Button>
                </div>
            </div>

            {/* Minimal Modern Section Segmented Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-hairline bg-card p-1.5 shadow-2xs">
                {SECTIONS.map(entry => {
                    const Icon = entry.icon;
                    const active = section === entry.id;
                    return (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => updateUrl({ section: entry.id })}
                            className={cn(
                                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-medium transition-all cursor-pointer whitespace-nowrap",
                                active
                                    ? "bg-foreground text-background font-semibold shadow-xs"
                                    : "text-slate-gray hover:bg-secondary/70 hover:text-foreground",
                            )}
                        >
                            <Icon
                                className={cn(
                                    "size-3.5",
                                    active ? "text-background" : "text-slate-gray",
                                )}
                            />
                            <span>{t(`sections.${entry.id}`)}</span>
                        </button>
                    );
                })}
            </div>

            {activeLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-hairline bg-card py-16 text-slate-gray">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                </div>
            ) : null}

            {activeError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-[13px] text-destructive">
                    {t("loadError")}
                </div>
            ) : null}

            {!activeLoading && !activeError && (section === "fb" ? !!fbData : !!report) ? (
                <div className="space-y-4 animate-in fade-in-0 duration-300">
                    <div className="flex items-center gap-2 px-0.5 text-[13px] text-slate-gray">
                        <sectionMeta.icon className="size-4 text-brand" />
                        <span className="font-medium text-foreground">
                            {t(`sections.${section}`)}
                        </span>
                        <span className="opacity-40">·</span>
                        <span>{t(`sections.${section}Desc`)}</span>
                        {isCustomRange && (
                            <>
                                <span className="opacity-40">·</span>
                                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                                    {fromDate} → {toDate}
                                </span>
                            </>
                        )}
                    </div>

                    {section === "waiters" && report?.waiters ? (
                        <WaitersReport data={report!.waiters} t={t} />
                    ) : null}
                    {section === "cancels" && report?.cancels ? (
                        <CancelsReport data={report!.cancels} t={t} />
                    ) : null}
                    {section === "inventory" && report?.inventory ? (
                        <InventoryReport
                            data={report!.inventory}
                            t={t}
                            period={isCustomRange ? undefined : period}
                            from={fromDate || undefined}
                            to={toDate || undefined}
                        />
                    ) : null}
                    {section === "cash" && report?.cash ? (
                        <CashReport data={report!.cash} t={t} />
                    ) : null}
                    {section === "stations" && report?.stations ? (
                        <StationsReport data={report!.stations} t={t} />
                    ) : null}
                    {section === "fb" ? (
                        <FbReportView
                            data={fbData?.data}
                            isLoading={isFbLoading}
                            isError={isFbError}
                            onRetry={refetchFb}
                        />
                    ) : null}
                </div>
            ) : null}
        </DashboardFrame>
    );
}

export default function ManagerReportsPage() {
    return (
        <Suspense
            fallback={
                <DashboardFrame>
                    <div className="flex items-center justify-center py-20 text-slate-gray">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                </DashboardFrame>
            }
        >
            <ManagerReportsContent />
        </Suspense>
    );
}

function StatGrid({
    items,
}: {
    items: Array<{
        label: string;
        value: string;
        hint?: string;
        accent?: boolean;
    }>;
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {items.map((item, index) => (
                <div
                    key={item.label}
                    className={cn(
                        "rounded-xl border border-hairline bg-card px-3.5 py-3 transition-transform",
                        "hover:-translate-y-0.5",
                    )}
                    style={{ animationDelay: `${index * 40}ms` }}
                >
                    <p className="text-[10px] uppercase tracking-[0.07em] text-slate-gray">
                        {item.label}
                    </p>
                    <p
                        className={cn(
                            "mt-1 text-[18px] font-semibold tabular-nums tracking-tight",
                            item.accent ? "text-brand" : "text-foreground",
                        )}
                    >
                        {item.value}
                    </p>
                    {item.hint ? (
                        <p className="mt-0.5 text-[11px] text-slate-gray">
                            {item.hint}
                        </p>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

function WaitersReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["waiters"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("waiters.cardSales"),
                        value: formatEtb(Number(data.totalNetSales)),
                        accent: true,
                    },
                    {
                        label: t("waiters.cardOrders"),
                        value: String(data.totalOrders),
                    },
                    {
                        label: t("waiters.cardHours"),
                        value: `${data.totalHoursWorked}h`,
                    },
                    {
                        label: t("waiters.cardUndropped"),
                        value: formatEtb(Number(data.totalUndroppedCash)),
                    },
                ]}
            />
            <div className="grid gap-3 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <WaiterSalesBarChart
                        rows={data.rows}
                        title={t("charts.waiterSales")}
                        subtitle={t("charts.waiterSalesDesc")}
                        empty={t("empty")}
                        salesLabel={t("waiters.cardSales")}
                    />
                </div>
                <div className="overflow-hidden rounded-2xl border border-hairline bg-card lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                        <p className="text-[13px] font-medium">
                            {t("waiters.tableTitle")}
                        </p>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href="/manager/waiters">
                                {t("openBoard")}
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </Button>
                    </div>
                    {data.rows.length === 0 ? (
                        <p className="px-4 py-10 text-center text-[13px] text-slate-gray">
                            {t("empty")}
                        </p>
                    ) : (
                        <div className="max-h-[280px] divide-y divide-hairline overflow-y-auto">
                            {data.rows.map(row => (
                                <Link
                                    key={row.waiterMembershipId}
                                    href={`/manager/waiters/${row.waiterMembershipId}`}
                                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[13px] font-semibold text-brand">
                                            {row.waiterName
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-foreground">
                                                {row.waiterName}
                                            </p>
                                            <p className="text-[12px] text-slate-gray">
                                                {row.ordersCreatedCount}{" "}
                                                {t("waiters.orders")} ·{" "}
                                                {row.hoursWorked}h
                                            </p>
                                        </div>
                                    </div>
                                    <p className="shrink-0 font-semibold tabular-nums text-brand">
                                        {formatEtb(
                                            Number(row.netAttributedSales),
                                        )}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function CancelsReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["cancels"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("cancels.cardCancelled"),
                        value: String(data.cancelledItemsCount),
                        hint: formatEtb(Number(data.cancelledItemsValue)),
                        accent: true,
                    },
                    {
                        label: t("cancels.cardApproved"),
                        value: String(data.approvedCount),
                        hint: `${data.approveRate}%`,
                    },
                    {
                        label: t("cancels.cardRejected"),
                        value: String(data.rejectedCount),
                        hint: `${data.rejectRate}%`,
                    },
                    {
                        label: t("cancels.cardPending"),
                        value: String(data.pendingCount),
                    },
                ]}
            />
            <div className="grid gap-3 lg:grid-cols-2">
                <ApprovalDecisionDonut
                    approved={data.approvedCount}
                    rejected={data.rejectedCount}
                    pending={data.pendingCount}
                    title={t("charts.decisions")}
                    subtitle={t("charts.decisionsDesc")}
                    empty={t("empty")}
                    labels={{
                        approved: t("cancels.cardApproved"),
                        rejected: t("cancels.cardRejected"),
                        pending: t("cancels.cardPending"),
                    }}
                />
                <CancelledItemsBarChart
                    items={data.topCancelledItems}
                    title={t("charts.topCancelled")}
                    subtitle={t("charts.topCancelledDesc")}
                    empty={t("empty")}
                    countLabel={t("cancels.count")}
                />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[13px] font-medium">
                            {t("cancels.byType")}
                        </h3>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href="/manager/approvals">
                                {t("openApprovals")}
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </Button>
                    </div>
                    <div className="mt-3 space-y-2">
                        {data.byType.map(row => (
                            <div
                                key={row.type}
                                className="flex items-center justify-between rounded-xl border border-hairline px-3 py-2.5"
                            >
                                <div className="flex items-center gap-2">
                                    {row.type === "CANCELLATION" ? (
                                        <Ban className="size-3.5 text-destructive" />
                                    ) : (
                                        <Replace className="size-3.5 text-amber-600" />
                                    )}
                                    <span className="text-[13px] font-medium">
                                        {row.type === "CANCELLATION"
                                            ? t("cancels.cancellation")
                                            : t("cancels.change")}
                                    </span>
                                </div>
                                <div className="flex gap-2 text-[11px]">
                                    <Badge
                                        variant="success"
                                        className="rounded-full"
                                    >
                                        {row.approved}
                                    </Badge>
                                    <Badge
                                        variant="danger"
                                        className="rounded-full"
                                    >
                                        {row.rejected}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[13px] font-medium">
                        {t("cancels.topItems")}
                    </h3>
                    {data.topCancelledItems.length === 0 ? (
                        <p className="mt-8 text-center text-[13px] text-slate-gray">
                            {t("empty")}
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {data.topCancelledItems.map(item => (
                                <li
                                    key={item.itemName}
                                    className="flex items-center justify-between gap-3 text-[13px]"
                                >
                                    <span className="truncate font-medium">
                                        {item.itemName}
                                    </span>
                                    <span className="shrink-0 text-slate-gray">
                                        ×{item.count} ·{" "}
                                        {formatEtb(Number(item.value))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

function InventoryReport({
    data,
    t,
    period,
    from,
    to,
}: {
    data: NonNullable<ManagerReportsData["inventory"]>;
    t: TReports;
    period?: ReportsPeriod;
    from?: string;
    to?: string;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("inventory.cardStock"),
                        value: formatEtb(Number(data.totalStockValue)),
                        hint: t("inventory.skus", { count: data.skuCount }),
                        accent: true,
                    },
                    {
                        label: t("inventory.cardWaste"),
                        value: formatEtb(Number(data.wasteValue)),
                        hint: t("inventory.wasteQty", { qty: data.wasteQty }),
                    },
                    {
                        label: t("inventory.cardReceive"),
                        value: formatEtb(Number(data.receiveValue)),
                    },
                    {
                        label: t("inventory.cardLow"),
                        value: String(data.lowStockCount),
                    },
                ]}
            />
            <div className="grid gap-3 lg:grid-cols-2">
                <InventoryMixDonut
                    stockValue={Number(data.totalStockValue)}
                    wasteValue={Number(data.wasteValue)}
                    receiveValue={Number(data.receiveValue)}
                    title={t("charts.inventoryMix")}
                    subtitle={t("charts.inventoryMixDesc")}
                    empty={t("empty")}
                    labels={{
                        stock: t("inventory.cardStock"),
                        waste: t("inventory.cardWaste"),
                        receive: t("inventory.cardReceive"),
                    }}
                />
                <InventoryWasteBarChart
                    items={data.topWaste}
                    title={t("charts.wasteValue")}
                    subtitle={t("charts.wasteValueDesc")}
                    empty={t("inventory.noWaste")}
                    valueLabel={t("inventory.cardWaste")}
                />
            </div>
            <section className="rounded-2xl border border-hairline bg-card p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium">
                        {t("inventory.topWaste")}
                    </h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full text-[12px]"
                        asChild
                    >
                        <Link href="/manager/inventory">
                            {t("openInventory")}
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </Button>
                </div>
                {data.topWaste.length === 0 ? (
                    <p className="mt-8 text-center text-[13px] text-slate-gray">
                        {t("inventory.noWaste")}
                    </p>
                ) : (
                    <ul className="mt-3 divide-y divide-hairline">
                        {data.topWaste.map(item => (
                            <li
                                key={item.ingredientId}
                                className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
                            >
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-[11px] text-slate-gray">
                                        {item.qty} {item.unit}
                                    </p>
                                </div>
                                <p className="font-semibold tabular-nums">
                                    {formatEtb(Number(item.value))}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Ingredient stock drill-down table */}
            <section className="rounded-2xl border border-hairline bg-card p-4">
                <IngredientStockPanel
                    audience="manager"
                    period={
                        period === "day" || period === "week" || period === "month"
                            ? period
                            : undefined
                    }
                    {...(from && to ? { from, to } : {})}
                    detailBasePath="/manager/reports/inventory"
                />
            </section>
        </>
    );
}

function CashReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["cash"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("cash.cardDropped"),
                        value: formatEtb(Number(data.cashDropped)),
                        hint: t("cash.drops", { count: data.dropCount }),
                        accent: true,
                    },
                    {
                        label: t("cash.cardReceived"),
                        value: formatEtb(Number(data.cashReceived)),
                    },
                    {
                        label: t("cash.cardUndropped"),
                        value: formatEtb(Number(data.undroppedCashTotal)),
                    },
                    {
                        label: t("cash.cardVariance"),
                        value: formatEtb(Number(data.varianceTotal)),
                        hint:
                            Number(data.pendingDropAmount) > 0
                                ? t("cash.pending", {
                                      amount: formatEtb(
                                          Number(data.pendingDropAmount),
                                      ),
                                  })
                                : undefined,
                    },
                ]}
            />
            <CashByWaiterChart
                rows={data.byWaiter}
                title={t("charts.cashByWaiter")}
                subtitle={t("charts.cashByWaiterDesc")}
                empty={t("empty")}
                labels={{
                    dropped: t("cash.cardDropped"),
                    undropped: t("cash.cardUndropped"),
                }}
            />
            <section className="overflow-hidden rounded-2xl border border-hairline bg-card">
                <div className="border-b border-hairline px-4 py-3">
                    <h3 className="text-[13px] font-medium">
                        {t("cash.byWaiter")}
                    </h3>
                </div>
                {data.byWaiter.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-slate-gray">
                        {t("empty")}
                    </p>
                ) : (
                    <div className="divide-y divide-hairline">
                        {data.byWaiter.map(row => (
                            <div
                                key={row.waiterMembershipId}
                                className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
                            >
                                <div>
                                    <p className="font-medium">
                                        {row.waiterName}
                                    </p>
                                    <p className="text-[11px] text-slate-gray">
                                        {t("cash.collected")}{" "}
                                        {formatEtb(Number(row.collected))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold tabular-nums">
                                        {formatEtb(Number(row.dropped))}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-[11px]",
                                            Number(row.undropped) > 0
                                                ? "text-amber-700"
                                                : "text-slate-gray",
                                        )}
                                    >
                                        {t("cash.undropped")}{" "}
                                        {formatEtb(Number(row.undropped))}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}

function StationsReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["stations"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("stations.cardAvgPrep"),
                        value: `${data.avgPrepMinutes}m`,
                        accent: true,
                    },
                    {
                        label: t("stations.cardTickets"),
                        value: String(data.ticketsCompleted),
                    },
                    {
                        label: t("stations.cardDelayed"),
                        value: String(data.delayedCount),
                        hint: `${data.delayedRate}%`,
                    },
                    {
                        label: t("stations.cardCannot"),
                        value: String(data.cannotPrepareCount),
                    },
                ]}
            />
            <StationPrepBarChart
                rows={data.rows}
                title={t("charts.stationPrep")}
                subtitle={t("charts.stationPrepDesc")}
                empty={t("empty")}
                labels={{
                    prep: t("stations.cardAvgPrep"),
                    delayed: t("charts.delayedPct"),
                }}
            />
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
                <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                    <p className="text-[13px] font-medium">
                        {t("stations.tableTitle")}
                    </p>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full text-[12px]"
                        asChild
                    >
                        <Link href="/manager/stations">
                            {t("openStations")}
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </Button>
                </div>
                {data.rows.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-slate-gray">
                        {t("empty")}
                    </p>
                ) : (
                    <div className="divide-y divide-hairline">
                        {data.rows.map(row => (
                            <Link
                                key={row.stationId}
                                href={`/manager/stations/${row.stationId}`}
                                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground">
                                        {row.stationName}
                                    </p>
                                    <p className="text-[12px] text-slate-gray">
                                        {row.ticketsCompleted}{" "}
                                        {t("stations.tickets")} ·{" "}
                                        {row.avgPrepMinutes}m{" "}
                                        {t("stations.avg")}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    {row.delayedCount > 0 ? (
                                        <Badge
                                            variant="warning"
                                            className="rounded-full"
                                        >
                                            <Clock3 className="mr-1 size-3" />
                                            {row.delayedRate}%
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="success"
                                            className="rounded-full"
                                        >
                                            {t("stations.onTime")}
                                        </Badge>
                                    )}
                                    <ChevronRight className="size-3.5 text-slate-gray" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
