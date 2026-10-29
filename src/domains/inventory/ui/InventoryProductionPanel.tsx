"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useListInventoryBalancesQuery,
    useListInventoryIngredientsQuery,
    useListInventoryUnitConversionsQuery,
    useListProductionBatchesQuery,
    usePostProductionBatchMutation,
} from "@/context/services/inventoryApi";
import {
    InventoryMultiSelect,
    InventoryNiceSelect,
    PrimaryActionButton,
    QtyLineCard,
    parsePositiveQty,
} from "@/domains/inventory/ui/InventoryFormControls";
import { UnitPicker } from "@/domains/inventory/ui/UnitPicker";
import { toBaseQtyClient } from "@/domains/inventory/application/unitMath";
import { formatEtb, formatQty } from "@/lib/money";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

type ProduceInput = {
    ingredientId: string;
    name: string;
    unit: string;
    typedUnit: string;
    unitCost: number;
    quantity: string;
    onHandQty: number;
};

export default function InventoryProductionPanel({
    locationId,
    locationLabel,
}: {
    locationId: string;
    locationLabel?: string;
}) {
    const t = useTranslations("inventory");

    const { data: stockRes } = useListInventoryBalancesQuery(
        { page: 1, limit: 100, locationId },
        { skip: !locationId },
    );
    const { data: ingredientsRes } = useListInventoryIngredientsQuery({
        page: 1,
        limit: 100,
    });
    const { data: batchesRes, isLoading: loadingBatches } =
        useListProductionBatchesQuery(
            { page: 1, limit: 20, locationId: locationId || undefined },
            { skip: !locationId },
        );
    const { data: conversionsRes } = useListInventoryUnitConversionsQuery();
    const conversionRows = useMemo(
        () =>
            (conversionsRes?.data ?? [])
                .filter(c => c.status === "ACTIVE")
                .map(c => ({
                    fromUnit: c.fromUnit,
                    toUnit: c.toUnit,
                    factor: c.factor,
                })),
        [conversionsRes?.data],
    );
    const [postBatch, posting] = usePostProductionBatchMutation();

    const stockRows = stockRes?.data ?? [];
    const catalog = ingredientsRes?.data ?? [];
    const batches = batchesRes?.data ?? [];

    const [outputIngredientId, setOutputIngredientId] = useState("");
    const [outputQuantity, setOutputQuantity] = useState("");
    const [outputUnit, setOutputUnit] = useState("");
    const [expectedOutputQuantity, setExpectedOutputQuantity] = useState("");
    const [outputItemKind, setOutputItemKind] = useState<
        "PRODUCED" | "FINISHED"
    >("PRODUCED");
    const [note, setNote] = useState("");
    const [inputs, setInputs] = useState<ProduceInput[]>([]);
    const [triedSubmit, setTriedSubmit] = useState(false);

    const selectedIds = useMemo(
        () => new Set(inputs.map(i => i.ingredientId)),
        [inputs],
    );

    const lineErrors = useMemo(() => {
        const map = new Map<string, string>();
        for (const line of inputs) {
            const qty = parsePositiveQty(line.quantity);
            if (line.quantity !== "" && qty == null) {
                map.set(line.ingredientId, t("errQtyInvalid"));
                continue;
            }
            if (triedSubmit && qty == null) {
                map.set(line.ingredientId, t("errQtyRequired"));
                continue;
            }
            if (qty != null) {
                const baseQty = toBaseQtyClient(
                    qty,
                    line.typedUnit,
                    line.unit,
                    conversionRows,
                );
                if (baseQty == null) {
                    map.set(line.ingredientId, t("errUnitMismatch"));
                    continue;
                }
                if (baseQty > line.onHandQty) {
                    map.set(
                        line.ingredientId,
                        t("errNotEnoughAtLocation", {
                            name: line.name,
                            have: formatQty(line.onHandQty),
                            need: formatQty(baseQty),
                            unit: line.unit,
                        }),
                    );
                }
            }
        }
        return map;
    }, [inputs, triedSubmit, conversionRows, t]);

    const validInputs = useMemo(
        () =>
            inputs
                .map(i => {
                    const quantity = parsePositiveQty(i.quantity);
                    if (quantity == null) return null;
                    const baseQty = toBaseQtyClient(
                        quantity,
                        i.typedUnit,
                        i.unit,
                        conversionRows,
                    );
                    if (baseQty == null || baseQty > i.onHandQty) return null;
                    return {
                        ingredientId: i.ingredientId,
                        quantity,
                        baseQty,
                        typedUnit: i.typedUnit,
                        unit: i.unit,
                        unitCost: i.unitCost,
                    };
                })
                .filter(
                    (
                        i,
                    ): i is {
                        ingredientId: string;
                        quantity: number;
                        baseQty: number;
                        typedUnit: string;
                        unit: string;
                        unitCost: number;
                    } => i != null,
                ),
        [inputs, conversionRows],
    );

    const outputIngredient = catalog.find(i => i.id === outputIngredientId);
    const outputQty = parsePositiveQty(outputQuantity);
    const expectedQty = parsePositiveQty(expectedOutputQuantity);

    const yieldPreview = useMemo(() => {
        if (outputQty == null || validInputs.length === 0) return null;
        const inputCostTotal = validInputs.reduce(
            (sum, i) => sum + i.baseQty * i.unitCost,
            0,
        );
        const outputUnitCost = outputQty > 0 ? inputCostTotal / outputQty : 0;
        let yieldPercent: number | null = null;
        if (expectedQty != null) {
            yieldPercent = (outputQty / expectedQty) * 100;
        } else if (validInputs.length === 1) {
            yieldPercent = (outputQty / validInputs[0].baseQty) * 100;
        }
        return { inputCostTotal, outputUnitCost, yieldPercent };
    }, [expectedQty, outputQty, validInputs]);

    const canPost =
        Boolean(locationId) &&
        Boolean(outputIngredientId) &&
        outputQty != null &&
        validInputs.length > 0 &&
        validInputs.length === inputs.length &&
        lineErrors.size === 0;

    function toggleInput(ingredientId: string) {
        const row = stockRows.find(r => r.ingredientId === ingredientId);
        if (!row) return;
        if (row.ingredientId === outputIngredientId) {
            toast.error(t("errProduceSameAsOutput"));
            return;
        }
        setInputs(prev => {
            if (prev.some(l => l.ingredientId === ingredientId)) {
                return prev.filter(l => l.ingredientId !== ingredientId);
            }
            return [
                ...prev,
                {
                    ingredientId: row.ingredientId,
                    name: row.name,
                    unit: row.unit,
                    typedUnit: row.unit,
                    unitCost: Number(row.unitCost) || 0,
                    quantity: "",
                    onHandQty: Number(row.onHandQty) || 0,
                },
            ];
        });
    }

    async function onPost(e: React.FormEvent) {
        e.preventDefault();
        setTriedSubmit(true);
        if (!locationId) {
            toast.error(t("errPickProduceLocation"));
            return;
        }
        if (!outputIngredientId || outputQty == null) {
            toast.error(t("errProduceIncomplete"));
            return;
        }
        if (inputs.length === 0) {
            toast.error(t("errProduceIncomplete"));
            return;
        }
        if (!canPost) {
            toast.error(t("errFixLineQuantities"));
            return;
        }
        try {
            const res = await postBatch({
                locationId,
                outputIngredientId,
                outputQuantity: outputQty,
                ...(outputUnit &&
                outputIngredient &&
                outputUnit !== outputIngredient.unit
                    ? { outputUnit }
                    : {}),
                ...(expectedQty != null
                    ? { expectedOutputQuantity: expectedQty }
                    : {}),
                outputItemKind,
                note: note.trim() || undefined,
                inputs: validInputs.map(i => ({
                    ingredientId: i.ingredientId,
                    quantity: i.quantity,
                    ...(i.typedUnit !== i.unit ? { unit: i.typedUnit } : {}),
                })),
            }).unwrap();
            const y = res.data.yieldPercent;
            toast.success(
                t("toastProducePosted"),
                y != null
                    ? t("toastProduceYield", {
                          yield: Number(y).toFixed(1),
                          unitCost: formatEtb(res.data.outputUnitCost),
                      })
                    : formatEtb(res.data.outputUnitCost),
            );
            setInputs([]);
            setOutputQuantity("");
            setOutputUnit("");
            setExpectedOutputQuantity("");
            setNote("");
            setTriedSubmit(false);
        } catch (err) {
            toast.fromUnknown(err, t("errProducePost"));
        }
    }

    if (!locationId) {
        return (
            <p className="text-[13px] text-slate-gray">
                {t("errPickProduceLocation")}
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <p className="text-[13px] text-slate-gray">
                    {t("produceHint")}
                </p>
                <p className="text-[12px] text-slate-gray">
                    {t("produceYieldExample")}
                </p>
                {locationLabel ? (
                    <p className="text-[12px] font-medium text-foreground">
                        {t("produceAtLocation", { location: locationLabel })}
                    </p>
                ) : null}
            </div>

            <form
                onSubmit={onPost}
                className="grid gap-5 lg:grid-cols-[1fr_300px]"
            >
                <div className="space-y-3 rounded-2xl border border-hairline p-4">
                    <h3 className="text-[14px] font-semibold">
                        {t("produceTitle")}
                    </h3>

                    <div className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("fieldOutput")}
                        </span>
                        <InventoryNiceSelect
                            value={outputIngredientId}
                            placeholder={t("selectIngredient")}
                            options={catalog.map(ing => ({
                                value: ing.id,
                                label: `${ing.name} (${ing.unit})${ing.itemKind ? ` · ${ing.itemKind}` : ""}${
                                    ing.standardYieldPercent != null
                                        ? ` · ${Number(ing.standardYieldPercent).toFixed(0)}%`
                                        : ""
                                }`,
                            }))}
                            onChange={v => {
                                setOutputIngredientId(v);
                                const ing = catalog.find(i => i.id === v);
                                setOutputUnit(ing?.unit ?? "");
                                setInputs(prev =>
                                    prev.filter(l => l.ingredientId !== v),
                                );
                            }}
                            error={
                                triedSubmit && !outputIngredientId
                                    ? t("errPickOutput")
                                    : undefined
                            }
                        />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="block space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldOutputQty")}
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={outputQuantity}
                                onChange={e =>
                                    setOutputQuantity(e.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                placeholder={t("fieldActualQtyHint")}
                            />
                            {triedSubmit && outputQty == null ? (
                                <span className="text-[11px] text-rose-600">
                                    {t("errQtyRequired")}
                                </span>
                            ) : null}
                        </label>
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("colUnit")}
                            </span>
                            <UnitPicker
                                baseUnit={outputIngredient?.unit ?? ""}
                                value={
                                    outputUnit || outputIngredient?.unit || ""
                                }
                                onChange={setOutputUnit}
                                disabled={!outputIngredient}
                            />
                        </div>
                        <label className="block space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldExpectedQty")}
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={expectedOutputQuantity}
                                onChange={e =>
                                    setExpectedOutputQuantity(e.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                                placeholder={t("fieldExpectedQtyHint")}
                            />
                        </label>
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldOutputKind")}
                            </span>
                            <InventoryNiceSelect
                                value={outputItemKind}
                                placeholder={t("fieldOutputKind")}
                                options={[
                                    {
                                        value: "PRODUCED",
                                        label: t("itemKindProduced"),
                                    },
                                    {
                                        value: "FINISHED",
                                        label: t("itemKindFinished"),
                                    },
                                ]}
                                onChange={v =>
                                    setOutputItemKind(
                                        v as "PRODUCED" | "FINISHED",
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="border-t border-hairline pt-3">
                        <p className="mb-2 text-[12px] font-medium text-slate-gray">
                            {t("fieldInputs")}
                        </p>
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
                                disabled:
                                    row.ingredientId === outputIngredientId,
                            }))}
                            selectedIds={selectedIds}
                            onToggle={toggleInput}
                            error={
                                triedSubmit && inputs.length === 0
                                    ? t("errProduceIncomplete")
                                    : undefined
                            }
                        />

                        <ul className="mt-3 space-y-2">
                            {inputs.map(line => (
                                <QtyLineCard
                                    key={line.ingredientId}
                                    title={line.name}
                                    hint={t("onHandShort", {
                                        qty: formatQty(line.onHandQty),
                                        unit: line.unit,
                                    })}
                                    quantity={line.quantity}
                                    unit={line.unit}
                                    unitNode={
                                        <UnitPicker
                                            compact
                                            baseUnit={line.unit}
                                            value={line.typedUnit}
                                            onChange={v =>
                                                setInputs(prev =>
                                                    prev.map(l =>
                                                        l.ingredientId ===
                                                        line.ingredientId
                                                            ? {
                                                                  ...l,
                                                                  typedUnit: v,
                                                              }
                                                            : l,
                                                    ),
                                                )
                                            }
                                        />
                                    }
                                    max={
                                        line.typedUnit !== line.unit
                                            ? (toBaseQtyClient(
                                                  line.onHandQty,
                                                  line.unit,
                                                  line.typedUnit,
                                                  conversionRows,
                                              ) ?? undefined)
                                            : line.onHandQty
                                    }
                                    quantityPlaceholder={t("fieldQuantity")}
                                    removeLabel={t("removeLine")}
                                    error={lineErrors.get(line.ingredientId)}
                                    onQuantityChange={v =>
                                        setInputs(prev =>
                                            prev.map(l =>
                                                l.ingredientId ===
                                                line.ingredientId
                                                    ? { ...l, quantity: v }
                                                    : l,
                                            ),
                                        )
                                    }
                                    onRemove={() =>
                                        toggleInput(line.ingredientId)
                                    }
                                />
                            ))}
                            {inputs.length === 0 ? (
                                <li className="text-[13px] text-slate-gray">
                                    {t("emptyProduceInputs")}
                                </li>
                            ) : null}
                        </ul>
                    </div>

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
                    <p className="text-[12px] font-medium text-foreground">
                        {t("yieldTestTitle")}
                    </p>
                    {yieldPreview ? (
                        <dl className="space-y-2 text-[12px]">
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-gray">
                                    {t("yieldPercent")}
                                </dt>
                                <dd className="font-semibold tabular-nums">
                                    {yieldPreview.yieldPercent != null
                                        ? `${yieldPreview.yieldPercent.toFixed(1)}%`
                                        : "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-gray">
                                    {t("inputCostTotal")}
                                </dt>
                                <dd className="tabular-nums">
                                    {formatEtb(yieldPreview.inputCostTotal)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-slate-gray">
                                    {t("outputUnitCost")}
                                </dt>
                                <dd className="font-semibold tabular-nums">
                                    {formatEtb(yieldPreview.outputUnitCost)}
                                </dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="text-[12px] text-slate-gray">
                            {t("produceSidebar")}
                        </p>
                    )}
                    <PrimaryActionButton
                        className="w-full"
                        loading={posting.isLoading}
                        disabled={!canPost && triedSubmit}
                    >
                        {posting.isLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : null}
                        {t("postProduction")}
                    </PrimaryActionButton>
                </div>
            </form>

            <div>
                <h3 className="mb-2 text-[14px] font-semibold">
                    {t("recentProduction")}
                </h3>
                {loadingBatches ? (
                    <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                        <Loader2 className="size-4 animate-spin" />
                        {t("loadingProduction")}
                    </div>
                ) : batches.length === 0 ? (
                    <p className="rounded-2xl border border-hairline px-4 py-6 text-center text-[13px] text-slate-gray">
                        {t("emptyProduction")}
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-hairline">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-surface-ivory text-slate-gray">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        {t("fieldOutput")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("yieldPercent")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("fieldInputs")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colWhen")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map(batch => (
                                    <tr
                                        key={batch.id}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-3">
                                            {batch.output.name}{" "}
                                            <span className="tabular-nums">
                                                {formatQty(
                                                    batch.outputQuantity,
                                                )}{" "}
                                                {batch.outputUnit ??
                                                    batch.output.unit}
                                            </span>
                                            {batch.outputUnitCost > 0 ? (
                                                <span className="mt-0.5 block text-[11px] text-slate-gray">
                                                    {formatEtb(
                                                        batch.outputUnitCost,
                                                    )}
                                                    /{batch.output.unit}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {batch.yieldPercent != null
                                                ? `${Number(batch.yieldPercent).toFixed(1)}%`
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-gray">
                                            {batch.inputs
                                                .map(
                                                    i =>
                                                        `${i.ingredient.name} ${formatQty(i.quantity)}${i.unit ?? i.ingredient.unit}`,
                                                )
                                                .join(", ")}
                                        </td>
                                        <td className="px-4 py-3 text-slate-gray">
                                            {new Date(
                                                batch.createdAt,
                                            ).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
