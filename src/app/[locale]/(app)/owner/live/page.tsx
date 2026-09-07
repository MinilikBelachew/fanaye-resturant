import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";

export default function OwnerLivePage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Business"
                title="Live operations"
                description="Same table timeline the waiter and stations are writing."
            />
            <LiveFloorBoard />
        </DashboardFrame>
    );
}
