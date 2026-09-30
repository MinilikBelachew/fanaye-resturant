import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import LiveTableDetail from "@/domains/floor/ui/LiveTableDetail";

export default async function OwnerLiveTablePage({
    params,
}: {
    params: Promise<{ tableId: string }>;
}) {
    const { tableId } = await params;
    return (
        <DashboardFrame>
            <LiveTableDetail tableId={tableId} backHref="/owner/live" />
        </DashboardFrame>
    );
}
