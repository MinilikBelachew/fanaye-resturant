"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierBillRequests from "@/domains/payments/ui/CashierBillRequests";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "መስተንግዶ እና አዳራሽ" : "Floor"}
                title={isAm ? "የሂሳብ መጠየቂያዎች" : "Bill requests"}
                description={
                    isAm
                        ? "አስተናጋጅ ሂሳብ ከጠየቀ በኋላ ለሚጠባበቁ ጠረጴዛዎች ሂሳብ ያዘጋጁ።"
                        : "Generate bills for tables waiting after a waiter request."
                }
            />
            <CashierBillRequests />
        </DashboardFrame>
    );
}
