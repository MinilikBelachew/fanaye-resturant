"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import WaiterCashDropPanel from "@/domains/cash/ui/WaiterCashDropPanel";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow={isAm ? "የስራ ፈረቃ" : "Shift"}
                title={isAm ? "በእጅዎ ያለ ጥሬ ገንዘብ" : "Cash on you"}
                description={
                    isAm
                        ? "በጠረጴዛዎች የሰበሰቡት ጥሬ ገንዘብ ለካሸር እስክታስረክቡ ድረስ በእጅዎ ኃላፊነት ስር ይቆያል።"
                        : "Cash you collected at tables stays with you until you drop it to the cashier."
                }
            />
            <WaiterCashDropPanel />
        </DashboardFrame>
    );
}
