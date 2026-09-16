"use client";

import { useMemo, useState } from "react";
import {
    CookingPot,
    Edit3,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    MoreVertical,
    Plus,
    Search,
    Shield,
    UserCheck,
    UserPlus,
    Users,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useAppDispatch } from "@/context/hooks";
import { openAddStaff, openEditStaff } from "@/context/slices/identitySlice";
import {
    useAdminStaffQuery,
    useResetAdminStaffPasswordMutation,
    useResetAdminStaffPinMutation,
} from "@/context/services/staffApi";
import type { AdminStaffMember } from "@/domains/identity/domain/staffApi";
import type { Staff } from "@/domains/identity/domain/staff";
import type { Role } from "@/domains/identity/domain/role";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddEditStaffSheet from "@/domains/identity/ui/AddEditStaffSheet";
import AssignTablesSheet from "@/domains/identity/ui/AssignTablesSheet";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const AVATAR_SOLID_PALETTES = [
    "bg-emerald-600 text-white",
    "bg-blue-600 text-white",
    "bg-indigo-600 text-white",
    "bg-violet-600 text-white",
    "bg-teal-600 text-white",
    "bg-rose-600 text-white",
    "bg-cyan-700 text-white",
    "bg-amber-600 text-white",
    "bg-sky-600 text-white",
];

function getAvatarSolidColor(name: string): string {
    if (!name) return AVATAR_SOLID_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_SOLID_PALETTES.length;
    return AVATAR_SOLID_PALETTES[index];
}

type FilterTab = "all" | "waiters" | "stations" | "management";

function mapRoleCode(code: string): Role {
    switch (code) {
        case "OWNER_ADMIN":
            return "owner";
        case "MANAGER":
            return "manager";
        case "CASHIER":
            return "cashier";
        case "WAITER":
            return "waiter";
        case "STATION_OPERATOR":
            return "kitchen";
        default:
            return "waiter";
    }
}

function toLegacyStaff(member: AdminStaffMember): Staff {
    return {
        id: member.id,
        name: member.name,
        role: mapRoleCode(member.roleCode),
        pinHint: member.hasPin ? "••••" : "",
        phone: member.phone ?? undefined,
        email: member.email ?? undefined,
        active: member.active,
        assignedTableIds: member.shiftCoverages.flatMap(coverage =>
            coverage.tables.map(table => table.tableId),
        ),
    };
}

export default function ManagerStaffPage() {
    const dispatch = useAppDispatch();
    const { data, isLoading, isError, refetch } = useAdminStaffQuery();
    const liveStaff = data?.data ?? [];
    const shifts = data?.shifts ?? [];

    const [resetPin, { isLoading: resettingPin }] =
        useResetAdminStaffPinMutation();
    const [resetPassword, { isLoading: resettingPassword }] =
        useResetAdminStaffPasswordMutation();

    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [assignWaiterId, setAssignWaiterId] = useState<string | null>(null);
    const [assignWaiterName, setAssignWaiterName] = useState<string | null>(
        null,
    );

    // Modal state for PIN & Password resets
    const [pinTarget, setPinTarget] = useState<AdminStaffMember | null>(null);
    const [pinValue, setPinValue] = useState("");
    const [showPinValue, setShowPinValue] = useState(false);

    const [passwordTarget, setPasswordTarget] =
        useState<AdminStaffMember | null>(null);
    const [passwordValue, setPasswordValue] = useState("");
    const [showPasswordValue, setShowPasswordValue] = useState(false);

    const [menuOpenMemberId, setMenuOpenMemberId] = useState<string | null>(
        null,
    );

    const filteredStaff = useMemo(() => {
        return liveStaff.filter(member => {
            const role = mapRoleCode(member.roleCode);
            if (activeTab === "waiters" && role !== "waiter") return false;
            if (
                activeTab === "stations" &&
                member.roleCode !== "STATION_OPERATOR"
            ) {
                return false;
            }
            if (
                activeTab === "management" &&
                !["OWNER_ADMIN", "MANAGER", "CASHIER"].includes(member.roleCode)
            ) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const hay =
                    `${member.name} ${member.roleLabel} ${member.phone ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [liveStaff, activeTab, searchQuery]);

    const totalStaffCount = liveStaff.length;
    const waitersCount = liveStaff.filter(m => m.roleCode === "WAITER").length;
    const stationStaffCount = liveStaff.filter(
        m => m.roleCode === "STATION_OPERATOR",
    ).length;
    const allocatedTables = new Set(
        liveStaff.flatMap(member =>
            member.shiftCoverages.flatMap(coverage =>
                coverage.tables.map(table => table.tableId),
            ),
        ),
    ).size;

    function openAssign(member: AdminStaffMember) {
        setAssignWaiterId(member.id);
        setAssignWaiterName(member.name);
    }

    async function handleSavePin() {
        if (!pinTarget) return;
        if (!/^\d{4,6}$/.test(pinValue.trim())) {
            toast.error("PIN must be 4 to 6 numeric digits.");
            return;
        }

        try {
            await resetPin({
                membershipId: pinTarget.id,
                pin: pinValue.trim(),
            }).unwrap();

            toast.success("PIN updated successfully", pinTarget.name);
            setPinTarget(null);
            setPinValue("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not update staff PIN.";
            toast.error(message);
        }
    }

    async function handleSavePassword() {
        if (!passwordTarget) return;
        if (passwordValue.trim().length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        try {
            await resetPassword({
                membershipId: passwordTarget.id,
                password: passwordValue.trim(),
            }).unwrap();

            toast.success("Password updated", passwordTarget.name);
            setPasswordTarget(null);
            setPasswordValue("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                "Could not reset password.";
            toast.error(message);
        }
    }

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="House"
                    title="Staff & Waiters"
                    description="Assign dining tables per shift window. Manage staff credentials, PINs, and passwords."
                />
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStaff("waiter"))}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-[13px] font-semibold text-primary shadow-xs hover:bg-primary/15 transition-colors"
                    >
                        <UtensilsCrossed className="size-4" />
                        Register Waiter
                    </button>
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStaff(undefined))}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                    >
                        <UserPlus className="size-4" />
                        Register Staff
                    </button>
                </div>
            </div>

            {shifts.length > 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-slate-gray">
                        Shift windows (admin-defined)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {shifts.map(shift => (
                            <span
                                key={shift.id}
                                className="rounded-full border border-hairline bg-surface-ivory px-3 py-1 text-[12px] font-medium"
                            >
                                {shift.name} · {shift.startLocalTime}–
                                {shift.endLocalTime}
                            </span>
                        ))}
                    </div>
                    <p className="mt-2 text-[12px] text-slate-gray">
                        Create more shifts (any times) when assigning tables to
                        a waiter.
                    </p>
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Total Personnel
                        </p>
                        <Users className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold">
                        {totalStaffCount}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Floor Waiters
                        </p>
                        <UtensilsCrossed className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold">
                        {waitersCount}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {allocatedTables} tables covered across shifts
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Station Staff
                        </p>
                        <CookingPot className="size-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold">
                        {stationStaffCount}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Shifts
                        </p>
                        <UserCheck className="size-4 text-blue-500" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold">
                        {shifts.length}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Dynamic time windows
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-[14px] border border-hairline bg-surface-ivory/50 p-1">
                    {(
                        [
                            ["all", "All Staff", totalStaffCount],
                            ["waiters", "Waiters & Tables", waitersCount],
                            ["stations", "Stations", stationStaffCount],
                            [
                                "management",
                                "Management",
                                totalStaffCount -
                                    waitersCount -
                                    stationStaffCount,
                            ],
                        ] as const
                    ).map(([id, label, count]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "rounded-[10px] px-3.5 py-1.5 text-[13px] font-medium transition-all",
                                activeTab === id
                                    ? "bg-white font-semibold shadow-xs dark:bg-card text-foreground"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {label}{" "}
                            <span className="text-[11px] text-slate-gray">
                                ({count})
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                    <Input
                        placeholder="Search by name, role, phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9.5 rounded-[12px] bg-white pl-9 text-[13px] dark:bg-card"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-xs dark:bg-card">
                {isLoading ? (
                    <p className="px-6 py-10 text-slate-gray">Loading staff…</p>
                ) : isError ? (
                    <p className="px-6 py-10 text-red-600">
                        Could not load live staff. Check the API and manager
                        login.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[14px]">
                            <thead className="border-b border-hairline bg-surface-ivory/40 text-[12px] font-medium tracking-[0.05em] text-slate-gray uppercase">
                                <tr>
                                    <th className="px-6 py-3.5">
                                        Staff Member
                                    </th>
                                    <th className="px-6 py-3.5">Role</th>
                                    <th className="px-6 py-3.5">Credentials</th>
                                    <th className="px-6 py-3.5">
                                        Tables by shift
                                    </th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-slate-gray"
                                        >
                                            No staff members found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((member, idx) => {
                                        const isWaiter =
                                            member.roleCode === "WAITER";
                                        const isNearBottom =
                                            idx >= filteredStaff.length - 2 &&
                                            filteredStaff.length > 2;
                                        return (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-secondary/40 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "flex size-10 items-center justify-center rounded-full font-bold text-[14px] shrink-0 shadow-xs",
                                                                getAvatarSolidColor(
                                                                    member.name,
                                                                ),
                                                            )}
                                                        >
                                                            {member.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {member.name}
                                                            </p>
                                                            <p className="text-[12px] text-slate-gray">
                                                                {member.email ||
                                                                    member.phone ||
                                                                    "No contact info"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            "inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium border",
                                                            isWaiter
                                                                ? "bg-primary/10 border-primary/20 text-primary"
                                                                : "bg-secondary text-foreground border-border/80",
                                                        )}
                                                    >
                                                        {member.roleLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 text-[11.5px]">
                                                        <div className="flex items-center gap-1.5 font-mono">
                                                            <KeyRound className="size-3 text-slate-gray" />
                                                            <span className="font-sans text-slate-gray">
                                                                PIN:
                                                            </span>
                                                            <span className="font-bold tracking-widest text-foreground">
                                                                {member.hasPin
                                                                    ? "••••"
                                                                    : "None"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Lock className="size-3 text-slate-gray" />
                                                            <span className="text-slate-gray">
                                                                Password:
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "font-medium",
                                                                    member.hasPassword
                                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                                        : "text-amber-600 dark:text-amber-400",
                                                                )}
                                                            >
                                                                {member.hasPassword
                                                                    ? "Set"
                                                                    : "Not set"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isWaiter ? (
                                                        <div className="max-w-md space-y-1.5">
                                                            {member
                                                                .shiftCoverages
                                                                .length ===
                                                            0 ? (
                                                                <span className="text-[12px] text-slate-gray italic">
                                                                    No shift
                                                                    coverage yet
                                                                </span>
                                                            ) : (
                                                                member.shiftCoverages.map(
                                                                    coverage => (
                                                                        <div
                                                                            key={
                                                                                coverage.shiftDefinitionId
                                                                            }
                                                                            className="text-[12px]"
                                                                        >
                                                                            <span className="font-semibold text-foreground">
                                                                                {
                                                                                    coverage.shiftName
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    coverage.startLocalTime
                                                                                }

                                                                                –
                                                                                {
                                                                                    coverage.endLocalTime
                                                                                }
                                                                                ):
                                                                            </span>{" "}
                                                                            <span className="text-slate-gray">
                                                                                {coverage.tables
                                                                                    .map(
                                                                                        t =>
                                                                                            t.displayNumber ||
                                                                                            t.displayName,
                                                                                    )
                                                                                    .join(
                                                                                        ", ",
                                                                                    ) ||
                                                                                    "—"}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openAssign(
                                                                        member,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                                                            >
                                                                <Plus className="size-3" />
                                                                Assign by shift
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[12px] text-slate-gray">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant={
                                                            member.active
                                                                ? "success"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {member.active
                                                            ? "Active"
                                                            : "Off"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="relative inline-block text-left">
                                                        {/* Three-dots menu trigger */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setMenuOpenMemberId(
                                                                    menuOpenMemberId ===
                                                                        member.id
                                                                        ? null
                                                                        : member.id,
                                                                );
                                                            }}
                                                            className={cn(
                                                                "size-8 p-0 rounded-lg text-slate-gray hover:text-foreground hover:bg-secondary transition-colors",
                                                                menuOpenMemberId ===
                                                                    member.id &&
                                                                    "bg-secondary text-foreground",
                                                            )}
                                                            title="Staff options"
                                                        >
                                                            <MoreVertical className="size-4" />
                                                        </Button>

                                                        {/* Dropdown Menu Popup */}
                                                        {menuOpenMemberId ===
                                                            member.id && (
                                                            <>
                                                                {/* Click outside backdrop */}
                                                                <div
                                                                    className="fixed inset-0 z-30"
                                                                    onClick={() =>
                                                                        setMenuOpenMemberId(
                                                                            null,
                                                                        )
                                                                    }
                                                                />

                                                                <div
                                                                    className={cn(
                                                                        "absolute right-0 z-40 w-48 rounded-xl border border-hairline bg-white dark:bg-card p-1 shadow-xl animate-in fade-in zoom-in-95",
                                                                        isNearBottom
                                                                            ? "bottom-full mb-1.5 origin-bottom-right"
                                                                            : "top-full mt-1.5 origin-top-right",
                                                                    )}
                                                                >
                                                                    {/* Change PIN Option */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuOpenMemberId(
                                                                                null,
                                                                            );
                                                                            setPinTarget(
                                                                                member,
                                                                            );
                                                                            setPinValue(
                                                                                "",
                                                                            );
                                                                            setShowPinValue(
                                                                                false,
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                    >
                                                                        <KeyRound className="size-3.5 text-primary" />
                                                                        <span>
                                                                            Change
                                                                            PIN
                                                                        </span>
                                                                    </button>

                                                                    {/* Reset Password Option */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuOpenMemberId(
                                                                                null,
                                                                            );
                                                                            setPasswordTarget(
                                                                                member,
                                                                            );
                                                                            setPasswordValue(
                                                                                "",
                                                                            );
                                                                            setShowPasswordValue(
                                                                                false,
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                    >
                                                                        <Lock className="size-3.5 text-slate-gray" />
                                                                        <span>
                                                                            Reset
                                                                            Password
                                                                        </span>
                                                                    </button>

                                                                    {/* Assign Tables Option (Waiters only) */}
                                                                    {isWaiter ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMenuOpenMemberId(
                                                                                    null,
                                                                                );
                                                                                openAssign(
                                                                                    member,
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                        >
                                                                            <UtensilsCrossed className="size-3.5 text-slate-gray" />
                                                                            <span>
                                                                                Assign
                                                                                Tables
                                                                            </span>
                                                                        </button>
                                                                    ) : null}

                                                                    <div className="my-1 border-t border-hairline" />

                                                                    {/* Edit Staff Details */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuOpenMemberId(
                                                                                null,
                                                                            );
                                                                            dispatch(
                                                                                openEditStaff(
                                                                                    toLegacyStaff(
                                                                                        member,
                                                                                    ),
                                                                                ),
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                    >
                                                                        <Edit3 className="size-3.5 text-slate-gray" />
                                                                        <span>
                                                                            Edit
                                                                            Staff
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* RESET PIN MODAL DIALOG */}
            {pinTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                    <div
                        className="fixed inset-0"
                        onClick={() => setPinTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <KeyRound className="size-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px] text-foreground">
                                        Change Staff PIN
                                    </h3>
                                    <p className="text-[12px] text-slate-gray">
                                        {pinTarget.name} ({pinTarget.roleLabel})
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPinTarget(null)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-[13px]">
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    New Numeric PIN (4 to 6 digits)
                                </label>
                                <p className="text-[11.5px] text-slate-gray">
                                    Used for quick terminal login, order
                                    transfers, and waiter authorization.
                                </p>
                                <div className="relative mt-1">
                                    <Input
                                        type={
                                            showPinValue ? "text" : "password"
                                        }
                                        maxLength={6}
                                        value={pinValue}
                                        onChange={e =>
                                            setPinValue(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                ),
                                            )
                                        }
                                        placeholder="Enter 4-6 digit PIN"
                                        className="h-10 rounded-[10px] pr-10 font-mono tracking-wider text-[15px]"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPinValue(v => !v)}
                                        className="absolute right-3 top-2.5 text-slate-gray hover:text-foreground"
                                    >
                                        {showPinValue ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPinTarget(null)}
                                    className="h-9 rounded-xl text-[13px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        resettingPin || pinValue.length < 4
                                    }
                                    onClick={() => void handleSavePin()}
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold"
                                >
                                    {resettingPin ? "Saving..." : "Update PIN"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL DIALOG */}
            {passwordTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                    <div
                        className="fixed inset-0"
                        onClick={() => setPasswordTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border/60">
                                    <Lock className="size-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px] text-foreground">
                                        Reset Web Password
                                    </h3>
                                    <p className="text-[12px] text-slate-gray">
                                        {passwordTarget.name} (
                                        {passwordTarget.roleLabel})
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPasswordTarget(null)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-[13px]">
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    New Password (min 6 chars)
                                </label>
                                <p className="text-[11.5px] text-slate-gray">
                                    Used to sign in via email or phone with
                                    standard credentials.
                                </p>
                                <div className="relative mt-1">
                                    <Input
                                        type={
                                            showPasswordValue
                                                ? "text"
                                                : "password"
                                        }
                                        value={passwordValue}
                                        onChange={e =>
                                            setPasswordValue(e.target.value)
                                        }
                                        placeholder="Enter new password"
                                        className="h-10 rounded-[10px] pr-10"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswordValue(v => !v)
                                        }
                                        className="absolute right-3 top-2.5 text-slate-gray hover:text-foreground"
                                    >
                                        {showPasswordValue ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPasswordTarget(null)}
                                    className="h-9 rounded-xl text-[13px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        resettingPassword ||
                                        passwordValue.length < 6
                                    }
                                    onClick={() => void handleSavePassword()}
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold"
                                >
                                    {resettingPassword
                                        ? "Saving..."
                                        : "Update Password"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AddEditStaffSheet />
            <AssignTablesSheet
                isOpen={Boolean(assignWaiterId)}
                waiterMembershipId={assignWaiterId}
                waiterName={assignWaiterName}
                onClose={() => {
                    setAssignWaiterId(null);
                    setAssignWaiterName(null);
                }}
            />
        </DashboardFrame>
    );
}
