"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { closeStationSheet } from "@/context/slices/stationSlice";
import {
    useCreateStationMutation,
    useDeleteStationMutation,
    useUpdateStationMutation,
} from "@/context/services/stationsApi";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "@/lib/toast";
import {
    stationFormDefaults,
    stationFormSchema,
    type StationFormValues,
} from "@/lib/validators/station";
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
    const editingStation = useAppSelector(
        state => state.station.editingStation,
    );
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [createStation, { isLoading: isCreating }] =
        useCreateStationMutation();
    const [updateStation, { isLoading: isUpdating }] =
        useUpdateStationMutation();
    const [deleteStation, { isLoading: isDeleting }] =
        useDeleteStationMutation();

    const isSubmitting = isCreating || isUpdating || isDeleting;

    const form = useForm<StationFormValues>({
        resolver: zodResolver(stationFormSchema),
        defaultValues: stationFormDefaults,
    });

    const color = form.watch("color");
    const category = form.watch("category");

    useEffect(() => {
        if (!isOpen) return;
        setConfirmDelete(false);
        if (editingStation) {
            form.reset({
                name: editingStation.name || "",
                code: editingStation.code || "",
                description: editingStation.description || "",
                category: editingStation.category || "Hot Food",
                color: editingStation.color || "#e85d04",
                avgPrepMin:
                    editingStation.avgPrepMin ??
                    editingStation.defaultDelayThresholdMinutes ??
                    10,
                enabled:
                    editingStation.enabled ??
                    editingStation.status === "ACTIVE",
            });
        } else {
            form.reset(stationFormDefaults);
        }
    }, [editingStation, isOpen, form]);

    if (!isOpen) return null;

    function handleClose() {
        dispatch(closeStationSheet());
    }

    async function onSubmit(values: StationFormValues) {
        try {
            if (editingStation) {
                await updateStation({
                    id: editingStation.id,
                    name: values.name,
                    code: values.code || undefined,
                    description: values.description || "",
                    category: values.category,
                    color: values.color,
                    avgPrepMin: values.avgPrepMin,
                    enabled: values.enabled,
                }).unwrap();
                toast.success("Station updated", values.name);
            } else {
                await createStation({
                    name: values.name,
                    code: values.code || undefined,
                    description: values.description || "",
                    category: values.category || "Hot Food",
                    color: values.color,
                    avgPrepMin: values.avgPrepMin,
                    status: values.enabled ? "ACTIVE" : "DISABLED",
                }).unwrap();
                toast.success("Station created", values.name);
            }
            handleClose();
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ||
                "Failed to save preparation station.";
            toast.error("Operation failed", msg);
        }
    }

    async function handleDelete() {
        if (!editingStation) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        try {
            const res = await deleteStation(editingStation.id).unwrap();
            toast.success(
                "Station removed",
                res.message || editingStation.name,
            );
            handleClose();
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ||
                "Failed to remove station.";
            toast.error("Delete failed", msg);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            <div className="flex-1" onClick={handleClose} aria-hidden="true" />

            <div className="relative flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="size-3.5 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                {editingStation
                                    ? "Edit Station"
                                    : "Add New Station"}
                            </h2>
                            <p className="text-[12px] text-slate-gray">
                                Configure order routing, preparation time &
                                queue parameters.
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

                <Form {...form}>
                    <form
                        id="station-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex-1 space-y-6 overflow-y-auto p-6"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Station Name{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            placeholder="e.g. Grill & BBQ, Mocktail Bar, Bakery Lab"
                                            className="w-full rounded-xl border border-hairline bg-background px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Category / Station Type
                                    </FormLabel>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() =>
                                                    field.onChange(cat)
                                                }
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
                                    <FormControl>
                                        <input
                                            type="text"
                                            placeholder="Or type custom category..."
                                            className="mt-1 w-full rounded-xl border border-hairline bg-background px-3.5 py-2 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Controller
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <label className="text-[13px] font-medium text-foreground">
                                        Station Tag Color
                                    </label>
                                    <div className="flex items-center gap-2.5">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c.hex}
                                                type="button"
                                                onClick={() =>
                                                    field.onChange(c.hex)
                                                }
                                                title={c.label}
                                                className="relative flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
                                                style={{
                                                    backgroundColor: c.hex,
                                                }}
                                            >
                                                {field.value === c.hex ? (
                                                    <Check className="size-3.5 text-white stroke-[3]" />
                                                ) : null}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Description & Routing Guidelines
                                    </FormLabel>
                                    <FormControl>
                                        <textarea
                                            rows={3}
                                            placeholder="Describe what dishes are routed here and special preparation notes..."
                                            className="w-full resize-none rounded-xl border border-hairline bg-background p-3 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="avgPrepMin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Target Preparation Time (minutes)
                                    </FormLabel>
                                    <FormControl>
                                        <input
                                            type="number"
                                            min={1}
                                            max={120}
                                            className="w-full rounded-xl border border-hairline bg-background px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                                            value={field.value}
                                            onChange={e =>
                                                field.onChange(
                                                    Number(e.target.value) || 1,
                                                )
                                            }
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Controller
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                                <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-ivory p-4">
                                    <div>
                                        <p className="text-[14px] font-medium text-foreground">
                                            Station Active & Receiving Orders
                                        </p>
                                        <p className="text-[12px] text-slate-gray">
                                            When active, kitchen staff and
                                            waiters can route ordered items to
                                            this queue.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={field.value}
                                        onClick={() =>
                                            field.onChange(!field.value)
                                        }
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                            field.value
                                                ? "bg-primary"
                                                : "bg-zinc-300",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                                field.value
                                                    ? "translate-x-5"
                                                    : "translate-x-0",
                                            )}
                                        />
                                    </button>
                                </div>
                            )}
                        />
                    </form>
                </Form>

                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-surface-ivory px-6 py-4">
                    {editingStation ? (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleDelete}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors disabled:opacity-50",
                                confirmDelete
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "text-destructive hover:bg-destructive/10",
                            )}
                        >
                            <Trash2 className="size-4" />
                            <span>
                                {confirmDelete ? "Confirm Delete?" : "Delete"}
                            </span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleClose}
                            className="rounded-full border border-hairline bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="station-form"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            <span>
                                {editingStation
                                    ? "Save Changes"
                                    : "Create Station"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
