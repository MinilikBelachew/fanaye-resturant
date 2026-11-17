"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import TenantActivityBoard from "@/domains/tenancy/ui/TenantActivityBoard";

export default function SuperAdminActivityPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Platform Telemetry"
                title="Tenant & Branch Activity"
                description="Daily revenue breakdown, live active tables, staff shifts, cash custody, inventory, and chronological movement across every restaurant and branch."
            />
            <TenantActivityBoard />
        </DashboardFrame>
    );
}
