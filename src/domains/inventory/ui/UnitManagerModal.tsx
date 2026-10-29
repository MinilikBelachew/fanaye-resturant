"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    ArrowLeftRight,
    Loader2,
    Lock,
    Pencil,
    Plus,
    Ruler,
    Trash2,
    X,
} from "lucide-react";
import {
    useCreateInventoryCustomUnitMutation,
    useCreateInventoryUnitConversionMutation,
    useDeleteInventoryCustomUnitMutation,
    useDeleteInventoryUnitConversionMutation,
    useListInventoryUnitConversionsQuery,
    useListInventoryUnitsQuery,
    useUpdateInventoryCustomUnitMutation,
    useUpdateInventoryUnitConversionMutation,
    type InventoryUnit,
    type InventoryUnitConversion,
} from "@/context/services/inventoryApi";
import { InventoryNiceSelect } from "@/domains/inventory/ui/InventoryFormControls";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const UNIT_CATEGORY_LABELS: Record<string, string> = {
    weight: "Weight (kg / g)",
    volume: "Volume (L / ml)",
    count: "Count (pcs / dozen)",
    pack: "Pack (bottle / box / crate)",
};

export function UnitManagerModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const t = useTranslations("inventory");
    const [section, setSection] = useState<"units" | "conversions">("units");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-hairline bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <Ruler className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-semibold">
                                {t("unitsManagerTitle")}
                            </h2>
                            <p className="text-[11px] text-slate-gray">
                                {t("unitsManagerSub")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-gray hover:bg-secondary hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="flex gap-1.5 border-b border-hairline px-5 pt-3">
                    <button
                        type="button"
                        onClick={() => setSection("units")}
                        className={cn(
                            "rounded-t-xl px-4 py-2 text-[12px] font-semibold",
                            section === "units"
                                ? "border border-b-0 border-hairline bg-card text-foreground"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        {t("unitsTabUnits")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSection("conversions")}
                        className={cn(
                            "rounded-t-xl px-4 py-2 text-[12px] font-semibold",
                            section === "conversions"
                                ? "border border-b-0 border-hairline bg-card text-foreground"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        {t("unitsTabConversions")}
                    </button>
                </div>

                <div className="app-scroll flex-1 overflow-y-auto p-5">
                    {section === "units" ? (
                        <UnitsSection />
                    ) : (
                        <ConversionsSection />
                    )}
                </div>
            </div>
        </div>
    );
}

function UnitsSection() {
    const t = useTranslations("inventory");
    const { data: unitsRes, isLoading } = useListInventoryUnitsQuery();
    const units = unitsRes?.data ?? [];
    const [createUnit, { isLoading: creating }] =
        useCreateInventoryCustomUnitMutation();
    const [updateUnit, { isLoading: updating }] =
        useUpdateInventoryCustomUnitMutation();
    const [deleteUnit, { isLoading: deleting }] =
        useDeleteInventoryCustomUnitMutation();

    const [editing, setEditing] = useState<InventoryUnit | null>(null);
    const [form, setForm] = useState({
        code: "",
        name: "",
        category: "count" as "weight" | "volume" | "count" | "pack",
    });

    function resetForm() {
        setEditing(null);
        setForm({ code: "", name: "", category: "count" });
    }

    function startEdit(unit: InventoryUnit) {
        setEditing(unit);
        setForm({
            code: unit.code,
            name: unit.name,
            category:
                (unit.category as "weight" | "volume" | "count" | "pack") ??
                "count",
        });
    }

    async function onSave(e: React.FormEvent) {
        e.preventDefault();
        const code = form.code.trim();
        const name = form.name.trim();
        if (!code || !name) {
            toast.error(t("unitsErrRequired"));
            return;
        }
        try {
            if (editing) {
                await updateUnit({
                    id: editing.id,
                    body: { name, category: form.category },
                }).unwrap();
                toast.success(t("unitsToastUpdated"));
            } else {
                await createUnit({
                    code,
                    name,
                    category: form.category,
                }).unwrap();
                toast.success(t("unitsToastCreated"));
            }
            resetForm();
        } catch (err) {
            toast.fromUnknown(err, t("unitsErrSave"));
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-8 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loading")}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <form
                onSubmit={onSave}
                className="space-y-3 rounded-xl border border-hairline bg-card/50 p-4"
            >
                <p className="text-[13px] font-semibold">
                    {editing ? t("unitsEditTitle") : t("unitsAddTitle")}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("unitsFieldCode")}
                        </span>
                        <input
                            value={form.code}
                            disabled={Boolean(editing)}
                            onChange={e =>
                                setForm(s => ({ ...s, code: e.target.value }))
                            }
                            placeholder="jar"
                            className={cn(
                                "h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]",
                                editing && "opacity-60",
                            )}
                        />
                    </label>
                    <label className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("unitsFieldName")}
                        </span>
                        <input
                            value={form.name}
                            onChange={e =>
                                setForm(s => ({ ...s, name: e.target.value }))
                            }
                            placeholder="Jar"
                            className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                        />
                    </label>
                    <div className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("unitsFieldCategory")}
                        </span>
                        <InventoryNiceSelect
                            value={form.category}
                            placeholder=""
                            options={Object.entries(UNIT_CATEGORY_LABELS).map(
                                ([value, label]) => ({ value, label }),
                            )}
                            onChange={v =>
                                setForm(s => ({
                                    ...s,
                                    category: v as
                                        | "weight"
                                        | "volume"
                                        | "count"
                                        | "pack",
                                }))
                            }
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    {editing ? (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="h-9 rounded-xl border border-hairline px-3 text-[12px] font-medium text-slate-gray hover:bg-secondary"
                        >
                            {t("cancelConfirm")}
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        disabled={creating || updating}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {(creating || updating) && (
                            <Loader2 className="size-3.5 animate-spin" />
                        )}
                        {editing ? t("save") : t("unitsAddAction")}
                    </button>
                </div>
            </form>

            <ul className="space-y-1.5">
                {units.map(unit => (
                    <li
                        key={unit.id}
                        className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-3 py-2"
                    >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary font-mono text-[12px] font-bold text-foreground">
                            {unit.code}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium">
                                {unit.name}
                            </p>
                            <p className="text-[11px] text-slate-gray">
                                {UNIT_CATEGORY_LABELS[unit.category] ??
                                    unit.category}
                            </p>
                        </div>
                        {unit.isBuiltIn ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-slate-gray">
                                <Lock className="size-3" />
                                {t("unitsBuiltIn")}
                            </span>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => startEdit(unit)}
                                    className="rounded-lg p-2 text-slate-gray hover:bg-secondary hover:text-foreground"
                                >
                                    <Pencil className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={async () => {
                                        try {
                                            await deleteUnit(unit.id).unwrap();
                                            toast.success(
                                                t("unitsToastDeleted"),
                                            );
                                            if (editing?.id === unit.id)
                                                resetForm();
                                        } catch (err) {
                                            toast.fromUnknown(
                                                err,
                                                t("unitsErrDelete"),
                                            );
                                        }
                                    }}
                                    className="rounded-lg p-2 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ConversionsSection() {
    const t = useTranslations("inventory");
    const { data: convRes, isLoading } = useListInventoryUnitConversionsQuery();
    const { data: unitsRes } = useListInventoryUnitsQuery();
    const conversions = convRes?.data ?? [];
    const units = unitsRes?.data ?? [];
    const [createConv, { isLoading: creating }] =
        useCreateInventoryUnitConversionMutation();
    const [updateConv, { isLoading: updating }] =
        useUpdateInventoryUnitConversionMutation();
    const [deleteConv, { isLoading: deleting }] =
        useDeleteInventoryUnitConversionMutation();

    const [editing, setEditing] = useState<InventoryUnitConversion | null>(
        null,
    );
    const [form, setForm] = useState({
        fromUnit: "",
        toUnit: "",
        factor: "",
    });

    function resetForm() {
        setEditing(null);
        setForm({ fromUnit: "", toUnit: "", factor: "" });
    }

    function startEdit(row: InventoryUnitConversion) {
        setEditing(row);
        setForm({
            fromUnit: row.fromUnit,
            toUnit: row.toUnit,
            factor: String(row.factor),
        });
    }

    async function onSave(e: React.FormEvent) {
        e.preventDefault();
        const factor = Number(form.factor);
        if (!form.fromUnit || !form.toUnit) {
            toast.error(t("unitsErrPickBoth"));
            return;
        }
        if (form.fromUnit === form.toUnit) {
            toast.error(t("unitsErrSameUnit"));
            return;
        }
        if (!Number.isFinite(factor) || factor <= 0) {
            toast.error(t("unitsErrFactor"));
            return;
        }
        try {
            if (editing) {
                await updateConv({
                    id: editing.id,
                    body: {
                        fromUnit: form.fromUnit,
                        toUnit: form.toUnit,
                        factor,
                    },
                }).unwrap();
                toast.success(t("unitsToastConvUpdated"));
            } else {
                await createConv({
                    fromUnit: form.fromUnit,
                    toUnit: form.toUnit,
                    factor,
                }).unwrap();
                toast.success(t("unitsToastConvCreated"));
            }
            resetForm();
        } catch (err) {
            toast.fromUnknown(err, t("unitsErrSave"));
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-8 text-[13px] text-slate-gray">
                <Loader2 className="size-4 animate-spin" />
                {t("loading")}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="rounded-xl bg-secondary/40 px-3 py-2 text-[12px] text-slate-gray">
                {t("unitsConvHint")}
            </p>

            <form
                onSubmit={onSave}
                className="space-y-3 rounded-xl border border-hairline bg-card/50 p-4"
            >
                <p className="text-[13px] font-semibold">
                    {editing ? t("unitsEditConvTitle") : t("unitsAddConvTitle")}
                </p>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="w-32 space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("unitsFieldFrom")}
                        </span>
                        <InventoryNiceSelect
                            value={form.fromUnit}
                            placeholder=""
                            options={units.map(u => ({
                                value: u.code,
                                label: u.code,
                            }))}
                            onChange={v =>
                                setForm(s => ({ ...s, fromUnit: v }))
                            }
                        />
                    </div>
                    <div className="w-32 space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("unitsFieldTo")}
                        </span>
                        <InventoryNiceSelect
                            value={form.toUnit}
                            placeholder=""
                            options={units.map(u => ({
                                value: u.code,
                                label: u.code,
                            }))}
                            onChange={v => setForm(s => ({ ...s, toUnit: v }))}
                        />
                    </div>
                    <label className="w-40 space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("unitsFieldFactor")}
                        </span>
                        <input
                            type="number"
                            min="0.0001"
                            step="any"
                            value={form.factor}
                            onChange={e =>
                                setForm(s => ({ ...s, factor: e.target.value }))
                            }
                            placeholder="3"
                            className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                        />
                    </label>
                    <div className="flex gap-2 pb-0.5">
                        {editing ? (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="h-10 rounded-xl border border-hairline px-3 text-[12px] font-medium text-slate-gray hover:bg-secondary"
                            >
                                {t("cancelConfirm")}
                            </button>
                        ) : null}
                        <button
                            type="submit"
                            disabled={creating || updating}
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {(creating || updating) && (
                                <Loader2 className="size-3.5 animate-spin" />
                            )}
                            {editing ? t("save") : t("unitsAddAction")}
                        </button>
                    </div>
                </div>
            </form>

            {conversions.length === 0 ? (
                <p className="py-4 text-center text-[12px] text-slate-gray">
                    {t("unitsEmptyConv")}
                </p>
            ) : (
                <ul className="space-y-1.5">
                    {conversions.map(row => (
                        <li
                            key={row.id}
                            className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-3 py-2"
                        >
                            <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-slate-gray">
                                <ArrowLeftRight className="size-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="font-mono text-[13px] font-medium">
                                    {row.factor} {row.fromUnit} = 1 {row.toUnit}
                                </p>
                                <p className="text-[11px] text-slate-gray">
                                    {row.status}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => startEdit(row)}
                                    className="rounded-lg p-2 text-slate-gray hover:bg-secondary hover:text-foreground"
                                >
                                    <Pencil className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={async () => {
                                        try {
                                            await deleteConv(row.id).unwrap();
                                            toast.success(
                                                t("unitsToastConvDeleted"),
                                            );
                                            if (editing?.id === row.id)
                                                resetForm();
                                        } catch (err) {
                                            toast.fromUnknown(
                                                err,
                                                t("unitsErrDelete"),
                                            );
                                        }
                                    }}
                                    className="rounded-lg p-2 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
