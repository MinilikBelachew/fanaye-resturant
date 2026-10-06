"use client";

import { use, useMemo, useState } from "react";
import {
    ArrowLeft,
    Copy,
    ExternalLink,
    Loader2,
    QrCode,
    RefreshCw,
    UserRound,
    Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import DataTable, {
    type DataTableColumn,
    type DataTablePagination,
} from "@/components/custom/organisms/DataTable";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useTableDetailQuery,
    useTableVisitHistoryQuery,
    type TableVisitHistoryItem,
    type TableVisitHistoryPeriod,
} from "@/context/services/floorApi";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const PERIODS: TableVisitHistoryPeriod[] = ["today", "week", "month", "custom"];

const POLL_MS = 8000;

export default function ManagerTableDetailPage({
    params,
}: {
    params: Promise<{ tableId: string }>;
}) {
    const { tableId } = use(params);
    const t = useTranslations("managerTableDetail");
    const tManager = useTranslations("manager");

    const [period, setPeriod] = useState<TableVisitHistoryPeriod>("week");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const historyArgs = useMemo(() => {
        const base = {
            tableId,
            q: searchQuery.trim() || undefined,
            page,
            limit,
        };
        if (period === "custom") {
            if (!fromDate || !toDate) {
                return { ...base, period: "week" as const };
            }
            return { ...base, period, fromDate, toDate };
        }
        return { ...base, period };
    }, [tableId, searchQuery, page, period, fromDate, toDate]);

    const {
        data: detail,
        isLoading,
        isError,
        isFetching,
        refetch,
    } = useTableDetailQuery(tableId, { pollingInterval: POLL_MS });

    const {
        data: history,
        isLoading: historyLoading,
        isError: historyError,
        refetch: refetchHistory,
    } = useTableVisitHistoryQuery(historyArgs, { pollingInterval: POLL_MS });

    const rows = history?.data ?? [];
    const paginationMeta = history?.pagination;

    const periodLabel = (id: TableVisitHistoryPeriod) => {
        if (id === "today") return tManager("periodToday");
        if (id === "week") return tManager("periodWeek");
        if (id === "month") return tManager("periodMonth");
        return tManager("periodCustom");
    };

    const columns: DataTableColumn<TableVisitHistoryItem>[] = useMemo(
        () => [
            {
                id: "when",
                header: t("colWhen"),
                cell: row => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium text-foreground">
                            {new Date(row.openedAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                        <span className="text-[11px] text-slate-gray">
                            {row.businessDate}
                            {row.durationMinutes != null
                                ? ` · ${t("durationMin", { count: row.durationMinutes })}`
                                : ""}
                        </span>
                    </div>
                ),
            },
            {
                id: "waiter",
                header: t("colWaiter"),
                cell: row => (
                    <span className="text-[13px] text-foreground">
                        {row.waiterName || "—"}
                    </span>
                ),
            },
            {
                id: "guests",
                header: t("colGuests"),
                cell: row => (
                    <span className="tabular-nums text-[13px]">
                        {row.guestCount ?? "—"}
                    </span>
                ),
            },
            {
                id: "orders",
                header: t("colOrders"),
                cell: row => (
                    <span className="tabular-nums text-[13px] text-slate-gray">
                        {row.orderCount} / {row.itemCount}
                    </span>
                ),
            },
            {
                id: "bill",
                header: t("colBill"),
                cell: row => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium tabular-nums">
                            {formatEtb(row.revenue)}
                        </span>
                        <span className="text-[11px] text-slate-gray">
                            {row.billNumber || t("noBill")}
                        </span>
                    </div>
                ),
            },
            {
                id: "status",
                header: t("colStatus"),
                cell: row => (
                    <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0 text-[10px] font-normal"
                    >
                        {row.billStatus || row.status}
                    </Badge>
                ),
            },
        ],
        [t],
    );

    const pagination: DataTablePagination = useMemo(
        () => ({
            page: paginationMeta?.page ?? page,
            totalPages: Math.max(paginationMeta?.totalPages ?? 1, 1),
            total: paginationMeta?.total ?? rows.length,
            limit: paginationMeta?.limit ?? limit,
            onPageChange: next => setPage(next),
        }),
        [paginationMeta, page, rows.length],
    );

    async function copyQr() {
        if (!detail?.qrRelativeUrl) return;
        const url = `${window.location.origin}${detail.qrRelativeUrl}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success(t("toastQrCopied"));
        } catch {
            toast.error(t("toastQrCopyFailed"));
        }
    }

    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card py-16">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="mt-2 text-[12px] text-slate-gray">
                        {t("loading")}
                    </p>
                </div>
            </DashboardFrame>
        );
    }

    if (isError || !detail) {
        return (
            <DashboardFrame>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("loadError")}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href="/manager/tables">
                                <ArrowLeft className="size-3.5" />
                                {t("backToTables")}
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-full text-[12px]"
                            onClick={() => void refetch()}
                        >
                            {t("tryAgain")}
                        </Button>
                    </div>
                </div>
            </DashboardFrame>
        );
    }

    const title = detail.displayNumber
        ? `#${detail.displayNumber}`
        : detail.displayName;
    const occupied = Boolean(detail.live);
    const qrUrl = detail.qrRelativeUrl
        ? `${typeof window !== "undefined" ? window.location.origin : ""}${detail.qrRelativeUrl}`
        : null;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3">
                <Link
                    href="/manager/tables"
                    className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate-gray transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {t("backToTables")}
                </Link>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <PageHeader
                        compact
                        eyebrow={detail.locationName}
                        title={title}
                        description={
                            detail.displayNumber
                                ? detail.displayName
                                : t("detailDesc")
                        }
                    />
                    <div className="flex flex-wrap items-center gap-2 self-start">
                        <div
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate-gray",
                                isFetching && "opacity-80",
                            )}
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3",
                                    isFetching && "animate-spin",
                                )}
                            />
                            {history?.periodLabel || periodLabel(period)}
                        </div>
                        <Badge
                            variant={occupied ? "warning" : "success"}
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-normal"
                        >
                            {occupied ? t("occupied") : t("available")}
                        </Badge>
                        {occupied && detail.live ? (
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 rounded-full text-[12px] font-normal"
                                asChild
                            >
                                <Link href={`/manager/live/${detail.id}`}>
                                    {t("openLive")}
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionNow")}
                    </h3>
                    {detail.live ? (
                        <div className="mt-3 space-y-3">
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                                <span className="inline-flex items-center gap-1.5">
                                    <Users className="size-3.5 text-slate-gray" />
                                    {t("guests", {
                                        count: detail.live.guestCount ?? 0,
                                    })}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <UserRound className="size-3.5 text-slate-gray" />
                                    {detail.live.waiterName || t("noWaiter")}
                                </span>
                                <span className="text-slate-gray">
                                    {t("openedAt", {
                                        time: new Date(
                                            detail.live.openedAt,
                                        ).toLocaleTimeString(undefined, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }),
                                    })}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    {
                                        label: t("cooking"),
                                        value: detail.live.cookingItemCount,
                                    },
                                    {
                                        label: t("ready"),
                                        value: detail.live.readyItemCount,
                                    },
                                    {
                                        label: t("delayed"),
                                        value: detail.live.delayedItemCount,
                                    },
                                ].map(stat => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl bg-secondary/50 px-3 py-2"
                                    >
                                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-gray">
                                            {stat.label}
                                        </p>
                                        <p className="mt-0.5 text-[18px] font-medium tabular-nums">
                                            {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {detail.live.billTotal != null ? (
                                <div className="rounded-xl border border-hairline px-3 py-2.5">
                                    <p className="text-[11px] text-slate-gray">
                                        {t("openBill")}
                                        {detail.live.billNumber
                                            ? ` · ${detail.live.billNumber}`
                                            : ""}
                                    </p>
                                    <p className="mt-0.5 text-[18px] font-medium tabular-nums">
                                        {formatEtb(detail.live.billTotal)}
                                    </p>
                                    {detail.live.amountPaid != null &&
                                    detail.live.amountPaid > 0 ? (
                                        <p className="text-[11px] text-slate-gray">
                                            {t("paidSoFar", {
                                                amount: formatEtb(
                                                    detail.live.amountPaid,
                                                ),
                                            })}
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="text-[12px] text-slate-gray">
                                    {t("noOpenBill")}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="mt-3 text-[13px] text-slate-gray">
                            {t("tableEmpty")}
                        </p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 border-t border-hairline pt-3 text-[12px] text-slate-gray">
                        <UserRound className="size-3.5" />
                        {detail.assignedWaiterName
                            ? t("permanentWaiter", {
                                  name: detail.assignedWaiterName,
                              })
                            : t("noPermanentWaiter")}
                    </div>
                </section>

                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionQr")}
                    </h3>
                    <div className="mt-3 flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-slate-gray">
                            <QrCode className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium">
                                {detail.qrRelativeUrl || "—"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-gray">
                                {t("qrHint")}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-full text-[12px]"
                                    onClick={() => void copyQr()}
                                    disabled={!detail.qrRelativeUrl}
                                >
                                    <Copy className="size-3.5" />
                                    {t("copyLink")}
                                </Button>
                                {qrUrl ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-full text-[12px]"
                                        asChild
                                    >
                                        <a
                                            href={detail.qrRelativeUrl!}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink className="size-3.5" />
                                            {t("openMenu")}
                                        </a>
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
                {[
                    {
                        title: t("kpiToday"),
                        kpi: detail.kpisToday,
                    },
                    {
                        title: t("kpiWeek"),
                        kpi: detail.kpisWeek,
                    },
                ].map(block => (
                    <div
                        key={block.title}
                        className="bg-card px-4 py-3.5 sm:col-span-1 lg:col-span-1"
                    >
                        <p className="text-[10px] uppercase tracking-[0.1em] text-slate-gray">
                            {block.title}
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            <div>
                                <p className="text-[11px] text-slate-gray">
                                    {t("turns")}
                                </p>
                                <p className="text-[18px] font-medium tabular-nums">
                                    {block.kpi.turns}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-gray">
                                    {t("revenue")}
                                </p>
                                <p className="text-[15px] font-medium tabular-nums tracking-tight">
                                    {formatEtb(block.kpi.revenue)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-gray">
                                    {t("avgTicket")}
                                </p>
                                <p className="text-[15px] font-medium tabular-nums tracking-tight">
                                    {formatEtb(block.kpi.avgTicket)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="bg-card px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-gray">
                        {t("coversWeek")}
                    </p>
                    <p className="mt-2 text-[22px] font-medium tabular-nums">
                        {detail.kpisWeek.covers}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-gray">
                        {t("coversToday", {
                            count: detail.kpisToday.covers,
                        })}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h3 className="text-[14px] font-medium text-foreground">
                            {t("pastVisits")}
                        </h3>
                        <p className="text-[12px] text-slate-gray">
                            {t("pastVisitsDesc")}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {PERIODS.map(id => {
                        const active = period === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    setPage(1);
                                    if (id !== "custom") {
                                        setPeriod(id);
                                        setFromDate("");
                                        setToDate("");
                                    } else {
                                        setPeriod("custom");
                                    }
                                }}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                                    active
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-hairline bg-card text-slate-gray hover:text-foreground",
                                )}
                            >
                                {periodLabel(id)}
                            </button>
                        );
                    })}
                </div>
                {period === "custom" ? (
                    <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                            {tManager("fromDate")}
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] text-foreground"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                            {tManager("toDate")}
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] text-foreground"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                if (!customFrom || !customTo) return;
                                setFromDate(customFrom);
                                setToDate(customTo);
                                setPage(1);
                            }}
                            className="h-8 rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground"
                        >
                            {tManager("applyRange")}
                        </button>
                    </div>
                ) : null}
            </div>

            {historyError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("historyError")}
                    </p>
                    <button
                        type="button"
                        onClick={() => void refetchHistory()}
                        className="mt-2 text-[12px] text-foreground underline"
                    >
                        {t("tryAgain")}
                    </button>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    rowKey={row => row.tableSessionId}
                    empty={
                        historyLoading ? t("loadingHistory") : t("historyEmpty")
                    }
                    searchPlaceholder={t("historySearch")}
                    searchQuery={searchQuery}
                    onSearchChange={q => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                    serverSide
                    pagination={pagination}
                    showColumnToggle={false}
                    className="rounded-2xl"
                />
            )}
        </DashboardFrame>
    );
}
