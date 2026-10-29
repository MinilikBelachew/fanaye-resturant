"use client";

import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import InventoryAnalyticsBoard from "@/domains/inventory/ui/InventoryAnalyticsBoard";

export default function ManagerInventoryAnalyticsPage() {
    const t = useTranslations("inventory");

    return (
        <DashboardFrame>
            <PageHeader title={t("analyticsTitle")} compact />
            <InventoryAnalyticsBoard />
        </DashboardFrame>
    );
}
