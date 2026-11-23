"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentDetail from "@/domains/payments/ui/CashierPaymentDetail";

export default function CashierClosedBillDetailPage({
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
                eyebrow={isAm ? "የተዘጋ" : "Close"}
                title={isAm ? "የተዘጋ ሂሳብ ዝርዝር" : "Closed bill detail"}
                description={
                    isAm
                        ? "ክፍያ፣ የሂሳብ ዝርዝር እና የአስተናጋጅ የዝውውር ደረሰኝ (ካለ)።"
                        : "Payment, bill lines, and waiter transfer slip when available."
                }
            />
            <CashierPaymentDetail
                paymentId={paymentId}
                backHref="/cashier/closed"
            />
        </DashboardFrame>
    );
}
