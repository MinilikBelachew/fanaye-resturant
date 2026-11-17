"use client";

import { use } from "react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminMarketingDetail from "@/domains/marketing/ui/SuperAdminMarketingDetail";

export default function SuperAdminMarketingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Platform • Marketing"
                title="Promotion Request Detail"
                description="Review target audience, delivered views, status transitions, and billing."
            />
            <SuperAdminMarketingDetail id={id} />
        </DashboardFrame>
    );
}
