"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
    useGetFinanceInventoryItemUsageQuery,
    useGetFinanceInventoryItemsQuery,
    type FinanceAudience,
    type FinanceIngredientMovementRow,
    type FinancePeriod,
} from "../financeApi";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

function formatStockQty(value: number) {
    return (Math.round(value * 10000) / 10000).toLocaleString("en-US", {
        maximumFractionDigits: 4,
    });
}

type DrillContext = {
    audience: FinanceAudience;
    period?: FinancePeriod;
    date?: string;
    branchId?: string;
};

function IngredientRow({
    row,
    context,
}: {
    row: FinanceIngredientMovementRow;
    context: DrillContext;
}) {
    const t = useTranslations("financeSummary");
    const [open, setOpen] = useState(false);

    const { data, isFetching } = useGetFinanceInventoryItemUsageQuery(
        {
            audience: context.audience,
            ingredientId: row.ingredientId,
            ...(context.period ? { period: context.period } : {}),
            ...(context.date ? { date: context.date } : {}),
            ...(context.branchId ? { branchId: context.branchId } : {}),
        },
        { skip: !open },
    );

    const usage = data?.data;

    return (
        <>
            <tr
                onClick={() => setOpen(value => !value)}
                className={cn(
                    "cursor-pointer border-b border-hairline transition-colors hover:bg-secondary/40",
                    open && "bg-secondary/40",
                )}
            >
                <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <ChevronDown
                            className={cn(
                                "size-3.5 text-slate-gray transition-transform",
                                open && "rotate-180",
                            )}
                        />
                        {row.name}
                    </span>
                    <span className="ml-5 text-[11px] text-slate-gray">
                        {row.unit}
                    </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-gray">
                    {formatStockQty(row.openingQty)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">
                    {row.receivedQty
                        ? `+${formatStockQty(row.receivedQty)}`
                        : "—"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                    {row.consumedQty ? formatStockQty(row.consumedQty) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-gray">
                    {row.wasteQty ? formatStockQty(row.wasteQty) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                    {formatStockQty(row.closingQty)}
                </td>
            </tr>
            {open ? (
                <tr className="border-b border-hairline bg-secondary/20">
                    <td colSpan={6} className="px-4 py-4">
                        {isFetching && !usage ? (
                            <p className="flex items-center gap-2 py-4 text-[13px] text-slate-gray">
                                <Loader2 className="size-3.5 animate-spin" />
                                {t("loading")}
                            </p>
                        ) : usage ? (
                            <div className="space-y-4">
                                <p className="rounded-xl border border-hairline bg-background/60 px-3 py-2.5 text-[12px] tabular-nums text-slate-gray">
                                    {t("invItemBridge", {
                                        opening: `${formatStockQty(usage.openingQty)} ${usage.unit}`,
                                        received: `+${formatStockQty(usage.receivedQty)}`,
                                        other: formatStockQty(
                                            usage.transfersNetQty +
                                                usage.adjustedQty +
                                                usage.otherQty,
                                        ),
                                        consumed: `−${formatStockQty(usage.consumedQty)}`,
                                        waste: `−${formatStockQty(usage.wasteQty)}`,
                                        closing: `${formatStockQty(usage.closingQty)} ${usage.unit}`,
                                    })}
                                </p>

                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-slate-gray">
                                    <span>
                                        {t("invItemOpeningValue")}:{" "}
                                        <span className="tabular-nums text-foreground">
                                            {formatEtb(
                                                Number(usage.openingValue),
                                            )}
                                        </span>
                                    </span>
                                    <span>
                                        {t("invItemClosingValue")}:{" "}
                                        <span className="tabular-nums text-foreground">
                                            {formatEtb(
                                                Number(usage.closingValue),
                                            )}
                                        </span>
                                    </span>
                                    <span>
                                        {t("invItemConsumedValue")}:{" "}
                                        <span className="tabular-nums text-foreground">
                                            {formatEtb(
                                                Number(usage.consumedValue),
                                            )}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-2">
                                    <div className="rounded-xl border border-hairline bg-card p-3">
                                        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-slate-gray">
                                            {t("invItemSpentOn")}
                                        </p>
                                        {usage.byMenu.length === 0 ? (
                                            <p className="mt-4 text-center text-[13px] text-slate-gray">
                                                {t("invNoData")}
                                            </p>
                                        ) : (
                                            <ul className="mt-2 space-y-1.5">
                                                {usage.byMenu.map(item => (
                                                    <li
                                                        key={
                                                            item.menuItemId ??
                                                            item.menuItemName
                                                        }
                                                        className="flex items-center justify-between gap-3 text-[13px]"
                                                    >
                                                        <span className="min-w-0 truncate text-foreground">
                                                            {item.menuItemName}
                                                            <span className="ml-1.5 text-[11px] text-slate-gray">
                                                                {t(
                                                                    "invItemPlates",
                                                                    {
                                                                        count: item.plateCount,
                                                                    },
                                                                )}
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 tabular-nums text-foreground">
                                                            {formatStockQty(
                                                                item.qtyConsumed,
                                                            )}{" "}
                                                            {usage.unit}
                                                            <span className="ml-1.5 text-[11px] text-slate-gray">
                                                                {item.share}%
                                                            </span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-hairline bg-card p-3">
                                        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-slate-gray">
                                            {t("invItemReceivedFrom")}
                                        </p>
                                        {usage.receivedByVendor.length === 0 ? (
                                            <p className="mt-4 text-center text-[13px] text-slate-gray">
                                                {t("invNoData")}
                                            </p>
                                        ) : (
                                            <ul className="mt-2 space-y-1.5">
                                                {usage.receivedByVendor.map(
                                                    vendor => (
                                                        <li
                                                            key={
                                                                vendor.vendorId ??
                                                                vendor.vendorName
                                                            }
                                                            className="flex items-center justify-between gap-3 text-[13px]"
                                                        >
                                                            <span className="min-w-0 truncate text-foreground">
                                                                {
                                                                    vendor.vendorName
                                                                }
                                                            </span>
                                                            <span className="shrink-0 tabular-nums text-foreground">
                                                                {formatStockQty(
                                                                    vendor.qty,
                                                                )}{" "}
                                                                {usage.unit}
                                                                <span className="ml-1.5 text-[11px] text-slate-gray">
                                                                    {formatEtb(
                                                                        Number(
                                                                            vendor.amount,
                                                                        ),
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="py-4 text-center text-[13px] text-slate-gray">
                                {t("empty")}
                            </p>
                        )}
                    </td>
                </tr>
            ) : null}
        </>
    );
}

export default function IngredientStockPanel({
    audience,
    period,
    date,
    branchId,
}: DrillContext) {
    const t = useTranslations("financeSummary");

    const { data, isLoading } = useGetFinanceInventoryItemsQuery({
        audience,
        ...(period ? { period } : {}),
        ...(date ? { date } : {}),
        ...(branchId ? { branchId } : {}),
    });

    const rows = data?.data ?? [];
    const context: DrillContext = { audience, period, date, branchId };

    return (
        <div className="border-t border-hairline pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-[13px] font-semibold tracking-tight text-foreground">
                    {t("invItemsTitle")}
                </h4>
                {data ? (
                    <span className="text-[11px] tabular-nums text-slate-gray">
                        {data.from} – {data.to}
                    </span>
                ) : null}
            </div>

            {isLoading ? (
                <p className="flex items-center justify-center gap-2 py-8 text-[13px] text-slate-gray">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t("loading")}
                </p>
            ) : rows.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-slate-gray">
                    {t("invNoData")}
                </p>
            ) : (
                <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-[13px]">
                        <thead>
                            <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-[0.06em] text-slate-gray">
                                <th className="px-4 py-2.5 font-medium">
                                    {t("invItemsIngredient")}
                                </th>
                                <th className="px-4 py-2.5 text-right font-medium">
                                    {t("invItemsOpening")}
                                </th>
                                <th className="px-4 py-2.5 text-right font-medium">
                                    {t("invItemsReceived")}
                                </th>
                                <th className="px-4 py-2.5 text-right font-medium">
                                    {t("invItemsConsumed")}
                                </th>
                                <th className="px-4 py-2.5 text-right font-medium">
                                    {t("invItemsWaste")}
                                </th>
                                <th className="px-4 py-2.5 text-right font-medium">
                                    {t("invItemsClosing")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <IngredientRow
                                    key={row.ingredientId}
                                    row={row}
                                    context={context}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
