"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminTalentBoard from "@/domains/talent/ui/SuperAdminTalentBoard";

export default function SuperAdminTalentPage() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ፕላትፎርም" : "Platform"}
                title={isAm ? "ተሰጥኦ እና ቅጥር" : "Talent Pool & Hiring"}
                description={
                    isAm
                        ? "የተረጋገጡ የእንግዳ ተቀባይነት እጩዎችን ይለጥፉ እና የሬስቶራንት ግንኙነት እና የቅጥር ጥያቄዎችን ይከታተሉ።"
                        : "Post verified hospitality candidates and track restaurant contact and hire requests."
                }
            />
            <SuperAdminTalentBoard />
        </DashboardFrame>
    );
}
