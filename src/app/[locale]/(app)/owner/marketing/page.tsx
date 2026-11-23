"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import RestaurantMarketingBoard from "@/domains/marketing/ui/RestaurantMarketingBoard";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ንግድ እና ግብይት" : "Business"}
                title={isAm ? "የምግብ ማስተዋወቅ" : "Marketing"}
                description={
                    isAm
                        ? "የምግብ ማስተዋወቂያዎችን በቦታ፣ በዕድሜ ክልል እና በዕይታ ብዛት ይጠይቁ፣ ከተጠናቀቀ በኋላ ይክፈሉ።"
                        : "Request food promotions by target location, age group, and views, and pay after delivery."
                }
            />
            <RestaurantMarketingBoard />
        </DashboardFrame>
    );
}
