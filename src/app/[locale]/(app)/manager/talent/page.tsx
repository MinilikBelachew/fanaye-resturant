"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import RestaurantTalentBoard from "@/domains/talent/ui/RestaurantTalentBoard";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ሰው ኃይል" : "House"}
                title={isAm ? "የሙያተኞች ማዕከል (ቅጥር)" : "Talent Pool"}
                description={
                    isAm
                        ? "የተረጋገጡ ሼፎችን፣ አስተናጋጆችን፣ ባሪስታዎችን እና ካሸሮችን በቀጥታ ያግኙ ወይም በአንድ ጠቅታ ይቀጥሩ።"
                        : "Browse verified chefs, waiters, baristas, and cashiers, contact them directly, or hire them into your staff in one click."
                }
            />
            <RestaurantTalentBoard />
        </DashboardFrame>
    );
}
