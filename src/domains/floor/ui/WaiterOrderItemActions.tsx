"use client";

import { useMemo, useState } from "react";
import {
    useCancelOrderItemMutation,
    useRequestOrderChangeMutation,
    useRequestOrderCancellationMutation,
    useWaiterMenuQuery,
} from "@/context/services/ordersApi";
import type { SessionOrderItem } from "@/domains/ordering/domain/waiterMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";

const DIRECT_CANCEL = new Set(["QUEUED", "ACKNOWLEDGED", "CONFIRMED"]);
const PROTECTED_CANCEL = new Set(["IN_PREPARATION", "READY"]);
const CHANGEABLE = new Set([
    "QUEUED",
    "ACKNOWLEDGED",
    "IN_PREPARATION",
    "READY",
]);

type Props = {
    item: SessionOrderItem;
    tableSessionId: string;
};

export default function WaiterOrderItemActions({
    item,
    tableSessionId,
}: Props) {
    const [mode, setMode] = useState<"idle" | "cancel" | "change">("idle");
    const [reason, setReason] = useState("");
    const [menuItemId, setMenuItemId] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    const { data: menu } = useWaiterMenuQuery(
        { tableSessionId },
        { skip: mode !== "change" },
    );
    const [directCancel, { isLoading: cancelling }] =
        useCancelOrderItemMutation();
    const [requestCancel, { isLoading: requestingCancel }] =
        useRequestOrderCancellationMutation();
    const [requestChange, { isLoading: changing }] =
        useRequestOrderChangeMutation();

    const swapChoices = useMemo(() => {
        const items = menu?.items ?? [];
        return items.filter(entry => !entry.soldOut);
    }, [menu]);

    if (
        item.state === "CANCELLED" ||
        item.state === "SERVED" ||
        item.state === "CANCELLATION_REQUESTED" ||
        item.state === "CHANGE_REQUESTED"
    ) {
        return (
            <p className="text-[12px] text-slate-gray">
                {item.state.replaceAll("_", " ").toLowerCase()}
            </p>
        );
    }

    async function onCancel() {
        setError("");
        setOk("");
        if (!reason.trim()) {
            setError("Add a short reason.");
            return;
        }
        try {
            if (DIRECT_CANCEL.has(item.state)) {
                await directCancel({
                    orderItemId: item.orderItemId,
                    expectedVersion: item.version,
                    reason: reason.trim(),
                    tableSessionId,
                }).unwrap();
                setOk("Cancelled.");
            } else if (PROTECTED_CANCEL.has(item.state)) {
                await requestCancel({
                    orderItemId: item.orderItemId,
                    expectedVersion: item.version,
                    reason: reason.trim(),
                    tableSessionId,
                }).unwrap();
                setOk("Sent to manager for approval.");
            }
            setMode("idle");
            setReason("");
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "ORDER_ITEM_NOT_CANCELLABLE") {
                    setError(
                        "Kitchen already started — request manager approval instead.",
                    );
                    return;
                }
            }
            setError("Could not cancel. Refresh and try again.");
        }
    }

    async function onChange() {
        setError("");
        setOk("");
        if (!menuItemId && !note.trim()) {
            setError("Pick a new dish and/or add a note.");
            return;
        }
        try {
            const result = await requestChange({
                orderItemId: item.orderItemId,
                expectedVersion: item.version,
                reason: reason.trim() || "Customer asked to change",
                requestedChange: {
                    ...(menuItemId ? { menuItemId } : {}),
                    ...(note.trim()
                        ? { specialInstruction: note.trim() }
                        : {}),
                },
                tableSessionId,
            }).unwrap();
            setOk(
                result.data.applied
                    ? `Changed to ${result.data.itemName ?? "new item"}.`
                    : "Change sent to manager.",
            );
            setMode("idle");
            setMenuItemId("");
            setNote("");
            setReason("");
        } catch {
            setError("Could not change item. Refresh and try again.");
        }
    }

    if (mode === "cancel") {
        return (
            <div className="mt-2 w-full min-w-[180px] space-y-2 rounded-[12px] border border-hairline bg-background p-3">
                <p className="text-[12px] font-medium">
                    {DIRECT_CANCEL.has(item.state)
                        ? "Cancel item"
                        : "Request cancellation"}
                </p>
                <Input
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    placeholder="Reason (customer changed mind…)"
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        disabled={cancelling || requestingCancel}
                        onClick={onCancel}
                    >
                        {cancelling || requestingCancel
                            ? "Saving…"
                            : DIRECT_CANCEL.has(item.state)
                              ? "Cancel now"
                              : "Ask manager"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMode("idle")}
                    >
                        Back
                    </Button>
                </div>
                {error ? (
                    <p className="text-[12px] text-red-600">{error}</p>
                ) : null}
            </div>
        );
    }

    if (mode === "change") {
        return (
            <div className="mt-2 w-full min-w-[220px] space-y-2 rounded-[12px] border border-hairline bg-background p-3">
                <p className="text-[12px] font-medium">
                    Change item (e.g. pizza → burger)
                </p>
                <select
                    className="h-9 w-full rounded-md border border-hairline bg-card px-2 text-[13px]"
                    value={menuItemId}
                    onChange={event => setMenuItemId(event.target.value)}
                >
                    <option value="">Keep same dish…</option>
                    {swapChoices.map(entry => (
                        <option key={entry.id} value={entry.id}>
                            {entry.name} · {formatEtb(Number(entry.price))}
                        </option>
                    ))}
                </select>
                <Input
                    value={note}
                    onChange={event => setNote(event.target.value)}
                    placeholder="Note / instruction (optional)"
                />
                <Input
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    placeholder="Reason (optional)"
                />
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={changing} onClick={onChange}>
                        {changing ? "Saving…" : "Apply change"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMode("idle")}
                    >
                        Back
                    </Button>
                </div>
                {error ? (
                    <p className="text-[12px] text-red-600">{error}</p>
                ) : null}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1">
            {CHANGEABLE.has(item.state) ? (
                <div className="flex flex-wrap justify-end gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setError("");
                            setOk("");
                            setMode("change");
                        }}
                    >
                        Change
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setError("");
                            setOk("");
                            setMode("cancel");
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            ) : null}
            {ok ? (
                <p className="text-[12px] text-[#046645]">{ok}</p>
            ) : null}
            {error ? (
                <p className="text-[12px] text-red-600">{error}</p>
            ) : null}
        </div>
    );
}
