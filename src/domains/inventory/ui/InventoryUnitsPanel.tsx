"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    AlertTriangle,
    ArrowLeftRight,
    Loader2,
    Lock,
    Pencil,
    Plus,
    Ruler,
    Search,
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

const UNIT_CATEGORY_LABELS_AM: Record<string, string> = {
    weight: "ክብደት (ኪ.ግ / ግራም)",
    volume: "መጠን (ሊትር / ሚ.ሊ)",
    count: "ብዛት (ቁጥር / ደርዘን)",
    pack: "ጥቅል (ጠርሙስ / ካርቶን)",
};

export function InventoryUnitsPanel() {
    const locale = useLocale();
    const isAm = locale === "am";
    const [subTab, setSubTab] = useState<"units" | "conversions">("units");
    const [searchQuery, setSearchQuery] = useState("");

    // Queries
    const { data: unitsRes, isLoading: unitsLoading } =
        useListInventoryUnitsQuery();
    const units = unitsRes?.data ?? [];

    const { data: convRes, isLoading: convLoading } =
        useListInventoryUnitConversionsQuery();
    const conversions = convRes?.data ?? [];

    // Mutations
    const [createUnit, { isLoading: creatingUnit }] =
        useCreateInventoryCustomUnitMutation();
    const [updateUnit, { isLoading: updatingUnit }] =
        useUpdateInventoryCustomUnitMutation();
    const [deleteUnit, { isLoading: deletingUnit }] =
        useDeleteInventoryCustomUnitMutation();

    const [createConv, { isLoading: creatingConv }] =
        useCreateInventoryUnitConversionMutation();
    const [updateConv, { isLoading: updatingConv }] =
        useUpdateInventoryUnitConversionMutation();
    const [deleteConv, { isLoading: deletingConv }] =
        useDeleteInventoryUnitConversionMutation();

    // Side sheet state
    const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<InventoryUnit | null>(null);
    const [editingConv, setEditingConv] =
        useState<InventoryUnitConversion | null>(null);

    // Form states
    const [unitForm, setUnitForm] = useState({
        code: "",
        name: "",
        category: "count" as "weight" | "volume" | "count" | "pack",
    });

    const [convForm, setConvForm] = useState({
        fromUnit: "",
        toUnit: "kg",
        factor: "1",
    });

    // Delete confirmation state
    const [deletingItem, setDeletingItem] = useState<{
        type: "unit" | "conv";
        id: string;
        title: string;
    } | null>(null);

    // Filtered lists
    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return units;
        const q = searchQuery.toLowerCase();
        return units.filter(
            u =>
                u.code.toLowerCase().includes(q) ||
                u.name.toLowerCase().includes(q),
        );
    }, [units, searchQuery]);

    const filteredConversions = useMemo(() => {
        if (!searchQuery.trim()) return conversions;
        const q = searchQuery.toLowerCase();
        return conversions.filter(
            c =>
                c.fromUnit.toLowerCase().includes(q) ||
                c.toUnit.toLowerCase().includes(q),
        );
    }, [conversions, searchQuery]);

    function openCreate() {
        if (subTab === "units") {
            setEditingUnit(null);
            setUnitForm({ code: "", name: "", category: "count" });
        } else {
            setEditingConv(null);
            setConvForm({
                fromUnit: units[0]?.code ?? "",
                toUnit: "kg",
                factor: "1",
            });
        }
        setIsSideSheetOpen(true);
    }

    function openEditUnit(unit: InventoryUnit) {
        setEditingUnit(unit);
        setUnitForm({
            code: unit.code,
            name: unit.name,
            category:
                (unit.category as "weight" | "volume" | "count" | "pack") ??
                "count",
        });
        setIsSideSheetOpen(true);
    }

    function openEditConv(conv: InventoryUnitConversion) {
        setEditingConv(conv);
        setConvForm({
            fromUnit: conv.fromUnit,
            toUnit: conv.toUnit,
            factor: String(conv.factor),
        });
        setIsSideSheetOpen(true);
    }

    function closeSideSheet() {
        setIsSideSheetOpen(false);
        setEditingUnit(null);
        setEditingConv(null);
    }

    async function handleSaveUnit(e: React.FormEvent) {
        e.preventDefault();
        const code = unitForm.code.trim().toLowerCase();
        const name = unitForm.name.trim();
        if (!code || !name) {
            toast.error("Code and Name are required");
            return;
        }

        try {
            if (editingUnit) {
                await updateUnit({
                    id: editingUnit.id,
                    body: { name, category: unitForm.category },
                }).unwrap();
                toast.success(`Unit "${code}" updated`);
            } else {
                await createUnit({
                    code,
                    name,
                    category: unitForm.category,
                }).unwrap();
                toast.success(`Unit "${code}" created`);
            }
            closeSideSheet();
        } catch (err) {
            toast.fromUnknown(err, "Failed to save unit");
        }
    }

    async function handleSaveConv(e: React.FormEvent) {
        e.preventDefault();
        const factor = Number(convForm.factor);
        if (!convForm.fromUnit || !convForm.toUnit || !factor || factor <= 0) {
            toast.error(
                "Valid from-unit, to-unit, and factor (>0) are required",
            );
            return;
        }
        if (convForm.fromUnit === convForm.toUnit) {
            toast.error("From and To units must be different");
            return;
        }

        try {
            if (editingConv) {
                await updateConv({
                    id: editingConv.id,
                    body: { factor },
                }).unwrap();
                toast.success("Conversion rule updated");
            } else {
                await createConv({
                    fromUnit: convForm.fromUnit,
                    toUnit: convForm.toUnit,
                    factor,
                }).unwrap();
                toast.success("Conversion rule created");
            }
            closeSideSheet();
        } catch (err) {
            toast.fromUnknown(err, "Failed to save conversion");
        }
    }

    async function confirmDelete() {
        if (!deletingItem) return;
        try {
            if (deletingItem.type === "unit") {
                await deleteUnit(deletingItem.id).unwrap();
                toast.success(`Unit deleted`);
            } else {
                await deleteConv(deletingItem.id).unwrap();
                toast.success("Conversion rule deleted");
            }
            setDeletingItem(null);
        } catch (err) {
            toast.fromUnknown(err, "Could not delete item");
        }
    }

    return (
        <div className="space-y-4">
            {/* Top Sub-Navigation & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-xl border border-hairline bg-card p-1 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => {
                                setSubTab("units");
                                setSearchQuery("");
                            }}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all",
                                subTab === "units"
                                    ? "bg-foreground text-background shadow-xs"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Ruler className="size-3.5" />
                            <span>
                                {isAm ? "መለኪያዎች" : "Units"} ({units.length})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSubTab("conversions");
                                setSearchQuery("");
                            }}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all",
                                subTab === "conversions"
                                    ? "bg-foreground text-background shadow-xs"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            <ArrowLeftRight className="size-3.5" />
                            <span>
                                {isAm ? "ለውጦች" : "Conversions"} (
                                {conversions.length})
                            </span>
                        </button>
                    </div>

                    <div className="relative flex-1 sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={
                                subTab === "units"
                                    ? isAm
                                        ? "መለኪያዎችን ይፈልጉ..."
                                        : "Search units..."
                                    : isAm
                                      ? "ለውጦችን ይፈልጉ..."
                                      : "Search conversions..."
                            }
                            className="h-10 w-full rounded-xl border border-hairline bg-card pl-9 pr-3 text-[13px] text-foreground placeholder:text-slate-gray focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 text-[13px] font-semibold shadow-xs transition-colors shrink-0"
                >
                    <Plus className="size-4 stroke-[2.5]" />
                    <span>
                        {subTab === "units"
                            ? isAm
                                ? "መለኪያ ጨምር"
                                : "Add Unit"
                            : isAm
                              ? "ለውጥ ጨምር"
                              : "Add Conversion"}
                    </span>
                </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-xs">
                {subTab === "units" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-hairline bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                                    <th className="px-5 py-3">
                                        {isAm ? "ኮድ" : "Code"}
                                    </th>
                                    <th className="px-4 py-3">
                                        {isAm ? "የመለኪያ ስም" : "Display Name"}
                                    </th>
                                    <th className="px-4 py-3">
                                        {isAm ? "ምድብ" : "Category"}
                                    </th>
                                    <th className="px-4 py-3">
                                        {isAm ? "ዓይነት" : "Type"}
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        {isAm ? "ተግባራት" : "Actions"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {unitsLoading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-12 text-center text-slate-gray"
                                        >
                                            <Loader2 className="mx-auto size-6 animate-spin text-sky-600 mb-2" />
                                            <span>
                                                {isAm
                                                    ? "መለኪያዎች በመጫን ላይ..."
                                                    : "Loading units..."}
                                            </span>
                                        </td>
                                    </tr>
                                ) : filteredUnits.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-12 text-center text-slate-gray"
                                        >
                                            <Ruler className="mx-auto size-10 stroke-[1.2] opacity-30 text-sky-600 mb-2" />
                                            <p className="font-semibold text-foreground text-[14px]">
                                                {isAm
                                                    ? "ምንም መለኪያ አልተገኘም"
                                                    : "No units found"}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUnits.map(unit => (
                                        <tr
                                            key={unit.code}
                                            className="hover:bg-secondary/40 transition-colors"
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md border border-hairline">
                                                    {unit.code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-foreground">
                                                {unit.name}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-gray">
                                                {isAm
                                                    ? (UNIT_CATEGORY_LABELS_AM[
                                                          unit.category
                                                      ] ?? unit.category)
                                                    : (UNIT_CATEGORY_LABELS[
                                                          unit.category
                                                      ] ?? unit.category)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {unit.isBuiltIn ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-slate-gray">
                                                        <Lock className="size-3" />
                                                        {isAm
                                                            ? "የሲስተም መደበኛ"
                                                            : "System Built-in"}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                                                        {isAm
                                                            ? "ብጁ መለኪያ"
                                                            : "Custom Unit"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {!unit.isBuiltIn ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditUnit(
                                                                    unit,
                                                                )
                                                            }
                                                            className="p-1.5 rounded-lg text-slate-gray hover:text-foreground hover:bg-secondary transition-colors"
                                                            title="Edit unit"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeletingItem(
                                                                    {
                                                                        type: "unit",
                                                                        id: unit.id,
                                                                        title: `Unit "${unit.name}" (${unit.code})`,
                                                                    },
                                                                )
                                                            }
                                                            className="p-1.5 rounded-lg text-slate-gray hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                            title="Delete unit"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-gray italic">
                                                        Locked
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-hairline bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-slate-gray">
                                    <th className="px-5 py-3">
                                        {isAm ? "የለውጥ ህግ" : "Conversion Rule"}
                                    </th>
                                    <th className="px-4 py-3">
                                        {isAm ? "ከመለኪያ" : "From Unit"}
                                    </th>
                                    <th className="px-4 py-3">
                                        {isAm ? "ተመን (ብዜት)" : "Ratio Factor"}
                                    </th>
                                    <th className="px-4 py-3">
                                        {isAm ? "ወደ መለኪያ" : "To Base Unit"}
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        {isAm ? "ተግባራት" : "Actions"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {convLoading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-12 text-center text-slate-gray"
                                        >
                                            <Loader2 className="mx-auto size-6 animate-spin text-sky-600 mb-2" />
                                            <span>
                                                {isAm
                                                    ? "ለውጦች በመጫን ላይ..."
                                                    : "Loading conversions..."}
                                            </span>
                                        </td>
                                    </tr>
                                ) : filteredConversions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-12 text-center text-slate-gray"
                                        >
                                            <ArrowLeftRight className="mx-auto size-10 stroke-[1.2] opacity-30 text-sky-600 mb-2" />
                                            <p className="font-semibold text-foreground text-[14px]">
                                                {isAm
                                                    ? "ምንም የለውጥ ህግ አልተገኘም"
                                                    : "No conversion rules"}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredConversions.map(conv => (
                                        <tr
                                            key={conv.id}
                                            className="hover:bg-secondary/40 transition-colors"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2 font-semibold text-foreground">
                                                    <span>
                                                        1 {conv.fromUnit}
                                                    </span>
                                                    <span className="text-slate-gray font-normal">
                                                        =
                                                    </span>
                                                    <span>
                                                        {conv.factor}{" "}
                                                        {conv.toUnit}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-slate-gray">
                                                {conv.fromUnit}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-bold text-foreground tabular-nums">
                                                {conv.factor}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-slate-gray">
                                                {conv.toUnit}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditConv(conv)
                                                        }
                                                        className="p-1.5 rounded-lg text-slate-gray hover:text-foreground hover:bg-secondary transition-colors"
                                                        title="Edit conversion"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeletingItem({
                                                                type: "conv",
                                                                id: conv.id,
                                                                title: `Conversion 1 ${conv.fromUnit} = ${conv.factor} ${conv.toUnit}`,
                                                            })
                                                        }
                                                        className="p-1.5 rounded-lg text-slate-gray hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                        title="Delete conversion"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slide-Over Side Sheet for Add / Edit */}
            {isSideSheetOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="flex-1" onClick={closeSideSheet} />
                    <aside className="relative flex h-full w-full max-w-md flex-col bg-card border-l border-hairline shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    {subTab === "units" ? (
                                        <Ruler className="size-4.5" />
                                    ) : (
                                        <ArrowLeftRight className="size-4.5" />
                                    )}
                                </div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    {subTab === "units"
                                        ? editingUnit
                                            ? "Edit Unit"
                                            : "Add Unit"
                                        : editingConv
                                          ? "Edit Conversion"
                                          : "Add Conversion"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeSideSheet}
                                className="rounded-full p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {subTab === "units" ? (
                            <form
                                onSubmit={handleSaveUnit}
                                className="flex-1 overflow-y-auto p-6 space-y-4"
                            >
                                <label className="block space-y-1.5 text-[12px]">
                                    <span className="font-semibold text-foreground">
                                        Unit Code{" "}
                                        <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        disabled={!!editingUnit}
                                        value={unitForm.code}
                                        onChange={e =>
                                            setUnitForm(s => ({
                                                ...s,
                                                code: e.target.value.toLowerCase(),
                                            }))
                                        }
                                        placeholder="e.g. sack, crate, bundle, box"
                                        required
                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 font-mono text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                                    />
                                </label>

                                <label className="block space-y-1.5 text-[12px]">
                                    <span className="font-semibold text-foreground">
                                        Display Name{" "}
                                        <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        value={unitForm.name}
                                        onChange={e =>
                                            setUnitForm(s => ({
                                                ...s,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 50kg Sack, Standard Crate"
                                        required
                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </label>

                                <div className="space-y-1.5 text-[12px]">
                                    <span className="font-semibold text-foreground">
                                        Category
                                    </span>
                                    <InventoryNiceSelect
                                        value={unitForm.category}
                                        placeholder="Select category"
                                        onChange={v =>
                                            setUnitForm(s => ({
                                                ...s,
                                                category: v as any,
                                            }))
                                        }
                                        options={[
                                            {
                                                value: "weight",
                                                label: "Weight (kg, g)",
                                            },
                                            {
                                                value: "volume",
                                                label: "Volume (L, ml)",
                                            },
                                            {
                                                value: "count",
                                                label: "Count (pieces, items)",
                                            },
                                            {
                                                value: "pack",
                                                label: "Pack (crates, bags, boxes)",
                                            },
                                        ]}
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-2 border-t border-hairline">
                                    <button
                                        type="button"
                                        onClick={closeSideSheet}
                                        className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingUnit || updatingUnit}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-5 text-[13px] font-semibold shadow-xs disabled:opacity-60 transition-colors"
                                    >
                                        {(creatingUnit || updatingUnit) && (
                                            <Loader2 className="size-4 animate-spin" />
                                        )}
                                        <span>
                                            {editingUnit
                                                ? "Update Unit"
                                                : "Save Unit"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form
                                onSubmit={handleSaveConv}
                                className="flex-1 overflow-y-auto p-6 space-y-4"
                            >
                                <div className="space-y-1.5 text-[12px]">
                                    <span className="font-semibold text-foreground">
                                        From Unit
                                    </span>
                                    <InventoryNiceSelect
                                        value={convForm.fromUnit}
                                        placeholder="Select from unit"
                                        onChange={v =>
                                            setConvForm(s => ({
                                                ...s,
                                                fromUnit: v,
                                            }))
                                        }
                                        disabled={!!editingConv}
                                        options={units.map(u => ({
                                            value: u.code,
                                            label: `${u.name} (${u.code})`,
                                        }))}
                                    />
                                </div>

                                <div className="space-y-1.5 text-[12px]">
                                    <span className="font-semibold text-foreground">
                                        To Base Unit
                                    </span>
                                    <InventoryNiceSelect
                                        value={convForm.toUnit}
                                        placeholder="Select to base unit"
                                        onChange={v =>
                                            setConvForm(s => ({
                                                ...s,
                                                toUnit: v,
                                            }))
                                        }
                                        disabled={!!editingConv}
                                        options={units.map(u => ({
                                            value: u.code,
                                            label: `${u.name} (${u.code})`,
                                        }))}
                                    />
                                </div>

                                <label className="block space-y-1.5 text-[12px]">
                                    <span className="font-semibold text-foreground">
                                        Conversion Factor{" "}
                                        <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={convForm.factor}
                                        onChange={e =>
                                            setConvForm(s => ({
                                                ...s,
                                                factor: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 50 (if 1 sack = 50 kg)"
                                        required
                                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 font-mono text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                    <p className="text-[11px] text-slate-gray mt-1">
                                        Meaning: 1{" "}
                                        <strong>
                                            {convForm.fromUnit || "..."}
                                        </strong>{" "}
                                        = {convForm.factor || "..."}{" "}
                                        <strong>
                                            {convForm.toUnit || "..."}
                                        </strong>
                                    </p>
                                </label>

                                <div className="pt-4 flex justify-end gap-2 border-t border-hairline">
                                    <button
                                        type="button"
                                        onClick={closeSideSheet}
                                        className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingConv || updatingConv}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-5 text-[13px] font-semibold shadow-xs disabled:opacity-60 transition-colors"
                                    >
                                        {(creatingConv || updatingConv) && (
                                            <Loader2 className="size-4 animate-spin" />
                                        )}
                                        <span>
                                            {editingConv
                                                ? "Update Conversion"
                                                : "Save Conversion"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </aside>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-foreground">
                                    Delete{" "}
                                    {deletingItem.type === "unit"
                                        ? "Unit"
                                        : "Conversion"}
                                </h3>
                                <p className="text-[12px] text-slate-gray mt-0.5">
                                    Are you sure you want to delete{" "}
                                    <strong className="text-foreground">
                                        {deletingItem.title}
                                    </strong>
                                    ?
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                            <button
                                type="button"
                                disabled={deletingUnit || deletingConv}
                                onClick={() => setDeletingItem(null)}
                                className="h-10 rounded-xl border border-hairline px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingUnit || deletingConv}
                                onClick={confirmDelete}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 text-[13px] font-semibold shadow-xs disabled:opacity-60 transition-colors"
                            >
                                {(deletingUnit || deletingConv) && (
                                    <Loader2 className="size-4 animate-spin" />
                                )}
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
