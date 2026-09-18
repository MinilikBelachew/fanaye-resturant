"use client";

import { useMemo } from "react";
import { Radio, RefreshCw } from "lucide-react";
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
    pendingDropTotal,
    sumPayments,
} from "@/domains/payments/application/cashierMoney";

const POLL = 8000;

export default function CashierHomeStats() {
    const {
        data: paymentsRes,
        isLoading: paymentsLoading,
        isFetching,
        isError,
    } = useCashierPaymentsQuery(undefined, { pollingInterval: POLL });
    const { data: billsRes, isLoading: billsLoading } =
        useCashierBillRequestsQuery(undefined, { pollingInterval: POLL });
    const { data: dropsRes, isLoading: dropsLoading } =
        useCashierCashDropsQuery({ status: "ALL" }, { pollingInterval: POLL });

    const payments = paymentsRes?.data ?? [];
    const bills = billsRes?.data ?? [];
    const drops = dropsRes?.data ?? [];
    const pendingDrops = useMemo(
        () =>
            drops.filter(drop =>
                ["INITIATED", "DISPUTED"].includes(drop.status.toUpperCase()),
            ),
        [drops],
    );

    const totals = useMemo(() => sumPayments(payments), [payments]);
    const channels = useMemo(() => buildPaymentChannels(payments), [payments]);
    const hourly = useMemo(() => buildHourlyCollections(payments), [payments]);
    const trend = useMemo(
        () => buildDailyCollectionsTrend(payments),
        [payments],
    );
    const movement = useMemo(
        () => buildWeeklyCashMovement(payments, drops),
        [payments, drops],
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

    const loading = paymentsLoading || billsLoading || dropsLoading;

    if (loading) {
        return <KpiStatsSkeleton />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] text-slate-gray">
                    Live collections from waiter payments, bill queue, and cash
                    drops
                </p>
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
                    {isError ? "Offline" : "Live"}
                    {isFetching ? (
                        <RefreshCw className="size-3 animate-spin" />
                    ) : null}
                </div>
            </div>

            {isError ? (
                <p className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                    Could not load cashier money telemetry.
                </p>
            ) : null}

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Logged today"
                    value={formatEtb(totals.total)}
                    hint={`${totals.count} payment${totals.count === 1 ? "" : "s"}`}
                    tone="brand"
                    sparkline={{
                        badge: String(totals.count),
                        variant: "wave1",
                    }}
                />
                <KpiCard
                    label="Cash"
                    value={formatEtb(totals.cash)}
                    hint="Collected at table"
                    tone="amber"
                    sparkline={{
                        badge: "cash",
                        color: "#d97706",
                        variant: "wave3",
                    }}
                />
                <KpiCard
                    label="Digital"
                    value={formatEtb(totals.telebirr + totals.bank)}
                    hint="Telebirr and bank"
                    tone="emerald"
                    sparkline={{
                        badge: formatEtb(totals.telebirr).replace("ETB ", ""),
                        color: "#046645",
                        variant: "wave2",
                    }}
                />
                <KpiCard
                    label="Needs desk"
                    value={String(bills.length + pendingDrops.length)}
                    hint={`${bills.length} bills · ${pendingDrops.length} cash drops`}
                    tone="brand"
                    sparkline={{
                        badge: formatEtb(
                            pendingBillsAmount + pendingDropsAmount,
                        ).replace("ETB ", ""),
                        variant: "wave4",
                    }}
                />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Bill queue value"
                    value={formatEtb(pendingBillsAmount)}
                    hint={`${bills.length} waiting to generate`}
                    sparkline={null}
                />
                <KpiCard
                    label="Pending cash drops"
                    value={formatEtb(pendingDropsAmount)}
                    hint={`${pendingDrops.length} awaiting receive`}
                    sparkline={null}
                />
                <KpiCard
                    label="Telebirr"
                    value={formatEtb(totals.telebirr)}
                    hint="Verified digital"
                    sparkline={null}
                />
                <KpiCard
                    label="Bank transfer"
                    value={formatEtb(totals.bank)}
                    hint="Verified transfer"
                    sparkline={null}
                />
            </div>

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
