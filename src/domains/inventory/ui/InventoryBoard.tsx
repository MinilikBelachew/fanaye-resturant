"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useCreateInventoryIngredientMutation,
    useListInventoryBalancesQuery,
    useListInventoryCountsQuery,
    useListInventoryIngredientsQuery,
    useListInventoryLedgerQuery,
    useListInventoryUnitsQuery,
    usePostInventoryCountMutation,
    useReceiveInventoryStockMutation,
    useStartInventoryCountMutation,
    useUpdateInventoryCountLinesMutation,
    useGetInventoryCountQuery,
    useWasteInventoryStockMutation,
} from "@/context/services/inventoryApi";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Tab = "stock" | "ingredients" | "receive" | "waste" | "counts" | "ledger";

export default function InventoryBoard() {
    const t = useTranslations("inventory");
    const tabs: { id: Tab; label: string }[] = [
        { id: "stock", label: t("tabs.stock") },
        { id: "ingredients", label: t("tabs.ingredients") },
        { id: "receive", label: t("tabs.receive") },
        { id: "waste", label: t("tabs.waste") },
        { id: "counts", label: t("tabs.counts") },
        { id: "ledger", label: t("tabs.ledger") },
    ];
    const [tab, setTab] = useState<Tab>("stock");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [ledgerType, setLedgerType] = useState("");
    const [activeCountId, setActiveCountId] = useState<string | null>(null);

    const { data: unitsRes } = useListInventoryUnitsQuery();
    const unitOptions = unitsRes?.data ?? [];

    const listParams = useMemo(
        () => ({
            page,
            limit: 25,
            q: q.trim() || undefined,
            ...(tab === "stock" && lowStockOnly ? { lowStock: "true" } : {}),
            ...(tab === "ledger" && ledgerType ? { type: ledgerType } : {}),
        }),
        [page, q, tab, lowStockOnly, ledgerType],
    );

    const balances = useListInventoryBalancesQuery(listParams, {
        skip: tab !== "stock",
    });
    const moneySummary = useListInventoryBalancesQuery(
        { page: 1, limit: 1 },
        { pollingInterval: 15000 },
    );
    const ingredients = useListInventoryIngredientsQuery(listParams, {
        skip: tab !== "ingredients" && tab !== "receive" && tab !== "waste",
    });
    const ledger = useListInventoryLedgerQuery(listParams, {
        skip: tab !== "ledger",
    });
    const counts = useListInventoryCountsQuery(
        { page, limit: 25 },
        { skip: tab !== "counts" },
    );
    const countDetail = useGetInventoryCountQuery(activeCountId ?? "", {
        skip: !activeCountId,
    });

    const [createIngredient, creating] = useCreateInventoryIngredientMutation();
    const [receiveStock, receiving] = useReceiveInventoryStockMutation();
    const [wasteStock, wasting] = useWasteInventoryStockMutation();
    const [startCount, starting] = useStartInventoryCountMutation();
    const [updateLines, savingLines] = useUpdateInventoryCountLinesMutation();
    const [postCount, posting] = usePostInventoryCountMutation();

    const [ingForm, setIngForm] = useState({
        name: "",
        unit: "kg",
        unitCost: "",
        parLevel: "",
        initialQty: "",
    });
    const [receiveForm, setReceiveForm] = useState({
        ingredientId: "",
        quantity: "",
        unitCost: "",
        supplierNote: "",
        invoiceRef: "",
    });
    const [wasteForm, setWasteForm] = useState({
        ingredientId: "",
        quantity: "",
        note: "",
    });
    const [countEdits, setCountEdits] = useState<Record<string, string>>({});

    function resetPageOnSearch(value: string) {
        setQ(value);
        setPage(1);
    }

    async function onCreateIngredient(e: React.FormEvent) {
        e.preventDefault();
        try {
            await createIngredient({
                name: ingForm.name.trim(),
                unit: ingForm.unit.trim() || "kg",
                unitCost: Number(ingForm.unitCost) || 0,
                parLevel: Number(ingForm.parLevel) || 0,
                initialQty: Number(ingForm.initialQty) || 0,
            }).unwrap();
            toast.success(t("toastIngredientCreated"), ingForm.name.trim());
            setIngForm({
                name: "",
                unit: "kg",
                unitCost: "",
                parLevel: "",
                initialQty: "",
            });
        } catch (err) {
            toast.fromUnknown(err, t("errCreateIngredient"));
        }
    }

    async function onReceive(e: React.FormEvent) {
        e.preventDefault();
        try {
            await receiveStock({
                ingredientId: receiveForm.ingredientId,
                quantity: Number(receiveForm.quantity),
                unitCost: receiveForm.unitCost
                    ? Number(receiveForm.unitCost)
                    : undefined,
                supplierNote: receiveForm.supplierNote || undefined,
                invoiceRef: receiveForm.invoiceRef || undefined,
            }).unwrap();
            toast.success(t("toastStockReceived"));
            setReceiveForm({
                ingredientId: "",
                quantity: "",
                unitCost: "",
                supplierNote: "",
                invoiceRef: "",
            });
        } catch (err) {
            toast.fromUnknown(err, t("errReceive"));
        }
    }

    async function onWaste(e: React.FormEvent) {
        e.preventDefault();
        try {
            await wasteStock({
                ingredientId: wasteForm.ingredientId,
                quantity: Number(wasteForm.quantity),
                note: wasteForm.note || undefined,
            }).unwrap();
            toast.success(t("toastWasteLogged"));
            setWasteForm({ ingredientId: "", quantity: "", note: "" });
        } catch (err) {
            toast.fromUnknown(err, t("errWaste"));
        }
    }

    async function onStartCount() {
        try {
            const res = await startCount({}).unwrap();
            setActiveCountId(res.data.id);
            toast.success(t("toastCountStarted"));
        } catch (err) {
            toast.fromUnknown(err, t("errStartCount"));
        }
    }

    async function onSaveCountLines() {
        if (!activeCountId || !countDetail.data?.data) return;
        const lines = countDetail.data.data.lines
            .map(line => {
                const raw =
                    countEdits[line.ingredientId] ??
                    (line.countedQty != null ? String(line.countedQty) : "");
                if (raw === "") return null;
                return {
                    ingredientId: line.ingredientId,
                    countedQty: Number(raw),
                };
            })
            .filter(Boolean) as Array<{
            ingredientId: string;
            countedQty: number;
        }>;
        try {
            await updateLines({ id: activeCountId, lines }).unwrap();
            toast.success(t("toastCountLinesSaved"));
        } catch (err) {
            toast.fromUnknown(err, t("errSaveLines"));
        }
    }

    async function onPostCount() {
        if (!activeCountId) return;
        try {
            await onSaveCountLines();
            await postCount(activeCountId).unwrap();
            toast.success(t("toastCountPosted"));
            setActiveCountId(null);
            setCountEdits({});
        } catch (err) {
            toast.fromUnknown(err, t("errPostCount"));
        }
    }

    const meta =
        tab === "stock"
            ? balances.data?.meta
            : tab === "ingredients"
              ? ingredients.data?.meta
              : tab === "ledger"
                ? ledger.data?.meta
                : counts.data?.meta;

    const ingredientOptions = ingredients.data?.data ?? [];
    const summary =
        (tab === "stock" ? balances.data?.summary : undefined) ??
        moneySummary.data?.summary;

    const selectedReceive = ingredientOptions.find(
        i => i.id === receiveForm.ingredientId,
    );
    const receiveQty = Number(receiveForm.quantity) || 0;
    const receiveUnitCost =
        receiveForm.unitCost !== ""
            ? Number(receiveForm.unitCost) || 0
            : (selectedReceive?.unitCost ?? 0);
    const receiveTotal = receiveQty * receiveUnitCost;

    const selectedWaste = ingredientOptions.find(
        i => i.id === wasteForm.ingredientId,
    );
    const wasteQty = Number(wasteForm.quantity) || 0;
    const wasteTotal = wasteQty * (selectedWaste?.unitCost ?? 0);

    const openingQty = Number(ingForm.initialQty) || 0;
    const openingCost = Number(ingForm.unitCost) || 0;
    const openingValue = openingQty * openingCost;

    return (
        <div className="space-y-5">
            {summary ? (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
                        {[
                            {
                                label: t("moneyStockValue"),
                                value: formatEtb(summary.totalStockValue),
                                tone: "text-foreground",
                            },
                            {
                                label: t("moneyLowStockValue"),
                                value: formatEtb(summary.lowStockValue),
                                tone: "text-amber-700 dark:text-amber-400",
                            },
                            {
                                label: t("moneySkuCount"),
                                value: String(summary.skuCount),
                                tone: "text-foreground",
                            },
                            {
                                label: t("moneyLowStockCount"),
                                value: String(summary.lowStockCount),
                                tone: "text-amber-700 dark:text-amber-400",
                            },
                        ].map(stat => (
                            <div key={stat.label} className="bg-card px-4 py-3">
                                <p className="text-[10px] uppercase tracking-[0.1em] text-slate-gray">
                                    {stat.label}
                                </p>
                                <p
                                    className={cn(
                                        "mt-1 text-[18px] font-medium tabular-nums tracking-tight",
                                        stat.tone,
                                    )}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-gray">
                        {t("moneyHint")}
                    </p>
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-b border-hairline pb-3">
                {tabs.map(tabItem => (
                    <button
                        key={tabItem.id}
                        type="button"
                        onClick={() => {
                            setTab(tabItem.id);
                            setPage(1);
                            setActiveCountId(null);
                        }}
                        className={cn(
                            "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                            tab === tabItem.id
                                ? "bg-brand text-white"
                                : "bg-surface-ivory text-slate-gray hover:text-foreground",
                        )}
                    >
                        {tabItem.label}
                    </button>
                ))}
            </div>

            {(tab === "stock" || tab === "ingredients" || tab === "ledger") && (
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={q}
                        onChange={e => resetPageOnSearch(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="h-10 w-full max-w-xs rounded-xl border border-hairline bg-background px-3 text-[13px]"
                    />
                    {tab === "stock" ? (
                        <label className="flex items-center gap-2 text-[13px]">
                            <input
                                type="checkbox"
                                checked={lowStockOnly}
                                onChange={e => {
                                    setLowStockOnly(e.target.checked);
                                    setPage(1);
                                }}
                            />
                            {t("lowStockOnly")}
                        </label>
                    ) : null}
                    {tab === "ledger" ? (
                        <select
                            value={ledgerType}
                            onChange={e => {
                                setLedgerType(e.target.value);
                                setPage(1);
                            }}
                            className="h-10 rounded-xl border border-hairline bg-background px-3 text-[13px]"
                        >
                            <option value="">{t("allTypes")}</option>
                            {[
                                "OPENING",
                                "RECEIVE",
                                "SALE_DEPLETE",
                                "WASTE",
                                "COUNT_ADJUST",
                                "REVERSAL",
                            ].map(entryType => (
                                <option key={entryType} value={entryType}>
                                    {entryType}
                                </option>
                            ))}
                        </select>
                    ) : null}
                </div>
            )}

            {tab === "stock" ? (
                <div className="overflow-hidden rounded-2xl border border-hairline">
                    {balances.isLoading ? (
                        <LoadingRow />
                    ) : (
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-surface-ivory text-slate-gray">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colIngredient")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colOnHand")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colPar")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colCost")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colValue")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colStatus")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(balances.data?.data ?? []).map(row => (
                                    <tr
                                        key={row.ingredientId}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {row.name}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {row.onHandQty} {row.unit}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {row.parLevel} {row.unit}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-slate-gray">
                                            {formatEtb(row.unitCost)}
                                            <span className="text-[11px]">
                                                {" "}
                                                / {row.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium tabular-nums">
                                            {formatEtb(
                                                row.stockValue ??
                                                    row.onHandQty *
                                                        row.unitCost,
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.isLowStock ? (
                                                <span className="text-amber-600">
                                                    {t("statusLow")}
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600">
                                                    {t("statusOk")}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(balances.data?.data ?? []).length === 0 ? (
                                    <EmptyRow
                                        text={t("emptyStock")}
                                        colSpan={6}
                                    />
                                ) : null}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : null}

            {tab === "ingredients" ? (
                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="overflow-hidden rounded-2xl border border-hairline">
                        {ingredients.isLoading ? (
                            <LoadingRow />
                        ) : (
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-surface-ivory text-slate-gray">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colName")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colUnit")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colOnHand")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colCost")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colValue")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(ingredients.data?.data ?? []).map(row => (
                                        <tr
                                            key={row.id}
                                            className="border-t border-hairline"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {row.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.unit}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums">
                                                {row.onHandQty}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-slate-gray">
                                                {formatEtb(row.unitCost)}
                                            </td>
                                            <td className="px-4 py-3 font-medium tabular-nums">
                                                {formatEtb(
                                                    row.stockValue ??
                                                        row.onHandQty *
                                                            row.unitCost,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(ingredients.data?.data ?? []).length ===
                                    0 ? (
                                        <EmptyRow
                                            text={t("emptyIngredients")}
                                            colSpan={5}
                                        />
                                    ) : null}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <form
                        onSubmit={onCreateIngredient}
                        className="space-y-3 rounded-2xl border border-hairline p-4"
                    >
                        <h3 className="text-[14px] font-semibold">
                            {t("addIngredient")}
                        </h3>
                        <Field
                            label={t("fieldName")}
                            value={ingForm.name}
                            onChange={v => setIngForm(s => ({ ...s, name: v }))}
                            required
                        />
                        <label className="block space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldUnit")}
                            </span>
                            <select
                                required
                                value={ingForm.unit}
                                onChange={e =>
                                    setIngForm(s => ({
                                        ...s,
                                        unit: e.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                            >
                                {unitOptions.length === 0 ? (
                                    <option value="kg">kg</option>
                                ) : (
                                    unitOptions.map(u => (
                                        <option key={u.id} value={u.code}>
                                            {u.name} ({u.code})
                                        </option>
                                    ))
                                )}
                            </select>
                        </label>
                        <Field
                            label={t("fieldUnitCost")}
                            value={ingForm.unitCost}
                            onChange={v =>
                                setIngForm(s => ({ ...s, unitCost: v }))
                            }
                            type="number"
                        />
                        <Field
                            label={t("fieldParLevel")}
                            hint={t("fieldParHint")}
                            value={ingForm.parLevel}
                            onChange={v =>
                                setIngForm(s => ({ ...s, parLevel: v }))
                            }
                            type="number"
                        />
                        <Field
                            label={t("fieldInitialQty")}
                            hint={t("fieldInitialHint")}
                            value={ingForm.initialQty}
                            onChange={v =>
                                setIngForm(s => ({ ...s, initialQty: v }))
                            }
                            type="number"
                        />
                        {openingQty > 0 ? (
                            <div className="rounded-xl bg-secondary/60 px-3 py-2 text-[12px]">
                                <span className="text-slate-gray">
                                    {t("openingValue")}
                                </span>
                                <span className="ml-2 font-medium tabular-nums text-foreground">
                                    {formatEtb(openingValue)}
                                </span>
                            </div>
                        ) : null}
                        <button
                            type="submit"
                            disabled={creating.isLoading}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[13px] font-semibold text-white disabled:opacity-60"
                        >
                            {creating.isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {t("create")}
                        </button>
                    </form>
                </div>
            ) : null}

            {tab === "receive" ? (
                <form
                    onSubmit={onReceive}
                    className="max-w-lg space-y-3 rounded-2xl border border-hairline p-4"
                >
                    <h3 className="text-[14px] font-semibold">
                        {t("receiveTitle")}
                    </h3>
                    <IngredientSelect
                        label={t("fieldIngredient")}
                        placeholder={t("selectIngredient")}
                        value={receiveForm.ingredientId}
                        options={ingredientOptions}
                        onChange={v => {
                            const picked = ingredientOptions.find(
                                i => i.id === v,
                            );
                            setReceiveForm(s => ({
                                ...s,
                                ingredientId: v,
                                unitCost:
                                    s.unitCost ||
                                    (picked
                                        ? String(picked.unitCost)
                                        : s.unitCost),
                            }));
                        }}
                    />
                    <Field
                        label={t("fieldQuantity")}
                        value={receiveForm.quantity}
                        onChange={v =>
                            setReceiveForm(s => ({ ...s, quantity: v }))
                        }
                        type="number"
                        required
                    />
                    <Field
                        label={t("fieldUnitCostOptional")}
                        value={receiveForm.unitCost}
                        onChange={v =>
                            setReceiveForm(s => ({ ...s, unitCost: v }))
                        }
                        type="number"
                    />
                    <Field
                        label={t("fieldSupplierNote")}
                        value={receiveForm.supplierNote}
                        onChange={v =>
                            setReceiveForm(s => ({ ...s, supplierNote: v }))
                        }
                    />
                    <Field
                        label={t("fieldInvoiceRef")}
                        value={receiveForm.invoiceRef}
                        onChange={v =>
                            setReceiveForm(s => ({ ...s, invoiceRef: v }))
                        }
                    />
                    {receiveQty > 0 ? (
                        <div className="rounded-xl bg-secondary/60 px-3 py-2 text-[12px]">
                            <span className="text-slate-gray">
                                {t("receiveLineTotal")}
                            </span>
                            <span className="ml-2 font-medium tabular-nums text-foreground">
                                {formatEtb(receiveTotal)}
                            </span>
                            <span className="ml-2 text-[11px] text-slate-gray">
                                ({receiveQty} × {formatEtb(receiveUnitCost)})
                            </span>
                        </div>
                    ) : null}
                    <button
                        type="submit"
                        disabled={receiving.isLoading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                    >
                        {receiving.isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {t("receiveStock")}
                    </button>
                </form>
            ) : null}

            {tab === "waste" ? (
                <form
                    onSubmit={onWaste}
                    className="max-w-lg space-y-3 rounded-2xl border border-hairline p-4"
                >
                    <h3 className="text-[14px] font-semibold">
                        {t("wasteTitle")}
                    </h3>
                    <IngredientSelect
                        label={t("fieldIngredient")}
                        placeholder={t("selectIngredient")}
                        value={wasteForm.ingredientId}
                        options={ingredientOptions}
                        onChange={v =>
                            setWasteForm(s => ({ ...s, ingredientId: v }))
                        }
                    />
                    <Field
                        label={t("fieldQuantity")}
                        value={wasteForm.quantity}
                        onChange={v =>
                            setWasteForm(s => ({ ...s, quantity: v }))
                        }
                        type="number"
                        required
                    />
                    <Field
                        label={t("fieldReason")}
                        value={wasteForm.note}
                        onChange={v => setWasteForm(s => ({ ...s, note: v }))}
                    />
                    {wasteQty > 0 && selectedWaste ? (
                        <div className="rounded-xl bg-destructive/5 px-3 py-2 text-[12px]">
                            <span className="text-slate-gray">
                                {t("wasteLineTotal")}
                            </span>
                            <span className="ml-2 font-medium tabular-nums text-destructive">
                                {formatEtb(wasteTotal)}
                            </span>
                            <span className="ml-2 text-[11px] text-slate-gray">
                                ({wasteQty} ×{" "}
                                {formatEtb(selectedWaste.unitCost)})
                            </span>
                        </div>
                    ) : null}
                    <button
                        type="submit"
                        disabled={wasting.isLoading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                    >
                        {wasting.isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {t("logWaste")}
                    </button>
                </form>
            ) : null}

            {tab === "counts" ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onStartCount}
                            disabled={starting.isLoading}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-60"
                        >
                            {starting.isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {t("startCount")}
                        </button>
                    </div>
                    {!activeCountId ? (
                        <div className="overflow-hidden rounded-2xl border border-hairline">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-surface-ivory text-slate-gray">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colCreated")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colStatus")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colLines")}
                                        </th>
                                        <th className="px-4 py-3 font-medium" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {(counts.data?.data ?? []).map(row => (
                                        <tr
                                            key={row.id}
                                            className="border-t border-hairline"
                                        >
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    row.createdAt,
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.status}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.lineCount}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    className="text-brand font-medium"
                                                    onClick={() =>
                                                        setActiveCountId(row.id)
                                                    }
                                                >
                                                    {t("open")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(counts.data?.data ?? []).length === 0 ? (
                                        <EmptyRow text={t("emptyCounts")} />
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="space-y-3 rounded-2xl border border-hairline p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-[14px] font-semibold">
                                    {t("countLabel", {
                                        status:
                                            countDetail.data?.data.status ??
                                            "…",
                                    })}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCountId(null)}
                                        className="rounded-xl border border-hairline px-3 py-2 text-[12px]"
                                    >
                                        {t("back")}
                                    </button>
                                    {countDetail.data?.data.status ===
                                    "DRAFT" ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={onSaveCountLines}
                                                disabled={savingLines.isLoading}
                                                className="rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium"
                                            >
                                                {t("saveLines")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onPostCount}
                                                disabled={posting.isLoading}
                                                className="rounded-xl bg-brand px-3 py-2 text-[12px] font-semibold text-white"
                                            >
                                                {t("postCount")}
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                            <table className="w-full text-left text-[13px]">
                                <thead className="text-slate-gray">
                                    <tr>
                                        <th className="py-2 font-medium">
                                            {t("colIngredient")}
                                        </th>
                                        <th className="py-2 font-medium">
                                            {t("colBook")}
                                        </th>
                                        <th className="py-2 font-medium">
                                            {t("colCounted")}
                                        </th>
                                        <th className="py-2 font-medium">
                                            {t("colVariance")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(countDetail.data?.data.lines ?? []).map(
                                        line => {
                                            const countedRaw =
                                                countEdits[line.ingredientId] ??
                                                (line.countedQty != null
                                                    ? String(line.countedQty)
                                                    : "");
                                            const countedNum =
                                                countedRaw === ""
                                                    ? null
                                                    : Number(countedRaw);
                                            const variance =
                                                countedNum == null
                                                    ? null
                                                    : countedNum - line.bookQty;
                                            return (
                                                <tr
                                                    key={line.id}
                                                    className="border-t border-hairline"
                                                >
                                                    <td className="py-2">
                                                        {line.name}
                                                    </td>
                                                    <td className="py-2">
                                                        {line.bookQty}{" "}
                                                        {line.unit}
                                                    </td>
                                                    <td className="py-2">
                                                        {countDetail.data?.data
                                                            .status ===
                                                        "DRAFT" ? (
                                                            <input
                                                                type="number"
                                                                className="h-9 w-28 rounded-lg border border-hairline px-2"
                                                                value={
                                                                    countedRaw
                                                                }
                                                                onChange={e =>
                                                                    setCountEdits(
                                                                        s => ({
                                                                            ...s,
                                                                            [line.ingredientId]:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            <>
                                                                {
                                                                    line.countedQty
                                                                }{" "}
                                                                {line.unit}
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="py-2">
                                                        {variance == null
                                                            ? "—"
                                                            : variance}
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}

            {tab === "ledger" ? (
                <div className="overflow-hidden rounded-2xl border border-hairline">
                    {ledger.isLoading ? (
                        <LoadingRow />
                    ) : (
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-surface-ivory text-slate-gray">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colWhen")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colType")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colIngredient")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colDelta")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colCost")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("lineValue")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colNote")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(ledger.data?.data ?? []).map(row => {
                                    const unitCost =
                                        row.unitCost ??
                                        row.unitCostSnapshot ??
                                        0;
                                    const lineValue =
                                        row.lineValue ??
                                        row.quantityDelta * unitCost;
                                    return (
                                        <tr
                                            key={row.id}
                                            className="border-t border-hairline"
                                        >
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    row.createdAt,
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.entryType}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.ingredient.name}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums">
                                                {row.quantityDelta}{" "}
                                                {row.ingredient.unit}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-slate-gray">
                                                {formatEtb(unitCost)}
                                            </td>
                                            <td
                                                className={cn(
                                                    "px-4 py-3 font-medium tabular-nums",
                                                    lineValue < 0
                                                        ? "text-destructive"
                                                        : "text-foreground",
                                                )}
                                            >
                                                {formatEtb(lineValue)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-gray">
                                                {row.note ||
                                                    row.supplierNote ||
                                                    row.invoiceRef ||
                                                    "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(ledger.data?.data ?? []).length === 0 ? (
                                    <EmptyRow
                                        text={t("emptyLedger")}
                                        colSpan={7}
                                    />
                                ) : null}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : null}

            {meta &&
            meta.totalPages > 1 &&
            tab !== "receive" &&
            tab !== "waste" ? (
                <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-gray">
                        {t("pageMeta", {
                            page: meta.page,
                            totalPages: meta.totalPages,
                            total: meta.total,
                        })}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="rounded-lg border border-hairline px-3 py-1.5 disabled:opacity-40"
                        >
                            {t("prev")}
                        </button>
                        <button
                            type="button"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="rounded-lg border border-hairline px-3 py-1.5 disabled:opacity-40"
                        >
                            {t("next")}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function Field({
    label,
    hint,
    value,
    onChange,
    type = "text",
    required,
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <label className="block space-y-1 text-[12px]">
            <span className="font-medium text-slate-gray">{label}</span>
            <input
                type={type}
                required={required}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
            />
            {hint ? (
                <span className="block text-[11px] leading-snug text-slate-gray/80">
                    {hint}
                </span>
            ) : null}
        </label>
    );
}

function IngredientSelect({
    label,
    placeholder,
    value,
    options,
    onChange,
}: {
    label: string;
    placeholder: string;
    value: string;
    options: Array<{ id: string; name: string; unit: string }>;
    onChange: (v: string) => void;
}) {
    return (
        <label className="block space-y-1 text-[12px]">
            <span className="font-medium text-slate-gray">{label}</span>
            <select
                required
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
            >
                <option value="">{placeholder}</option>
                {options.map(o => (
                    <option key={o.id} value={o.id}>
                        {o.name} ({o.unit})
                    </option>
                ))}
            </select>
        </label>
    );
}

function LoadingRow() {
    return (
        <div className="flex items-center justify-center p-10 text-slate-gray">
            <Loader2 className="size-5 animate-spin" />
        </div>
    );
}

function EmptyRow({ text, colSpan = 5 }: { text: string; colSpan?: number }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-4 py-8 text-center text-slate-gray"
            >
                {text}
            </td>
        </tr>
    );
}
