import PageHeader from "@/components/custom/organisms/PageHeader";
import WaiterCashDropPanel from "@/domains/cash/ui/WaiterCashDropPanel";

export default function DispatcherCashPage() {
    return (
        <section className="space-y-5">
            <PageHeader
                eyebrow="Call pickup"
                title="Cash on you"
                description="Cash from call orders stays with you until you drop it to the cashier."
            />
            <WaiterCashDropPanel />
        </section>
    );
}
