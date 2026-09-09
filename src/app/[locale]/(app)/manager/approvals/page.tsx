"use client";

import {
    useApproveCancellationRequestMutation,
    useApproveChangeRequestMutation,
    useOrderMutationApprovalsQuery,
    useRejectCancellationRequestMutation,
    useRejectChangeRequestMutation,
} from "@/context/services/ordersApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { toast } from "@/lib/toast";

export default function ManagerApprovalsPage() {
    const { data, isLoading, isError } = useOrderMutationApprovalsQuery(
        undefined,
        { pollingInterval: 5000 },
    );
    const [approveCancel] = useApproveCancellationRequestMutation();
    const [rejectCancel] = useRejectCancellationRequestMutation();
    const [approveChange] = useApproveChangeRequestMutation();
    const [rejectChange] = useRejectChangeRequestMutation();
    const rows = data?.data ?? [];

    async function decide(
        row: (typeof rows)[number],
        decision: "approve" | "reject",
    ) {
        try {
            if (row.type === "CANCELLATION") {
                if (decision === "approve") {
                    await approveCancel({
                        requestId: row.requestId,
                        expectedOrderItemVersion: row.itemVersion,
                    }).unwrap();
                } else {
                    await rejectCancel({
                        requestId: row.requestId,
                        expectedOrderItemVersion: row.itemVersion,
                        decisionReason: "Rejected",
                    }).unwrap();
                }
            } else if (decision === "approve") {
                await approveChange({
                    requestId: row.requestId,
                    expectedOrderItemVersion: row.itemVersion,
                }).unwrap();
            } else {
                await rejectChange({
                    requestId: row.requestId,
                    expectedOrderItemVersion: row.itemVersion,
                    decisionReason: "Rejected",
                }).unwrap();
            }
            toast.success(
                decision === "approve" ? "Request approved" : "Request rejected",
                row.itemName,
            );
        } catch (err) {
            toast.fromUnknown(
                err,
                decision === "approve"
                    ? "Could not approve this request."
                    : "Could not reject this request.",
            );
        }
    }

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Control"
                title="Approvals"
                description="In-preparation cancellations and dish swaps need a manager. Nothing is silently deleted."
            />

            {isLoading ? (
                <p className="text-slate-gray">Loading approvals…</p>
            ) : null}
            {isError ? (
                <p className="text-red-600">Could not load approvals.</p>
            ) : null}
            {!isLoading && !isError && rows.length === 0 ? (
                <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray">
                    No pending change or cancellation requests.
                </p>
            ) : null}

            <div className="space-y-3">
                {rows.map(row => {
                    const changeSummary = row.requestedChange
                        ? Object.entries(row.requestedChange)
                              .filter(
                                  ([, value]) => value != null && value !== "",
                              )
                              .map(([key, value]) => `${key}: ${String(value)}`)
                              .join(" · ")
                        : null;

                    return (
                        <article
                            key={`${row.type}-${row.requestId}`}
                            className="rounded-[16px] border border-hairline bg-card p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-[13px] text-slate-gray">
                                        {row.tableDisplayName} ·{" "}
                                        {row.stationName}
                                    </p>
                                    <h2 className="text-[18px] font-semibold">
                                        {row.type === "CANCELLATION"
                                            ? "Cancel"
                                            : "Change"}{" "}
                                        {row.itemName}
                                    </h2>
                                    <p className="text-[14px] text-slate-gray">
                                        {row.itemState.replaceAll("_", " ")} ·
                                        requested by {row.requestedByName}
                                    </p>
                                    {row.reason ? (
                                        <p className="mt-1 text-[14px]">
                                            {row.reason}
                                        </p>
                                    ) : null}
                                    {changeSummary ? (
                                        <p className="mt-1 text-[13px] text-slate-gray">
                                            {changeSummary}
                                        </p>
                                    ) : null}
                                </div>
                                <Badge variant="warning">{row.type}</Badge>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    onClick={() => void decide(row, "approve")}
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => void decide(row, "reject")}
                                >
                                    Reject
                                </Button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </DashboardFrame>
    );
}
