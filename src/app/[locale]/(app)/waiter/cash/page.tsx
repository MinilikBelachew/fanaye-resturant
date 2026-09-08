import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import WaiterCashDropPanel from "@/domains/cash/ui/WaiterCashDropPanel";

export default function WaiterCashPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Shift"
                title="Cash on you"
                description="Cash you collected at tables stays with you until you drop it to the cashier."
            />
            <WaiterCashDropPanel />
        </DashboardFrame>
    );
}
