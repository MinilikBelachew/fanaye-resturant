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
import { useLocale, useTranslations } from "next-intl";
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
import type {
    AdminStaffDayShift,
    AdminStaffMember,
} from "@/domains/identity/domain/staffApi";
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

function format12HourTime(time24: string): string {
    const [hStr, mStr] = time24.split(":");
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mm} ${period}`;
}

function formatShiftLabelWithEth(
    s: {
        name: string;
        startLocalTime: string;
        endLocalTime: string;
    },
    isAmharic = true,
): string {
    const s12 = format12HourTime(s.startLocalTime);
    const e12 = format12HourTime(s.endLocalTime);
    const ethTimes = formatEthiopianLocalTime(s.startLocalTime);
    const ethTimee = formatEthiopianLocalTime(s.endLocalTime);
    const ethS = isAmharic ? ethTimes.formattedAm : ethTimes.formattedEn;
    const ethE = isAmharic ? ethTimee.formattedAm : ethTimee.formattedEn;
    return `${s.name} · ${s12}–${e12} (${ethS} – ${ethE})`;
}

function dayShiftFor(
    member: AdminStaffMember,
    dayKey: string,
): AdminStaffDayShift | null {
    const target = dayKey.toLowerCase().slice(0, 3);
    const fromPlan = member.dayShifts?.find(
        row => row.dayCode.toLowerCase().slice(0, 3) === target,
    );
    if (fromPlan) return fromPlan;
    if (member.dayShifts && member.dayShifts.length > 0) return null;
    if (!isWorkingOnDay(member.workingDays, dayKey)) return null;
    const fallback = member.shiftCoverages[0];
    if (!fallback) return null;
    return {
        dayCode: dayKey.slice(0, 1).toUpperCase() + dayKey.slice(1, 3),
        shiftDefinitionId: fallback.shiftDefinitionId,
        shiftName: fallback.shiftName,
        startLocalTime: fallback.startLocalTime,
        endLocalTime: fallback.endLocalTime,
    };
}

function mapRoleCode(code: string): Role {
    switch (code) {
        case "OWNER_ADMIN":
            return "owner";
        case "MANAGER":
            return "manager";
        case "STORE_MANAGER":
            return "store_manager";
        case "CASHIER":
            return "cashier";
        case "WAITER":
            return "waiter";
        case "DISPATCHER":
            return "dispatcher";
        case "DRIVER":
            return "driver";
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
            border: "border-sky-300/80 dark:border-sky-700/50",
            bg: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
            badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
            icon: Sunrise,
            iconColor: "text-sky-600 dark:text-sky-400",
        };
    }
    if (lower.includes("afternoon")) {
        return {
            border: "border-indigo-300/80 dark:border-indigo-700/50",
            bg: "bg-indigo-500/10 text-indigo-900 dark:text-indigo-200",
            badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
            icon: Sunset,
            iconColor: "text-indigo-600 dark:text-indigo-400",
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
    eyebrow,
}: StaffScheduleMatrixProps) {
    const locale = useLocale();
    const isAmharic = locale.startsWith("am");
    const t = useTranslations("staffSchedule");
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

            const cellLabel = formatDayCellLabel(date, calendarMode, isAmharic);

            return {
                ...dayObj,
                fullDate: date,
                dayTitle: cellLabel.dayTitle,
                dateLabel: cellLabel.dateNum,
                isToday,
            };
        });
    }, [weekOffset, calendarMode, isAmharic]);

    const weekLabel = useMemo(() => {
        if (weekDays.length === 0) return "";
        const start = weekDays[0].fullDate;
        const end = weekDays[6].fullDate;
        return formatWeekHeaderRange(start, end, calendarMode, isAmharic);
    }, [weekDays, calendarMode, isAmharic]);

    // Filtered Staff
    const filteredStaff = useMemo(() => {
        return staffMembers.filter(m => {
            if (roleFilter !== "ALL") {
                if (roleFilter === "MANAGER") {
                    if (
                        !["MANAGER", "OWNER_ADMIN", "STORE_MANAGER"].includes(
                            m.roleCode,
                        )
                    )
                        return false;
                } else if (m.roleCode !== roleFilter) {
                    return false;
                }
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
            m =>
                m.roleCode === "MANAGER" ||
                m.roleCode === "OWNER_ADMIN" ||
                m.roleCode === "STORE_MANAGER",
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
                        eyebrow={eyebrow || t("eyebrow")}
                        title={t("title")}
                        description={t("description")}
                    />
                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            onClick={() => dispatch(openAddStaff(undefined))}
                            className="gap-2 shadow-xs"
                        >
                            <Plus className="size-4" />
                            {t("registerStaff")}
                        </Button>
                    </div>
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
                            {t("allBranches")}
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
                    <div className="rounded-2xl border border-hairline bg-card p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {t("kpiTotalTeam")}
                            </p>
                            <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                                {t("kpiTotalMembers", {
                                    count: analytics.totalStaff,
                                })}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {t("kpiAcrossStations")}
                            </p>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            <Users className="size-4" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-card p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {t("kpiCashierCoverage")}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xl font-semibold text-foreground tabular-nums">
                                    {t("kpiCashiersCount", {
                                        count: analytics.cashiersCount,
                                    })}
                                </p>
                                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {t("kpiRotationsCovered", {
                                        covered:
                                            analytics.coveredCashierRotations,
                                    })}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {t("kpiRotationsHint")}
                            </p>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            <Clock className="size-4" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-card p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {t("kpiWaitstaff")}
                            </p>
                            <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                                {t("kpiWaitersCount", {
                                    count: analytics.waitersCount,
                                })}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {t("kpiWaitersHint")}
                            </p>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            <UtensilsCrossed className="size-4" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-card p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {t("kpiKitchenStations")}
                            </p>
                            <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                                {t("kpiOperatorsCount", {
                                    count: analytics.kitchenCount,
                                })}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {t("kpiKitchenHint")}
                            </p>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            <Coffee className="size-4" />
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
                            {t("prevWeek")}
                        </Button>
                        <div className="flex items-center gap-2 px-2">
                            <Calendar className="size-4 text-brand" />
                            <span className="text-xs font-bold text-foreground">
                                {weekLabel}
                            </span>
                            {weekOffset === 0 && (
                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                                    {t("currentWeek")}
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
                            {t("nextWeek")}
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
                                {t("jumpToToday")}
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
                                title={t("ethiopianCalTitle")}
                            >
                                <Calendar className="size-3.5" />
                                <span>{t("ethiopianCal")}</span>
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
                                title={t("gregorianCalTitle")}
                            >
                                <Globe className="size-3.5" />
                                <span>{t("gregorianCal")}</span>
                            </button>
                        </div>

                        <div className="relative min-w-[180px] flex-1 sm:w-52">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t("searchPlaceholder")}
                                className="h-8 pl-8 text-xs"
                            />
                        </div>

                        {/* Shift Template Selector */}
                        <select
                            value={shiftFilter}
                            onChange={e => setShiftFilter(e.target.value)}
                            aria-label={t("allShiftWindows")}
                            className="h-8 rounded-lg border border-hairline bg-card px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="ALL">{t("allShiftWindows")}</option>
                            {shiftDefs.map(s => (
                                <option key={s.id} value={s.id}>
                                    {formatShiftLabelWithEth(s, isAmharic)}
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
                            label: t("tabAllStaff", {
                                count: staffMembers.length,
                            }),
                        },
                        {
                            id: "CASHIER",
                            label: t("tabCashiers", {
                                count: analytics.cashiersCount,
                            }),
                        },
                        {
                            id: "WAITER",
                            label: t("tabWaiters", {
                                count: analytics.waitersCount,
                            }),
                        },
                        {
                            id: "STATION_OPERATOR",
                            label: t("tabKitchen", {
                                count: analytics.kitchenCount,
                            }),
                        },
                        {
                            id: "MANAGER",
                            label: t("tabManagers", {
                                count: analytics.managersCount,
                            }),
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
                            {t("loading")}
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <Calendar className="size-8 text-muted-foreground/40 mx-auto" />
                            <p className="text-sm font-semibold text-foreground">
                                {t("emptyTitle")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t("emptyDesc")}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[950px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-hairline bg-secondary/40 text-[11px] font-semibold text-muted-foreground">
                                        <th className="px-4 py-3 min-w-[200px]">
                                            {t("colTeamMember")}
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
                                                            {isAmharic
                                                                ? t(
                                                                      "todayBadgeAm",
                                                                  )
                                                                : t(
                                                                      "todayBadge",
                                                                  )}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-right min-w-[90px]">
                                            {t("colDaysPerWeek")}
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
                                        // Count active days
                                        const workingDaysCount =
                                            weekDays.filter(day => {
                                                if (
                                                    member.dayShifts &&
                                                    member.dayShifts.length > 0
                                                ) {
                                                    return member.dayShifts.some(
                                                        row =>
                                                            row.dayCode
                                                                .toLowerCase()
                                                                .slice(0, 3) ===
                                                            day.key
                                                                .toLowerCase()
                                                                .slice(0, 3),
                                                    );
                                                }
                                                return isWorkingOnDay(
                                                    member.workingDays,
                                                    day.key,
                                                );
                                            }).length;

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
                                                                    title={t(
                                                                        "clickToEdit",
                                                                    )}
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
                                                                                : member.roleCode ===
                                                                                    "STORE_MANAGER"
                                                                                  ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                                                                  : "bg-secondary text-foreground",
                                                                    )}
                                                                >
                                                                    {member.roleCode ===
                                                                    "CASHIER"
                                                                        ? t(
                                                                              "roleCashier",
                                                                          )
                                                                        : member.roleCode ===
                                                                            "WAITER"
                                                                          ? t(
                                                                                "roleWaiter",
                                                                            )
                                                                          : member.roleCode ===
                                                                              "STATION_OPERATOR"
                                                                            ? t(
                                                                                  "roleKitchen",
                                                                              )
                                                                            : member.roleCode ===
                                                                                "MANAGER"
                                                                              ? t(
                                                                                    "roleManager",
                                                                                )
                                                                              : member.roleCode ===
                                                                                  "STORE_MANAGER"
                                                                                ? t(
                                                                                      "roleStoreManager",
                                                                                  )
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
                                                    const dayPlan = dayShiftFor(
                                                        member,
                                                        day.key,
                                                    );
                                                    const isWorking =
                                                        Boolean(dayPlan);
                                                    const shiftCoverage =
                                                        dayPlan
                                                            ? (member.shiftCoverages.find(
                                                                  c =>
                                                                      c.shiftDefinitionId ===
                                                                          dayPlan.shiftDefinitionId &&
                                                                      (c.dayCode ===
                                                                          day.key ||
                                                                          !c.dayCode),
                                                              ) ?? {
                                                                  shiftDefinitionId:
                                                                      dayPlan.shiftDefinitionId,
                                                                  shiftName:
                                                                      dayPlan.shiftName,
                                                                  startLocalTime:
                                                                      dayPlan.startLocalTime,
                                                                  endLocalTime:
                                                                      dayPlan.endLocalTime,
                                                                  tables: [],
                                                              })
                                                            : null;
                                                    const shiftTheme =
                                                        shiftCoverage
                                                            ? getShiftTheme(
                                                                  shiftCoverage.shiftName,
                                                              )
                                                            : null;

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
                                                                                ? `${member.name} - ${shiftCoverage.shiftName} (${formatEthiopianLocalTime(shiftCoverage.startLocalTime)[isAmharic ? "formattedAm" : "formattedEn"]} – ${formatEthiopianLocalTime(shiftCoverage.endLocalTime)[isAmharic ? "formattedAm" : "formattedEn"]} / ${shiftCoverage.startLocalTime}–${shiftCoverage.endLocalTime})`
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
                                                                                        )[
                                                                                            isAmharic
                                                                                                ? "formattedAm"
                                                                                                : "formattedEn"
                                                                                        ]
                                                                                    }{" "}
                                                                                    –{" "}
                                                                                    {
                                                                                        formatEthiopianLocalTime(
                                                                                            shiftCoverage.endLocalTime,
                                                                                        )[
                                                                                            isAmharic
                                                                                                ? "formattedAm"
                                                                                                : "formattedEn"
                                                                                        ]
                                                                                    }
                                                                                </span>
                                                                            ) : (
                                                                                <span>
                                                                                    {
                                                                                        shiftCoverage.startLocalTime
                                                                                    }{" "}
                                                                                    –{" "}
                                                                                    {
                                                                                        shiftCoverage.endLocalTime
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {member.roleCode ===
                                                                            "CASHIER" && (
                                                                            <span className="mt-1 inline-block rounded-md bg-muted text-muted-foreground px-1 py-0.2 text-[8px] font-bold">
                                                                                {t(
                                                                                    "deskBadge",
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                        {member.roleCode ===
                                                                            "WAITER" &&
                                                                            shiftCoverage
                                                                                .tables
                                                                                ?.length >
                                                                                0 && (
                                                                                <span className="mt-1 inline-block rounded-md bg-blue-500/20 text-blue-900 dark:text-blue-200 px-1 py-0.2 text-[8px] font-bold">
                                                                                    {t(
                                                                                        "tablesBadge",
                                                                                        {
                                                                                            count: shiftCoverage
                                                                                                .tables
                                                                                                .length,
                                                                                        },
                                                                                    )}
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
                                                                            {t(
                                                                                "onDuty",
                                                                            )}
                                                                        </span>
                                                                        <span className="block text-[8px] text-muted-foreground mt-0.5">
                                                                            {t(
                                                                                "setShift",
                                                                            )}
                                                                        </span>
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <div className="py-2 text-center">
                                                                    <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                                                                        {t(
                                                                            "offDuty",
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {/* Total Working Days Column */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-mono font-bold text-foreground">
                                                        {t("daysCount", {
                                                            count: workingDaysCount,
                                                        })}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground block">
                                                        {t("hoursEstimated", {
                                                            hours:
                                                                workingDaysCount *
                                                                8,
                                                        })}
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
                                {t("rotationTitle")}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t("rotationDesc")}
                            </p>
                        </div>
                        <Link
                            href={`${basePath}/shifts`}
                            className="text-xs font-semibold text-brand hover:underline"
                        >
                            {t("configureShifts")}
                        </Link>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {/* Morning Shift */}
                        <div className="rounded-xl border border-sky-200 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sunrise className="size-4 text-sky-600 dark:text-sky-400" />
                                    <span className="text-xs font-bold text-foreground">
                                        {t("morningShift")} · 7:00 AM–3:00 PM{" "}
                                        {isAmharic
                                            ? "(1:00 ጠዋት – 9:00 ከሰዓት)"
                                            : ""}
                                    </span>
                                </div>
                                {analytics.morningCashier ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                                        <CheckCircle2 className="size-2.5" />
                                        {t("cashierSet")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[9px] font-bold">
                                        <AlertCircle className="size-2.5" />
                                        {t("deskUnassigned")}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                {t("morningDesc")}
                            </p>
                        </div>

                        {/* Afternoon Shift */}
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sunset className="size-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-xs font-bold text-foreground">
                                        {t("afternoonShift")} · 3:00 PM–11:00 PM{" "}
                                        {isAmharic
                                            ? "(9:00 ከሰዓት – 5:00 ማታ)"
                                            : ""}
                                    </span>
                                </div>
                                {analytics.afternoonCashier ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                                        <CheckCircle2 className="size-2.5" />
                                        {t("cashierSet")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[9px] font-bold">
                                        <AlertCircle className="size-2.5" />
                                        {t("deskUnassigned")}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                {t("afternoonDesc")}
                            </p>
                        </div>

                        {/* Night Shift */}
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Moon className="size-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-xs font-bold text-foreground">
                                        {t("nightShift")} · 11:00 PM–7:00 AM{" "}
                                        {isAmharic
                                            ? "(5:00 ማታ – 1:00 ጠዋት)"
                                            : ""}
                                    </span>
                                </div>
                                {analytics.nightCashier ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                                        <CheckCircle2 className="size-2.5" />
                                        {t("cashierSet")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[9px] font-bold">
                                        {t("optionalLate")}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                {t("nightDesc")}
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
