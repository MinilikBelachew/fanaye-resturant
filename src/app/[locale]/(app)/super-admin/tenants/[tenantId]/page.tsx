import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import { getPlatformTenant } from "@/domains/tenancy/infrastructure/platformDemo";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { notFound } from "next/navigation";

export default async function TenantDetailPage({
    params,
}: {
    params: Promise<{ tenantId: string }>;
}) {
    const { tenantId } = await params;
    const tenant = getPlatformTenant(tenantId);
    if (!tenant) notFound();

    const facts = [
        { label: "City", value: tenant.city },
        { label: "Area", value: tenant.area },
        { label: "Address", value: tenant.address },
        { label: "Phone", value: tenant.phone },
        { label: "Email", value: tenant.email },
        { label: "House manager", value: tenant.manager },
        { label: "Hours", value: tenant.hours },
        { label: "Concept", value: tenant.concept },
        { label: "Branches", value: String(tenant.branches) },
        { label: "Tables", value: String(tenant.tableCount) },
        { label: "Staff", value: String(tenant.staffCount) },
        { label: "Plan", value: tenant.plan },
        { label: "Provisioned", value: tenant.provisionedAt },
        { label: "Tenant ID", value: tenant.id },
    ];

    return (
        <DashboardFrame>
            <Link
                href="/super-admin/tenants"
                className="text-[14px] text-brand"
            >
                ← Tenants
            </Link>

            <div className="mt-4 flex flex-wrap items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={tenant.logo}
                    alt={`${tenant.name} logo`}
                    className="size-16 rounded-[18px] border border-hairline"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-[28px] font-semibold tracking-tight">
                            {tenant.name}
                        </h1>
                        <Badge variant={tenant.active ? "success" : "secondary"}>
                            {tenant.active ? "Active" : "Suspended"}
                        </Badge>
                    </div>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {tenant.concept} · {tenant.area}, {tenant.city}
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-[12px] border border-hairline bg-card px-3.5 py-3">
                    <p className="text-[11px] font-medium text-slate-gray">
                        Today
                    </p>
                    <p className="mt-1.5 text-[18px] font-semibold">
                        {formatEtb(tenant.gmvToday)}
                    </p>
                </div>
                <div className="rounded-[12px] border border-hairline bg-card px-3.5 py-3">
                    <p className="text-[11px] font-medium text-slate-gray">
                        Branches
                    </p>
                    <p className="mt-1.5 text-[18px] font-semibold">
                        {tenant.branches}
                    </p>
                </div>
                <div className="rounded-[12px] border border-hairline bg-card px-3.5 py-3">
                    <p className="text-[11px] font-medium text-slate-gray">
                        Staff
                    </p>
                    <p className="mt-1.5 text-[18px] font-semibold">
                        {tenant.staffCount}
                    </p>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[16px] border border-hairline bg-card">
                <div className="border-b border-hairline px-5 py-3">
                    <h2 className="text-[15px] font-semibold">Restaurant details</h2>
                    <p className="text-[13px] text-slate-gray">
                        Location, contact, and house setup
                    </p>
                </div>
                <dl className="divide-y divide-hairline">
                    {facts.map(fact => (
                        <div
                            key={fact.label}
                            className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-baseline"
                        >
                            <dt className="text-[12px] font-medium text-slate-gray">
                                {fact.label}
                            </dt>
                            <dd
                                className={
                                    fact.label === "Plan"
                                        ? "text-[14px] capitalize"
                                        : "text-[14px]"
                                }
                            >
                                {fact.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </DashboardFrame>
    );
}
