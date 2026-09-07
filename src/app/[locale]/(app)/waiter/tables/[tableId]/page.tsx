import WaiterTableDetail from "@/domains/floor/ui/WaiterTableDetail";

export default async function WaiterTablePage({
    params,
}: {
    params: Promise<{ tableId: string }>;
}) {
    const { tableId } = await params;
    return <WaiterTableDetail tableId={tableId} />;
}
