"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierHomeStats from "@/domains/payments/ui/CashierHomeStats";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "የካሸር ዴስክ" : "Cashier desk"}
                title={isAm ? "የገንዘብ መቀበያ ሰሌዳ" : "Money desk"}
                description={
                    isAm
                        ? "ለተመረጠው ቀን የተሰበሰቡ ክፍያዎች። የቀጥታ ተራዎች የሚሰሩት ለዛሬ ብቻ ነው።"
                        : "Collections for the selected day. Desk queues are live for today only."
                }
            />
            <CashierHomeStats />
        </DashboardFrame>
    );
}
