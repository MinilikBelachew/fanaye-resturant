"use client";

import { useMemo, useState } from "react";
import { Clock3, RefreshCw, UserRound, Wallet, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useWaiterPerformanceQuery,
    type WaiterPeriod,
} from "@/context/services/waiterPerformanceApi";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function ManagerWaitersPage() {
    const t = useTranslations("managerWaiters");
    const tCommon = useTranslations("common");
    const [period, setPeriod] = useState<WaiterPeriod>("day");
    const { data, isLoading, isFetching, isError, refetch } =
        useWaiterPerformanceQuery({ period }, { pollingInterval: 15000 });

    const periods: Array<{ id: WaiterPeriod; label: string }> = [
        { id: "day", label: t("periodDay") },
        { id: "week", label: t("periodWeek") },
        { id: "month", label: t("periodMonth") },
    ];

    const rows = data?.data ?? [];
    const summary = data?.summary;
    const sorted = useMemo(
        () =>
            [...rows].sort((a, b) => {
                if (a.clockedIn !== b.clockedIn) return a.clockedIn ? -1 : 1;
                return (
                    Number(b.netAttributedSales) - Number(a.netAttributedSales)
                );
            }),
        [rows],
    );

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="House"
                    title="Waiters"
                    description={
                        data
                            ? t("rangeDesc", {
                                  from: data.from,
                                  to: data.to,
                              })
                            : t("defaultDesc")
                    }
                />
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-[12px] border border-hairline bg-card p-1">
                        {periods.map(entry => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => setPeriod(entry.id)}
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
                    <Button
                        variant="outline"
                        size="sm"
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

            {isLoading ? (
                <p className="mt-6 text-slate-gray">{t("loading")}</p>
            ) : isError ? (
                <p className="mt-6 text-slate-gray">{t("error")}</p>
            ) : (
                <div className="mt-6 space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            label={t("cardWaiters")}
                            value={String(summary?.waiterCount ?? 0)}
                            hint={t("clockedInHint", {
                                count: summary?.clockedInCount ?? 0,
                            })}
                            icon={UserRound}
                        />
                        <SummaryCard
                            label={t("cardHours")}
                            value={formatHours(summary?.totalHoursWorked ?? 0)}
                            hint={t("hoursHint")}
                            icon={Clock3}
                        />
                        <SummaryCard
                            label={t("cardSales")}
                            value={formatEtb(
                                Number(summary?.totalNetSales ?? 0),
                            )}
                            hint={t("salesHint")}
                            icon={Wallet}
                            accent
                        />
                        <SummaryCard
                            label={t("cardUndropped")}
                            value={formatEtb(
                                Number(summary?.totalUndroppedCash ?? 0),
                            )}
                            hint={t("collectedHint", {
                                amount: formatEtb(
                                    Number(summary?.totalCashCollected ?? 0),
                                ),
                            })}
                            icon={LayoutGrid}
                        />
                    </div>

                    <div className="overflow-hidden rounded-[20px] border border-hairline bg-card shadow-subtle">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px] text-left text-[13px]">
                                <thead className="border-b border-hairline bg-secondary/40 text-[11px] font-semibold tracking-[0.06em] text-slate-gray uppercase">
                                    <tr>
                                        <th className="px-5 py-3">
                                            {t("colWaiter")}
                                        </th>
                                        <th className="px-5 py-3">
                                            {t("colShifts")}
                                        </th>
                                        <th className="px-5 py-3">
                                            {t("colStatus")}
                                        </th>
                                        <th className="px-5 py-3">
                                            {t("colHours")}
                                        </th>
                                        <th className="px-5 py-3">
                                            {t("colSales")}
                                        </th>
                                        <th className="px-5 py-3">
                                            {t("colCash")}
                                        </th>
                                        <th className="px-5 py-3">
                                            {t("colUndropped")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-12 text-center text-slate-gray"
                                            >
                                                {t("empty")}
                                            </td>
                                        </tr>
                                    ) : (
                                        sorted.map(row => (
                                            <tr
                                                key={row.waiterMembershipId}
                                                className="align-top hover:bg-secondary/30"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-[13px] font-semibold text-brand">
                                                            {row.waiterName
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {row.waiterName}
                                                            </p>
                                                            <p className="text-[12px] text-slate-gray">
                                                                {row.phone ||
                                                                    t(
                                                                        "ordersTables",
                                                                        {
                                                                            orders: row.ordersCreatedCount,
                                                                            tables: row.tablesServedCount,
                                                                        },
                                                                    )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {row.assignedShifts
                                                        .length === 0 ? (
                                                        <span className="text-slate-gray">
                                                            {t("noCoverage")}
                                                        </span>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {row.assignedShifts.map(
                                                                shift => (
                                                                    <div
                                                                        key={
                                                                            shift.shiftDefinitionId
                                                                        }
                                                                    >
                                                                        <p className="font-medium text-foreground">
                                                                            {
                                                                                shift.shiftName
                                                                            }
                                                                        </p>
                                                                        <p className="text-[12px] text-slate-gray">
                                                                            {t(
                                                                                "shiftTables",
                                                                                {
                                                                                    start: shift.startLocalTime,
                                                                                    end: shift.endLocalTime,
                                                                                    count: shift.tableCount,
                                                                                },
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge
                                                        variant={
                                                            row.clockedIn
                                                                ? "success"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {row.clockedIn
                                                            ? t("clockedIn")
                                                            : t("offClock")}
                                                    </Badge>
                                                    {row.clockedIn ? (
                                                        <p className="mt-1.5 text-[12px] text-slate-gray">
                                                            {t("since", {
                                                                time: formatClock(
                                                                    row.clockInAt,
                                                                ),
                                                            })}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold">
                                                        {formatHours(
                                                            row.hoursWorked,
                                                        )}
                                                    </p>
                                                    <p className="text-[12px] text-slate-gray">
                                                        {t("sessions", {
                                                            count: row.sessionsCount,
                                                        })}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 font-semibold text-brand">
                                                    {formatEtb(
                                                        Number(
                                                            row.netAttributedSales,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {formatEtb(
                                                            Number(
                                                                row.cashCollected,
                                                            ),
                                                        )}
                                                    </p>
                                                    <p className="text-[12px] text-slate-gray">
                                                        {t("dropped", {
                                                            amount: formatEtb(
                                                                Number(
                                                                    row.cashDropped,
                                                                ),
                                                            ),
                                                        })}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={cn(
                                                            "font-semibold",
                                                            Number(
                                                                row.undroppedCash,
                                                            ) > 0
                                                                ? "text-amber-700 dark:text-amber-400"
                                                                : "text-foreground",
                                                        )}
                                                    >
                                                        {formatEtb(
                                                            Number(
                                                                row.undroppedCash,
                                                            ),
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
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
