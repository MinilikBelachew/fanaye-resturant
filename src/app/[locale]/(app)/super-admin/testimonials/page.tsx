"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminTestimonialsBoard from "@/domains/marketing/ui/SuperAdminTestimonialsBoard";

export default function SuperAdminTestimonialsPage() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ፕላትፎርም" : "Platform"}
                title={isAm ? "የመድረክ ምስክርነቶች" : "Landing Testimonials"}
                description={
                    isAm
                        ? "በዋናው ድረ-ገጽ ላይ የሚታዩትን የሬስቶራንት ባለቤቶች ምስክርነቶች ያክሉ፣ ያርትዑ፣ ያትሙ ወይም ያስወግዱ።"
                        : "Add, edit, publish, or remove restaurant owner testimonials shown on the public landing page."
                }
            />
            <SuperAdminTestimonialsBoard />
        </DashboardFrame>
    );
}
