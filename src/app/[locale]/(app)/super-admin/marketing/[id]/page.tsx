"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import SuperAdminMarketingDetail from "@/domains/marketing/ui/SuperAdminMarketingDetail";

export default function SuperAdminMarketingDetailPage({
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
                eyebrow={isAm ? "መድረክ • ማርኬቲንግ" : "Platform • Marketing"}
                title={isAm ? "የማስተዋወቂያ ጥያቄ ዝርዝር" : "Promotion Request Detail"}
                description={
                    isAm
                        ? "ታለመው ታዳሚ፣ የታዩ እይታዎች፣ የሁኔታ ለውጦች እና የክፍያ መረጃዎችን ይገምግሙ።"
                        : "Review target audience, delivered views, status transitions, and billing."
                }
            />
            <SuperAdminMarketingDetail id={id} />
        </DashboardFrame>
    );
}
