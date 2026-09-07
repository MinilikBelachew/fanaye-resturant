import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";

export default function ManagerLivePage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Overview"
                title="Live operations"
                description="Tables, orders, and station exceptions on one timeline."
            />
            <LiveFloorBoard />
        </DashboardFrame>
    );
}
