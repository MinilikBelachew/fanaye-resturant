import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DailyClosePanel from "@/domains/reporting/ui/DailyClosePanel";

export default function ManagerDailyClosePage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Control"
                title="Operational Daily Close"
                description="Not a fiscal Z-report. Review waiter lines, then lock the day."
            />
            <DailyClosePanel />
        </DashboardFrame>
    );
}
