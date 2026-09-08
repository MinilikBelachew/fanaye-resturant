"use client";

import { useState } from "react";
import {
    useCashierCashDropsQuery,
    useReceiveCashDropMutation,
    useResolveCashDropDisputeMutation,
} from "@/context/services/cashApi";
import type { CashDrop } from "@/domains/cash/domain/cashApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";

function DropCard({ drop }: { drop: CashDrop }) {
    const [counted, setCounted] = useState(drop.declaredAmount);
    const [error, setError] = useState("");
    const [receive, { isLoading: receiving }] = useReceiveCashDropMutation();
    const [resolve, { isLoading: resolving }] =
        useResolveCashDropDisputeMutation();

    async function onReceive() {
        setError("");
        try {
            await receive({
                cashDropId: drop.cashDropId,
                countedAmount: Number(counted).toFixed(2),
                expectedVersion: drop.version,
            }).unwrap();
        } catch {
            setError("Could not receive this drop. Refresh and try again.");
        }
    }

    async function onResolve(
        resolution: "ACCEPT_COUNTED" | "ACCEPT_DECLARED",
    ) {
        if (!drop.disputeId) return;
        setError("");
        try {
            await resolve({
                disputeId: drop.disputeId,
                resolution,
            }).unwrap();
        } catch {
            setError("Could not resolve the dispute.");
        }
    }

    return (
        <article className="rounded-[16px] border border-hairline bg-card p-5">
            <p className="text-[13px] text-slate-gray">
                {drop.waiterName ?? "Waiter"}
            </p>
            <p className="text-[20px] font-semibold">
                Declared {formatEtb(Number(drop.declaredAmount))}
            </p>
            {drop.status === "INITIATED" ? (
                <div className="mt-3 space-y-2">
                    <label className="text-[13px] text-slate-gray">
                        Counted amount
                    </label>
                    <Input
                        value={counted}
                        onChange={event => setCounted(event.target.value)}
                        inputMode="decimal"
                    />
                    <Button disabled={receiving} onClick={onReceive}>
                        {receiving ? "Receiving…" : "Receive into drawer"}
                    </Button>
                    <p className="text-[12px] text-slate-gray">
                        Same amount → received. Different amount → disputed.
                    </p>
                </div>
            ) : null}
            {drop.status === "DISPUTED" ? (
                <div className="mt-3 space-y-2">
                    <p className="text-[14px] text-slate-gray">
                        Counted {formatEtb(Number(drop.countedAmount ?? 0))}
                        {drop.variance
                            ? ` · variance ${formatEtb(Number(drop.variance))}`
                            : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            disabled={resolving}
                            onClick={() => {
                                void onResolve("ACCEPT_COUNTED");
                            }}
                        >
                            Accept counted
                        </Button>
                        <Button
                            variant="outline"
                            disabled={resolving}
                            onClick={() => {
                                void onResolve("ACCEPT_DECLARED");
                            }}
                        >
                            Accept declared
                        </Button>
                    </div>
                </div>
            ) : null}
            {error ? (
                <p className="mt-2 text-[13px] text-red-600">{error}</p>
            ) : null}
        </article>
    );
}

export default function CashierCashDropsQueue() {
    const { data, isLoading, isError } = useCashierCashDropsQuery(
        { status: "INITIATED,DISPUTED" },
        { pollingInterval: 5000 },
    );
    const drops = data?.data ?? [];

    if (isLoading) {
        return <p className="text-slate-gray">Loading cash drops…</p>;
    }

    if (isError) {
        return <p className="text-red-600">Could not load cash drops.</p>;
    }

    if (drops.length === 0) {
        return (
            <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray">
                No pending cash drops. When a waiter starts a drop, it shows
                here for you to count and receive.
            </p>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {drops.map(drop => (
                <DropCard key={drop.cashDropId} drop={drop} />
            ))}
        </div>
    );
}
