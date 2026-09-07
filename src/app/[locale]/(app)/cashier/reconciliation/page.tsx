import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import KpiCard from "@/components/custom/organisms/KpiCard";
import PageHeader from "@/components/custom/organisms/PageHeader";

export default function CashierReconciliationPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Close"
                title="Reconciliation"
                description="Expected custody vs counted cash. Variance needs a note before Daily Close."
            />
            <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="Float" value="ETB 500" />
                <KpiCard
                    label="Expected"
                    value="ETB 22,980"
                    tone="brand"
                />
                <KpiCard label="Counted" value="ETB 22,975" hint="ETB 5 short" />
            </div>
            <article className="rounded-[16px] border border-hairline bg-white p-6 shadow-subtle">
                <h2 className="font-semibold">Sara Mekonnen · drawer</h2>
                <p className="mt-2 text-[14px] text-slate-gray">
                    Variance of ETB 5.00 is logged. Manager reviews before the
                    Operational Daily Close can lock.
                </p>
            </article>
        </DashboardFrame>
    );
}
