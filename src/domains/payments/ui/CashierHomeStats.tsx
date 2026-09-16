"use client";

import { useAppSelector } from "@/context/hooks";
import { useTranslations } from "next-intl";
import KpiCard from "@/components/custom/organisms/KpiCard";
import { formatEtb } from "@/lib/money";
import {
    selectBillRequestSessions,
    selectPaymentTotals,
} from "@/domains/payments/application/selectors";

export default function CashierHomeStats() {
    const t = useTranslations("cashier");
    const bills = useAppSelector(selectBillRequestSessions);
    const totals = useAppSelector(selectPaymentTotals);

    return (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
                label={t("billRequests")}
                value={String(bills.length)}
                hint={t("waitingToGenerate")}
            />
            <KpiCard
                label={t("totalLogged")}
                value={formatEtb(totals.total)}
                hint={`${totals.count} ${totals.count === 1 ? t("payment") : t("payments")}`}
                tone="brand"
            />
            <KpiCard
                label={t("cash")}
                value={formatEtb(totals.cash)}
                hint={t("collectedAtTable")}
            />
            <KpiCard
                label={t("digital")}
                value={formatEtb(totals.telebirr + totals.bank)}
                hint={t("telebirrAndBank")}
            />
        </div>
    );
}
