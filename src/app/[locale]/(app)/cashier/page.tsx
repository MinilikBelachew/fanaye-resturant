import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierHomeStats from "@/domains/payments/ui/CashierHomeStats";

export default function CashierPage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Cashier desk"
                title="Money desk"
                description="Live collections, payment mix, and desk queues — no mock totals."
            />
            <CashierHomeStats />
        </DashboardFrame>
    );
}
