import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";

export default function ManagerApprovalsPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Control"
                title="Approvals"
                description="In-preparation cancellations need a manager. Nothing is silently deleted."
            />
            <article className="rounded-[16px] border border-hairline bg-white p-5 shadow-subtle">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[13px] text-slate-gray">
                            Table 12 · Kitchen
                        </p>
                        <h2 className="text-[18px] font-semibold">
                            Cancel 1× Cheeseburger
                        </h2>
                        <p className="text-[14px] text-slate-gray">
                            Item is in preparation · requested by Karim
                        </p>
                    </div>
                    <Badge variant="warning">Needs PIN</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button>Approve</Button>
                    <Button variant="outline">Hold</Button>
                </div>
            </article>
        </DashboardFrame>
    );
}
