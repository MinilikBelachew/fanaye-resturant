"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, Save, UserRound } from "lucide-react";
import {
    useAdminFloorLayoutQuery,
    useCreateDiningTableMutation,
    useCreateTableLocationMutation,
    useUpdateDiningTableMutation,
} from "@/context/services/floorApi";
import type { AdminDiningTable } from "@/domains/floor/domain/floorLayoutApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

    const [placeName, setPlaceName] = useState("");
    const [tableName, setTableName] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [tableLocationId, setTableLocationId] = useState("");
    const [tableWaiterId, setTableWaiterId] = useState("");
    const [editingTable, setEditingTable] = useState<AdminDiningTable | null>(
        null,
    );
    const [editWaiterId, setEditWaiterId] = useState("");
    const [editName, setEditName] = useState("");
    const [editLocationId, setEditLocationId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const defaultLocationId = useMemo(
        () => tableLocationId || locations[0]?.id || "",
        [tableLocationId, locations],
    );

    async function handleCreatePlace(event: React.FormEvent) {
        event.preventDefault();
        if (!placeName.trim()) return;
        setError("");
        setMessage("");
        try {
            await createPlace({ name: placeName.trim() }).unwrap();
            setPlaceName("");
            setMessage("Place created.");
        } catch {
            setError("Could not create place. Name may already exist.");
        }
    }

    async function handleCreateTable(event: React.FormEvent) {
        event.preventDefault();
        const locationId = defaultLocationId;
        if (!tableName.trim() || !locationId) return;
        setError("");
        setMessage("");
        try {
            await createTable({
                locationId,
                displayName: tableName.trim(),
                displayNumber: tableNumber.trim() || undefined,
                assignedWaiterMembershipId: tableWaiterId || null,
            }).unwrap();
            setTableName("");
            setTableNumber("");
            setTableWaiterId("");
            setMessage("Table created.");
        } catch {
            setError("Could not create table.");
        }
    }

    function openEdit(table: AdminDiningTable) {
        setEditingTable(table);
        setEditName(table.displayName);
        setEditLocationId(table.locationId);
        setEditWaiterId(table.assignedWaiterMembershipId ?? "");
        setError("");
        setMessage("");
    }

    async function handleSaveEdit(event: React.FormEvent) {
        event.preventDefault();
        if (!editingTable) return;
        setError("");
        setMessage("");
        try {
            await updateTable({
                id: editingTable.id,
                body: {
                    displayName: editName.trim(),
                    locationId: editLocationId,
                    assignedWaiterMembershipId: editWaiterId || null,
                },
            }).unwrap();
            setEditingTable(null);
            setMessage("Table updated.");
        } catch {
            setError("Could not update table.");
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

            {(error || message) && (
                <p
                    className={cn(
                        "text-[13px]",
                        error ? "text-destructive" : "text-emerald-700",
                    )}
                >
                    {error || message}
                </p>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <form
                    onSubmit={handleCreatePlace}
                    className="space-y-3 rounded-[16px] border border-hairline bg-card p-4"
                >
                    <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-brand" />
                        <h3 className="text-[15px] font-semibold">
                            Create place
                        </h3>
                    </div>
                    <Input
                        value={placeName}
                        onChange={e => setPlaceName(e.target.value)}
                        placeholder="e.g. Terrace, VIP Lounge"
                        className="h-10"
                    />
                    <Button
                        type="submit"
                        disabled={saving || !placeName.trim()}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="size-4" />
                        Add place
                    </Button>
                </form>

                <form
                    onSubmit={handleCreateTable}
                    className="space-y-3 rounded-[16px] border border-hairline bg-card p-4"
                >
                    <div className="flex items-center gap-2">
                        <Plus className="size-4 text-brand" />
                        <h3 className="text-[15px] font-semibold">
                            Create table
                        </h3>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                            value={tableName}
                            onChange={e => setTableName(e.target.value)}
                            placeholder="Table name"
                            className="h-10"
                        />
                        <Input
                            value={tableNumber}
                            onChange={e => setTableNumber(e.target.value)}
                            placeholder="Number (optional)"
                            className="h-10"
                        />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <select
                            value={defaultLocationId}
                            onChange={e => setTableLocationId(e.target.value)}
                            className="h-10 rounded-[10px] border border-input bg-card px-3 text-[13px]"
                        >
                            {locations.length === 0 ? (
                                <option value="">Create a place first</option>
                            ) : null}
                            {locations.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={tableWaiterId}
                            onChange={e => setTableWaiterId(e.target.value)}
                            className="h-10 rounded-[10px] border border-input bg-card px-3 text-[13px]"
                        >
                            <option value="">Assign waiter later</option>
                            {waiters.map(waiter => (
                                <option key={waiter.id} value={waiter.id}>
                                    {waiter.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        type="submit"
                        disabled={
                            saving || !tableName.trim() || !defaultLocationId
                        }
                        className="w-full sm:w-auto"
                    >
                        <Plus className="size-4" />
                        Add table
                    </Button>
                </form>
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
                    <form
                        onSubmit={handleSaveEdit}
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
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium">
                                    Table name
                                </label>
                                <Input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium">
                                    Place
                                </label>
                                <select
                                    value={editLocationId}
                                    onChange={e =>
                                        setEditLocationId(e.target.value)
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
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium">
                                    Assigned waiter
                                </label>
                                <select
                                    value={editWaiterId}
                                    onChange={e =>
                                        setEditWaiterId(e.target.value)
                                    }
                                    className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                >
                                    <option value="">Unassigned</option>
                                    {waiters.map(waiter => (
                                        <option
                                            key={waiter.id}
                                            value={waiter.id}
                                        >
                                            {waiter.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                                disabled={saving || !editName.trim()}
                            >
                                <Save className="size-4" />
                                Save
                            </Button>
                        </div>
                    </form>
                </div>
            ) : null}
        </div>
    );
}
