import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import LiveTableDetail from "@/domains/floor/ui/LiveTableDetail";

export default async function ManagerLiveTablePage({
    params,
}: {
    params: Promise<{ tableId: string }>;
}) {
    const { tableId } = await params;
    return (
        <DashboardFrame>
            <LiveTableDetail tableId={tableId} backHref="/manager/live" />
        </DashboardFrame>
    );
}
