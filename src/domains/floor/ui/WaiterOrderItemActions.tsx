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
import { cn } from "@/lib/utils";

const DIRECT_CANCEL = new Set(["QUEUED", "ACKNOWLEDGED", "CONFIRMED"]);
const PROTECTED_CANCEL = new Set(["IN_PREPARATION", "READY"]);
const CHANGEABLE = new Set([
    "QUEUED",
    "ACKNOWLEDGED",
    "IN_PREPARATION",
    "READY",
]);
const DIRECT_CHANGE = new Set(["QUEUED", "ACKNOWLEDGED"]);

type Props = {
    item: SessionOrderItem;
    tableSessionId: string;
    className?: string;
};

export default function WaiterOrderItemActions({
    item,
    tableSessionId,
    className,
}: Props) {
    const [mode, setMode] = useState<"idle" | "cancel" | "change">("idle");
    const [reason, setReason] = useState("");
    const [menuItemId, setMenuItemId] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    const { data: menu, isFetching: loadingMenu } = useWaiterMenuQuery(
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

    function resetForm() {
        setMode("idle");
        setReason("");
        setMenuItemId("");
        setNote("");
        setError("");
    }

    if (
        item.state === "CANCELLED" ||
        item.state === "SERVED" ||
        item.state === "CANCELLATION_REQUESTED" ||
        item.state === "CHANGE_REQUESTED"
    ) {
        return (
            <p className={cn("text-[12px] text-slate-gray", className)}>
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
            resetForm();
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
                    ...(note.trim() ? { specialInstruction: note.trim() } : {}),
                },
                tableSessionId,
            }).unwrap();
            setOk(
                result.data.applied
                    ? `Changed to ${result.data.itemName ?? "new item"}.`
                    : "Change sent to manager.",
            );
            resetForm();
        } catch {
            setError("Could not change item. Refresh and try again.");
        }
    }

    const editing = mode === "cancel" || mode === "change";

    return (
        <div
            className={cn(
                "flex flex-col gap-2",
                editing ? "w-full min-w-0" : "items-end",
                className,
            )}
        >
            {mode === "idle" ? (
                <div className="flex flex-col items-end gap-1">
                    {CHANGEABLE.has(item.state) ? (
                        <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
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
                                className="h-8"
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
            ) : null}

            {mode === "cancel" ? (
                <div className="w-full space-y-3 rounded-[16px] border border-hairline bg-secondary/30 p-3.5">
                    <div>
                        <p className="text-[13px] font-semibold text-foreground">
                            {DIRECT_CANCEL.has(item.state)
                                ? "Cancel this item"
                                : "Ask manager to cancel"}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {DIRECT_CANCEL.has(item.state)
                                ? "Kitchen has not started cooking — cancel goes through now."
                                : "Item is already cooking or ready — manager must approve."}
                        </p>
                    </div>
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
                        <Button size="sm" variant="outline" onClick={resetForm}>
                            Back
                        </Button>
                    </div>
                    {error ? (
                        <p className="text-[12px] text-red-600">{error}</p>
                    ) : null}
                </div>
            ) : null}

            {mode === "change" ? (
                <div className="w-full space-y-3 rounded-[16px] border border-hairline bg-secondary/30 p-3.5">
                    <div>
                        <p className="text-[13px] font-semibold text-foreground">
                            Change {item.itemName}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {DIRECT_CHANGE.has(item.state)
                                ? "Still queued — swap applies immediately for the kitchen."
                                : "Already cooking or ready — manager must approve the swap."}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-slate-gray">
                            New dish
                        </label>
                        <select
                            className="h-10 w-full rounded-[10px] border border-hairline bg-card px-3 text-[13px] outline-none focus:border-brand/40"
                            value={menuItemId}
                            onChange={event =>
                                setMenuItemId(event.target.value)
                            }
                            disabled={loadingMenu}
                        >
                            <option value="">
                                {loadingMenu
                                    ? "Loading menu…"
                                    : "Keep same dish…"}
                            </option>
                            {swapChoices.map(entry => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.name} ·{" "}
                                    {formatEtb(Number(entry.price))}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-slate-gray">
                            Kitchen note
                        </label>
                        <Input
                            value={note}
                            onChange={event => setNote(event.target.value)}
                            placeholder="Optional instruction for the station"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-slate-gray">
                            Reason
                        </label>
                        <Input
                            value={reason}
                            onChange={event => setReason(event.target.value)}
                            placeholder="Optional — why the guest changed"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                        <Button
                            size="sm"
                            disabled={changing}
                            onClick={onChange}
                        >
                            {changing
                                ? "Saving…"
                                : DIRECT_CHANGE.has(item.state)
                                  ? "Apply change"
                                  : "Ask manager"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetForm}>
                            Back
                        </Button>
                    </div>
                    {error ? (
                        <p className="text-[12px] text-red-600">{error}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
