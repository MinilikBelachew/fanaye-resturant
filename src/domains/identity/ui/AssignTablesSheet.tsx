"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Plus, UtensilsCrossed, X } from "lucide-react";
import { useAdminFloorLayoutQuery } from "@/context/services/floorApi";
import {
    useAdminStaffQuery,
    useCreateShiftDefinitionMutation,
    useSetWaiterTableCoverageMutation,
} from "@/context/services/staffApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AssignTablesSheetProps {
    isOpen: boolean;
    waiterMembershipId: string | null;
    waiterName: string | null;
    onClose: () => void;
}

export default function AssignTablesSheet({
    isOpen,
    waiterMembershipId,
    waiterName,
    onClose,
}: AssignTablesSheetProps) {
    const { data: staffData } = useAdminStaffQuery(undefined, { skip: !isOpen });
    const { data: layoutData } = useAdminFloorLayoutQuery(undefined, {
        skip: !isOpen,
    });
    const [setCoverage, { isLoading: saving }] =
        useSetWaiterTableCoverageMutation();
    const [createShift, { isLoading: creatingShift }] =
        useCreateShiftDefinitionMutation();

    const shifts = staffData?.shifts ?? [];
    const locations = layoutData?.data ?? [];
    const tables = locations.flatMap(location =>
        location.tables.map(table => ({
            ...table,
            locationName: location.name,
        })),
    );

    const waiter = useMemo(
        () =>
            staffData?.data.find(member => member.id === waiterMembershipId) ??
            null,
        [staffData, waiterMembershipId],
    );

    const [shiftId, setShiftId] = useState("");
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
    const [showNewShift, setShowNewShift] = useState(false);
    const [newShiftName, setNewShiftName] = useState("");
    const [newStart, setNewStart] = useState("07:00");
    const [newEnd, setNewEnd] = useState("15:00");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        const initialShift = shifts[0]?.id ?? "";
        setShiftId(initialShift);
        setShowNewShift(false);
        setError("");
        setMessage("");
    }, [isOpen, shifts]);

    useEffect(() => {
        if (!isOpen || !waiter || !shiftId) {
            setSelectedTableIds([]);
            return;
        }
        const coverage = waiter.shiftCoverages.find(
            entry => entry.shiftDefinitionId === shiftId,
        );
        setSelectedTableIds(coverage?.tables.map(table => table.tableId) ?? []);
    }, [isOpen, waiter, shiftId]);

    if (!isOpen || !waiterMembershipId) return null;

    const selectedShift = shifts.find(shift => shift.id === shiftId);

    function toggleTable(tableId: string) {
        setSelectedTableIds(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId],
        );
    }

    async function handleSave() {
        if (!waiterMembershipId || !shiftId) return;
        setError("");
        setMessage("");
        try {
            await setCoverage({
                membershipId: waiterMembershipId,
                shiftDefinitionId: shiftId,
                tableIds: selectedTableIds,
            }).unwrap();
            setMessage("Tables saved for this shift.");
            onClose();
        } catch {
            setError("Could not save table coverage.");
        }
    }

    async function handleCreateShift(event: React.FormEvent) {
        event.preventDefault();
        if (!newShiftName.trim()) return;
        setError("");
        try {
            const created = await createShift({
                name: newShiftName.trim(),
                startLocalTime: newStart,
                endLocalTime: newEnd,
            }).unwrap();
            setShiftId(created.data.id);
            setShowNewShift(false);
            setNewShiftName("");
            setMessage(
                `Shift “${created.data.name}” created (${created.data.startLocalTime}–${created.data.endLocalTime}).`,
            );
        } catch {
            setError("Could not create shift. Use times like 07:00.");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
            <div className="flex-1" onClick={onClose} aria-hidden />
            <aside className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-hairline px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UtensilsCrossed className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold">
                                Assign tables by shift
                            </h2>
                            <p className="text-[13px] text-slate-gray">
                                {waiterName || waiter?.name || "Waiter"} — pick
                                a shift window, then tables
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-gray hover:bg-secondary"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-[13px] font-medium">
                                Shift (custom times)
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowNewShift(v => !v)}
                                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand"
                            >
                                <Plus className="size-3.5" />
                                New shift
                            </button>
                        </div>
                        <select
                            value={shiftId}
                            onChange={e => setShiftId(e.target.value)}
                            className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                        >
                            {shifts.length === 0 ? (
                                <option value="">Create a shift first</option>
                            ) : null}
                            {shifts.map(shift => (
                                <option key={shift.id} value={shift.id}>
                                    {shift.name} · {shift.startLocalTime}–
                                    {shift.endLocalTime}
                                </option>
                            ))}
                        </select>
                        {selectedShift ? (
                            <p className="flex items-center gap-1.5 text-[12px] text-slate-gray">
                                <Clock3 className="size-3.5" />
                                Only this waiter covers these tables during{" "}
                                {selectedShift.startLocalTime}–
                                {selectedShift.endLocalTime}
                            </p>
                        ) : null}
                    </div>

                    {showNewShift ? (
                        <form
                            onSubmit={handleCreateShift}
                            className="space-y-2 rounded-[12px] border border-dashed border-hairline bg-surface-ivory p-3"
                        >
                            <p className="text-[12px] font-medium">
                                Create shift with any times
                            </p>
                            <Input
                                value={newShiftName}
                                onChange={e => setNewShiftName(e.target.value)}
                                placeholder="e.g. Brunch, Late night"
                                className="h-9"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="time"
                                    value={newStart}
                                    onChange={e => setNewStart(e.target.value)}
                                    className="h-9"
                                />
                                <Input
                                    type="time"
                                    value={newEnd}
                                    onChange={e => setNewEnd(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={
                                    creatingShift || !newShiftName.trim()
                                }
                            >
                                Save shift
                            </Button>
                        </form>
                    ) : null}

                    <div className="space-y-3">
                        {locations.map(location => (
                            <div key={location.id}>
                                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-gray">
                                    {location.name}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {location.tables.map(table => {
                                        const selected =
                                            selectedTableIds.includes(table.id);
                                        return (
                                            <button
                                                key={table.id}
                                                type="button"
                                                onClick={() =>
                                                    toggleTable(table.id)
                                                }
                                                className={cn(
                                                    "rounded-[12px] border px-2 py-2 text-left transition-colors",
                                                    selected
                                                        ? "border-brand bg-brand/10"
                                                        : "border-hairline bg-card hover:bg-secondary/50",
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="text-[13px] font-semibold">
                                                        {table.displayNumber ||
                                                            table.displayName}
                                                    </span>
                                                    {selected ? (
                                                        <Check className="size-3.5 text-brand" />
                                                    ) : null}
                                                </div>
                                                <span className="mt-0.5 block truncate text-[11px] text-slate-gray">
                                                    {table.displayName}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {tables.length === 0 ? (
                            <p className="text-[13px] text-slate-gray">
                                No tables yet. Create them under Tables →
                                Configure.
                            </p>
                        ) : null}
                    </div>

                    {error ? (
                        <p className="text-[12px] text-destructive">{error}</p>
                    ) : null}
                    {message ? (
                        <p className="text-[12px] text-emerald-700">{message}</p>
                    ) : null}
                </div>

                <div className="flex gap-2 border-t border-hairline px-5 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={saving || !shiftId}
                        onClick={() => void handleSave()}
                    >
                        {saving ? "Saving…" : "Save for this shift"}
                    </Button>
                </div>
            </aside>
        </div>
    );
}
