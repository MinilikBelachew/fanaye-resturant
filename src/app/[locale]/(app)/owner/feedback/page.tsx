"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import FeedbackBoard from "@/domains/feedback/ui/FeedbackBoard";
import { useTranslations } from "next-intl";

export default function OwnerFeedbackPage() {
    const tNav = useTranslations("appNav");

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={tNav("business")}
                title={tNav("feedback")}
                description="Customer ratings and comments from the QR table menu and your website."
            />
            <FeedbackBoard />
        </DashboardFrame>
    );
}
