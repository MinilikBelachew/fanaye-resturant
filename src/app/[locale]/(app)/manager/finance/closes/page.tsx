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
                eyebrow={isAm ? "ፋይናንስ" : "Finance"}
                title={isAm ? "የቀን መዝጊያዎች" : "Closes"}
                description={
                    isAm
                        ? "የአስተናጋጆች ስብስብ እና የካሸር ጥሬ ገንዘብ። በስራ አስኪያጅ ከጸደቀ በኋላ ይቆለፋል።"
                        : "Waiter collections plus cashier custody. Locked after manager approval."
                }
            />
            <DailyClosePanel mode="manager" />
        </DashboardFrame>
    );
}
