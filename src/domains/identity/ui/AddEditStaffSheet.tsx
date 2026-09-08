"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Clock3,
    Lock,
    MapPin,
    Phone,
    Trash2,
    User,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    addStaff,
    closeAddEditStaff,
    deleteStaff,
    updateStaff,
} from "@/context/slices/identitySlice";
import {
    useAdminStaffQuery,
    useAdminShiftFloorQuery,
    useSetWaiterTableCoverageMutation,
} from "@/context/services/staffApi";
import {
    stationIdForRole,
    type Role,
    type StationRole,
} from "@/domains/identity/domain/role";
import type { Staff } from "@/domains/identity/domain/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ALL_ROLES: {
    id: Role;
    label: string;
    description: string;
    isStation?: boolean;
}[] = [
    {
        id: "waiter",
        label: "Waiter / Server",
        description:
            "Takes table orders, manages table guests, handles bill requests",
    },
    {
        id: "manager",
        label: "Floor Manager",
        description:
            "Live floor oversight, table assignment, financial reports, audit",
    },
    {
        id: "cashier",
        label: "Cashier",
        description:
            "Settles checks, confirms cash/Telebirr/CBE payments, prints receipts",
    },
    {
        id: "kitchen",
        label: "Kitchen Station",
        description: "Food prep queue, burger, pasta, pizza hot tickets",
        isStation: true,
    },
    {
        id: "barista",
        label: "Barista Station",
        description: "Espresso, macchiato, hot tea, specialty coffee bar",
        isStation: true,
    },
    {
        id: "cakes",
        label: "Cakes & Pastry",
        description: "Desserts, croissants, tiramisu pastry queue",
        isStation: true,
    },
    {
        id: "soft_drinks",
        label: "Beverages / Soft Drinks",
        description: "Fresh juices, bottled sodas, water station",
        isStation: true,
    },
    {
        id: "owner",
        label: "Owner / Administrator",
        description: "Full restaurant administrative privileges",
    },
];

function isUuid(id: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
    );
}

export default function AddEditStaffSheet() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(state => state.identity.isAddEditOpen);
    const editingStaff = useAppSelector(state => state.identity.editingStaff);
    const isEditMode = Boolean(editingStaff && editingStaff.name);

    const { data: staffData } = useAdminStaffQuery(undefined, { skip: !isOpen });
    const shifts = staffData?.shifts ?? [];

    const [name, setName] = useState("");
    const [role, setRole] = useState<Role>("waiter");
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("1234");
    const [email, setEmail] = useState("");
    const [active, setActive] = useState(true);
    const [shiftStatus, setShiftStatus] = useState<
        "on_duty" | "on_break" | "off_duty"
    >("on_duty");
    const [workingDays, setWorkingDays] = useState<string[]>([
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
    ]);
    const [shiftDefinitionId, setShiftDefinitionId] = useState("");
    const [assignedTableIds, setAssignedTableIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [savingCoverage, setSavingCoverage] = useState(false);

    const [setCoverage] = useSetWaiterTableCoverageMutation();

    const {
        data: shiftFloor,
        isFetching: floorLoading,
        isError: floorError,
    } = useAdminShiftFloorQuery(shiftDefinitionId, {
        skip: !isOpen || role !== "waiter" || !shiftDefinitionId,
        pollingInterval: isOpen && role === "waiter" && shiftDefinitionId ? 8000 : 0,
    });

    const editingMembershipId =
        editingStaff && isUuid(editingStaff.id) ? editingStaff.id : null;

    useEffect(() => {
        if (!isOpen) return;
        if (editingStaff) {
            setName(editingStaff.name || "");
            setRole(editingStaff.role || "waiter");
            setPhone(editingStaff.phone || "");
            setPin(editingStaff.pinHint || "1234");
            setEmail(editingStaff.email || "");
            setActive(editingStaff.active !== false);
            setShiftStatus(editingStaff.shiftStatus || "on_duty");
            setWorkingDays(
                editingStaff.workingDays || [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                ],
            );
            setAssignedTableIds(editingStaff.assignedTableIds || []);
            setError(null);
        } else {
            setName("");
            setRole("waiter");
            setPhone("");
            setPin("1234");
            setEmail("");
            setActive(true);
            setShiftStatus("on_duty");
            setWorkingDays(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
            setAssignedTableIds([]);
            setError(null);
        }
    }, [editingStaff, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        if (!shiftDefinitionId && shifts[0]?.id) {
            setShiftDefinitionId(shifts[0].id);
        }
    }, [isOpen, shifts, shiftDefinitionId]);

    useEffect(() => {
        if (!isOpen || !shiftDefinitionId || !editingMembershipId || !staffData) {
            return;
        }
        const member = staffData.data.find(row => row.id === editingMembershipId);
        const coverage = member?.shiftCoverages.find(
            row => row.shiftDefinitionId === shiftDefinitionId,
        );
        setAssignedTableIds(coverage?.tables.map(table => table.tableId) ?? []);
    }, [isOpen, shiftDefinitionId, editingMembershipId, staffData]);

    const selectedShift = useMemo(
        () => shifts.find(shift => shift.id === shiftDefinitionId) ?? null,
        [shifts, shiftDefinitionId],
    );

    const assignmentStats = useMemo(() => {
        const tables = shiftFloor?.locations.flatMap(loc => loc.tables) ?? [];
        const assigned = tables.filter(table => table.assignedWaiterMembershipId);
        const free = tables.length - assigned.length;
        const mine = assigned.filter(
            table =>
                editingMembershipId &&
                table.assignedWaiterMembershipId === editingMembershipId,
        ).length;
        return {
            total: tables.length,
            assigned: assigned.length,
            free,
            mine,
        };
    }, [shiftFloor, editingMembershipId]);

    if (!isOpen) return null;

    function handleToggleTable(
        tableId: string,
        ownerId: string | null,
        ownerName: string | null,
    ) {
        const ownedByOther =
            ownerId &&
            ownerId !== editingMembershipId &&
            !assignedTableIds.includes(tableId);
        if (ownedByOther) {
            const ok = confirm(
                `${ownerName || "Another waiter"} already covers this table on this shift. Take it for ${name.trim() || "this waiter"}?`,
            );
            if (!ok) return;
        }
        setAssignedTableIds(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId],
        );
    }

    function handleToggleDay(day: string) {
        setWorkingDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day],
        );
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError("Staff full name is required.");
            return;
        }
        if (role === "waiter" && !shiftDefinitionId) {
            setError("Select a shift to assign floor tables.");
            return;
        }

        const isStation = ["kitchen", "barista", "cakes", "soft_drinks"].includes(
            role,
        );
        const stationRole = isStation ? (role as StationRole) : undefined;
        const stationId = stationRole ? stationIdForRole(stationRole) : undefined;
        const selected = selectedShift;
        const staffPayload: Staff = {
            id: editingStaff?.id || `staff-${Date.now().toString(36)}`,
            name: name.trim(),
            role,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            pinHint: pin.trim() || "1234",
            active,
            shiftStatus,
            shiftSchedule: "custom",
            shiftHours: selected
                ? `${selected.startLocalTime} – ${selected.endLocalTime}`
                : undefined,
            workingDays,
            stationRole,
            stationId,
            assignedTableIds: role === "waiter" ? assignedTableIds : undefined,
            joinedDate:
                editingStaff?.joinedDate ||
                new Date().toISOString().split("T")[0],
        };

        if (isEditMode && editingMembershipId && role === "waiter") {
            setSavingCoverage(true);
            try {
                await setCoverage({
                    membershipId: editingMembershipId,
                    shiftDefinitionId,
                    tableIds: assignedTableIds,
                }).unwrap();
            } catch {
                setError("Could not save table coverage for this shift.");
                setSavingCoverage(false);
                return;
            }
            setSavingCoverage(false);
        }

        if (isEditMode) {
            dispatch(updateStaff(staffPayload));
        } else {
            dispatch(addStaff(staffPayload));
        }
    }

    function handleDelete() {
        if (!editingStaff) return;
        if (confirm(`Are you sure you want to remove ${editingStaff.name}?`)) {
            dispatch(deleteStaff(editingStaff.id));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
            <div
                className="fixed inset-0"
                onClick={() => dispatch(closeAddEditStaff())}
            />

            <aside className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-hairline bg-white shadow-2xl dark:bg-card">
                <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                {isEditMode
                                    ? "Edit Staff Member"
                                    : "Register New Staff"}
                            </h2>
                            <p className="text-[13px] text-slate-gray">
                                {isEditMode
                                    ? `Update details for ${editingStaff?.name}`
                                    : "Register a server, station cook, or manager"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => dispatch(closeAddEditStaff())}
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form
                    id="staff-form"
                    onSubmit={event => void handleSave(event)}
                    className="app-scroll flex-1 space-y-6 overflow-y-auto p-6 text-[14px]"
                >
                    {error ? (
                        <div className="flex items-center gap-2.5 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : null}

                    <div className="space-y-4">
                        <h3 className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                            Personal & Role Details
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium">
                                Full Name <span className="text-primary">*</span>
                            </label>
                            <Input
                                placeholder="e.g. Karim Tesfaye"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="h-10 rounded-[10px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                                    <Input
                                        placeholder="+251 91 234 5678"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="h-10 rounded-[10px] pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium">
                                    Quick Access PIN
                                </label>
                                <div className="relative">
                                    <Lock className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                                    <Input
                                        type="password"
                                        maxLength={6}
                                        placeholder="4-digit PIN"
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        className="h-10 rounded-[10px] pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-[13px] font-medium">
                                Restaurant Role{" "}
                                <span className="text-primary">*</span>
                            </label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {ALL_ROLES.map(entry => {
                                    const selected = role === entry.id;
                                    return (
                                        <button
                                            key={entry.id}
                                            type="button"
                                            onClick={() => setRole(entry.id)}
                                            className={cn(
                                                "flex flex-col items-start rounded-[12px] border p-3 text-left transition-all",
                                                selected
                                                    ? "border-primary bg-primary/5 text-foreground"
                                                    : "border-hairline bg-surface-ivory/50 text-slate-gray hover:bg-secondary",
                                            )}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-[13px] font-semibold text-foreground">
                                                    {entry.label}
                                                </span>
                                                {selected ? (
                                                    <span className="size-2 rounded-full bg-primary" />
                                                ) : null}
                                            </div>
                                            <span className="mt-1 text-[11px] leading-tight text-slate-gray">
                                                {entry.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {role === "waiter" ? (
                        <div className="space-y-3 rounded-[16px] border border-primary/20 bg-primary/5 p-4">
                            <div className="flex items-center gap-2">
                                <UtensilsCrossed className="size-4 text-primary" />
                                <h4 className="text-[13px] font-semibold">
                                    Shift & floor coverage
                                </h4>
                            </div>
                            <p className="text-[12px] text-slate-gray">
                                Pick a shift to see the live floor: free tables,
                                and who already owns each table in that window.
                            </p>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium">
                                    Shift window
                                </label>
                                <select
                                    value={shiftDefinitionId}
                                    onChange={e =>
                                        setShiftDefinitionId(e.target.value)
                                    }
                                    className="h-10 w-full rounded-[10px] border border-input bg-card px-3 text-[13px]"
                                >
                                    {shifts.length === 0 ? (
                                        <option value="">
                                            No shifts yet — create one on Staff
                                            → Assign tables
                                        </option>
                                    ) : null}
                                    {shifts.map(shift => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.name} · {shift.startLocalTime}
                                            –{shift.endLocalTime}
                                        </option>
                                    ))}
                                </select>
                                {selectedShift ? (
                                    <p className="flex items-center gap-1.5 text-[12px] text-slate-gray">
                                        <Clock3 className="size-3.5" />
                                        Showing floor for {selectedShift.name} (
                                        {selectedShift.startLocalTime}–
                                        {selectedShift.endLocalTime})
                                    </p>
                                ) : null}
                            </div>

                            {shiftDefinitionId ? (
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                    <span className="rounded-full border border-hairline bg-card px-2.5 py-1">
                                        {assignmentStats.total} tables
                                    </span>
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">
                                        {assignmentStats.free} free
                                    </span>
                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                                        {assignmentStats.assigned} assigned
                                    </span>
                                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
                                        {assignedTableIds.length} selected for
                                        this waiter
                                    </span>
                                </div>
                            ) : null}

                            {floorLoading ? (
                                <p className="text-[12px] text-slate-gray">
                                    Loading floor for this shift…
                                </p>
                            ) : null}
                            {floorError ? (
                                <p className="text-[12px] text-destructive">
                                    Could not load shift floor. Check the API.
                                </p>
                            ) : null}

                            {shiftFloor ? (
                                <div className="space-y-3">
                                    {shiftFloor.locations.map(location => (
                                        <div key={location.id}>
                                            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-gray uppercase">
                                                <MapPin className="size-3.5" />
                                                {location.name}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                {location.tables.map(table => {
                                                    const selected =
                                                        assignedTableIds.includes(
                                                            table.tableId,
                                                        );
                                                    const ownerId =
                                                        table.assignedWaiterMembershipId;
                                                    const ownerName =
                                                        table.assignedWaiterName;
                                                    const ownedByOther =
                                                        Boolean(
                                                            ownerId &&
                                                                ownerId !==
                                                                    editingMembershipId &&
                                                                !selected,
                                                        );
                                                    const ownedBySelf =
                                                        Boolean(
                                                            ownerId &&
                                                                editingMembershipId &&
                                                                ownerId ===
                                                                    editingMembershipId,
                                                        );

                                                    return (
                                                        <button
                                                            key={table.tableId}
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleTable(
                                                                    table.tableId,
                                                                    ownerId,
                                                                    ownerName,
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded-[12px] border px-2.5 py-2 text-left transition-all",
                                                                selected
                                                                    ? "border-primary bg-primary text-primary-foreground"
                                                                    : ownedByOther
                                                                      ? "border-amber-300 bg-amber-50"
                                                                      : "border-hairline bg-card hover:bg-secondary/60",
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between gap-1">
                                                                <span className="text-[13px] font-semibold">
                                                                    {table.displayNumber
                                                                        ? `T-${table.displayNumber}`
                                                                        : table.displayName}
                                                                </span>
                                                                {selected ? (
                                                                    <span className="text-[10px] opacity-90">
                                                                        Mine
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <span
                                                                className={cn(
                                                                    "mt-1 block truncate text-[11px]",
                                                                    selected
                                                                        ? "text-primary-foreground/85"
                                                                        : ownedByOther
                                                                          ? "text-amber-800"
                                                                          : ownedBySelf
                                                                            ? "text-primary"
                                                                            : "text-slate-gray",
                                                                )}
                                                            >
                                                                {selected
                                                                    ? name.trim() ||
                                                                      "This waiter"
                                                                    : ownerName
                                                                      ? `Assigned · ${ownerName}`
                                                                      : "Free"}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-gray">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-2.5 rounded-sm border border-hairline bg-card" />
                                            Free
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-2.5 rounded-sm bg-amber-200" />
                                            Taken by another waiter
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="size-2.5 rounded-sm bg-primary" />
                                            Selected for this waiter
                                        </span>
                                    </div>
                                    {!editingMembershipId ? (
                                        <p className="text-[11px] text-slate-gray">
                                            New staff registration still saves
                                            locally first. For live coverage on
                                            an existing waiter, use Edit / Assign
                                            by shift on the staff list.
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="space-y-4 pt-2">
                        <h3 className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                            Duty & account
                        </h3>

                        <div className="space-y-2">
                            <label className="text-[13px] font-medium">
                                Scheduled working days
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                    "Sun",
                                ].map(day => {
                                    const isSelected = workingDays.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleToggleDay(day)}
                                            className={cn(
                                                "rounded-full border px-3 py-1 text-[12px] font-medium",
                                                isSelected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-hairline bg-surface-ivory text-slate-gray",
                                            )}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-medium">
                                Current duty state
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(
                                    [
                                        {
                                            id: "on_duty",
                                            label: "On Duty",
                                            color: "bg-emerald-500",
                                        },
                                        {
                                            id: "on_break",
                                            label: "On Break",
                                            color: "bg-amber-500",
                                        },
                                        {
                                            id: "off_duty",
                                            label: "Off Duty",
                                            color: "bg-zinc-400",
                                        },
                                    ] as const
                                ).map(st => {
                                    const selected = shiftStatus === st.id;
                                    return (
                                        <button
                                            key={st.id}
                                            type="button"
                                            onClick={() => setShiftStatus(st.id)}
                                            className={cn(
                                                "flex items-center justify-center gap-2 rounded-[12px] border py-2.5 text-[13px] font-medium",
                                                selected
                                                    ? "border-foreground bg-secondary font-semibold"
                                                    : "border-hairline bg-surface-ivory/50 text-slate-gray",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "size-2 rounded-full",
                                                    st.color,
                                                )}
                                            />
                                            {st.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-[14px] border border-hairline bg-surface-ivory/40 p-4">
                            <div>
                                <p className="text-[14px] font-medium">
                                    Account active
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    Deactivated staff cannot sign in.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActive(v => !v)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
                                    active ? "bg-primary" : "bg-zinc-300",
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm transition",
                                        active
                                            ? "translate-x-5"
                                            : "translate-x-0",
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </form>

                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-white p-4 dark:bg-card">
                    {isEditMode ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-red-600"
                        >
                            <Trash2 className="size-4" />
                            Remove
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => dispatch(closeAddEditStaff())}
                            className="rounded-full text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="staff-form"
                            disabled={savingCoverage}
                            className="rounded-full px-5 text-[13px] font-semibold"
                        >
                            {savingCoverage
                                ? "Saving…"
                                : isEditMode
                                  ? "Save Changes"
                                  : "Register Staff"}
                        </Button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
