import StationTicketDetail from "@/domains/fulfillment/ui/StationTicketDetail";

export default async function BaristaOrderDetailPage({
    params,
}: {
    params: Promise<{ itemId: string }>;
}) {
    const { itemId } = await params;
    return <StationTicketDetail role="barista" itemId={itemId} />;
}
