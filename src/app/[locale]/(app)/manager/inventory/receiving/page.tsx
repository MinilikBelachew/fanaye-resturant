"use client";

import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import InventoryBoard from "@/domains/inventory/ui/InventoryBoard";

export default function ManagerInventoryReceivingPage() {
    const t = useTranslations("inventory");

    return (
        <DashboardFrame>
            <PageHeader title={t("title")} compact />
            <InventoryBoard />
        </DashboardFrame>
    );
}
