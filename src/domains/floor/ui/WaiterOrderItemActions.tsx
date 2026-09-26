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
import { useTranslations } from "next-intl";

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
    const t = useTranslations("waiter");
    const tCommon = useTranslations("common");
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
            setError(t("addShortReason"));
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
                setOk(t("cancelledOk"));
            } else if (PROTECTED_CANCEL.has(item.state)) {
                await requestCancel({
                    orderItemId: item.orderItemId,
                    expectedVersion: item.version,
                    reason: reason.trim(),
                    tableSessionId,
                }).unwrap();
                setOk(t("sentToManager"));
            }
            resetForm();
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "ORDER_ITEM_NOT_CANCELLABLE") {
                    setError(t("kitchenStartedNeedApproval"));
                    return;
                }
            }
            setError(t("couldNotCancel"));
        }
    }

    async function onChange() {
        setError("");
        setOk("");
        if (!menuItemId && !note.trim()) {
            setError(t("pickDishOrNote"));
            return;
        }
        try {
            const result = await requestChange({
                orderItemId: item.orderItemId,
                expectedVersion: item.version,
                reason: reason.trim() || t("customerAskedChange"),
                requestedChange: {
                    ...(menuItemId ? { menuItemId } : {}),
                    ...(note.trim() ? { specialInstruction: note.trim() } : {}),
                },
                tableSessionId,
            }).unwrap();
            setOk(
                result.data.applied
                    ? t("changedTo", {
                          name: result.data.itemName ?? t("newItemFallback"),
                      })
                    : t("changeSentToManager"),
            );
            resetForm();
        } catch {
            setError(t("couldNotChange"));
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
                                {t("change")}
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
                                {t("cancelItem")}
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
                                ? t("cancelThisItem")
                                : t("askManagerCancel")}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {DIRECT_CANCEL.has(item.state)
                                ? t("cancelDirectHint")
                                : t("cancelProtectedHint")}
                        </p>
                    </div>
                    <Input
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                        placeholder={t("reasonPlaceholder")}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            disabled={cancelling || requestingCancel}
                            onClick={onCancel}
                        >
                            {cancelling || requestingCancel
                                ? t("saving")
                                : DIRECT_CANCEL.has(item.state)
                                  ? t("cancelNow")
                                  : t("askManager")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetForm}>
                            {tCommon("back")}
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
                            {t("changeDishTitle", { name: item.itemName })}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            {DIRECT_CHANGE.has(item.state)
                                ? t("stillQueuedHint")
                                : t("alreadyCookingSwapHint")}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-slate-gray">
                            {t("newDish")}
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
                                    ? t("loadingMenu")
                                    : t("keepSameDish")}
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
                            {t("kitchenNote")}
                        </label>
                        <Input
                            value={note}
                            onChange={event => setNote(event.target.value)}
                            placeholder={t("optionalStationNote")}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-slate-gray">
                            {t("reason")}
                        </label>
                        <Input
                            value={reason}
                            onChange={event => setReason(event.target.value)}
                            placeholder={t("optionalGuestReason")}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                        <Button
                            size="sm"
                            disabled={changing}
                            onClick={onChange}
                        >
                            {changing
                                ? t("saving")
                                : DIRECT_CHANGE.has(item.state)
                                  ? t("applyChange")
                                  : t("askManager")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetForm}>
                            {tCommon("back")}
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
