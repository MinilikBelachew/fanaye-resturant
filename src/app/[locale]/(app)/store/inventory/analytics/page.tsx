"use client";

import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import InventoryCentralAnalyticsBoard from "@/domains/inventory/ui/InventoryCentralAnalyticsBoard";

export default function StoreInventoryAnalyticsPage() {
    const t = useTranslations("inventory");

    return (
        <DashboardFrame>
            <PageHeader title={t("centralTitle")} compact />
            <InventoryCentralAnalyticsBoard />
        </DashboardFrame>
    );
}
