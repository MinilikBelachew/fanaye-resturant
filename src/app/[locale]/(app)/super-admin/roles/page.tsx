"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import RolesPermissionsBoard from "@/domains/rbac/ui/RolesPermissionsBoard";

export default function SuperAdminRolesPage() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ፕላትፎርም" : "Platform"}
                title={isAm ? "ሚናዎች እና ፈቃዶች" : "Roles & Permissions"}
                description={
                    isAm
                        ? "የሬስቶራንት ሰራተኞችን ሚና ፈቃዶች ይስጡ ወይም ያንሱ። ለውጦች በCASL በኩል የAPI መዳረሻን ይቆጣጠራሉ።"
                        : "Grant or revoke restaurant role permissions. Changes drive API access through CASL."
                }
            />
            <RolesPermissionsBoard />
        </DashboardFrame>
    );
}
