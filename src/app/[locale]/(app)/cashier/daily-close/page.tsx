import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DailyClosePanel from "@/domains/reporting/ui/DailyClosePanel";

export default function CashierDailyClosePage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Close"
                title="Daily close"
                description="Today’s bills, cash, and drops. A manager locks the day."
            />
            <DailyClosePanel mode="cashier" />
        </DashboardFrame>
    );
}
