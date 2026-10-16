"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    ArrowRightLeft,
    LogIn,
    Radio,
    RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import KpiCard from "@/components/custom/organisms/KpiCard";
import {
    CashierMoneyRadarChart,
    HourlySalesChart,
    PaymentChannelsBreakdown,
    PaymentMixPieChart,
    RevenueVsCollectionsChart,
    WeeklyCashMovementChart,
} from "@/components/custom/organisms/Charts";
import {
    useCashierBillRequestsQuery,
    useCashierPaymentsQuery,
} from "@/context/services/billingApi";
import { useCurrentShiftQuery } from "@/context/services/shiftsApi";
import { checkShiftExpiry } from "@/domains/identity/domain/shift";
import { Link } from "@/i18n/navigation";
import { useAppSelector } from "@/context/hooks";
import { useCashierCashDropsQuery } from "@/context/services/cashApi";
import { KpiStatsSkeleton } from "@/components/custom/molecules/Skeletons";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
    buildCashierRadar,
    buildDailyCollectionsTrend,
    buildHourlyCollections,
    buildPaymentChannels,
    buildWeeklyCashMovement,
    paymentsOnDay,
    pendingDropTotal,
    shiftYmd,
    sumPayments,
    todayYmd,
} from "@/domains/payments/application/cashierMoney";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";

export default function CashierHomeStats() {
    const t = useTranslations("cashier");
    const serviceMode = useAppSelector(
        state => state.identity.session?.serviceMode,
    );
    const isBakery = serviceMode === "BAKERY";
    const [selectedDate, setSelectedDate] = useState(todayYmd);
    const rangeFrom = shiftYmd(selectedDate, -6);
    const isToday = selectedDate === todayYmd();
    const pollMs = useRealtimePollMs(15_000);

    const {
        data: paymentsRes,
        isLoading: paymentsLoading,
        isFetching,
        isError,
    } = useCashierPaymentsQuery(
        { from: rangeFrom, to: selectedDate },
        { pollingInterval: pollMs },
    );
    const { data: billsRes, isLoading: billsLoading } =
        useCashierBillRequestsQuery(undefined, {
            pollingInterval: pollMs,
            skip: isBakery,
        });
    const { data: dropsRes, isLoading: dropsLoading } =
        useCashierCashDropsQuery(
            { status: "ALL" },
            { pollingInterval: pollMs, skip: isBakery },
        );
    const { data: currentShift } = useCurrentShiftQuery(undefined, {
        pollingInterval: pollMs || 20_000,
    });

    const payments = paymentsRes?.data ?? [];
    const dayPayments = useMemo(
        () => paymentsOnDay(payments, selectedDate),
        [payments, selectedDate],
    );
    const bills = isToday ? (billsRes?.data ?? []) : [];
    const drops = dropsRes?.data ?? [];
    const pendingDrops = useMemo(
        () =>
            isToday
                ? drops.filter(drop =>
                      ["INITIATED", "DISPUTED"].includes(
                          drop.status.toUpperCase(),
                      ),
                  )
                : [],
        [drops, isToday],
    );

    const totals = useMemo(() => sumPayments(dayPayments), [dayPayments]);
    const channels = useMemo(
        () => buildPaymentChannels(dayPayments),
        [dayPayments],
    );
    const hourly = useMemo(
        () => buildHourlyCollections(dayPayments),
        [dayPayments],
    );
    const trend = useMemo(
        () => buildDailyCollectionsTrend(payments, 7, selectedDate),
        [payments, selectedDate],
    );
    const movement = useMemo(
        () => buildWeeklyCashMovement(payments, drops, 7, selectedDate),
        [payments, drops, selectedDate],
    );
    const pendingBillsAmount = useMemo(
        () =>
            bills.reduce(
                (sum, bill) => sum + Number(bill.estimatedAmount || 0),
                0,
            ),
        [bills],
    );
    const pendingDropsAmount = useMemo(
        () => pendingDropTotal(pendingDrops),
        [pendingDrops],
    );
    const radar = useMemo(
        () =>
            buildCashierRadar({
                cash: totals.cash,
                telebirr: totals.telebirr,
                bank: totals.bank,
                pendingBills: pendingBillsAmount,
                pendingDrops: pendingDropsAmount,
            }),
        [
            totals.cash,
            totals.telebirr,
            totals.bank,
            pendingBillsAmount,
            pendingDropsAmount,
        ],
    );

    const shiftExpiry = useMemo(
        () => checkShiftExpiry(currentShift?.shiftSession),
        [currentShift?.shiftSession],
    );

    const loading =
        paymentsLoading ||
        (!isBakery && billsLoading) ||
        (!isBakery && dropsLoading);
    const yesterday = shiftYmd(todayYmd(), -1);

    if (loading) {
        return <KpiStatsSkeleton />;
    }

    return (
        <div className="space-y-4">
            {currentShift && !currentShift.clockedIn ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card p-4 dark:border-amber-600/30">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="size-5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-foreground">
                                    Cashier Off The Clock
                                </p>
                                {currentShift.upcomingAssignment
                                    ?.definitionName ? (
                                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-semibold">
                                        Scheduled:{" "}
                                        {
                                            currentShift.upcomingAssignment
                                                .definitionName
                                        }
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                You are not clocked in. Active cash drawer
                                custody and bill processing requires an open
                                shift session.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/cashier/shift"
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 dark:bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors self-start sm:self-auto"
                    >
                        <LogIn className="size-3.5" />
                        <span>Clock In / Open Drawer</span>
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>
            ) : null}

            {currentShift?.clockedIn && shiftExpiry.isPast ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-rose-300/80 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-card p-4 dark:border-rose-700/40">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="size-5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-foreground">
                                    Shift Ended at {shiftExpiry.endTime} (
                                    {shiftExpiry.minutesOverdue}m Overtime)
                                </p>
                                <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2.5 py-0.5 text-[10px] font-bold">
                                    Handover Due
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Your scheduled shift window is complete. You can
                                finish remaining pending bills, but please hand
                                over the cash drawer to the next cashier or
                                clock out.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Link
                            href="/cashier/shift"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 dark:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors"
                        >
                            <ArrowRightLeft className="size-3.5" />
                            <span>Handover Drawer</span>
                        </Link>
                        <Link
                            href="/cashier/shift"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                        >
                            <span>Clock Out</span>
                        </Link>
                    </div>
                </div>
            ) : null}

            {serviceMode === "BAKERY" ? (
                <Link
                    href="/cashier/sale"
                    className="flex h-11 items-center justify-between rounded-2xl border border-hairline bg-foreground px-4 text-[13px] font-medium text-background"
                >
                    New sale — tap bread and cakes
                    <span>→</span>
                </Link>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-slate-gray">
                    {t("liveCollectionsHint")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-full border border-hairline bg-card p-0.5">
                        {(
                            [
                                { id: todayYmd(), label: t("today") },
                                { id: yesterday, label: t("yesterday") },
                            ] as const
                        ).map(chip => (
                            <button
                                key={chip.id}
                                type="button"
                                onClick={() => setSelectedDate(chip.id)}
                                className={cn(
                                    "h-7 rounded-full px-2.5 text-[11px] font-medium",
                                    selectedDate === chip.id
                                        ? "bg-foreground text-background"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-gray">
                        {t("businessDay")}
                        <input
                            type="date"
                            max={todayYmd()}
                            value={selectedDate}
                            onChange={e =>
                                setSelectedDate(e.target.value || todayYmd())
                            }
                            className="h-8 rounded-lg border border-hairline bg-card px-2 text-[12px] text-foreground"
                        />
                    </label>
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate-gray",
                            isFetching && "opacity-80",
                        )}
                    >
                        <Radio
                            className={cn(
                                "size-3",
                                isError ? "text-red-500" : "text-emerald-500",
                            )}
                        />
                        {isError ? t("offline") : t("live")}
                        {isFetching ? (
                            <RefreshCw className="size-3 animate-spin" />
                        ) : null}
                    </div>
                </div>
            </div>

            {isError ? (
                <p className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                    {t("telemetryError")}
                </p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    compact
                    label={isToday ? t("loggedToday") : t("logged")}
                    value={formatEtb(totals.total)}
                    hint={t("paymentCount", { count: totals.count })}
                    tone="brand"
                    sparkline={{
                        badge: String(totals.count),
                        variant: "wave1",
                    }}
                />
                <KpiCard
                    compact
                    label={t("cash")}
                    value={formatEtb(totals.cash)}
                    hint={isBakery ? t("cash") : t("collectedAtTable")}
                    tone="amber"
                    sparkline={{
                        badge: "cash",
                        color: "#d97706",
                        variant: "wave3",
                    }}
                />
                <KpiCard
                    compact
                    label={t("digital")}
                    value={formatEtb(totals.telebirr + totals.bank)}
                    hint={t("telebirrAndBank")}
                    tone="emerald"
                    sparkline={{
                        badge: formatEtb(totals.telebirr).replace("ETB ", ""),
                        color: "#046645",
                        variant: "wave2",
                    }}
                />
                {isBakery ? (
                    <KpiCard
                        compact
                        label={t("bankTransfer")}
                        value={formatEtb(totals.bank)}
                        hint={t("verifiedTransfer")}
                        tone="brand"
                        sparkline={{
                            badge: String(totals.count),
                            variant: "wave4",
                        }}
                    />
                ) : (
                    <KpiCard
                        compact
                        label={t("needsDesk")}
                        value={String(bills.length + pendingDrops.length)}
                        hint={
                            isToday
                                ? t("needsDeskHint", {
                                      bills: bills.length,
                                      drops: pendingDrops.length,
                                  })
                                : t("deskQueuesLiveOnly")
                        }
                        tone="brand"
                        sparkline={{
                            badge: formatEtb(
                                pendingBillsAmount + pendingDropsAmount,
                            ).replace("ETB ", ""),
                            variant: "wave4",
                        }}
                    />
                )}
            </div>

            {isBakery ? null : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        compact
                        label={t("billQueueValue")}
                        value={formatEtb(pendingBillsAmount)}
                        hint={t("waitingToGenerateCount", {
                            count: bills.length,
                        })}
                        sparkline={null}
                    />
                    <KpiCard
                        compact
                        label={t("pendingCashDrops")}
                        value={formatEtb(pendingDropsAmount)}
                        hint={t("awaitingReceive", {
                            count: pendingDrops.length,
                        })}
                        sparkline={null}
                    />
                    <KpiCard
                        compact
                        label={t("telebirr")}
                        value={formatEtb(totals.telebirr)}
                        hint={t("verifiedDigital")}
                        sparkline={null}
                    />
                    <KpiCard
                        compact
                        label={t("bankTransfer")}
                        value={formatEtb(totals.bank)}
                        hint={t("verifiedTransfer")}
                        sparkline={null}
                    />
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="min-w-0 lg:col-span-2">
                    <RevenueVsCollectionsChart data={trend} />
                </div>
                <div className="min-w-0">
                    <PaymentMixPieChart channels={channels} />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="min-w-0">
                    <HourlySalesChart data={hourly} />
                </div>
                <div className="min-w-0">
                    <WeeklyCashMovementChart movement={movement} />
                </div>
                <div className="min-w-0">
                    <CashierMoneyRadarChart data={radar} />
                </div>
            </div>

            <div className="min-w-0 lg:max-w-md">
                <PaymentChannelsBreakdown channels={channels} />
            </div>
        </div>
    );
}
