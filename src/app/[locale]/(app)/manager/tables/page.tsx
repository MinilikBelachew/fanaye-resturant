"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import ManagerTablesBoard from "@/domains/floor/ui/ManagerTablesBoard";

export default function ManagerTablesPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="House"
                title="Tables"
                description="Live restaurant floor plan. Monitor occupied tables, assigned servers, active guests, and running orders."
            />
            <ManagerTablesBoard />
        </DashboardFrame>
    );
}
