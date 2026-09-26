"use client";

import { useState } from "react";
import { useMarkOrderItemServedMutation } from "@/context/services/ordersApi";
import type { SessionOrderItem } from "@/domains/ordering/domain/waiterMenu";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

export default function WaiterMarkServedButton({
    item,
    tableSessionId,
    size = "sm",
}: {
    item: SessionOrderItem;
    tableSessionId: string;
    size?: "sm" | "default";
}) {
    const t = useTranslations("waiter");
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
            toast.success(t("markedServed"), item.itemName);
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const data = err as {
                    data?: { code?: string; errors?: { version?: string } };
                };
                if (data.data?.errors?.version === "stale") {
                    const message = t("ticketChanged");
                    setError(message);
                    toast.error(message);
                    return;
                }
                if (data.data?.code === "INVALID_ITEM_STATE") {
                    const message = t("noLongerReady");
                    setError(message);
                    toast.error(message);
                    return;
                }
            }
            const message = t("couldNotMarkServed");
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    return (
        <div className="shrink-0 text-right">
            <Button size={size} disabled={isLoading} onClick={onServe}>
                {isLoading ? t("serving") : t("markServed")}
            </Button>
            {error ? (
                <p className="mt-1 text-[11px] text-red-600">{error}</p>
            ) : null}
        </div>
    );
}
