"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentDetail from "@/domains/payments/ui/CashierPaymentDetail";

export default function CashierPaymentDetailPage({
    params,
}: {
    params: Promise<{ paymentId: string }>;
}) {
    const { paymentId } = use(params);
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ወለል" : "Floor"}
                title={isAm ? "የክፍያ ዝርዝር" : "Payment detail"}
                description={
                    isAm
                        ? "የሂሳብ ዝርዝር እና የአስተናጋጅ የዝውውር ደረሰኝ ፎቶ።"
                        : "Bill lines and the waiter’s transfer slip photo."
                }
            />
            <CashierPaymentDetail paymentId={paymentId} />
        </DashboardFrame>
    );
}
