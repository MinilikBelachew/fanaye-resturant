import FinancePlaceholder from "@/domains/finance/ui/FinancePlaceholder";

export default function ManagerFinanceOverviewPage() {
    return (
        <FinancePlaceholder
            title="Finance overview"
            description="Sales, cash, closes, and payroll for this branch."
            hint="Branch rollups for tender mix, open variances, and payroll due will land here."
        />
    );
}
