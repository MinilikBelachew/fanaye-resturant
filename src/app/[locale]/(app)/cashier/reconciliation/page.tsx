"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierReconciliationPanel from "@/domains/cash/ui/CashierReconciliationPanel";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "የቀን ማጠቃለያ" : "Close"}
                title={isAm ? "የጥሬ ገንዘብ ቆጠራ እና ማስታረቂያ" : "Reconciliation"}
                description={
                    isAm
                        ? "መኖር ያለበት ገንዘብ ከቆጠራው ጋር። የገንዘብ ልዩነት ካለ ከቀን መዝጊያ በፊት ማስታወሻ መጻፍ አለበት።"
                        : "Expected custody vs counted cash. Variance needs a note before Daily Close."
                }
            />
            <CashierReconciliationPanel />
        </DashboardFrame>
    );
}
