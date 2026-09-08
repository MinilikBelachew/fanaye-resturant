"use client";

import { useState } from "react";
import {
    useCashierBillRequestsQuery,
    useGenerateBillMutation,
} from "@/context/services/billingApi";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";

export default function CashierBillRequests() {
    const { data, isLoading, isError } = useCashierBillRequestsQuery(
        undefined,
        { pollingInterval: 5000 },
    );
    const [generateBill, { isLoading: generatingId }] =
        useGenerateBillMutation();
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");
    const requests = data?.data ?? [];

    async function generate(request: (typeof requests)[number]) {
        setError("");
        setBusyId(request.billRequestId);
        try {
            await generateBill({
                billRequestId: request.billRequestId,
                expectedTableSessionVersion:
                    request.expectedTableSessionVersion,
                tableSessionId: request.tableSessionId,
            }).unwrap();
        } catch {
            setError(
                "Could not generate this bill. Refresh and try again.",
            );
        } finally {
            setBusyId("");
        }
    }

    if (isLoading) {
        return <p className="text-slate-gray">Loading bill requests…</p>;
    }

    if (isError) {
        return (
            <p className="text-red-600">Could not load bill requests.</p>
        );
    }

    if (requests.length === 0) {
        return (
            <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray">
                No open bill requests. After a waiter requests the bill, it
                shows here for you to generate.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            <div className="grid gap-3 md:grid-cols-2">
                {requests.map(request => (
                    <article
                        key={request.billRequestId}
                        className="rounded-[16px] border border-hairline bg-card p-5"
                    >
                        <p className="text-[13px] text-slate-gray">
                            Table {request.tableDisplayName} ·{" "}
                            {request.waiter.displayName}
                        </p>
                        <p className="text-[20px] font-semibold">
                            {formatEtb(Number(request.estimatedAmount))}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            Waiting {Math.floor(request.requestAgeSeconds / 60)}{" "}
                            min
                            {request.warnings.length > 0
                                ? ` · ${request.warnings.join(", ").toLowerCase().replaceAll("_", " ")}`
                                : ""}
                        </p>
                        <Button
                            className="mt-4"
                            disabled={busyId === request.billRequestId || Boolean(generatingId)}
                            onClick={() => {
                                void generate(request);
                            }}
                        >
                            {busyId === request.billRequestId
                                ? "Generating…"
                                : "Generate bill"}
                        </Button>
                    </article>
                ))}
            </div>
        </div>
    );
}
