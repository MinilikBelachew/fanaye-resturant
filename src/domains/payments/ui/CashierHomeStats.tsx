"use client";

import { useAppSelector } from "@/context/hooks";
import KpiCard from "@/components/custom/organisms/KpiCard";
import { formatEtb } from "@/lib/money";
import {
    selectBillRequestSessions,
    selectPaymentTotals,
} from "@/domains/payments/application/selectors";

export default function CashierHomeStats() {
    const bills = useAppSelector(selectBillRequestSessions);
    const totals = useAppSelector(selectPaymentTotals);

    return (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
                label="Bill requests"
                value={String(bills.length)}
                hint="Waiting for waiter collection"
            />
            <KpiCard
                label="Total logged"
                value={formatEtb(totals.total)}
                hint={`${totals.count} payment${totals.count === 1 ? "" : "s"}`}
                tone="brand"
            />
            <KpiCard
                label="Cash"
                value={formatEtb(totals.cash)}
                hint="Collected at the table"
            />
            <KpiCard
                label="Digital"
                value={formatEtb(totals.telebirr + totals.bank)}
                hint="Telebirr and bank"
            />
        </div>
    );
}
