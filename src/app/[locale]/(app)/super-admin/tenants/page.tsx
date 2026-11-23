"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import TenantsBoard from "@/domains/tenancy/ui/TenantsBoard";

export default function TenantsPage() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ፕላትፎርም" : "Platform"}
                title={isAm ? "ተከራይ ሬስቶራንቶች" : "Tenants"}
                description={
                    isAm
                        ? "እያንዳንዱ ተከራይ ራሱን የቻለ የሬስቶራንት ኩባንያ ነው። የቅርንጫፍ እና የስራ ዝርዝሮችን ለማየት አንዱን ይክፈቱ።"
                        : "Each tenant is a restaurant company. Open one for location and house details."
                }
            />
            <TenantsBoard />
        </DashboardFrame>
    );
}
