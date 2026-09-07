import StationTicketDetail from "@/domains/fulfillment/ui/StationTicketDetail";

export default async function KitchenOrderDetailPage({
    params,
}: {
    params: Promise<{ itemId: string }>;
}) {
    const { itemId } = await params;
    return <StationTicketDetail role="kitchen" itemId={itemId} />;
}
