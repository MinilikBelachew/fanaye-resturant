"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MapPin, Plus, Save, UserRound } from "lucide-react";
import {
    useAdminFloorLayoutQuery,
    useCreateDiningTableMutation,
    useCreateTableLocationMutation,
    useUpdateDiningTableMutation,
} from "@/context/services/floorApi";
import type { AdminDiningTable } from "@/domains/floor/domain/floorLayoutApi";
import { Button } from "@/components/ui/button";
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

export default function ManagerFloorConfig() {
    const { data, isLoading, isError } = useAdminFloorLayoutQuery();
    const [createPlace, { isLoading: creatingPlace }] =
        useCreateTableLocationMutation();
    const [createTable, { isLoading: creatingTable }] =
        useCreateDiningTableMutation();
    const [updateTable, { isLoading: updatingTable }] =
        useUpdateDiningTableMutation();

    const locations = data?.data ?? [];
    const waiters = data?.waiters ?? [];

    const [editingTable, setEditingTable] = useState<AdminDiningTable | null>(
        null,
    );

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
            toast.success("Place created", values.name);
        } catch (err) {
            toast.fromUnknown(
                err,
                "Could not create place. Name may already exist.",
            );
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
            toast.success("Table created", values.displayName);
        } catch (err) {
            toast.fromUnknown(err, "Could not create table.");
        }
    }

    function openEdit(table: AdminDiningTable) {
        setEditingTable(table);
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
            toast.success("Table updated", values.displayName);
        } catch (err) {
            toast.fromUnknown(err, "Could not update table.");
        }
    }

    if (isLoading) {
        return <p className="text-slate-gray">Loading places & tables…</p>;
    }
    if (isError) {
        return (
            <p className="text-red-600">
                Could not load floor layout. Sign in as manager and check the
                API.
            </p>
        );
    }

    const saving = creatingPlace || creatingTable || updatingTable;

    return (
        <div className="space-y-6">
            <div className="rounded-[16px] border border-hairline bg-card p-4">
                <p className="text-[13px] text-slate-gray">
                    Create places, add tables, and assign one waiter per table.
                    That waiter is the only one who can open and run the table.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Form {...placeForm}>
                    <form
                        onSubmit={placeForm.handleSubmit(values =>
                            void onCreatePlace(values),
                        )}
                        className="space-y-3 rounded-[16px] border border-hairline bg-card p-4"
                    >
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-brand" />
                            <h3 className="text-[15px] font-semibold">
                                Create place
                            </h3>
                        </div>
                        <FormField
                            control={placeForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Terrace, VIP Lounge"
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
                            Add place
                        </Button>
                    </form>
                </Form>

                <Form {...tableForm}>
                    <form
                        onSubmit={tableForm.handleSubmit(values =>
                            void onCreateTable(values),
                        )}
                        className="space-y-3 rounded-[16px] border border-hairline bg-card p-4"
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="size-4 text-brand" />
                            <h3 className="text-[15px] font-semibold">
                                Create table
                            </h3>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <FormField
                                control={tableForm.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder="Table name"
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
                                                placeholder="Number (optional)"
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
                                                    field.onChange(e.target.value)
                                                }
                                                className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                            >
                                                {locations.length === 0 ? (
                                                    <option value="">
                                                        Create a place first
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
                                                    field.onChange(e.target.value)
                                                }
                                                className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                            >
                                                <option value="">
                                                    Assign waiter later
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
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="size-4" />
                            Add table
                        </Button>
                    </form>
                </Form>
            </div>

            <div className="space-y-4">
                {locations.map(location => (
                    <section
                        key={location.id}
                        className="rounded-[16px] border border-hairline bg-card"
                    >
                        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                            <div>
                                <h3 className="text-[15px] font-semibold">
                                    {location.name}
                                </h3>
                                <p className="text-[12px] text-slate-gray">
                                    {location.tables.length} table
                                    {location.tables.length === 1 ? "" : "s"}
                                </p>
                            </div>
                        </div>
                        {location.tables.length === 0 ? (
                            <p className="px-4 py-6 text-[13px] text-slate-gray">
                                No tables in this place yet.
                            </p>
                        ) : (
                            <div className="divide-y divide-hairline">
                                {location.tables.map(table => (
                                    <div
                                        key={table.id}
                                        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-semibold">
                                                {table.displayName}
                                                {table.displayNumber
                                                    ? ` · #${table.displayNumber}`
                                                    : ""}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-gray">
                                                <UserRound className="size-3.5" />
                                                {table.assignedWaiterName ? (
                                                    <>
                                                        Assigned to{" "}
                                                        <span className="font-medium text-foreground">
                                                            {
                                                                table.assignedWaiterName
                                                            }
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-amber-700">
                                                        No waiter assigned
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEdit(table)}
                                        >
                                            Edit / assign
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>

            {editingTable ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
                    <div
                        className="flex-1"
                        onClick={() => setEditingTable(null)}
                        aria-hidden
                    />
                    <Form {...editForm}>
                        <form
                            onSubmit={editForm.handleSubmit(values =>
                                void onSaveEdit(values),
                            )}
                            className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-card shadow-xl"
                        >
                            <div className="border-b border-hairline px-5 py-4">
                                <h2 className="text-[17px] font-semibold">
                                    Edit table
                                </h2>
                                <p className="text-[12px] text-slate-gray">
                                    Change place or assign a different waiter.
                                </p>
                            </div>
                            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                                <FormField
                                    control={editForm.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Table name</FormLabel>
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
                                            <FormLabel>Place</FormLabel>
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
                                                Assigned waiter
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
                                                        Unassigned
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
                            <div className="flex gap-2 border-t border-hairline px-5 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setEditingTable(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={saving}
                                >
                                    <Save className="size-4" />
                                    Save
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            ) : null}
        </div>
    );
}
