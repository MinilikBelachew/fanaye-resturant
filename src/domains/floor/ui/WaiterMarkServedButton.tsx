"use client";

import { useState } from "react";
import { useMarkOrderItemServedMutation } from "@/context/services/ordersApi";
import type { SessionOrderItem } from "@/domains/ordering/domain/waiterMenu";
import { Button } from "@/components/ui/button";

export default function WaiterMarkServedButton({
    item,
    tableSessionId,
    size = "sm",
}: {
    item: SessionOrderItem;
    tableSessionId: string;
    size?: "sm" | "default";
}) {
    const [markServed, { isLoading }] = useMarkOrderItemServedMutation();
    const [error, setError] = useState("");

    if (item.state !== "READY") return null;

    async function onServe() {
        setError("");
        try {
            await markServed({
                orderItemId: item.orderItemId,
                expectedVersion: item.version,
                tableSessionId,
            }).unwrap();
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const data = err as {
                    data?: { code?: string; errors?: { version?: string } };
                };
                if (data.data?.errors?.version === "stale") {
                    setError("Ticket changed. Refresh and try again.");
                    return;
                }
                if (data.data?.code === "INVALID_ITEM_STATE") {
                    setError("This dish is no longer ready to serve.");
                    return;
                }
            }
            setError("Could not mark served.");
        }
    }

    return (
        <div className="shrink-0 text-right">
            <Button size={size} disabled={isLoading} onClick={onServe}>
                {isLoading ? "Serving…" : "Mark served"}
            </Button>
            {error ? (
                <p className="mt-1 text-[11px] text-red-600">{error}</p>
            ) : null}
        </div>
    );
}
