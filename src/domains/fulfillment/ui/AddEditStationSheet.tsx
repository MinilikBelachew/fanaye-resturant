"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
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

export default function AddEditStationSheet() {
    const t = useTranslations("managerStations");
    const tCommon = useTranslations("common");
    const tSheets = useTranslations("menuSheets");
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

    useEffect(() => {
        if (!isOpen) return;
        setConfirmDelete(false);
        if (editingStation) {
            form.reset({
                name: editingStation.name || "",
                code: editingStation.code || "",
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
                    avgPrepMin: values.avgPrepMin,
                    enabled: values.enabled,
                }).unwrap();
                toast.success(t("toastUpdated"), values.name);
            } else {
                await createStation({
                    name: values.name,
                    code: values.code || undefined,
                    avgPrepMin: values.avgPrepMin,
                    status: values.enabled ? "ACTIVE" : "DISABLED",
                }).unwrap();
                toast.success(t("toastCreated"), values.name);
            }
            handleClose();
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ||
                t("toastSaveFailed");
            toast.error(t("toastOpFailed"), msg);
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
                t("toastRemoved"),
                res.message || editingStation.name,
            );
            handleClose();
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ||
                t("toastRemoveFailed");
            toast.error(t("toastDeleteErrorTitle"), msg);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            <div className="flex-1" onClick={handleClose} aria-hidden="true" />

            <div className="relative flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-6 py-4">
                    <div>
                        <h2 className="text-[17px] font-semibold text-foreground">
                            {editingStation ? t("editTitle") : t("addTitle")}
                        </h2>
                        <p className="text-[12px] text-slate-gray">
                            {t("sheetSubtitle")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label={tCommon("cancel")}
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
                                        {t("stationName")}{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            placeholder={t(
                                                "stationNamePlaceholder",
                                            )}
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
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("codeOptional")}</FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            placeholder={t("codePlaceholder")}
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
                            name="avgPrepMin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("prepTime")}</FormLabel>
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
                                    <div className="pr-3">
                                        <p className="text-[14px] font-medium text-foreground">
                                            {t("stationOnline")}
                                        </p>
                                        <p className="text-[12px] text-slate-gray">
                                            {t("stationOnlineDesc")}
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
                                {confirmDelete
                                    ? t("confirmDeleteQ")
                                    : tCommon("delete")}
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
                            {tCommon("cancel")}
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
                                    ? tSheets("saveChanges")
                                    : t("createStation")}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
