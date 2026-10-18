"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";

type FinancePlaceholderProps = {
    title: string;
    description: string;
    hint?: string;
};

export default function FinancePlaceholder({
    title,
    description,
    hint,
}: FinancePlaceholderProps) {
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Finance"
                title={title}
                description={description}
            />
            <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-12 text-center">
                <p className="text-[14px] font-medium text-foreground">
                    Coming next
                </p>
                <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
                    {hint ??
                        "This Finance module is wired in the sidebar. Screens will connect to sales, cash custody, and payroll next."}
                </p>
            </div>
        </DashboardFrame>
    );
}
