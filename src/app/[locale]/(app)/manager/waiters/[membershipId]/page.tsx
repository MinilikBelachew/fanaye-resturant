"use client";

import { use, useMemo, useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    LayoutGrid,
    Loader2,
    Mail,
    Phone,
    RefreshCw,
    ShoppingBag,
    UserRound,
    Wallet,
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
    useWaiterDetailQuery,
    useWaiterOrderHistoryQuery,
    type WaiterOrderHistoryItem,
    type WaiterPeriod,
} from "@/context/services/waiterPerformanceApi";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

const POLL_MS = 15000;

export default function ManagerWaiterDetailPage({
    params,
}: {
    params: Promise<{ membershipId: string }>;
}) {
    const { membershipId } = use(params);
    const t = useTranslations("managerWaiterDetail");
    const tList = useTranslations("managerWaiters");
    const tCommon = useTranslations("common");

    const [period, setPeriod] = useState<WaiterPeriod>("day");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const periods: Array<{ id: WaiterPeriod; label: string }> = [
        { id: "day", label: tList("periodDay") },
        { id: "week", label: tList("periodWeek") },
        { id: "month", label: tList("periodMonth") },
    ];

    const {
        data: detail,
        isLoading,
        isError,
        isFetching,
        refetch,
    } = useWaiterDetailQuery(
        { membershipId, period },
        { pollingInterval: POLL_MS },
    );

    const {
        data: orders,
        isLoading: ordersLoading,
        isError: ordersError,
        refetch: refetchOrders,
    } = useWaiterOrderHistoryQuery(
        {
            membershipId,
            period,
            q: searchQuery.trim() || undefined,
            page,
            limit,
        },
        { pollingInterval: POLL_MS },
    );

    const rows = orders?.data ?? [];
    const paginationMeta = orders?.pagination;

    const columns: DataTableColumn<WaiterOrderHistoryItem>[] = useMemo(
        () => [
            {
                id: "when",
                header: t("colWhen"),
                cell: row => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium">
                            {new Date(row.confirmedAt).toLocaleString(
                                undefined,
                                {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                },
                            )}
                        </span>
                        <span className="text-[11px] text-slate-gray">
                            {row.businessDate}
                        </span>
                    </div>
                ),
            },
            {
                id: "table",
                header: t("colTable"),
                cell: row => (
                    <Link
                        href={`/manager/tables/${row.tableId}`}
                        className="text-[13px] font-medium text-foreground hover:underline"
                    >
                        {row.tableDisplayNumber
                            ? `#${row.tableDisplayNumber}`
                            : row.tableDisplayName}
                    </Link>
                ),
            },
            {
                id: "items",
                header: t("colItems"),
                cell: row => (
                    <span className="tabular-nums text-[13px]">
                        {row.itemCount}
                    </span>
                ),
            },
            {
                id: "sales",
                header: t("colSales"),
                cell: row => (
                    <span className="font-medium tabular-nums text-brand">
                        {formatEtb(Number(row.netSales))}
                    </span>
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
                        {row.status}
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
                            <Link href="/manager/waiters">
                                <ArrowLeft className="size-3.5" />
                                {t("backToWaiters")}
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

    const kpis = detail.kpis;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3">
                <Link
                    href="/manager/waiters"
                    className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate-gray transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {t("backToWaiters")}
                </Link>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-[20px] font-semibold text-brand">
                            {detail.waiterName.charAt(0).toUpperCase()}
                        </span>
                        <PageHeader
                            compact
                            eyebrow={t("eyebrow")}
                            title={detail.waiterName}
                            description={tList("rangeDesc", {
                                from: detail.from,
                                to: detail.to,
                            })}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start">
                        <div className="flex rounded-[12px] border border-hairline bg-card p-1">
                            {periods.map(entry => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => {
                                        setPeriod(entry.id);
                                        setPage(1);
                                    }}
                                    className={cn(
                                        "rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                                        period === entry.id
                                            ? "bg-brand text-white"
                                            : "text-slate-gray hover:text-foreground",
                                    )}
                                >
                                    {entry.label}
                                </button>
                            ))}
                        </div>
                        <Badge
                            variant={detail.clockedIn ? "success" : "secondary"}
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-normal"
                        >
                            {detail.clockedIn
                                ? tList("clockedIn")
                                : tList("offClock")}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isFetching}
                            onClick={() => {
                                void refetch();
                                void refetchOrders();
                            }}
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3.5",
                                    isFetching && "animate-spin",
                                )}
                            />
                            {tCommon("refresh")}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link
                                href={`/manager/staff/${detail.waiterMembershipId}`}
                            >
                                {t("openStaffProfile")}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label={t("cardSales")}
                    value={formatEtb(Number(kpis.netAttributedSales))}
                    hint={t("ordersHint", {
                        orders: kpis.ordersCreatedCount,
                        items: kpis.itemCount,
                    })}
                    icon={Wallet}
                    accent
                />
                <SummaryCard
                    label={t("cardOrders")}
                    value={String(kpis.ordersCreatedCount)}
                    hint={t("tablesHint", { count: kpis.tablesServedCount })}
                    icon={ShoppingBag}
                />
                <SummaryCard
                    label={t("cardHours")}
                    value={formatHours(kpis.hoursWorked)}
                    hint={tList("sessions", { count: kpis.sessionsCount })}
                    icon={Clock3}
                />
                <SummaryCard
                    label={t("cardUndropped")}
                    value={formatEtb(Number(kpis.undroppedCash))}
                    hint={tList("collectedHint", {
                        amount: formatEtb(Number(kpis.cashCollected)),
                    })}
                    icon={LayoutGrid}
                />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionProfile")}
                    </h3>
                    <div className="mt-3 space-y-2.5 text-[13px]">
                        <div className="flex items-center gap-2">
                            <Phone className="size-3.5 text-slate-gray" />
                            <span>{detail.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-slate-gray" />
                            <span>{detail.email || "—"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 size-3.5 text-slate-gray" />
                            <div>
                                <p className="font-medium">
                                    {t("workingDays")}
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    {detail.workingDays?.length
                                        ? detail.workingDays.join(" · ")
                                        : t("noWorkingDays")}
                                </p>
                            </div>
                        </div>
                        {detail.clockedIn && detail.clockInAt ? (
                            <div className="flex items-center gap-2 text-slate-gray">
                                <UserRound className="size-3.5" />
                                {tList("since", {
                                    time: formatClock(detail.clockInAt),
                                })}
                            </div>
                        ) : null}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-hairline pt-3 text-[12px]">
                        <MoneyLine
                            label={t("cashCollected")}
                            value={formatEtb(Number(kpis.cashCollected))}
                        />
                        <MoneyLine
                            label={t("cashDropped")}
                            value={formatEtb(Number(kpis.cashDropped))}
                        />
                        <MoneyLine
                            label={t("transfers")}
                            value={formatEtb(
                                Number(kpis.verifiedTransferAmount),
                            )}
                        />
                        <MoneyLine
                            label={t("undropped")}
                            value={formatEtb(Number(kpis.undroppedCash))}
                            warn={Number(kpis.undroppedCash) > 0}
                        />
                    </div>
                </section>

                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionShifts")}
                    </h3>
                    {detail.assignedShifts.length === 0 ? (
                        <p className="mt-3 text-[13px] text-slate-gray">
                            {tList("noCoverage")}
                        </p>
                    ) : (
                        <div className="mt-3 space-y-3">
                            {detail.assignedShifts.map(shift => (
                                <div
                                    key={shift.shiftDefinitionId}
                                    className="rounded-xl border border-hairline px-3.5 py-3"
                                >
                                    <p className="text-[13px] font-medium">
                                        {shift.shiftName}
                                    </p>
                                    <p className="text-[11px] text-slate-gray">
                                        {tList("shiftTables", {
                                            start: shift.startLocalTime,
                                            end: shift.endLocalTime,
                                            count: shift.tableCount,
                                        })}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {shift.tables.map(table => (
                                            <Link
                                                key={table.tableId}
                                                href={`/manager/tables/${table.tableId}`}
                                                className="rounded-full border border-hairline bg-secondary/40 px-2.5 py-0.5 text-[11px] hover:bg-secondary"
                                            >
                                                {table.displayNumber
                                                    ? `#${table.displayNumber}`
                                                    : table.displayName}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div>
                <h3 className="text-[14px] font-medium text-foreground">
                    {t("ordersTitle")}
                </h3>
                <p className="text-[12px] text-slate-gray">{t("ordersDesc")}</p>
            </div>

            {ordersError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("ordersError")}
                    </p>
                    <button
                        type="button"
                        onClick={() => void refetchOrders()}
                        className="mt-2 text-[12px] underline"
                    >
                        {t("tryAgain")}
                    </button>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    rowKey={row => row.orderId}
                    empty={
                        ordersLoading ? t("loadingOrders") : t("ordersEmpty")
                    }
                    searchPlaceholder={t("ordersSearch")}
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

function formatClock(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHours(value: number) {
    if (!value) return "0h";
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    if (minutes <= 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

function SummaryCard({
    label,
    value,
    hint,
    icon: Icon,
    accent = false,
}: {
    label: string;
    value: string;
    hint: string;
    icon: typeof UserRound;
    accent?: boolean;
}) {
    return (
        <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-medium text-slate-gray">
                    {label}
                </p>
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-slate-gray">
                    <Icon className="size-4" />
                </span>
            </div>
            <p
                className={cn(
                    "mt-3 text-[24px] leading-none font-semibold tracking-tight",
                    accent ? "text-brand" : "text-foreground",
                )}
            >
                {value}
            </p>
            <p className="mt-2 text-[12px] text-slate-gray">{hint}</p>
        </div>
    );
}

function MoneyLine({
    label,
    value,
    warn = false,
}: {
    label: string;
    value: string;
    warn?: boolean;
}) {
    return (
        <div>
            <p className="text-slate-gray">{label}</p>
            <p
                className={cn(
                    "font-medium tabular-nums",
                    warn
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-foreground",
                )}
            >
                {value}
            </p>
        </div>
    );
}
