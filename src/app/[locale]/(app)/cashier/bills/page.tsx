import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierBillRequests from "@/domains/payments/ui/CashierBillRequests";

export default function CashierBillsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Floor"
                title="Bill requests"
                description="Generate bills for tables waiting after a waiter request."
            />
            <CashierBillRequests />
        </DashboardFrame>
    );
}
