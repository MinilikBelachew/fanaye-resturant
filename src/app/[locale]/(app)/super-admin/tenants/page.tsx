import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import TenantsBoard from "@/domains/tenancy/ui/TenantsBoard";

export default function TenantsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Platform"
                title="Tenants"
                description="Each tenant is a restaurant company. Open one for location and house details."
            />
            <TenantsBoard />
        </DashboardFrame>
    );
}
