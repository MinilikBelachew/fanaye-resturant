import FinancePlaceholder from "@/domains/finance/ui/FinancePlaceholder";

export default function OwnerFinanceCashPage() {
    return (
        <FinancePlaceholder
            title="Cash"
            description="Drops, float, and custody variance across the house."
            hint="Will surface waiter drops, cashier sessions, and expected vs counted cash."
        />
    );
}
