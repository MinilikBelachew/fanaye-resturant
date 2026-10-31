"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import DataTable, {
    type DataTableColumn,
    type DataTablePagination,
} from "@/components/custom/organisms/DataTable";
import {
    useGetFinanceInventoryItemsQuery,
    type FinanceAudience,
    type FinanceIngredientMovementRow,
    type FinancePeriod,
} from "../financeApi";

function formatStockQty(value: number) {
    return (Math.round(value * 10000) / 10000).toLocaleString("en-US", {
        maximumFractionDigits: 4,
    });
}

type DrillContext = {
    audience: FinanceAudience;
    period?: FinancePeriod;
    date?: string;
    from?: string;
    to?: string;
    branchId?: string;
    detailBasePath?: string;
};

export default function IngredientStockPanel({
    audience,
    period,
    date,
    from,
    to,
    branchId,
    detailBasePath,
}: DrillContext) {
    const t = useTranslations("financeSummary");
    const router = useRouter();
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const { data, isLoading } = useGetFinanceInventoryItemsQuery({
        audience,
        ...(period ? { period } : {}),
        ...(date ? { date } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(branchId ? { branchId } : {}),
    });

    const rows = data?.data ?? [];

    const buildQueryString = () => {
        const queryParams = new URLSearchParams();
        if (period) queryParams.set("period", period);
        if (from) queryParams.set("from", from);
        if (to) queryParams.set("to", to);
        if (date) queryParams.set("date", date);
        if (branchId) queryParams.set("branchId", branchId);
        return queryParams.toString();
    };

    const columns: DataTableColumn<FinanceIngredientMovementRow>[] = useMemo(() => {
        const cols: DataTableColumn<FinanceIngredientMovementRow>[] = [
            {
                id: "name",
                header: t("invItemsIngredient"),
                sortValue: row => row.name.toLowerCase(),
                cell: row => (
                    <div className="py-0.5">
                        <span className="block text-[13px] font-medium leading-tight text-foreground">
                            {row.name}
                        </span>
                        <span className="text-[11px] text-slate-gray">{row.unit}</span>
                    </div>
                ),
            },
            {
                id: "openingQty",
                header: t("invItemsOpening"),
                headerClassName: "text-right",
                className: "text-right tabular-nums text-slate-gray text-[12.5px]",
                sortValue: row => row.openingQty,
                cell: row => formatStockQty(row.openingQty),
            },
            {
                id: "receivedQty",
                header: t("invItemsReceived"),
                headerClassName: "text-right",
                className: "text-right tabular-nums text-emerald-600 font-medium text-[12.5px]",
                sortValue: row => row.receivedQty,
                cell: row =>
                    row.receivedQty ? `+${formatStockQty(row.receivedQty)}` : "—",
            },
            {
                id: "consumedQty",
                header: t("invItemsConsumed"),
                headerClassName: "text-right",
                className: "text-right tabular-nums text-foreground text-[12.5px]",
                sortValue: row => row.consumedQty,
                cell: row =>
                    row.consumedQty ? formatStockQty(row.consumedQty) : "—",
            },
            {
                id: "wasteQty",
                header: t("invItemsWaste"),
                headerClassName: "text-right",
                className: "text-right tabular-nums text-slate-gray text-[12.5px]",
                sortValue: row => row.wasteQty,
                cell: row => (row.wasteQty ? formatStockQty(row.wasteQty) : "—"),
            },
            {
                id: "closingQty",
                header: t("invItemsClosing"),
                headerClassName: "text-right",
                className: "text-right tabular-nums font-semibold text-foreground text-[12.5px]",
                sortValue: row => row.closingQty,
                cell: row => formatStockQty(row.closingQty),
            },
        ];

        if (detailBasePath) {
            cols.push({
                id: "actions",
                header: "Audit",
                headerClassName: "text-right",
                className: "text-right",
                cell: row => {
                    const qs = buildQueryString();
                    const detailHref = `${detailBasePath}/${row.ingredientId}${qs ? `?${qs}` : ""}`;
                    return (
                        <Link
                            href={detailHref}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium text-brand hover:bg-brand/10 hover:text-brand transition-colors"
                        >
                            <span>Details</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    );
                },
            });
        }

        return cols;
    }, [detailBasePath, period, from, to, date, branchId, t]);

    const pagination: DataTablePagination = useMemo(
        () => ({
            page,
            totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
            total: rows.length,
            limit: pageSize,
            onPageChange: (newPage: number) => setPage(newPage),
        }),
        [page, rows.length],
    );

    const headerActions = (
        <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold tracking-tight text-foreground">
                {t("invItemsTitle")}
            </h4>
            {data ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-slate-gray">
                    {rows.length} {rows.length === 1 ? "item" : "items"}
                </span>
            ) : null}
            {data?.from && data?.to ? (
                <span className="hidden text-[11px] tabular-nums text-slate-gray sm:inline">
                    ({data.from} – {data.to})
                </span>
            ) : null}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loading")}
            </div>
        );
    }

    return (
        <div className="pt-2">
            <DataTable<FinanceIngredientMovementRow>
                columns={columns}
                data={rows}
                rowKey={row => row.ingredientId}
                searchPlaceholder="Filter ingredients..."
                searchText={row => `${row.name} ${row.unit}`}
                headerActions={headerActions}
                pagination={rows.length > pageSize ? pagination : undefined}
                empty={t("invNoData")}
                onRowClick={
                    detailBasePath
                        ? row => {
                              const qs = buildQueryString();
                              const detailHref = `${detailBasePath}/${row.ingredientId}${qs ? `?${qs}` : ""}`;
                              router.push(detailHref);
                          }
                        : undefined
                }
                rowClassName={() =>
                    detailBasePath
                        ? "cursor-pointer hover:bg-secondary/40 transition-colors"
                        : undefined
                }
            />
        </div>
    );
}
