import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentsLog from "@/domains/payments/ui/CashierPaymentsLog";

export default function CashierPaymentsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Floor"
                title="Payments"
                description="Waiter collections log. The bill total is already on the check — nothing to confirm."
            />
            <CashierPaymentsLog />
        </DashboardFrame>
    );
}
