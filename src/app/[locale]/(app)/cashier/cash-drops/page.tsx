"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierCashDropsQueue from "@/domains/cash/ui/CashierCashDropsQueue";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow={isAm ? "ካዝና እና መሳቢያ" : "Drawer"}
                title={isAm ? "የገንዘብ ርክክብ (ገቢዎች)" : "Cash drops"}
                description={
                    isAm
                        ? "አስተናጋጆች የሚያስረክቡትን ጥሬ ገንዘብ ይቁጠሩ። ልዩነት ከተፈጠረ ክርክር ከፍተው ይፍቱ።"
                        : "Count waiter drops into your drawer. Mismatch opens a dispute you resolve."
                }
            />
            <CashierCashDropsQueue />
        </DashboardFrame>
    );
}
