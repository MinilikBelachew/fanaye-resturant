import StationTicketDetail from "@/domains/fulfillment/ui/StationTicketDetail";

export default async function SoftDrinksOrderDetailPage({
    params,
}: {
    params: Promise<{ itemId: string }>;
}) {
    const { itemId } = await params;
    return <StationTicketDetail role="soft_drinks" itemId={itemId} />;
}
