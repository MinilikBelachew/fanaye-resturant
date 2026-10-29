"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Ban,
    Calendar,
    CalendarOff,
    Check,
    Clock3,
    Copy,
    Loader2,
    MapPin,
    Moon,
    Plus,
    RotateCcw,
    Sunrise,
    Sunset,
    UtensilsCrossed,
    X,
} from "lucide-react";
import {
    useAdminStaffQuery,
    useAdminShiftFloorQuery,
    useCreateShiftDefinitionMutation,
    useUpdateAdminStaffMutation,
} from "@/context/services/staffApi";
import type {
    AdminShiftDefinition,
    AdminStaffMember,
} from "@/domains/identity/domain/staffApi";
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
import DiningTableVisualCard from "@/domains/identity/ui/DiningTableVisualCard";
import { formatEthiopianLocalTime } from "@/lib/ethiopian-calendar";

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
    if (ordered.length === 7) return "Every day";
    if (ordered.length === 6 && !ordered.includes("Sun")) {
        return "Mon–Sat";
    }
    if (
        ordered.length === 5 &&
        !ordered.includes("Sat") &&
        !ordered.includes("Sun")
    ) {
        return "Mon–Fri";
    }
    if (ordered.length === 1) return DAY_FULL[ordered[0]];
    return ordered.join(", ");
}

function format12HourTime(time24: string): string {
    const [hStr, mStr] = time24.split(":");
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mm} ${period}`;
}

function formatShiftOptionLabel(shift: {
    shiftName: string;
    startLocalTime: string;
    endLocalTime: string;
    daysLabel?: string;
}): string {
    const s12 = format12HourTime(shift.startLocalTime);
    const e12 = format12HourTime(shift.endLocalTime);
    const ethS = formatEthiopianLocalTime(shift.startLocalTime).formattedAm;
    const ethE = formatEthiopianLocalTime(shift.endLocalTime).formattedAm;
    const timeFormatted = `${s12}–${e12} (${ethS} – ${ethE})`;
    return shift.daysLabel
        ? `${shift.daysLabel} · ${shift.shiftName} · ${timeFormatted}`
        : `${shift.shiftName} · ${timeFormatted}`;
}

interface AssignTablesSheetProps {
    isOpen: boolean;
    waiterMembershipId: string | null;
    waiterName: string | null;
    waiter?: AdminStaffMember | null;
    shifts?: AdminShiftDefinition[];
    onClose: () => void;
}

export default function AssignTablesSheet({
    isOpen,
    waiterMembershipId,
    waiterName,
    waiter: propWaiter,
    shifts: propShifts,
    onClose,
}: AssignTablesSheetProps) {
    const { data: staffData } = useAdminStaffQuery(undefined, {
        skip:
            !isOpen ||
            Boolean(propWaiter && propShifts && propShifts.length > 0),
    });
    const [updateStaffApi] = useUpdateAdminStaffMutation();
    const [createShift, { isLoading: creatingShift }] =
        useCreateShiftDefinitionMutation();
    const [isSaving, setIsSaving] = useState(false);

    const shifts = useMemo(
        () =>
            propShifts && propShifts.length > 0
                ? propShifts
                : (staffData?.shifts ?? []),
        [propShifts, staffData?.shifts],
    );

    const waiter = useMemo(
        () =>
            propWaiter ??
            staffData?.data.find(member => member.id === waiterMembershipId) ??
            null,
        [propWaiter, staffData, waiterMembershipId],
    );

    const [dayShiftByDay, setDayShiftByDay] = useState<Record<string, string>>({
        Mon: "",
        Tue: "",
        Wed: "",
        Thu: "",
        Fri: "",
        Sat: "",
        Sun: "",
    });
    const [tablesByShiftDay, setTablesByShiftDay] = useState<
        Record<string, Record<string, string[]>>
    >({});
    const [activeDayCode, setActiveDayCode] = useState<string>("Mon");
    const [shiftId, setShiftId] = useState<string>("");
    const [showNewShift, setShowNewShift] = useState(false);

    const shiftForm = useForm<ShiftDefinitionFormValues>({
        resolver: zodResolver(shiftDefinitionSchema),
        defaultValues: {
            name: "",
            startLocalTime: "07:00",
            endLocalTime: "15:00",
        },
    });

    const initializedMembershipRef = useRef<string | null>(null);

    // Synchronize initial state ONCE per modal session for this waiter
    useEffect(() => {
        if (!isOpen || !waiter) {
            initializedMembershipRef.current = null;
            return;
        }

        // Only run initialization once per waiter when the modal opens
        if (initializedMembershipRef.current === waiter.id) {
            return;
        }
        initializedMembershipRef.current = waiter.id;

        const nextDayShift: Record<string, string> = {
            Mon: "",
            Tue: "",
            Wed: "",
            Thu: "",
            Fri: "",
            Sat: "",
            Sun: "",
        };
        if (waiter.dayShifts && waiter.dayShifts.length > 0) {
            for (const ds of waiter.dayShifts) {
                const norm = normalizeDayCode(ds.dayCode);
                if (norm) {
                    nextDayShift[norm] = ds.shiftDefinitionId;
                }
            }
        } else if (waiter.workingDays && waiter.workingDays.length > 0) {
            const defaultShiftId = shifts[0]?.id || "";
            for (const wDay of waiter.workingDays) {
                const norm = normalizeDayCode(wDay);
                if (norm) {
                    nextDayShift[norm] = defaultShiftId;
                }
            }
        }
        setDayShiftByDay(nextDayShift);

        const nextTables: Record<string, Record<string, string[]>> = {};
        for (const cov of waiter.shiftCoverages ?? []) {
            if (!nextTables[cov.shiftDefinitionId]) {
                nextTables[cov.shiftDefinitionId] = {
                    Mon: [],
                    Tue: [],
                    Wed: [],
                    Thu: [],
                    Fri: [],
                    Sat: [],
                    Sun: [],
                };
            }
            const tblIds = (cov.tables ?? []).map(t => t.tableId);
            if (cov.dayCode) {
                const norm = normalizeDayCode(cov.dayCode);
                if (norm) {
                    nextTables[cov.shiftDefinitionId][norm] = tblIds;
                }
            } else {
                for (const d of DAY_ORDER) {
                    if (
                        !nextTables[cov.shiftDefinitionId][d] ||
                        nextTables[cov.shiftDefinitionId][d].length === 0
                    ) {
                        nextTables[cov.shiftDefinitionId][d] = [...tblIds];
                    }
                }
            }
        }
        setTablesByShiftDay(nextTables);

        const firstActiveDay =
            DAY_ORDER.find(d => Boolean(nextDayShift[d])) ?? "Mon";
        setActiveDayCode(firstActiveDay);
        setShiftId(nextDayShift[firstActiveDay] || shifts[0]?.id || "");
    }, [isOpen, waiter, shifts]);

    function handleSelectDay(day: string) {
        setActiveDayCode(day);
        const assignedShift = dayShiftByDay[day];
        if (assignedShift) {
            setShiftId(assignedShift);
        } else {
            setShiftId("");
        }
    }

    function handleSelectShiftForDay(sId: string) {
        setDayShiftByDay(prev => ({
            ...prev,
            [activeDayCode]: sId,
        }));
        setShiftId(sId);
    }

    function handleSetDayOff() {
        setDayShiftByDay(prev => ({
            ...prev,
            [activeDayCode]: "",
        }));
        setShiftId("");
    }

    function toggleTable(
        tableId: string,
        ownerId?: string | null,
        ownerName?: string | null,
    ) {
        if (!shiftId) return;
        const current = tablesByShiftDay[shiftId]?.[activeDayCode] ?? [];
        const ownedByOther =
            ownerId &&
            ownerId !== waiterMembershipId &&
            !current.includes(tableId);

        if (ownedByOther) {
            const ok = confirm(
                `Table is currently assigned to ${ownerName || "another waiter"} on ${activeDayCode}. Reassign to ${waiterName || waiter?.name || "this waiter"}?`,
            );
            if (!ok) return;
        }

        const next = current.includes(tableId)
            ? current.filter(id => id !== tableId)
            : [...current, tableId];

        setTablesByShiftDay(prev => ({
            ...prev,
            [shiftId]: {
                ...(prev[shiftId] ?? {}),
                [activeDayCode]: next,
            },
        }));
    }

    function applyCurrentDayToAllDays() {
        if (!shiftId) return;
        const current = tablesByShiftDay[shiftId]?.[activeDayCode] ?? [];
        setTablesByShiftDay(prev => {
            const shiftMap = { ...(prev[shiftId] ?? {}) };
            for (const day of DAY_ORDER) {
                shiftMap[day] = [...current];
            }
            return {
                ...prev,
                [shiftId]: shiftMap,
            };
        });
        toast.success(
            "Copied to all days",
            `${current.length} table(s) from ${activeDayCode} copied to all days for this shift. Click Save to confirm.`,
        );
    }

    function handleClearCurrentDay() {
        if (!shiftId) return;
        setTablesByShiftDay(prev => ({
            ...prev,
            [shiftId]: {
                ...(prev[shiftId] ?? {}),
                [activeDayCode]: [],
            },
        }));
    }

    async function onCreateShift(values: ShiftDefinitionFormValues) {
        try {
            const created = await createShift(values).unwrap();
            const newId = created.data.id;
            setDayShiftByDay(prev => ({
                ...prev,
                [activeDayCode]: newId,
            }));
            setShiftId(newId);
            setShowNewShift(false);
            shiftForm.reset({
                name: "",
                startLocalTime: "07:00",
                endLocalTime: "15:00",
            });
            toast.success(
                "Shift created",
                `${created.data.name} (${created.data.startLocalTime}–${created.data.endLocalTime}) assigned to ${activeDayCode}.`,
            );
        } catch (err) {
            toast.fromUnknown(
                err,
                "Could not create shift. Use times like 07:00.",
            );
        }
    }

    async function handleSave() {
        if (!waiterMembershipId) {
            toast.error("No waiter selected.");
            return;
        }

        try {
            setIsSaving(true);

            // 1. Build planned day shifts
            const plannedDayShifts: {
                dayCode: string;
                shiftDefinitionId: string;
            }[] = [];
            for (const day of DAY_ORDER) {
                const sId = dayShiftByDay[day];
                if (sId) {
                    plannedDayShifts.push({
                        dayCode: day,
                        shiftDefinitionId: sId,
                    });
                }
            }

            // 2. Build table coverages across all shifts
            const tableCoverages: Array<{
                shiftDefinitionId: string;
                dayCode?: string;
                applyToAllDays?: boolean;
                tableIds: string[];
            }> = [];

            for (const [sId, dayMap] of Object.entries(tablesByShiftDay)) {
                const firstDayTables = dayMap[DAY_ORDER[0]] ?? [];
                const allSame = DAY_ORDER.every(d => {
                    const list = dayMap[d] ?? [];
                    return (
                        list.length === firstDayTables.length &&
                        list.every(id => firstDayTables.includes(id))
                    );
                });

                if (allSame) {
                    tableCoverages.push({
                        shiftDefinitionId: sId,
                        applyToAllDays: true,
                        tableIds: firstDayTables,
                    });
                } else {
                    for (const day of DAY_ORDER) {
                        tableCoverages.push({
                            shiftDefinitionId: sId,
                            dayCode: day,
                            tableIds: dayMap[day] ?? [],
                        });
                    }
                }
            }

            // 3. Update staff with new dayShifts and tableCoverages atomically
            await updateStaffApi({
                membershipId: waiterMembershipId,
                body: {
                    dayShifts: plannedDayShifts,
                    tableCoverages,
                },
            }).unwrap();

            toast.success(
                "Tables & shifts saved",
                `Schedule and table assignments successfully saved for ${waiterName || waiter?.name || "waiter"}.`,
            );
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Could not save table coverage.");
        } finally {
            setIsSaving(false);
        }
    }

    const { data: shiftFloor, isFetching: floorLoading } =
        useAdminShiftFloorQuery(
            { shiftId: shiftId || "", dayCode: activeDayCode },
            {
                skip: !isOpen || !shiftId,
            },
        );

    const locations = shiftFloor?.locations ?? [];
    const tables = locations.flatMap(location => location.tables);
    const selectedTableIds = useMemo(() => {
        if (!shiftId) return [];
        return tablesByShiftDay[shiftId]?.[activeDayCode] ?? [];
    }, [tablesByShiftDay, shiftId, activeDayCode]);

    const activeShift = shifts.find(s => s.id === shiftId);
    const scheduledDaysCount = useMemo(
        () => DAY_ORDER.filter(d => Boolean(dayShiftByDay[d])).length,
        [dayShiftByDay],
    );

    const assignmentStats = useMemo(() => {
        const assigned = tables.filter(
            table => table.assignedWaiterMembershipId,
        );
        const free = tables.length - assigned.length;
        const mine = selectedTableIds.length;
        return {
            total: tables.length,
            assigned: assigned.length,
            free,
            mine,
        };
    }, [tables, selectedTableIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
            <div className="flex-1" onClick={onClose} aria-hidden />
            <aside className="relative z-10 flex h-full w-full max-w-2xl lg:max-w-3xl flex-col border-l border-hairline bg-card shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-hairline px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                            <UtensilsCrossed className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                Assign tables by shift
                            </h2>
                            <p className="text-[13px] text-slate-gray">
                                {waiterName || waiter?.name || "Waiter"} —
                                select day, pick shift, then assign tables
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-gray hover:bg-secondary cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {/* Step 1: 7-Day Weekday Selector */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                1. Select Day
                            </span>
                            <span className="text-[11px] text-slate-gray">
                                {scheduledDaysCount} day
                                {scheduledDaysCount === 1 ? "" : "s"} scheduled
                            </span>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5">
                            {DAY_ORDER.map(day => {
                                const isDaySelected = activeDayCode === day;
                                const assignedShiftId = dayShiftByDay[day];
                                const count = assignedShiftId
                                    ? (
                                          tablesByShiftDay[assignedShiftId]?.[
                                              day
                                          ] || []
                                      ).length
                                    : 0;

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleSelectDay(day)}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all cursor-pointer",
                                            isDaySelected
                                                ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                                                : "border-hairline bg-card hover:bg-muted text-muted-foreground",
                                        )}
                                    >
                                        <span className="text-[12px] font-bold leading-tight">
                                            {day}
                                        </span>
                                        <span
                                            className={cn(
                                                "mt-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none",
                                                isDaySelected
                                                    ? "bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950"
                                                    : assignedShiftId
                                                      ? "bg-muted text-foreground"
                                                      : "text-slate-400 dark:text-slate-500",
                                            )}
                                        >
                                            {!assignedShiftId
                                                ? "Off"
                                                : `${count} tbls`}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Shift Selector for Current Day */}
                    <div className="space-y-1.5 rounded-xl border border-hairline bg-card/60 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                2. Shift for {activeDayCode}
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowNewShift(v => !v)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-foreground/80 cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                New shift
                            </button>
                        </div>

                        {showNewShift ? (
                            <Form {...shiftForm}>
                                <form
                                    onSubmit={shiftForm.handleSubmit(
                                        (values: ShiftDefinitionFormValues) =>
                                            void onCreateShift(values),
                                    )}
                                    className="my-2 space-y-2.5 rounded-xl border border-dashed border-hairline bg-muted/30 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-[12px] font-semibold text-foreground">
                                            Create shift with any times
                                        </p>
                                        <span className="text-[11px] text-slate-gray">
                                            24h clock, e.g. 07:00
                                        </span>
                                    </div>
                                    <FormField
                                        control={shiftForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Brunch, Late night"
                                                        className="h-9 text-[13px] bg-background"
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
                                                            className="h-9 text-[13px] bg-background"
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
                                                            className="h-9 text-[13px] bg-background"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-[12px]"
                                            onClick={() =>
                                                setShowNewShift(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="h-8 text-[12px] bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                                            disabled={creatingShift}
                                        >
                                            {creatingShift
                                                ? "Saving…"
                                                : "Save shift"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {shifts.map(shift => {
                                const isCurrentShift =
                                    (dayShiftByDay[activeDayCode] || "") ===
                                    shift.id;
                                const count = (
                                    tablesByShiftDay[shift.id]?.[
                                        activeDayCode
                                    ] || []
                                ).length;
                                const isMorning = shift.startLocalTime
                                    ? parseInt(
                                          shift.startLocalTime.split(":")[0],
                                          10,
                                      ) < 14
                                    : false;

                                return (
                                    <button
                                        key={shift.id}
                                        type="button"
                                        onClick={() =>
                                            handleSelectShiftForDay(shift.id)
                                        }
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                                            isCurrentShift
                                                ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs"
                                                : "border-hairline bg-card hover:bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {isMorning ? (
                                            <Sunrise
                                                className={cn(
                                                    "size-3.5",
                                                    isCurrentShift
                                                        ? "text-amber-300"
                                                        : "text-amber-500",
                                                )}
                                            />
                                        ) : (
                                            <Moon
                                                className={cn(
                                                    "size-3.5",
                                                    isCurrentShift
                                                        ? "text-indigo-200"
                                                        : "text-indigo-400",
                                                )}
                                            />
                                        )}
                                        <span>
                                            {shift.name} (
                                            {format12HourTime(
                                                shift.startLocalTime,
                                            )}
                                            –
                                            {format12HourTime(
                                                shift.endLocalTime,
                                            )}
                                            )
                                        </span>
                                        {isCurrentShift ? (
                                            <span
                                                className={cn(
                                                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                                    isCurrentShift
                                                        ? "bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950"
                                                        : "bg-muted text-foreground",
                                                )}
                                            >
                                                {count} tbls
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => handleSetDayOff()}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                                    !dayShiftByDay[activeDayCode]
                                        ? "border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs"
                                        : "border-hairline bg-card hover:bg-muted text-muted-foreground",
                                )}
                            >
                                <Ban className="size-3.5 text-slate-gray" />
                                <span>Day Off</span>
                            </button>
                        </div>
                    </div>

                    {/* Step 3: Table Assignment */}
                    {!dayShiftByDay[activeDayCode] || !shiftId ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-hairline/80 bg-card/40 py-10 px-4 text-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                                <CalendarOff className="size-5" />
                            </div>
                            <p className="text-[13px] font-semibold text-foreground">
                                {activeDayCode} is a Scheduled Day Off
                            </p>
                            <p className="text-[11px] text-slate-gray max-w-xs mt-1">
                                Select a shift above (e.g. Morning or Evening)
                                to assign tables for {activeDayCode}.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 rounded-xl border border-hairline bg-card/60 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                    3. Table Assignment · {activeDayCode}{" "}
                                    {activeShift?.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={applyCurrentDayToAllDays}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-foreground/80 hover:underline cursor-pointer"
                                        title={`Copy ${activeDayCode} tables to all working days`}
                                    >
                                        <Copy className="size-3" />
                                        Copy {activeDayCode} to all
                                    </button>
                                    <span className="text-slate-300 dark:text-slate-600">
                                        ·
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleClearCurrentDay}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-gray hover:text-destructive cursor-pointer"
                                        title={`Clear tables for ${activeDayCode}`}
                                    >
                                        <RotateCcw className="size-3" />
                                        Clear {activeDayCode}
                                    </button>
                                </div>
                            </div>

                            {/* Clean Neutral & Emerald Stats Pill Row */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="rounded-full border border-hairline bg-card px-2.5 py-0.5 text-slate-gray">
                                    {assignmentStats.total} tables total
                                </span>
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                    {assignmentStats.free} free
                                </span>
                                <span className="rounded-full border border-hairline bg-card px-2.5 py-0.5 text-slate-gray">
                                    {assignmentStats.assigned} assigned
                                </span>
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                    {selectedTableIds.length} for{" "}
                                    {waiterName?.split(" ")[0] ||
                                        waiter?.name?.split(" ")[0] ||
                                        "this waiter"}
                                </span>
                            </div>

                            {floorLoading ? (
                                <div className="flex items-center gap-2 py-2 text-[12px] text-slate-gray">
                                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                                    <span>Loading shift floor layout…</span>
                                </div>
                            ) : null}

                            <div className="space-y-3 pt-1">
                                {locations.map(location => (
                                    <div key={location.id}>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-gray">
                                            <MapPin className="size-3.5" />
                                            {location.name}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {location.tables.map(table => {
                                                const selected =
                                                    selectedTableIds.includes(
                                                        table.tableId,
                                                    );
                                                const ownerId =
                                                    table.assignedWaiterMembershipId;
                                                const ownerName =
                                                    table.assignedWaiterName;
                                                const ownedByOther = Boolean(
                                                    ownerId &&
                                                        ownerId !==
                                                            waiterMembershipId &&
                                                        !selected,
                                                );
                                                const ownedBySelf = Boolean(
                                                    ownerId &&
                                                        waiterMembershipId &&
                                                        ownerId ===
                                                            waiterMembershipId,
                                                );

                                                return (
                                                    <DiningTableVisualCard
                                                        key={table.tableId}
                                                        tableId={table.tableId}
                                                        displayName={
                                                            table.displayName
                                                        }
                                                        displayNumber={
                                                            table.displayNumber
                                                        }
                                                        selected={selected}
                                                        ownedByOther={
                                                            ownedByOther
                                                        }
                                                        ownedBySelf={
                                                            ownedBySelf
                                                        }
                                                        ownerName={ownerName}
                                                        currentWaiterName={
                                                            waiterName ??
                                                            undefined
                                                        }
                                                        onToggle={() =>
                                                            toggleTable(
                                                                table.tableId,
                                                                ownerId,
                                                                ownerName,
                                                            )
                                                        }
                                                        labels={{
                                                            mine: "Mine",
                                                            free: "Free",
                                                            assigned: name =>
                                                                "Taken by " +
                                                                name.split(
                                                                    " ",
                                                                )[0],
                                                            thisWaiter:
                                                                waiterName ||
                                                                waiter?.name ||
                                                                "Waiter",
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {tables.length === 0 && !floorLoading ? (
                                    <p className="text-[13px] text-slate-gray py-4 text-center">
                                        No tables configured yet. Create them
                                        under Floor Configuration.
                                    </p>
                                ) : null}

                                {/* Legend */}
                                <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-slate-gray">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-sm border border-hairline bg-card" />
                                        Free
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-sm bg-indigo-500" />
                                        Taken (Other Waiter)
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-sm bg-emerald-500" />
                                        Mine
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
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
                        className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold cursor-pointer"
                        disabled={isSaving}
                        onClick={() => void handleSave()}
                    >
                        {isSaving ? "Saving…" : "Save for this shift"}
                    </Button>
                </div>
            </aside>
        </div>
    );
}
