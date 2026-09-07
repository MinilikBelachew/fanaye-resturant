import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { PLATFORM_PLANS } from "@/domains/tenancy/infrastructure/platformDemo";
import { cn } from "@/lib/utils";

export default function PlansPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Platform"
                title="Plans"
                description="Starter, Pro, and Enterprise entitlements sold by Fanaye SaaS."
            />
            <div className="grid gap-4 md:grid-cols-3">
                {PLATFORM_PLANS.map(plan => (
                    <article
                        key={plan.id}
                        className={cn(
                            "flex flex-col rounded-[16px] border bg-white p-6 shadow-subtle",
                            plan.current
                                ? "border-brand"
                                : "border-hairline",
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-semibold">
                                {plan.name}
                            </h2>
                            {plan.current ? (
                                <Badge>Current demo</Badge>
                            ) : null}
                        </div>
                        <p className="mt-2 text-[24px] font-semibold text-brand">
                            {plan.price}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {plan.seats}
                        </p>
                        <ul className="mt-5 flex-1 space-y-2 text-[14px]">
                            {plan.features.map(feature => (
                                <li key={feature}>{feature}</li>
                            ))}
                        </ul>
                        <Button
                            className="mt-6"
                            variant={plan.current ? "default" : "outline"}
                        >
                            {plan.current ? "Assigned" : "Assign plan"}
                        </Button>
                    </article>
                ))}
            </div>
        </DashboardFrame>
    );
}
