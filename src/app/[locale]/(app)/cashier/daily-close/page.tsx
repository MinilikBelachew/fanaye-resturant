import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DailyClosePanel from "@/domains/reporting/ui/DailyClosePanel";

export default function CashierDailyClosePage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Close"
                title="Operational Daily Close"
                description="Prepare today’s draft and refresh the snapshot. Managers approve and lock."
            />
            <DailyClosePanel mode="cashier" />
        </DashboardFrame>
    );
}
