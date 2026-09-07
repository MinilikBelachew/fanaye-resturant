import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PaymentMixChart,
    WeeklySalesChart,
} from "@/components/custom/organisms/Charts";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";
import CashierHomeStats from "@/domains/payments/ui/CashierHomeStats";

export default function CashierPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Cashier desk"
                title="Financial dashboard"
                description="Waiters collect the bill total at the table. Payments land here as a log — nothing to confirm."
            />
            <CashierHomeStats />
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <WeeklySalesChart />
                </div>
                <PaymentMixChart />
            </div>
            <LiveFloorBoard />
        </DashboardFrame>
    );
}
