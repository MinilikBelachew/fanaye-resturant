import TenantDetailView from "@/domains/tenancy/ui/TenantDetailView";

export default async function TenantDetailPage({
    params,
}: {
    params: Promise<{ tenantId: string }>;
}) {
    const { tenantId } = await params;
    return <TenantDetailView tenantId={tenantId} />;
}

