import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PaymentMixChart,
    StationThroughputChart,
    WeeklySalesChart,
} from "@/components/custom/organisms/Charts";

export default function ManagerReportsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Control"
                title="Reports"
                description="Queue time, prep time, and payment mix for tonight."
            />
            <div className="grid gap-4 lg:grid-cols-2">
                <WeeklySalesChart />
                <StationThroughputChart />
            </div>
            <PaymentMixChart />
        </DashboardFrame>
    );
}
