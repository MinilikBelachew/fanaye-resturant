"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminTestimonialsBoard from "@/domains/marketing/ui/SuperAdminTestimonialsBoard";

export default function SuperAdminTestimonialsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Platform"
                title="Landing Testimonials"
                description="Add, edit, publish, or remove restaurant owner testimonials shown on the public landing page."
            />
            <SuperAdminTestimonialsBoard />
        </DashboardFrame>
    );
}
