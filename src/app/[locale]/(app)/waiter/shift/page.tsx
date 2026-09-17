"use client";

import { Bell, Flame, LayoutGrid, LogIn, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "@/context/hooks";
import { useWaiterCashSummaryQuery } from "@/context/services/cashApi";
import { useWaiterTablesQuery } from "@/context/services/floorApi";
import {
    useClockInMutation,
    useClockOutMutation,
    useCurrentShiftQuery,
} from "@/context/services/shiftsApi";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

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
        <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-slate-gray">
                    {label}
                </p>
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-slate-gray">
                    <Icon className="size-4" />
                </span>
            </div>
            <p
                className={cn(
                    "mt-3 text-[28px] leading-none font-semibold tracking-tight",
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

function shiftErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "data" in error) {
        const data = (
            error as {
                data?: { errors?: { shift?: string }; openTables?: number };
            }
        ).data;
        if (data?.errors?.shift === "openTables") {
            const count = data.openTables ?? 0;
            return `Close ${count} open table${count === 1 ? "" : "s"} before clocking out.`;
        }
        if (data?.errors?.shift === "alreadyClosed") {
            return "This shift is already closed.";
        }
        if (data?.errors && "version" in data.errors) {
            return "Shift changed on another device. Refresh and try again.";
        }
    }
    return "Could not update your shift. Try again.";
}

export default function WaiterShiftPage() {
    const staff = useAppSelector(selectCurrentStaff);
    const hasSession = useAppSelector(state => Boolean(state.identity.session));
    const { data: shift, isFetching } = useCurrentShiftQuery(undefined, {
        skip: !hasSession,
    });
    const [clockIn, { isLoading: clockingIn }] = useClockInMutation();
    const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();
    const [actionError, setActionError] = useState("");
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
    const busy = clockingIn || clockingOut || isFetching;

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

    return (
        <section className="mx-auto w-full max-w-3xl space-y-6">
            <PageHeader
                eyebrow="Shift"
                title={clockedIn ? "On the floor" : "Off the clock"}
                description={
                    clockedIn
                        ? `${staff?.name ?? "Waiter"} is clocked in. Monitor tables, collections, and clock out when the floor is clear.`
                        : `${staff?.name ?? "Waiter"} is not clocked in. Clock in before taking a table.`
                }
            />

            <div className="flex flex-col gap-4 rounded-[20px] border border-hairline bg-card p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                        <span
                            className={cn(
                                "relative flex size-12 items-center justify-center rounded-full font-bold text-[18px]",
                                clockedIn
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-secondary text-slate-gray",
                            )}
                        >
                            {staff?.name?.charAt(0) ?? "W"}
                            <span
                                className={cn(
                                    "absolute top-1 right-1 size-2.5 rounded-full ring-2 ring-white dark:ring-card",
                                    clockedIn
                                        ? "bg-emerald-500"
                                        : "bg-slate-400",
                                )}
                            />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-[17px] font-semibold text-foreground">
                                    {staff?.name}
                                </p>
                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                    Waiter
                                </span>
                            </div>
                            <p className="text-[13px] text-slate-gray">
                                {staff?.phone || "Fanaye Floor"}
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
                    >
                        {!clockedIn
                            ? "Clocked out"
                            : tablesOpen
                              ? `${summary.openTables} tables active`
                              : "Ready to clock out"}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-hairline pt-3.5 text-[13px]">
                    <div>
                        <p className="font-semibold text-foreground">
                            {session?.definitionName ||
                                upcoming?.definitionName ||
                                "Shift"}
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
                        <p className="font-semibold text-foreground">
                            Clock in
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            {formatClock(session?.clockInAt)}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">
                            Clock out
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            {formatClock(session?.clockOutAt)}
                        </p>
                    </div>
                </div>

                {actionError ? (
                    <p className="text-[13px] text-red-600">{actionError}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    {clockedIn ? (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={handleClockOut}
                        >
                            <LogOut className="size-4" />
                            {clockingOut ? "Clocking out..." : "Clock out"}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={handleClockIn}
                        >
                            <LogIn className="size-4" />
                            {clockingIn ? "Clocking in..." : "Clock in"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                    label="Open tables"
                    value={String(summary.openTables)}
                    hint="Your active covers"
                    icon={LayoutGrid}
                />
                <MetricCard
                    label="Sales"
                    value={formatEtb(summary.sales)}
                    hint="Open tickets, not closed"
                    icon={Wallet}
                    accent
                />
                <MetricCard
                    label="Ready"
                    value={String(summary.readyCount)}
                    hint="Waiting to serve"
                    icon={Bell}
                />
                <MetricCard
                    label="Cooking"
                    value={String(summary.cookingCount)}
                    hint="Still at a station"
                    icon={Flame}
                />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <Link
                    href="/waiter/tables"
                    className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle transition-colors hover:bg-secondary/50"
                >
                    <p className="text-[13px] font-medium text-slate-gray">
                        Floor
                    </p>
                    <p className="mt-1 text-[16px] font-semibold">
                        Open tables
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        Seat, order, and request the bill from your floor map.
                    </p>
                </Link>
                <Link
                    href="/waiter/ready"
                    className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle transition-colors hover:bg-secondary/50"
                >
                    <p className="text-[13px] font-medium text-slate-gray">
                        Service
                    </p>
                    <p className="mt-1 text-[16px] font-semibold">
                        Ready tickets
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        {summary.readyCount > 0
                            ? `${summary.readyCount} dish${summary.readyCount === 1 ? "" : "es"} ready to run.`
                            : "Nothing waiting to be served."}
                    </p>
                </Link>
            </div>

            <div className="flex items-start gap-3 rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Wallet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">Cash on you</p>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {formatEtb(cashOnHand)} still undropped this shift. It
                        stays with you until you drop it to the cashier. You
                        cannot clock out while a table is still open.
                    </p>
                    <Link
                        href="/waiter/cash"
                        className="mt-3 inline-flex text-[14px] font-medium text-brand"
                    >
                        Drop cash →
                    </Link>
                </div>
            </div>
        </section>
    );
}
