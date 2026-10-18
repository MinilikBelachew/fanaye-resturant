"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useApproveSupplyRequestMutation,
    useCreateSupplyRequestMutation,
    useListInventoryIngredientsQuery,
    useListSupplyRequestsQuery,
    useRejectSupplyRequestMutation,
    type InventorySupplyRequest,
} from "@/context/services/inventoryApi";
import {
    InventoryMultiSelect,
    PrimaryActionButton,
    QtyLineCard,
    parsePositiveQty,
} from "@/domains/inventory/ui/InventoryFormControls";
import { formatQty } from "@/lib/money";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

type SupplyLine = {
    ingredientId: string;
    name: string;
    unit: string;
    quantity: string;
};

export function RequestSupplyPanel() {
    const t = useTranslations("inventory");
    const { data: ingredientsRes } = useListInventoryIngredientsQuery({
        page: 1,
        limit: 100,
    });
    const catalog = ingredientsRes?.data ?? [];
    const [createRequest, creating] = useCreateSupplyRequestMutation();

    const [note, setNote] = useState("");
    const [lines, setLines] = useState<SupplyLine[]>([]);
    const [triedSubmit, setTriedSubmit] = useState(false);

    const selectedIds = useMemo(
        () => new Set(lines.map(l => l.ingredientId)),
        [lines],
    );

    const lineErrors = useMemo(() => {
        const map = new Map<string, string>();
        for (const line of lines) {
            if (
                line.quantity !== "" &&
                parsePositiveQty(line.quantity) == null
            ) {
                map.set(line.ingredientId, t("errQtyInvalid"));
            } else if (triedSubmit && parsePositiveQty(line.quantity) == null) {
                map.set(line.ingredientId, t("errQtyRequired"));
            }
        }
        return map;
    }, [lines, triedSubmit, t]);

    const validLines = useMemo(
        () =>
            lines
                .map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: parsePositiveQty(l.quantity),
                }))
                .filter(
                    (l): l is { ingredientId: string; quantity: number } =>
                        l.quantity != null,
                ),
        [lines],
    );

    const canSubmit =
        validLines.length > 0 && validLines.length === lines.length;

    function toggleLine(ingredientId: string) {
        const ing = catalog.find(i => i.id === ingredientId);
        if (!ing) return;
        setLines(prev => {
            if (prev.some(l => l.ingredientId === ingredientId)) {
                return prev.filter(l => l.ingredientId !== ingredientId);
            }
            return [
                ...prev,
                {
                    ingredientId: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    quantity: "",
                },
            ];
        });
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTriedSubmit(true);
        if (lines.length === 0) {
            toast.error(t("errSupplyIncomplete"));
            return;
        }
        if (!canSubmit) {
            toast.error(t("errFixLineQuantities"));
            return;
        }
        try {
            await createRequest({
                note: note.trim() || undefined,
                lines: validLines.map(l => ({
                    ingredientId: l.ingredientId,
                    quantity: l.quantity,
                })),
            }).unwrap();
            toast.success(t("toastSupplyRequested"));
            setLines([]);
            setNote("");
            setTriedSubmit(false);
        } catch (err) {
            toast.fromUnknown(err, t("errSupplyRequest"));
        }
    }

    return (
        <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-hairline p-4"
        >
            <div>
                <h3 className="text-[14px] font-semibold">
                    {t("requestSupplyTitle")}
                </h3>
                <p className="mt-1 text-[12px] text-slate-gray">
                    {t("requestSupplyHint")}
                </p>
            </div>

            <div className="space-y-1 text-[12px]">
                <span className="font-medium text-slate-gray">
                    {t("fieldItemsToRequest")}
                </span>
                <InventoryMultiSelect
                    placeholder={t("selectInputsPlaceholder")}
                    searchPlaceholder={t("searchInputsPlaceholder")}
                    emptyLabel={t("emptyInputOptions")}
                    selectedCountLabel={count =>
                        t("inputsSelectedCount", { count })
                    }
                    options={catalog.map(ing => ({
                        value: ing.id,
                        label: ing.name,
                        hint: ing.unit,
                    }))}
                    selectedIds={selectedIds}
                    onToggle={toggleLine}
                    error={
                        triedSubmit && lines.length === 0
                            ? t("errSupplyIncomplete")
                            : undefined
                    }
                />
            </div>

            <ul className="space-y-2">
                {lines.map(line => (
                    <QtyLineCard
                        key={line.ingredientId}
                        title={line.name}
                        quantity={line.quantity}
                        unit={line.unit}
                        quantityPlaceholder={t("fieldQuantity")}
                        removeLabel={t("removeLine")}
                        error={lineErrors.get(line.ingredientId)}
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
                {lines.length === 0 ? (
                    <li className="text-[13px] text-slate-gray">
                        {t("emptySupplyLines")}
                    </li>
                ) : null}
            </ul>

            <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t("colNote")}
                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
            />
            <PrimaryActionButton
                loading={creating.isLoading}
                disabled={!canSubmit && triedSubmit}
            >
                {creating.isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                {t("submitSupplyRequest")}
            </PrimaryActionButton>
        </form>
    );
}

export function PendingSupplyPanel() {
    const t = useTranslations("inventory");
    const { data, isLoading } = useListSupplyRequestsQuery({
        page: 1,
        limit: 50,
        direction: "pending",
    });
    const [approve, approving] = useApproveSupplyRequestMutation();
    const [reject, rejecting] = useRejectSupplyRequestMutation();
    const requests = data?.data ?? [];
    const busy = approving.isLoading || rejecting.isLoading;

    async function onApprove(req: InventorySupplyRequest) {
        try {
            await approve({ id: req.id }).unwrap();
            toast.success(t("toastSupplyApproved"));
        } catch (err) {
            toast.fromUnknown(err, t("errSupplyApprove"));
        }
    }

    async function onReject(req: InventorySupplyRequest) {
        try {
            await reject({
                id: req.id,
                decisionNote: t("rejectDefaultNote"),
            }).unwrap();
            toast.success(t("toastSupplyRejected"));
        } catch (err) {
            toast.fromUnknown(err, t("errSupplyReject"));
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loadingSupply")}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <p className="rounded-2xl border border-hairline px-4 py-8 text-center text-[13px] text-slate-gray">
                {t("emptyPendingSupply")}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-[12px] text-slate-gray">
                {t("pendingSupplyHint")}
            </p>
            {requests.map(req => (
                <div
                    key={req.id}
                    className="rounded-2xl border border-hairline p-4"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[14px] font-semibold">
                                {req.fromLocation.name} → {req.toLocation.name}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-gray">
                                {req.status}
                                {req.submittedAt
                                    ? ` · ${new Date(req.submittedAt).toLocaleString()}`
                                    : ""}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void onApprove(req)}
                                className="h-9 rounded-xl bg-brand px-3 text-[12px] font-semibold text-white disabled:opacity-60"
                            >
                                {t("approveAndShip")}
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void onReject(req)}
                                className="h-9 rounded-xl border border-hairline px-3 text-[12px] font-medium disabled:opacity-60"
                            >
                                {t("rejectTransfer")}
                            </button>
                        </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-[13px]">
                        {req.lines.map(line => (
                            <li key={line.id}>
                                {line.ingredient.name}:{" "}
                                {formatQty(line.quantityRequested)}{" "}
                                {line.ingredient.unit}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export function MySupplyRequestsPanel() {
    const t = useTranslations("inventory");
    const { data, isLoading } = useListSupplyRequestsQuery({
        page: 1,
        limit: 50,
        direction: "mine",
    });
    const requests = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loadingSupply")}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <p className="rounded-2xl border border-hairline px-4 py-8 text-center text-[13px] text-slate-gray">
                {t("emptyMySupply")}
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-hairline">
            <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-ivory text-slate-gray">
                    <tr>
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
                    {requests.map(req => (
                        <tr key={req.id} className="border-t border-hairline">
                            <td className="px-4 py-3">{req.status}</td>
                            <td className="px-4 py-3">
                                {req.lines
                                    .map(
                                        l =>
                                            `${l.ingredient.name} ${formatQty(l.quantityRequested)}${l.ingredient.unit}`,
                                    )
                                    .join(", ")}
                            </td>
                            <td className="px-4 py-3 text-slate-gray">
                                {new Date(req.createdAt).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
