"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
    Boxes,
    Loader2,
    Trash2,
    TrendingUp,
    Truck,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { formatEtb, formatQty } from "@/lib/money";
import { cn } from "@/lib/utils";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import {
    useGetBranchAnalyticsQuery,
    type BranchAnalyticsItem,
    type BranchAnalyticsMenuItem,
    type BranchAnalyticsRange,
} from "@/context/services/inventoryApi";

const RANGES: { key: BranchAnalyticsRange; labelKey: string }[] = [
    { key: "today", labelKey: "analyticsRangeToday" },
    { key: "week", labelKey: "analyticsRangeWeek" },
    { key: "month", labelKey: "analyticsRangeMonth" },
];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    SENT: {
        label: "Awaiting driver",
        className: "bg-amber-100 text-amber-800",
    },
    IN_TRANSIT: { label: "In transit", className: "bg-cyan-100 text-cyan-800" },
    ARRIVED: { label: "Arrived", className: "bg-emerald-100 text-emerald-800" },
    RECEIVED: { label: "Received", className: "bg-slate-200 text-slate-700" },
};

function SummaryCard({
    icon,
    title,
    value,
    sub,
}: {
    icon: ReactNode;
    title: string;
    value: string;
    sub?: string | null;
}) {
    return (
        <div className="rounded-2xl border border-hairline bg-surface-card p-4">
            <div className="flex items-center gap-2 text-xs text-slate-gray">
                {icon}
                <span>{title}</span>
            </div>
            <div className="mt-2 text-xl font-semibold text-foreground">
                {value}
            </div>
            {sub ? (
                <div className="mt-0.5 text-xs text-slate-gray">{sub}</div>
            ) : null}
        </div>
    );
}

function MiniStat({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-3">
            <div className="text-[11px] text-slate-gray">{label}</div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
                {value}
            </div>
            {sub ? (
                <div className="mt-0.5 text-xs text-slate-gray">{sub}</div>
            ) : null}
        </div>
    );
}

function ItemSparkline({ values }: { values: number[] }) {
    const max = Math.max(...values, 0);
    if (max <= 0) {
        return <span className="text-slate-gray">—</span>;
    }
    return (
        <div className="flex h-6 w-28 items-end gap-px">
            {values.map((v, i) => (
                <div
                    key={i}
                    title={formatQty(v)}
                    className="flex-1 rounded-t-sm bg-amber-500"
                    style={{
                        height: `${Math.max((v / max) * 100, v > 0 ? 8 : 0)}%`,
                    }}
                />
            ))}
        </div>
    );
}

function Change24h({ value, unit }: { value: number; unit: string }) {
    if (value === 0) {
        return <span className="text-slate-gray">—</span>;
    }
    const up = value > 0;
    return (
        <span
            className={cn(
                "font-medium",
                up ? "text-emerald-600" : "text-rose-600",
            )}
        >
            {up ? "▲" : "▼"} {formatQty(Math.abs(value))} {unit}
        </span>
    );
}

export default function InventoryAnalyticsBoard() {
    const t = useTranslations("inventory");
    const [range, setRange] = useState<BranchAnalyticsRange>("today");
    const [selected, setSelected] = useState<BranchAnalyticsItem | null>(null);
    const [menuSelected, setMenuSelected] =
        useState<BranchAnalyticsMenuItem | null>(null);
    const [page, setPage] = useState(1);
    const [menuPage, setMenuPage] = useState(1);
    const { data, isLoading, isError } = useGetBranchAnalyticsQuery({ range });

    const analytics = data?.data;

    const columns = useMemo<DataTableColumn<BranchAnalyticsItem>[]>(
        () => [
            {
                id: "name",
                header: t("analyticsItem"),
                cell: row => (
                    <div>
                        <div className="font-medium text-foreground">
                            {row.name}
                        </div>
                        <div className="text-[11px] text-slate-gray">
                            {row.unit}
                        </div>
                    </div>
                ),
                sortValue: row => row.name,
            },
            {
                id: "onHand",
                header: t("analyticsOnHand"),
                cell: row => `${formatQty(row.onHandQty)} ${row.unit}`,
                sortValue: row => row.onHandQty,
                className: "whitespace-nowrap",
            },
            {
                id: "change24h",
                header: t("analyticsChange24h"),
                cell: row => (
                    <Change24h value={row.change24h} unit={row.unit} />
                ),
                sortValue: row => row.change24h,
                className: "whitespace-nowrap",
            },
            {
                id: "incoming",
                header: t("analyticsIncomingQty"),
                cell: row =>
                    row.incomingQty > 0
                        ? `${formatQty(row.incomingQty)} ${row.unit}`
                        : "—",
                sortValue: row => row.incomingQty,
                className: "whitespace-nowrap",
            },
            {
                id: "used",
                header: t("analyticsUsed"),
                cell: row => (
                    <div className="whitespace-nowrap">
                        <div className="text-foreground">
                            {formatQty(row.usedQty)} {row.unit}
                        </div>
                        <div className="text-[11px] text-slate-gray">
                            {formatEtb(row.usedValue)}
                        </div>
                    </div>
                ),
                sortValue: row => row.usedQty,
            },
            {
                id: "waste",
                header: t("analyticsWaste"),
                cell: row => `${formatQty(row.wasteQty)} ${row.unit}`,
                sortValue: row => row.wasteQty,
                className: "whitespace-nowrap",
            },
            {
                id: "trend",
                header: t("analyticsTrend"),
                cell: row => <ItemSparkline values={row.dailyUsed} />,
            },
            {
                id: "usedFor",
                header: t("analyticsWhereUsed"),
                cell: row =>
                    row.usedBy.length === 0 ? (
                        <span className="text-slate-gray">—</span>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {row.usedBy.slice(0, 3).map(u => (
                                <span
                                    key={u.label}
                                    className="rounded-md bg-surface-ivory px-1.5 py-0.5 text-[10px] text-slate-gray"
                                >
                                    {u.label} · {formatQty(u.qty)}
                                </span>
                            ))}
                            {row.usedBy.length > 3 && (
                                <span className="text-[10px] text-slate-gray">
                                    +{row.usedBy.length - 3}
                                </span>
                            )}
                        </div>
                    ),
                hideable: true,
                defaultHidden: true,
            },
        ],
        [t],
    );

    const trend = useMemo(() => {
        if (!analytics) return [];
        const max = Math.max(
            ...analytics.trend.map(d => Math.max(d.used, d.received)),
            0,
        );
        return analytics.trend.map(d => {
            const [y, m, day] = d.date.split("-").map(Number);
            const date = new Date(y, m - 1, day);
            return {
                ...d,
                label: String(day),
                dayName: date.toLocaleDateString(undefined, {
                    weekday: "short",
                }),
                usedPct: max > 0 ? (d.used / max) * 100 : 0,
                receivedPct: max > 0 ? (d.received / max) * 100 : 0,
            };
        });
    }, [analytics]);

    const daysCount = trend.length || 1;

    type DayItems = {
        items: {
            ingredientId: string;
            name: string;
            unit: string;
            qty: number;
        }[];
        extra: number;
    };

    const usedItemsByDay = useMemo<DayItems[]>(() => {
        if (!analytics) return [];
        return analytics.trend.map((_, i) => {
            const list = analytics.items
                .map(it => ({
                    ingredientId: it.ingredientId,
                    name: it.name,
                    unit: it.unit,
                    qty: it.dailyUsed[i] ?? 0,
                }))
                .filter(x => x.qty > 0)
                .sort((a, b) => b.qty - a.qty);
            return {
                items: list.slice(0, 6),
                extra: Math.max(0, list.length - 6),
            };
        });
    }, [analytics]);

    const receivedItemsByDay = useMemo<DayItems[]>(() => {
        if (!analytics) return [];
        return analytics.trend.map((_, i) => {
            const list = analytics.items
                .map(it => ({
                    ingredientId: it.ingredientId,
                    name: it.name,
                    unit: it.unit,
                    qty: it.dailyReceived[i] ?? 0,
                }))
                .filter(x => x.qty > 0)
                .sort((a, b) => b.qty - a.qty);
            return {
                items: list.slice(0, 6),
                extra: Math.max(0, list.length - 6),
            };
        });
    }, [analytics]);

    type MenuRow = {
        key: string;
        menuName: string;
        menuValue: number;
        ingredientId: string;
        ingredientName: string;
        unit: string;
        totalQty: number;
        value: number;
        daily: number[];
    };

    const menuRows = useMemo<MenuRow[]>(() => {
        const rows: MenuRow[] = [];
        for (const m of analytics?.menuItems ?? []) {
            for (const ing of m.ingredients) {
                rows.push({
                    key: `${m.name}|${ing.ingredientId}`,
                    menuName: m.name,
                    menuValue: m.value,
                    ingredientId: ing.ingredientId,
                    ingredientName: ing.name,
                    unit: ing.unit,
                    totalQty: ing.totalQty,
                    value: ing.value,
                    daily: ing.daily,
                });
            }
        }
        return rows;
    }, [analytics]);

    const menuColumns = useMemo<DataTableColumn<MenuRow>[]>(
        () => [
            {
                id: "menuName",
                header: t("analyticsMenuItems"),
                cell: row => (
                    <div>
                        <div className="font-medium text-foreground">
                            {row.menuName}
                        </div>
                        <div className="text-[11px] text-slate-gray">
                            {formatEtb(row.menuValue)}
                        </div>
                    </div>
                ),
                sortValue: row => row.menuName,
            },
            {
                id: "ingredient",
                header: t("analyticsIngredient"),
                cell: row => row.ingredientName,
                sortValue: row => row.ingredientName,
            },
            {
                id: "totalUsed",
                header: t("analyticsTotalUsed"),
                cell: row => `${formatQty(row.totalQty)} ${row.unit}`,
                sortValue: row => row.totalQty,
                className: "whitespace-nowrap",
            },
            {
                id: "avgPerDay",
                header: t("analyticsAvgPerDay"),
                cell: row =>
                    `${formatQty(row.totalQty / daysCount)} ${row.unit}`,
                sortValue: row => row.totalQty / daysCount,
                className: "whitespace-nowrap",
            },
            {
                id: "value",
                header: t("analyticsValue"),
                cell: row => formatEtb(row.value),
                sortValue: row => row.value,
                className: "whitespace-nowrap",
            },
            {
                id: "trend",
                header: t("analyticsTrend"),
                cell: row => <ItemSparkline values={row.daily} />,
            },
        ],
        [t, daysCount],
    );

    const pickRange = (r: BranchAnalyticsRange) => {
        setRange(r);
        setSelected(null);
        setMenuSelected(null);
        setPage(1);
        setMenuPage(1);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
                {RANGES.map(r => (
                    <button
                        key={r.key}
                        type="button"
                        onClick={() => pickRange(r.key)}
                        className={cn(
                            "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                            range === r.key
                                ? "bg-amber-600 text-white shadow-sm"
                                : "border border-hairline bg-surface-card text-slate-gray hover:text-foreground",
                        )}
                    >
                        {t(r.labelKey)}
                    </button>
                ))}
            </div>

            {isLoading && !analytics ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface-card py-16 text-sm text-slate-gray">
                    <Loader2 className="size-4 animate-spin" />
                    {t("analyticsLoading")}
                </div>
            ) : isError || !analytics ? (
                <div className="rounded-2xl border border-hairline bg-surface-card py-16 text-center text-sm text-slate-gray">
                    {t("analyticsError")}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <SummaryCard
                            icon={
                                <TrendingUp className="size-4 text-amber-600" />
                            }
                            title={t("analyticsUsed")}
                            value={formatEtb(analytics.summary.usedValue)}
                        />
                        <SummaryCard
                            icon={<Trash2 className="size-4 text-rose-500" />}
                            title={t("analyticsWaste")}
                            value={formatEtb(analytics.summary.wasteValue)}
                        />
                        <SummaryCard
                            icon={<Truck className="size-4 text-amber-600" />}
                            title={t("analyticsIncoming")}
                            value={String(analytics.summary.incomingCount)}
                        />
                        <SummaryCard
                            icon={
                                <UtensilsCrossed className="size-4 text-amber-600" />
                            }
                            title={t("analyticsStockValue")}
                            value={formatEtb(analytics.summary.stockValue)}
                            sub={
                                analytics.summary.lowStockCount > 0
                                    ? `${analytics.summary.lowStockCount} ${t("analyticsLowStock")}`
                                    : null
                            }
                        />
                    </div>

                    <div className="rounded-2xl border border-hairline bg-surface-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t("analyticsTrendTitle")}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-gray">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-amber-600" />
                                    {t("analyticsTrendUsed")}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    {t("analyticsReceived")}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 flex h-40 items-end gap-2">
                            {trend.length === 0 ? (
                                <div className="flex w-full items-center justify-center text-sm text-slate-gray">
                                    {t("analyticsUsageEmpty")}
                                </div>
                            ) : (
                                trend.map((d, i) => {
                                    const used = usedItemsByDay[i] ?? {
                                        items: [],
                                        extra: 0,
                                    };
                                    const received = receivedItemsByDay[i] ?? {
                                        items: [],
                                        extra: 0,
                                    };
                                    return (
                                        <div
                                            key={d.date}
                                            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                                        >
                                            <div className="group relative flex h-32 w-full items-end justify-center gap-1">
                                                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-xl border border-hairline bg-surface-card p-2.5 text-left shadow-lg group-hover:block">
                                                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">
                                                        {d.dayName} {d.label}
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-amber-700">
                                                        {t(
                                                            "analyticsTrendUsed",
                                                        )}
                                                    </div>
                                                    {used.items.length === 0 ? (
                                                        <div className="text-[11px] text-slate-gray">
                                                            —
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {used.items.map(
                                                                it => (
                                                                    <div
                                                                        key={
                                                                            it.ingredientId
                                                                        }
                                                                        className="flex items-center justify-between gap-3 text-[11px]"
                                                                    >
                                                                        <span className="truncate text-foreground">
                                                                            {
                                                                                it.name
                                                                            }
                                                                        </span>
                                                                        <span className="whitespace-nowrap text-slate-gray">
                                                                            {formatQty(
                                                                                it.qty,
                                                                            )}{" "}
                                                                            {
                                                                                it.unit
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                            {used.extra > 0 && (
                                                                <div className="text-[10px] text-slate-gray">
                                                                    +
                                                                    {used.extra}{" "}
                                                                    more
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    <div className="mt-1.5 text-[11px] font-semibold text-emerald-700">
                                                        {t("analyticsReceived")}
                                                    </div>
                                                    {received.items.length ===
                                                    0 ? (
                                                        <div className="text-[11px] text-slate-gray">
                                                            —
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {received.items.map(
                                                                it => (
                                                                    <div
                                                                        key={
                                                                            it.ingredientId
                                                                        }
                                                                        className="flex items-center justify-between gap-3 text-[11px]"
                                                                    >
                                                                        <span className="truncate text-foreground">
                                                                            {
                                                                                it.name
                                                                            }
                                                                        </span>
                                                                        <span className="whitespace-nowrap text-slate-gray">
                                                                            {formatQty(
                                                                                it.qty,
                                                                            )}{" "}
                                                                            {
                                                                                it.unit
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                            {received.extra >
                                                                0 && (
                                                                <div className="text-[10px] text-slate-gray">
                                                                    +
                                                                    {
                                                                        received.extra
                                                                    }{" "}
                                                                    more
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div
                                                    className="w-2.5 rounded-t bg-amber-600"
                                                    style={{
                                                        height: `${Math.max(d.usedPct, d.used > 0 ? 1.5 : 0)}%`,
                                                    }}
                                                />
                                                <div
                                                    className="w-2.5 rounded-t bg-emerald-500"
                                                    style={{
                                                        height: `${Math.max(d.receivedPct, d.received > 0 ? 1.5 : 0)}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center gap-1 leading-none">
                                                <span className="text-[10px] text-slate-gray">
                                                    {d.dayName}
                                                </span>
                                                <span className="text-[10px] text-slate-gray">
                                                    {d.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-surface-card p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Truck className="size-4 text-amber-600" />
                            {t("analyticsIncoming")}
                        </h3>
                        {analytics.incomingTransfers.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-gray">
                                {t("analyticsIncomingEmpty")}
                            </div>
                        ) : (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {analytics.incomingTransfers.map(tr => {
                                    const st = STATUS_STYLES[tr.status] ?? {
                                        label: tr.status,
                                        className:
                                            "bg-slate-200 text-slate-700",
                                    };
                                    return (
                                        <div
                                            key={tr.id}
                                            className="rounded-xl border border-hairline bg-canvas-cream p-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-slate-gray">
                                                    {tr.fromName ?? "—"}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                                                        st.className,
                                                    )}
                                                >
                                                    {st.label}
                                                </span>
                                            </div>
                                            {tr.sentAt && (
                                                <div className="mt-1 text-[11px] text-slate-gray">
                                                    {new Date(
                                                        tr.sentAt,
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                        },
                                                    )}{" "}
                                                    ·{" "}
                                                    {new Date(
                                                        tr.sentAt,
                                                    ).toLocaleTimeString(
                                                        undefined,
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="rounded-2xl border border-hairline bg-surface-card p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Boxes className="size-4 text-amber-600" />
                            {t("analyticsAllItems")}
                        </h3>
                        <div className="mt-3">
                            <DataTable
                                columns={columns}
                                data={analytics.items}
                                rowKey={row => row.ingredientId}
                                empty={t("analyticsUsageEmpty")}
                                searchPlaceholder={t("analyticsSearchItems")}
                                searchText={row =>
                                    `${row.name} ${row.unit} ${row.usedBy
                                        .map(u => u.label)
                                        .join(" ")}`
                                }
                                onRowClick={setSelected}
                                pagination={{
                                    page,
                                    totalPages: 1,
                                    total: analytics.items.length,
                                    limit: 15,
                                    onPageChange: setPage,
                                }}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-surface-card p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <UtensilsCrossed className="size-4 text-amber-600" />
                            {t("analyticsMenuItems")}
                        </h3>
                        <div className="mt-3">
                            <DataTable
                                columns={menuColumns}
                                data={menuRows}
                                rowKey={row => row.key}
                                empty={t("analyticsMenuEmpty")}
                                searchPlaceholder={t("analyticsMenuSearch")}
                                searchText={row =>
                                    `${row.menuName} ${row.ingredientName}`
                                }
                                onRowClick={row =>
                                    setMenuSelected(
                                        analytics.menuItems.find(
                                            m => m.name === row.menuName,
                                        ) ?? null,
                                    )
                                }
                                pagination={{
                                    page: menuPage,
                                    totalPages: 1,
                                    total: menuRows.length,
                                    limit: 15,
                                    onPageChange: setMenuPage,
                                }}
                            />
                        </div>
                    </div>
                </>
            )}

            {selected && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
                    <div className="my-8 w-full max-w-lg rounded-2xl border border-hairline bg-surface-card p-5 shadow-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    {selected.name}
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-gray">
                                    {t("analyticsWhereUsed")}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="rounded-lg p-1.5 text-slate-gray transition-colors hover:bg-surface-ivory hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <MiniStat
                                label={t("analyticsOnHand")}
                                value={`${formatQty(selected.onHandQty)} ${selected.unit}`}
                            />
                            <MiniStat
                                label={t("analyticsIncomingQty")}
                                value={`${formatQty(selected.incomingQty)} ${selected.unit}`}
                            />
                            <MiniStat
                                label={t("analyticsUsed")}
                                value={`${formatQty(selected.usedQty)} ${selected.unit}`}
                                sub={formatEtb(selected.usedValue)}
                            />
                            <MiniStat
                                label={t("analyticsWaste")}
                                value={`${formatQty(selected.wasteQty)} ${selected.unit}`}
                                sub={formatEtb(selected.wasteValue)}
                            />
                        </div>

                        <div className="mt-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-gray">
                                {t("analyticsWhereUsed")}
                            </h4>
                            {selected.usedBy.length === 0 ? (
                                <p className="mt-2 text-sm text-slate-gray">
                                    {t("analyticsNoBreakdown")}
                                </p>
                            ) : (
                                <ul className="mt-2 overflow-hidden rounded-xl border border-hairline">
                                    {selected.usedBy.map(u => (
                                        <li
                                            key={u.label}
                                            className="flex items-center justify-between gap-2 border-t border-hairline bg-canvas-cream px-3 py-2 text-sm first:border-t-0"
                                        >
                                            <span className="text-foreground">
                                                {u.label}
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {formatQty(u.qty)}{" "}
                                                {selected.unit}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {menuSelected && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
                    <div className="my-8 w-full max-w-3xl rounded-2xl border border-hairline bg-surface-card p-5 shadow-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    {menuSelected.name}
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-gray">
                                    {t("analyticsValue")}:{" "}
                                    {formatEtb(menuSelected.value)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMenuSelected(null)}
                                className="rounded-lg p-1.5 text-slate-gray transition-colors hover:bg-surface-ivory hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-hairline text-left">
                                        <th className="sticky left-0 bg-surface-card py-2 pr-3 font-medium whitespace-nowrap">
                                            {t("analyticsIngredient")}
                                        </th>
                                        {trend.map(d => (
                                            <th
                                                key={d.date}
                                                title={d.date}
                                                className="px-1.5 text-center text-[10px] font-normal text-slate-gray"
                                            >
                                                {d.label}
                                            </th>
                                        ))}
                                        <th className="py-2 pl-3 text-right font-medium whitespace-nowrap">
                                            {t("analyticsTotal")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuSelected.ingredients.map(ing => (
                                        <tr
                                            key={ing.ingredientId}
                                            className="border-b border-hairline last:border-b-0"
                                        >
                                            <td className="sticky left-0 bg-surface-card py-1.5 pr-3 font-medium whitespace-nowrap">
                                                {ing.name}{" "}
                                                <span className="text-slate-gray">
                                                    ({ing.unit})
                                                </span>
                                            </td>
                                            {ing.daily.map((v, i) => (
                                                <td
                                                    key={i}
                                                    className="px-1.5 py-1.5 text-center whitespace-nowrap"
                                                >
                                                    {v > 0 ? (
                                                        formatQty(v)
                                                    ) : (
                                                        <span className="text-slate-gray">
                                                            ·
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="py-1.5 pl-3 text-right font-semibold whitespace-nowrap">
                                                {formatQty(ing.totalQty)}{" "}
                                                {ing.unit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
