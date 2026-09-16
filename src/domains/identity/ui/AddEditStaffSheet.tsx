"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
    Clock3,
    Eye,
    EyeOff,
    Lock,
    MapPin,
    Phone,
    Plus,
    Trash2,
    User,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { closeAddEditStaff } from "@/context/slices/identitySlice";
import {
    useAdminStaffQuery,
    useAdminShiftFloorQuery,
    useCreateAdminStaffMutation,
    useCreateShiftDefinitionMutation,
    useSetWaiterTableCoverageMutation,
    useUpdateAdminStaffMutation,
} from "@/context/services/staffApi";
import { type Role } from "@/domains/identity/domain/role";
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
    staffFormDefaults,
    staffFormSchema,
    type StaffFormValues,
} from "@/lib/validators/staff";
import {
    shiftDefinitionSchema,
    type ShiftDefinitionFormValues,
} from "@/lib/validators/floor";
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

    const { data: staffData } = useAdminStaffQuery(undefined, {
        skip: !isOpen,
    });
    const shifts = staffData?.shifts ?? [];

    const [saving, setSaving] = useState(false);
    const [setCoverage] = useSetWaiterTableCoverageMutation();
    const [createStaff] = useCreateAdminStaffMutation();
    const [updateStaffApi] = useUpdateAdminStaffMutation();
    const [createShift, { isLoading: creatingShift }] =
        useCreateShiftDefinitionMutation();
    const [showNewShift, setShowNewShift] = useState(false);
    const [showPin, setShowPin] = useState(false);

    const shiftForm = useForm<ShiftDefinitionFormValues>({
        resolver: zodResolver(shiftDefinitionSchema),
        defaultValues: {
            name: "",
            startLocalTime: "07:00",
            endLocalTime: "15:00",
        },
    });

    async function onCreateShift(values: ShiftDefinitionFormValues) {
        try {
            const created = await createShift(values).unwrap();
            form.setValue("shiftDefinitionId", created.data.id, {
                shouldValidate: true,
                shouldDirty: true,
            });
            setShowNewShift(false);
            shiftForm.reset({
                name: "",
                startLocalTime: "07:00",
                endLocalTime: "15:00",
            });
            toast.success(
                "Shift created",
                `${created.data.name} (${created.data.startLocalTime}–${created.data.endLocalTime}).`,
            );
        } catch (err) {
            toast.fromUnknown(
                err,
                "Could not create shift. Use times like 07:00.",
            );
        }
    }

    const form = useForm<StaffFormValues>({
        resolver: zodResolver(staffFormSchema),
        defaultValues: staffFormDefaults,
        mode: "onSubmit",
    });

    const role = form.watch("role");
    const shiftDefinitionId = form.watch("shiftDefinitionId") || "";
    const assignedTableIds = form.watch("assignedTableIds");
    const nameValue = form.watch("name");

    const {
        data: shiftFloor,
        isFetching: floorLoading,
        isError: floorError,
    } = useAdminShiftFloorQuery(shiftDefinitionId, {
        skip: !isOpen || role !== "waiter" || !shiftDefinitionId,
        pollingInterval:
            isOpen && role === "waiter" && shiftDefinitionId ? 8000 : 0,
    });

    const editingMembershipId =
        editingStaff && isUuid(editingStaff.id) ? editingStaff.id : null;

    useEffect(() => {
        if (!isOpen) return;
        if (editingStaff) {
            form.reset({
                name: editingStaff.name || "",
                role: (editingStaff.role ||
                    "waiter") as StaffFormValues["role"],
                phone: editingStaff.phone || "",
                email: editingStaff.email || "",
                pin: editingStaff.pinHint || "1234",
                active: editingStaff.active !== false,
                shiftStatus: editingStaff.shiftStatus || "on_duty",
                workingDays: editingStaff.workingDays || [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                ],
                shiftDefinitionId: "",
                assignedTableIds: editingStaff.assignedTableIds || [],
            });
        } else {
            form.reset(staffFormDefaults);
        }
    }, [editingStaff, isOpen, form]);

    useEffect(() => {
        if (!isOpen) return;
        if (!form.getValues("shiftDefinitionId") && shifts[0]?.id) {
            form.setValue("shiftDefinitionId", shifts[0].id);
        }
    }, [isOpen, shifts, form]);

    useEffect(() => {
        if (
            !isOpen ||
            !shiftDefinitionId ||
            !editingMembershipId ||
            !staffData
        ) {
            return;
        }
        const member = staffData.data.find(
            row => row.id === editingMembershipId,
        );
        const coverage = member?.shiftCoverages.find(
            row => row.shiftDefinitionId === shiftDefinitionId,
        );
        form.setValue(
            "assignedTableIds",
            coverage?.tables.map(table => table.tableId) ?? [],
        );
    }, [isOpen, shiftDefinitionId, editingMembershipId, staffData, form]);

    const selectedShift = useMemo(
        () => shifts.find(shift => shift.id === shiftDefinitionId) ?? null,
        [shifts, shiftDefinitionId],
    );

    const assignmentStats = useMemo(() => {
        const tables = shiftFloor?.locations.flatMap(loc => loc.tables) ?? [];
        const assigned = tables.filter(
            table => table.assignedWaiterMembershipId,
        );
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
        const current = form.getValues("assignedTableIds");
        const ownedByOther =
            ownerId &&
            ownerId !== editingMembershipId &&
            !current.includes(tableId);
        if (ownedByOther) {
            const ok = confirm(
                `${ownerName || "Another waiter"} already covers this table on this shift. Take it for ${nameValue.trim() || "this waiter"}?`,
            );
            if (!ok) return;
        }
        form.setValue(
            "assignedTableIds",
            current.includes(tableId)
                ? current.filter(id => id !== tableId)
                : [...current, tableId],
            { shouldDirty: true },
        );
    }

    async function onSubmit(values: StaffFormValues) {
        const stationCode = [
            "kitchen",
            "barista",
            "cakes",
            "soft_drinks",
        ].includes(values.role)
            ? values.role === "soft_drinks"
                ? "SOFT_DRINKS"
                : values.role.toUpperCase()
            : undefined;

        setSaving(true);
        try {
            if (isEditMode && editingMembershipId) {
                await updateStaffApi({
                    membershipId: editingMembershipId,
                    body: {
                        name: values.name.trim(),
                        role: values.role,
                        phone: values.phone?.trim() || undefined,
                        email: values.email?.trim() || undefined,
                        pin: values.pin.trim() || undefined,
                        active: values.active,
                        stationCode,
                    },
                }).unwrap();

                if (values.role === "waiter" && values.shiftDefinitionId) {
                    await setCoverage({
                        membershipId: editingMembershipId,
                        shiftDefinitionId: values.shiftDefinitionId,
                        tableIds: values.assignedTableIds,
                    }).unwrap();
                }
                toast.success("Staff updated", values.name.trim());
                dispatch(closeAddEditStaff());
            } else {
                await createStaff({
                    name: values.name.trim(),
                    role: values.role,
                    phone: values.phone?.trim() || undefined,
                    email: values.email?.trim() || undefined,
                    pin: values.pin.trim() || "1234",
                    active: values.active,
                    stationCode,
                    shiftDefinitionId:
                        values.role === "waiter"
                            ? values.shiftDefinitionId || undefined
                            : undefined,
                    tableIds:
                        values.role === "waiter"
                            ? values.assignedTableIds
                            : undefined,
                }).unwrap();
                toast.success("Staff registered", values.name.trim());
                dispatch(closeAddEditStaff());
            }
        } catch (err) {
            toast.fromUnknown(
                err,
                isEditMode
                    ? "Could not update staff."
                    : "Could not register staff on the server.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!editingStaff || !editingMembershipId) {
            toast.error("This staff record is not on the server yet.");
            return;
        }
        if (!confirm(`Are you sure you want to remove ${editingStaff.name}?`)) {
            return;
        }
        setSaving(true);
        try {
            await updateStaffApi({
                membershipId: editingMembershipId,
                body: { active: false },
            }).unwrap();
            toast.success("Staff deactivated", editingStaff.name);
            dispatch(closeAddEditStaff());
        } catch (err) {
            toast.fromUnknown(err, "Could not deactivate staff.");
        } finally {
            setSaving(false);
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

                <Form {...form}>
                    <form
                        id="staff-form"
                        onSubmit={form.handleSubmit(
                            values => void onSubmit(values),
                        )}
                        className="app-scroll flex-1 space-y-6 overflow-y-auto p-6 text-[14px]"
                    >
                        <div className="space-y-4">
                            <h3 className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                                Personal & Role Details
                            </h3>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Full Name{" "}
                                            <span className="text-primary">
                                                *
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Karim Tesfaye"
                                                className="h-10 rounded-[10px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <div className="relative">
                                                <Phone className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                                                <FormControl>
                                                    <Input
                                                        placeholder="+251 91 234 5678"
                                                        className="h-10 rounded-[10px] pl-9"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Quick Access PIN{" "}
                                                <span className="text-primary">
                                                    *
                                                </span>
                                            </FormLabel>
                                            <div className="relative">
                                                <Lock className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                                                <FormControl>
                                                    <Input
                                                        type={
                                                            showPin
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={6}
                                                        placeholder="4–6 digit numeric PIN"
                                                        className="h-10 rounded-[10px] pl-9 pr-10 font-mono tracking-wider"
                                                        {...field}
                                                        onChange={e => {
                                                            const val =
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    "",
                                                                );
                                                            field.onChange(val);
                                                        }}
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() =>
                                                        setShowPin(
                                                            prev => !prev,
                                                        )
                                                    }
                                                    className="absolute top-2.5 right-3 text-slate-gray hover:text-foreground transition-colors"
                                                    title={
                                                        showPin
                                                            ? "Hide PIN"
                                                            : "Show PIN"
                                                    }
                                                >
                                                    {showPin ? (
                                                        <EyeOff className="size-4" />
                                                    ) : (
                                                        <Eye className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="optional@fanaye.com"
                                                className="h-10 rounded-[10px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Restaurant Role{" "}
                                            <span className="text-primary">
                                                *
                                            </span>
                                        </FormLabel>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {ALL_ROLES.map(entry => {
                                                const selected =
                                                    field.value === entry.id;
                                                return (
                                                    <button
                                                        key={entry.id}
                                                        type="button"
                                                        onClick={() =>
                                                            field.onChange(
                                                                entry.id,
                                                            )
                                                        }
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                    Pick a shift to see the live floor: free
                                    tables, and who already owns each table in
                                    that window.
                                </p>

                                <FormField
                                    control={form.control}
                                    name="shiftDefinitionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>
                                                    Shift window
                                                </FormLabel>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowNewShift(v => !v)
                                                    }
                                                    className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                                                >
                                                    <Plus className="size-3.5" />
                                                    {showNewShift
                                                        ? "Close"
                                                        : "New shift"}
                                                </button>
                                            </div>
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
                                                    {shifts.length === 0 ? (
                                                        <option value="">
                                                            No shifts yet —
                                                            click &ldquo;+ New
                                                            shift&rdquo; above
                                                        </option>
                                                    ) : (
                                                        <option value="">
                                                            Select a shift
                                                            window
                                                        </option>
                                                    )}
                                                    {shifts.map(shift => (
                                                        <option
                                                            key={shift.id}
                                                            value={shift.id}
                                                        >
                                                            {shift.name} ·{" "}
                                                            {
                                                                shift.startLocalTime
                                                            }
                                                            –
                                                            {shift.endLocalTime}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                            {selectedShift ? (
                                                <p className="flex items-center gap-1.5 text-[12px] text-slate-gray">
                                                    <Clock3 className="size-3.5" />
                                                    Showing floor for{" "}
                                                    {selectedShift.name} (
                                                    {
                                                        selectedShift.startLocalTime
                                                    }
                                                    –
                                                    {selectedShift.endLocalTime}
                                                    )
                                                </p>
                                            ) : null}
                                        </FormItem>
                                    )}
                                />

                                {showNewShift ? (
                                    <div className="space-y-2.5 rounded-[12px] border border-dashed border-primary/40 bg-surface-ivory p-3.5 dark:bg-card">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[12px] font-semibold text-foreground">
                                                Create shift with custom times
                                            </p>
                                            <span className="text-[11px] text-slate-gray">
                                                Adds to restaurant shifts
                                            </span>
                                        </div>
                                        <div>
                                            <label className="sr-only">
                                                Shift name
                                            </label>
                                            <Input
                                                placeholder="e.g. Morning, Evening, Night"
                                                className="h-9 text-[13px] bg-white dark:bg-card"
                                                value={shiftForm.watch("name")}
                                                onChange={e =>
                                                    shiftForm.setValue(
                                                        "name",
                                                        e.target.value,
                                                        {
                                                            shouldValidate: true,
                                                        },
                                                    )
                                                }
                                            />
                                            {shiftForm.formState.errors.name ? (
                                                <p className="mt-1 text-[11px] text-red-500">
                                                    {
                                                        shiftForm.formState
                                                            .errors.name.message
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-gray">
                                                    Start time
                                                </label>
                                                <Input
                                                    type="time"
                                                    className="h-9 text-[13px] bg-white dark:bg-card"
                                                    value={shiftForm.watch(
                                                        "startLocalTime",
                                                    )}
                                                    onChange={e =>
                                                        shiftForm.setValue(
                                                            "startLocalTime",
                                                            e.target.value,
                                                            {
                                                                shouldValidate: true,
                                                            },
                                                        )
                                                    }
                                                />
                                                {shiftForm.formState.errors
                                                    .startLocalTime ? (
                                                    <p className="mt-1 text-[11px] text-red-500">
                                                        {
                                                            shiftForm.formState
                                                                .errors
                                                                .startLocalTime
                                                                .message
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-gray">
                                                    End time
                                                </label>
                                                <Input
                                                    type="time"
                                                    className="h-9 text-[13px] bg-white dark:bg-card"
                                                    value={shiftForm.watch(
                                                        "endLocalTime",
                                                    )}
                                                    onChange={e =>
                                                        shiftForm.setValue(
                                                            "endLocalTime",
                                                            e.target.value,
                                                            {
                                                                shouldValidate: true,
                                                            },
                                                        )
                                                    }
                                                />
                                                {shiftForm.formState.errors
                                                    .endLocalTime ? (
                                                    <p className="mt-1 text-[11px] text-red-500">
                                                        {
                                                            shiftForm.formState
                                                                .errors
                                                                .endLocalTime
                                                                .message
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
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
                                                type="button"
                                                size="sm"
                                                className="h-8 text-[12px]"
                                                disabled={creatingShift}
                                                onClick={shiftForm.handleSubmit(
                                                    values =>
                                                        void onCreateShift(
                                                            values,
                                                        ),
                                                )}
                                            >
                                                {creatingShift
                                                    ? "Saving…"
                                                    : "Save shift"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}

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
                                            {assignedTableIds.length} selected
                                            for this waiter
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
                                        Could not load shift floor. Check the
                                        API.
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
                                                    {location.tables.map(
                                                        table => {
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
                                                                    key={
                                                                        table.tableId
                                                                    }
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
                                                                            ? nameValue.trim() ||
                                                                              "This waiter"
                                                                            : ownerName
                                                                              ? `Assigned · ${ownerName}`
                                                                              : "Free"}
                                                                    </span>
                                                                </button>
                                                            );
                                                        },
                                                    )}
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
                                                New staff registration still
                                                saves locally first. For live
                                                coverage on an existing waiter,
                                                use Edit / Assign by shift on
                                                the staff list.
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

                            <FormField
                                control={form.control}
                                name="workingDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Scheduled working days
                                        </FormLabel>
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
                                                const isSelected =
                                                    field.value.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() =>
                                                            field.onChange(
                                                                isSelected
                                                                    ? field.value.filter(
                                                                          d =>
                                                                              d !==
                                                                              day,
                                                                      )
                                                                    : [
                                                                          ...field.value,
                                                                          day,
                                                                      ],
                                                            )
                                                        }
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shiftStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Current duty state
                                        </FormLabel>
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
                                                const selected =
                                                    field.value === st.id;
                                                return (
                                                    <button
                                                        key={st.id}
                                                        type="button"
                                                        onClick={() =>
                                                            field.onChange(
                                                                st.id,
                                                            )
                                                        }
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Controller
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <div className="flex items-center justify-between rounded-[14px] border border-hairline bg-surface-ivory/40 p-4">
                                        <div>
                                            <p className="text-[14px] font-medium">
                                                Account active
                                            </p>
                                            <p className="text-[12px] text-slate-gray">
                                                Deactivated staff cannot sign
                                                in.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                field.onChange(!field.value)
                                            }
                                            className={cn(
                                                "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
                                                field.value
                                                    ? "bg-primary"
                                                    : "bg-zinc-300",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm transition",
                                                    field.value
                                                        ? "translate-x-5"
                                                        : "translate-x-0",
                                                )}
                                            />
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    </form>
                </Form>

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
                            disabled={saving || form.formState.isSubmitting}
                            className="rounded-full px-5 text-[13px] font-semibold"
                        >
                            {saving
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
