"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import {
    ChevronRight,
    LayoutGrid,
    MapPin,
    Pencil,
    Plus,
    Save,
    Table2,
    Trash2,
    UserRound,
    Utensils,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
    useAdminFloorLayoutQuery,
    useCreateDiningTableMutation,
    useCreateTableLocationMutation,
    useDeleteDiningTableMutation,
    useDeleteTableLocationMutation,
    useUpdateDiningTableMutation,
    useUpdateTableLocationMutation,
} from "@/context/services/floorApi";
import type { AdminDiningTable } from "@/domains/floor/domain/floorLayoutApi";
import { ManagerDiningTableCard } from "@/domains/floor/ui/ManagerDiningTableCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
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
    const tDetail = useTranslations("managerTableDetail");
    const tCommon = useTranslations("common");
    const [selectedShiftId, setSelectedShiftId] = useState<string>("");
    const { data, isLoading, isError } = useAdminFloorLayoutQuery(
        selectedShiftId ? { shiftId: selectedShiftId } : undefined,
    );
    const [createPlace, { isLoading: creatingPlace }] =
        useCreateTableLocationMutation();
    const [updatePlace] = useUpdateTableLocationMutation();
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
    const shifts = data?.shifts ?? [];
    const activeShiftId = data?.activeShiftId;

    const [editingTable, setEditingTable] = useState<AdminDiningTable | null>(
        null,
    );
    const [confirmPlaceId, setConfirmPlaceId] = useState<string | null>(null);
    const [confirmTableId, setConfirmTableId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

    useEffect(() => {
        try {
            const saved = localStorage.getItem(
                "fanaye_manager_floor_config_view",
            );
            if (saved === "cards" || saved === "table") {
                setViewMode(saved);
            }
        } catch {
            // ignore
        }
    }, []);

    const handleSetViewMode = (mode: "cards" | "table") => {
        setViewMode(mode);
        try {
            localStorage.setItem("fanaye_manager_floor_config_view", mode);
        } catch {
            // ignore
        }
    };

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
        defaultValues: { name: "", isVip: false },
    });

    const tableForm = useForm<DiningTableCreateValues>({
        resolver: zodResolver(diningTableCreateSchema),
        defaultValues: {
            displayName: "",
            displayNumber: "",
            locationId: "",
            assignedWaiterMembershipId: "",
            isVip: false,
        },
    });

    const editForm = useForm<DiningTableEditValues>({
        resolver: zodResolver(diningTableEditSchema),
        defaultValues: {
            displayNumber: "",
            displayName: "",
            locationId: "",
            assignedWaiterMembershipId: "",
            isVip: false,
        },
    });

    useEffect(() => {
        if (!tableForm.getValues("locationId") && locations[0]?.id) {
            tableForm.setValue("locationId", locations[0].id);
        }
    }, [locations, tableForm]);

    async function onCreatePlace(values: PlaceFormValues) {
        try {
            await createPlace({
                name: values.name,
                isVip: values.isVip ?? false,
            }).unwrap();
            placeForm.reset({ name: "", isVip: false });
            toast.success(t("toastPlaceCreated"), values.name);
        } catch (err) {
            toast.fromUnknown(err, t("toastPlaceCreateError"));
        }
    }

    async function onTogglePlaceVip(locationId: string, isVip: boolean) {
        try {
            await updatePlace({ id: locationId, body: { isVip } }).unwrap();
            toast.success(isVip ? t("toastPlaceVipOn") : t("toastPlaceVipOff"));
        } catch (err) {
            toast.fromUnknown(err, t("toastPlaceVipError"));
        }
    }

    async function onCreateTable(values: DiningTableCreateValues) {
        const number = values.displayNumber.trim();
        const label = values.displayName?.trim() || `Table ${number}`;
        try {
            await createTable({
                locationId: values.locationId,
                displayName: label,
                displayNumber: number,
                isVip: values.isVip ?? false,
            }).unwrap();
            tableForm.reset({
                displayName: "",
                displayNumber: "",
                locationId: values.locationId,
                assignedWaiterMembershipId: "",
                isVip: false,
            });
            toast.success(t("toastTableCreated"), `#${number} · ${label}`);
        } catch (err) {
            toast.fromUnknown(err, t("toastTableCreateError"));
        }
    }

    function openEdit(table: AdminDiningTable) {
        setEditingTable(table);
        setConfirmTableId(null);
        editForm.reset({
            displayNumber: table.displayNumber ?? "",
            displayName: table.displayName,
            locationId: table.locationId,
            assignedWaiterMembershipId: "",
            isVip: table.isVip,
        });
    }

    async function onSaveEdit(values: DiningTableEditValues) {
        if (!editingTable) return;
        try {
            await updateTable({
                id: editingTable.id,
                body: {
                    displayNumber: values.displayNumber.trim(),
                    displayName: values.displayName.trim(),
                    locationId: values.locationId,
                    isVip: values.isVip ?? false,
                },
            }).unwrap();
            setEditingTable(null);
            toast.success(
                t("toastTableUpdated"),
                `#${values.displayNumber.trim()} · ${values.displayName.trim()}`,
            );
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
                        <FormField
                            control={placeForm.control}
                            name="isVip"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={checked =>
                                                field.onChange(checked === true)
                                            }
                                        />
                                    </FormControl>
                                    <FormLabel className="text-[13px] font-normal">
                                        {t("markPlaceVip")}
                                    </FormLabel>
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
                                name="displayNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    "tableNumberPlaceholder",
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
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    "tableLabelPlaceholder",
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
                        <p className="text-[11px] text-slate-gray">
                            {t("tableIdentityHint")}
                        </p>
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
                        </div>
                        <p className="text-[11px] text-slate-gray">
                            Waiter assignments are scheduled by shift in{" "}
                            <span className="font-semibold text-foreground">
                                HR → Directory
                            </span>
                            .
                        </p>
                        <FormField
                            control={tableForm.control}
                            name="isVip"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={checked =>
                                                field.onChange(checked === true)
                                            }
                                        />
                                    </FormControl>
                                    <FormLabel className="text-[13px] font-normal">
                                        {t("markTableVip")}
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
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
                    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                        <div>
                            <h3 className="text-[14px] font-semibold text-foreground">
                                {totals.places} {t("placesCount") || "places"} •{" "}
                                {totals.tables} {t("tablesCount") || "tables"}
                            </h3>
                            <p className="text-[12px] text-slate-gray">
                                {totals.unassigned > 0
                                    ? `${totals.unassigned} tables unassigned`
                                    : "All tables assigned"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Shift Selector */}
                            {shifts.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1 rounded-full border border-hairline bg-surface-ivory p-0.5 shadow-2xs">
                                    <span className="pl-2.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                        Shift:
                                    </span>
                                    {shifts.map(shift => {
                                        const isSelected =
                                            (selectedShiftId ||
                                                data?.selectedShiftId) ===
                                            shift.id;
                                        const isLive =
                                            activeShiftId === shift.id;
                                        return (
                                            <button
                                                key={shift.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedShiftId(shift.id)
                                                }
                                                className={cn(
                                                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-all select-none",
                                                    isSelected
                                                        ? "bg-foreground text-background shadow-xs font-semibold"
                                                        : "text-slate-gray hover:text-foreground",
                                                )}
                                                title={`${shift.name} (${shift.startLocalTime}–${shift.endLocalTime})`}
                                            >
                                                {isLive ? (
                                                    <span className="relative flex size-1.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
                                                    </span>
                                                ) : null}
                                                <span>{shift.name}</span>
                                                <span
                                                    className={cn(
                                                        "text-[10px]",
                                                        isSelected
                                                            ? "text-background/70"
                                                            : "text-slate-gray",
                                                    )}
                                                >
                                                    {shift.startLocalTime}–
                                                    {shift.endLocalTime}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedShiftId("all")
                                        }
                                        className={cn(
                                            "rounded-full px-2 py-1 text-[12px] font-medium transition-all select-none",
                                            selectedShiftId === "all"
                                                ? "bg-foreground text-background shadow-xs font-semibold"
                                                : "text-slate-gray hover:text-foreground",
                                        )}
                                        title="Show default/permanent assignments without shift filter"
                                    >
                                        All
                                    </button>
                                </div>
                            ) : null}

                            {/* View Switcher: Cards vs Table with localStorage persistence */}
                            <div className="flex items-center rounded-full border border-hairline bg-surface-ivory p-0.5 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => handleSetViewMode("cards")}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all select-none",
                                        viewMode === "cards"
                                            ? "bg-foreground text-background shadow-xs font-semibold"
                                            : "text-slate-gray hover:text-foreground",
                                    )}
                                    title="Cards Grid View"
                                >
                                    <LayoutGrid className="size-3.5" />
                                    <span className="hidden sm:inline">
                                        Cards
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetViewMode("table")}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all select-none",
                                        viewMode === "table"
                                            ? "bg-foreground text-background shadow-xs font-semibold"
                                            : "text-slate-gray hover:text-foreground",
                                    )}
                                    title="Data Table View"
                                >
                                    <Table2 className="size-3.5" />
                                    <span className="hidden sm:inline">
                                        Table
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

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
                                            {location.isVip ? (
                                                <Badge variant="default">
                                                    {t("vipBadge")}
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <p className="text-[12px] text-slate-gray">
                                            {t("deletePlaceHint")}
                                        </p>
                                        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[12px] text-slate-gray">
                                            <Checkbox
                                                checked={location.isVip}
                                                disabled={saving}
                                                onCheckedChange={checked =>
                                                    void onTogglePlaceVip(
                                                        location.id,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            {t("markPlaceVip")}
                                        </label>
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
                            ) : viewMode === "cards" ? (
                                <div className="grid gap-3.5 p-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {location.tables.map((table, index) => (
                                        <ManagerDiningTableCard
                                            key={table.id}
                                            table={table}
                                            index={index}
                                            saving={saving}
                                            confirmTableId={confirmTableId}
                                            onOpenEdit={openEdit}
                                            onDeleteTable={onDeleteTable}
                                            onResetConfirm={() =>
                                                setConfirmTableId(null)
                                            }
                                            labels={{
                                                assigned: t("assigned"),
                                                open: t("open"),
                                                vipBadge: t("vipBadge"),
                                                noWaiterAssigned:
                                                    t("noWaiterAssigned"),
                                                viewDetail:
                                                    tDetail("viewDetail"),
                                                edit: tCommon("edit"),
                                                delete: tCommon("delete"),
                                                confirm: tCommon("confirm"),
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-[13px]">
                                        <thead>
                                            <tr className="border-b border-hairline/60 bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                                <th className="px-4 py-3">
                                                    {tCommon("table")}
                                                </th>
                                                <th className="px-4 py-3">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3">
                                                    Assigned Waiter
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-hairline/50">
                                            {location.tables.map(table => {
                                                const assigned = Boolean(
                                                    table.assignedWaiterName,
                                                );
                                                const isConfirmingDelete =
                                                    confirmTableId === table.id;
                                                const tableNum =
                                                    table.displayNumber
                                                        ? `#${table.displayNumber}`
                                                        : table.displayName;
                                                const waiterInitials =
                                                    table.assignedWaiterName
                                                        ? table.assignedWaiterName
                                                              .split(" ")
                                                              .filter(Boolean)
                                                              .map(p => p[0])
                                                              .slice(0, 2)
                                                              .join("")
                                                              .toUpperCase()
                                                        : null;

                                                return (
                                                    <tr
                                                        key={table.id}
                                                        className="group transition-colors hover:bg-secondary/40"
                                                    >
                                                        {/* Table column with thumbnail preview */}
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-neutral-900 shadow-2xs">
                                                                    <Image
                                                                        src="/images/dining_table_round.jpg"
                                                                        alt={
                                                                            table.displayName
                                                                        }
                                                                        fill
                                                                        sizes="40px"
                                                                        className="object-cover object-center"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-bold text-foreground">
                                                                            {
                                                                                tableNum
                                                                            }
                                                                        </span>
                                                                        {table.effectiveVip ? (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0 text-[9px] font-semibold"
                                                                            >
                                                                                VIP
                                                                            </Badge>
                                                                        ) : null}
                                                                    </div>
                                                                    {table.displayNumber ? (
                                                                        <p className="truncate text-[11px] text-slate-gray">
                                                                            {
                                                                                table.displayName
                                                                            }
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Status column */}
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                variant={
                                                                    assigned
                                                                        ? "success"
                                                                        : "warning"
                                                                }
                                                                className="gap-1.5 px-2.5 py-0.5 text-[11px] font-medium"
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        "size-1.5 rounded-full",
                                                                        assigned
                                                                            ? "bg-emerald-500 animate-pulse"
                                                                            : "bg-amber-500",
                                                                    )}
                                                                />
                                                                {assigned
                                                                    ? t(
                                                                          "assigned",
                                                                      )
                                                                    : t("open")}
                                                            </Badge>
                                                        </td>

                                                        {/* Waiter column */}
                                                        <td className="px-4 py-3">
                                                            {assigned ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                                        {
                                                                            waiterInitials
                                                                        }
                                                                    </span>
                                                                    <span className="truncate font-semibold text-foreground">
                                                                        {
                                                                            table.assignedWaiterName
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[12px] text-amber-700 dark:text-amber-400">
                                                                    <UserRound className="size-3" />
                                                                    {t(
                                                                        "noWaiterAssigned",
                                                                    )}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Actions column */}
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 gap-1 px-2.5 text-[12px] font-medium"
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/manager/tables/${table.id}`}
                                                                    >
                                                                        {tDetail(
                                                                            "viewDetail",
                                                                        )}
                                                                        <ChevronRight className="size-3.5" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            table,
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 px-2.5 text-[12px] font-medium"
                                                                >
                                                                    <Pencil className="size-3.5" />
                                                                    {tCommon(
                                                                        "edit",
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant={
                                                                        isConfirmingDelete
                                                                            ? "destructive"
                                                                            : "outline"
                                                                    }
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                    onClick={() =>
                                                                        void onDeleteTable(
                                                                            table,
                                                                        )
                                                                    }
                                                                    onBlur={() => {
                                                                        if (
                                                                            isConfirmingDelete
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
                                                                    className="h-8 px-2.5"
                                                                    title={tCommon(
                                                                        "delete",
                                                                    )}
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                    {isConfirmingDelete
                                                                        ? tCommon(
                                                                              "confirm",
                                                                          )
                                                                        : null}
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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
                                    name="displayNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("tableNumber")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-10"
                                                    placeholder={t(
                                                        "tableNumberPlaceholder",
                                                    )}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("tableLabel")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-10"
                                                    placeholder={t(
                                                        "tableLabelPlaceholder",
                                                    )}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <p className="text-[11px] text-slate-gray">
                                    {t("tableIdentityHint")}
                                </p>
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
                                    name="isVip"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-[10px] border border-hairline px-3 py-2.5">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={checked =>
                                                        field.onChange(
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-[13px] font-medium">
                                                    {t("markTableVip")}
                                                </FormLabel>
                                                <p className="text-[11px] text-slate-gray">
                                                    {t("tableVipHint")}
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <p className="text-[11px] text-slate-gray">
                                    Waiter table assignments are managed by
                                    shift in{" "}
                                    <span className="font-semibold text-foreground">
                                        HR → Directory
                                    </span>
                                    .
                                </p>
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
