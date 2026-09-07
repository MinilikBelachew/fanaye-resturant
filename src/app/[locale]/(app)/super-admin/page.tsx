import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    PaymentMixChart,
    PlatformGrowthChart,
} from "@/components/custom/organisms/Charts";
import { PLATFORM_TENANTS } from "@/domains/tenancy/infrastructure/platformDemo";

export default function SuperAdminPage() {
    const live = PLATFORM_TENANTS.filter(tenant => tenant.active).length;

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Fanaye SaaS"
                title="Platform dashboard"
                description="Tenants, GMV, and network health. Super Admin never takes a table."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Live tenants"
                    value={String(live)}
                    hint={`${PLATFORM_TENANTS.length} provisioned`}
                    tone="brand"
                />
                <KpiCard
                    label="Network GMV today"
                    value="ETB 102k"
                    hint="+12% vs last Saturday"
                />
                <KpiCard
                    label="Active branches"
                    value="7"
                    hint="Across 4 cities"
                />
                <KpiCard
                    label="Verified transfers"
                    value="42%"
                    hint="TinaVerify share"
                />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <PlatformGrowthChart />
                </div>
                <PaymentMixChart />
            </div>
            <section className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-subtle">
                <div className="flex items-center justify-between px-6 py-4">
                    <h2 className="text-[16px] font-semibold">Tenants</h2>
                    <Badge>Live board</Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="border-y border-hairline text-[12px] tracking-[0.06em] text-slate-gray uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">
                                    Restaurant
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Plan
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    City
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Today
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {PLATFORM_TENANTS.map(tenant => (
                                <tr
                                    key={tenant.id}
                                    className="border-b border-hairline last:border-0"
                                >
                                    <td className="px-6 py-3 font-medium">
                                        {tenant.name}
                                    </td>
                                    <td className="px-6 py-3 capitalize">
                                        {tenant.plan}
                                    </td>
                                    <td className="px-6 py-3 text-slate-gray">
                                        {tenant.city}
                                    </td>
                                    <td className="px-6 py-3">
                                        ETB {tenant.gmvToday.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3">
                                        <Badge
                                            variant={
                                                tenant.active
                                                    ? "success"
                                                    : "secondary"
                                            }
                                        >
                                            {tenant.active
                                                ? "Active"
                                                : "Suspended"}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </DashboardFrame>
    );
}
