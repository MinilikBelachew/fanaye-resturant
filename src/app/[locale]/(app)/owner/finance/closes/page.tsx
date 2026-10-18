import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DailyClosePanel from "@/domains/reporting/ui/DailyClosePanel";

export default function OwnerFinanceClosesPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Finance"
                title="Closes"
                description="Waiter collections plus cashier custody. Locked after manager approval."
            />
            <DailyClosePanel mode="manager" />
        </DashboardFrame>
    );
}
