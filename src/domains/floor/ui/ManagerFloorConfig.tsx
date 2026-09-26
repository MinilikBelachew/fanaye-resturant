"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MapPin, Plus, Save, Trash2, UserRound, Utensils } from "lucide-react";
import { useTranslations } from "next-intl";
import {
    useAdminFloorLayoutQuery,
    useCreateDiningTableMutation,
    useCreateTableLocationMutation,
    useDeleteDiningTableMutation,
    useDeleteTableLocationMutation,
    useUpdateDiningTableMutation,
} from "@/context/services/floorApi";
import type { AdminDiningTable } from "@/domains/floor/domain/floorLayoutApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import {
    diningTableCreateSchema,
    diningTableEditSchema,
    placeSchema,
    type DiningTableCreateValues,
    type DiningTableEditValues,
    type PlaceFormValues,
} from "@/lib/validators/floor";
import { cn } from "@/lib/utils";

export default function ManagerFloorConfig() {
    const t = useTranslations("managerTables");
    const tCommon = useTranslations("common");
    const { data, isLoading, isError } = useAdminFloorLayoutQuery();
    const [createPlace, { isLoading: creatingPlace }] =
        useCreateTableLocationMutation();
    const [createTable, { isLoading: creatingTable }] =
        useCreateDiningTableMutation();
    const [updateTable, { isLoading: updatingTable }] =
        useUpdateDiningTableMutation();
    const [deleteTable, { isLoading: deletingTable }] =
        useDeleteDiningTableMutation();
    const [deletePlace, { isLoading: deletingPlace }] =
        useDeleteTableLocationMutation();

    const locations = data?.data ?? [];
    const waiters = data?.waiters ?? [];

    const [editingTable, setEditingTable] = useState<AdminDiningTable | null>(
        null,
    );
    const [confirmPlaceId, setConfirmPlaceId] = useState<string | null>(null);
    const [confirmTableId, setConfirmTableId] = useState<string | null>(null);

    const totals = useMemo(() => {
        const tables = locations.reduce(
            (sum, loc) => sum + loc.tables.length,
            0,
        );
        const unassigned = locations.reduce(
            (sum, loc) =>
                sum +
                loc.tables.filter(t => !t.assignedWaiterMembershipId).length,
            0,
        );
        return {
            places: locations.length,
            tables,
            unassigned,
        };
    }, [locations]);

    const placeForm = useForm<PlaceFormValues>({
        resolver: zodResolver(placeSchema),
        defaultValues: { name: "" },
    });

    const tableForm = useForm<DiningTableCreateValues>({
        resolver: zodResolver(diningTableCreateSchema),
        defaultValues: {
            displayName: "",
            displayNumber: "",
            locationId: "",
            assignedWaiterMembershipId: "",
        },
    });

    const editForm = useForm<DiningTableEditValues>({
        resolver: zodResolver(diningTableEditSchema),
        defaultValues: {
            displayName: "",
            locationId: "",
            assignedWaiterMembershipId: "",
        },
    });

    useEffect(() => {
        if (!tableForm.getValues("locationId") && locations[0]?.id) {
            tableForm.setValue("locationId", locations[0].id);
        }
    }, [locations, tableForm]);

    async function onCreatePlace(values: PlaceFormValues) {
        try {
            await createPlace({ name: values.name }).unwrap();
            placeForm.reset({ name: "" });
            toast.success(t("toastPlaceCreated"), values.name);
        } catch (err) {
            toast.fromUnknown(err, t("toastPlaceCreateError"));
        }
    }

    async function onCreateTable(values: DiningTableCreateValues) {
        try {
            await createTable({
                locationId: values.locationId,
                displayName: values.displayName,
                displayNumber: values.displayNumber || undefined,
                assignedWaiterMembershipId:
                    values.assignedWaiterMembershipId || null,
            }).unwrap();
            tableForm.reset({
                displayName: "",
                displayNumber: "",
                locationId: values.locationId,
                assignedWaiterMembershipId: "",
            });
            toast.success(t("toastTableCreated"), values.displayName);
        } catch (err) {
            toast.fromUnknown(err, t("toastTableCreateError"));
        }
    }

    function openEdit(table: AdminDiningTable) {
        setEditingTable(table);
        setConfirmTableId(null);
        editForm.reset({
            displayName: table.displayName,
            locationId: table.locationId,
            assignedWaiterMembershipId: table.assignedWaiterMembershipId ?? "",
        });
    }

    async function onSaveEdit(values: DiningTableEditValues) {
        if (!editingTable) return;
        try {
            await updateTable({
                id: editingTable.id,
                body: {
                    displayName: values.displayName,
                    locationId: values.locationId,
                    assignedWaiterMembershipId:
                        values.assignedWaiterMembershipId || null,
                },
            }).unwrap();
            setEditingTable(null);
            toast.success(t("toastTableUpdated"), values.displayName);
        } catch (err) {
            toast.fromUnknown(err, t("toastTableUpdateError"));
        }
    }

    async function onDeleteTable(table: AdminDiningTable) {
        if (confirmTableId !== table.id) {
            setConfirmTableId(table.id);
            return;
        }
        try {
            const res = await deleteTable(table.id).unwrap();
            toast.success(
                t("toastTableDeleted"),
                res.message || table.displayName,
            );
            setConfirmTableId(null);
            if (editingTable?.id === table.id) setEditingTable(null);
        } catch (err) {
            toast.fromUnknown(err, t("toastTableDeleteError"));
            setConfirmTableId(null);
        }
    }

    async function onDeletePlace(locationId: string, name: string) {
        if (confirmPlaceId !== locationId) {
            setConfirmPlaceId(locationId);
            return;
        }
        try {
            const res = await deletePlace(locationId).unwrap();
            toast.success(t("toastPlaceDeleted"), res.message || name);
            setConfirmPlaceId(null);
        } catch (err) {
            toast.fromUnknown(err, t("toastPlaceDeleteError"));
            setConfirmPlaceId(null);
        }
    }

    if (isLoading) {
        return (
            <div className="rounded-[16px] border border-hairline bg-card px-4 py-10 text-center text-[13px] text-slate-gray">
                {t("loadingLayout")}
            </div>
        );
    }
    if (isError) {
        return (
            <p className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
                {t("loadLayoutError")}
            </p>
        );
    }

    const saving =
        creatingPlace ||
        creatingTable ||
        updatingTable ||
        deletingTable ||
        deletingPlace;

    return (
        <div className="space-y-5">
            <div className="grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-gray">
                        {t("places")}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold">
                        {totals.places}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-gray">
                        {t("tables")}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold text-brand">
                        {totals.tables}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-gray">
                        {t("unassigned")}
                    </p>
                    <p
                        className={cn(
                            "mt-1 text-[22px] font-semibold",
                            totals.unassigned > 0
                                ? "text-amber-600"
                                : "text-emerald-600",
                        )}
                    >
                        {totals.unassigned}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Form {...placeForm}>
                    <form
                        onSubmit={placeForm.handleSubmit(
                            values => void onCreatePlace(values),
                        )}
                        className="space-y-3 rounded-[16px] border border-hairline bg-card p-4"
                    >
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-brand" />
                            <div>
                                <h3 className="text-[15px] font-semibold">
                                    {t("createPlace")}
                                </h3>
                                <p className="text-[12px] text-slate-gray">
                                    {t("createPlaceDesc")}
                                </p>
                            </div>
                        </div>
                        <FormField
                            control={placeForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder={t("placePlaceholder")}
                                            className="h-10"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="size-4" />
                            {t("addPlace")}
                        </Button>
                    </form>
                </Form>

                <Form {...tableForm}>
                    <form
                        onSubmit={tableForm.handleSubmit(
                            values => void onCreateTable(values),
                        )}
                        className="space-y-3 rounded-[16px] border border-hairline bg-card p-4"
                    >
                        <div className="flex items-center gap-2">
                            <Utensils className="size-4 text-brand" />
                            <div>
                                <h3 className="text-[15px] font-semibold">
                                    {t("createTable")}
                                </h3>
                                <p className="text-[12px] text-slate-gray">
                                    {t("createTableDesc")}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <FormField
                                control={tableForm.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    "tableNamePlaceholder",
                                                )}
                                                className="h-10"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={tableForm.control}
                                name="displayNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    "numberOptional",
                                                )}
                                                className="h-10"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <FormField
                                control={tableForm.control}
                                name="locationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <select
                                                value={field.value}
                                                onChange={e =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                            >
                                                {locations.length === 0 ? (
                                                    <option value="">
                                                        {t("createPlaceFirst")}
                                                    </option>
                                                ) : null}
                                                {locations.map(location => (
                                                    <option
                                                        key={location.id}
                                                        value={location.id}
                                                    >
                                                        {location.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={tableForm.control}
                                name="assignedWaiterMembershipId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <select
                                                value={field.value || ""}
                                                onChange={e =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                            >
                                                <option value="">
                                                    {t("assignWaiterLater")}
                                                </option>
                                                {waiters.map(waiter => (
                                                    <option
                                                        key={waiter.id}
                                                        value={waiter.id}
                                                    >
                                                        {waiter.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={saving || locations.length === 0}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="size-4" />
                            {t("addTable")}
                        </Button>
                    </form>
                </Form>
            </div>

            {locations.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-hairline bg-card px-4 py-12 text-center">
                    <MapPin className="mx-auto size-8 text-slate-gray" />
                    <p className="mt-3 text-[15px] font-semibold">
                        {t("noPlacesYet")}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        {t("noPlacesDesc")}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {locations.map(location => (
                        <section
                            key={location.id}
                            className="overflow-hidden rounded-[16px] border border-hairline bg-card"
                        >
                            <div className="flex flex-col gap-3 border-b border-hairline px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                        <MapPin className="size-4" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-[15px] font-semibold">
                                                {location.name}
                                            </h3>
                                            <Badge variant="secondary">
                                                {location.tables.length === 1
                                                    ? t("tableOne", {
                                                          count: location.tables
                                                              .length,
                                                      })
                                                    : t("tableMany", {
                                                          count: location.tables
                                                              .length,
                                                      })}
                                            </Badge>
                                        </div>
                                        <p className="text-[12px] text-slate-gray">
                                            {t("deletePlaceHint")}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        confirmPlaceId === location.id
                                            ? "destructive"
                                            : "outline"
                                    }
                                    disabled={saving}
                                    onClick={() =>
                                        void onDeletePlace(
                                            location.id,
                                            location.name,
                                        )
                                    }
                                    onBlur={() => {
                                        if (confirmPlaceId === location.id) {
                                            setTimeout(
                                                () => setConfirmPlaceId(null),
                                                200,
                                            );
                                        }
                                    }}
                                >
                                    <Trash2 className="size-3.5" />
                                    {confirmPlaceId === location.id
                                        ? t("confirmDeletePlace")
                                        : t("deletePlace")}
                                </Button>
                            </div>

                            {location.tables.length === 0 ? (
                                <p className="px-4 py-8 text-center text-[13px] text-slate-gray">
                                    {t("noTablesInPlace")}
                                </p>
                            ) : (
                                <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {location.tables.map(table => {
                                        const assigned = Boolean(
                                            table.assignedWaiterName,
                                        );
                                        return (
                                            <article
                                                key={table.id}
                                                className="flex flex-col justify-between rounded-[14px] border border-hairline bg-background/60 p-3.5"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-[14px] font-semibold">
                                                                {
                                                                    table.displayName
                                                                }
                                                            </p>
                                                            {table.displayNumber ? (
                                                                <p className="text-[11px] text-slate-gray">
                                                                    #
                                                                    {
                                                                        table.displayNumber
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                assigned
                                                                    ? "success"
                                                                    : "warning"
                                                            }
                                                        >
                                                            {assigned
                                                                ? t("assigned")
                                                                : t("open")}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-gray">
                                                        <UserRound className="size-3.5 shrink-0" />
                                                        {assigned ? (
                                                            <span className="truncate font-medium text-foreground">
                                                                {
                                                                    table.assignedWaiterName
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-700 dark:text-amber-400">
                                                                {t(
                                                                    "noWaiterAssigned",
                                                                )}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="mt-3 flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() =>
                                                            openEdit(table)
                                                        }
                                                    >
                                                        {tCommon("edit")}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            confirmTableId ===
                                                            table.id
                                                                ? "destructive"
                                                                : "outline"
                                                        }
                                                        disabled={saving}
                                                        onClick={() =>
                                                            void onDeleteTable(
                                                                table,
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            if (
                                                                confirmTableId ===
                                                                table.id
                                                            ) {
                                                                setTimeout(
                                                                    () =>
                                                                        setConfirmTableId(
                                                                            null,
                                                                        ),
                                                                    200,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        {confirmTableId ===
                                                        table.id
                                                            ? tCommon("confirm")
                                                            : tCommon("delete")}
                                                    </Button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            )}

            {editingTable ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
                    <div
                        className="flex-1"
                        onClick={() => setEditingTable(null)}
                        aria-hidden
                    />
                    <Form {...editForm}>
                        <form
                            onSubmit={editForm.handleSubmit(
                                values => void onSaveEdit(values),
                            )}
                            className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-card shadow-xl"
                        >
                            <div className="border-b border-hairline px-5 py-4">
                                <h2 className="text-[17px] font-semibold">
                                    {t("editTable")}
                                </h2>
                                <p className="text-[12px] text-slate-gray">
                                    {t("editTableDesc")}
                                </p>
                            </div>
                            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                                <FormField
                                    control={editForm.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("tableName")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-10"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="locationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("place")}</FormLabel>
                                            <FormControl>
                                                <select
                                                    value={field.value}
                                                    onChange={e =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                                >
                                                    {locations.map(location => (
                                                        <option
                                                            key={location.id}
                                                            value={location.id}
                                                        >
                                                            {location.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="assignedWaiterMembershipId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("assignedWaiter")}
                                            </FormLabel>
                                            <FormControl>
                                                <select
                                                    value={field.value || ""}
                                                    onChange={e =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                                >
                                                    <option value="">
                                                        {t("unassigned")}
                                                    </option>
                                                    {waiters.map(waiter => (
                                                        <option
                                                            key={waiter.id}
                                                            value={waiter.id}
                                                        >
                                                            {waiter.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col gap-2 border-t border-hairline px-5 py-4">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setEditingTable(null)}
                                    >
                                        {tCommon("cancel")}
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={saving}
                                    >
                                        <Save className="size-4" />
                                        {tCommon("save")}
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant={
                                        confirmTableId === editingTable.id
                                            ? "destructive"
                                            : "outline"
                                    }
                                    disabled={saving}
                                    onClick={() =>
                                        void onDeleteTable(editingTable)
                                    }
                                >
                                    <Trash2 className="size-4" />
                                    {confirmTableId === editingTable.id
                                        ? t("confirmDeleteTable")
                                        : t("deleteTable")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            ) : null}
        </div>
    );
}
