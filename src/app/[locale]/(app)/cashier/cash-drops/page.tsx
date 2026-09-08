import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierCashDropsQueue from "@/domains/cash/ui/CashierCashDropsQueue";

export default function CashierCashDropsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Drawer"
                title="Cash drops"
                description="Count waiter drops into your drawer. Mismatch opens a dispute you resolve."
            />
            <CashierCashDropsQueue />
        </DashboardFrame>
    );
}
