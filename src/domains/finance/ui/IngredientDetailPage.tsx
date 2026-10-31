"use client";

import { use, useMemo, useState } from "react";
import {
    ArrowLeft,
    CalendarRange,
    ChefHat,
    Clock,
    FileText,
    History,
    Layers,
    Loader2,
    Package,
    RefreshCw,
    Search,
    ShoppingBag,
    TrendingDown,
    Truck,
    UserRound,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DualCalendarDatePicker from "@/components/custom/molecules/DualCalendarDatePicker";
import {
    useGetFinanceInventoryItemOrdersQuery,
    useGetFinanceInventoryItemUsageQuery,
    type FinanceAudience,
    type FinancePeriod,
} from "../financeApi";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

function formatStockQty(value: number) {
    return (Math.round(value * 10000) / 10000).toLocaleString("en-US", {
        maximumFractionDigits: 4,
    });
}

type TabType = "orders" | "menu" | "vendors";

export default function IngredientDetailPage({
    params,
    searchParams,
    audience = "manager",
    backHref = "/manager/reports",
}: {
    params: Promise<{ ingredientId: string }>;
    searchParams?: Promise<{ period?: string; from?: string; to?: string }>;
    audience?: FinanceAudience;
    backHref?: string;
}) {
    const { ingredientId } = use(params);
    const resolvedSearch = searchParams ? use(searchParams) : {};

    const initialPeriod: FinancePeriod =
        resolvedSearch.period === "day" ||
        resolvedSearch.period === "week" ||
        resolvedSearch.period === "month"
            ? resolvedSearch.period
            : "week";

    const [period, setPeriod] = useState<FinancePeriod>(initialPeriod);
    const [fromDate, setFromDate] = useState(resolvedSearch.from ?? "");
    const [toDate, setToDate] = useState(resolvedSearch.to ?? "");
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("orders");
    const [orderFilter, setOrderFilter] = useState("");

    const isCustomRange = Boolean(fromDate && toDate);

    const queryArgs = useMemo(
        () => ({
            audience,
            ingredientId,
            ...(isCustomRange
                ? { from: fromDate, to: toDate }
                : { period }),
        }),
        [audience, ingredientId, isCustomRange, fromDate, toDate, period],
    );

    const {
        data: usageData,
        isLoading: isUsageLoading,
        isFetching: isUsageFetching,
        refetch: refetchUsage,
    } = useGetFinanceInventoryItemUsageQuery(queryArgs);

    const {
        data: ordersData,
        isLoading: isOrdersLoading,
        isFetching: isOrdersFetching,
        refetch: refetchOrders,
    } = useGetFinanceInventoryItemOrdersQuery(queryArgs);

    const usage = usageData?.data;
    const orders = ordersData?.data ?? [];
    const isRefreshing = isUsageFetching || isOrdersFetching;

    const filteredOrders = useMemo(() => {
        if (!orderFilter.trim()) return orders;
        const q = orderFilter.toLowerCase().trim();
        return orders.filter(
            o =>
                o.menuItemName.toLowerCase().includes(q) ||
                (o.waiterName && o.waiterName.toLowerCase().includes(q)) ||
                (o.tableDisplayName &&
                    o.tableDisplayName.toLowerCase().includes(q)) ||
                (o.orderId && o.orderId.toLowerCase().includes(q)),
        );
    }, [orders, orderFilter]);

    const totalOrdersIngredientQty = useMemo(() => {
        return orders.reduce((sum, o) => sum + Number(o.ingredientQtyUsed || 0), 0);
    }, [orders]);

    const totalOrdersPlates = useMemo(() => {
        return orders.reduce((sum, o) => sum + Number(o.orderedQty || 0), 0);
    }, [orders]);

    const ingredientName = usage?.name ?? ordersData?.ingredientName ?? "Ingredient";
    const unit = usage?.unit ?? ordersData?.unit ?? "units";

    return (
        <DashboardFrame>
            {/* Top Navigation */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-gray transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Reports
                </Link>

                {/* Period & Custom Date Picker */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-full border border-hairline bg-card p-0.5">
                        {(["day", "week", "month"] as const).map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => {
                                    setPeriod(p);
                                    setFromDate("");
                                    setToDate("");
                                }}
                                className={cn(
                                    "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                                    !isCustomRange && period === p
                                        ? "bg-brand text-brand-foreground shadow-sm"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                {p === "day"
                                    ? "Daily"
                                    : p === "week"
                                      ? "Weekly"
                                      : "Monthly"}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Button
                            type="button"
                            variant={isCustomRange ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDatePickerOpen(v => !v)}
                            className={cn(
                                "h-8 gap-1.5 rounded-full px-3 text-[12px] font-medium",
                                isCustomRange &&
                                    "bg-brand text-brand-foreground shadow-sm",
                            )}
                        >
                            <CalendarRange className="size-3.5" />
                            <span>
                                {isCustomRange
                                    ? `${fromDate} → ${toDate}`
                                    : "Custom Range"}
                            </span>
                            {isCustomRange ? (
                                <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Clear range"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setFromDate("");
                                        setToDate("");
                                        setDatePickerOpen(false);
                                    }}
                                    className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-black/10 hover:bg-black/20"
                                >
                                    <X className="size-3" />
                                </span>
                            ) : null}
                        </Button>
                        {datePickerOpen ? (
                            <div className="absolute right-0 top-10 z-50 rounded-2xl border border-hairline bg-card p-3 shadow-2xl">
                                <DualCalendarDatePicker
                                    from={fromDate}
                                    to={toDate}
                                    onApply={({ from, to }) => {
                                        setFromDate(from);
                                        setToDate(to);
                                        setDatePickerOpen(false);
                                    }}
                                    onClear={() => {
                                        setFromDate("");
                                        setToDate("");
                                        setDatePickerOpen(false);
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            refetchUsage();
                            refetchOrders();
                        }}
                        disabled={isRefreshing}
                        className="h-8 gap-1.5 rounded-full px-3 text-[12px]"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isRefreshing && "animate-spin",
                            )}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Header Title & Breadcrumb */}
            <div className="mb-6 rounded-2xl border border-hairline bg-card p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-gray">
                            <span>Reports</span>
                            <span>/</span>
                            <span>Inventory</span>
                            <span>/</span>
                            <span className="text-brand">Stock & Consumption Audit</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {ingredientName}
                            </h1>
                            <Badge variant="outline" className="rounded-full text-[12px] font-normal">
                                {unit}
                            </Badge>
                            {usage?.unitCost ? (
                                <Badge variant="secondary" className="rounded-full text-[12px] font-normal tabular-nums">
                                    Cost: {formatEtb(Number(usage.unitCost))} / {unit}
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                    {usage?.from && usage?.to ? (
                        <div className="rounded-xl border border-hairline bg-secondary/30 px-3 py-1.5 text-right">
                            <p className="text-[11px] font-medium text-slate-gray">Audit Window</p>
                            <p className="text-[12px] font-semibold tabular-nums text-foreground">
                                {usage.from} → {usage.to}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* KPI Cards: The Stock Bridge */}
            {isUsageLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-gray">
                    <Loader2 className="size-6 animate-spin" />
                </div>
            ) : usage ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {/* Opening */}
                        <div className="rounded-xl border border-hairline bg-card p-3.5 shadow-xs">
                            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-gray">
                                Opening Stock
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                                {formatStockQty(usage.openingQty)}{" "}
                                <span className="text-xs font-normal text-slate-gray">{usage.unit}</span>
                            </p>
                            <p className="text-[11px] tabular-nums text-slate-gray">
                                {formatEtb(Number(usage.openingValue))}
                            </p>
                        </div>

                        {/* Received */}
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 shadow-xs">
                            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-400">
                                + Received
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                +{formatStockQty(usage.receivedQty)}{" "}
                                <span className="text-xs font-normal opacity-80">{usage.unit}</span>
                            </p>
                            <p className="text-[11px] tabular-nums text-emerald-700/80 dark:text-emerald-400/80">
                                {formatEtb(Number(usage.receivedValue))}
                            </p>
                        </div>

                        {/* Consumed */}
                        <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5 shadow-xs">
                            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-brand">
                                − Consumed (Sales)
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-brand">
                                −{formatStockQty(usage.consumedQty)}{" "}
                                <span className="text-xs font-normal opacity-80">{usage.unit}</span>
                            </p>
                            <p className="text-[11px] tabular-nums text-brand/80">
                                {formatEtb(Number(usage.consumedValue))}
                            </p>
                        </div>

                        {/* Waste */}
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 shadow-xs">
                            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-amber-700 dark:text-amber-400">
                                − Waste / Loss
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                −{formatStockQty(usage.wasteQty)}{" "}
                                <span className="text-xs font-normal opacity-80">{usage.unit}</span>
                            </p>
                            <p className="text-[11px] tabular-nums text-amber-700/80 dark:text-amber-400/80">
                                {formatEtb(Number(usage.wasteValue))}
                            </p>
                        </div>

                        {/* Closing */}
                        <div className="col-span-2 rounded-xl border border-hairline bg-card p-3.5 shadow-xs sm:col-span-1">
                            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-gray">
                                = Closing Stock
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                                {formatStockQty(usage.closingQty)}{" "}
                                <span className="text-xs font-normal text-slate-gray">{usage.unit}</span>
                            </p>
                            <p className="text-[11px] tabular-nums text-slate-gray">
                                {formatEtb(Number(usage.closingValue))}
                            </p>
                        </div>
                    </div>

                    {/* Stock Bridge Summary Strip */}
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-secondary/20 px-4 py-2.5 text-[12px] tabular-nums text-slate-gray">
                        <span className="font-semibold text-foreground">Bridge:</span>
                        <span>Started with {formatStockQty(usage.openingQty)} {usage.unit}</span>
                        <span>→</span>
                        <span className="text-emerald-600 dark:text-emerald-400">+{formatStockQty(usage.receivedQty)} received</span>
                        <span>→</span>
                        <span className="text-brand">−{formatStockQty(usage.consumedQty)} sold in orders</span>
                        <span>→</span>
                        <span className="text-amber-600 dark:text-amber-400">−{formatStockQty(usage.wasteQty)} waste</span>
                        {usage.adjustedQty !== 0 || usage.transfersNetQty !== 0 ? (
                            <>
                                <span>→</span>
                                <span>{formatStockQty(usage.transfersNetQty + usage.adjustedQty + usage.otherQty)} adjustments</span>
                            </>
                        ) : null}
                        <span>=</span>
                        <span className="font-bold text-foreground">Closing: {formatStockQty(usage.closingQty)} {usage.unit}</span>
                    </div>
                </div>
            ) : null}

            {/* Navigation Tabs */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                            activeTab === "orders"
                                ? "bg-brand text-brand-foreground shadow-sm"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <UtensilsCrossed className="size-3.5" />
                        <span>Per-Order Breakdown</span>
                        <Badge
                            variant={activeTab === "orders" ? "secondary" : "outline"}
                            className="rounded-full px-1.5 py-0 text-[10px]"
                        >
                            {orders.length}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("menu")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                            activeTab === "menu"
                                ? "bg-brand text-brand-foreground shadow-sm"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <ChefHat className="size-3.5" />
                        <span>Used by Menu Item</span>
                        <Badge
                            variant={activeTab === "menu" ? "secondary" : "outline"}
                            className="rounded-full px-1.5 py-0 text-[10px]"
                        >
                            {usage?.byMenu.length ?? 0}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("vendors")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                            activeTab === "vendors"
                                ? "bg-brand text-brand-foreground shadow-sm"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <Truck className="size-3.5" />
                        <span>Vendor Receives</span>
                        <Badge
                            variant={activeTab === "vendors" ? "secondary" : "outline"}
                            className="rounded-full px-1.5 py-0 text-[10px]"
                        >
                            {usage?.receivedByVendor.length ?? 0}
                        </Badge>
                    </button>
                </div>

                {activeTab === "orders" && (
                    <div className="relative min-w-[240px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-gray" />
                        <input
                            type="search"
                            value={orderFilter}
                            onChange={e => setOrderFilter(e.target.value)}
                            placeholder="Filter by waiter, table, dish..."
                            className="h-8 w-full rounded-full border border-hairline bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-slate-gray focus:border-brand focus:outline-none"
                        />
                    </div>
                )}
            </div>

            {/* TAB CONTENT */}
            <div className="mt-4">
                {/* TAB 1: PER-ORDER BREAKDOWN */}
                {activeTab === "orders" && (
                    <div className="rounded-2xl border border-hairline bg-card shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
                            <div>
                                <h3 className="text-[13px] font-semibold text-foreground">
                                    Table & Waiter Consumption Audit Log
                                </h3>
                                <p className="text-[11px] text-slate-gray">
                                    Every individual order item that depleted this ingredient from stock.
                                </p>
                            </div>
                            <div className="flex gap-4 text-[12px] tabular-nums text-slate-gray">
                                <span>
                                    Total Sold:{" "}
                                    <strong className="text-foreground">
                                        {totalOrdersPlates} plates
                                    </strong>
                                </span>
                                <span>
                                    Ingredient Depleted:{" "}
                                    <strong className="text-brand">
                                        {formatStockQty(totalOrdersIngredientQty)} {unit}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {isOrdersLoading ? (
                            <div className="flex items-center justify-center py-12 text-slate-gray">
                                <Loader2 className="size-5 animate-spin" />
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="py-12 text-center text-slate-gray">
                                <UtensilsCrossed className="mx-auto size-8 opacity-30" />
                                <p className="mt-2 text-[13px]">
                                    {orderFilter
                                        ? "No matching orders found."
                                        : "No kitchen orders depleted this ingredient during this period."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-[13px]">
                                    <thead>
                                        <tr className="border-b border-hairline bg-secondary/20 text-left text-[11px] uppercase tracking-[0.06em] text-slate-gray">
                                            <th className="px-4 py-2.5">Date & Time</th>
                                            <th className="px-4 py-2.5">Table</th>
                                            <th className="px-4 py-2.5">Waiter</th>
                                            <th className="px-4 py-2.5">Menu Item Sold</th>
                                            <th className="px-4 py-2.5 text-center">Plates</th>
                                            <th className="px-4 py-2.5 text-right">Qty Used</th>
                                            <th className="px-4 py-2.5 text-right">Cost at Time</th>
                                            <th className="px-4 py-2.5 text-center">Order ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline">
                                        {filteredOrders.map(order => (
                                            <tr
                                                key={order.ledgerId}
                                                className="transition-colors hover:bg-secondary/30"
                                            >
                                                <td className="px-4 py-2.5 tabular-nums text-foreground">
                                                    <span className="font-medium">{order.date}</span>
                                                    <span className="ml-1.5 text-[11px] text-slate-gray">
                                                        {order.time}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {order.tableDisplayName ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                                        >
                                                            {order.tableDisplayName}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[12px] text-slate-gray">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                                        <UserRound className="size-3 text-slate-gray" />
                                                        {order.waiterName || "Staff"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-foreground">
                                                    {order.menuItemName}
                                                </td>
                                                <td className="px-4 py-2.5 text-center tabular-nums text-foreground">
                                                    {order.orderedQty}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-brand">
                                                    {formatStockQty(order.ingredientQtyUsed)}{" "}
                                                    <span className="text-[11px] font-normal text-slate-gray">
                                                        {order.ingredientUnit}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-slate-gray">
                                                    {formatEtb(Number(order.costAtTime))}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    {order.orderId ? (
                                                        <span className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px] text-slate-gray">
                                                            #{order.orderId.slice(0, 6)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-gray">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: MENU ITEM USAGE */}
                {activeTab === "menu" && (
                    <div className="rounded-2xl border border-hairline bg-card shadow-xs">
                        <div className="border-b border-hairline px-4 py-3">
                            <h3 className="text-[13px] font-semibold text-foreground">
                                Consumption by Menu Item
                            </h3>
                            <p className="text-[11px] text-slate-gray">
                                Total quantities consumed for each recipe sold during the selected period.
                            </p>
                        </div>

                        {!usage?.byMenu || usage.byMenu.length === 0 ? (
                            <div className="py-12 text-center text-slate-gray">
                                <ChefHat className="mx-auto size-8 opacity-30" />
                                <p className="mt-2 text-[13px]">
                                    No menu items consumed this ingredient during this period.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-[13px]">
                                    <thead>
                                        <tr className="border-b border-hairline bg-secondary/20 text-left text-[11px] uppercase tracking-[0.06em] text-slate-gray">
                                            <th className="px-4 py-2.5">Menu Item</th>
                                            <th className="px-4 py-2.5 text-center">Plates Sold</th>
                                            <th className="px-4 py-2.5 text-right">Qty Consumed</th>
                                            <th className="px-4 py-2.5 text-right">Share</th>
                                            <th className="px-4 py-2.5 text-right">Total Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline">
                                        {usage.byMenu.map(item => (
                                            <tr
                                                key={item.menuItemId ?? item.menuItemName}
                                                className="transition-colors hover:bg-secondary/30"
                                            >
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    {item.menuItemName}
                                                </td>
                                                <td className="px-4 py-3 text-center tabular-nums text-foreground">
                                                    {item.plateCount}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                                                    {formatStockQty(item.qtyConsumed)} {usage.unit}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-slate-gray">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                                                            <div
                                                                className="h-full bg-brand"
                                                                style={{
                                                                    width: `${Math.min(100, item.share)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="w-10 text-right">{item.share}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                                                    {formatEtb(Number(item.cost))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: VENDOR RECEIVES */}
                {activeTab === "vendors" && (
                    <div className="rounded-2xl border border-hairline bg-card shadow-xs">
                        <div className="border-b border-hairline px-4 py-3">
                            <h3 className="text-[13px] font-semibold text-foreground">
                                Purchases & Receives History
                            </h3>
                            <p className="text-[11px] text-slate-gray">
                                Stock received from suppliers during the selected period.
                            </p>
                        </div>

                        {!usage?.receivedByVendor || usage.receivedByVendor.length === 0 ? (
                            <div className="py-12 text-center text-slate-gray">
                                <Truck className="mx-auto size-8 opacity-30" />
                                <p className="mt-2 text-[13px]">
                                    No stock received from vendors during this period.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-[13px]">
                                    <thead>
                                        <tr className="border-b border-hairline bg-secondary/20 text-left text-[11px] uppercase tracking-[0.06em] text-slate-gray">
                                            <th className="px-4 py-2.5">Vendor</th>
                                            <th className="px-4 py-2.5 text-center">Receipts / Invoices</th>
                                            <th className="px-4 py-2.5 text-right">Qty Received</th>
                                            <th className="px-4 py-2.5 text-right">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline">
                                        {usage.receivedByVendor.map(vendor => (
                                            <tr
                                                key={vendor.vendorId ?? vendor.vendorName}
                                                className="transition-colors hover:bg-secondary/30"
                                            >
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    {vendor.vendorName}
                                                </td>
                                                <td className="px-4 py-3 text-center tabular-nums text-slate-gray">
                                                    {vendor.count} invoices
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                    +{formatStockQty(vendor.qty)} {usage.unit}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                                                    {formatEtb(Number(vendor.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardFrame>
    );
}

