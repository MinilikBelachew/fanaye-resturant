"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DailyClosePanel from "@/domains/reporting/ui/DailyClosePanel";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "የዕለት ማጠቃለያ" : "Close"}
                title={isAm ? "የቀን መዝጊያ" : "Daily close"}
                description={
                    isAm
                        ? "የዛሬ ሂሳቦች፣ ጥሬ ገንዘብ እና ገቢዎች። ስራ አስኪያጁ ቀኑን ይቆልፋል።"
                        : "Today’s bills, cash, and drops. A manager locks the day."
                }
            />
            <DailyClosePanel mode="cashier" />
        </DashboardFrame>
    );
}
