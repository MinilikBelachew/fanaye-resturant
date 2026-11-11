"use client";

import React, { useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import { useLocale, useTranslations } from "next-intl";
import {
    AlertTriangle,
    ArrowDownRight,
    CheckCircle2,
    Clock,
    DollarSign,
    Filter,
    HelpCircle,
    Landmark,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    User,
    Wallet,
    X,
    CalendarDays,
} from "lucide-react";
import DualCalendarDatePicker from "@/components/custom/molecules/DualCalendarDatePicker";
import { formatDateRangeLabel } from "@/lib/ethiopian-calendar";
import {
    useGetCashCustodyOverviewQuery,
    useResolveCashDropDisputeMutation,
} from "@/context/services/cashApi";
import type {
    CashDropOverviewItem,
    WaiterCustodyItem,
    CashierDrawerItem,
} from "@/domains/cash/domain/cashApi";
import { formatEtb } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface CashCustodyBoardProps {
    isOwner?: boolean;
}

export default function CashCustodyBoard({
    isOwner = false,
}: CashCustodyBoardProps) {
    const locale = useLocale();
    const isAmharic = locale === "am";

    const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
    const [selectedDate, setSelectedDate] = useState<string>("TODAY");
    const [customFromDate, setCustomFromDate] = useState<string>("");
    const [customToDate, setCustomToDate] = useState<string>("");
    const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<
        "waiters" | "cashiers" | "drops"
    >("waiters");
    const [dropStatusFilter, setDropStatusFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Dispute modal state
    const [selectedDisputeDrop, setSelectedDisputeDrop] =
        useState<CashDropOverviewItem | null>(null);

    const { data, isLoading, isFetching, refetch } =
        useGetCashCustodyOverviewQuery(
            {
                branchId: selectedBranch,
                dateFilter: selectedDate,
                ...(selectedDate === "CUSTOM" && customFromDate
                    ? {
                          fromDate: customFromDate,
                          toDate: customToDate || customFromDate,
                      }
                    : {}),
            },
            { pollingInterval: 10000 },
        );

    const summary = data?.summary ?? {
        totalWaiterUndropped: "0.00",
        totalCashierDrawer: "0.00",
        totalDroppedToday: "0.00",
        activeDisputesCount: 0,
        activeWaitersCount: 0,
        activeCashiersCount: 0,
    };

    const branches = data?.branches ?? [];
    const waiters = data?.waiters ?? [];
    const cashiers = data?.cashiers ?? [];
    const drops = data?.recentDrops ?? [];

    // Filtered drops list
    const filteredDrops = drops.filter(drop => {
        if (dropStatusFilter !== "ALL") {
            if (
                dropStatusFilter === "DISPUTED" &&
                drop.status !== "DISPUTED" &&
                !drop.disputeId
            )
                return false;
            if (dropStatusFilter === "INITIATED" && drop.status !== "INITIATED")
                return false;
            if (
                dropStatusFilter === "RECEIVED" &&
                drop.status !== "RECEIVED" &&
                drop.status !== "RESOLVED"
            )
                return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchWaiter = drop.waiterName.toLowerCase().includes(q);
            const matchCashier = (drop.cashierName || "")
                .toLowerCase()
                .includes(q);
            const matchBranch = drop.branchName.toLowerCase().includes(q);
            return matchWaiter || matchCashier || matchBranch;
        }
        return true;
    });

    const formatTime = (iso?: string | null) => {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-hairline/60 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Wallet className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                {isAmharic
                                    ? "የጥሬ ገንዘብ ቁጥጥር እና ክትትል"
                                    : "Cash Custody & Oversight"}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isAmharic
                                    ? "የአስተናጋጆች የኪስ ገንዘብ፣ የገንዘብ ተቀባይ መሳቢያዎች እና የጥሬ ገንዘብ ዝውውሮች ክትትል"
                                    : "Real-time visibility over waiter cash-in-hand, cashier drawers, and custody transfers."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Branch Filter (for Owner or multi-branch) */}
                    {(isOwner || data?.isOwner) && branches.length > 0 ? (
                        <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 py-1.5 shadow-2xs">
                            <span className="text-[11px] font-medium text-muted-foreground">
                                {isAmharic ? "ቅርንጫፍ:" : "Branch:"}
                            </span>
                            <select
                                value={selectedBranch}
                                onChange={e =>
                                    setSelectedBranch(e.target.value)
                                }
                                className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
                            >
                                <option
                                    value="ALL"
                                    className="bg-card text-foreground"
                                >
                                    {isAmharic ? "ሁሉም ቅርንጫፎች" : "All Branches"}
                                </option>
                                {branches.map(b => (
                                    <option
                                        key={b.id}
                                        value={b.id}
                                        className="bg-card text-foreground"
                                    >
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {/* Date Window & Custom Range Picker */}
                    <div className="relative flex items-center gap-1 rounded-xl border border-hairline bg-card p-1 shadow-2xs">
                        {[
                            { id: "TODAY", labelEn: "Today", labelAm: "ዛሬ" },
                            {
                                id: "YESTERDAY",
                                labelEn: "Yesterday",
                                labelAm: "ትናንት",
                            },
                            {
                                id: "LAST_7_DAYS",
                                labelEn: "7 Days",
                                labelAm: "7 ቀናት",
                            },
                            { id: "ALL", labelEn: "All", labelAm: "ሁሉም" },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                    setSelectedDate(opt.id);
                                    setDatePickerOpen(false);
                                }}
                                className={cn(
                                    "px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer",
                                    selectedDate === opt.id
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {isAmharic ? opt.labelAm : opt.labelEn}
                            </button>
                        ))}

                        {/* Reusable Dual Calendar Date Picker trigger */}
                        <button
                            type="button"
                            onClick={() => setDatePickerOpen(open => !open)}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer border",
                                selectedDate === "CUSTOM"
                                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
                            )}
                        >
                            <CalendarDays className="size-3.5" />
                            <span>
                                {selectedDate === "CUSTOM" && customFromDate
                                    ? formatDateRangeLabel(
                                          customFromDate,
                                          customToDate || customFromDate,
                                          "ETHIOPIAN",
                                          isAmharic,
                                      )
                                    : isAmharic
                                      ? "ብጁ ቀን"
                                      : "Custom"}
                            </span>
                        </button>

                        {/* Popover Calendar */}
                        {datePickerOpen && (
                            <div className="absolute right-0 top-full mt-2 z-50">
                                <DualCalendarDatePicker
                                    variant="popover"
                                    align="right"
                                    defaultSelectionMode="range"
                                    from={customFromDate || undefined}
                                    to={customToDate || undefined}
                                    applyLabel={
                                        isAmharic ? "ተግብር" : "Apply Range"
                                    }
                                    clearLabel={isAmharic ? "አጽዳ" : "Clear"}
                                    onApply={({ from, to }) => {
                                        setCustomFromDate(from);
                                        setCustomToDate(to);
                                        setSelectedDate("CUSTOM");
                                        setDatePickerOpen(false);
                                    }}
                                    onClear={() => {
                                        setCustomFromDate("");
                                        setCustomToDate("");
                                        setSelectedDate("TODAY");
                                        setDatePickerOpen(false);
                                    }}
                                    onDismiss={() => setDatePickerOpen(false)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="h-8 gap-1.5 rounded-xl border-hairline text-xs font-medium cursor-pointer"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin text-primary",
                            )}
                        />
                        <span>{isAmharic ? "አድስ" : "Refresh"}</span>
                    </Button>
                </div>
            </div>

            {/* Top KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Cash in Waiters' Hands */}
                <div className="rounded-2xl border border-hairline bg-card p-4 shadow-2xs relative overflow-hidden transition-all hover:border-hairline/80 hover:shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAmharic
                                ? "በአስተናጋጆች እጅ ያለ ገንዘብ"
                                : "Cash on Waiters"}
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Wallet className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                            {formatEtb(Number(summary.totalWaiterUndropped))}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] font-medium"
                            >
                                {summary.activeWaitersCount}{" "}
                                {isAmharic ? "አስተናጋጆች" : "waiters active"}
                            </Badge>
                            <span>
                                {isAmharic
                                    ? "ያልተረከበ የኪስ ገንዘብ"
                                    : "undropped pouch cash"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Cash in Cashier Drawers */}
                <div className="rounded-2xl border border-hairline bg-card p-4 shadow-2xs relative overflow-hidden transition-all hover:border-hairline/80 hover:shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAmharic
                                ? "በገንዘብ ተቀባይ መሳቢያ ያለ"
                                : "Cash in Tills / Drawers"}
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Landmark className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                            {formatEtb(Number(summary.totalCashierDrawer))}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] font-medium"
                            >
                                {summary.activeCashiersCount}{" "}
                                {isAmharic ? "መሳቢያዎች" : "active tills"}
                            </Badge>
                            <span>
                                {isAmharic
                                    ? "መነሻ + የተረከቡት"
                                    : "float + received drops"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Total Dropped Today */}
                <div className="rounded-2xl border border-hairline bg-card p-4 shadow-2xs relative overflow-hidden transition-all hover:border-hairline/80 hover:shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAmharic
                                ? selectedDate === "TODAY"
                                    ? "ዛሬ የተረከበ ጥሬ ገንዘብ"
                                    : selectedDate === "YESTERDAY"
                                      ? "ትናንት የተረከበ ጥሬ ገንዘብ"
                                      : "በተመረጠው ጊዜ የተረከበ"
                                : selectedDate === "TODAY"
                                  ? "Dropped to Cashier Today"
                                  : selectedDate === "YESTERDAY"
                                    ? "Dropped to Cashier Yesterday"
                                    : "Dropped to Cashier in Period"}
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <ArrowDownRight className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                            {formatEtb(Number(summary.totalDroppedToday))}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {isAmharic
                                ? "በተሳካ ሁኔታ የተረጋገጡ ዝውውሮች"
                                : "Successfully verified drop transfers"}
                        </p>
                    </div>
                </div>

                {/* 4. Active Disputes */}
                <div className="rounded-2xl border border-hairline bg-card p-4 shadow-2xs relative overflow-hidden transition-all hover:border-hairline/80 hover:shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAmharic ? "ያልተፈቱ አለመግባባቶች" : "Active Disputes"}
                        </span>
                        <div
                            className={cn(
                                "flex size-8 items-center justify-center rounded-xl",
                                summary.activeDisputesCount > 0
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            <AlertTriangle className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                            {summary.activeDisputesCount}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {summary.activeDisputesCount > 0
                                ? isAmharic
                                    ? "የአስተዳዳሪ ውሳኔ የሚጠብቁ ልዩነቶች"
                                    : "Drops with variance requiring resolution"
                                : isAmharic
                                  ? "ምንም የገንዘብ ልዩነት የለም"
                                  : "Zero discrepancies flagged"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-hairline/80">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("waiters")}
                        className={cn(
                            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer",
                            activeTab === "waiters"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <User className="size-4" />
                        <span>
                            {isAmharic
                                ? "አስተናጋጆች (የኪስ ገንዘብ)"
                                : "Waiters (Cash in Hand)"}
                        </span>
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                        >
                            {waiters.length}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("cashiers")}
                        className={cn(
                            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer",
                            activeTab === "cashiers"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Landmark className="size-4" />
                        <span>
                            {isAmharic
                                ? "የገንዘብ ተቀባይ መሳቢያዎች"
                                : "Cashier Drawers / Tills"}
                        </span>
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                        >
                            {cashiers.length}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("drops")}
                        className={cn(
                            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer",
                            activeTab === "drops"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <ArrowDownRight className="size-4" />
                        <span>
                            {isAmharic
                                ? "የጥሬ ገንዘብ ዝውውሮች እና ልዩነቶች"
                                : "Cash Drops & Disputes"}
                        </span>
                        {summary.activeDisputesCount > 0 ? (
                            <span className="flex size-2 rounded-full bg-rose-500 animate-pulse" />
                        ) : null}
                    </button>
                </div>
            </div>

            {/* TAB CONTENT */}

            {/* 1. WAITERS POUCH TAB */}
            {activeTab === "waiters" && (
                <div className="rounded-2xl border border-hairline bg-card overflow-hidden shadow-2xs">
                    <div className="p-4 border-b border-hairline/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                {isAmharic
                                    ? "የአስተናጋጆች የቀጥታ የጥሬ ገንዘብ ሁኔታ"
                                    : "Live Waiter Cash-in-Hand Monitor"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {isAmharic
                                    ? "በአሁኑ ሰዓት በስራ ላይ ያሉ አስተናጋጆች ከጠረጴዛዎች የሰበሰቡት እና በእጃቸው ያለው ገንዘብ"
                                    : "Active waiters on shift, total cash collected from tables, and current pocket balance."}
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            <RestorchSpinner className="size-6 mx-auto text-primary mb-2" />
                            {isAmharic
                                ? "የአስተናጋጆች መረጃ በመጫን ላይ..."
                                : "Loading waiter cash pouches..."}
                        </div>
                    ) : waiters.length === 0 ? (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            <User className="size-8 mx-auto text-muted-foreground/40 mb-2 stroke-[1.5]" />
                            <p className="font-medium text-foreground">
                                {isAmharic
                                    ? "በአሁኑ ሰዓት በስራ ላይ ያለ አስተናጋጅ የለም"
                                    : "No waiters currently on active shift"}
                            </p>
                            <p className="text-xs mt-1">
                                {isAmharic
                                    ? "አስተናጋጆች ሲገቡ እዚህ በቀጥታ ይታያሉ።"
                                    : "Waiters will appear here as soon as they clock in."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-hairline bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">
                                            {isAmharic ? "አስተናጋጅ" : "Waiter"}
                                        </th>
                                        <th className="py-3 px-4">
                                            {isAmharic ? "ቅርንጫፍ" : "Branch"}
                                        </th>
                                        <th className="py-3 px-4">
                                            {isAmharic
                                                ? "የገባበት ሰዓት"
                                                : "Clocked In"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "የተሰበሰበ"
                                                : "Cash Collected"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "የተረከበ"
                                                : "Dropped to Cashier"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "በሂደት ላይ ያለ"
                                                : "Pending Drop"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "በእጅ ያለ ገንዘብ"
                                                : "Cash in Pocket"}
                                        </th>
                                        <th className="py-3 px-4 text-center">
                                            {isAmharic ? "ሁኔታ" : "Risk Level"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {waiters.map(waiter => {
                                        const undropped = Number(
                                            waiter.undroppedCash,
                                        );
                                        return (
                                            <tr
                                                key={waiter.shiftSessionId}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-8 rounded-full border border-hairline bg-secondary/50 flex items-center justify-center font-bold text-xs text-foreground">
                                                            {waiter.waiterName
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-foreground text-sm">
                                                                {
                                                                    waiter.waiterName
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-medium text-muted-foreground">
                                                    {waiter.branchName}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {formatTime(
                                                        waiter.clockInAt,
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-foreground">
                                                    {formatEtb(
                                                        Number(
                                                            waiter.cashCollected,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                                    {formatEtb(
                                                        Number(
                                                            waiter.cashDropped,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400 font-medium">
                                                    {Number(
                                                        waiter.pendingDropAmount,
                                                    ) > 0
                                                        ? formatEtb(
                                                              Number(
                                                                  waiter.pendingDropAmount,
                                                              ),
                                                          )
                                                        : "—"}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-sm">
                                                    <span
                                                        className={cn(
                                                            undropped >= 5000
                                                                ? "text-rose-600 dark:text-rose-400"
                                                                : undropped >=
                                                                    2000
                                                                  ? "text-amber-600 dark:text-amber-400"
                                                                  : "text-foreground",
                                                        )}
                                                    >
                                                        {formatEtb(undropped)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {waiter.riskLevel ===
                                                    "CRITICAL" ? (
                                                        <Badge
                                                            variant="danger"
                                                            className="px-2 py-0.5 text-[10px] gap-1 font-semibold"
                                                        >
                                                            <ShieldAlert className="size-3" />
                                                            {isAmharic
                                                                ? "ከፍተኛ ጥሬ ገንዘብ"
                                                                : "High Cash (>5k)"}
                                                        </Badge>
                                                    ) : waiter.riskLevel ===
                                                      "ELEVATED" ? (
                                                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] gap-1 font-semibold">
                                                            <AlertTriangle className="size-3" />
                                                            {isAmharic
                                                                ? "ማስጠንቀቂያ (>2k)"
                                                                : "Drop Advised"}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[10px] gap-1 font-semibold">
                                                            <ShieldCheck className="size-3" />
                                                            {isAmharic
                                                                ? "ደህንነቱ የተጠበቀ"
                                                                : "Safe"}
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 2. CASHIERS TILLS TAB */}
            {activeTab === "cashiers" && (
                <div className="rounded-2xl border border-hairline bg-card overflow-hidden shadow-2xs">
                    <div className="p-4 border-b border-hairline/60 bg-muted/20">
                        <h3 className="text-sm font-bold text-foreground">
                            {isAmharic
                                ? "የገንዘብ ተቀባዮች መሳቢያዎች እና መነሻ ገንዘብ"
                                : "Active Cashier Tills & Float Balances"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {isAmharic
                                ? "በአሁኑ ሰዓት ክፍት የሆኑ የገንዘብ ተቀባይ መሳቢያዎች፣ መነሻ ገንዘብ (Float) እና የተረከቡት ጥሬ ገንዘብ"
                                : "Live tills currently open, initial float, waiter drops absorbed, and calculated till balance."}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            <RestorchSpinner className="size-6 mx-auto text-primary mb-2" />
                            {isAmharic
                                ? "የመሳቢያዎች መረጃ በመጫን ላይ..."
                                : "Loading cashier drawer sessions..."}
                        </div>
                    ) : cashiers.length === 0 ? (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            <Landmark className="size-8 mx-auto text-muted-foreground/40 mb-2 stroke-[1.5]" />
                            <p className="font-medium text-foreground">
                                {isAmharic
                                    ? "ክፍት የሆነ የገንዘብ ተቀባይ መሳቢያ የለም"
                                    : "No open cashier drawers currently"}
                            </p>
                            <p className="text-xs mt-1">
                                {isAmharic
                                    ? "ገንዘብ ተቀባዮች ሲገቡ እዚህ በቀጥታ ይታያሉ።"
                                    : "Cashier drawers will show here once opened."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-hairline bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">
                                            {isAmharic
                                                ? "ገንዘብ ተቀባይ"
                                                : "Cashier"}
                                        </th>
                                        <th className="py-3 px-4">
                                            {isAmharic ? "ቅርንጫፍ" : "Branch"}
                                        </th>
                                        <th className="py-3 px-4">
                                            {isAmharic
                                                ? "የተከፈተበት ሰዓት"
                                                : "Opened At"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "መነሻ ገንዘብ (Float)"
                                                : "Opening Float"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "ከአስተናጋጅ የተረከበው"
                                                : "Drops Received"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "ቀጥታ ሽያጭ"
                                                : "Direct Cash Sales"}
                                        </th>
                                        <th className="py-3 px-4 text-right">
                                            {isAmharic
                                                ? "በመሳቢያው የሚጠበቅ ጠቅላላ"
                                                : "Expected Till Total"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {cashiers.map(cashier => (
                                        <tr
                                            key={cashier.sessionId}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-8 rounded-full border border-hairline bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                                        <Landmark className="size-4" />
                                                    </div>
                                                    <div className="font-semibold text-foreground text-sm">
                                                        {cashier.cashierName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-muted-foreground">
                                                {cashier.branchName}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {formatTime(cashier.openedAt)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-foreground">
                                                {formatEtb(
                                                    Number(
                                                        cashier.openingFloat,
                                                    ),
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                                {formatEtb(
                                                    Number(
                                                        cashier.dropsReceived,
                                                    ),
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-foreground">
                                                {formatEtb(
                                                    Number(
                                                        cashier.directCashSales,
                                                    ),
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-sm text-foreground">
                                                {formatEtb(
                                                    Number(
                                                        cashier.expectedDrawerCash,
                                                    ),
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 3. CASH DROPS & DISPUTES TAB */}
            {activeTab === "drops" && (
                <div className="rounded-2xl border border-hairline bg-card overflow-hidden shadow-2xs space-y-4 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                {isAmharic
                                    ? "የጥሬ ገንዘብ ዝውውሮች መዝገብ"
                                    : "Cash Drop Transfers & Dispute Log"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {isAmharic
                                    ? "ከአስተናጋጅ ወደ ገንዘብ ተቀባይ የተደረጉ ዝውውሮች እና የገንዘብ ልዩነቶች"
                                    : "All waiter-to-cashier handover drops and discrepancy variance audit."}
                            </p>
                        </div>

                        {/* Search & Status Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={e =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder={
                                        isAmharic
                                            ? "ፈልግ (አስተናጋጅ / ገንዘብ ተቀባይ)..."
                                            : "Search drops..."
                                    }
                                    className="h-8 w-44 pl-8 text-xs rounded-lg"
                                />
                            </div>

                            <div className="flex items-center gap-1 rounded-lg border border-hairline bg-muted/40 p-0.5 text-xs">
                                {[
                                    {
                                        id: "ALL",
                                        label: isAmharic ? "ሁሉም" : "All",
                                    },
                                    {
                                        id: "INITIATED",
                                        label: isAmharic
                                            ? "በሂደት ላይ"
                                            : "Pending",
                                    },
                                    {
                                        id: "RECEIVED",
                                        label: isAmharic ? "የተረከበ" : "Accepted",
                                    },
                                    {
                                        id: "DISPUTED",
                                        label: isAmharic
                                            ? "ልዩነት ያለበት"
                                            : "Disputed",
                                    },
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        type="button"
                                        onClick={() =>
                                            setDropStatusFilter(status.id)
                                        }
                                        className={cn(
                                            "px-2.5 py-1 font-medium rounded-md transition-all cursor-pointer",
                                            dropStatusFilter === status.id
                                                ? "bg-card text-foreground shadow-xs font-semibold"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filteredDrops.length === 0 ? (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            <ArrowDownRight className="size-8 mx-auto text-muted-foreground/40 mb-2 stroke-[1.5]" />
                            <p className="font-medium text-foreground">
                                {isAmharic
                                    ? "ምንም የጥሬ ገንዘብ ዝውውር አልተገኘም"
                                    : "No cash drops matching criteria"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-hairline rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-hairline bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-3">
                                            {isAmharic ? "ሰዓት" : "Time"}
                                        </th>
                                        <th className="py-3 px-3">
                                            {isAmharic ? "አስተናጋጅ" : "Waiter"}
                                        </th>
                                        <th className="py-3 px-3">
                                            {isAmharic
                                                ? "ገንዘብ ተቀባይ"
                                                : "Cashier"}
                                        </th>
                                        <th className="py-3 px-3">
                                            {isAmharic ? "ቅርንጫፍ" : "Branch"}
                                        </th>
                                        <th className="py-3 px-3 text-right">
                                            {isAmharic ? "የተጠየቀው" : "Declared"}
                                        </th>
                                        <th className="py-3 px-3 text-right">
                                            {isAmharic ? "የተቆጠረው" : "Counted"}
                                        </th>
                                        <th className="py-3 px-3 text-right">
                                            {isAmharic ? "ልዩነት" : "Variance"}
                                        </th>
                                        <th className="py-3 px-3 text-center">
                                            {isAmharic ? "ሁኔታ" : "Status"}
                                        </th>
                                        <th className="py-3 px-3 text-right">
                                            {isAmharic ? "እርምጃ" : "Action"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {filteredDrops.map(drop => {
                                        const isDisputed =
                                            drop.status === "DISPUTED" ||
                                            Boolean(
                                                drop.disputeId &&
                                                    drop.disputeStatus ===
                                                        "OPEN",
                                            );
                                        const varianceNum = drop.variance
                                            ? Number(drop.variance)
                                            : 0;

                                        return (
                                            <tr
                                                key={drop.id}
                                                className={cn(
                                                    "hover:bg-muted/30 transition-colors",
                                                    isDisputed &&
                                                        "bg-rose-500/5",
                                                )}
                                            >
                                                <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                                                    {formatTime(
                                                        drop.initiatedAt,
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 font-semibold text-foreground">
                                                    {drop.waiterName}
                                                </td>
                                                <td className="py-3 px-3 text-muted-foreground">
                                                    {drop.cashierName || "—"}
                                                </td>
                                                <td className="py-3 px-3 text-muted-foreground">
                                                    {drop.branchName}
                                                </td>
                                                <td className="py-3 px-3 text-right font-medium text-foreground">
                                                    {formatEtb(
                                                        Number(
                                                            drop.declaredAmount,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-right font-medium text-foreground">
                                                    {drop.countedAmount
                                                        ? formatEtb(
                                                              Number(
                                                                  drop.countedAmount,
                                                              ),
                                                          )
                                                        : "—"}
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold">
                                                    {drop.variance ? (
                                                        <span
                                                            className={cn(
                                                                varianceNum < 0
                                                                    ? "text-rose-600 dark:text-rose-400"
                                                                    : "text-emerald-600 dark:text-emerald-400",
                                                            )}
                                                        >
                                                            {varianceNum > 0
                                                                ? "+"
                                                                : ""}
                                                            {formatEtb(
                                                                varianceNum,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {drop.status ===
                                                    "RECEIVED" ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[10px] gap-1">
                                                            <CheckCircle2 className="size-3" />
                                                            {isAmharic
                                                                ? "የተረከበ"
                                                                : "Accepted"}
                                                        </Badge>
                                                    ) : drop.status ===
                                                      "DISPUTED" ? (
                                                        <Badge
                                                            variant="danger"
                                                            className="text-[10px] gap-1 font-semibold animate-pulse"
                                                        >
                                                            <AlertTriangle className="size-3" />
                                                            {isAmharic
                                                                ? "ልዩነት ያለበት"
                                                                : "Disputed"}
                                                        </Badge>
                                                    ) : drop.status ===
                                                      "RESOLVED" ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] gap-1"
                                                        >
                                                            {isAmharic
                                                                ? "የተፈታ"
                                                                : "Resolved"}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 text-[10px] gap-1">
                                                            <Clock className="size-3" />
                                                            {isAmharic
                                                                ? "በሂደት ላይ"
                                                                : "Pending Count"}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    {isDisputed ? (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                setSelectedDisputeDrop(
                                                                    drop,
                                                                )
                                                            }
                                                            className="h-7 text-xs px-2.5 font-semibold shadow-xs cursor-pointer"
                                                        >
                                                            {isAmharic
                                                                ? "ልዩነት ፍታ"
                                                                : "Resolve Dispute"}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* DISPUTE RESOLUTION MODAL */}
            {selectedDisputeDrop && (
                <DisputeResolutionModal
                    drop={selectedDisputeDrop}
                    isOpen={Boolean(selectedDisputeDrop)}
                    onClose={() => setSelectedDisputeDrop(null)}
                    isAmharic={isAmharic}
                    onResolved={() => {
                        setSelectedDisputeDrop(null);
                        void refetch();
                    }}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// DISPUTE RESOLUTION MODAL COMPONENT
// ---------------------------------------------------------------------------

interface DisputeResolutionModalProps {
    drop: CashDropOverviewItem;
    isOpen: boolean;
    onClose: () => void;
    onResolved: () => void;
    isAmharic: boolean;
}

function DisputeResolutionModal({
    drop,
    isOpen,
    onClose,
    onResolved,
    isAmharic,
}: DisputeResolutionModalProps) {
    const [resolution, setResolution] = useState<
        "ACCEPT_COUNTED" | "ACCEPT_DECLARED" | "OTHER_APPROVED_AMOUNT"
    >("ACCEPT_COUNTED");
    const [customAmount, setCustomAmount] = useState<string>(
        drop.countedAmount || drop.declaredAmount,
    );
    const [note, setNote] = useState<string>("");

    const [resolveDispute, { isLoading: isResolving }] =
        useResolveCashDropDisputeMutation();

    if (!isOpen) return null;

    const declared = Number(drop.declaredAmount);
    const counted = Number(drop.countedAmount || 0);
    const variance = Number(drop.variance || counted - declared);

    async function handleResolve() {
        if (!drop.disputeId) {
            toast.error(
                isAmharic
                    ? "የክርክር መለያ አልተገኘም"
                    : "No dispute ID found for this drop.",
            );
            return;
        }

        try {
            await resolveDispute({
                disputeId: drop.disputeId,
                resolution,
                resolutionAmount:
                    resolution === "OTHER_APPROVED_AMOUNT"
                        ? Number(customAmount).toFixed(2)
                        : undefined,
                resolutionNote: note.trim() || undefined,
            }).unwrap();

            toast.success(
                isAmharic
                    ? "የገንዘብ ልዩነት በተሳካ ሁኔታ ተፈትቷል"
                    : "Cash dispute resolved successfully.",
            );
            onResolved();
        } catch (err) {
            toast.fromUnknown(
                err,
                isAmharic ? "ውሳኔውን ማስቀመጥ አልተቻለም" : "Failed to resolve dispute.",
            );
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-card shadow-2xl p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">
                                {isAmharic
                                    ? "የጥሬ ገንዘብ ልዩነት ውሳኔ"
                                    : "Resolve Cash Drop Discrepancy"}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {drop.waiterName} &rarr;{" "}
                                {drop.cashierName ||
                                    (isAmharic ? "ገንዘብ ተቀባይ" : "Cashier")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Discrepancy Breakdown Box */}
                <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-hairline bg-muted/30 p-3.5 text-center">
                    <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            {isAmharic ? "አስተናጋጁ የጠየቀው" : "Waiter Claimed"}
                        </span>
                        <div className="text-sm font-bold text-foreground mt-0.5">
                            {formatEtb(declared)}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            {isAmharic ? "ገንዘብ ተቀባይ የቆጠረው" : "Cashier Counted"}
                        </span>
                        <div className="text-sm font-bold text-foreground mt-0.5">
                            {formatEtb(counted)}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            {isAmharic ? "ልዩነት" : "Variance"}
                        </span>
                        <div
                            className={cn(
                                "text-sm font-bold mt-0.5",
                                variance < 0
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-emerald-600 dark:text-emerald-400",
                            )}
                        >
                            {variance > 0 ? "+" : ""}
                            {formatEtb(variance)}
                        </div>
                    </div>
                </div>

                {drop.disputeReason ? (
                    <div className="rounded-xl border border-hairline bg-amber-500/5 p-3 text-xs text-foreground">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {isAmharic ? "የተገለጸ ምክንያት፡ " : "Note: "}
                        </span>
                        <span>{drop.disputeReason}</span>
                    </div>
                ) : null}

                {/* Resolution Choice */}
                <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-foreground">
                        {isAmharic ? "የአስተዳዳሪ ውሳኔ" : "Resolution Decision"}
                    </label>

                    <div className="space-y-2 text-xs">
                        {/* Option 1: Accept Counted */}
                        <label
                            className={cn(
                                "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                                resolution === "ACCEPT_COUNTED"
                                    ? "border-primary bg-primary/5 text-foreground font-medium"
                                    : "border-hairline hover:bg-muted/30 text-muted-foreground",
                            )}
                        >
                            <input
                                type="radio"
                                name="res-choice"
                                checked={resolution === "ACCEPT_COUNTED"}
                                onChange={() => setResolution("ACCEPT_COUNTED")}
                                className="mt-0.5"
                            />
                            <div>
                                <span className="font-semibold text-foreground">
                                    {isAmharic
                                        ? `የገንዘብ ተቀባዩን ቁጥር ተቀበል (${formatEtb(counted)})`
                                        : `Accept Cashier's Physical Count (${formatEtb(counted)})`}
                                </span>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {isAmharic
                                        ? "የጎደለው ወይም የተረፈው ገንዘብ እንደ የፈረቃ ልዩነት ይመዘገባል።"
                                        : "Tills will balance with the actual physical cash received."}
                                </p>
                            </div>
                        </label>

                        {/* Option 2: Accept Declared */}
                        <label
                            className={cn(
                                "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                                resolution === "ACCEPT_DECLARED"
                                    ? "border-primary bg-primary/5 text-foreground font-medium"
                                    : "border-hairline hover:bg-muted/30 text-muted-foreground",
                            )}
                        >
                            <input
                                type="radio"
                                name="res-choice"
                                checked={resolution === "ACCEPT_DECLARED"}
                                onChange={() =>
                                    setResolution("ACCEPT_DECLARED")
                                }
                                className="mt-0.5"
                            />
                            <div>
                                <span className="font-semibold text-foreground">
                                    {isAmharic
                                        ? `የአስተናጋጁን ጥያቄ ተቀበል (${formatEtb(declared)})`
                                        : `Accept Waiter's Declared Amount (${formatEtb(declared)})`}
                                </span>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {isAmharic
                                        ? "አስተናጋጁ ሙሉውን ገንዘብ እንዳስረከበ ይቆጠራል።"
                                        : "Waiter is credited with the full declared drop amount."}
                                </p>
                            </div>
                        </label>

                        {/* Option 3: Other Custom Amount */}
                        <label
                            className={cn(
                                "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                                resolution === "OTHER_APPROVED_AMOUNT"
                                    ? "border-primary bg-primary/5 text-foreground font-medium"
                                    : "border-hairline hover:bg-muted/30 text-muted-foreground",
                            )}
                        >
                            <input
                                type="radio"
                                name="res-choice"
                                checked={resolution === "OTHER_APPROVED_AMOUNT"}
                                onChange={() =>
                                    setResolution("OTHER_APPROVED_AMOUNT")
                                }
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <span className="font-semibold text-foreground">
                                    {isAmharic
                                        ? "ብጁ የተፈቀደ መጠን"
                                        : "Custom Approved Settlement"}
                                </span>
                                {resolution === "OTHER_APPROVED_AMOUNT" && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={customAmount}
                                            onChange={e =>
                                                setCustomAmount(e.target.value)
                                            }
                                            placeholder="0.00"
                                            className="h-8 text-xs font-mono w-36"
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            ETB
                                        </span>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                {/* Manager Notes */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                        {isAmharic
                            ? "የአስተዳዳሪ ማስታወሻ (አማራጭ)"
                            : "Manager Resolution Note"}
                    </label>
                    <Textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder={
                            isAmharic
                                ? "ለምሳሌ፡ ገንዘቡ በአስተናጋጁ ኪስ ውስጥ ተገኝቶ ተስተካክሏል..."
                                : "e.g., Shortage confirmed and paid back by staff..."
                        }
                        className="text-xs min-h-[60px] rounded-xl"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline/60">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={isResolving}
                        className="h-9 cursor-pointer"
                    >
                        {isAmharic ? "ይቅር" : "Cancel"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleResolve}
                        disabled={isResolving}
                        className="h-9 gap-1.5 font-semibold cursor-pointer"
                    >
                        {isResolving ? (
                            <>
                                <RestorchSpinner className="size-4 " />
                                {isAmharic
                                    ? "በማስቀመጥ ላይ..."
                                    : "Saving resolution..."}
                            </>
                        ) : isAmharic ? (
                            "ውሳኔ አጽድቅ"
                        ) : (
                            "Confirm Resolution"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
