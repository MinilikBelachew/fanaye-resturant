"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    ArrowRightLeft,
    Banknote,
    Calendar,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Search,
    Users,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useManagerHandoversQuery } from "@/context/services/shiftsApi";
import { formatEtb } from "@/lib/money";

type DatePreset = "TODAY" | "YESTERDAY" | "CUSTOM" | "ALL";
type KindFilter = "ALL" | "CASHIER" | "WAITER";

function localYmd(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

interface ShiftHandoversBoardProps {
    basePath?: string;
}

export default function ShiftHandoversBoard({
    basePath = "/manager/staff",
}: ShiftHandoversBoardProps) {
    const isAm = useLocale() === "am";
    const todayStr = useMemo(() => localYmd(0), []);
    const yesterdayStr = useMemo(() => localYmd(-1), []);

    const [datePreset, setDatePreset] = useState<DatePreset>("TODAY");
    const [customFrom, setCustomFrom] = useState(todayStr);
    const [customTo, setCustomTo] = useState(todayStr);
    const [kind, setKind] = useState<KindFilter>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 15;

    const queryParams = useMemo(() => {
        let from: string | undefined;
        let to: string | undefined;
        if (datePreset === "TODAY") {
            from = todayStr;
            to = todayStr;
        } else if (datePreset === "YESTERDAY") {
            from = yesterdayStr;
            to = yesterdayStr;
        } else if (datePreset === "CUSTOM") {
            from = customFrom || undefined;
            to = customTo || undefined;
        }
        return {
            from,
            to,
            kind,
            search: searchQuery.trim() || undefined,
            page,
            limit,
        };
    }, [
        datePreset,
        todayStr,
        yesterdayStr,
        customFrom,
        customTo,
        kind,
        searchQuery,
        page,
    ]);

    const { data, isLoading, isFetching, refetch } = useManagerHandoversQuery(
        queryParams,
        {
            pollingInterval: 15000,
            refetchOnFocus: true,
        },
    );

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;
    const currentPage = data?.page ?? page;
    const summary = data?.summary ?? {
        totalCount: 0,
        cashierCount: 0,
        waiterCount: 0,
        varianceCount: 0,
    };

    const handlePresetChange = (preset: DatePreset) => {
        setDatePreset(preset);
        setPage(1);
    };

    const handleKindChange = (nextKind: KindFilter) => {
        setKind(nextKind);
        setPage(1);
    };

    const startIdx = total === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endIdx = Math.min(total, currentPage * limit);

    return (
        <DashboardFrame>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <PageHeader
                        compact
                        eyebrow={
                            isAm
                                ? "የሰው ኃይል እና የፈረቃ ክንውኖች"
                                : "HR & Shift Operations"
                        }
                        title={isAm ? "የፈረቃ ርክክቦች" : "Shift Handovers"}
                        description={
                            isAm
                                ? "በፈረቃዎች መካከል የአስተናጋጅ ጠረጴዛ/ገንዘብ እና የገንዘብ ተቀባይ ካዝና ርክክብን ይቆጣጠሩ።"
                                : "Audit waiter table/cash transfers and cashier drawer handovers across shifts."
                        }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`${basePath}/active-shifts`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs font-semibold"
                            >
                                <ArrowLeft className="mr-1.5 size-3.5" />
                                {isAm ? "ንቁ ፈረቃዎች" : "Active Shifts"}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-semibold"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw
                                className={`mr-1.5 size-3.5 ${isFetching ? "animate-spin text-brand" : ""}`}
                            />
                            {isAm ? "አድስ" : "Refresh"}
                        </Button>
                    </div>
                </div>

                {/* Summary KPI Cards */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-gray">
                            <span>
                                {isAm ? "ጠቅላላ ርክክቦች" : "Total Handovers"}
                            </span>
                            <ArrowRightLeft className="size-4 text-brand" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">
                            {summary.totalCount}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-gray">
                            {isAm ? "በተመረጠው የቀን ክልል" : "In selected date range"}
                        </p>
                    </div>

                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-gray">
                            <span>
                                {isAm
                                    ? "የገንዘብ ተቀባይ ርክክቦች"
                                    : "Cashier Handovers"}
                            </span>
                            <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">
                            {summary.cashierCount}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-gray">
                            {isAm
                                ? "የካዝና ቆጠራ እና የመጀመሪያ ተቀማጭ"
                                : "Drawer count & float transfers"}
                        </p>
                    </div>

                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-gray">
                            <span>
                                {isAm ? "የአስተናጋጅ ርክክቦች" : "Waiter Handovers"}
                            </span>
                            <Users className="size-4 text-brand" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-foreground">
                            {summary.waiterCount}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-gray">
                            {isAm
                                ? "የጠረጴዛ እና የገንዘብ ርክክቦች"
                                : "Table & cash custody transfers"}
                        </p>
                    </div>

                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-gray">
                            <span>
                                {isAm ? "ልዩነት የተገኘባቸው" : "Flagged Variances"}
                            </span>
                            <AlertTriangle
                                className={`size-4 ${summary.varianceCount > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
                            />
                        </div>
                        <div
                            className={`mt-2 text-2xl font-bold ${summary.varianceCount > 0 ? "text-destructive" : "text-foreground"}`}
                        >
                            {summary.varianceCount}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-gray">
                            {isAm
                                ? "ልዩነት ያለባቸው የገንዘብ መሳቢያዎች"
                                : "Cashier drawers with non-zero variance"}
                        </p>
                    </div>
                </div>

                {/* Filters Bar: Date Presets, Custom Range, Kind Tabs, Search */}
                <div className="rounded-[18px] border border-hairline bg-card p-3.5 shadow-subtle space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Date Filter Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 mr-1 text-xs font-medium text-slate-gray">
                                <Calendar className="size-3.5" />
                                {isAm ? "ቀን፡ " : "Date:"}
                            </span>
                            {(
                                [
                                    {
                                        key: "TODAY",
                                        label: isAm ? "ዛሬ" : "Today",
                                    },
                                    {
                                        key: "YESTERDAY",
                                        label: isAm ? "ትናንት" : "Yesterday",
                                    },
                                    {
                                        key: "CUSTOM",
                                        label: isAm ? "ብጁ" : "Custom",
                                    },
                                    {
                                        key: "ALL",
                                        label: isAm ? "ሁሉንም" : "All Time",
                                    },
                                ] as const
                            ).map(opt => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => handlePresetChange(opt.key)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                        datePreset === opt.key
                                            ? "bg-brand text-white shadow-xs"
                                            : "bg-secondary/50 text-slate-gray hover:text-foreground hover:bg-secondary"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}

                            {datePreset === "CUSTOM" && (
                                <div className="flex flex-wrap items-center gap-2 ml-1">
                                    <input
                                        type="date"
                                        value={customFrom}
                                        onChange={e => {
                                            setCustomFrom(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 rounded-lg border border-hairline bg-background px-2.5 text-xs text-foreground focus:border-brand focus:outline-none"
                                    />
                                    <span className="text-xs text-slate-gray">
                                        {isAm ? "እስከ" : "to"}
                                    </span>
                                    <input
                                        type="date"
                                        value={customTo}
                                        onChange={e => {
                                            setCustomTo(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 rounded-lg border border-hairline bg-background px-2.5 text-xs text-foreground focus:border-brand focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Kind Filter + Search */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                            <div className="flex items-center gap-1 rounded-xl border border-hairline bg-secondary/30 p-1">
                                {(
                                    [
                                        {
                                            key: "ALL",
                                            label: isAm ? "ሁሉም" : "All",
                                        },
                                        {
                                            key: "CASHIER",
                                            label: isAm
                                                ? "ገንዘብ ተቀባይ"
                                                : "Cashier",
                                        },
                                        {
                                            key: "WAITER",
                                            label: isAm ? "አስተናጋጅ" : "Waiter",
                                        },
                                    ] as const
                                ).map(opt => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() =>
                                            handleKindChange(opt.key)
                                        }
                                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                            kind === opt.key
                                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                                : "text-slate-gray hover:text-foreground"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-gray" />
                                <Input
                                    placeholder={
                                        isAm
                                            ? "ሠራተኛ፣ ጠረጴዛ ወይም ማስታወሻ ይፈልጉ..."
                                            : "Search staff, table, or notes..."
                                    }
                                    value={searchQuery}
                                    onChange={e => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-9 pl-9 text-xs rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Handovers Table */}
                <div className="overflow-hidden rounded-[20px] border border-hairline bg-card shadow-subtle">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[840px] text-left text-[13px]">
                            <thead className="border-b border-hairline bg-secondary/40 text-[11px] font-semibold tracking-wider text-slate-gray uppercase">
                                <tr>
                                    <th className="px-5 py-3">
                                        {isAm ? "ሚና" : "Role"}
                                    </th>
                                    <th className="px-5 py-3">
                                        {isAm
                                            ? "አስረካቢ → ተረካቢ"
                                            : "Outgoing → Incoming"}
                                    </th>
                                    <th className="px-5 py-3">
                                        {isAm ? "ሰዓት" : "Time"}
                                    </th>
                                    <th className="px-5 py-3">
                                        {isAm
                                            ? "ገንዘብ እና የጠረጴዛ ርክክብ"
                                            : "Cash & Table Custody"}
                                    </th>
                                    <th className="px-5 py-3">
                                        {isAm ? "ማስታወሻ" : "Notes"}
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        {isAm ? "ዝርዝር" : "Details"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-xs text-slate-gray"
                                        >
                                            {isAm
                                                ? "የፈረቃ ርክክቦች በመጫን ላይ..."
                                                : "Loading shift handovers..."}
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-xs text-slate-gray"
                                        >
                                            {isAm
                                                ? "ለተመረጡት ማጣሪያዎች ምንም ርክክብ አልተገኘም።"
                                                : "No shift handovers found for the selected filters."}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map(h => {
                                        const varianceNum = Number(
                                            h.varianceAmount ?? 0,
                                        );
                                        const hasVariance =
                                            h.kind === "CASHIER" &&
                                            Math.abs(varianceNum) > 0.01;
                                        return (
                                            <tr
                                                key={h.id}
                                                className="hover:bg-secondary/20 transition-colors"
                                            >
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <Badge
                                                        variant={
                                                            h.kind === "CASHIER"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {h.kind === "CASHIER"
                                                            ? isAm
                                                                ? "ገንዘብ ተቀባይ"
                                                                : "Cashier"
                                                            : isAm
                                                              ? "አስተናጋጅ"
                                                              : "Waiter"}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                        <span>
                                                            {h.outgoingName}
                                                        </span>
                                                        <ArrowRight className="size-3.5 text-slate-gray shrink-0" />
                                                        <span className="text-brand">
                                                            {h.incomingName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-gray font-mono">
                                                    {new Date(
                                                        h.handedOverAt,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs">
                                                    {h.kind === "CASHIER" ? (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span>
                                                                {isAm
                                                                    ? "የተቆጠረ፡ "
                                                                    : "Counted: "}
                                                                <strong className="font-mono text-foreground">
                                                                    {formatEtb(
                                                                        Number(
                                                                            h.countedAmount ??
                                                                                0,
                                                                        ),
                                                                    )}
                                                                </strong>
                                                            </span>
                                                            <span className="text-slate-gray">
                                                                {isAm
                                                                    ? "· መነሻ፡ "
                                                                    : "· Float: "}
                                                                <strong className="font-mono text-foreground">
                                                                    {formatEtb(
                                                                        Number(
                                                                            h.floatForNextCashier ??
                                                                                0,
                                                                        ),
                                                                    )}
                                                                </strong>
                                                            </span>
                                                            <span className="text-slate-gray">
                                                                {isAm
                                                                    ? "· ካዝና፡ "
                                                                    : "· Safe: "}
                                                                <strong className="font-mono text-foreground">
                                                                    {formatEtb(
                                                                        Number(
                                                                            h.safeDropAmount ??
                                                                                0,
                                                                        ),
                                                                    )}
                                                                </strong>
                                                            </span>
                                                            {hasVariance ? (
                                                                <span className="rounded-full bg-destructive-soft px-2 py-0.5 font-mono font-semibold text-destructive">
                                                                    {isAm
                                                                        ? "ልዩነት፡ "
                                                                        : "Var: "}
                                                                    {varianceNum >
                                                                    0
                                                                        ? "+"
                                                                        : ""}
                                                                    {formatEtb(
                                                                        varianceNum,
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                                                                    {isAm
                                                                        ? "ትክክል"
                                                                        : "Balanced"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span>
                                                                {isAm
                                                                    ? "ጥሬ ገንዘብ፡ "
                                                                    : "Cash: "}
                                                                <strong className="font-mono text-foreground">
                                                                    {formatEtb(
                                                                        Number(
                                                                            h.transferredCashAmount ??
                                                                                0,
                                                                        ),
                                                                    )}
                                                                </strong>
                                                            </span>
                                                            <span className="text-slate-gray">
                                                                {isAm
                                                                    ? "· ጠረጴዛዎች፡ "
                                                                    : "· Tables: "}
                                                                <strong className="text-foreground">
                                                                    {h.tablesTransferredCount ??
                                                                        0}
                                                                </strong>
                                                                {h
                                                                    .tablesTransferredNames
                                                                    ?.length
                                                                    ? ` (${h.tablesTransferredNames.join(", ")})`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-gray max-w-[220px] truncate">
                                                    {h.notes || "—"}
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                    <Link
                                                        href={`${basePath}/handovers/${h.id}`}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 rounded-lg px-2.5 text-[11px] font-semibold"
                                                        >
                                                            {isAm
                                                                ? "ዝርዝር እይ"
                                                                : "View Details"}
                                                            <ArrowRight className="ml-1 size-3" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-hairline bg-secondary/20 px-5 py-3 text-xs text-slate-gray">
                        <div>
                            {isAm ? (
                                <>
                                    ከ{" "}
                                    <strong className="text-foreground">
                                        {total}
                                    </strong>{" "}
                                    ርክክቦች{" "}
                                    <strong className="text-foreground">
                                        {startIdx}
                                    </strong>
                                    –
                                    <strong className="text-foreground">
                                        {endIdx}
                                    </strong>{" "}
                                    በማሳየት ላይ
                                </>
                            ) : (
                                <>
                                    Showing{" "}
                                    <strong className="text-foreground">
                                        {startIdx}
                                    </strong>
                                    –
                                    <strong className="text-foreground">
                                        {endIdx}
                                    </strong>{" "}
                                    of{" "}
                                    <strong className="text-foreground">
                                        {total}
                                    </strong>{" "}
                                    handovers
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg px-2.5 text-xs"
                                disabled={currentPage <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="size-3.5 mr-1" />
                                {isAm ? "ቀዳሚ" : "Prev"}
                            </Button>
                            <span className="px-2 font-medium text-foreground">
                                {isAm
                                    ? `ገጽ ${currentPage} ከ ${totalPages}`
                                    : `Page ${currentPage} of ${totalPages}`}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg px-2.5 text-xs"
                                disabled={currentPage >= totalPages}
                                onClick={() =>
                                    setPage(p => Math.min(totalPages, p + 1))
                                }
                            >
                                {isAm ? "ቀጣይ" : "Next"}
                                <ChevronRight className="size-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardFrame>
    );
}
