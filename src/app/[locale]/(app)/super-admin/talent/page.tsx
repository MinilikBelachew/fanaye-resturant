"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminTalentBoard from "@/domains/talent/ui/SuperAdminTalentBoard";

export default function SuperAdminTalentPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Platform"
                title="Talent Pool & Hiring"
                description="Post verified hospitality candidates and track restaurant contact and hire requests."
            />
            <SuperAdminTalentBoard />
        </DashboardFrame>
    );
}
