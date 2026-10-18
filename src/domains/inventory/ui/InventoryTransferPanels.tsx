"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useAcceptInventoryTransferMutation,
    useCreateInventoryTransferMutation,
    useListInventoryBalancesQuery,
    useListInventoryLocationsQuery,
    useListInventoryTransfersQuery,
    useRejectInventoryTransferMutation,
    type InventoryTransfer,
} from "@/context/services/inventoryApi";
import {
    InventoryMultiSelect,
    InventoryNiceSelect,
    PrimaryActionButton,
    QtyLineCard,
    parsePositiveQty,
} from "@/domains/inventory/ui/InventoryFormControls";
import { formatQty } from "@/lib/money";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

type SendLine = {
    ingredientId: string;
    name: string;
    unit: string;
    quantity: string;
    onHandQty: number;
};

export function SendTransferPanel() {
    const t = useTranslations("inventory");
    const { data: locationsRes } = useListInventoryLocationsQuery();
    const locations = locationsRes?.data ?? [];
    const main = locations.find(l => l.type === "MAIN_WAREHOUSE");
    const branchStores = locations.filter(l => l.type === "BRANCH_STORE");

    const { data: mainStock } = useListInventoryBalancesQuery(
        { page: 1, limit: 100, locationId: main?.id },
        { skip: !main?.id },
    );

    const [createTransfer, sending] = useCreateInventoryTransferMutation();
    const [toLocationId, setToLocationId] = useState("");
    const [note, setNote] = useState("");
    const [lines, setLines] = useState<SendLine[]>([]);
    const [triedSubmit, setTriedSubmit] = useState(false);

    const stockRows = useMemo(
        () =>
            (mainStock?.data ?? []).filter(
                row => (Number(row.onHandQty) || 0) > 0,
            ),
        [mainStock?.data],
    );

    const selectedIds = useMemo(
        () => new Set(lines.map(l => l.ingredientId)),
        [lines],
    );

    const lineErrors = useMemo(() => {
        const map = new Map<string, string>();
        for (const line of lines) {
            const qty = parsePositiveQty(line.quantity);
            if (line.quantity !== "" && qty == null) {
                map.set(line.ingredientId, t("errQtyInvalid"));
                continue;
            }
            if (qty != null && qty > line.onHandQty) {
                map.set(
                    line.ingredientId,
                    t("errNotEnoughAtMain", {
                        name: line.name,
                        have: formatQty(line.onHandQty),
                        need: formatQty(qty),
                        unit: line.unit,
                    }),
                );
            }
        }
        return map;
    }, [lines, t]);

    const validLines = useMemo(
        () =>
            lines
                .map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: parsePositiveQty(l.quantity),
                    onHandQty: l.onHandQty,
                }))
                .filter(
                    (
                        l,
                    ): l is {
                        ingredientId: string;
                        quantity: number;
                        onHandQty: number;
                    } => l.quantity != null && l.quantity <= l.onHandQty,
                ),
        [lines],
    );

    const canSend =
        Boolean(toLocationId) &&
        validLines.length > 0 &&
        validLines.length === lines.length &&
        lineErrors.size === 0;

    function toggleLine(ingredientId: string) {
        const row = stockRows.find(r => r.ingredientId === ingredientId);
        if (!row) return;
        setLines(prev => {
            if (prev.some(l => l.ingredientId === ingredientId)) {
                return prev.filter(l => l.ingredientId !== ingredientId);
            }
            return [
                ...prev,
                {
                    ingredientId: row.ingredientId,
                    name: row.name,
                    unit: row.unit,
                    quantity: "",
                    onHandQty: Number(row.onHandQty) || 0,
                },
            ];
        });
    }

    async function onSend(e: React.FormEvent) {
        e.preventDefault();
        setTriedSubmit(true);
        if (!toLocationId) {
            toast.error(t("errPickDestination"));
            return;
        }
        if (lines.length === 0) {
            toast.error(t("errTransferIncomplete"));
            return;
        }
        if (!canSend) {
            toast.error(t("errFixLineQuantities"));
            return;
        }
        try {
            await createTransfer({
                toLocationId,
                note: note.trim() || undefined,
                lines: validLines.map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: l.quantity,
                })),
            }).unwrap();
            toast.success(t("toastTransferSent"));
            setLines([]);
            setNote("");
            setToLocationId("");
            setTriedSubmit(false);
        } catch (err) {
            toast.fromUnknown(err, t("errTransferSend"));
        }
    }

    if (!main) {
        return (
            <p className="text-[13px] text-slate-gray">
                {t("needMainForTransfer")}
            </p>
        );
    }

    return (
        <form onSubmit={onSend} className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3 rounded-2xl border border-hairline p-4">
                <h3 className="text-[14px] font-semibold">
                    {t("sendTransferTitle")}
                </h3>
                <p className="text-[12px] text-slate-gray">
                    {t("sendTransferHint")}
                </p>

                <div className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">
                        {t("fieldDestination")}
                    </span>
                    <InventoryNiceSelect
                        value={toLocationId}
                        placeholder={t("selectDestination")}
                        options={branchStores.map(loc => ({
                            value: loc.id,
                            label: loc.branch?.name
                                ? `${loc.name} · ${loc.branch.name}`
                                : loc.name,
                        }))}
                        onChange={setToLocationId}
                        error={
                            triedSubmit && !toLocationId
                                ? t("errPickDestination")
                                : undefined
                        }
                    />
                </div>

                {stockRows.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-hairline bg-secondary/40 px-3 py-3 text-[12px] text-slate-gray">
                        {t("emptyMainStockHint")}
                    </p>
                ) : (
                    <div className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("fieldItemsToSend")}
                        </span>
                        <InventoryMultiSelect
                            placeholder={t("selectInputsPlaceholder")}
                            searchPlaceholder={t("searchInputsPlaceholder")}
                            emptyLabel={t("emptyInputOptions")}
                            selectedCountLabel={count =>
                                t("inputsSelectedCount", { count })
                            }
                            options={stockRows.map(row => ({
                                value: row.ingredientId,
                                label: row.name,
                                hint: `${formatQty(row.onHandQty)} ${row.unit}`,
                            }))}
                            selectedIds={selectedIds}
                            onToggle={toggleLine}
                            error={
                                triedSubmit && lines.length === 0
                                    ? t("errTransferIncomplete")
                                    : undefined
                            }
                        />
                    </div>
                )}

                <ul className="space-y-2">
                    {lines.map(line => (
                        <QtyLineCard
                            key={line.ingredientId}
                            title={line.name}
                            hint={t("onHandShort", {
                                qty: formatQty(line.onHandQty),
                                unit: line.unit,
                            })}
                            quantity={line.quantity}
                            unit={line.unit}
                            max={line.onHandQty}
                            quantityPlaceholder={t("fieldQuantity")}
                            removeLabel={t("removeLine")}
                            error={
                                triedSubmit || line.quantity !== ""
                                    ? lineErrors.get(line.ingredientId)
                                    : undefined
                            }
                            onQuantityChange={v =>
                                setLines(prev =>
                                    prev.map(l =>
                                        l.ingredientId === line.ingredientId
                                            ? { ...l, quantity: v }
                                            : l,
                                    ),
                                )
                            }
                            onRemove={() => toggleLine(line.ingredientId)}
                        />
                    ))}
                    {lines.length === 0 && stockRows.length > 0 ? (
                        <li className="text-[13px] text-slate-gray">
                            {t("emptyTransferLines")}
                        </li>
                    ) : null}
                </ul>

                <label className="block space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">
                        {t("colNote")}
                    </span>
                    <input
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                    />
                </label>
            </div>
            <div className="space-y-3 rounded-2xl border border-hairline p-4">
                <p className="text-[12px] text-slate-gray">
                    {t("sendFromMain", { name: main.name })}
                </p>
                <PrimaryActionButton
                    className="w-full"
                    loading={sending.isLoading}
                    disabled={!canSend && triedSubmit}
                >
                    {sending.isLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    {t("sendTransfer")}
                </PrimaryActionButton>
                {!canSend ? (
                    <p className="text-[11px] text-slate-gray">
                        {t("sendReadyHint")}
                    </p>
                ) : null}
            </div>
        </form>
    );
}

export function IncomingTransfersPanel() {
    const t = useTranslations("inventory");
    const { data, isLoading } = useListInventoryTransfersQuery({
        page: 1,
        limit: 50,
        direction: "incoming",
    });
    const [acceptTransfer, accepting] = useAcceptInventoryTransferMutation();
    const [rejectTransfer, rejecting] = useRejectInventoryTransferMutation();
    const transfers = data?.data ?? [];

    const busy = accepting.isLoading || rejecting.isLoading;

    async function onAccept(transfer: InventoryTransfer) {
        try {
            await acceptTransfer({ id: transfer.id }).unwrap();
            toast.success(t("toastTransferAccepted"));
        } catch (err) {
            toast.fromUnknown(err, t("errTransferAccept"));
        }
    }

    async function onReject(transfer: InventoryTransfer) {
        try {
            await rejectTransfer({
                id: transfer.id,
                note: t("rejectDefaultNote"),
            }).unwrap();
            toast.success(t("toastTransferRejected"));
        } catch (err) {
            toast.fromUnknown(err, t("errTransferReject"));
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loadingTransfers")}
            </div>
        );
    }

    if (transfers.length === 0) {
        return (
            <p className="rounded-2xl border border-hairline px-4 py-8 text-center text-[13px] text-slate-gray">
                {t("emptyIncoming")}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {transfers.map(transfer => (
                <div
                    key={transfer.id}
                    className="rounded-2xl border border-hairline p-4"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[14px] font-semibold">
                                {transfer.fromLocation.name} →{" "}
                                {transfer.toLocation.name}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-gray">
                                {t("transferStatus", {
                                    status: transfer.status,
                                })}
                                {transfer.sentAt
                                    ? ` · ${new Date(transfer.sentAt).toLocaleString()}`
                                    : ""}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <PrimaryActionButton
                                type="button"
                                disabled={busy}
                                onClick={() => void onAccept(transfer)}
                                className="h-9 px-3 text-[12px]"
                            >
                                {t("acceptFull")}
                            </PrimaryActionButton>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void onReject(transfer)}
                                className="h-9 rounded-xl border border-hairline px-3 text-[12px] font-medium disabled:opacity-60"
                            >
                                {t("rejectTransfer")}
                            </button>
                        </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-[13px]">
                        {transfer.lines.map(line => (
                            <li key={line.id} className="tabular-nums">
                                {line.ingredient.name}:{" "}
                                {formatQty(line.quantitySent)}{" "}
                                {line.ingredient.unit}
                            </li>
                        ))}
                    </ul>
                    {transfer.note ? (
                        <p className="mt-2 text-[12px] text-slate-gray">
                            {transfer.note}
                        </p>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

export function OutgoingTransfersPanel() {
    const t = useTranslations("inventory");
    const { data, isLoading } = useListInventoryTransfersQuery({
        page: 1,
        limit: 50,
        direction: "outgoing",
    });
    const transfers = useMemo(() => data?.data ?? [], [data]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loadingTransfers")}
            </div>
        );
    }

    if (transfers.length === 0) {
        return (
            <p className="rounded-2xl border border-hairline px-4 py-8 text-center text-[13px] text-slate-gray">
                {t("emptyOutgoing")}
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-hairline">
            <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-ivory text-slate-gray">
                    <tr>
                        <th className="px-4 py-3 font-medium">
                            {t("fieldDestination")}
                        </th>
                        <th className="px-4 py-3 font-medium">
                            {t("colStatus")}
                        </th>
                        <th className="px-4 py-3 font-medium">
                            {t("colLines")}
                        </th>
                        <th className="px-4 py-3 font-medium">
                            {t("colWhen")}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {transfers.map(transfer => (
                        <tr
                            key={transfer.id}
                            className="border-t border-hairline"
                        >
                            <td className="px-4 py-3">
                                {transfer.toLocation.name}
                            </td>
                            <td className="px-4 py-3">{transfer.status}</td>
                            <td className="px-4 py-3">
                                {transfer.lines
                                    .map(
                                        l =>
                                            `${l.ingredient.name} ${formatQty(l.quantitySent)}${l.ingredient.unit}`,
                                    )
                                    .join(", ")}
                            </td>
                            <td className="px-4 py-3 text-slate-gray">
                                {transfer.sentAt
                                    ? new Date(transfer.sentAt).toLocaleString()
                                    : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
