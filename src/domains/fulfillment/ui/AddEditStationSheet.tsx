"use client";

import { useEffect, useState } from "react";
import { Check, Flame, Printer, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    addStation,
    closeStationSheet,
    deleteStation,
    updateStation,
} from "@/context/slices/stationSlice";
import type { PreparationStation } from "@/domains/fulfillment/domain/station";
import { createId } from "@/lib/ids";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
    { label: "Flame Orange", hex: "#e85d04" },
    { label: "Amber Gold", hex: "#d97706" },
    { label: "Forest Green", hex: "#046645" },
    { label: "Vivid Violet", hex: "#6736eb" },
    { label: "Sky Blue", hex: "#0284c7" },
    { label: "Berry Rose", hex: "#db2777" },
    { label: "Deep Cobalt", hex: "#024bb1" },
];

const PRESET_CATEGORIES = [
    "Hot Food",
    "Beverages",
    "Pastry",
    "Cold Bar",
    "Grill & BBQ",
    "Prep & Packaging",
];

export default function AddEditStationSheet() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(state => state.station.isSheetOpen);
    const editingStation = useAppSelector(state => state.station.editingStation);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Hot Food");
    const [color, setColor] = useState("#e85d04");
    const [avgPrepMin, setAvgPrepMin] = useState<number>(10);
    const [printerIp, setPrinterIp] = useState("192.168.1.105");
    const [enabled, setEnabled] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (editingStation) {
            setName(editingStation.name || "");
            setDescription(editingStation.description || "");
            setCategory(editingStation.category || "Hot Food");
            setColor(editingStation.color || "#e85d04");
            setAvgPrepMin(editingStation.avgPrepMin ?? 10);
            setPrinterIp(editingStation.printerIp || "192.168.1.105");
            setEnabled(editingStation.enabled ?? true);
            setConfirmDelete(false);
        } else {
            setName("");
            setDescription("");
            setCategory("Hot Food");
            setColor("#e85d04");
            setAvgPrepMin(10);
            setPrinterIp("192.168.1.105");
            setEnabled(true);
            setConfirmDelete(false);
        }
    }, [editingStation, isOpen]);

    if (!isOpen) return null;

    function handleClose() {
        dispatch(closeStationSheet());
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingStation) {
            const updated: PreparationStation = {
                ...editingStation,
                name: name.trim(),
                description: description.trim(),
                category: category.trim(),
                color,
                avgPrepMin: Math.max(1, avgPrepMin || 5),
                printerIp: printerIp.trim(),
                enabled,
            };
            dispatch(updateStation(updated));
        } else {
            const newStation: PreparationStation = {
                id: createId("station"),
                name: name.trim(),
                description:
                    description.trim() ||
                    `Handles orders routed to ${name.trim()}.`,
                category: category.trim() || "Kitchen",
                color,
                avgPrepMin: Math.max(1, avgPrepMin || 5),
                printerIp: printerIp.trim() || "192.168.1.100",
                enabled,
                ticketCount: 0,
            };
            dispatch(addStation(newStation));
        }
        handleClose();
    }

    function handleDelete() {
        if (!editingStation) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        dispatch(deleteStation(editingStation.id));
        handleClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="flex-1" onClick={handleClose} aria-hidden="true" />

            {/* Slide-over panel */}
            <div className="relative flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card shadow-2xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="size-3.5 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                {editingStation ? "Edit Station" : "Add New Station"}
                            </h2>
                            <p className="text-[12px] text-slate-gray">
                                Configure order routing, thermal printer & queue parameters.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="station-form"
                    onSubmit={handleSave}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                    {/* Station Name */}
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-foreground">
                            Station Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Grill & BBQ, Mocktail Bar, Bakery Lab"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full rounded-xl border border-hairline bg-background px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-medium text-foreground">
                            Category / Station Type
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={cn(
                                        "rounded-full px-3 py-1 text-[12px] font-medium transition-all",
                                        category === cat
                                            ? "bg-foreground text-background"
                                            : "border border-hairline bg-secondary/60 text-slate-gray hover:text-foreground",
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Or type custom category..."
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-hairline bg-background px-3.5 py-2 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Color Swatch Picker */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-medium text-foreground">
                            Station Tag Color
                        </label>
                        <div className="flex items-center gap-2.5">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => setColor(c.hex)}
                                    title={c.label}
                                    className="relative flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: c.hex }}
                                >
                                    {color === c.hex ? (
                                        <Check className="size-3.5 text-white stroke-[3]" />
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-foreground">
                            Description & Routing Guidelines
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Describe what dishes are routed here and special preparation notes..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full resize-none rounded-xl border border-hairline bg-background p-3 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Grid: Prep Time & Printer IP */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">
                                Target Prep Time (min)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={avgPrepMin}
                                onChange={e =>
                                    setAvgPrepMin(Number(e.target.value) || 1)
                                }
                                className="w-full rounded-xl border border-hairline bg-background px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">
                                Thermal Printer IP / Port
                            </label>
                            <div className="relative">
                                <Printer className="absolute left-3 top-3 size-4 text-slate-gray" />
                                <input
                                    type="text"
                                    placeholder="192.168.1.105"
                                    value={printerIp}
                                    onChange={e => setPrinterIp(e.target.value)}
                                    className="w-full rounded-xl border border-hairline bg-background pl-9 pr-3.5 py-2.5 text-[14px] text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Enable Station Switch */}
                    <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-ivory p-4">
                        <div>
                            <p className="text-[14px] font-medium text-foreground">
                                Station Active & Receiving Orders
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                When active, waiters can route ordered items to this queue.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            onClick={() => setEnabled(!enabled)}
                            className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                enabled ? "bg-primary" : "bg-zinc-300",
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                    enabled ? "translate-x-5" : "translate-x-0",
                                )}
                            />
                        </button>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-surface-ivory px-6 py-4">
                    {editingStation ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                                confirmDelete
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "text-destructive hover:bg-destructive/10",
                            )}
                        >
                            <Trash2 className="size-4" />
                            <span>{confirmDelete ? "Confirm Delete?" : "Delete"}</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-full border border-hairline bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="station-form"
                            className="rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary-deep transition-colors"
                        >
                            {editingStation ? "Save Changes" : "Create Station"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
