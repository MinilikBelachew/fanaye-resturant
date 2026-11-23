"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import OwnerBackupSection from "@/domains/identity/ui/OwnerBackupSection";

export default function OwnerBackupPage() {
    const isAm = useLocale() === "am";
    return (
        <DashboardFrame>
            <div className="space-y-6">
                <PageHeader
                    compact
                    eyebrow={isAm ? "የንግድ ቅንብሮች" : "Business Settings"}
                    title={
                        isAm
                            ? "የውሂብ ምትኬ እና ደህንነት"
                            : "Backup & Disaster Recovery"
                    }
                    description={
                        isAm
                            ? "ሙሉ በሙሉ የተሟላ የመረጃ ምትኬ በቀጥታ ወደ ግል ቴሌግራምዎ የሚላክ፣ በፈለጉት ጊዜ .sql.gz የሚወርድ እና ወዲያውኑ የሚመለስ።"
                            : "100% complete tenant-isolated backups sent directly to your private Telegram, with on-demand .sql.gz downloads and instant restoration."
                    }
                />
                <OwnerBackupSection showHeader={false} />
            </div>
        </DashboardFrame>
    );
}
