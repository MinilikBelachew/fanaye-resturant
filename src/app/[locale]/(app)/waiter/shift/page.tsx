"use client";

import {
    ArrowRightLeft,
    Bell,
    CalendarDays,
    Flame,
    LayoutGrid,
    LogIn,
    LogOut,
    UtensilsCrossed,
    Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAppSelector } from "@/context/hooks";
import { useWaiterCashSummaryQuery } from "@/context/services/cashApi";
import { useWaiterTablesQuery } from "@/context/services/floorApi";
import {
    useClockInMutation,
    useClockOutMutation,
    useCurrentShiftQuery,
} from "@/context/services/shiftsApi";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import WaiterHandoverModal from "@/domains/ordering/ui/WaiterHandoverModal";
import { Link } from "@/i18n/navigation";
import {
    ETHIOPIAN_DAYS,
    formatEthiopianLocalTime,
    getEthiopianDateDetails,
} from "@/lib/ethiopian-calendar";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getStaffAvatarUrl } from "@/lib/avatars";

const WEEK_DAY_CODES = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
] as const;

function mondayOfWeek(date = new Date()) {
    const d = new Date(date);
    const mondayOffset = (d.getDay() + 6) % 7;
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - mondayOffset);
    return d;
}

function dateForDayCodeThisWeek(dayCode: string, weekStart = mondayOfWeek()) {
    const index = WEEK_DAY_CODES.indexOf(
        dayCode as (typeof WEEK_DAY_CODES)[number],
    );
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + (index >= 0 ? index : 0));
    return d;
}

function dayLabel(dayCode: string, isAmharic: boolean) {
    const row = ETHIOPIAN_DAYS.find(day => day.key === dayCode);
    if (!row) return dayCode;
    return isAmharic ? row.am : row.en;
}

function formatGregorianDate(date: Date, locale: string) {
    return date.toLocaleDateString(
        locale.startsWith("am") ? "am-ET" : "en-GB",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        },
    );
}

function MetricCard({
    label,
    value,
    hint,
    icon: Icon,
    accent = false,
}: {
    label: string;
    value: string;
    hint: string;
    icon: typeof Bell;
    accent?: boolean;
}) {
    return (
        <div className="rounded-[20px] border border-hairline bg-card p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-normal text-slate-gray">
                    {label}
                </p>
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-slate-gray">
                    <Icon className="size-4" />
                </span>
            </div>
            <p
                className={cn(
                    "mt-3 text-[28px] leading-none font-normal tracking-tight",
                    accent ? "text-brand" : "text-foreground",
                )}
            >
                {value}
            </p>
            <p className="mt-2 text-[12px] text-slate-gray">{hint}</p>
        </div>
    );
}

function formatClock(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatWindowLabel(start?: string | null, end?: string | null) {
    if (!start || !end) return null;
    const greg = `${start} – ${end}`;
    const ethStart = formatEthiopianLocalTime(start);
    const ethEnd = formatEthiopianLocalTime(end);
    return {
        greg,
        eth: `${ethStart.formattedAm} – ${ethEnd.formattedAm}`,
    };
}

export default function WaiterShiftPage() {
    const t = useTranslations("waiter");
    const locale = useLocale();
    const isAmharic = locale.startsWith("am");
    const staff = useAppSelector(selectCurrentStaff);
    const hasSession = useAppSelector(state => Boolean(state.identity.session));
    const { data: shift, isFetching } = useCurrentShiftQuery(undefined, {
        skip: !hasSession,
    });
    const [clockIn, { isLoading: clockingIn }] = useClockInMutation();
    const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();
    const [actionError, setActionError] = useState("");
    const [openHandover, setOpenHandover] = useState(false);
    const { data: floor } = useWaiterTablesQuery("my", {
        skip: !staff,
        pollingInterval: 5000,
    });
    const { data: cashSummary } = useWaiterCashSummaryQuery(undefined, {
        skip: !staff || !hasSession,
        pollingInterval: 5000,
    });
    const myTables = floor?.data ?? [];
    const cashOnHand = Number(cashSummary?.undroppedCash ?? 0);
    const summary = {
        openTables: myTables.filter(table => Boolean(table.tableSessionId))
            .length,
        readyCount: myTables.reduce(
            (sum, table) => sum + table.readyItemCount,
            0,
        ),
        cookingCount: myTables.reduce(
            (sum, table) => sum + table.cookingItemCount,
            0,
        ),
        sales: Number(cashSummary?.cashCollected ?? 0),
    };
    const tablesOpen = summary.openTables > 0;
    const clockedIn = Boolean(shift?.clockedIn && shift.shiftSession);
    const session = shift?.shiftSession ?? null;
    const upcoming = shift?.upcomingAssignment ?? null;
    const weeklyPlan = shift?.weeklyPlan ?? [];
    const upcomingAssignments = shift?.upcomingAssignments ?? [];
    const busy = clockingIn || clockingOut || isFetching;
    const staffName = staff?.name ?? t("server");
    const today = useMemo(() => new Date(), []);
    const ethToday = useMemo(() => getEthiopianDateDetails(today), [today]);
    const gregToday = useMemo(
        () => formatGregorianDate(today, locale),
        [today, locale],
    );
    const todayDayCode = WEEK_DAY_CODES[(today.getDay() + 6) % 7];
    const todayPlan = useMemo(
        () => weeklyPlan.find(row => row.dayCode === todayDayCode) ?? null,
        [weeklyPlan, todayDayCode],
    );
    const todayTables = useMemo(() => {
        if (shift?.assignedTables && shift.assignedTables.length > 0) {
            return shift.assignedTables;
        }
        if (todayPlan?.tables && todayPlan.tables.length > 0) {
            return todayPlan.tables;
        }
        if (myTables.length > 0) {
            return myTables.map(t => ({
                tableId: t.tableId,
                displayName: t.displayName,
                displayNumber: t.displayNumber,
                locationName: t.locationName,
            }));
        }
        return [];
    }, [shift?.assignedTables, todayPlan?.tables, myTables]);
    const assignedShiftName =
        session?.definitionName ||
        todayPlan?.definitionName ||
        upcoming?.definitionName ||
        t("navShift");
    const plannedWindow = useMemo(() => {
        if (todayPlan) {
            return formatWindowLabel(
                todayPlan.startLocalTime,
                todayPlan.endLocalTime,
            );
        }
        const startIso =
            session?.scheduledStartAt ?? upcoming?.scheduledStartAt ?? null;
        const endIso =
            session?.scheduledEndAt ?? upcoming?.scheduledEndAt ?? null;
        if (!startIso || !endIso) return null;
        const start = new Date(startIso);
        const end = new Date(endIso);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return null;
        }
        const startHm = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
        const endHm = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
        return formatWindowLabel(startHm, endHm);
    }, [
        todayPlan,
        session?.scheduledStartAt,
        session?.scheduledEndAt,
        upcoming?.scheduledStartAt,
        upcoming?.scheduledEndAt,
    ]);
    const weekCells = useMemo(() => {
        const byDay = new Map(weeklyPlan.map(row => [row.dayCode, row]));
        return WEEK_DAY_CODES.map(dayCode => {
            const date = dateForDayCodeThisWeek(dayCode);
            const eth = getEthiopianDateDetails(date);
            const row = byDay.get(dayCode) ?? null;
            const window = row
                ? formatWindowLabel(row.startLocalTime, row.endLocalTime)
                : null;
            const isToday = dayCode === todayDayCode;
            return { dayCode, date, eth, row, window, isToday };
        });
    }, [weeklyPlan, todayDayCode]);

    function shiftErrorMessage(error: unknown) {
        if (error && typeof error === "object" && "data" in error) {
            const data = (
                error as {
                    data?: {
                        code?: string;
                        message?: string;
                        errors?: { shift?: string };
                        openTables?: number;
                    };
                }
            ).data;
            if (data?.errors?.shift === "openTables") {
                const count = data.openTables ?? 0;
                return count === 1
                    ? t("closeOpenTableBeforeOut", { count })
                    : t("closeOpenTablesBeforeOut", { count });
            }
            if (data?.errors?.shift === "alreadyClosed") {
                return t("shiftAlreadyClosed");
            }
            if (data?.errors?.shift === "noAssignmentToday") {
                return t("noShiftToday");
            }
            if (data?.errors?.shift === "outsideWindow") {
                return data.message?.trim() || t("shiftOutsideWindow");
            }
            if (data?.code === "NO_SHIFT_TODAY") {
                return t("noShiftToday");
            }
            if (data?.code === "SHIFT_OUTSIDE_WINDOW") {
                return data.message?.trim() || t("shiftOutsideWindow");
            }
            if (data?.errors && "version" in data.errors) {
                return t("shiftChangedRefresh");
            }
        }
        return t("couldNotUpdateShift");
    }

    async function handleClockIn() {
        setActionError("");
        try {
            // Let the server resolve today's assigned window — do not force a
            // stale/upcoming assignment id from another day.
            await clockIn({}).unwrap();
        } catch (error) {
            setActionError(shiftErrorMessage(error));
        }
    }

    async function handleClockOut() {
        if (!session) return;
        setActionError("");
        try {
            await clockOut({
                shiftSessionId: session.id,
                expectedVersion: session.version,
            }).unwrap();
        } catch (error) {
            setActionError(shiftErrorMessage(error));
        }
    }

    return (
        <DashboardFrame>
            <div className="space-y-6 animate-in fade-in duration-200">
                <PageHeader
                    compact
                    eyebrow="Shift"
                    title={clockedIn ? "On the floor" : "Off the clock"}
                    description={
                        clockedIn
                            ? t("clockedInDesc", { name: staffName })
                            : t("notClockedInDesc", { name: staffName })
                    }
                />

                <div className="flex flex-col gap-4 rounded-[20px] border border-hairline bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-secondary">
                                <img
                                    src={getStaffAvatarUrl(staff?.name)}
                                    alt={staff?.name || "Staff avatar"}
                                    className="size-full object-cover"
                                />
                                <span
                                    className={cn(
                                        "absolute top-0.5 right-0.5 size-3 rounded-full ring-2 ring-card",
                                        clockedIn
                                            ? "bg-emerald-500"
                                            : "bg-slate-400",
                                    )}
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[17px] font-normal text-foreground">
                                        {staff?.name}
                                    </p>
                                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-normal text-primary">
                                        {t("server")}
                                    </span>
                                </div>
                                <p className="text-[13px] text-slate-gray">
                                    {staff?.phone || t("floorStaff")}
                                </p>
                            </div>
                        </div>

                        <Badge
                            variant={
                                clockedIn
                                    ? tablesOpen
                                        ? "warning"
                                        : "success"
                                    : "secondary"
                            }
                            className="font-normal"
                        >
                            {!clockedIn
                                ? t("clockedOut")
                                : tablesOpen
                                  ? t("tablesActive", {
                                        count: summary.openTables,
                                    })
                                  : t("readyToClockOut")}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border-t border-hairline pt-3.5 text-[13px]">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                                {t("todayDate")}
                            </p>
                            <p className="mt-0.5 font-normal text-foreground">
                                {gregToday}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {isAmharic
                                    ? ethToday.formattedAm
                                    : ethToday.formattedEn}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                                {t("assignedShift")}
                            </p>
                            <p className="mt-0.5 font-normal text-foreground">
                                {assignedShiftName}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {plannedWindow?.greg ?? "—"}
                            </p>
                            {plannedWindow ? (
                                <p className="text-[12px] text-slate-gray">
                                    {plannedWindow.eth}
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray flex items-center gap-1">
                                <UtensilsCrossed className="size-3" />
                                {t("shiftTables")}
                            </p>
                            {todayTables.length > 0 ? (
                                <div className="mt-1 space-y-1">
                                    <div className="flex flex-wrap gap-1">
                                        {todayTables.map(t => (
                                            <span
                                                key={t.tableId}
                                                className="inline-flex items-center gap-1 rounded-md border border-hairline bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                                                title={`${t.displayName} (${t.locationName})`}
                                            >
                                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                                {t.displayNumber ||
                                                    t.displayName}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-gray">
                                        {todayTables.length} table
                                        {todayTables.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-0.5 text-[12px] text-slate-gray">
                                    {t("noTablesAssigned")}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="font-normal text-foreground">
                                {t("clockIn")}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {formatClock(session?.clockInAt)}
                            </p>
                        </div>
                        <div>
                            <p className="font-normal text-foreground">
                                {t("clockOut")}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {formatClock(session?.clockOutAt)}
                            </p>
                        </div>
                    </div>

                    {actionError ? (
                        <div className="flex flex-col gap-1 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[13px] text-destructive">
                            <p className="font-normal">{actionError}</p>
                            {tablesOpen && (
                                <button
                                    type="button"
                                    onClick={() => setOpenHandover(true)}
                                    className="mt-1 self-start inline-flex items-center gap-1.5 text-xs font-normal underline hover:opacity-80 cursor-pointer"
                                >
                                    <ArrowRightLeft className="size-3.5" />
                                    Hand over active tables & cash to next
                                    waiter instead
                                </button>
                            )}
                        </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                        {clockedIn ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={handleClockOut}
                                    className="font-normal"
                                >
                                    <LogOut className="size-4" />
                                    {clockingOut
                                        ? t("clockingOut")
                                        : t("clockOut")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={() => setOpenHandover(true)}
                                    className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 font-normal"
                                >
                                    <ArrowRightLeft className="size-4" />
                                    Handover Shift to Next Waiter
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                disabled={busy}
                                onClick={handleClockIn}
                                className="font-normal"
                            >
                                <LogIn className="size-4" />
                                {clockingIn ? t("clockingIn") : t("clockIn")}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Assigned Tables for Today's Shift Card Grid */}
                {todayTables.length > 0 ? (
                    <div className="rounded-[20px] border border-hairline bg-card p-5">
                        <div className="mb-3.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <UtensilsCrossed className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-medium text-foreground">
                                        {t("assignedTablesForShift", {
                                            shift: assignedShiftName,
                                        })}
                                    </p>
                                    <p className="text-[11px] text-slate-gray">
                                        {t("assignedTablesHint", {
                                            count: todayTables.length,
                                        })}{" "}
                                        ({todayDayCode})
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/waiter/tables"
                                className="text-[12px] font-medium text-foreground hover:underline cursor-pointer"
                            >
                                {t("viewOnFloor")} →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {todayTables.map(t => {
                                const liveTable = myTables.find(
                                    mt => mt.tableId === t.tableId,
                                );
                                const hasActiveSession = Boolean(
                                    liveTable?.tableSessionId,
                                );

                                return (
                                    <Link
                                        key={t.tableId}
                                        href={`/waiter/tables/${t.tableId}`}
                                        className="group flex flex-col justify-between rounded-xl border border-hairline bg-secondary/30 p-2.5 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-secondary/60 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-1.5">
                                            <span className="flex size-7 items-center justify-center rounded-lg bg-card border border-hairline text-[12px] font-bold text-foreground group-hover:bg-muted">
                                                {t.displayNumber ||
                                                    t.displayName}
                                            </span>
                                            <span
                                                className={cn(
                                                    "size-2 rounded-full mt-1 shrink-0",
                                                    hasActiveSession
                                                        ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                                                        : "bg-slate-300 dark:bg-slate-600",
                                                )}
                                                title={
                                                    hasActiveSession
                                                        ? "Active order in progress"
                                                        : "Free table"
                                                }
                                            />
                                        </div>
                                        <div className="mt-2 min-w-0">
                                            <p className="truncate text-[11px] font-medium text-foreground">
                                                {t.displayName}
                                            </p>
                                            <p className="truncate text-[10px] text-slate-gray">
                                                {t.locationName}
                                            </p>
                                        </div>
                                        <div className="mt-2 border-t border-hairline/60 pt-1 text-[10px]">
                                            {hasActiveSession ? (
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    Active (
                                                    {liveTable?.guestCount ?? 1}{" "}
                                                    guests)
                                                </span>
                                            ) : (
                                                <span className="text-slate-gray">
                                                    Available
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                <div className="rounded-[16px] border border-hairline bg-card p-3 sm:p-4">
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[13px] font-medium text-foreground">
                                {t("myAssignedShifts")}
                            </p>
                            <p className="text-[11px] text-slate-gray">
                                {t("myAssignedShiftsHint")}
                            </p>
                        </div>
                        <CalendarDays className="size-3.5 text-slate-gray" />
                    </div>

                    {weeklyPlan.length > 0 || upcomingAssignments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-hairline">
                                        {weekCells.map(cell => (
                                            <th
                                                key={cell.dayCode}
                                                className={cn(
                                                    "px-1.5 py-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-gray",
                                                    cell.isToday &&
                                                        "text-brand",
                                                )}
                                            >
                                                <span className="block">
                                                    {dayLabel(
                                                        cell.dayCode,
                                                        isAmharic,
                                                    )}
                                                </span>
                                                <span className="block font-normal normal-case tracking-normal text-[10px] text-slate-gray">
                                                    {cell.date.getDate()}{" "}
                                                    {isAmharic
                                                        ? cell.eth.monthNameAm
                                                        : cell.eth.monthNameEn}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {weekCells.map(cell => (
                                            <td
                                                key={cell.dayCode}
                                                className={cn(
                                                    "align-top border-r border-hairline px-1.5 py-2 last:border-r-0",
                                                    cell.isToday &&
                                                        "bg-brand/5",
                                                )}
                                            >
                                                {cell.row ? (
                                                    <div className="space-y-1.5">
                                                        <div className="space-y-0.5">
                                                            <p className="text-[11px] font-medium leading-snug text-foreground">
                                                                {
                                                                    cell.row
                                                                        .definitionName
                                                                }
                                                            </p>
                                                            <p className="text-[10px] leading-snug text-slate-gray">
                                                                {
                                                                    cell.window
                                                                        ?.greg
                                                                }
                                                            </p>
                                                            <p className="text-[10px] leading-snug text-slate-gray">
                                                                {
                                                                    cell.window
                                                                        ?.eth
                                                                }
                                                            </p>
                                                        </div>

                                                        {/* Tables assigned for this day's shift */}
                                                        {cell.row.tables &&
                                                        cell.row.tables.length >
                                                            0 ? (
                                                            <div className="border-t border-hairline/60 pt-1.5 space-y-1">
                                                                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-gray">
                                                                    <UtensilsCrossed className="size-2.5" />
                                                                    <span>
                                                                        {
                                                                            cell
                                                                                .row
                                                                                .tables
                                                                                .length
                                                                        }{" "}
                                                                        tbl
                                                                        {cell
                                                                            .row
                                                                            .tables
                                                                            .length ===
                                                                        1
                                                                            ? ""
                                                                            : "s"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {cell.row.tables.map(
                                                                        t => (
                                                                            <span
                                                                                key={
                                                                                    t.tableId
                                                                                }
                                                                                className="inline-flex items-center rounded-md border border-hairline bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-foreground"
                                                                                title={`${t.displayName} (${t.locationName})`}
                                                                            >
                                                                                {t.displayNumber ||
                                                                                    t.displayName}
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="border-t border-hairline/60 pt-1">
                                                                <span className="text-[10px] text-slate-gray/60 italic">
                                                                    {t(
                                                                        "noTablesAssigned",
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-slate-gray/70">
                                                        —
                                                    </p>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-[12px] text-slate-gray">
                            {t("noAssignedShifts")}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MetricCard
                        label={t("openTables")}
                        value={String(summary.openTables)}
                        hint={t("yourActiveCovers")}
                        icon={LayoutGrid}
                    />
                    <MetricCard
                        label={t("sales")}
                        value={formatEtb(summary.sales)}
                        hint={t("openTicketsHint")}
                        icon={Wallet}
                        accent
                    />
                    <MetricCard
                        label={t("readyShort")}
                        value={String(summary.readyCount)}
                        hint={t("waitingToServe")}
                        icon={Bell}
                    />
                    <MetricCard
                        label={t("stillCooking")}
                        value={String(summary.cookingCount)}
                        hint={t("stillAtStation")}
                        icon={Flame}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <Link
                        href="/waiter/tables"
                        className="rounded-[20px] border border-hairline bg-card p-5 transition-colors hover:bg-secondary/40"
                    >
                        <p className="text-[13px] font-normal text-slate-gray">
                            {t("floorLink")}
                        </p>
                        <p className="mt-1 text-[16px] font-normal text-foreground">
                            {t("openTables")}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {t("floorLinkDesc")}
                        </p>
                    </Link>
                    <Link
                        href="/waiter/ready"
                        className="rounded-[20px] border border-hairline bg-card p-5 transition-colors hover:bg-secondary/40"
                    >
                        <p className="text-[13px] font-normal text-slate-gray">
                            {t("serviceLink")}
                        </p>
                        <p className="mt-1 text-[16px] font-normal text-foreground">
                            {t("readyTickets")}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {summary.readyCount > 0
                                ? summary.readyCount === 1
                                    ? t("dishReadyToRun", {
                                          count: summary.readyCount,
                                      })
                                    : t("dishesReadyToRun", {
                                          count: summary.readyCount,
                                      })
                                : t("nothingWaiting")}
                        </p>
                    </Link>
                </div>

                <div className="flex items-start gap-3 rounded-[20px] border border-hairline bg-card p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                        <Wallet className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-normal text-foreground">
                            {t("cashOnYou")}
                        </p>
                        <p className="mt-1 text-[14px] text-slate-gray">
                            {t("cashOnYouHint", {
                                amount: formatEtb(cashOnHand),
                            })}
                        </p>
                        <Link
                            href="/waiter/cash"
                            className="mt-3 inline-flex text-[14px] font-normal text-brand hover:underline"
                        >
                            {t("dropCashLink")}
                        </Link>
                    </div>
                </div>

                {/* Handover Modal */}
                <WaiterHandoverModal
                    isOpen={openHandover}
                    onClose={() => setOpenHandover(false)}
                    currentVersion={session?.version ?? 1}
                    openTablesCount={summary.openTables}
                    openTablesNames={myTables
                        .filter(table => Boolean(table.tableSessionId))
                        .map(
                            table =>
                                table.displayName || `Table ${table.tableId}`,
                        )}
                    cashOnHand={cashOnHand}
                />
            </div>
        </DashboardFrame>
    );
}
