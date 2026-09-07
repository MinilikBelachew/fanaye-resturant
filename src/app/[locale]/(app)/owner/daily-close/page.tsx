import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DailyClosePanel from "@/domains/reporting/ui/DailyClosePanel";

export default function OwnerDailyClosePage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Business"
                title="Operational Daily Close"
                description="Not a fiscal Z-report. Waiter lines plus cashier custody. Locked after manager approval."
            />
            <DailyClosePanel />
        </DashboardFrame>
    );
}
