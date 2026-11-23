"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ቢዝነስ" : "Business"}
                title={isAm ? "የቀጥታ ስራዎች ክትትል" : "Live Operations"}
                description={
                    isAm
                        ? "ጠረጴዛዎች፣ ትዕዛዞች እና የስራ ክፍል ሁኔታዎች በአንድ የቀጥታ ሰሌዳ ላይ።"
                        : "Tables, orders, and station exceptions on one timeline."
                }
            />
            <LiveFloorBoard />
        </DashboardFrame>
    );
}
