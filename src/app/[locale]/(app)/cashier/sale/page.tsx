import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import BakeryNewSale from "@/domains/payments/ui/BakeryNewSale";

export default function CashierSalePage() {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Bakery"
                title="New sale"
                description="Tap a photo to add. Use + / − or +5, then generate the bill."
            />
            <BakeryNewSale />
        </DashboardFrame>
    );
}
