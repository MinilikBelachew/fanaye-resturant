"use client";

import { useParams } from "next/navigation";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import MenuEngineeringItemDetail from "@/domains/menu-engineering/ui/MenuEngineeringItemDetail";
import { useTranslations } from "next-intl";

export default function OwnerMenuEngineeringDetailPage() {
    const params = useParams();
    const itemId = params.itemId as string;
    const tNav = useTranslations("appNav");

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={tNav("menuEngineering")}
                title="Dish Analytics"
                description="Deep dive into menu item performance, costs, and profit potential."
            />
            <div className="mt-6">
                <MenuEngineeringItemDetail
                    itemId={itemId}
                    backPath="/owner/menu-engineering"
                />
            </div>
        </DashboardFrame>
    );
}
