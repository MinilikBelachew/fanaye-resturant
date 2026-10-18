import FinancePlaceholder from "@/domains/finance/ui/FinancePlaceholder";

export default function OwnerFinanceReportsPage() {
    return (
        <FinancePlaceholder
            title="Finance reports"
            description="Period sales, tender mix, and labor cost summaries."
            hint="Period filters and exportable reports will connect here (branch reports stay available under Branches)."
        />
    );
}
