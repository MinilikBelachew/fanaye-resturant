"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import TenantActivityBoard from "@/domains/tenancy/ui/TenantActivityBoard";
import { useTranslations } from "next-intl";

export default function SuperAdminActivityPage() {
    const t = useTranslations("tenantActivity");

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={t("eyebrow")}
                title={t("title")}
                description={t("description")}
            />
            <TenantActivityBoard />
        </DashboardFrame>
    );
}
