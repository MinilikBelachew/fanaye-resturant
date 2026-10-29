"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    Loader2,
    Plus,
    RefreshCw,
    Settings2,
    TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Button } from "@/components/ui/button";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import {
    useGetFinanceCategoriesQuery,
    useGetFinanceSummaryQuery,
    type FinanceAudience,
    type FinanceDirection,
    type FinanceEditableEntry,
    type FinancePeriod,
} from "../financeApi";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import AddEntrySheet from "./AddEntrySheet";
import FinanceCategoryManager from "./FinanceCategoryManager";
import FinanceEntriesTable from "./FinanceEntriesTable";
import IngredientStockPanel from "./IngredientStockPanel";

const BRAND = "var(--brand, #e85d04)";
const MUTED = "var(--slate-gray, #94a3b8)";
const SUCCESS = "#059669";
const SOFT = "#2563eb";

type StatItem = {
    label: string;
    value: string;
    hint?: string;
    accent?: boolean;
    tone?: "positive" | "negative";
};

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function StatGrid({
    items,
    compact = false,
}: {
    items: StatItem[];
    compact?: boolean;
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {items.map((item, index) => (
                <div
                    key={item.label}
                    className="rounded-2xl border border-hairline bg-card px-4 py-3.5 transition-transform hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 40}ms` }}
                >
                    <p className="text-[11px] uppercase tracking-[0.07em] text-slate-gray">
                        {item.label}
                    </p>
                    <p
                        className={cn(
                            "mt-1.5 font-semibold tabular-nums tracking-tight",
                            compact ? "text-[15px]" : "text-[20px]",
                            item.tone === "positive"
                                ? "text-emerald-600"
                                : item.tone === "negative"
                                  ? "text-destructive"
                                  : item.accent
                                    ? "text-brand"
                                    : "text-foreground",
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

function ChartShell({
    title,
    subtitle,
    empty,
    isEmpty,
    children,
}: {
    title: string;
    subtitle?: string;
    empty: string;
    isEmpty: boolean;
    children: ReactNode;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand/[0.06] to-transparent"
            />
            <div className="relative p-4 sm:p-5">
                <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                    {title}
                </h3>
                {subtitle ? (
                    <p className="mt-0.5 text-[12px] text-slate-gray">
                        {subtitle}
                    </p>
                ) : null}
                <div className="mt-4 h-[240px] w-full">
                    {isEmpty ? (
                        <div className="flex h-full items-center justify-center text-[13px] text-slate-gray">
                            {empty}
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </div>
        </div>
    );
}

function MoneyTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value?: number; name?: string; color?: string }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-hairline bg-card px-3 py-2 shadow-sm">
            {label ? (
                <p className="mb-1 text-[11px] font-medium text-foreground">
                    {label}
                </p>
            ) : null}
            {payload.map(entry => (
                <p
                    key={entry.name}
                    className="text-[12px] tabular-nums text-slate-gray"
                >
                    <span style={{ color: entry.color }}>{entry.name}</span>
                    {": "}
                    <span className="font-medium text-foreground">
                        {formatEtb(Number(entry.value ?? 0))}
                    </span>
                </p>
            ))}
        </div>
    );
}

export default function FinanceSummaryBoard({
    audience,
}: {
    audience: FinanceAudience;
}) {
    const t = useTranslations("financeSummary");

    const [period, setPeriod] = useState<FinancePeriod>("day");
    const [branchId, setBranchId] = useState("all");
    const [addOpen, setAddOpen] = useState(false);
    const [addDirection, setAddDirection] =
        useState<FinanceDirection>("EXPENSE");
    const [editEntry, setEditEntry] = useState<FinanceEditableEntry | null>(
        null,
    );
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [date, setDate] = useState(() => todayIso());

    const summaryArgs = useMemo(
        () => ({
            audience,
            period,
            date,
            ...(audience === "owner" && branchId ? { branchId } : {}),
        }),
        [audience, period, date, branchId],
    );

    const { data, isLoading, isFetching, isError, refetch } =
        useGetFinanceSummaryQuery(summaryArgs);

    const { data: incomeCategories } = useGetFinanceCategoriesQuery({
        audience,
        direction: "INCOME",
    });
    const { data: expenseCategories } = useGetFinanceCategoriesQuery({
        audience,
        direction: "EXPENSE",
    });
    const { data: branchesData } = useListBranchesQuery();

    const categories = useMemo(
        () => [
            ...(incomeCategories?.data ?? []),
            ...(expenseCategories?.data ?? []),
        ],
        [incomeCategories, expenseCategories],
    );

    const summary = data?.data;

    const chartData = useMemo(
        () =>
            (summary?.series ?? []).map(point => ({
                date: point.date,
                revenue: Number(point.revenue) || 0,
                materialCost: Number(point.materialCost) || 0,
                netProfit: Number(point.netProfit) || 0,
            })),
        [summary],
    );

    const chartEmpty =
        chartData.length < 1 ||
        chartData.every(
            point =>
                point.revenue === 0 &&
                point.materialCost === 0 &&
                point.netProfit === 0,
        );

    const periods: Array<{ id: FinancePeriod; label: string }> = [
        { id: "day", label: t("periodDay") },
        { id: "week", label: t("periodWeek") },
        { id: "month", label: t("periodMonth") },
    ];

    const activeBranchId =
        audience === "owner" && branchId ? branchId : undefined;

    const openAdd = (direction: FinanceDirection) => {
        setEditEntry(null);
        setAddDirection(direction);
        setAddOpen(true);
    };

    const locationLabel = (type: string) => {
        if (type === "MAIN_WAREHOUSE") return t("invLocationMainWarehouse");
        if (type === "BRANCH_STORE") return t("invLocationBranchStore");
        if (type === "SHARED_STORE") return t("invLocationSharedStore");
        return t("invLocationOther");
    };

    return (
        <DashboardFrame>
            <div className="relative overflow-hidden rounded-3xl border border-hairline bg-card">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-brand/10 blur-3xl"
                />
                <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                    <PageHeader
                        compact
                        eyebrow={t("eyebrow")}
                        title={
                            audience === "owner"
                                ? t("titleOwner")
                                : t("titleManager")
                        }
                        description={
                            summary
                                ? `${t("from")} ${summary.from} – ${t("to")} ${summary.to}`
                                : t("loading")
                        }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        {audience === "owner" ? (
                            <select
                                value={branchId}
                                onChange={e => setBranchId(e.target.value)}
                                className="h-8 rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                                aria-label={t("branch")}
                            >
                                <option value="all">{t("allBranches")}</option>
                                {(branchesData?.data ?? []).map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                        <input
                            type="date"
                            value={date}
                            onChange={event =>
                                setDate(event.target.value || todayIso())
                            }
                            className="h-8 rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none"
                            aria-label={t("dateLabel")}
                        />
                        <div className="flex rounded-full border border-hairline bg-background/80 p-1 backdrop-blur">
                            {periods.map(entry => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => setPeriod(entry.id)}
                                    className={cn(
                                        "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all",
                                        period === entry.id
                                            ? "bg-brand text-white shadow-sm"
                                            : "text-slate-gray hover:text-foreground",
                                    )}
                                >
                                    {entry.label}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={isFetching}
                            onClick={() => void refetch()}
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3.5",
                                    isFetching && "animate-spin",
                                )}
                            />
                            {t("refresh")}
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-hairline bg-card py-16 text-slate-gray">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                </div>
            ) : null}

            {isError ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-[13px] text-destructive">
                    {t("loadError")}
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => void refetch()}
                    >
                        <RefreshCw className="size-3.5" />
                        {t("retry")}
                    </Button>
                </div>
            ) : null}

            {!isLoading && !isError && summary ? (
                <div className="space-y-4 animate-in fade-in-0 duration-300">
                    <StatGrid
                        items={[
                            {
                                label: t("kpiRevenue"),
                                value: formatEtb(Number(summary.revenue.total)),
                                accent: true,
                            },
                            {
                                label: t("kpiMaterialCost"),
                                value: formatEtb(
                                    Number(summary.cost.materialCost),
                                ),
                                hint: t("foodCostPct", {
                                    value: summary.cost.foodCostPct,
                                }),
                            },
                            {
                                label: t("kpiPayroll"),
                                value: formatEtb(
                                    Number(summary.payroll.amount),
                                ),
                                hint: t("payrollRuns", {
                                    count: summary.payroll.runsCount,
                                }),
                            },
                            {
                                label: t("kpiOtherExpenses"),
                                value: formatEtb(
                                    Number(summary.expenses.total),
                                ),
                            },
                            {
                                label: t("kpiNetProfit"),
                                value: formatEtb(
                                    Number(summary.totals.netProfit),
                                ),
                                accent: true,
                                tone:
                                    Number(summary.totals.netProfit) >= 0
                                        ? "positive"
                                        : "negative",
                            },
                            {
                                label: t("kpiNetMargin"),
                                value: `${summary.totals.netMarginPct}%`,
                            },
                        ]}
                    />

                    <StatGrid
                        compact
                        items={[
                            {
                                label: t("billedRevenue"),
                                value: formatEtb(
                                    Number(summary.revenue.billed),
                                ),
                            },
                            {
                                label: t("otherIncome"),
                                value: formatEtb(
                                    Number(summary.revenue.otherIncome),
                                ),
                            },
                            {
                                label: t("cogs"),
                                value: formatEtb(Number(summary.cost.cogs)),
                            },
                            {
                                label: t("waste"),
                                value: formatEtb(Number(summary.cost.waste)),
                            },
                            {
                                label: t("grossProfit"),
                                value: formatEtb(
                                    Number(summary.totals.grossProfit),
                                ),
                            },
                            {
                                label: t("primeCost"),
                                value: formatEtb(
                                    Number(summary.totals.primeCost),
                                ),
                            },
                        ]}
                    />

                    <ChartShell
                        title={t("chartTitle")}
                        subtitle={
                            summary.branchName ?? summary.branchId ?? undefined
                        }
                        empty={t("empty")}
                        isEmpty={chartEmpty}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 8,
                                    right: 12,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="var(--hairline, #e2e8f0)"
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: MUTED }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: MUTED }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={value =>
                                        value >= 1000
                                            ? `${(value / 1000).toFixed(0)}k`
                                            : String(value)
                                    }
                                />
                                <Tooltip content={<MoneyTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    name={t("chartRevenue")}
                                    stroke={BRAND}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="materialCost"
                                    name={t("chartMaterialCost")}
                                    stroke={SOFT}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="netProfit"
                                    name={t("chartNetProfit")}
                                    stroke={SUCCESS}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartShell>

                    <div className="grid gap-3 lg:grid-cols-2">
                        <section className="rounded-2xl border border-hairline bg-card p-4 sm:p-5">
                            <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                                {t("expensesByCategory")}
                            </h3>
                            {summary.expenses.byCategory.length === 0 ? (
                                <p className="mt-8 text-center text-[13px] text-slate-gray">
                                    {t("empty")}
                                </p>
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {summary.expenses.byCategory.map(row => (
                                        <li
                                            key={
                                                row.categoryId ??
                                                `${row.name}-${row.code}`
                                            }
                                            className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-3 py-2.5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-medium text-foreground">
                                                    {row.name}
                                                </p>
                                                <p className="text-[11px] text-slate-gray">
                                                    {t("share", {
                                                        value: row.share,
                                                    })}
                                                </p>
                                            </div>
                                            <span className="shrink-0 font-semibold tabular-nums text-foreground">
                                                {formatEtb(Number(row.amount))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    <section className="overflow-hidden rounded-2xl border border-hairline bg-card">
                        <div className="border-b border-hairline px-4 py-3">
                            <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                                {t("inventoryTitle")}
                            </h3>
                        </div>
                        <div className="space-y-4 p-4 sm:p-5">
                            <StatGrid
                                compact
                                items={[
                                    {
                                        label: t("invPurchases"),
                                        value: formatEtb(
                                            Number(
                                                summary.inventory.purchases
                                                    .total,
                                            ),
                                        ),
                                        hint: t("invPurchasesHint", {
                                            count: summary.inventory.purchases
                                                .count,
                                        }),
                                    },
                                    {
                                        label: t("invStockOnHand"),
                                        value: formatEtb(
                                            Number(
                                                summary.inventory
                                                    .stockOnHandValue,
                                            ),
                                        ),
                                        accent: true,
                                    },
                                    {
                                        label: t("invTransfersIn"),
                                        value: formatEtb(
                                            Number(
                                                summary.inventory.transfersIn,
                                            ),
                                        ),
                                    },
                                    {
                                        label: t("invTransfersOut"),
                                        value: formatEtb(
                                            Number(
                                                summary.inventory.transfersOut,
                                            ),
                                        ),
                                    },
                                    {
                                        label: t("invAdjustments"),
                                        value: formatEtb(
                                            Number(
                                                summary.inventory.adjustments,
                                            ),
                                        ),
                                    },
                                    {
                                        label: t("invNetMovement"),
                                        value: formatEtb(
                                            Number(
                                                summary.inventory.netMovement,
                                            ),
                                        ),
                                    },
                                ]}
                            />

                            <div className="grid gap-3 lg:grid-cols-2">
                                <div className="rounded-xl border border-hairline p-3">
                                    <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-slate-gray">
                                        {t("invPurchasesByVendor")}
                                    </p>
                                    {summary.inventory.purchases.byVendor
                                        .length === 0 ? (
                                        <p className="mt-6 text-center text-[13px] text-slate-gray">
                                            {t("invNoData")}
                                        </p>
                                    ) : (
                                        <ul className="mt-2 space-y-1.5">
                                            {summary.inventory.purchases.byVendor.map(
                                                row => (
                                                    <li
                                                        key={
                                                            row.id ??
                                                            `vendor-${row.name}`
                                                        }
                                                        className="flex items-center justify-between gap-3 text-[13px]"
                                                    >
                                                        <span className="min-w-0 truncate text-foreground">
                                                            {row.name}
                                                        </span>
                                                        <span className="shrink-0 font-medium tabular-nums text-foreground">
                                                            {formatEtb(
                                                                Number(
                                                                    row.amount,
                                                                ),
                                                            )}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </div>

                                <div className="rounded-xl border border-hairline p-3">
                                    <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-slate-gray">
                                        {t("invStockByLocation")}
                                    </p>
                                    {summary.inventory.stockByLocation
                                        .length === 0 ? (
                                        <p className="mt-6 text-center text-[13px] text-slate-gray">
                                            {t("invNoData")}
                                        </p>
                                    ) : (
                                        <ul className="mt-2 space-y-1.5">
                                            {summary.inventory.stockByLocation.map(
                                                row => (
                                                    <li
                                                        key={
                                                            row.locationId ??
                                                            `loc-${row.locationName}`
                                                        }
                                                        className="flex items-center justify-between gap-3 text-[13px]"
                                                    >
                                                        <span className="min-w-0 truncate text-foreground">
                                                            {row.locationName}
                                                            <span className="ml-1.5 text-[11px] text-slate-gray">
                                                                {locationLabel(
                                                                    row.locationType,
                                                                )}
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 font-medium tabular-nums text-foreground">
                                                            {formatEtb(
                                                                Number(
                                                                    row.value,
                                                                ),
                                                            )}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <p className="rounded-xl border border-hairline bg-secondary/30 px-3 py-2.5 text-[12px] tabular-nums text-slate-gray">
                                {t("invBridge", {
                                    opening: formatEtb(
                                        Number(
                                            summary.inventory.openingStockValue,
                                        ),
                                    ),
                                    movement: formatEtb(
                                        Number(summary.inventory.netMovement),
                                    ),
                                    closing: formatEtb(
                                        Number(
                                            summary.inventory.closingStockValue,
                                        ),
                                    ),
                                })}
                            </p>

                            {audience === "manager" ? (
                                <p className="flex items-start gap-2 text-[12px] text-slate-gray">
                                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                                    {t("invManagerNote")}
                                </p>
                            ) : null}

                            <IngredientStockPanel
                                audience={audience}
                                period={period}
                                date={date}
                                branchId={activeBranchId}
                            />
                        </div>
                    </section>

                    {audience === "owner" &&
                    (summary.branches?.length ?? 0) > 0 ? (
                        <section className="overflow-hidden rounded-2xl border border-hairline bg-card">
                            <div className="border-b border-hairline px-4 py-3">
                                <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                                    {t("branchComparison")}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] text-[13px]">
                                    <thead>
                                        <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-[0.06em] text-slate-gray">
                                            <th className="px-4 py-2.5 font-medium">
                                                {t("branchName")}
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                {t("kpiRevenue")}
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                {t("materialCost")}
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                {t("kpiPayroll")}
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                {t("expenses")}
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                {t("netProfit")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(summary.branches ?? []).map(row => (
                                            <tr
                                                key={row.branchId}
                                                onClick={() =>
                                                    setBranchId(row.branchId)
                                                }
                                                className={cn(
                                                    "cursor-pointer border-b border-hairline transition-colors hover:bg-secondary/40",
                                                    branchId === row.branchId &&
                                                        "bg-secondary/60",
                                                )}
                                            >
                                                <td className="px-4 py-2.5 font-medium text-foreground">
                                                    {row.branchName}
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                                                    {formatEtb(
                                                        Number(row.revenue),
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-slate-gray">
                                                    {formatEtb(
                                                        Number(
                                                            row.materialCost,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-slate-gray">
                                                    {formatEtb(
                                                        Number(row.payroll),
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-slate-gray">
                                                    {formatEtb(
                                                        Number(
                                                            row.expensesTotal,
                                                        ),
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        "px-4 py-2.5 text-right font-semibold tabular-nums",
                                                        Number(row.netProfit) >=
                                                            0
                                                            ? "text-emerald-600"
                                                            : "text-destructive",
                                                    )}
                                                >
                                                    {formatEtb(
                                                        Number(row.netProfit),
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="flex items-start gap-2 border-t border-hairline px-4 py-3 text-[12px] text-slate-gray">
                                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                                {t("tenantWidePayrollNote")}
                            </p>
                        </section>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setCategoriesOpen(true)}
                        >
                            <Settings2 className="size-3.5" />
                            {t("manageCategories")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-emerald-700"
                            onClick={() => openAdd("INCOME")}
                        >
                            <Plus className="size-3.5" />
                            {t("addIncome")}
                        </Button>
                        <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => openAdd("EXPENSE")}
                        >
                            <Plus className="size-3.5" />
                            {t("addExpense")}
                        </Button>
                    </div>

                    <FinanceEntriesTable
                        audience={audience}
                        branchId={activeBranchId}
                        categories={categories}
                        onAddClick={() => openAdd("EXPENSE")}
                        onEdit={entryToEdit => {
                            setEditEntry(entryToEdit);
                            setAddDirection(entryToEdit.direction);
                            setAddOpen(true);
                        }}
                    />
                </div>
            ) : null}

            {addOpen ? (
                <AddEntrySheet
                    audience={audience}
                    branchId={activeBranchId}
                    categories={categories}
                    defaultDirection={addDirection}
                    entry={editEntry}
                    onClose={() => {
                        setAddOpen(false);
                        setEditEntry(null);
                    }}
                    onSuccess={() => void refetch()}
                />
            ) : null}

            {categoriesOpen ? (
                <FinanceCategoryManager
                    audience={audience}
                    categories={categories}
                    onClose={() => setCategoriesOpen(false)}
                />
            ) : null}
        </DashboardFrame>
    );
}
