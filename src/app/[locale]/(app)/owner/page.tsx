import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import DishCard from "@/components/custom/organisms/DishCard";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PaymentMixChart,
    WeeklySalesChart,
} from "@/components/custom/organisms/Charts";
import LiveFloorBoard from "@/domains/floor/ui/LiveFloorBoard";
import { FEATURED_DISHES } from "@/domains/reporting/infrastructure/demoMetrics";
import { DEMO_TENANT } from "@/domains/tenancy/domain/tenant";

export default function OwnerPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow={DEMO_TENANT.name}
                title="Business dashboard"
                description="Sales, mix, and the dishes guests actually order. Owner does not take tables."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Today sales"
                    value="ETB 38,720"
                    hint="Sat service"
                    tone="brand"
                />
                <KpiCard label="Orders" value="132" hint="Karim 18 · floor" />
                <KpiCard
                    label="Verified transfer"
                    value="ETB 16,240"
                    hint="TinaVerify"
                />
                <KpiCard label="Open tables" value="Live" hint="See below" />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <WeeklySalesChart />
                </div>
                <PaymentMixChart />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {FEATURED_DISHES.map(dish => (
                    <DishCard key={dish.name} {...dish} />
                ))}
            </div>
            <LiveFloorBoard />
        </DashboardFrame>
    );
}
