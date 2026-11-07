"use client";

import {
    ArrowRight,
    ArrowRightLeft,
    Calendar,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    Globe,
    LogIn,
    LogOut,
    Wallet,
    Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CashierHandoverModal from "@/domains/payments/ui/CashierHandoverModal";
import { useLocale, useTranslations } from "next-intl";
import { useAppSelector } from "@/context/hooks";
import { useCashierCashDropsQuery } from "@/context/services/cashApi";
import { useReconciliationPreviewQuery } from "@/context/services/reconciliationApi";
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
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getStaffAvatarUrl } from "@/lib/avatars";
import {
    type CalendarMode,
    ETHIOPIAN_DAYS,
    formatEthiopianLocalTime,
    getEthiopianDateDetails,
    getSavedCalendarMode,
    setSavedCalendarMode,
} from "@/lib/ethiopian-calendar";
import {
    format12HourTime,
    formatEthiopianShiftRange,
} from "@/domains/identity/domain/shift";

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
    const offset = (d.getDay() + 6) % 7;
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    return d;
}

function dateForDayCode(dayCode: string, weekStart = mondayOfWeek()) {
    const index = WEEK_DAY_CODES.indexOf(
        dayCode as (typeof WEEK_DAY_CODES)[number],
    );
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + (index >= 0 ? index : 0));
    return d;
}

function formatClock(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type DeskPhase =
    | "off"
    | "awaiting_drops"
    | "needs_reconcile"
    | "pending_review"
    | "ready_out";

export default function CashierShiftPage() {
    const t = useTranslations("cashier");
    const tCommon = useTranslations("common");
    const tRoles = useTranslations("roleLabels");
    const locale = useLocale();
    const isAmharic = locale.startsWith("am");
    const [calendarMode, setCalendarMode] = useState<CalendarMode>(
        getSavedCalendarMode(),
    );

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<CalendarMode>).detail;
            if (detail === "ETHIOPIAN" || detail === "GREGORIAN")
                setCalendarMode(detail);
        };
        window.addEventListener("calendar_mode_changed", handler);
        return () =>
            window.removeEventListener("calendar_mode_changed", handler);
    }, []);

    const staff = useAppSelector(selectCurrentStaff);
    const hasSession = useAppSelector(state => Boolean(state.identity.session));
    const { data: shift, isFetching } = useCurrentShiftQuery(undefined, {
        skip: !hasSession,
    });
    const [clockIn, { isLoading: clockingIn }] = useClockInMutation();
    const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();
    const [actionError, setActionError] = useState("");
    const [openHandover, setOpenHandover] = useState(false);
    const clockedIn = Boolean(shift?.clockedIn && shift.shiftSession);
    const { data: recon } = useReconciliationPreviewQuery(undefined, {
        skip: !hasSession || !clockedIn,
        pollingInterval: 8000,
    });
    const { data: drops } = useCashierCashDropsQuery(
        { status: "INITIATED" },
        {
            skip: !hasSession || !clockedIn,
            pollingInterval: 8000,
        },
    );

    const session = shift?.shiftSession ?? null;
    const upcoming = shift?.upcomingAssignment ?? null;
    const weeklyPlan = shift?.weeklyPlan ?? [];
    const busy = clockingIn || clockingOut || isFetching;

    // Weekly schedule helpers
    const today = useMemo(() => new Date(), []);
    const todayDayCode = WEEK_DAY_CODES[(today.getDay() + 6) % 7];

    const weekCells = useMemo(() => {
        const byDay = new Map(weeklyPlan.map(row => [row.dayCode, row]));
        return WEEK_DAY_CODES.map(dayCode => {
            const date = dateForDayCode(dayCode);
            const eth = getEthiopianDateDetails(date);
            const row = byDay.get(dayCode) ?? null;
            const isToday = dayCode === todayDayCode;
            const gregLabel = date.toLocaleDateString(
                isAmharic ? "am-ET" : "en-US",
                { month: "short", day: "numeric" },
            );
            const ethLabel = `${isAmharic ? eth.monthNameAm : eth.monthNameEn} ${eth.date}`;
            return { dayCode, date, eth, row, isToday, gregLabel, ethLabel };
        });
    }, [weeklyPlan, todayDayCode, isAmharic]);
    const preview = recon?.data;
    const pendingDrops = drops?.data?.length ?? 0;
    const expected = Number(preview?.expectedCash ?? 0);
    const float = Number(preview?.openingFloat ?? 0);
    const dropsReceived = Number(preview?.cashDropsReceived ?? 0);
    const reconStatus = preview?.existingStatus ?? null;
    const needsResubmit = Boolean(preview?.needsResubmit);
    const reconciled = Boolean(
        reconStatus &&
            ["RECONCILED", "APPROVED", "SUBMITTED"].includes(reconStatus) &&
            !needsResubmit,
    );
    const pendingReview =
        !needsResubmit &&
        (reconStatus === "PENDING_REVIEW" ||
            reconStatus === "RECONCILIATION_PENDING" ||
            reconStatus === "SUBMITTED_FOR_REVIEW");

    const phase: DeskPhase = !clockedIn
        ? "off"
        : pendingDrops > 0
          ? "awaiting_drops"
          : needsResubmit
            ? "needs_reconcile"
            : pendingReview
              ? "pending_review"
              : reconciled || expected === 0
                ? "ready_out"
                : "needs_reconcile";

    function shiftErrorMessage(error: unknown) {
        if (error && typeof error === "object" && "data" in error) {
            const data = (
                error as {
                    data?: {
                        message?: string;
                        code?: string;
                        errors?: { shift?: string };
                        cashierName?: string;
                        openTables?: number;
                    };
                }
            ).data;
            if (data?.code === "CASHIER_DRAWER_ALREADY_OPEN" && data.message) {
                return data.message;
            }
            if (data?.errors?.shift === "openTables") {
                return t("closeOpenTables", { count: data.openTables ?? 0 });
            }
            if (data?.errors?.shift === "drawerOpen") {
                return t("reconcileBeforeClockOut");
            }
            if (data?.errors?.shift === "drawerStale") {
                return t("moreCashAfterCount");
            }
            if (data?.errors?.shift === "drawerPending") {
                return t("drawerPendingReview");
            }
            if (data?.errors?.shift === "alreadyClosed") {
                return t("shiftAlreadyClosed");
            }
            if (data?.errors && "version" in data.errors) {
                return t("shiftChangedRefresh");
            }
            if (data?.message && typeof data.message === "string") {
                return data.message;
            }
        }
        return t("couldNotUpdateShift");
    }

    const phaseCopy: Record<
        DeskPhase,
        {
            badge: string;
            badgeVariant: "secondary" | "warning" | "success";
            next: string;
        }
    > = {
        off: {
            badge: t("clockedOut"),
            badgeVariant: "secondary",
            next: t("clockInToOpenDrawer"),
        },
        awaiting_drops: {
            badge: t("dropsWaiting", { count: pendingDrops }),
            badgeVariant: "warning",
            next: t("countReceiveDropsFirst"),
        },
        needs_reconcile: {
            badge: needsResubmit ? t("recountNeeded") : t("drawerOpen"),
            badgeVariant: "warning",
            next: needsResubmit
                ? t("recountAfterCash")
                : t("countBeforeClockOut"),
        },
        pending_review: {
            badge: t("awaitingReview"),
            badgeVariant: "warning",
            next: t("reconInManagerClear"),
        },
        ready_out: {
            badge: reconciled ? t("drawerReconciled") : t("readyToClockOut"),
            badgeVariant: "success",
            next: t("deskClearClockOut"),
        },
    };

    async function handleClockIn() {
        setActionError("");
        try {
            await clockIn(
                upcoming?.id ? { shiftAssignmentId: upcoming.id } : {},
            ).unwrap();
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

    const shiftLabel =
        session?.definitionName || upcoming?.definitionName || t("assignment");

    return (
        <DashboardFrame>
            <div className="space-y-5 animate-in fade-in duration-200">
                <PageHeader
                    compact
                    eyebrow="Shift"
                    title={clockedIn ? "Cash desk" : "Off the clock"}
                    description={
                        clockedIn ? t("cashDeskDesc") : t("offTheClockDesc")
                    }
                />

                <article className="overflow-hidden rounded-[20px] border border-hairline bg-card">
                    <div
                        className={cn(
                            "border-b border-hairline px-5 py-4 sm:px-6",
                            clockedIn
                                ? "bg-[linear-gradient(135deg,rgba(232,93,4,0.08),transparent_55%)]"
                                : "bg-secondary/40",
                        )}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                                <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-secondary">
                                    <img
                                        src={getStaffAvatarUrl(staff?.name)}
                                        alt={staff?.name || "Cashier"}
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
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[17px] font-normal tracking-tight text-foreground">
                                            {staff?.name ?? tCommon("cashier")}
                                        </p>
                                        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-normal text-brand">
                                            {tRoles.has("cashier")
                                                ? tRoles("cashier")
                                                : tCommon("cashier")}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[13px] text-slate-gray">
                                        {staff?.phone || t("cashDesk")}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant={phaseCopy[phase].badgeVariant}
                                className="font-normal"
                            >
                                {phaseCopy[phase].badge}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4 px-5 py-5 sm:px-6">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-[13px]">
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.06em] text-slate-gray uppercase">
                                    {t("assignment")}
                                </p>
                                <p className="mt-1 font-normal text-foreground">
                                    {shiftLabel}
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    {formatClock(
                                        session?.scheduledStartAt ??
                                            upcoming?.scheduledStartAt,
                                    )}
                                    {" – "}
                                    {formatClock(
                                        session?.scheduledEndAt ??
                                            upcoming?.scheduledEndAt,
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.06em] text-slate-gray uppercase">
                                    {t("clockIn")}
                                </p>
                                <p className="mt-1 font-normal text-foreground">
                                    {formatClock(session?.clockInAt)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.06em] text-slate-gray uppercase">
                                    {t("clockOut")}
                                </p>
                                <p className="mt-1 font-normal text-foreground">
                                    {formatClock(session?.clockOutAt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-[14px] border border-hairline bg-secondary/35 px-3.5 py-3">
                            {phase === "ready_out" ? (
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            ) : (
                                <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand" />
                            )}
                            <p className="text-[13px] leading-snug text-foreground">
                                {phaseCopy[phase].next}
                            </p>
                        </div>

                        {actionError ? (
                            <p className="text-[13px] text-red-600">
                                {actionError}
                            </p>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                            {clockedIn ? (
                                <>
                                    {phase === "awaiting_drops" ? (
                                        <Button asChild>
                                            <Link href="/cashier/cash-drops">
                                                <Warehouse className="size-4" />
                                                {t("receiveDrops")}
                                            </Link>
                                        </Button>
                                    ) : null}
                                    {phase === "needs_reconcile" ? (
                                        <Button asChild>
                                            <Link href="/cashier/reconciliation">
                                                <CreditCard className="size-4" />
                                                {t("reconcileDrawer")}
                                            </Link>
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant={
                                            phase === "ready_out"
                                                ? "default"
                                                : "outline"
                                        }
                                        disabled={busy}
                                        onClick={handleClockOut}
                                    >
                                        <LogOut className="size-4" />
                                        {clockingOut
                                            ? t("clockingOut")
                                            : t("clockOut")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-brand/40 text-brand hover:bg-brand/10 hover:text-brand"
                                        disabled={busy}
                                        onClick={() => setOpenHandover(true)}
                                    >
                                        <ArrowRightLeft className="size-4" />
                                        Handover to Next Cashier
                                    </Button>
                                    {phase !== "awaiting_drops" ? (
                                        <Button variant="outline" asChild>
                                            <Link href="/cashier/cash-drops">
                                                <Warehouse className="size-4" />
                                                {t("metricCashDrops")}
                                            </Link>
                                        </Button>
                                    ) : null}
                                    {phase !== "needs_reconcile" ? (
                                        <Button variant="outline" asChild>
                                            <Link href="/cashier/reconciliation">
                                                <CreditCard className="size-4" />
                                                {t("reconcile")}
                                            </Link>
                                        </Button>
                                    ) : null}
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleClockIn}
                                >
                                    <LogIn className="size-4" />
                                    {clockingIn
                                        ? t("clockingIn")
                                        : t("clockIn")}
                                </Button>
                            )}
                        </div>
                    </div>
                </article>

                {clockedIn ? (
                    <>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[20px] border border-hairline bg-card p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[12px] font-medium tracking-[0.06em] text-slate-gray uppercase">
                                        {t("expectedInDrawer")}
                                    </p>
                                    <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                                        <Wallet className="size-4" />
                                    </span>
                                </div>
                                <p className="mt-2 text-[22px] font-normal tracking-tight text-brand">
                                    {formatEtb(expected)}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("floatPlusDrops", {
                                        float: formatEtb(float),
                                        drops: formatEtb(dropsReceived),
                                    })}
                                </p>
                            </div>

                            <div className="rounded-[20px] border border-hairline bg-card p-4">
                                <p className="text-[12px] text-slate-gray">
                                    {t("openingFloat")}
                                </p>
                                <p className="mt-2 text-[22px] font-normal tracking-tight">
                                    {formatEtb(float)}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("fixedAtZero")}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    "rounded-[20px] border border-hairline bg-card p-4",
                                    pendingDrops > 0 &&
                                        "border-amber-300/70 bg-amber-50/50 dark:bg-amber-950/20",
                                )}
                            >
                                <p className="text-[12px] text-slate-gray">
                                    {t("pendingDrops")}
                                </p>
                                <p className="mt-2 text-[22px] font-normal tracking-tight">
                                    {pendingDrops}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("awaitingYourCount")}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Link
                                href="/cashier/cash-drops"
                                className="group rounded-[18px] border border-hairline bg-card p-4 transition-colors hover:bg-secondary/45"
                            >
                                <div className="flex items-center justify-between">
                                    <Warehouse className="size-4 text-slate-gray" />
                                    <ArrowRight className="size-3.5 text-slate-gray opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="mt-3 text-[15px] font-normal">
                                    {t("metricCashDrops")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("receiveWaiterCustody")}
                                </p>
                            </Link>
                            <Link
                                href="/cashier/reconciliation"
                                className="group rounded-[18px] border border-hairline bg-card p-4 transition-colors hover:bg-secondary/45"
                            >
                                <div className="flex items-center justify-between">
                                    <CreditCard className="size-4 text-slate-gray" />
                                    <ArrowRight className="size-3.5 text-slate-gray opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="mt-3 text-[15px] font-normal">
                                    {t("reconcile")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("countVsExpected")}
                                </p>
                            </Link>
                            <Link
                                href="/cashier/daily-close"
                                className="group rounded-[18px] border border-hairline bg-card p-4 transition-colors hover:bg-secondary/45"
                            >
                                <div className="flex items-center justify-between">
                                    <ClipboardCheck className="size-4 text-slate-gray" />
                                    <ArrowRight className="size-3.5 text-slate-gray opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="mt-3 text-[15px] font-normal">
                                    {t("dailyClose")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("prepareTodaysDraft")}
                                </p>
                            </Link>
                        </div>
                    </>
                ) : null}
            </div>

            {clockedIn ? (
                <CashierHandoverModal
                    isOpen={openHandover}
                    onClose={() => setOpenHandover(false)}
                    currentVersion={session?.version ?? 1}
                    expectedCash={expected}
                />
            ) : null}

            {/* ── Weekly shift schedule ─────────────────────────────── */}
            {weeklyPlan.length > 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-[13px] font-medium text-foreground">
                                My weekly schedule
                            </p>
                            <p className="text-[11px] text-slate-gray">
                                Assigned shifts for this week
                            </p>
                        </div>
                        {/* Calendar mode toggle */}
                        <div className="inline-flex items-center rounded-lg border border-hairline bg-secondary/50 p-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setCalendarMode("ETHIOPIAN");
                                    setSavedCalendarMode("ETHIOPIAN");
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                                    calendarMode === "ETHIOPIAN"
                                        ? "bg-white dark:bg-card text-foreground shadow-xs"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                <span className="text-[10px]">🇪🇹</span>
                                Ethiopian
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCalendarMode("GREGORIAN");
                                    setSavedCalendarMode("GREGORIAN");
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                                    calendarMode === "GREGORIAN"
                                        ? "bg-white dark:bg-card text-foreground shadow-xs"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                <Globe className="size-3" />
                                Gregorian
                            </button>
                        </div>
                    </div>

                    {/* Scrollable on mobile, grid on larger screens */}
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
                        <div className="flex min-w-[480px] gap-1 sm:grid sm:min-w-0 sm:grid-cols-7">
                            {weekCells.map(cell => {
                                const hasShift = Boolean(cell.row);
                                const isActive = cell.isToday && clockedIn;

                                return (
                                    <div
                                        key={cell.dayCode}
                                        className={cn(
                                            "flex flex-1 flex-col items-center rounded-xl border p-2 text-center transition-colors",
                                            cell.isToday
                                                ? "border-brand/40 bg-brand/5"
                                                : hasShift
                                                  ? "border-hairline bg-card"
                                                  : "border-dashed border-hairline bg-secondary/30 opacity-60",
                                        )}
                                    >
                                        {/* Day name */}
                                        <p
                                            className={cn(
                                                "text-[10px] font-semibold uppercase tracking-[0.06em]",
                                                cell.isToday
                                                    ? "text-brand"
                                                    : "text-slate-gray",
                                            )}
                                        >
                                            {isAmharic
                                                ? (ETHIOPIAN_DAYS.find(
                                                      d =>
                                                          d.key ===
                                                          cell.dayCode,
                                                  )?.shortAm ?? cell.dayCode)
                                                : cell.dayCode}
                                        </p>

                                        {/* Date */}
                                        <p className="mt-0.5 text-[10px] text-slate-gray">
                                            {calendarMode === "ETHIOPIAN"
                                                ? cell.ethLabel
                                                : cell.gregLabel}
                                        </p>

                                        {/* Shift info */}
                                        {hasShift ? (
                                            <div className="mt-1.5 w-full space-y-1">
                                                <p className="truncate text-[10px] font-semibold text-foreground">
                                                    {cell.row!.definitionName}
                                                </p>
                                                <p className="text-[9px] leading-snug text-slate-gray break-words">
                                                    {calendarMode ===
                                                    "ETHIOPIAN"
                                                        ? formatEthiopianShiftRange(
                                                              cell.row!
                                                                  .startLocalTime,
                                                              cell.row!
                                                                  .endLocalTime,
                                                              isAmharic,
                                                          )
                                                        : `${format12HourTime(cell.row!.startLocalTime)}–${format12HourTime(cell.row!.endLocalTime)}`}
                                                </p>
                                                {isActive ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-600">
                                                        <span className="size-1 rounded-full bg-emerald-500" />
                                                        Active
                                                    </span>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <p className="mt-1.5 text-[10px] text-slate-gray">
                                                Off
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}
        </DashboardFrame>
    );
}
