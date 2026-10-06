"use client";

import { useMemo, useState } from "react";
import {
    Ban,
    ChevronRight,
    Clock3,
    Loader2,
    Package,
    RefreshCw,
    Replace,
    UserRound,
    UtensilsCrossed,
    Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useManagerReportsQuery,
    type ManagerReportsData,
    type ReportsPeriod,
    type ReportsSection,
} from "@/context/services/managerReportsApi";
import {
    ApprovalDecisionDonut,
    CancelledItemsBarChart,
    CashByWaiterChart,
    InventoryMixDonut,
    InventoryWasteBarChart,
    StationPrepBarChart,
    WaiterSalesBarChart,
} from "@/domains/reporting/ui/ManagerReportCharts";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

type TReports = ReturnType<typeof useTranslations<"managerReports">>;

const SECTIONS: Array<{
    id: Exclude<ReportsSection, "all">;
    icon: typeof UserRound;
}> = [
    { id: "waiters", icon: UserRound },
    { id: "cancels", icon: Ban },
    { id: "inventory", icon: Package },
    { id: "cash", icon: Wallet },
    { id: "stations", icon: UtensilsCrossed },
];

export default function ManagerReportsPage() {
    const t = useTranslations("managerReports");
    const tCommon = useTranslations("common");
    const [period, setPeriod] = useState<ReportsPeriod>("day");
    const [section, setSection] =
        useState<Exclude<ReportsSection, "all">>("waiters");

    const { data, isLoading, isError, isFetching, refetch } =
        useManagerReportsQuery({ period, section });

    const report = data?.data;
    const periods: Array<{ id: ReportsPeriod; label: string }> = [
        { id: "day", label: t("periodDay") },
        { id: "week", label: t("periodWeek") },
        { id: "month", label: t("periodMonth") },
    ];

    const sectionMeta = useMemo(
        () => SECTIONS.find(s => s.id === section)!,
        [section],
    );

    return (
        <DashboardFrame>
            <div className="relative overflow-hidden rounded-3xl border border-hairline bg-card">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-brand/10 blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 left-10 size-40 rounded-full bg-brand/5 blur-2xl"
                />
                <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                    <PageHeader
                        compact
                        eyebrow={t("eyebrow")}
                        title={t("title")}
                        description={
                            report
                                ? t("rangeDesc", {
                                      from: report.from,
                                      to: report.to,
                                      branch: report.branchName,
                                  })
                                : t("description")
                        }
                    />
                    <div className="flex flex-wrap items-center gap-2">
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
                            {tCommon("refresh")}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {SECTIONS.map(entry => {
                    const Icon = entry.icon;
                    const active = section === entry.id;
                    return (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => setSection(entry.id)}
                            className={cn(
                                "group flex flex-col items-start gap-2 rounded-2xl border px-3.5 py-3 text-left transition-all",
                                active
                                    ? "border-brand/40 bg-brand text-white shadow-[0_8px_24px_-12px_rgba(232,93,4,0.55)]"
                                    : "border-hairline bg-card text-slate-gray hover:border-brand/25 hover:text-foreground",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-xl transition-colors",
                                    active
                                        ? "bg-white/15"
                                        : "bg-secondary/70 group-hover:bg-brand/10",
                                )}
                            >
                                <Icon className="size-3.5" />
                            </span>
                            <span className="text-[12px] font-semibold leading-tight sm:text-[13px]">
                                {t(`sections.${entry.id}`)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-hairline bg-card py-16 text-slate-gray">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                </div>
            ) : null}

            {isError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-[13px] text-destructive">
                    {t("loadError")}
                </div>
            ) : null}

            {!isLoading && !isError && report ? (
                <div className="space-y-4 animate-in fade-in-0 duration-300">
                    <div className="flex items-center gap-2 px-0.5 text-[13px] text-slate-gray">
                        <sectionMeta.icon className="size-4 text-brand" />
                        <span className="font-medium text-foreground">
                            {t(`sections.${section}`)}
                        </span>
                        <span className="opacity-40">·</span>
                        <span>{t(`sections.${section}Desc`)}</span>
                    </div>

                    {section === "waiters" && report.waiters ? (
                        <WaitersReport data={report.waiters} t={t} />
                    ) : null}
                    {section === "cancels" && report.cancels ? (
                        <CancelsReport data={report.cancels} t={t} />
                    ) : null}
                    {section === "inventory" && report.inventory ? (
                        <InventoryReport data={report.inventory} t={t} />
                    ) : null}
                    {section === "cash" && report.cash ? (
                        <CashReport data={report.cash} t={t} />
                    ) : null}
                    {section === "stations" && report.stations ? (
                        <StationsReport data={report.stations} t={t} />
                    ) : null}
                </div>
            ) : null}
        </DashboardFrame>
    );
}

function StatGrid({
    items,
}: {
    items: Array<{
        label: string;
        value: string;
        hint?: string;
        accent?: boolean;
    }>;
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {items.map((item, index) => (
                <div
                    key={item.label}
                    className={cn(
                        "rounded-2xl border border-hairline bg-card px-4 py-3.5 transition-transform",
                        "hover:-translate-y-0.5",
                    )}
                    style={{ animationDelay: `${index * 40}ms` }}
                >
                    <p className="text-[11px] uppercase tracking-[0.07em] text-slate-gray">
                        {item.label}
                    </p>
                    <p
                        className={cn(
                            "mt-1.5 text-[20px] font-semibold tabular-nums tracking-tight",
                            item.accent ? "text-brand" : "text-foreground",
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

function WaitersReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["waiters"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("waiters.cardSales"),
                        value: formatEtb(Number(data.totalNetSales)),
                        accent: true,
                    },
                    {
                        label: t("waiters.cardOrders"),
                        value: String(data.totalOrders),
                    },
                    {
                        label: t("waiters.cardHours"),
                        value: `${data.totalHoursWorked}h`,
                    },
                    {
                        label: t("waiters.cardUndropped"),
                        value: formatEtb(Number(data.totalUndroppedCash)),
                    },
                ]}
            />
            <div className="grid gap-3 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <WaiterSalesBarChart
                        rows={data.rows}
                        title={t("charts.waiterSales")}
                        subtitle={t("charts.waiterSalesDesc")}
                        empty={t("empty")}
                        salesLabel={t("waiters.cardSales")}
                    />
                </div>
                <div className="overflow-hidden rounded-2xl border border-hairline bg-card lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                        <p className="text-[13px] font-medium">
                            {t("waiters.tableTitle")}
                        </p>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href="/manager/waiters">
                                {t("openBoard")}
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </Button>
                    </div>
                    {data.rows.length === 0 ? (
                        <p className="px-4 py-10 text-center text-[13px] text-slate-gray">
                            {t("empty")}
                        </p>
                    ) : (
                        <div className="max-h-[280px] divide-y divide-hairline overflow-y-auto">
                            {data.rows.map(row => (
                                <Link
                                    key={row.waiterMembershipId}
                                    href={`/manager/waiters/${row.waiterMembershipId}`}
                                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[13px] font-semibold text-brand">
                                            {row.waiterName
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-foreground">
                                                {row.waiterName}
                                            </p>
                                            <p className="text-[12px] text-slate-gray">
                                                {row.ordersCreatedCount}{" "}
                                                {t("waiters.orders")} ·{" "}
                                                {row.hoursWorked}h
                                            </p>
                                        </div>
                                    </div>
                                    <p className="shrink-0 font-semibold tabular-nums text-brand">
                                        {formatEtb(
                                            Number(row.netAttributedSales),
                                        )}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function CancelsReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["cancels"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("cancels.cardCancelled"),
                        value: String(data.cancelledItemsCount),
                        hint: formatEtb(Number(data.cancelledItemsValue)),
                        accent: true,
                    },
                    {
                        label: t("cancels.cardApproved"),
                        value: String(data.approvedCount),
                        hint: `${data.approveRate}%`,
                    },
                    {
                        label: t("cancels.cardRejected"),
                        value: String(data.rejectedCount),
                        hint: `${data.rejectRate}%`,
                    },
                    {
                        label: t("cancels.cardPending"),
                        value: String(data.pendingCount),
                    },
                ]}
            />
            <div className="grid gap-3 lg:grid-cols-2">
                <ApprovalDecisionDonut
                    approved={data.approvedCount}
                    rejected={data.rejectedCount}
                    pending={data.pendingCount}
                    title={t("charts.decisions")}
                    subtitle={t("charts.decisionsDesc")}
                    empty={t("empty")}
                    labels={{
                        approved: t("cancels.cardApproved"),
                        rejected: t("cancels.cardRejected"),
                        pending: t("cancels.cardPending"),
                    }}
                />
                <CancelledItemsBarChart
                    items={data.topCancelledItems}
                    title={t("charts.topCancelled")}
                    subtitle={t("charts.topCancelledDesc")}
                    empty={t("empty")}
                    countLabel={t("cancels.count")}
                />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[13px] font-medium">
                            {t("cancels.byType")}
                        </h3>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href="/manager/approvals">
                                {t("openApprovals")}
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </Button>
                    </div>
                    <div className="mt-3 space-y-2">
                        {data.byType.map(row => (
                            <div
                                key={row.type}
                                className="flex items-center justify-between rounded-xl border border-hairline px-3 py-2.5"
                            >
                                <div className="flex items-center gap-2">
                                    {row.type === "CANCELLATION" ? (
                                        <Ban className="size-3.5 text-destructive" />
                                    ) : (
                                        <Replace className="size-3.5 text-amber-600" />
                                    )}
                                    <span className="text-[13px] font-medium">
                                        {row.type === "CANCELLATION"
                                            ? t("cancels.cancellation")
                                            : t("cancels.change")}
                                    </span>
                                </div>
                                <div className="flex gap-2 text-[11px]">
                                    <Badge
                                        variant="success"
                                        className="rounded-full"
                                    >
                                        {row.approved}
                                    </Badge>
                                    <Badge
                                        variant="danger"
                                        className="rounded-full"
                                    >
                                        {row.rejected}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[13px] font-medium">
                        {t("cancels.topItems")}
                    </h3>
                    {data.topCancelledItems.length === 0 ? (
                        <p className="mt-8 text-center text-[13px] text-slate-gray">
                            {t("empty")}
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {data.topCancelledItems.map(item => (
                                <li
                                    key={item.itemName}
                                    className="flex items-center justify-between gap-3 text-[13px]"
                                >
                                    <span className="truncate font-medium">
                                        {item.itemName}
                                    </span>
                                    <span className="shrink-0 text-slate-gray">
                                        ×{item.count} ·{" "}
                                        {formatEtb(Number(item.value))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

function InventoryReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["inventory"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("inventory.cardStock"),
                        value: formatEtb(Number(data.totalStockValue)),
                        hint: t("inventory.skus", { count: data.skuCount }),
                        accent: true,
                    },
                    {
                        label: t("inventory.cardWaste"),
                        value: formatEtb(Number(data.wasteValue)),
                        hint: t("inventory.wasteQty", { qty: data.wasteQty }),
                    },
                    {
                        label: t("inventory.cardReceive"),
                        value: formatEtb(Number(data.receiveValue)),
                    },
                    {
                        label: t("inventory.cardLow"),
                        value: String(data.lowStockCount),
                    },
                ]}
            />
            <div className="grid gap-3 lg:grid-cols-2">
                <InventoryMixDonut
                    stockValue={Number(data.totalStockValue)}
                    wasteValue={Number(data.wasteValue)}
                    receiveValue={Number(data.receiveValue)}
                    title={t("charts.inventoryMix")}
                    subtitle={t("charts.inventoryMixDesc")}
                    empty={t("empty")}
                    labels={{
                        stock: t("inventory.cardStock"),
                        waste: t("inventory.cardWaste"),
                        receive: t("inventory.cardReceive"),
                    }}
                />
                <InventoryWasteBarChart
                    items={data.topWaste}
                    title={t("charts.wasteValue")}
                    subtitle={t("charts.wasteValueDesc")}
                    empty={t("inventory.noWaste")}
                    valueLabel={t("inventory.cardWaste")}
                />
            </div>
            <section className="rounded-2xl border border-hairline bg-card p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium">
                        {t("inventory.topWaste")}
                    </h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full text-[12px]"
                        asChild
                    >
                        <Link href="/manager/inventory">
                            {t("openInventory")}
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </Button>
                </div>
                {data.topWaste.length === 0 ? (
                    <p className="mt-8 text-center text-[13px] text-slate-gray">
                        {t("inventory.noWaste")}
                    </p>
                ) : (
                    <ul className="mt-3 divide-y divide-hairline">
                        {data.topWaste.map(item => (
                            <li
                                key={item.ingredientId}
                                className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
                            >
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-[11px] text-slate-gray">
                                        {item.qty} {item.unit}
                                    </p>
                                </div>
                                <p className="font-semibold tabular-nums">
                                    {formatEtb(Number(item.value))}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}

function CashReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["cash"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("cash.cardDropped"),
                        value: formatEtb(Number(data.cashDropped)),
                        hint: t("cash.drops", { count: data.dropCount }),
                        accent: true,
                    },
                    {
                        label: t("cash.cardReceived"),
                        value: formatEtb(Number(data.cashReceived)),
                    },
                    {
                        label: t("cash.cardUndropped"),
                        value: formatEtb(Number(data.undroppedCashTotal)),
                    },
                    {
                        label: t("cash.cardVariance"),
                        value: formatEtb(Number(data.varianceTotal)),
                        hint:
                            Number(data.pendingDropAmount) > 0
                                ? t("cash.pending", {
                                      amount: formatEtb(
                                          Number(data.pendingDropAmount),
                                      ),
                                  })
                                : undefined,
                    },
                ]}
            />
            <CashByWaiterChart
                rows={data.byWaiter}
                title={t("charts.cashByWaiter")}
                subtitle={t("charts.cashByWaiterDesc")}
                empty={t("empty")}
                labels={{
                    dropped: t("cash.cardDropped"),
                    undropped: t("cash.cardUndropped"),
                }}
            />
            <section className="overflow-hidden rounded-2xl border border-hairline bg-card">
                <div className="border-b border-hairline px-4 py-3">
                    <h3 className="text-[13px] font-medium">
                        {t("cash.byWaiter")}
                    </h3>
                </div>
                {data.byWaiter.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-slate-gray">
                        {t("empty")}
                    </p>
                ) : (
                    <div className="divide-y divide-hairline">
                        {data.byWaiter.map(row => (
                            <div
                                key={row.waiterMembershipId}
                                className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
                            >
                                <div>
                                    <p className="font-medium">
                                        {row.waiterName}
                                    </p>
                                    <p className="text-[11px] text-slate-gray">
                                        {t("cash.collected")}{" "}
                                        {formatEtb(Number(row.collected))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold tabular-nums">
                                        {formatEtb(Number(row.dropped))}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-[11px]",
                                            Number(row.undropped) > 0
                                                ? "text-amber-700"
                                                : "text-slate-gray",
                                        )}
                                    >
                                        {t("cash.undropped")}{" "}
                                        {formatEtb(Number(row.undropped))}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}

function StationsReport({
    data,
    t,
}: {
    data: NonNullable<ManagerReportsData["stations"]>;
    t: TReports;
}) {
    return (
        <>
            <StatGrid
                items={[
                    {
                        label: t("stations.cardAvgPrep"),
                        value: `${data.avgPrepMinutes}m`,
                        accent: true,
                    },
                    {
                        label: t("stations.cardTickets"),
                        value: String(data.ticketsCompleted),
                    },
                    {
                        label: t("stations.cardDelayed"),
                        value: String(data.delayedCount),
                        hint: `${data.delayedRate}%`,
                    },
                    {
                        label: t("stations.cardCannot"),
                        value: String(data.cannotPrepareCount),
                    },
                ]}
            />
            <StationPrepBarChart
                rows={data.rows}
                title={t("charts.stationPrep")}
                subtitle={t("charts.stationPrepDesc")}
                empty={t("empty")}
                labels={{
                    prep: t("stations.cardAvgPrep"),
                    delayed: t("charts.delayedPct"),
                }}
            />
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
                <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                    <p className="text-[13px] font-medium">
                        {t("stations.tableTitle")}
                    </p>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full text-[12px]"
                        asChild
                    >
                        <Link href="/manager/stations">
                            {t("openStations")}
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </Button>
                </div>
                {data.rows.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-slate-gray">
                        {t("empty")}
                    </p>
                ) : (
                    <div className="divide-y divide-hairline">
                        {data.rows.map(row => (
                            <Link
                                key={row.stationId}
                                href={`/manager/stations/${row.stationId}`}
                                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground">
                                        {row.stationName}
                                    </p>
                                    <p className="text-[12px] text-slate-gray">
                                        {row.ticketsCompleted}{" "}
                                        {t("stations.tickets")} ·{" "}
                                        {row.avgPrepMinutes}m{" "}
                                        {t("stations.avg")}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    {row.delayedCount > 0 ? (
                                        <Badge
                                            variant="warning"
                                            className="rounded-full"
                                        >
                                            <Clock3 className="mr-1 size-3" />
                                            {row.delayedRate}%
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="success"
                                            className="rounded-full"
                                        >
                                            {t("stations.onTime")}
                                        </Badge>
                                    )}
                                    <ChevronRight className="size-3.5 text-slate-gray" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
