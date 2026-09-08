"use client";

import { useMemo, useState } from "react";
import {
    CookingPot,
    Edit3,
    Plus,
    Search,
    UserCheck,
    UserPlus,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import { useAppDispatch } from "@/context/hooks";
import { openAddStaff, openEditStaff } from "@/context/slices/identitySlice";
import { useAdminStaffQuery } from "@/context/services/staffApi";
import type { AdminStaffMember } from "@/domains/identity/domain/staffApi";
import type { Staff } from "@/domains/identity/domain/staff";
import type { Role } from "@/domains/identity/domain/role";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AddEditStaffSheet from "@/domains/identity/ui/AddEditStaffSheet";
import AssignTablesSheet from "@/domains/identity/ui/AssignTablesSheet";
import { cn } from "@/lib/utils";

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
        pinHint: "••••",
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
    const { data, isLoading, isError } = useAdminStaffQuery();
    const liveStaff = data?.data ?? [];
    const shifts = data?.shifts ?? [];

    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [assignWaiterId, setAssignWaiterId] = useState<string | null>(null);
    const [assignWaiterName, setAssignWaiterName] = useState<string | null>(
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
                const hay = `${member.name} ${member.roleLabel} ${member.phone ?? ""}`.toLowerCase();
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

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="House"
                    title="Staff & Waiters"
                    description="Assign dining tables per shift window. Create shifts with any start/end time."
                />
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStaff("waiter"))}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-[13px] font-semibold text-primary"
                    >
                        <UtensilsCrossed className="size-4" />
                        Register Waiter
                    </button>
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStaff(undefined))}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
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
                        Create more shifts (any times) when assigning tables to a
                        waiter.
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
                                totalStaffCount - waitersCount - stationStaffCount,
                            ],
                        ] as const
                    ).map(([id, label, count]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "rounded-[10px] px-3.5 py-1.5 text-[13px] font-medium",
                                activeTab === id
                                    ? "bg-white font-semibold shadow-xs dark:bg-card"
                                    : "text-slate-gray",
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
                                    <th className="px-6 py-3.5">Staff Member</th>
                                    <th className="px-6 py-3.5">Role</th>
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
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-slate-gray"
                                        >
                                            No staff members found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map(member => {
                                        const isWaiter =
                                            member.roleCode === "WAITER";
                                        return (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-secondary/40"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-[14px] font-bold">
                                                            {member.name.charAt(
                                                                0,
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">
                                                                {member.name}
                                                            </p>
                                                            <p className="text-[12px] text-slate-gray">
                                                                {member.phone ||
                                                                    "No phone"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            "inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium",
                                                            isWaiter
                                                                ? "bg-primary/10 text-primary"
                                                                : "bg-secondary text-foreground",
                                                        )}
                                                    >
                                                        {member.roleLabel}
                                                    </span>
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
                                                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
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
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isWaiter ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openAssign(
                                                                        member,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[12px] font-medium"
                                                            >
                                                                <UtensilsCrossed className="size-3" />
                                                                Tables
                                                            </button>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                dispatch(
                                                                    openEditStaff(
                                                                        toLegacyStaff(
                                                                            member,
                                                                        ),
                                                                    ),
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[12px] font-medium"
                                                        >
                                                            <Edit3 className="size-3" />
                                                            Edit
                                                        </button>
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
