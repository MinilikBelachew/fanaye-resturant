"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import RestaurantMarketingBoard from "@/domains/marketing/ui/RestaurantMarketingBoard";

export default function ManagerMarketingPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="House"
                title="Marketing"
                description="Request food promotions by target location, age group, and views, and pay after delivery."
            />
            <RestaurantMarketingBoard />
        </DashboardFrame>
    );
}
