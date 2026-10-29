"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
    ArrowDownCircle,
    Boxes,
    Building2,
    ClipboardList,
    Inbox,
    Loader2,
    Send,
    Store,
    Trash2,
    Truck,
    X,
} from "lucide-react";
import { formatEtb, formatQty } from "@/lib/money";
import { cn } from "@/lib/utils";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import {
    useGetCentralAnalyticsQuery,
    type BranchAnalyticsRange,
    type CentralAnalyticsItem,
} from "@/context/services/inventoryApi";

const RANGES: { key: BranchAnalyticsRange; labelKey: string }[] = [
    { key: "today", labelKey: "analyticsRangeToday" },
    { key: "week", labelKey: "analyticsRangeWeek" },
    { key: "month", labelKey: "analyticsRangeMonth" },
];

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
    value: ReactNode;
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

type FlowRow = {
    key: string;
    name: string;
    qty: number;
    value: number;
    daily: number[];
};

export default function InventoryCentralAnalyticsBoard() {
    const t = useTranslations("inventory");
    const [range, setRange] = useState<BranchAnalyticsRange>("today");
    const [selected, setSelected] = useState<CentralAnalyticsItem | null>(null);
    const [page, setPage] = useState(1);
    const [branchPage, setBranchPage] = useState(1);
    const [vendorPage, setVendorPage] = useState(1);
    const { data, isLoading, isError } = useGetCentralAnalyticsQuery({ range });

    const analytics = data?.data;

    const daysCount = analytics?.trend.length || 1;

    const itemColumns = useMemo<DataTableColumn<CentralAnalyticsItem>[]>(
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
                id: "received",
                header: t("centralReceived"),
                cell: row =>
                    row.receivedQty > 0 ? (
                        <div className="whitespace-nowrap">
                            <div className="text-foreground">
                                {formatQty(row.receivedQty)} {row.unit}
                            </div>
                            <div className="text-[11px] text-slate-gray">
                                {formatEtb(row.receivedValue)}
                            </div>
                        </div>
                    ) : (
                        "—"
                    ),
                sortValue: row => row.receivedQty,
            },
            {
                id: "sent",
                header: t("centralSent"),
                cell: row =>
                    row.sentQty > 0 ? (
                        <div className="whitespace-nowrap">
                            <div className="text-foreground">
                                {formatQty(row.sentQty)} {row.unit}
                            </div>
                            <div className="text-[11px] text-slate-gray">
                                {formatEtb(row.sentValue)}
                            </div>
                        </div>
                    ) : (
                        "—"
                    ),
                sortValue: row => row.sentQty,
            },
            {
                id: "waste",
                header: t("analyticsWaste"),
                cell: row =>
                    row.wasteQty > 0
                        ? `${formatQty(row.wasteQty)} ${row.unit}`
                        : "—",
                sortValue: row => row.wasteQty,
                className: "whitespace-nowrap",
            },
            {
                id: "trend",
                header: t("analyticsTrend"),
                cell: row => <ItemSparkline values={row.dailySent} />,
            },
        ],
        [t],
    );

    const flowColumns = useMemo<DataTableColumn<FlowRow>[]>(
        () => [
            {
                id: "name",
                header: t("centralBranch"),
                cell: row => (
                    <div className="font-medium text-foreground">
                        {row.name}
                    </div>
                ),
                sortValue: row => row.name,
            },
            {
                id: "qty",
                header: t("centralQty"),
                cell: row => formatQty(row.qty),
                sortValue: row => row.qty,
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
                id: "avgPerDay",
                header: t("analyticsAvgPerDay"),
                cell: row => formatQty(row.qty / daysCount),
                sortValue: row => row.qty / daysCount,
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

    const vendorColumns = useMemo<DataTableColumn<FlowRow>[]>(
        () => [
            {
                id: "name",
                header: t("centralVendor"),
                cell: row => (
                    <div className="font-medium text-foreground">
                        {row.name}
                    </div>
                ),
                sortValue: row => row.name,
            },
            {
                id: "qty",
                header: t("centralQty"),
                cell: row => formatQty(row.qty),
                sortValue: row => row.qty,
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
                id: "avgPerDay",
                header: t("analyticsAvgPerDay"),
                cell: row => formatQty(row.qty / daysCount),
                sortValue: row => row.qty / daysCount,
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

    const trend = useMemo(() => {
        if (!analytics) return [];
        const max = Math.max(
            ...analytics.trend.map(d => Math.max(d.received, d.sent)),
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
                receivedPct: max > 0 ? (d.received / max) * 100 : 0,
                sentPct: max > 0 ? (d.sent / max) * 100 : 0,
            };
        });
    }, [analytics]);

    type DayItems = {
        items: {
            ingredientId: string;
            name: string;
            unit: string;
            qty: number;
        }[];
        extra: number;
    };

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

    const sentItemsByDay = useMemo<DayItems[]>(() => {
        if (!analytics) return [];
        return analytics.trend.map((_, i) => {
            const list = analytics.items
                .map(it => ({
                    ingredientId: it.ingredientId,
                    name: it.name,
                    unit: it.unit,
                    qty: it.dailySent[i] ?? 0,
                }))
                .filter(x => x.qty > 0)
                .sort((a, b) => b.qty - a.qty);
            return {
                items: list.slice(0, 6),
                extra: Math.max(0, list.length - 6),
            };
        });
    }, [analytics]);

    const branchRows = useMemo<FlowRow[]>(
        () =>
            (analytics?.sentPerBranch ?? []).map(b => ({
                key: b.branchName,
                name: b.branchName,
                qty: b.qty,
                value: b.value,
                daily: b.daily,
            })),
        [analytics],
    );

    const vendorRows = useMemo<FlowRow[]>(
        () =>
            (analytics?.receivedPerVendor ?? []).map(v => ({
                key: v.vendorName,
                name: v.vendorName,
                qty: v.qty,
                value: v.value,
                daily: v.daily,
            })),
        [analytics],
    );

    const pickRange = (r: BranchAnalyticsRange) => {
        setRange(r);
        setSelected(null);
        setPage(1);
        setBranchPage(1);
        setVendorPage(1);
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
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <SummaryCard
                            icon={
                                <ArrowDownCircle className="size-4 text-emerald-600" />
                            }
                            title={t("centralReceived")}
                            value={formatEtb(analytics.summary.receivedValue)}
                        />
                        <SummaryCard
                            icon={<Send className="size-4 text-amber-600" />}
                            title={t("centralSent")}
                            value={formatEtb(analytics.summary.sentValue)}
                        />
                        <SummaryCard
                            icon={<Truck className="size-4 text-cyan-700" />}
                            title={t("centralInTransit")}
                            value={String(analytics.summary.inTransit)}
                        />
                        <SummaryCard
                            icon={<Inbox className="size-4 text-amber-600" />}
                            title={t("centralPendingAsks")}
                            value={String(analytics.summary.pendingRequests)}
                        />
                        <SummaryCard
                            icon={<Boxes className="size-4 text-amber-600" />}
                            title={t("analyticsStockValue")}
                            value={formatEtb(analytics.summary.stockValue)}
                            sub={
                                analytics.summary.lowStockCount > 0
                                    ? `${analytics.summary.lowStockCount} ${t("analyticsLowStock")}`
                                    : null
                            }
                        />
                        <SummaryCard
                            icon={<Trash2 className="size-4 text-rose-500" />}
                            title={t("analyticsWaste")}
                            value={formatEtb(analytics.summary.wasteValue)}
                        />
                    </div>

                    <div className="rounded-2xl border border-hairline bg-surface-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t("centralTrendTitle")}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-gray">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    {t("analyticsReceived")}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-amber-600" />
                                    {t("centralTrendSent")}
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
                                    const received = receivedItemsByDay[i] ?? {
                                        items: [],
                                        extra: 0,
                                    };
                                    const sent = sentItemsByDay[i] ?? {
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
                                                    <div className="text-[11px] font-semibold text-emerald-700">
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
                                                    <div className="mt-1.5 text-[11px] font-semibold text-amber-700">
                                                        {t("centralTrendSent")}
                                                    </div>
                                                    {sent.items.length === 0 ? (
                                                        <div className="text-[11px] text-slate-gray">
                                                            —
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {sent.items.map(
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
                                                            {sent.extra > 0 && (
                                                                <div className="text-[10px] text-slate-gray">
                                                                    +
                                                                    {sent.extra}{" "}
                                                                    more
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div
                                                    className="w-2.5 rounded-t bg-emerald-500"
                                                    style={{
                                                        height: `${Math.max(d.receivedPct, d.received > 0 ? 1.5 : 0)}%`,
                                                    }}
                                                />
                                                <div
                                                    className="w-2.5 rounded-t bg-amber-600"
                                                    style={{
                                                        height: `${Math.max(d.sentPct, d.sent > 0 ? 1.5 : 0)}%`,
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
                            <Store className="size-4 text-amber-600" />
                            {t("centralSentPerBranch")}
                        </h3>
                        <div className="mt-3">
                            <DataTable
                                columns={flowColumns}
                                data={branchRows}
                                rowKey={row => row.key}
                                empty={t("centralSentEmpty")}
                                searchPlaceholder={t("analyticsSearchItems")}
                                searchText={row => row.name}
                                pagination={{
                                    page: branchPage,
                                    totalPages: 1,
                                    total: branchRows.length,
                                    limit: 10,
                                    onPageChange: setBranchPage,
                                }}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-surface-card p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Building2 className="size-4 text-emerald-600" />
                            {t("centralReceivedPerVendor")}
                        </h3>
                        <div className="mt-3">
                            <DataTable
                                columns={vendorColumns}
                                data={vendorRows}
                                rowKey={row => row.key}
                                empty={t("centralReceivedEmpty")}
                                searchPlaceholder={t("analyticsSearchItems")}
                                searchText={row => row.name}
                                pagination={{
                                    page: vendorPage,
                                    totalPages: 1,
                                    total: vendorRows.length,
                                    limit: 10,
                                    onPageChange: setVendorPage,
                                }}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-surface-card p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Boxes className="size-4 text-amber-600" />
                            {t("centralItemsTitle")}
                        </h3>
                        <div className="mt-3">
                            <DataTable
                                columns={itemColumns}
                                data={analytics.items}
                                rowKey={row => row.ingredientId}
                                empty={t("centralItemsEmpty")}
                                searchPlaceholder={t("analyticsSearchItems")}
                                searchText={row => `${row.name} ${row.unit}`}
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
                            <ClipboardList className="size-4 text-amber-600" />
                            {t("centralRequestsTitle")}
                        </h3>
                        {analytics.pendingRequests.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-gray">
                                {t("centralRequestsEmpty")}
                            </div>
                        ) : (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {analytics.pendingRequests.map(req => (
                                    <div
                                        key={req.id}
                                        className="rounded-xl border border-hairline bg-canvas-cream p-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-foreground">
                                                {req.fromName ?? "—"}
                                            </span>
                                            <span className="text-[11px] text-slate-gray">
                                                {new Date(
                                                    req.requestedAt,
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    },
                                                )}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {req.lines.map(line => (
                                                <span
                                                    key={line.ingredientId}
                                                    className="rounded-md bg-surface-ivory px-1.5 py-0.5 text-[10px] text-slate-gray"
                                                >
                                                    {line.name} ·{" "}
                                                    {formatQty(
                                                        line.quantityRequested,
                                                    )}{" "}
                                                    {line.unit}
                                                </span>
                                            ))}
                                        </div>
                                        {req.note ? (
                                            <div className="mt-2 text-[11px] text-slate-gray">
                                                {req.note}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
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
                                    {selected.unit}
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
                                label={t("analyticsChange24h")}
                                value={
                                    <Change24h
                                        value={selected.change24h}
                                        unit={selected.unit}
                                    />
                                }
                            />
                            <MiniStat
                                label={t("centralReceived")}
                                value={`${formatQty(selected.receivedQty)} ${selected.unit}`}
                                sub={formatEtb(selected.receivedValue)}
                            />
                            <MiniStat
                                label={t("centralSent")}
                                value={`${formatQty(selected.sentQty)} ${selected.unit}`}
                                sub={formatEtb(selected.sentValue)}
                            />
                            <MiniStat
                                label={t("analyticsWaste")}
                                value={`${formatQty(selected.wasteQty)} ${selected.unit}`}
                                sub={formatEtb(selected.wasteValue)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
