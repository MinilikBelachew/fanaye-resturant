"use client";

import { useLocale } from "next-intl";
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
    const isAm = useLocale() === "am";
    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "ፋይናንስ" : "Finance"}
                title={title}
                description={description}
            />
            <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-12 text-center">
                <p className="text-[14px] font-medium text-foreground">
                    {isAm ? "በቅርቡ የሚቀርብ" : "Coming next"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
                    {hint ??
                        (isAm
                            ? "ይህ የፋይናንስ ክፍል በጎን ማውጫው ላይ ተያይዟል። ቀጣይ ገጾች ከሽያጭ፣ ከጥሬ ገንዘብ ርክክብ እና ከደመወዝ ክፍያ ጋር ይገናኛሉ።"
                            : "This Finance module is wired in the sidebar. Screens will connect to sales, cash custody, and payroll next.")}
                </p>
            </div>
        </DashboardFrame>
    );
}
