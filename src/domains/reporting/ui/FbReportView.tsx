"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Calendar,
    CheckCircle2,
    ChefHat,
    CircleDollarSign,
    Clock,
    Coffee,
    ExternalLink,
    FileSpreadsheet,
    Flame,
    Layers,
    MapPin,
    Package,
    PieChart,
    Receipt,
    Trash2,
    TrendingUp,
    UserRound,
    Utensils,
    Wine,
} from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/custom/organisms/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
    FbReportDailyVolume,
    FbReportData,
    FbReportItemIngredient,
    FbReportItemOrderInstance,
    FbReportSoldItem,
} from "@/context/services/managerReportsApi";
import { imageForDish } from "@/domains/catalog/application/menuImages";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

interface FbReportViewProps {
    data?: FbReportData;
    isLoading: boolean;
    isError: boolean;
    onRetry?: () => void;
}

type FbSubTab = "overview" | "sold-items" | "daily-volume" | "order-audit";

export default function FbReportView({
    data,
    isLoading,
    isError,
    onRetry,
}: FbReportViewProps) {
    const [subTab, setSubTab] = useState<FbSubTab>("overview");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedDish, setSelectedDish] = useState<FbReportSoldItem | null>(null);
    const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

    // Pagination states for DataTables
    const [soldItemsPage, setSoldItemsPage] = useState(1);
    const [dailyPage, setDailyPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const [dishDetailPage, setDishDetailPage] = useState(1);

    const PAGE_SIZE = 10;

    if (isLoading) {
        return (
            <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-hairline bg-card/60 p-8 text-center backdrop-blur-sm">
                <div className="relative flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Utensils className="size-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Calculating F&B metrics...</p>
                    <p className="text-xs text-muted-foreground">Aggregating food, beverage, dish sales, and recipe costs</p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-8 text-center">
                <AlertCircle className="size-7 text-destructive" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Failed to load Food & Beverage report</p>
                    <p className="text-xs text-muted-foreground">Please check your connection and retry.</p>
                </div>
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 h-8 text-xs">
                        Try Again
                    </Button>
                )}
            </div>
        );
    }

    const {
        totalRevenue,
        totalCost,
        grossProfit,
        overallCostPct,
        overallMarginPct,
        food,
        beverage,
        totalWasteCost,
        topWasteItems = [],
        topCostDrivers = [],
        topSellingItems = [],
        topProfitableItems = [],
        dailyVolumes = [],
        soldItems = [],
        orderInstances = [],
    } = data;

    const isFoodCostHealthy = food.costPct <= 32;
    const isBevCostHealthy = beverage.costPct <= 22;

    // Distinct list of categories for filter pills
    const allCategoriesList = useMemo(() => {
        const set = new Set<string>();
        soldItems.forEach(item => {
            if (item.categoryName) set.add(item.categoryName);
        });
        return Array.from(set).sort();
    }, [soldItems]);

    // Filtered sold items by selected category
    const filteredSoldItems = useMemo(() => {
        if (selectedCategory === "all") return soldItems;
        return soldItems.filter(item => item.categoryName.toLowerCase() === selectedCategory.toLowerCase());
    }, [soldItems, selectedCategory]);

    // Filtered order instances for audit log
    const filteredOrderInstances = useMemo(() => {
        let list = orderInstances;
        if (selectedCategory !== "all") {
            list = list.filter(o => o.categoryName.toLowerCase() === selectedCategory.toLowerCase());
        }
        if (selectedDateFilter) {
            list = list.filter(o => o.confirmedAt.startsWith(selectedDateFilter));
        }
        return list;
    }, [orderInstances, selectedCategory, selectedDateFilter]);

    // Orders for the selected dish in Detail Page
    const dishOrders = useMemo(() => {
        if (!selectedDish) return [];
        return orderInstances.filter(o => o.itemName.toLowerCase() === selectedDish.name.toLowerCase());
    }, [orderInstances, selectedDish]);

    // Format ISO string to readable date & time
    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // -------------------------------------------------------------
    // DataTable Column Definitions
    // -------------------------------------------------------------

    // 1. Sold Items Columns
    const soldItemsColumns: DataTableColumn<FbReportSoldItem>[] = [
        {
            id: "name",
            header: "Dish / Beverage",
            sortValue: row => row.name,
            cell: row => {
                const img = imageForDish(row.name);
                return (
                    <div className="flex items-center gap-3 py-1">
                        {img ? (
                            <div className="size-9 rounded-full overflow-hidden border border-hairline shrink-0 bg-muted/40 shadow-2xs">
                                <img
                                    src={img}
                                    alt={row.name}
                                    className="size-full object-cover"
                                    onError={e => {
                                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-slate-gray border border-hairline shrink-0">
                                <Utensils className="size-3.5" />
                            </div>
                        )}
                        <div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedDish(row);
                                    setDishDetailPage(1);
                                }}
                                className="font-semibold text-[13.5px] text-foreground hover:text-brand hover:underline text-left cursor-pointer transition-colors"
                            >
                                {row.name}
                            </button>
                            <p className="text-[11px] text-muted-foreground">{row.station}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "category",
            header: "Category",
            sortValue: row => row.categoryName,
            cell: row => (
                <span className="rounded-md bg-secondary/60 border border-hairline/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
                    {row.categoryName}
                </span>
            ),
        },
        {
            id: "qty",
            header: "Qty Sold",
            sortValue: row => row.quantitySold,
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <span className="font-mono text-[13px] font-semibold text-foreground">
                    {row.quantitySold} sold
                </span>
            ),
        },
        {
            id: "unitPrice",
            header: "Unit Price",
            sortValue: row => Number(row.unitPrice),
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <span className="font-mono text-xs text-muted-foreground">
                    {formatEtb(Number(row.unitPrice))}
                </span>
            ),
        },
        {
            id: "revenue",
            header: "Total Revenue",
            sortValue: row => Number(row.revenue),
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <span className="font-mono text-xs font-semibold text-foreground">
                    {formatEtb(Number(row.revenue))}
                </span>
            ),
        },
        {
            id: "margin",
            header: "Gross Margin",
            sortValue: row => row.marginPct,
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <div className="text-right">
                    <p className="font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        +{formatEtb(Number(row.profit))}
                    </p>
                    <p className="font-mono text-[10.5px] text-muted-foreground">{row.marginPct}%</p>
                </div>
            ),
        },
        {
            id: "actions",
            header: "Detail",
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setSelectedDish(row);
                        setDishDetailPage(1);
                    }}
                    className="h-7 text-[11.5px] gap-1 font-medium hover:border-brand/40 shadow-2xs"
                >
                    <span>Inspect</span>
                    <ExternalLink className="size-3 opacity-60" />
                </Button>
            ),
        },
    ];

    // 2. Daily Volume Columns
    const dailyVolumeColumns: DataTableColumn<FbReportDailyVolume>[] = [
        {
            id: "date",
            header: "Date",
            sortValue: row => row.date,
            cell: row => (
                <div className="flex items-center gap-2 py-0.5">
                    <Calendar className="size-3.5 text-brand" />
                    <div>
                        <p className="font-medium text-foreground text-[13px]">{row.displayDate}</p>
                        <p className="font-mono text-[10.5px] text-muted-foreground">{row.date}</p>
                    </div>
                </div>
            ),
        },
        {
            id: "totalItems",
            header: "Total Sold",
            sortValue: row => row.totalItems,
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <span className="font-mono text-[13px] font-semibold text-foreground">
                    {row.totalItems} items
                </span>
            ),
        },
        {
            id: "foodCount",
            header: "Food Dishes",
            sortValue: row => row.foodCount,
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <span className="font-mono text-xs text-amber-700 dark:text-amber-300">
                    🍲 {row.foodCount}
                </span>
            ),
        },
        {
            id: "beverageCount",
            header: "Drinks & Bar",
            sortValue: row => row.beverageCount,
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <span className="font-mono text-xs text-blue-700 dark:text-blue-300">
                    ☕ {row.beverageCount}
                </span>
            ),
        },
        {
            id: "revenue",
            header: "Revenue",
            sortValue: row => Number(row.totalRevenue),
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <span className="font-mono text-xs font-semibold text-foreground">
                    {formatEtb(Number(row.totalRevenue))}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Orders",
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSelectedDateFilter(row.date);
                        setSubTab("order-audit");
                    }}
                    className="h-7 text-xs text-brand hover:text-brand-deep font-medium"
                >
                    <span>View {row.totalItems} orders →</span>
                </Button>
            ),
        },
    ];

    // 3. Order Instance Columns
    const orderInstanceColumns: DataTableColumn<FbReportItemOrderInstance>[] = [
        {
            id: "confirmedAt",
            header: "Time",
            sortValue: row => new Date(row.confirmedAt).getTime(),
            cell: row => (
                <div className="flex items-center gap-1.5 py-0.5 text-xs">
                    <Clock className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-foreground font-medium">
                        {formatDateTime(row.confirmedAt)}
                    </span>
                </div>
            ),
        },
        {
            id: "itemName",
            header: "Dish / Beverage",
            sortValue: row => row.itemName,
            cell: row => {
                const img = imageForDish(row.itemName);
                return (
                    <div className="flex items-center gap-2.5 min-w-[150px]">
                        {img ? (
                            <div className="size-7 rounded-full overflow-hidden border border-hairline shrink-0 bg-muted/40 shadow-2xs">
                                <img
                                    src={img}
                                    alt={row.itemName}
                                    className="size-full object-cover"
                                    onError={e => {
                                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                                    }}
                                />
                            </div>
                        ) : null}
                        <div>
                            <span className="font-semibold text-foreground text-xs">{row.itemName}</span>
                            <span className="ml-1 text-[10.5px] text-muted-foreground">({row.categoryName})</span>
                            {row.specialInstruction && (
                                <p className="mt-0.5 inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 text-[10px] font-medium text-amber-900 dark:text-amber-200">
                                    📝 {row.specialInstruction}
                                </p>
                            )}
                            {row.modifiers && row.modifiers.length > 0 && (
                                <p className="text-[10px] text-muted-foreground">{row.modifiers.join(", ")}</p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: "tableLabel",
            header: "Table / Location",
            sortValue: row => row.tableLabel,
            cell: row => (
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 border border-hairline/80 px-2 py-0.5 text-foreground text-xs font-medium">
                    <MapPin className="size-3 text-brand shrink-0" />
                    {row.tableLabel}
                </span>
            ),
        },
        {
            id: "waiterName",
            header: "Waiter / Server",
            sortValue: row => row.waiterName,
            cell: row => (
                <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                    <UserRound className="size-3 text-slate-gray shrink-0" />
                    <span>{row.waiterName}</span>
                </div>
            ),
        },
        {
            id: "quantity",
            header: "Qty & Price",
            sortValue: row => Number(row.totalPrice),
            className: "text-right",
            headerClassName: "text-right",
            cell: row => (
                <div className="text-right">
                    <span className="font-mono text-xs font-semibold text-foreground">
                        {row.quantity}× {formatEtb(Number(row.totalPrice))}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-mono">
                        ({formatEtb(Number(row.unitPrice))} ea)
                    </p>
                </div>
            ),
        },
        {
            id: "receipt",
            header: "Receipt #",
            sortValue: row => row.billNumber ?? "",
            cell: row => {
                if (!row.billNumber) {
                    return (
                        <span className="text-xs text-muted-foreground italic">
                            Pending
                        </span>
                    );
                }
                return (
                    <div className="flex items-center gap-1">
                        <Receipt className="size-3 text-muted-foreground shrink-0" />
                        <div>
                            <span className="font-mono text-xs font-medium text-foreground">
                                {row.billNumber}
                            </span>
                            {row.billTotal && (
                                <p className="text-[10px] font-mono text-muted-foreground">
                                    Total: {formatEtb(Number(row.billTotal))}
                                </p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: "payment",
            header: "Payment",
            sortValue: row => row.paymentStatus ?? "",
            className: "text-right",
            headerClassName: "text-right",
            cell: row => {
                const status = row.paymentStatus || "UNPAID";
                const isPaid = status === "PAID";
                const isPartial = status === "PARTIAL";
                return (
                    <div className="text-right">
                        <span className={cn(
                            "inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-medium font-mono",
                            isPaid
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
                                : isPartial
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                                  : "bg-destructive/10 text-destructive border border-destructive/25",
                        )}>
                            {isPaid ? "✓ Paid" : isPartial ? "Partial" : "Unpaid"}
                        </span>
                        {row.amountPaid && (
                            <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">
                                Paid: {formatEtb(Number(row.amountPaid))}
                            </p>
                        )}
                        {row.paymentMethods && row.paymentMethods.length > 0 && (
                            <p className="text-[9.5px] text-muted-foreground">
                                {row.paymentMethods.join(", ")}
                            </p>
                        )}
                    </div>
                );
            },
        },
    ];

    // =========================================================================
    // DEDICATED DETAIL PAGE (NOT A MODAL) - CLEAN & MINIMAL
    // =========================================================================
    if (selectedDish) {
        const dishImage = imageForDish(selectedDish.name);
        const ingredientsList: FbReportItemIngredient[] = selectedDish.ingredients ?? [];

        return (
            <div className="space-y-6 animate-in fade-in duration-150">
                {/* 1. Header with Breadcrumb & Back Button */}
                <div className="flex items-center justify-between border-b border-hairline/80 pb-3 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDish(null)}
                            className="h-8 gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Back to F&B Report</span>
                        </Button>
                        <div className="h-4 w-px bg-hairline" />
                        <div className="flex items-center gap-2.5">
                            {dishImage ? (
                                <div className="size-9 rounded-full overflow-hidden border border-hairline shrink-0 bg-muted/40 shadow-2xs">
                                    <img src={dishImage} alt={selectedDish.name} className="size-full object-cover" />
                                </div>
                            ) : (
                                <div className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                                    <Utensils className="size-4" />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base font-semibold text-foreground tracking-tight">
                                        {selectedDish.name}
                                    </h2>
                                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                                        {selectedDish.categoryName}
                                    </span>
                                    <span className="rounded border border-hairline px-2 py-0.5 text-[11px] text-muted-foreground">
                                        {selectedDish.station}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                        Period: <span className="text-foreground font-medium">{data.from} → {data.to}</span>
                    </div>
                </div>

                {/* 2. Executive KPI Summary Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Units Sold
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-mono text-2xl font-bold text-foreground">
                                {selectedDish.quantitySold}
                            </span>
                            <span className="text-xs text-muted-foreground">servings</span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground font-mono">
                            Price: {formatEtb(Number(selectedDish.unitPrice))} ea
                        </p>
                    </div>

                    <div className="rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Gross Revenue
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-mono text-2xl font-bold text-foreground">
                                {formatEtb(Number(selectedDish.revenue))}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                            Total sales recorded
                        </p>
                    </div>

                    <div className="rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Total Recipe Cost
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-mono text-2xl font-bold text-foreground">
                                {formatEtb(Number(selectedDish.cost))}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground font-mono">
                            Cost share: {selectedDish.marginPct ? (100 - selectedDish.marginPct).toFixed(1) : 0}%
                        </p>
                    </div>

                    <div className="rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Net Gross Margin
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                +{formatEtb(Number(selectedDish.profit))}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                            {selectedDish.marginPct}% profit margin
                        </p>
                    </div>
                </div>

                {/* 3. SECTION 1: INGREDIENTS & RECIPE BREAKDOWN */}
                <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-hairline/80 pb-2.5">
                        <div className="flex items-center gap-2">
                            <Package className="size-4 text-amber-600 dark:text-amber-400" />
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">
                                    Ingredients & Recipe Breakdown
                                </h3>
                                <p className="text-[11.5px] text-muted-foreground">
                                    Materials used per plate and total consumption across all orders
                                </p>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                            {ingredientsList.length} ingredients
                        </span>
                    </div>

                    {ingredientsList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-hairline text-[11px] font-medium uppercase tracking-wider text-muted-foreground bg-secondary/20">
                                        <th className="py-2 px-3">Ingredient</th>
                                        <th className="py-2 px-3 text-right">Per Serving</th>
                                        <th className="py-2 px-3 text-right">Unit Cost</th>
                                        <th className="py-2 px-3 text-right">Plate Cost</th>
                                        <th className="py-2 px-3 text-right font-semibold text-foreground">Total Consumed</th>
                                        <th className="py-2 px-3 text-right font-semibold text-foreground">Total Material Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline/60">
                                    {ingredientsList.map((ing, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                            <td className="py-2.5 px-3 font-medium text-foreground">
                                                {ing.name}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                                {ing.quantityPerServing} {ing.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                                {formatEtb(Number(ing.unitCost))}/{ing.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground">
                                                {formatEtb(Number(ing.costPerServing))}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground">
                                                {ing.totalQuantityUsed} {ing.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-700 dark:text-amber-300">
                                                {formatEtb(Number(ing.totalCostUsed))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                            No recipe ingredients linked for this item in catalog.
                        </div>
                    )}
                </div>

                {/* 4. SECTION 2: ORDER HISTORY, TABLES, WAITERS & RECEIPT PAYMENT INFO */}
                <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-hairline/80 pb-2.5">
                        <div className="flex items-center gap-2">
                            <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">
                                    Service Records, Tables, Waiters & Receipts
                                </h3>
                                <p className="text-[11.5px] text-muted-foreground">
                                    Chronological order instances with table, waiter, receipt number, and payment status
                                </p>
                            </div>
                        </div>
                    </div>

                    <DataTable<FbReportItemOrderInstance>
                        columns={orderInstanceColumns}
                        data={dishOrders}
                        rowKey={row => row.id}
                        searchPlaceholder="Search orders by table, waiter, or receipt #..."
                        searchText={row => `${row.tableLabel} ${row.waiterName} ${row.billNumber ?? ""} ${row.paymentStatus ?? ""}`}
                        pagination={{
                            page: dishDetailPage,
                            totalPages: Math.max(1, Math.ceil(dishOrders.length / PAGE_SIZE)),
                            total: dishOrders.length,
                            limit: PAGE_SIZE,
                            onPageChange: p => setDishDetailPage(p),
                        }}
                        empty={
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                No order instances found for this dish in the selected date range.
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    // =========================================================================
    // MAIN F&B REPORT VIEW (CLEAN, MINIMAL & MODERN TABS)
    // =========================================================================
    return (
        <div className="space-y-6">
            {/* CLEAN, MINIMAL & MODERN SEGMENTED TABS BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline/80 pb-3">
                <nav className="inline-flex items-center gap-1 rounded-xl bg-secondary/50 p-1 border border-hairline/60" aria-label="F&B sections">
                    <button
                        type="button"
                        onClick={() => setSubTab("overview")}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] transition-all cursor-pointer",
                            subTab === "overview"
                                ? "bg-card text-foreground font-semibold shadow-2xs border border-hairline/80"
                                : "text-muted-foreground hover:text-foreground font-medium",
                        )}
                    >
                        <PieChart className="size-3.5" />
                        <span>Overview</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab("sold-items")}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] transition-all cursor-pointer",
                            subTab === "sold-items"
                                ? "bg-card text-foreground font-semibold shadow-2xs border border-hairline/80"
                                : "text-muted-foreground hover:text-foreground font-medium",
                        )}
                    >
                        <Layers className="size-3.5" />
                        <span>Category Sales</span>
                        <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10.5px] font-mono text-muted-foreground">
                            {soldItems.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab("daily-volume")}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] transition-all cursor-pointer",
                            subTab === "daily-volume"
                                ? "bg-card text-foreground font-semibold shadow-2xs border border-hairline/80"
                                : "text-muted-foreground hover:text-foreground font-medium",
                        )}
                    >
                        <Calendar className="size-3.5" />
                        <span>Daily Volume</span>
                        <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10.5px] font-mono text-muted-foreground">
                            {dailyVolumes.length}d
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab("order-audit")}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] transition-all cursor-pointer",
                            subTab === "order-audit"
                                ? "bg-card text-foreground font-semibold shadow-2xs border border-hairline/80"
                                : "text-muted-foreground hover:text-foreground font-medium",
                        )}
                    >
                        <FileSpreadsheet className="size-3.5" />
                        <span>Order Audit Log</span>
                    </button>
                </nav>

                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>Range:</span>
                    <span className="rounded-md bg-secondary/60 border border-hairline px-2 py-0.5 text-foreground font-medium">
                        {data.from} → {data.to}
                    </span>
                </div>
            </div>

            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {subTab === "overview" && (
                <div className="space-y-6">
                    {/* Top Executive F&B Summary Cards */}
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Total F&B Sales */}
                        <div className="relative overflow-hidden rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Total F&B Revenue
                                </span>
                                <div className="rounded-lg bg-brand/10 p-1.5 text-brand">
                                    <CircleDollarSign className="size-3.5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
                                    {formatEtb(Number(totalRevenue))}
                                </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Gross Profit</span>
                                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                    {formatEtb(Number(grossProfit))}
                                </span>
                            </div>
                        </div>

                        {/* Overall Cost % */}
                        <div className="relative overflow-hidden rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Cost of Goods
                                </span>
                                <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
                                    <PieChart className="size-3.5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
                                    {overallCostPct}%
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                    ({formatEtb(Number(totalCost))})
                                </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Overall Margin</span>
                                <span className="font-mono font-medium text-foreground">
                                    {overallMarginPct}%
                                </span>
                            </div>
                        </div>

                        {/* Food Cost Health */}
                        <div className="relative overflow-hidden rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Food Cost Rate
                                </span>
                                <div className={cn(
                                    "rounded-lg p-1.5",
                                    isFoodCostHealthy ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive",
                                )}>
                                    <ChefHat className="size-3.5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
                                    {food.costPct}%
                                </span>
                                <Badge
                                    variant={isFoodCostHealthy ? "outline" : "danger"}
                                    className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0"
                                >
                                    {isFoodCostHealthy ? "Target Met" : "High Cost"}
                                </Badge>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Food Sales: {formatEtb(Number(food.revenue))}</span>
                                <span className="font-mono">{food.sharePct}%</span>
                            </div>
                        </div>

                        {/* Beverage Cost Health */}
                        <div className="relative overflow-hidden rounded-xl border border-hairline bg-card p-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Beverage Cost Rate
                                </span>
                                <div className={cn(
                                    "rounded-lg p-1.5",
                                    isBevCostHealthy ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive",
                                )}>
                                    <Wine className="size-3.5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
                                    {beverage.costPct}%
                                </span>
                                <Badge
                                    variant={isBevCostHealthy ? "outline" : "danger"}
                                    className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0"
                                >
                                    {isBevCostHealthy ? "Healthy" : "Check Spoilage"}
                                </Badge>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Drink Sales: {formatEtb(Number(beverage.revenue))}</span>
                                <span className="font-mono">{beverage.sharePct}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Food vs Beverage Split */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* Food Operations */}
                        <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-hairline/80 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <ChefHat className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">Food Operations</h3>
                                        <p className="text-[11px] text-muted-foreground">Kitchen & Warm Stations</p>
                                    </div>
                                </div>
                                <span className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
                                    {food.sharePct}% of sales
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-lg border border-hairline/60 bg-muted/10 p-2.5">
                                    <span className="text-[10.5px] text-muted-foreground">Revenue</span>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                        {formatEtb(Number(food.revenue))}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-hairline/60 bg-muted/10 p-2.5">
                                    <span className="text-[10.5px] text-muted-foreground">Recipe Cost</span>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                        {formatEtb(Number(food.cost))}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-hairline/60 bg-muted/10 p-2.5">
                                    <span className="text-[10.5px] text-muted-foreground">Margin</span>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        {food.marginPct}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Beverage Operations */}
                        <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-hairline/80 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Coffee className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">Beverage Operations</h3>
                                        <p className="text-[11px] text-muted-foreground">Barista, Drinks & Bar</p>
                                    </div>
                                </div>
                                <span className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
                                    {beverage.sharePct}% of sales
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-lg border border-hairline/60 bg-muted/10 p-2.5">
                                    <span className="text-[10.5px] text-muted-foreground">Revenue</span>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                        {formatEtb(Number(beverage.revenue))}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-hairline/60 bg-muted/10 p-2.5">
                                    <span className="text-[10.5px] text-muted-foreground">Recipe Cost</span>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                        {formatEtb(Number(beverage.cost))}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-hairline/60 bg-muted/10 p-2.5">
                                    <span className="text-[10.5px] text-muted-foreground">Margin</span>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        {beverage.marginPct}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Selling & Cost Drivers Cards */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* Top Selling */}
                        <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3">
                                <div className="flex items-center gap-2">
                                    <Flame className="size-4 text-amber-500" />
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">Top Volume Dishes</h3>
                                        <p className="text-[11px] text-muted-foreground">Most ordered items in this period</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSubTab("sold-items")}
                                    className="text-xs text-brand hover:text-brand-deep font-medium"
                                >
                                    Browse All →
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {topSellingItems.map((item, idx) => {
                                    const matchingSold = soldItems.find(s => s.name === item.name);
                                    return (
                                        <div
                                            key={item.name}
                                            onClick={() => matchingSold && setSelectedDish(matchingSold)}
                                            className="flex items-center justify-between rounded-lg border border-hairline/60 bg-muted/10 p-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex size-5 items-center justify-center rounded bg-card text-[11px] font-medium text-muted-foreground">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-foreground text-xs">{item.name}</p>
                                                    <p className="text-[10.5px] text-muted-foreground">{item.station}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono text-xs font-semibold text-foreground">
                                                    {item.quantitySold} sold
                                                </p>
                                                <p className="font-mono text-[10.5px] text-muted-foreground">
                                                    {formatEtb(Number(item.revenue))}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cost Drivers */}
                        <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs">
                            <div className="flex items-center gap-2 pb-3">
                                <TrendingUp className="size-4 text-brand" />
                                <div>
                                    <h3 className="font-semibold text-sm text-foreground">Top Ingredient Cost Drivers</h3>
                                    <p className="text-[11px] text-muted-foreground">Highest raw materials cost consumption</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {topCostDrivers.map((ing) => (
                                    <div
                                        key={ing.name}
                                        className="flex items-center justify-between rounded-lg border border-hairline/60 bg-muted/10 p-2.5"
                                    >
                                        <div>
                                            <p className="font-medium text-foreground text-xs">{ing.name}</p>
                                            <p className="text-[10.5px] text-muted-foreground">
                                                {ing.quantityConsumed} {ing.unit} @ {formatEtb(Number(ing.unitCost))}/{ing.unit}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-xs font-semibold text-foreground">
                                                {formatEtb(Number(ing.totalCost))}
                                            </p>
                                            <span className="font-mono text-[10.5px] text-muted-foreground">
                                                {ing.costSharePct}% of total cost
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: SOLD ITEMS BY CATEGORY */}
            {subTab === "sold-items" && (
                <div className="space-y-4">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCategory("all");
                                setSoldItemsPage(1);
                            }}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                                selectedCategory === "all"
                                    ? "bg-foreground text-background shadow-2xs font-semibold"
                                    : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-hairline/60",
                            )}
                        >
                            All Categories ({soldItems.length})
                        </button>
                        {allCategoriesList.map(cat => {
                            const count = soldItems.filter(i => i.categoryName.toLowerCase() === cat.toLowerCase()).length;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setSoldItemsPage(1);
                                    }}
                                    className={cn(
                                        "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                                        selectedCategory.toLowerCase() === cat.toLowerCase()
                                            ? "bg-foreground text-background shadow-2xs font-semibold"
                                            : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-hairline/60",
                                    )}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Data Table */}
                    <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3">
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">
                                    Sold Dishes & Drinks {selectedCategory !== "all" ? `· ${selectedCategory}` : ""}
                                </h3>
                                <p className="text-[11.5px] text-muted-foreground">
                                    Click any dish name or &quot;Inspect&quot; to open its recipe ingredients and order receipts
                                </p>
                            </div>
                        </div>

                        <DataTable<FbReportSoldItem>
                            columns={soldItemsColumns}
                            data={filteredSoldItems}
                            rowKey={row => row.id || row.name}
                            searchPlaceholder="Search dishes by name or category..."
                            searchText={row => `${row.name} ${row.categoryName} ${row.station}`}
                            pagination={{
                                page: soldItemsPage,
                                totalPages: Math.max(1, Math.ceil(filteredSoldItems.length / PAGE_SIZE)),
                                total: filteredSoldItems.length,
                                limit: PAGE_SIZE,
                                onPageChange: p => setSoldItemsPage(p),
                            }}
                            empty={
                                <div className="py-10 text-center text-xs text-muted-foreground">
                                    No sold items recorded in this category for the selected period.
                                </div>
                            }
                        />
                    </div>
                </div>
            )}

            {/* TAB 3: DAILY VOLUME */}
            {subTab === "daily-volume" && (
                <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-hairline/80">
                        <div>
                            <h3 className="font-semibold text-sm text-foreground">Daily Volume & Velocity</h3>
                            <p className="text-[11.5px] text-muted-foreground">
                                Day-by-day count of total items sold, food vs. drink breakdown, and daily revenue
                            </p>
                        </div>
                    </div>

                    <DataTable<FbReportDailyVolume>
                        columns={dailyVolumeColumns}
                        data={dailyVolumes}
                        rowKey={row => row.date}
                        searchPlaceholder="Filter by date..."
                        searchText={row => `${row.date} ${row.displayDate}`}
                        pagination={{
                            page: dailyPage,
                            totalPages: Math.max(1, Math.ceil(dailyVolumes.length / PAGE_SIZE)),
                            total: dailyVolumes.length,
                            limit: PAGE_SIZE,
                            onPageChange: p => setDailyPage(p),
                        }}
                        empty={
                            <div className="py-10 text-center text-xs text-muted-foreground">
                                No daily volume recorded for this period.
                            </div>
                        }
                    />
                </div>
            )}

            {/* TAB 4: ORDER AUDIT LOG */}
            {subTab === "order-audit" && (
                <div className="space-y-4">
                    {selectedDateFilter && (
                        <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-xs">
                            <span className="font-medium text-foreground">Filtered by Date:</span>
                            <span className="font-mono text-xs text-brand font-semibold">
                                {selectedDateFilter}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedDateFilter(null)}
                                className="ml-auto text-xs font-medium text-brand hover:underline cursor-pointer"
                            >
                                Clear Filter ✕
                            </button>
                        </div>
                    )}

                    <div className="rounded-xl border border-hairline bg-card p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-hairline/80">
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">
                                    All Order Instances & Receipt Audit
                                </h3>
                                <p className="text-[11.5px] text-muted-foreground">
                                    Chronological log of items ordered with table location, waiter, order time, receipt number, and payment status
                                </p>
                            </div>
                        </div>

                        <DataTable<FbReportItemOrderInstance>
                            columns={orderInstanceColumns}
                            data={filteredOrderInstances}
                            rowKey={row => row.id}
                            searchPlaceholder="Search by dish, waiter, table, or receipt #..."
                            searchText={row => `${row.itemName} ${row.tableLabel} ${row.waiterName} ${row.categoryName} ${row.billNumber ?? ""} ${row.paymentStatus ?? ""}`}
                            pagination={{
                                page: auditPage,
                                totalPages: Math.max(1, Math.ceil(filteredOrderInstances.length / PAGE_SIZE)),
                                total: filteredOrderInstances.length,
                                limit: PAGE_SIZE,
                                onPageChange: p => setAuditPage(p),
                            }}
                            empty={
                                <div className="py-10 text-center text-xs text-muted-foreground">
                                    No order items found matching the current criteria.
                                </div>
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
