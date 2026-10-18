import FinancePlaceholder from "@/domains/finance/ui/FinancePlaceholder";

export default function ManagerFinanceCashPage() {
    return (
        <FinancePlaceholder
            title="Cash"
            description="Drops, float, and custody variance for this branch."
            hint="Will surface waiter drops, cashier sessions, and expected vs counted cash."
        />
    );
}
