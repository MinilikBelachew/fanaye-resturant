"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import RestaurantTalentBoard from "@/domains/talent/ui/RestaurantTalentBoard";

export default function OwnerTalentPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Business"
                title="Talent Pool"
                description="Browse verified chefs, waiters, baristas, and cashiers, contact them directly, or hire them into your staff in one click."
            />
            <RestaurantTalentBoard />
        </DashboardFrame>
    );
}
