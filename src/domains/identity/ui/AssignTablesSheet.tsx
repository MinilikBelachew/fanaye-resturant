"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, Clock3, Plus, UtensilsCrossed, X } from "lucide-react";
import { useAdminFloorLayoutQuery } from "@/context/services/floorApi";
import {
    useAdminStaffQuery,
    useCreateShiftDefinitionMutation,
    useSetWaiterTableCoverageMutation,
} from "@/context/services/staffApi";
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
    shiftDefinitionSchema,
    type ShiftDefinitionFormValues,
} from "@/lib/validators/floor";
import { cn } from "@/lib/utils";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DAY_FULL: Record<(typeof DAY_ORDER)[number], string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
};

function normalizeDayCode(raw: string): (typeof DAY_ORDER)[number] | null {
    const key = raw.trim().slice(0, 3);
    const match = DAY_ORDER.find(
        day => day.toLowerCase() === key.toLowerCase(),
    );
    return match ?? null;
}

function formatDays(dayCodes: string[]): string {
    const ordered = DAY_ORDER.filter(day =>
        dayCodes.some(code => normalizeDayCode(code) === day),
    );
    if (ordered.length === 0) return "";
    if (ordered.length === 1) return DAY_FULL[ordered[0]];
    return ordered.map(day => DAY_FULL[day]).join(", ");
}

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
    const { data: staffData } = useAdminStaffQuery(undefined, {
        skip: !isOpen,
    });
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

    const shiftOptions = useMemo(() => {
        const dayShifts = waiter?.dayShifts ?? [];
        if (dayShifts.length > 0) {
            const byShift = new Map<
                string,
                {
                    shiftDefinitionId: string;
                    shiftName: string;
                    startLocalTime: string;
                    endLocalTime: string;
                    dayCodes: string[];
                }
            >();
            for (const row of dayShifts) {
                const existing = byShift.get(row.shiftDefinitionId);
                if (existing) {
                    existing.dayCodes.push(row.dayCode);
                    continue;
                }
                byShift.set(row.shiftDefinitionId, {
                    shiftDefinitionId: row.shiftDefinitionId,
                    shiftName: row.shiftName,
                    startLocalTime: row.startLocalTime,
                    endLocalTime: row.endLocalTime,
                    dayCodes: [row.dayCode],
                });
            }
            return [...byShift.values()].map(entry => ({
                ...entry,
                daysLabel: formatDays(entry.dayCodes),
            }));
        }

        return shifts.map(shift => ({
            shiftDefinitionId: shift.id,
            shiftName: shift.name,
            startLocalTime: shift.startLocalTime,
            endLocalTime: shift.endLocalTime,
            dayCodes: [] as string[],
            daysLabel: "",
        }));
    }, [waiter?.dayShifts, shifts]);

    const [shiftId, setShiftId] = useState("");
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
    const [showNewShift, setShowNewShift] = useState(false);

    const shiftForm = useForm<ShiftDefinitionFormValues>({
        resolver: zodResolver(shiftDefinitionSchema),
        defaultValues: {
            name: "",
            startLocalTime: "07:00",
            endLocalTime: "15:00",
        },
    });

    useEffect(() => {
        if (!isOpen) return;
        setShiftId(shiftOptions[0]?.shiftDefinitionId ?? "");
        setShowNewShift(false);
        shiftForm.reset({
            name: "",
            startLocalTime: "07:00",
            endLocalTime: "15:00",
        });
    }, [isOpen, shiftOptions, shiftForm]);

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

    const selectedShift = shiftOptions.find(
        shift => shift.shiftDefinitionId === shiftId,
    );

    function toggleTable(tableId: string) {
        setSelectedTableIds(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId],
        );
    }

    async function handleSave() {
        if (!waiterMembershipId || !shiftId) {
            toast.error("Select a shift first.");
            return;
        }
        try {
            await setCoverage({
                membershipId: waiterMembershipId,
                shiftDefinitionId: shiftId,
                tableIds: selectedTableIds,
            }).unwrap();
            toast.success(
                "Tables saved",
                selectedShift?.daysLabel
                    ? `${selectedTableIds.length} table(s) for ${selectedShift.shiftName} (${selectedShift.daysLabel}).`
                    : `${selectedTableIds.length} table(s) for this shift.`,
            );
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Could not save table coverage.");
        }
    }

    async function onCreateShift(values: ShiftDefinitionFormValues) {
        try {
            const created = await createShift(values).unwrap();
            setShiftId(created.data.id);
            setShowNewShift(false);
            shiftForm.reset({
                name: "",
                startLocalTime: "07:00",
                endLocalTime: "15:00",
            });
            toast.success(
                "Shift created",
                `${created.data.name} (${created.data.startLocalTime}–${created.data.endLocalTime}). Assign days on Edit staff if needed.`,
            );
        } catch (err) {
            toast.fromUnknown(
                err,
                "Could not create shift. Use times like 07:00.",
            );
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
                                a day/shift window, then tables
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
                                Shift & working days
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
                            {shiftOptions.length === 0 ? (
                                <option value="">
                                    Schedule days on Edit staff first
                                </option>
                            ) : null}
                            {shiftOptions.map(shift => (
                                <option
                                    key={shift.shiftDefinitionId}
                                    value={shift.shiftDefinitionId}
                                >
                                    {shift.daysLabel
                                        ? `${shift.daysLabel} · ${shift.shiftName} · ${shift.startLocalTime}–${shift.endLocalTime}`
                                        : `${shift.shiftName} · ${shift.startLocalTime}–${shift.endLocalTime}`}
                                </option>
                            ))}
                        </select>
                        {selectedShift ? (
                            <p className="flex items-start gap-1.5 text-[12px] text-slate-gray">
                                <Clock3 className="mt-0.5 size-3.5 shrink-0" />
                                <span>
                                    {selectedShift.daysLabel
                                        ? `Covers these tables on ${selectedShift.daysLabel} during ${selectedShift.startLocalTime}–${selectedShift.endLocalTime}.`
                                        : `Only this waiter covers these tables during ${selectedShift.startLocalTime}–${selectedShift.endLocalTime}. Set working days on Edit staff.`}
                                </span>
                            </p>
                        ) : null}
                    </div>

                    {showNewShift ? (
                        <Form {...shiftForm}>
                            <form
                                onSubmit={shiftForm.handleSubmit(
                                    values => void onCreateShift(values),
                                )}
                                className="space-y-2 rounded-[12px] border border-dashed border-hairline bg-surface-ivory p-3"
                            >
                                <p className="text-[12px] font-medium">
                                    Create shift with any times
                                </p>
                                <FormField
                                    control={shiftForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">
                                                Shift name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Brunch, Late night"
                                                    className="h-9"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField
                                        control={shiftForm.control}
                                        name="startLocalTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        className="h-9"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={shiftForm.control}
                                        name="endLocalTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        className="h-9"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={creatingShift}
                                >
                                    {creatingShift ? "Saving…" : "Save shift"}
                                </Button>
                            </form>
                        </Form>
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
