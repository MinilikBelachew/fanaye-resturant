"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ArrowRightLeft,
    CheckCircle2,
    Clock3,
    LogIn,
    LogOut,
    UserCheck,
    X,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import { useWaiterCashSummaryQuery } from "@/context/services/cashApi";
import { useWaiterTablesQuery } from "@/context/services/floorApi";
import {
    useClockInMutation,
    useClockOutMutation,
    useCurrentShiftQuery,
} from "@/context/services/shiftsApi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";
import CashierHandoverModal from "@/domains/payments/ui/CashierHandoverModal";
import WaiterHandoverModal from "@/domains/ordering/ui/WaiterHandoverModal";
import { checkShiftExpiry } from "@/domains/identity/domain/shift";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function formatElapsed(clockInAt: string): string {
    const diff = Math.max(0, Date.now() - new Date(clockInAt).getTime());
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

export default function ShiftTopBarPill() {
    const staff = useAppSelector(selectCurrentStaff);
    const hasSession = useAppSelector(state => Boolean(state.identity.session));
    const pollMs = useRealtimePollMs(15_000);
    const { data: shift, isFetching } = useCurrentShiftQuery(undefined, {
        skip: !hasSession,
        pollingInterval: pollMs || 30_000,
    });
    const [clockIn, { isLoading: clockingIn }] = useClockInMutation();
    const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();

    const [now, setNow] = useState(Date.now());
    const [openMenu, setOpenMenu] = useState(false);
    const [openHandover, setOpenHandover] = useState(false);
    const [openWaiterHandover, setOpenWaiterHandover] = useState(false);

    // Keep timer ticking every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const clockedIn = Boolean(shift?.clockedIn && shift?.shiftSession);
    const session = shift?.shiftSession ?? null;
    const isCashier = staff?.role === "cashier";
    const isWaiter = staff?.role === "waiter";

    const { data: floor } = useWaiterTablesQuery("my", {
        skip: !isWaiter || !clockedIn,
        pollingInterval: pollMs || 20_000,
    });
    const { data: cashSummary } = useWaiterCashSummaryQuery(undefined, {
        skip: !isWaiter || !clockedIn,
        pollingInterval: pollMs || 20_000,
    });
    const myTables = floor?.data ?? [];
    const activeTables = myTables.filter(t => Boolean(t.tableSessionId));
    const openTablesCount = activeTables.length;
    const openTablesNames = activeTables.map(
        t => t.displayName || `Table ${t.tableId}`,
    );
    const cashOnHand = Number(cashSummary?.undroppedCash ?? 0);

    const shiftExpiry = useMemo(
        () => checkShiftExpiry(session, now),
        [session, now],
    );

    const elapsed = useMemo(() => {
        if (!session?.clockInAt) return "";
        return formatElapsed(session.clockInAt);
    }, [session?.clockInAt, now]);

    if (!staff || !hasSession) return null;

    const handleClockIn = async () => {
        try {
            await clockIn().unwrap();
            toast.success("Clocked in successfully.");
            setOpenMenu(false);
        } catch {
            toast.error("Failed to clock in. Please check your connection.");
        }
    };

    const handleClockOut = async () => {
        if (!session) return;
        try {
            await clockOut({
                shiftSessionId: session.id,
                expectedVersion: session.version,
            }).unwrap();
            toast.success("Clocked out successfully.");
            setOpenMenu(false);
        } catch (err: unknown) {
            const data = (
                err as {
                    data?: { errors?: { shift?: string }; openTables?: number };
                }
            )?.data;
            if (data?.errors?.shift === "drawerOpen") {
                toast.error(
                    "Cash drawer has un-reconciled cash. Please perform a handover or reconcile before clocking out.",
                );
            } else if (data?.errors?.shift === "openTables") {
                toast.error(
                    `You have ${data.openTables ?? 0} open tables. Close or reassign tables before clocking out.`,
                );
            } else {
                toast.error(
                    "Cannot clock out yet. Please verify your shift status.",
                );
            }
        }
    };

    return (
        <>
            <div className="relative">
                {/* Top Bar Trigger Button */}
                {clockedIn ? (
                    <button
                        type="button"
                        onClick={() => setOpenMenu(prev => !prev)}
                        className={cn(
                            "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-normal transition-all cursor-pointer",
                            shiftExpiry.isPast
                                ? "border-rose-400/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
                        )}
                        aria-label="Shift details"
                    >
                        <span className="relative flex size-2">
                            <span
                                className={cn(
                                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                                    shiftExpiry.isPast
                                        ? "bg-rose-400"
                                        : "bg-emerald-400",
                                )}
                            />
                            <span
                                className={cn(
                                    "relative inline-flex size-2 rounded-full",
                                    shiftExpiry.isPast
                                        ? "bg-rose-500"
                                        : "bg-emerald-500",
                                )}
                            />
                        </span>
                        {/* Desktop label */}
                        <span className="hidden sm:inline font-normal">
                            {session?.definitionName || "Shift"}
                        </span>
                        <span className="hidden sm:inline text-muted-foreground/60">
                            ·
                        </span>
                        {shiftExpiry.isPast ? (
                            <span className="font-mono text-[11px] font-normal text-rose-600 dark:text-rose-400">
                                {shiftExpiry.endTime === ">14h"
                                    ? `Overdue (${elapsed})`
                                    : `Shift Ended (${shiftExpiry.minutesOverdue}m)`}
                            </span>
                        ) : (
                            <span className="font-mono text-[11px] font-normal tabular-nums">
                                {elapsed}
                            </span>
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setOpenMenu(prev => !prev)}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                            "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20",
                        )}
                        aria-label="Shift off the clock"
                    >
                        <span className="size-2 rounded-full bg-amber-500" />
                        <span className="hidden sm:inline font-semibold">
                            Off Clock
                        </span>
                        <span className="sm:hidden font-mono text-[11px]">
                            Off
                        </span>
                    </button>
                )}

                {/* Dropdown / Popover Menu */}
                {openMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-border bg-card p-4 shadow-2xl text-xs animate-in zoom-in-95 duration-150">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3">
                                <div>
                                    <p className="font-bold text-foreground text-sm">
                                        {clockedIn
                                            ? "Shift in Progress"
                                            : "Off the Clock"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {staff.name} ({staff.role})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOpenMenu(false)}
                                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Details */}
                            {clockedIn ? (
                                <div className="space-y-3">
                                    {shiftExpiry.isPast && (
                                        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/40 p-2.5 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-2 font-normal">
                                            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                                            <span>
                                                {shiftExpiry.endTime === ">14h"
                                                    ? `This shift has been running for ${elapsed} (clocked in on ${new Date(session?.clockInAt || "").toLocaleDateString()}). Please clock out or complete a handover to close it.`
                                                    : `Scheduled shift ended at ${shiftExpiry.endTime} (${shiftExpiry.minutesOverdue}m overdue). Please hand over or clock out.`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="rounded-xl border border-border bg-muted/30 p-2.5 space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Started at:
                                            </span>
                                            <span className="font-normal text-foreground">
                                                {session?.clockInAt
                                                    ? new Date(
                                                          session.clockInAt,
                                                      ).toLocaleTimeString([], {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      })
                                                    : "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Duration:
                                            </span>
                                            <span
                                                className={cn(
                                                    "font-normal",
                                                    shiftExpiry.isPast
                                                        ? "text-rose-600 dark:text-rose-400"
                                                        : "text-emerald-600 dark:text-emerald-400",
                                                )}
                                            >
                                                {elapsed}
                                            </span>
                                        </div>
                                        {session?.definitionName && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Schedule:
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    {session.definitionName}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-2 pt-1">
                                        {isCashier && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenMenu(false);
                                                        setOpenHandover(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                                                >
                                                    <ArrowRightLeft className="size-3.5" />
                                                    Handover to Next Cashier
                                                </button>
                                                <Link
                                                    href="/cashier/shift"
                                                    onClick={() =>
                                                        setOpenMenu(false)
                                                    }
                                                    className="w-full flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors text-center"
                                                >
                                                    Go to Cash Desk Page
                                                </Link>
                                            </>
                                        )}

                                        {isWaiter && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenMenu(false);
                                                        setOpenWaiterHandover(
                                                            true,
                                                        );
                                                    }}
                                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                                                >
                                                    <ArrowRightLeft className="size-3.5" />
                                                    Handover to Next Waiter
                                                </button>
                                                <Link
                                                    href="/waiter/shift"
                                                    onClick={() =>
                                                        setOpenMenu(false)
                                                    }
                                                    className="w-full flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors text-center"
                                                >
                                                    View Waiter Shift Details
                                                </Link>
                                            </>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleClockOut}
                                            disabled={clockingOut}
                                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            <LogOut className="size-3.5" />
                                            {clockingOut
                                                ? "Clocking Out..."
                                                : "Clock Out"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        You are not currently clocked in. Clock
                                        in to begin your shift and activate
                                        floor/desk duties.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleClockIn}
                                        disabled={clockingIn || isFetching}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        <LogIn className="size-3.5" />
                                        {clockingIn
                                            ? "Clocking In..."
                                            : "Clock In Now"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Handover Modals */}
            <CashierHandoverModal
                isOpen={openHandover}
                onClose={() => setOpenHandover(false)}
                currentVersion={session?.version ?? 1}
            />
            <WaiterHandoverModal
                isOpen={openWaiterHandover}
                onClose={() => setOpenWaiterHandover(false)}
                currentVersion={session?.version ?? 1}
                openTablesCount={openTablesCount}
                openTablesNames={openTablesNames}
                cashOnHand={cashOnHand}
            />
        </>
    );
}
