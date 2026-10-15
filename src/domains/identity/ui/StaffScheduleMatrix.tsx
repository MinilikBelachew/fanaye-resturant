"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Clock3,
    Coffee,
    Edit3,
    Filter,
    Globe,
    Layers,
    Moon,
    Plus,
    Search,
    ShieldAlert,
    Sun,
    Sunrise,
    Sunset,
    UserCheck,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
    type CalendarMode,
    formatDayCellLabel,
    formatEthiopianLocalTime,
    formatWeekHeaderRange,
    getSavedCalendarMode,
    setSavedCalendarMode,
} from "@/lib/ethiopian-calendar";
import { useAppDispatch } from "@/context/hooks";
import { openAddStaff, openEditStaff } from "@/context/slices/identitySlice";
import {
    type AdminStaffQueryArg,
    useAdminStaffQuery,
} from "@/context/services/staffApi";
import { useShiftDefinitionsQuery } from "@/context/services/shiftsApi";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import type { AdminStaffMember } from "@/domains/identity/domain/staffApi";
import type { Staff } from "@/domains/identity/domain/staff";
import type { Role } from "@/domains/identity/domain/role";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddEditStaffSheet from "@/domains/identity/ui/AddEditStaffSheet";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type StaffScheduleMatrixProps = {
    basePath?: string;
    multiBranch?: boolean;
    eyebrow?: string;
};

const DAY_KEYS = [
    { key: "Mon", full: "Monday", short: "Mon" },
    { key: "Tue", full: "Tuesday", short: "Tue" },
    { key: "Wed", full: "Wednesday", short: "Wed" },
    { key: "Thu", full: "Thursday", short: "Thu" },
    { key: "Fri", full: "Friday", short: "Fri" },
    { key: "Sat", full: "Saturday", short: "Sat" },
    { key: "Sun", full: "Sunday", short: "Sun" },
] as const;

function isWorkingOnDay(
    workingDays: string[] | undefined,
    dayKey: string,
): boolean {
    if (!workingDays || workingDays.length === 0) return true;
    const target = dayKey.toLowerCase().slice(0, 3);
    return workingDays.some(d => d.toLowerCase().slice(0, 3) === target);
}

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
        case "DISPATCHER":
            return "dispatcher";
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
        stationId: member.stationId ?? undefined,
        workingDays: member.workingDays?.length
            ? member.workingDays
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        assignedTableIds: member.shiftCoverages.flatMap(coverage =>
            coverage.tables.map(table => table.tableId),
        ),
    };
}

function getShiftTheme(shiftName: string) {
    const lower = shiftName.toLowerCase();
    if (lower.includes("morning")) {
        return {
            border: "border-amber-300/80 dark:border-amber-700/50",
            bg: "bg-amber-500/10 text-amber-900 dark:text-amber-200",
            badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            icon: Sunrise,
            iconColor: "text-amber-600 dark:text-amber-400",
        };
    }
    if (lower.includes("afternoon")) {
        return {
            border: "border-orange-300/80 dark:border-orange-700/50",
            bg: "bg-orange-500/10 text-orange-900 dark:text-orange-200",
            badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
            icon: Sunset,
            iconColor: "text-orange-600 dark:text-orange-400",
        };
    }
    if (lower.includes("night") || lower.includes("late")) {
        return {
            border: "border-indigo-300/80 dark:border-indigo-700/50",
            bg: "bg-indigo-500/10 text-indigo-900 dark:text-indigo-200",
            badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
            icon: Moon,
            iconColor: "text-indigo-600 dark:text-indigo-400",
        };
    }
    return {
        border: "border-blue-300/80 dark:border-blue-700/50",
        bg: "bg-blue-500/10 text-blue-900 dark:text-blue-200",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
        icon: Clock,
        iconColor: "text-blue-600 dark:text-blue-400",
    };
}

const AVATAR_PALETTES = [
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

function getAvatarColor(name: string): string {
    if (!name) return AVATAR_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[index];
}

export default function StaffScheduleMatrix({
    basePath = "/manager/staff",
    multiBranch = false,
    eyebrow = "Operations",
}: StaffScheduleMatrixProps) {
    const dispatch = useAppDispatch();
    const [calendarMode, setCalendarMode] = useState<CalendarMode>(
        getSavedCalendarMode(),
    );
    const [weekOffset, setWeekOffset] = useState(0);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<CalendarMode>).detail;
            if (detail === "ETHIOPIAN" || detail === "GREGORIAN") {
                setCalendarMode(detail);
            }
        };
        window.addEventListener("calendar_mode_changed", handler);
        return () =>
            window.removeEventListener("calendar_mode_changed", handler);
    }, []);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<
        "ALL" | "CASHIER" | "WAITER" | "STATION_OPERATOR" | "MANAGER"
    >("ALL");
    const [shiftFilter, setShiftFilter] = useState<string>("ALL");
    const [branchFilter, setBranchFilter] = useState<"all" | string>(
        multiBranch ? "all" : "session",
    );

    const { data: branchesData } = useListBranchesQuery(
        multiBranch ? { activeOnly: true } : undefined,
        { skip: !multiBranch },
    );
    const branches = branchesData?.data ?? [];

    const staffQueryArg = useMemo((): AdminStaffQueryArg => {
        if (!multiBranch) return {};
        if (branchFilter === "all") return { scope: "all" };
        return { branchId: branchFilter };
    }, [multiBranch, branchFilter]);

    const { data: staffData, isLoading: staffLoading } =
        useAdminStaffQuery(staffQueryArg);
    const { data: shiftsData } = useShiftDefinitionsQuery();

    const staffMembers = useMemo(
        () => staffData?.data ?? [],
        [staffData?.data],
    );
    const shiftDefs = useMemo(() => shiftsData?.data ?? [], [shiftsData?.data]);

    // Calculate Week Days
    const weekDays = useMemo(() => {
        const now = new Date();
        // find Monday of current week
        const currentDayIndex = (now.getDay() + 6) % 7; // Mon=0, Sun=6
        const monday = new Date(now);
        monday.setDate(now.getDate() - currentDayIndex + weekOffset * 7);

        return DAY_KEYS.map((dayObj, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);

            const isToday =
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate();

            const cellLabel = formatDayCellLabel(date, calendarMode, true);

            return {
                ...dayObj,
                fullDate: date,
                dayTitle: cellLabel.dayTitle,
                dateLabel: cellLabel.dateNum,
                isToday,
            };
        });
    }, [weekOffset, calendarMode]);

    const weekLabel = useMemo(() => {
        if (weekDays.length === 0) return "";
        const start = weekDays[0].fullDate;
        const end = weekDays[6].fullDate;
        return formatWeekHeaderRange(start, end, calendarMode, true);
    }, [weekDays, calendarMode]);

    // Filtered Staff
    const filteredStaff = useMemo(() => {
        return staffMembers.filter(m => {
            if (roleFilter !== "ALL") {
                if (m.roleCode !== roleFilter) return false;
            }
            if (shiftFilter !== "ALL") {
                const hasShift = m.shiftCoverages.some(
                    sc => sc.shiftDefinitionId === shiftFilter,
                );
                if (!hasShift) return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchName = m.name.toLowerCase().includes(q);
                const matchPhone = m.phone?.toLowerCase().includes(q) ?? false;
                const matchEmail = m.email?.toLowerCase().includes(q) ?? false;
                if (!matchName && !matchPhone && !matchEmail) return false;
            }
            return true;
        });
    }, [staffMembers, roleFilter, shiftFilter, search]);

    // Shift Coverage Analytics
    const analytics = useMemo(() => {
        const cashiers = staffMembers.filter(m => m.roleCode === "CASHIER");
        const waiters = staffMembers.filter(m => m.roleCode === "WAITER");
        const kitchen = staffMembers.filter(
            m => m.roleCode === "STATION_OPERATOR",
        );
        const managers = staffMembers.filter(
            m => m.roleCode === "MANAGER" || m.roleCode === "OWNER_ADMIN",
        );

        // Shifts that have at least one cashier
        const cashierShifts = new Set(
            cashiers.flatMap(c =>
                c.shiftCoverages.map(sc => sc.shiftName.toLowerCase()),
            ),
        );
        const morningCashier = Array.from(cashierShifts).some(s =>
            s.includes("morning"),
        );
        const afternoonCashier = Array.from(cashierShifts).some(s =>
            s.includes("afternoon"),
        );
        const nightCashier = Array.from(cashierShifts).some(
            s => s.includes("night") || s.includes("late"),
        );

        let coveredCount = 0;
        if (morningCashier) coveredCount++;
        if (afternoonCashier) coveredCount++;
        if (nightCashier) coveredCount++;

        return {
            totalStaff: staffMembers.length,
            cashiersCount: cashiers.length,
            waitersCount: waiters.length,
            kitchenCount: kitchen.length,
            managersCount: managers.length,
            morningCashier,
            afternoonCashier,
            nightCashier,
            coveredCashierRotations: coveredCount,
        };
    }, [staffMembers]);

    return (
        <DashboardFrame>
            <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <PageHeader
                        compact
                        eyebrow={eyebrow}
                        title="Weekly Shift Roster & Schedule Matrix"
                        description="View schedule assignments, desk custody rotations, and floor coverage across the weekly rotation."
                    />
                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            onClick={() => dispatch(openAddStaff(undefined))}
                            className="gap-2 shadow-xs"
                        >
                            <Plus className="size-4" />
                            Register Staff Member
                        </Button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-1.5 border-b border-hairline pb-3">
                    <Link
                        href={basePath}
                        className="inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <Users className="size-3.5" />
                        Staff Directory
                    </Link>
                    <Link
                        href={`${basePath}/shifts`}
                        className="inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <Clock3 className="size-3.5" />
                        Shift Templates & Hours
                    </Link>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
                        <Calendar className="size-3.5" />
                        Weekly Shift Roster
                    </span>
                </div>

                {/* Multi-Branch Selector if enabled */}
                {multiBranch ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setBranchFilter("all")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
                                branchFilter === "all"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-hairline bg-card text-slate-gray hover:text-foreground",
                            )}
                        >
                            <Building2 className="size-3.5" />
                            All Branches
                        </button>
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                type="button"
                                onClick={() => setBranchFilter(branch.id)}
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
                                    branchFilter === branch.id
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-hairline bg-card text-slate-gray hover:text-foreground",
                                )}
                            >
                                {branch.name}
                            </button>
                        ))}
                    </div>
                ) : null}

                {/* KPI Summary Banner */}
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-hairline bg-card p-4 shadow-subtle flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Total Team
                            </p>
                            <p className="text-xl font-bold text-foreground mt-1 tabular-nums">
                                {analytics.totalStaff} Members
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Across all active stations
                            </p>
                        </div>
                        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Users className="size-5" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-card p-4 shadow-subtle flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Cashier Desk Coverage
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xl font-bold text-foreground tabular-nums">
                                    {analytics.cashiersCount} Cashiers
                                </p>
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                        analytics.coveredCashierRotations >= 2
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                                    )}
                                >
                                    {analytics.coveredCashierRotations}/3
                                    Rotations
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Morning, Afternoon, & Night
                            </p>
                        </div>
                        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-card p-4 shadow-subtle flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Dining Floor Waitstaff
                            </p>
                            <p className="text-xl font-bold text-foreground mt-1 tabular-nums">
                                {analytics.waitersCount} Waiters
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Assigned to floor table sections
                            </p>
                        </div>
                        <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <UtensilsCrossed className="size-5" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-card p-4 shadow-subtle flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Kitchen Stations
                            </p>
                            <p className="text-xl font-bold text-foreground mt-1 tabular-nums">
                                {analytics.kitchenCount} Operators
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Hot prep, bar, pizza & pass
                            </p>
                        </div>
                        <div className="flex size-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Coffee className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Week Selector & Filters Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-card p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
                    {/* Week Navigation Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setWeekOffset(w => w - 1)}
                            className="h-8 gap-1 px-2.5 text-xs font-semibold"
                        >
                            <ArrowLeft className="size-3.5" />
                            Prev Week
                        </Button>
                        <div className="flex items-center gap-2 px-2">
                            <Calendar className="size-4 text-brand" />
                            <span className="text-xs font-bold text-foreground">
                                {weekLabel}
                            </span>
                            {weekOffset === 0 && (
                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                                    Current Week
                                </span>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setWeekOffset(w => w + 1)}
                            className="h-8 gap-1 px-2.5 text-xs font-semibold"
                        >
                            Next Week
                            <ArrowRight className="size-3.5" />
                        </Button>
                        {weekOffset !== 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setWeekOffset(0)}
                                className="h-8 px-2 text-xs font-semibold text-brand hover:bg-brand/10"
                            >
                                Jump to Today
                            </Button>
                        )}
                    </div>

                    {/* Search, Calendar Switcher & Shift Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Calendar Mode Switcher */}
                        <div className="inline-flex items-center rounded-xl border border-hairline bg-secondary/40 p-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setCalendarMode("ETHIOPIAN");
                                    setSavedCalendarMode("ETHIOPIAN");
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                                    calendarMode === "ETHIOPIAN"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                                title="Ethiopian Calendar (ዓ.ም.)"
                            >
                                <span className="text-xs">🇪🇹</span>
                                <span>ኢትዮጵያ (ዓ.ም.)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCalendarMode("GREGORIAN");
                                    setSavedCalendarMode("GREGORIAN");
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                                    calendarMode === "GREGORIAN"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                                title="Gregorian Calendar (G.C.)"
                            >
                                <Globe className="size-3.5" />
                                <span>G.C.</span>
                            </button>
                        </div>

                        <div className="relative min-w-[180px] flex-1 sm:w-52">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search staff name..."
                                className="h-8 pl-8 text-xs"
                            />
                        </div>

                        {/* Shift Template Selector */}
                        <select
                            value={shiftFilter}
                            onChange={e => setShiftFilter(e.target.value)}
                            aria-label="Filter by shift template"
                            className="h-8 rounded-lg border border-hairline bg-card px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="ALL">All Shift Windows</option>
                            {shiftDefs.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.startLocalTime}–
                                    {s.endLocalTime})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Role Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        {
                            id: "ALL",
                            label: `All Staff (${staffMembers.length})`,
                        },
                        {
                            id: "CASHIER",
                            label: `Cashiers (${analytics.cashiersCount})`,
                        },
                        {
                            id: "WAITER",
                            label: `Waiters (${analytics.waitersCount})`,
                        },
                        {
                            id: "STATION_OPERATOR",
                            label: `Kitchen (${analytics.kitchenCount})`,
                        },
                        {
                            id: "MANAGER",
                            label: `Managers (${analytics.managersCount})`,
                        },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() =>
                                setRoleFilter(tab.id as typeof roleFilter)
                            }
                            className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                                roleFilter === tab.id
                                    ? "bg-foreground text-background font-semibold"
                                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Schedule Matrix Table */}
                <div className="rounded-2xl border border-hairline bg-card shadow-subtle overflow-hidden">
                    {staffLoading ? (
                        <div className="p-12 text-center text-xs text-muted-foreground">
                            Loading schedule roster...
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <Calendar className="size-8 text-muted-foreground/40 mx-auto" />
                            <p className="text-sm font-semibold text-foreground">
                                No staff members match current filters.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Try clearing your search or switching to another
                                role tab.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[950px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-hairline bg-secondary/40 text-[11px] font-semibold text-muted-foreground">
                                        <th className="px-4 py-3 min-w-[200px]">
                                            Team Member
                                        </th>
                                        {weekDays.map(day => (
                                            <th
                                                key={day.key}
                                                className={cn(
                                                    "px-3 py-3 text-center min-w-[105px]",
                                                    day.isToday &&
                                                        "bg-brand/10 text-brand font-bold border-x border-brand/20",
                                                )}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-semibold">
                                                        {day.dayTitle}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-normal",
                                                            day.isToday &&
                                                                "font-bold text-brand",
                                                        )}
                                                    >
                                                        {day.dateLabel}
                                                    </span>
                                                    {day.isToday && (
                                                        <span className="mt-0.5 rounded-full bg-brand text-brand-foreground px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wide">
                                                            {calendarMode ===
                                                            "ETHIOPIAN"
                                                                ? "ዛሬ"
                                                                : "Today"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-right min-w-[90px]">
                                            Days / Wk
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline text-xs">
                                    {filteredStaff.map(member => {
                                        const initials = member.name
                                            .split(" ")
                                            .map(p => p[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2);
                                        const avatarBg = getAvatarColor(
                                            member.name,
                                        );
                                        const shiftCoverage =
                                            member.shiftCoverages[0];
                                        const shiftTheme = shiftCoverage
                                            ? getShiftTheme(
                                                  shiftCoverage.shiftName,
                                              )
                                            : null;

                                        // Count active days
                                        const workingDaysCount =
                                            weekDays.filter(day =>
                                                isWorkingOnDay(
                                                    member.workingDays,
                                                    day.key,
                                                ),
                                            ).length;

                                        return (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-secondary/20 transition-colors group"
                                            >
                                                {/* Member Details */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                                                                avatarBg,
                                                            )}
                                                        >
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
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
                                                                    className="font-bold text-foreground hover:text-brand transition-colors truncate text-left cursor-pointer"
                                                                    title="Click to edit shift & schedule"
                                                                >
                                                                    {
                                                                        member.name
                                                                    }
                                                                </button>
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
                                                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                                                                >
                                                                    <Edit3 className="size-3" />
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                                <span
                                                                    className={cn(
                                                                        "rounded-md px-1.5 py-0.2 text-[10px] font-semibold tracking-wide uppercase",
                                                                        member.roleCode ===
                                                                            "CASHIER"
                                                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                                                            : member.roleCode ===
                                                                                "WAITER"
                                                                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                                                              : member.roleCode ===
                                                                                  "STATION_OPERATOR"
                                                                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                                                                : "bg-secondary text-foreground",
                                                                    )}
                                                                >
                                                                    {member.roleCode ===
                                                                    "CASHIER"
                                                                        ? "Cashier"
                                                                        : member.roleCode ===
                                                                            "WAITER"
                                                                          ? "Waiter"
                                                                          : member.roleCode ===
                                                                              "STATION_OPERATOR"
                                                                            ? "Kitchen"
                                                                            : member.roleCode}
                                                                </span>
                                                                {member.branchName && (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        ·{" "}
                                                                        {
                                                                            member.branchName
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 7 Days of the Week */}
                                                {weekDays.map(day => {
                                                    const isWorking =
                                                        isWorkingOnDay(
                                                            member.workingDays,
                                                            day.key,
                                                        );

                                                    return (
                                                        <td
                                                            key={day.key}
                                                            className={cn(
                                                                "px-2 py-3 text-center align-middle",
                                                                day.isToday &&
                                                                    "bg-brand/[0.04] border-x border-brand/20",
                                                            )}
                                                        >
                                                            {isWorking ? (
                                                                shiftCoverage &&
                                                                shiftTheme ? (
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
                                                                        className={cn(
                                                                            "w-full rounded-xl border p-1.5 text-center transition-all duration-150 hover:shadow-xs hover:scale-[1.02] cursor-pointer",
                                                                            shiftTheme.border,
                                                                            shiftTheme.bg,
                                                                        )}
                                                                        title={
                                                                            calendarMode ===
                                                                            "ETHIOPIAN"
                                                                                ? `${member.name} - ${shiftCoverage.shiftName} (${formatEthiopianLocalTime(shiftCoverage.startLocalTime).formattedAm} – ${formatEthiopianLocalTime(shiftCoverage.endLocalTime).formattedAm} / ${shiftCoverage.startLocalTime}–${shiftCoverage.endLocalTime})`
                                                                                : `${member.name} - ${shiftCoverage.shiftName} (${shiftCoverage.startLocalTime}–${shiftCoverage.endLocalTime})`
                                                                        }
                                                                    >
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <shiftTheme.icon
                                                                                className={cn(
                                                                                    "size-3 shrink-0",
                                                                                    shiftTheme.iconColor,
                                                                                )}
                                                                            />
                                                                            <span className="text-[10px] font-bold leading-tight truncate">
                                                                                {shiftCoverage.shiftName
                                                                                    .replace(
                                                                                        "Shift",
                                                                                        "",
                                                                                    )
                                                                                    .trim()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[9px] font-mono opacity-80 mt-0.5">
                                                                            {calendarMode ===
                                                                            "ETHIOPIAN" ? (
                                                                                <span>
                                                                                    {
                                                                                        formatEthiopianLocalTime(
                                                                                            shiftCoverage.startLocalTime,
                                                                                        )
                                                                                            .formattedAm
                                                                                    }{" "}
                                                                                    –{" "}
                                                                                    {
                                                                                        formatEthiopianLocalTime(
                                                                                            shiftCoverage.endLocalTime,
                                                                                        )
                                                                                            .formattedAm
                                                                                    }
                                                                                </span>
                                                                            ) : (
                                                                                <span>
                                                                                    {
                                                                                        shiftCoverage.startLocalTime
                                                                                    }
                                                                                    –
                                                                                    {
                                                                                        shiftCoverage.endLocalTime
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {member.roleCode ===
                                                                            "CASHIER" && (
                                                                            <span className="mt-1 inline-block rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 px-1 py-0.2 text-[8px] font-bold">
                                                                                Desk
                                                                            </span>
                                                                        )}
                                                                        {member.roleCode ===
                                                                            "WAITER" &&
                                                                            shiftCoverage
                                                                                .tables
                                                                                ?.length >
                                                                                0 && (
                                                                                <span className="mt-1 inline-block rounded-md bg-blue-500/20 text-blue-900 dark:text-blue-200 px-1 py-0.2 text-[8px] font-bold">
                                                                                    {
                                                                                        shiftCoverage
                                                                                            .tables
                                                                                            .length
                                                                                    }{" "}
                                                                                    tbls
                                                                                </span>
                                                                            )}
                                                                    </button>
                                                                ) : (
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
                                                                        className="w-full rounded-xl border border-dashed border-hairline bg-secondary/30 p-1.5 text-center hover:bg-secondary cursor-pointer"
                                                                    >
                                                                        <span className="text-[10px] font-semibold text-foreground">
                                                                            On
                                                                            Duty
                                                                        </span>
                                                                        <span className="block text-[8px] text-muted-foreground mt-0.5">
                                                                            Set
                                                                            Shift
                                                                            +
                                                                        </span>
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <div className="py-2 text-center">
                                                                    <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                                                                        Off
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {/* Total Working Days Column */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-mono font-bold text-foreground">
                                                        {workingDaysCount}d
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground block">
                                                        {workingDaysCount * 8}h
                                                        est
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Shift Coverage Health Breakdown (Bottom Row) */}
                <div className="rounded-2xl border border-hairline bg-card p-5 shadow-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Layers className="size-4 text-brand" />
                                24-Hour Operational Rotation Breakdown
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Verification of Cash Desk Custody and Waiter
                                Coverage across every working shift.
                            </p>
                        </div>
                        <Link
                            href={`${basePath}/shifts`}
                            className="text-xs font-semibold text-brand hover:underline"
                        >
                            Configure Shifts →
                        </Link>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {/* Morning Shift */}
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sunrise className="size-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold text-foreground">
                                        🌅 Morning Shift (07:00 – 15:00)
                                    </span>
                                </div>
                                {analytics.morningCashier ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                                        <CheckCircle2 className="size-2.5" />
                                        Cashier Set
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-[9px] font-bold">
                                        <AlertCircle className="size-2.5" />
                                        Desk Unassigned
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                Opening cash drawer count, breakfast & lunch
                                coverage, and initial float custody.
                            </p>
                        </div>

                        {/* Afternoon Shift */}
                        <div className="rounded-xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sunset className="size-4 text-orange-600 dark:text-orange-400" />
                                    <span className="text-xs font-bold text-foreground">
                                        🌇 Afternoon Shift (15:00 – 23:00)
                                    </span>
                                </div>
                                {analytics.afternoonCashier ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                                        <CheckCircle2 className="size-2.5" />
                                        Cashier Set
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-[9px] font-bold">
                                        <AlertCircle className="size-2.5" />
                                        Desk Unassigned
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                Dinner rush, high-volume digital reconciliation,
                                and afternoon table turnovers.
                            </p>
                        </div>

                        {/* Night Shift */}
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Moon className="size-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-xs font-bold text-foreground">
                                        🌙 Night Shift (23:00 – 07:00)
                                    </span>
                                </div>
                                {analytics.nightCashier ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                                        <CheckCircle2 className="size-2.5" />
                                        Cashier Set
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[9px] font-bold">
                                        Optional / Late
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                Overnight closing reconciliation, safe drop
                                verification, and opening float prep.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sheets for modifying staff details and table coverage */}
            <AddEditStaffSheet />
        </DashboardFrame>
    );
}
