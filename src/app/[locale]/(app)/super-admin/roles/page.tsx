"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import RolesPermissionsBoard from "@/domains/rbac/ui/RolesPermissionsBoard";

export default function SuperAdminRolesPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Platform"
                title="Roles & Permissions"
                description="Grant or revoke restaurant role permissions. Changes drive API access through CASL."
            />
            <RolesPermissionsBoard />
        </DashboardFrame>
    );
}
