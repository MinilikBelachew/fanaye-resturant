"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    Check,
    Lock,
    Phone,
    Shield,
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
    ROLE_LABELS,
    stationIdForRole,
    type Role,
    type StationRole,
} from "@/domains/identity/domain/role";
import type { Staff } from "@/domains/identity/domain/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ALL_ROLES: { id: Role; label: string; description: string; isStation?: boolean }[] = [
    { id: "waiter", label: "Waiter / Server", description: "Takes table orders, manages table guests, handles bill requests" },
    { id: "manager", label: "Floor Manager", description: "Live floor oversight, table assignment, financial reports, audit" },
    { id: "cashier", label: "Cashier", description: "Settles checks, confirms cash/Telebirr/CBE payments, prints receipts" },
    { id: "kitchen", label: "Kitchen Station", description: "Food prep queue, burger, pasta, pizza hot tickets", isStation: true },
    { id: "barista", label: "Barista Station", description: "Espresso, macchiato, hot tea, specialty coffee bar", isStation: true },
    { id: "cakes", label: "Cakes & Pastry", description: "Desserts, croissants, tiramisu pastry queue", isStation: true },
    { id: "soft_drinks", label: "Beverages / Soft Drinks", description: "Fresh juices, bottled sodas, water station", isStation: true },
    { id: "owner", label: "Owner / Administrator", description: "Full restaurant administrative privileges" },
];

const FLOOR_TABLES = Array.from({ length: 16 }, (_, i) => ({
    id: `table-${i + 1}`,
    number: String(i + 1),
}));

export default function AddEditStaffSheet() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(state => state.identity.isAddEditOpen);
    const editingStaff = useAppSelector(state => state.identity.editingStaff);

    const isEditMode = Boolean(editingStaff && editingStaff.name);

    // Form state
    const [name, setName] = useState("");
    const [role, setRole] = useState<Role>("waiter");
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("1234");
    const [email, setEmail] = useState("");
    const [active, setActive] = useState(true);
    const [shiftStatus, setShiftStatus] = useState<"on_duty" | "on_break" | "off_duty">("on_duty");
    const [shiftSchedule, setShiftSchedule] = useState<"morning" | "evening" | "full_day" | "custom">("morning");
    const [shiftHours, setShiftHours] = useState("07:00 AM – 03:00 PM");
    const [workingDays, setWorkingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    const [assignedTableIds, setAssignedTableIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editingStaff) {
            setName(editingStaff.name || "");
            setRole(editingStaff.role || "waiter");
            setPhone(editingStaff.phone || "");
            setPin(editingStaff.pinHint || "1234");
            setEmail(editingStaff.email || "");
            setActive(editingStaff.active !== false);
            setShiftStatus(editingStaff.shiftStatus || "on_duty");
            setShiftSchedule(editingStaff.shiftSchedule || "morning");
            setShiftHours(editingStaff.shiftHours || "07:00 AM – 03:00 PM");
            setWorkingDays(editingStaff.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
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
            setShiftSchedule("morning");
            setShiftHours("07:00 AM – 03:00 PM");
            setWorkingDays(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
            setAssignedTableIds([]);
            setError(null);
        }
    }, [editingStaff, isOpen]);

    if (!isOpen) return null;

    function handleToggleTable(tableId: string) {
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

    function handleSelectScheduleType(type: "morning" | "evening" | "full_day" | "custom") {
        setShiftSchedule(type);
        if (type === "morning") setShiftHours("07:00 AM – 03:00 PM");
        else if (type === "evening") setShiftHours("03:00 PM – 11:00 PM");
        else if (type === "full_day") setShiftHours("08:00 AM – 08:00 PM");
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError("Staff full name is required.");
            return;
        }

        const isStation = ["kitchen", "barista", "cakes", "soft_drinks"].includes(role);
        const stationRole = isStation ? (role as StationRole) : undefined;
        const stationId = stationRole ? stationIdForRole(stationRole) : undefined;

        const staffPayload: Staff = {
            id: editingStaff?.id || `staff-${Date.now().toString(36)}`,
            name: name.trim(),
            role,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            pinHint: pin.trim() || "1234",
            active,
            shiftStatus,
            shiftSchedule,
            shiftHours,
            workingDays,
            stationRole,
            stationId,
            assignedTableIds: role === "waiter" ? assignedTableIds : undefined,
            joinedDate: editingStaff?.joinedDate || new Date().toISOString().split("T")[0],
        };

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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200">
            <div
                className="fixed inset-0"
                onClick={() => dispatch(closeAddEditStaff())}
            />

            <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-card border-l border-hairline overflow-hidden">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                {isEditMode ? "Edit Staff Member" : "Register New Staff"}
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
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="staff-form"
                    onSubmit={handleSave}
                    className="app-scroll flex-1 space-y-6 overflow-y-auto p-6 text-[14px]"
                >
                    {error && (
                        <div className="flex items-center gap-2.5 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-400">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 1. Full Name & Role */}
                    <div className="space-y-4">
                        <h3 className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                            Personal & Role Details
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">
                                Full Name <span className="text-primary">*</span>
                            </label>
                            <Input
                                placeholder="e.g. Karim Tesfaye"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="h-10 rounded-[10px] text-[14px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-foreground">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 size-4 text-slate-gray" />
                                    <Input
                                        placeholder="+251 91 234 5678"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="h-10 pl-9 rounded-[10px] text-[14px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-foreground">
                                    Quick Access PIN
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 size-4 text-slate-gray" />
                                    <Input
                                        type="password"
                                        maxLength={6}
                                        placeholder="4-digit PIN"
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        className="h-10 pl-9 rounded-[10px] text-[14px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Role Picker */}
                        <div className="space-y-2 pt-2">
                            <label className="text-[13px] font-medium text-foreground">
                                Restaurant Role <span className="text-primary">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {ALL_ROLES.map(r => {
                                    const selected = role === r.id;
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setRole(r.id)}
                                            className={cn(
                                                "flex flex-col items-start rounded-[12px] border p-3 text-left transition-all",
                                                selected
                                                    ? "border-primary bg-primary/5 dark:bg-primary/10 text-foreground"
                                                    : "border-hairline bg-surface-ivory/50 hover:bg-secondary text-slate-gray",
                                            )}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-[13px] font-semibold text-foreground">
                                                    {r.label}
                                                </span>
                                                {selected && (
                                                    <span className="size-2 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <span className="mt-1 text-[11px] leading-tight text-slate-gray">
                                                {r.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 2. Waiter Assigned Tables (if Waiter) */}
                    {role === "waiter" && (
                        <div className="space-y-3 rounded-[16px] border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UtensilsCrossed className="size-4 text-primary" />
                                    <h4 className="text-[13px] font-semibold text-foreground">
                                        Assigned Dining Tables
                                    </h4>
                                </div>
                                <span className="text-[12px] font-medium text-primary">
                                    {assignedTableIds.length} tables selected
                                </span>
                            </div>
                            <p className="text-[12px] text-slate-gray">
                                Select which tables on the floor this server is assigned to handle.
                            </p>

                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                                {FLOOR_TABLES.map(table => {
                                    const isAssigned = assignedTableIds.includes(table.id);
                                    return (
                                        <button
                                            key={table.id}
                                            type="button"
                                            onClick={() => handleToggleTable(table.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-[10px] border py-2 text-[12px] font-semibold transition-all",
                                                isAssigned
                                                    ? "border-primary bg-primary text-primary-foreground shadow-xs scale-105"
                                                    : "border-hairline bg-white hover:bg-secondary text-foreground dark:bg-card",
                                            )}
                                        >
                                            <span>T-{table.number}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAssignedTableIds(
                                            FLOOR_TABLES.slice(0, 8).map(t => t.id),
                                        )
                                    }
                                    className="text-[11px] font-medium text-primary hover:underline"
                                >
                                    Select Zone A (T1-T8)
                                </button>
                                <span className="text-slate-gray">·</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAssignedTableIds(
                                            FLOOR_TABLES.slice(8, 16).map(t => t.id),
                                        )
                                    }
                                    className="text-[11px] font-medium text-primary hover:underline"
                                >
                                    Select Zone B (T9-T16)
                                </button>
                                <span className="text-slate-gray">·</span>
                                <button
                                    type="button"
                                    onClick={() => setAssignedTableIds([])}
                                    className="text-[11px] font-medium text-slate-gray hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. Shift Schedule & Duty Status */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                            Shift Schedule & Duty Status
                        </h3>

                        {/* Shift Schedule Type */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-medium text-foreground">
                                Assigned Work Shift
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: "morning", label: "Morning", hours: "07:00 AM – 03:00 PM", icon: "🌅" },
                                    { id: "evening", label: "Evening", hours: "03:00 PM – 11:00 PM", icon: "🌙" },
                                    { id: "full_day", label: "Full Day", hours: "08:00 AM – 08:00 PM", icon: "⚡" },
                                    { id: "custom", label: "Custom", hours: "Custom hours", icon: "⏱" },
                                ].map(s => {
                                    const selected = shiftSchedule === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => handleSelectScheduleType(s.id as any)}
                                            className={cn(
                                                "flex flex-col items-start rounded-[12px] border p-2.5 text-left transition-all",
                                                selected
                                                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40 dark:bg-primary/10"
                                                    : "border-hairline bg-surface-ivory/50 hover:bg-secondary text-slate-gray",
                                            )}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-[13px] font-semibold text-foreground">
                                                    {s.icon} {s.label}
                                                </span>
                                                {selected && <span className="size-1.5 rounded-full bg-primary" />}
                                            </div>
                                            <span className="mt-1 text-[11px] text-slate-gray leading-tight">
                                                {s.hours}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Shift Hours Input */}
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">
                                Shift Working Hours
                            </label>
                            <Input
                                placeholder="e.g. 07:00 AM – 03:00 PM"
                                value={shiftHours}
                                onChange={e => setShiftHours(e.target.value)}
                                className="h-10 rounded-[10px] text-[14px]"
                            />
                        </div>

                        {/* Working Days */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-medium text-foreground">
                                Scheduled Working Days
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                                    const isSelected = workingDays.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleToggleDay(day)}
                                            className={cn(
                                                "rounded-full border px-3 py-1 text-[12px] font-medium transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                                                    : "border-hairline bg-surface-ivory text-slate-gray hover:bg-secondary",
                                            )}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Immediate Floor Duty Status */}
                        <div className="space-y-2 pt-1">
                            <label className="text-[13px] font-medium text-foreground">
                                Current Shift Duty State
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(
                                    [
                                        { id: "on_duty", label: "On Duty", color: "bg-emerald-500" },
                                        { id: "on_break", label: "On Break", color: "bg-amber-500" },
                                        { id: "off_duty", label: "Off Duty", color: "bg-zinc-400" },
                                    ] as const
                                ).map(st => {
                                    const selected = shiftStatus === st.id;
                                    return (
                                        <button
                                            key={st.id}
                                            type="button"
                                            onClick={() => setShiftStatus(st.id)}
                                            className={cn(
                                                "flex items-center justify-center gap-2 rounded-[12px] border py-2.5 text-[13px] font-medium transition-all",
                                                selected
                                                    ? "border-foreground bg-secondary font-semibold text-foreground"
                                                    : "border-hairline bg-surface-ivory/50 text-slate-gray hover:bg-secondary",
                                            )}
                                        >
                                            <span className={cn("size-2 rounded-full", st.color)} />
                                            <span>{st.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-[14px] border border-hairline bg-surface-ivory/40 p-4">
                            <div>
                                <p className="text-[14px] font-medium text-foreground">
                                    Account Active Status
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    Deactivated staff cannot sign in or receive order assignments.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActive(v => !v)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                    active ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700",
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                        active ? "translate-x-5" : "translate-x-0",
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-white p-4 dark:bg-card">
                    {isEditMode ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                            <Trash2 className="size-4" />
                            <span>Remove</span>
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
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold px-5"
                        >
                            {isEditMode ? "Save Changes" : "Register Staff"}
                        </Button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
