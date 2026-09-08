import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentsLog from "@/domains/payments/ui/CashierPaymentsLog";

export default function CashierPaymentsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Floor"
                title="Payments"
                description="Payments the waiter already collected. Cash stays with the waiter until cash drop — nothing to confirm."
            />
            <CashierPaymentsLog />
        </DashboardFrame>
    );
}
