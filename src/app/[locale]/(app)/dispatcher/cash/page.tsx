"use client";

import { useLocale } from "next-intl";
import PageHeader from "@/components/custom/organisms/PageHeader";
import WaiterCashDropPanel from "@/domains/cash/ui/WaiterCashDropPanel";

export default function DispatcherCashPage() {
    const isAm = useLocale() === "am";
    return (
        <section className="space-y-5">
            <PageHeader
                eyebrow={isAm ? "የስልክ ትዕዛዝ" : "Call pickup"}
                title={isAm ? "በእጅዎ ያለ ጥሬ ገንዘብ" : "Cash on you"}
                description={
                    isAm
                        ? "ከስልክ ትዕዛዞች የተሰበሰበ ጥሬ ገንዘብ ለካሸር እስክታስረክቡ ድረስ ከእርስዎ ጋር ይቆያል።"
                        : "Cash from call orders stays with you until you drop it to the cashier."
                }
            />
            <WaiterCashDropPanel />
        </section>
    );
}
