"use client";

import { useMemo, useState } from "react";
import {
    CircleUserRound,
    CookingPot,
    Edit3,
    LayoutGrid,
    Phone,
    Plus,
    Search,
    Shield,
    ToggleLeft,
    ToggleRight,
    UserCheck,
    UserPlus,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    openAddStaff,
    openAssignTables,
    openEditStaff,
    toggleStaffActive,
    setStaffShiftStatus,
} from "@/context/slices/identitySlice";
import { ROLE_LABELS, type Role } from "@/domains/identity/domain/role";
import type { Staff } from "@/domains/identity/domain/staff";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AddEditStaffSheet from "@/domains/identity/ui/AddEditStaffSheet";
import AssignTablesSheet from "@/domains/identity/ui/AssignTablesSheet";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "waiters" | "stations" | "management";

export default function ManagerStaffPage() {
    const dispatch = useAppDispatch();
    const staffMembers = useAppSelector(state => state.identity.staffMembers);
    const tables = useAppSelector(state => state.ops.tables);

    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Operational staff list (filtering super_admin from operational floor views)
    const operationalStaff = useMemo(() => {
        return staffMembers.filter(s => s.role !== "super_admin");
    }, [staffMembers]);

    // Filtered list
    const filteredStaff = useMemo(() => {
        return operationalStaff.filter(staff => {
            // Tab filter
            if (activeTab === "waiters" && staff.role !== "waiter") return false;
            if (
                activeTab === "stations" &&
                !["kitchen", "barista", "cakes", "soft_drinks"].includes(staff.role)
            ) {
                return false;
            }
            if (
                activeTab === "management" &&
                !["manager", "cashier", "owner"].includes(staff.role)
            ) {
                return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = staff.name.toLowerCase().includes(q);
                const matchRole = (ROLE_LABELS[staff.role] || "").toLowerCase().includes(q);
                const matchPhone = staff.phone ? staff.phone.includes(q) : false;
                if (!matchName && !matchRole && !matchPhone) return false;
            }

            return true;
        });
    }, [operationalStaff, activeTab, searchQuery]);

    // KPI Metrics
    const totalStaffCount = operationalStaff.length;
    const activeStaffCount = operationalStaff.filter(s => s.active).length;
    const waitersCount = operationalStaff.filter(s => s.role === "waiter").length;
    const stationStaffCount = operationalStaff.filter(s =>
        ["kitchen", "barista", "cakes", "soft_drinks"].includes(s.role),
    ).length;

    return (
        <DashboardFrame>
            {/* Header with Title & Registration Action Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="House"
                    title="Staff & Waiters"
                    description="Register restaurant personnel, assign dining floor tables, and manage shift duties."
                />
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStaff("waiter"))}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-[13px] font-semibold text-primary transition-all hover:bg-primary/20 active:scale-[0.98]"
                    >
                        <UtensilsCrossed className="size-4" />
                        <span>Register Waiter</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStaff(undefined))}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <UserPlus className="size-4" />
                        <span>Register Staff</span>
                    </button>
                </div>
            </div>

            {/* 1. Staff KPI Summary Cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4.5 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Total Personnel
                        </p>
                        <Users className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {totalStaffCount}
                    </p>
                    <p className="mt-1 text-[12px] text-emerald-600 font-medium">
                        {activeStaffCount} active on shift
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4.5 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Floor Waiters
                        </p>
                        <UtensilsCrossed className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {waitersCount}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        16 tables allocated
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4.5 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Station Stations
                        </p>
                        <CookingPot className="size-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {stationStaffCount}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Kitchen, Barista, Cakes
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4.5 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Duty Status
                        </p>
                        <UserCheck className="size-4 text-blue-500" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {operationalStaff.filter(s => s.shiftStatus === "on_duty").length}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Currently on floor duty
                    </p>
                </div>
            </div>

            {/* 2. Filter Bar & Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Segmented Filter Tabs */}
                <div className="flex rounded-[14px] border border-hairline bg-surface-ivory/50 p-1">
                    {[
                        { id: "all", label: "All Staff", count: totalStaffCount },
                        { id: "waiters", label: "Waiters & Tables", count: waitersCount },
                        { id: "stations", label: "Stations & Kitchen", count: stationStaffCount },
                        {
                            id: "management",
                            label: "Management",
                            count: totalStaffCount - waitersCount - stationStaffCount,
                        },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as FilterTab)}
                            className={cn(
                                "flex items-center gap-2 rounded-[10px] px-3.5 py-1.5 text-[13px] font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-foreground shadow-xs font-semibold dark:bg-card"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            <span>{tab.label}</span>
                            <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[11px] text-slate-gray">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-gray" />
                    <Input
                        placeholder="Search by name, role, phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9.5 pl-9 rounded-[12px] text-[13px] bg-white dark:bg-card"
                    />
                </div>
            </div>

            {/* 3. Staff Records Table / Cards */}
            <div className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-xs dark:bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="border-b border-hairline bg-surface-ivory/40 text-[12px] font-medium tracking-[0.05em] text-slate-gray uppercase">
                            <tr>
                                <th className="px-6 py-3.5">Staff Member</th>
                                <th className="px-6 py-3.5">Role / Position</th>
                                <th className="px-6 py-3.5">Shift Duty</th>
                                <th className="px-6 py-3.5">Assigned Floor Tables</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {filteredStaff.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-12 text-center text-slate-gray"
                                    >
                                        <p className="text-[15px] font-medium text-foreground">
                                            No staff members found
                                        </p>
                                        <p className="mt-1 text-[13px]">
                                            Try adjusting your search query or register a new staff member.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map(staff => {
                                    const isWaiter = staff.role === "waiter";
                                    const assignedCount = staff.assignedTableIds?.length ?? 0;

                                    return (
                                        <tr
                                            key={staff.id}
                                            className="group hover:bg-secondary/40 transition-colors"
                                        >
                                            {/* Name & Phone */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary font-bold text-foreground text-[14px]">
                                                        {staff.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">
                                                            {staff.name}
                                                        </p>
                                                        <p className="text-[12px] text-slate-gray">
                                                            {staff.phone || "No phone added"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
                                                            isWaiter
                                                                ? "bg-primary/10 text-primary"
                                                                : ["kitchen", "barista", "cakes", "soft_drinks"].includes(staff.role)
                                                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
                                                        )}
                                                    >
                                                        {ROLE_LABELS[staff.role]}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Shift Duty & Schedule */}
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-1.5 font-medium text-foreground text-[13px]">
                                                        <span>
                                                            {staff.shiftSchedule === "evening"
                                                                ? "🌙"
                                                                : staff.shiftSchedule === "full_day"
                                                                  ? "⚡"
                                                                  : "🌅"}
                                                        </span>
                                                        <span className="capitalize">
                                                            {staff.shiftSchedule?.replace("_", " ") || "Morning"} Shift
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-slate-gray">
                                                        {staff.shiftHours || "07:00 AM – 03:00 PM"}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-gray">
                                                        <span
                                                            className={cn(
                                                                "size-1.5 rounded-full",
                                                                staff.shiftStatus === "on_duty"
                                                                    ? "bg-emerald-500"
                                                                    : staff.shiftStatus === "on_break"
                                                                      ? "bg-amber-500"
                                                                      : "bg-zinc-400",
                                                            )}
                                                        />
                                                        <span className="capitalize font-medium">
                                                            {staff.shiftStatus?.replace("_", " ") || "On duty"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned Floor Tables */}
                                            <td className="px-6 py-4">
                                                {isWaiter ? (
                                                    <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                                                        {assignedCount > 0 ? (
                                                            staff.assignedTableIds?.map(tId => (
                                                                <span
                                                                    key={tId}
                                                                    className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground border border-hairline"
                                                                >
                                                                    T-{tId.replace("table-", "")}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[12px] text-slate-gray italic">
                                                                No tables assigned
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                dispatch(openAssignTables(staff))
                                                            }
                                                            className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                                                        >
                                                            + Assign
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] text-slate-gray">
                                                        N/A ({ROLE_LABELS[staff.role]})
                                                    </span>
                                                )}
                                            </td>

                                            {/* Active / Off Status */}
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        dispatch(toggleStaffActive(staff.id))
                                                    }
                                                    className="flex items-center gap-2 text-left"
                                                >
                                                    {staff.active ? (
                                                        <ToggleRight className="size-6 text-primary" />
                                                    ) : (
                                                        <ToggleLeft className="size-6 text-zinc-300" />
                                                    )}
                                                    <Badge
                                                        variant={staff.active ? "success" : "secondary"}
                                                    >
                                                        {staff.active ? "Active" : "Off"}
                                                    </Badge>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isWaiter && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                dispatch(openAssignTables(staff))
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-ivory px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors"
                                                            title="Assign Tables"
                                                        >
                                                            <UtensilsCrossed className="size-3 text-slate-gray" />
                                                            <span>Tables</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            dispatch(openEditStaff(staff))
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-ivory px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors"
                                                        title="Edit Staff Member"
                                                    >
                                                        <Edit3 className="size-3 text-slate-gray" />
                                                        <span>Edit</span>
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
            </div>

            {/* 4. Slide-over Sheets */}
            <AddEditStaffSheet />
            <AssignTablesSheet />
        </DashboardFrame>
    );
}
