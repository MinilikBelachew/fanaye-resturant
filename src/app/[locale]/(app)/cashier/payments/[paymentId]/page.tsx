import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentDetail from "@/domains/payments/ui/CashierPaymentDetail";

export default async function CashierPaymentDetailPage({
    params,
}: {
    params: Promise<{ paymentId: string }>;
}) {
    const { paymentId } = await params;

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Floor"
                title="Payment detail"
                description="Bill lines and the waiter’s transfer slip photo."
            />
            <CashierPaymentDetail paymentId={paymentId} />
        </DashboardFrame>
    );
}
