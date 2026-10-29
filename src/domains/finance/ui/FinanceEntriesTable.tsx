"use client";

import { useMemo, useState } from "react";
import {
    Ban,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useGetFinanceEntriesQuery,
    useVoidFinanceEntryMutation,
    type FinanceAudience,
    type FinanceCategory,
    type FinanceDirection,
    type FinanceEditableEntry,
    type FinanceEntryRow,
    type FinancePeriod,
    type FinanceSource,
} from "../financeApi";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const PAGE_SIZES = [25, 50, 100];
const PERIODS: FinancePeriod[] = ["day", "week", "month"];
const SOURCES: FinanceSource[] = [
    "SALE",
    "OTHER_INCOME",
    "MANUAL_EXPENSE",
    "PAYROLL",
    "MATERIAL_COST",
];

const SELECT_CLASS =
    "h-8 rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none";

export default function FinanceEntriesTable({
    audience,
    branchId,
    categories,
    onAddClick,
    onEdit,
}: {
    audience: FinanceAudience;
    branchId?: string;
    categories: FinanceCategory[];
    onAddClick: () => void;
    onEdit?: (entry: FinanceEditableEntry) => void;
}) {
    const t = useTranslations("financeSummary");

    const [period, setPeriod] = useState<FinancePeriod>("day");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [direction, setDirection] = useState<FinanceDirection | "">("");
    const [source, setSource] = useState<FinanceSource | "">("");
    const [categoryId, setCategoryId] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const [voidEntry, { isLoading: isVoiding }] = useVoidFinanceEntryMutation();

    const args = useMemo(
        () => ({
            audience,
            ...(from || to ? {} : { period }),
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
            ...(direction ? { direction } : {}),
            ...(source ? { source } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(search.trim() ? { q: search.trim() } : {}),
            page,
            pageSize,
            ...(audience === "owner" && branchId ? { branchId } : {}),
        }),
        [
            audience,
            from,
            to,
            period,
            direction,
            source,
            categoryId,
            search,
            page,
            pageSize,
            branchId,
        ],
    );

    const { data, isLoading, isFetching, isError, refetch } =
        useGetFinanceEntriesQuery(args);

    const rows = data?.data ?? [];
    const total = data?.total ?? 0;
    const totals = data?.totals;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const sourceLabel = (value: FinanceSource) => {
        switch (value) {
            case "SALE":
                return t("sourceSale");
            case "OTHER_INCOME":
                return t("sourceOtherIncome");
            case "MANUAL_EXPENSE":
                return t("sourceManualExpense");
            case "PAYROLL":
                return t("sourcePayroll");
            case "MATERIAL_COST":
                return t("sourceMaterialCost");
            default:
                return value;
        }
    };

    const directionLabel = (value: FinanceDirection | "IN" | "OUT") => {
        if (value === "IN" || value === "INCOME") return t("directionIn");
        return t("directionOut");
    };

    const handleFilterChange = (fn: () => void) => {
        fn();
        setPage(1);
    };

    const clearFilters = () => {
        setPeriod("day");
        setFrom("");
        setTo("");
        setDirection("");
        setSource("");
        setCategoryId("");
        setSearch("");
        setPage(1);
    };

    const openEdit = (row: FinanceEntryRow) => {
        if (!onEdit) return;
        const matched = categories.find(c => c.name === row.categoryName);
        onEdit({
            id: row.id,
            direction: row.direction === "IN" ? "INCOME" : "EXPENSE",
            label: row.label,
            amount: row.amount,
            businessDate: row.date,
            categoryId: matched?.id ?? null,
            counterparty: row.counterparty,
        });
    };

    const handleVoid = async (row: FinanceEntryRow) => {
        try {
            await voidEntry({ audience, id: row.id, body: {} }).unwrap();
            toast.success(t("voided"));
        } catch (err) {
            const message = (err as { data?: { message?: string } })?.data
                ?.message;
            toast.error(message || t("voidFailed"));
        }
    };

    const showBranch = audience === "owner";
    const showActions = Boolean(onEdit);
    const columnCount = 6 + (showBranch ? 1 : 0) + (showActions ? 1 : 0);
    const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeTo = Math.min(page * pageSize, total);

    return (
        <section className="overflow-hidden rounded-2xl border border-hairline bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
                <div>
                    <h3 className="text-[13px] font-medium text-foreground">
                        {t("tableTitle")}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-slate-gray">
                        {t("tableSubtitle")}
                    </p>
                </div>
                <Button
                    size="sm"
                    className="h-8 rounded-full text-[12px]"
                    onClick={onAddClick}
                >
                    <Plus className="size-3.5" />
                    {t("addEntry")}
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
                <div className="flex rounded-full border border-hairline bg-background/80 p-1">
                    {PERIODS.map(entry => (
                        <button
                            key={entry}
                            type="button"
                            onClick={() =>
                                handleFilterChange(() => {
                                    setPeriod(entry);
                                    setFrom("");
                                    setTo("");
                                })
                            }
                            className={cn(
                                "rounded-full px-3 py-1 text-[12px] font-medium transition-all",
                                !from && !to && period === entry
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {entry === "day"
                                ? t("periodDay")
                                : entry === "week"
                                  ? t("periodWeek")
                                  : t("periodMonth")}
                        </button>
                    ))}
                </div>

                <Input
                    type="date"
                    value={from}
                    onChange={e =>
                        handleFilterChange(() => setFrom(e.target.value))
                    }
                    className="h-8 w-[136px] text-xs"
                    aria-label={t("from")}
                />
                <Input
                    type="date"
                    value={to}
                    onChange={e =>
                        handleFilterChange(() => setTo(e.target.value))
                    }
                    className="h-8 w-[136px] text-xs"
                    aria-label={t("to")}
                />

                <select
                    value={direction}
                    onChange={e =>
                        handleFilterChange(() =>
                            setDirection(
                                e.target.value as FinanceDirection | "",
                            ),
                        )
                    }
                    className={SELECT_CLASS}
                    aria-label={t("filterDirection")}
                >
                    <option value="">{t("filterAll")}</option>
                    <option value="INCOME">{t("directionIn")}</option>
                    <option value="EXPENSE">{t("directionOut")}</option>
                </select>

                <select
                    value={source}
                    onChange={e =>
                        handleFilterChange(() =>
                            setSource(e.target.value as FinanceSource | ""),
                        )
                    }
                    className={SELECT_CLASS}
                    aria-label={t("filterSource")}
                >
                    <option value="">{t("filterAll")}</option>
                    {SOURCES.map(item => (
                        <option key={item} value={item}>
                            {sourceLabel(item)}
                        </option>
                    ))}
                </select>

                <select
                    value={categoryId}
                    onChange={e =>
                        handleFilterChange(() => setCategoryId(e.target.value))
                    }
                    className={SELECT_CLASS}
                    aria-label={t("filterCategory")}
                >
                    <option value="">{t("filterAll")}</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-gray" />
                    <Input
                        value={search}
                        onChange={e =>
                            handleFilterChange(() => setSearch(e.target.value))
                        }
                        placeholder={t("searchPlaceholder")}
                        className="h-8 w-[180px] pl-8 text-xs"
                    />
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full text-[12px]"
                    onClick={clearFilters}
                >
                    {t("clearFilters")}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full text-[12px]"
                    disabled={isFetching}
                    onClick={() => void refetch()}
                >
                    <RefreshCw
                        className={cn("size-3.5", isFetching && "animate-spin")}
                    />
                    {t("refresh")}
                </Button>
            </div>

            {isError ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("loadError")}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-[12px]"
                        onClick={() => void refetch()}
                    >
                        <RefreshCw className="size-3.5" />
                        {t("retry")}
                    </Button>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("columnDate")}</TableHead>
                            <TableHead>{t("columnDirection")}</TableHead>
                            <TableHead>{t("columnSource")}</TableHead>
                            <TableHead>{t("columnCategory")}</TableHead>
                            <TableHead>{t("columnLabel")}</TableHead>
                            {showBranch ? (
                                <TableHead>{t("columnBranch")}</TableHead>
                            ) : null}
                            <TableHead className="text-right">
                                {t("columnAmount")}
                            </TableHead>
                            {showActions ? <TableHead /> : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell colSpan={columnCount}>
                                        <Skeleton className="h-5 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columnCount}
                                    className="py-12 text-center text-[13px] text-slate-gray"
                                >
                                    {t("empty")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell className="whitespace-nowrap tabular-nums text-slate-gray">
                                        {row.date}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                row.direction === "IN"
                                                    ? "success"
                                                    : "danger"
                                            }
                                            className="rounded-full"
                                        >
                                            {directionLabel(row.direction)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-[13px] text-slate-gray">
                                        {sourceLabel(row.source)}
                                    </TableCell>
                                    <TableCell className="text-[13px]">
                                        {row.categoryName ?? t("uncategorised")}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium text-foreground">
                                            {row.label}
                                        </p>
                                        {row.counterparty || row.reference ? (
                                            <p className="text-[11px] text-slate-gray">
                                                {[
                                                    row.counterparty,
                                                    row.reference,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </p>
                                        ) : null}
                                    </TableCell>
                                    {showBranch ? (
                                        <TableCell className="whitespace-nowrap text-[13px] text-slate-gray">
                                            {row.branchName}
                                        </TableCell>
                                    ) : null}
                                    <TableCell className="whitespace-nowrap text-right">
                                        <span
                                            className={cn(
                                                "font-semibold tabular-nums",
                                                row.direction === "IN"
                                                    ? "text-emerald-600"
                                                    : "text-destructive",
                                            )}
                                        >
                                            {formatEtb(
                                                Number(row.signedAmount),
                                            )}
                                        </span>
                                    </TableCell>
                                    {showActions ? (
                                        <TableCell className="text-right">
                                            {row.editable ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        title={t("editEntry")}
                                                        onClick={() =>
                                                            openEdit(row)
                                                        }
                                                        className="rounded-full"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        title={t("void")}
                                                        disabled={isVoiding}
                                                        onClick={() =>
                                                            void handleVoid(row)
                                                        }
                                                        className="rounded-full text-destructive"
                                                    >
                                                        <Ban className="size-3.5" />
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            ))
                        )}

                        <TableRow className="border-t-2 border-hairline bg-secondary/30 hover:bg-secondary/30">
                            <TableCell
                                colSpan={5 + (showBranch ? 1 : 0)}
                                className="text-[13px]"
                            >
                                <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
                                    {isFetching ? (
                                        <Loader2 className="size-3.5 animate-spin text-slate-gray" />
                                    ) : null}
                                    <span className="text-slate-gray">
                                        {t("totalsIncome")}{" "}
                                        <span className="font-semibold tabular-nums text-emerald-600">
                                            {formatEtb(
                                                Number(totals?.income ?? 0),
                                            )}
                                        </span>
                                    </span>
                                    <span className="text-slate-gray">
                                        {t("totalsExpense")}{" "}
                                        <span className="font-semibold tabular-nums text-destructive">
                                            {formatEtb(
                                                Number(totals?.expense ?? 0),
                                            )}
                                        </span>
                                    </span>
                                </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right text-[13px]">
                                <span
                                    className={cn(
                                        "font-semibold tabular-nums",
                                        Number(totals?.net ?? 0) >= 0
                                            ? "text-emerald-600"
                                            : "text-destructive",
                                    )}
                                >
                                    {formatEtb(Number(totals?.net ?? 0))}
                                </span>
                            </TableCell>
                            {showActions ? <TableCell /> : null}
                        </TableRow>
                    </TableBody>
                </Table>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-[12px] text-slate-gray">
                <span>
                    {t("showingRange", {
                        from: rangeFrom,
                        to: rangeTo,
                        total,
                    })}
                </span>
                <div className="flex items-center gap-2">
                    <span>
                        {t("page")} {page} / {totalPages}
                    </span>
                    <select
                        value={pageSize}
                        onChange={e =>
                            handleFilterChange(() =>
                                setPageSize(Number(e.target.value)),
                            )
                        }
                        className={SELECT_CLASS}
                        aria-label={t("page")}
                    >
                        {PAGE_SIZES.map(size => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-[12px]"
                        disabled={page <= 1 || isFetching}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="size-3.5" />
                        {t("previous")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-[12px]"
                        disabled={page >= totalPages || isFetching}
                        onClick={() => setPage(p => p + 1)}
                    >
                        {t("next")}
                        <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
