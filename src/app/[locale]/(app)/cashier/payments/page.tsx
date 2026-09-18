import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentsLog from "@/domains/payments/ui/CashierPaymentsLog";

export default function CashierPaymentsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Floor"
                title="Payments"
                description="Waiter-collected payments, logged for the desk."
            />
            <CashierPaymentsLog />
        </DashboardFrame>
    );
}
