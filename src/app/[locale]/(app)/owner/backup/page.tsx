"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import OwnerBackupSection from "@/domains/identity/ui/OwnerBackupSection";

export default function OwnerBackupPage() {
    return (
        <DashboardFrame>
            <div className="space-y-6">
                <PageHeader
                    compact
                    eyebrow="Business Settings"
                    title="Backup & Disaster Recovery"
                    description="100% complete tenant-isolated backups sent directly to your private Telegram, with on-demand .sql.gz downloads and instant restoration."
                />
                <OwnerBackupSection showHeader={false} />
            </div>
        </DashboardFrame>
    );
}
