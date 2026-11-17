"use client";

import { use } from "react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminTalentRequestDetail from "@/domains/talent/ui/SuperAdminTalentRequestDetail";

export default function SuperAdminTalentRequestDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Platform • Talent"
                title="Talent Request Detail"
                description="Review candidate contact, restaurant details, and hiring status."
            />
            <SuperAdminTalentRequestDetail id={id} />
        </DashboardFrame>
    );
}
