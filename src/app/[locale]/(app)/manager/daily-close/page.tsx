import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DailyClosePanel from "@/domains/reporting/ui/DailyClosePanel";

export default function ManagerDailyClosePage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Close"
                title="Daily close"
                description="Review the snapshot, approve, then lock. Locking freezes the business day."
            />
            <DailyClosePanel mode="manager" />
        </DashboardFrame>
    );
}
