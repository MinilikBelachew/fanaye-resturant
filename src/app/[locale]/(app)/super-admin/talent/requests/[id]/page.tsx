"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminTalentRequestDetail from "@/domains/talent/ui/SuperAdminTalentRequestDetail";

export default function SuperAdminTalentRequestDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "መድረክ • የሙያተኞች ቅጥር" : "Platform • Talent"}
                title={isAm ? "የቅጥር ጥያቄ ዝርዝር" : "Talent Request Detail"}
                description={
                    isAm
                        ? "የእጩውን የመገናኛ አድራሻ፣ የሬስቶራንቱን መረጃ እና የቅጥር ሁኔታን ይገምግሙ።"
                        : "Review candidate contact, restaurant details, and hiring status."
                }
            />
            <SuperAdminTalentRequestDetail id={id} />
        </DashboardFrame>
    );
}
