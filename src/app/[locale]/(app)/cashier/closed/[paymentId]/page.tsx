import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import CashierPaymentDetail from "@/domains/payments/ui/CashierPaymentDetail";

export default async function CashierClosedBillDetailPage({
    params,
}: {
    params: Promise<{ paymentId: string }>;
}) {
    const { paymentId } = await params;

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Close"
                title="Closed bill detail"
                description="Payment, bill lines, and waiter transfer slip when available."
            />
            <CashierPaymentDetail
                paymentId={paymentId}
                backHref="/cashier/closed"
            />
        </DashboardFrame>
    );
}
