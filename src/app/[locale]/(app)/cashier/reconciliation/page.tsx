import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierReconciliationPanel from "@/domains/cash/ui/CashierReconciliationPanel";

export default function CashierReconciliationPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Close"
                title="Reconciliation"
                description="Expected custody vs counted cash. Variance needs a note before Daily Close."
            />
            <CashierReconciliationPanel />
        </DashboardFrame>
    );
}
