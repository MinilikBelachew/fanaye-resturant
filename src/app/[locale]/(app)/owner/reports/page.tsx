import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    StationThroughputChart,
    WeeklySalesChart,
} from "@/components/custom/organisms/Charts";

export default function OwnerReportsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Business"
                title="Reports"
                description="Waiter collection stays attributed even after cash is dropped to cashier."
            />
            <div className="grid gap-4 lg:grid-cols-2">
                <WeeklySalesChart />
                <StationThroughputChart />
            </div>
        </DashboardFrame>
    );
}
