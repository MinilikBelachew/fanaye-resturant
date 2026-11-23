"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentsLog from "@/domains/payments/ui/CashierPaymentsLog";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "መስተንግዶ" : "Floor"}
                title={isAm ? "ክፍያዎች" : "Payments"}
                description={
                    isAm
                        ? "በአስተናጋጅ የተሰበሰቡ እና ለካሸር ዴስክ የተመዘገቡ ክፍያዎች።"
                        : "Waiter-collected payments, logged for the desk."
                }
            />
            <CashierPaymentsLog />
        </DashboardFrame>
    );
}
