import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PlatformGrowthChart,
    StationThroughputChart,
} from "@/components/custom/organisms/Charts";

export default function UsagePage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Platform"
                title="Usage & health"
                description="Orders, tenants, and station load across the SaaS — not a single restaurant floor."
            />
            <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="Orders / day" value="4,812" hint="Network" />
                <KpiCard
                    label="Uptime"
                    value="99.96%"
                    hint="Last 30 days"
                    tone="brand"
                />
                <KpiCard label="TinaVerify scans" value="1,204" hint="Today" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <PlatformGrowthChart />
                <StationThroughputChart />
            </div>
        </DashboardFrame>
    );
}
