"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import MenuEngineeringBoard from "@/domains/menu-engineering/ui/MenuEngineeringBoard";
import { useTranslations } from "next-intl";

export default function OwnerMenuEngineeringPage() {
    const tNav = useTranslations("appNav");

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={tNav("business")}
                title={tNav("menuEngineering")}
                description="Which dishes sell fast, which make the most profit, and where ingredient cost is eating your margin."
            />
            <MenuEngineeringBoard />
        </DashboardFrame>
    );
}
