import StationTicketDetail from "@/domains/fulfillment/ui/StationTicketDetail";

export default async function CakesOrderDetailPage({
    params,
}: {
    params: Promise<{ itemId: string }>;
}) {
    const { itemId } = await params;
    return <StationTicketDetail role="cakes" itemId={itemId} />;
}
