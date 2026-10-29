"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    ArrowDownToLine,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    FileText,
    Filter,
    Image as ImageIcon,
    Inbox,
    Loader2,
    Phone,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Sprout,
    Store,
    X,
} from "lucide-react";
import {
    useListInventoryLedgerQuery,
    type InventoryLedgerRow,
} from "@/context/services/inventoryApi";
import { parseReceiveDetails } from "@/domains/inventory/ui/ReceiveStockSheet";
import { formatEtb, formatQty } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface ReceiveHistoryViewProps {
    locationId?: string;
    stockTargetName?: string;
    onOpenReceiveSheet: () => void;
}

export function ReceiveHistoryView({
    locationId,
    stockTargetName,
    onOpenReceiveSheet,
}: ReceiveHistoryViewProps) {
    const t = useTranslations("inventory");
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState<"ALL" | "FARM" | "NEGADE">(
        "ALL",
    );
    const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(
        null,
    );

    const {
        data: ledgerRes,
        isLoading,
        isFetching,
        refetch,
    } = useListInventoryLedgerQuery({
        page,
        limit: 15,
        type: "RECEIVE",
        ...(locationId ? { locationId } : {}),
        q: searchQuery.trim() || undefined,
    });

    const entries = ledgerRes?.data ?? [];
    const meta = ledgerRes?.meta;

    // Filter by source type locally if needed
    const filteredEntries = useMemo(() => {
        if (sourceFilter === "ALL") return entries;
        return entries.filter(e => {
            const source =
                e.vendor?.type ??
                parseReceiveDetails(e.supplierNote, e.note).source;
            return source === sourceFilter;
        });
    }, [entries, sourceFilter]);

    // Calculate total value of deliveries in current view
    const pageTotalValue = useMemo(() => {
        return filteredEntries.reduce((sum, row) => {
            const cost = Number(row.unitCostSnapshot) || 0;
            const qty = Number(row.quantityDelta) || 0;
            const lineVal =
                row.lineValue != null ? Number(row.lineValue) : qty * cost;
            return sum + (lineVal > 0 ? lineVal : 0);
        }, 0);
    }, [filteredEntries]);

    function formatDateTime(dateStr?: string) {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <div className="space-y-4">
            {/* 1. TOP SUMMARY CARD & ACTION BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-hairline bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3.5">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <ArrowDownToLine className="size-5" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-foreground">
                                {t("receiveSummaryTitle")}
                            </h3>
                            {stockTargetName ? (
                                <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-gray">
                                    {stockTargetName}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {stockTargetName
                                ? t("receiveSummarySub", {
                                      name: stockTargetName,
                                  })
                                : t("receiveSheetSubtitle")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onOpenReceiveSheet}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
                    >
                        <Plus className="size-4" />
                        <span>{t("receiveStockButton")}</span>
                    </button>
                </div>
            </div>

            {/* 2. FILTER & STATS BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-hairline bg-card/60 p-3">
                {/* Search & Source filter */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-gray" />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 w-full rounded-lg border border-hairline bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-slate-gray focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-gray hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        ) : null}
                    </div>

                    {/* Source filter buttons */}
                    <div className="flex items-center gap-1 rounded-lg border border-hairline bg-background p-1 text-[11px]">
                        <button
                            type="button"
                            onClick={() => setSourceFilter("ALL")}
                            className={cn(
                                "rounded-md px-2.5 py-1 font-medium transition-colors",
                                sourceFilter === "ALL"
                                    ? "bg-secondary text-foreground font-semibold"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {t("sourceAll")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSourceFilter("FARM")}
                            className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors",
                                sourceFilter === "FARM"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Sprout className="size-3" />
                            <span>{t("sourceFarm")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSourceFilter("NEGADE")}
                            className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors",
                                sourceFilter === "NEGADE"
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Store className="size-3" />
                            <span>{t("sourceNegade")}</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex size-9 items-center justify-center rounded-lg border border-hairline bg-background text-slate-gray hover:bg-secondary hover:text-foreground"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin text-emerald-600",
                            )}
                        />
                    </button>
                </div>

                {/* KPI metrics in current view */}
                <div className="flex items-center gap-4 text-[12px] text-slate-gray">
                    <span>
                        {t("colLines")}:{" "}
                        <strong className="text-foreground font-semibold">
                            {meta?.total ?? entries.length}
                        </strong>
                    </span>
                    <span>•</span>
                    <span>
                        {t("colValue")}:{" "}
                        <strong className="text-foreground font-semibold">
                            {formatEtb(pageTotalValue)}
                        </strong>
                    </span>
                </div>
            </div>

            {/* 3. RECEIVING HISTORY TABLE */}
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-[12px]">
                        <thead>
                            <tr className="border-b border-hairline bg-secondary/40 text-[11px] font-semibold text-slate-gray">
                                <th className="px-4 py-3">{t("colWhen")}</th>
                                <th className="px-4 py-3">
                                    {t("colIngredient")}
                                </th>
                                <th className="px-4 py-3">{t("colSource")}</th>
                                <th className="px-4 py-3 text-right">
                                    {t("fieldQuantity")}
                                </th>
                                <th className="px-4 py-3 text-right">
                                    {t("colCost")}
                                </th>
                                <th className="px-4 py-3 text-right">
                                    {t("colValue")}
                                </th>
                                <th className="px-4 py-3 text-center">
                                    {t("colReceipt")}
                                </th>
                                <th className="px-4 py-3">
                                    {t("fieldSupplierNote")}
                                </th>
                                <th className="px-4 py-3">
                                    {t("colRecordedBy")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="py-12 text-center text-slate-gray"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="size-6 animate-spin text-emerald-600" />
                                            <span>{t("loadingSupply")}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="py-14 text-center"
                                    >
                                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-slate-gray mb-3">
                                                <Inbox className="size-6" />
                                            </div>
                                            <h4 className="text-[14px] font-semibold text-foreground">
                                                {t("emptyReceiveHistory")}
                                            </h4>
                                            <p className="mt-1 text-[12px] text-slate-gray">
                                                {t("emptyReceiveHistorySub")}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={onOpenReceiveSheet}
                                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>
                                                    {t("receiveStockNow")}
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map(
                                    (row: InventoryLedgerRow) => {
                                        const {
                                            source: legacySource,
                                            cleanSupplier,
                                            receiptUrl,
                                            cleanNote,
                                        } = parseReceiveDetails(
                                            row.supplierNote,
                                            row.note,
                                        );
                                        const vendorType =
                                            row.vendor?.type ?? legacySource;
                                        const qty =
                                            Number(row.quantityDelta) || 0;
                                        const unitCost =
                                            Number(row.unitCostSnapshot) || 0;
                                        const lineVal =
                                            row.lineValue != null
                                                ? Number(row.lineValue)
                                                : qty * unitCost;

                                        return (
                                            <tr
                                                key={row.id}
                                                className="transition-colors hover:bg-secondary/20"
                                            >
                                                {/* Date / Time */}
                                                <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-gray">
                                                    {formatDateTime(
                                                        row.createdAt,
                                                    )}
                                                </td>

                                                {/* Ingredient */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-secondary text-slate-gray">
                                                            <ImageIcon className="size-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-foreground">
                                                                {row.ingredient
                                                                    ?.name ||
                                                                    "—"}
                                                            </span>
                                                            <span className="ml-1.5 text-[11px] text-slate-gray">
                                                                (
                                                                {row.ingredient
                                                                    ?.unit ||
                                                                    "unit"}
                                                                )
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Source Badge */}
                                                <td className="px-4 py-3">
                                                    {vendorType === "FARM" ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <Sprout className="size-3 shrink-0" />
                                                            <span
                                                                className="max-w-[140px] truncate"
                                                                title={
                                                                    row.vendor
                                                                        ?.name
                                                                }
                                                            >
                                                                {row.vendor
                                                                    ?.name ??
                                                                    t(
                                                                        "sourceFarmBadge",
                                                                    )}
                                                            </span>
                                                        </span>
                                                    ) : vendorType ===
                                                      "NEGADE" ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                                            <Store className="size-3 shrink-0" />
                                                            <span
                                                                className="max-w-[140px] truncate"
                                                                title={
                                                                    row.vendor
                                                                        ?.name
                                                                }
                                                            >
                                                                {row.vendor
                                                                    ?.name ??
                                                                    t(
                                                                        "sourceNegadeBadge",
                                                                    )}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-slate-gray">
                                                            {row.vendor
                                                                ?.type ===
                                                            "OTHER" ? (
                                                                <>
                                                                    <Store className="size-3 shrink-0" />
                                                                    <span
                                                                        className="max-w-[140px] truncate"
                                                                        title={
                                                                            row
                                                                                .vendor
                                                                                .name
                                                                        }
                                                                    >
                                                                        {
                                                                            row
                                                                                .vendor
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                t("sourceOther")
                                                            )}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Quantity */}
                                                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                    +{formatQty(qty)}{" "}
                                                    {row.ingredient?.unit}
                                                </td>

                                                {/* Unit Cost */}
                                                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-gray">
                                                    {unitCost > 0
                                                        ? formatEtb(unitCost)
                                                        : "—"}
                                                </td>

                                                {/* Total Value */}
                                                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-foreground">
                                                    {lineVal > 0
                                                        ? formatEtb(lineVal)
                                                        : "—"}
                                                </td>

                                                {/* Receipt Photo */}
                                                <td className="whitespace-nowrap px-4 py-3 text-center">
                                                    {receiptUrl ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewReceiptUrl(
                                                                    receiptUrl,
                                                                )
                                                            }
                                                            className="group inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-secondary/50 px-2 py-1 text-[11px] font-medium text-foreground transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600"
                                                        >
                                                            <img
                                                                src={receiptUrl}
                                                                alt="Receipt"
                                                                className="size-4 rounded object-cover"
                                                            />
                                                            <span>
                                                                {t(
                                                                    "colReceipt",
                                                                )}
                                                            </span>
                                                            <ExternalLink className="size-2.5 opacity-60 group-hover:opacity-100" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-gray/50">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Supplier Note & Invoice Ref */}
                                                <td className="px-4 py-3">
                                                    <div className="max-w-[200px]">
                                                        {row.vendor ? (
                                                            <>
                                                                <p
                                                                    className="font-medium text-foreground truncate"
                                                                    title={
                                                                        row
                                                                            .vendor
                                                                            .name
                                                                    }
                                                                >
                                                                    {
                                                                        row
                                                                            .vendor
                                                                            .name
                                                                    }
                                                                </p>
                                                                {row.vendor
                                                                    .phone ? (
                                                                    <p
                                                                        className="flex items-center gap-1 text-[11px] text-slate-gray truncate"
                                                                        title={
                                                                            row
                                                                                .vendor
                                                                                .phone
                                                                        }
                                                                    >
                                                                        <Phone className="size-3 shrink-0" />
                                                                        <span>
                                                                            {
                                                                                row
                                                                                    .vendor
                                                                                    .phone
                                                                            }
                                                                        </span>
                                                                    </p>
                                                                ) : null}
                                                            </>
                                                        ) : cleanSupplier ? (
                                                            <p
                                                                className="font-medium text-foreground truncate"
                                                                title={
                                                                    cleanSupplier
                                                                }
                                                            >
                                                                {cleanSupplier}
                                                            </p>
                                                        ) : null}
                                                        {row.invoiceRef ? (
                                                            <span className="font-mono text-[10px] text-slate-gray bg-secondary/60 rounded px-1.5 py-0.5">
                                                                {t(
                                                                    "fieldInvoiceRef",
                                                                )}
                                                                :{" "}
                                                                {row.invoiceRef}
                                                            </span>
                                                        ) : null}
                                                        {!row.vendor &&
                                                        cleanNote &&
                                                        !cleanSupplier ? (
                                                            <p
                                                                className="text-[11px] text-slate-gray truncate"
                                                                title={
                                                                    cleanNote
                                                                }
                                                            >
                                                                {cleanNote}
                                                            </p>
                                                        ) : null}
                                                        {!row.vendor &&
                                                        !cleanSupplier &&
                                                        !row.invoiceRef &&
                                                        !cleanNote ? (
                                                            <span className="text-[11px] text-slate-gray/50">
                                                                —
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>

                                                {/* Received By */}
                                                <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-gray">
                                                    {row.createdByName || "—"}
                                                </td>
                                            </tr>
                                        );
                                    },
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {meta && meta.totalPages > 1 ? (
                    <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-[12px] text-slate-gray">
                        <span>
                            {t("pageMeta", {
                                page: meta.page,
                                totalPages: meta.totalPages,
                                total: meta.total,
                            })}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={meta.page <= 1 || isFetching}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="flex size-8 items-center justify-center rounded-lg border border-hairline bg-background text-foreground hover:bg-secondary disabled:opacity-40"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <button
                                type="button"
                                disabled={
                                    meta.page >= meta.totalPages || isFetching
                                }
                                onClick={() => setPage(p => p + 1)}
                                className="flex size-8 items-center justify-center rounded-lg border border-hairline bg-background text-foreground hover:bg-secondary disabled:opacity-40"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Full-screen Receipt Image Preview Modal */}
            {previewReceiptUrl ? (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setPreviewReceiptUrl(null)}
                >
                    <div
                        className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-hairline bg-background p-3 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-hairline pb-2 mb-2">
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                                <Receipt className="size-4 text-emerald-600" />
                                <span>{t("receiptPhotoModalTitle")}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewReceiptUrl(null)}
                                className="rounded-full p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <img
                            src={previewReceiptUrl}
                            alt="Receipt preview"
                            className="max-h-[80vh] w-full rounded-xl object-contain"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
