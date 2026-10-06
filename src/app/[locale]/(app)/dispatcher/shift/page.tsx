"use client";

import { Bell, Flame, LogIn, LogOut, Phone, Wallet } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "@/context/hooks";
import { useWaiterCashSummaryQuery } from "@/context/services/cashApi";
import { useDispatcherCallsQuery } from "@/context/services/floorApi";
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

function formatClock(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DispatcherShiftPage() {
    const staff = useAppSelector(selectCurrentStaff);
    const hasSession = useAppSelector(state => Boolean(state.identity.session));
    const { data: shift, isFetching } = useCurrentShiftQuery(undefined, {
        skip: !hasSession,
    });
    const [clockIn, { isLoading: clockingIn }] = useClockInMutation();
    const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();
    const [actionError, setActionError] = useState("");
    const { data: board } = useDispatcherCallsQuery(undefined, {
        skip: !staff || !hasSession,
        pollingInterval: 5000,
    });
    const { data: cashSummary } = useWaiterCashSummaryQuery(undefined, {
        skip: !staff || !hasSession,
        pollingInterval: 5000,
    });
    const calls = board?.data ?? [];
    const openCalls = calls.filter(c => c.boardColumn !== "PAID").length;
    const cashOnHand = Number(cashSummary?.undroppedCash ?? 0);
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
        } catch {
            setActionError("Could not clock in");
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
            if (error && typeof error === "object" && "data" in error) {
                const data = (
                    error as { data?: { errors?: { shift?: string } } }
                ).data;
                if (data?.errors?.shift === "openTables") {
                    setActionError(
                        "Close open call orders before clocking out",
                    );
                    return;
                }
            }
            setActionError("Could not clock out");
        }
    }

    return (
        <section className="mx-auto w-full max-w-3xl space-y-6">
            <PageHeader
                eyebrow="Call pickup"
                title={clockedIn ? "On calls" : "Off the clock"}
                description={
                    clockedIn
                        ? `${staff?.name ?? "Dispatcher"} is taking call pickup orders.`
                        : `${staff?.name ?? "Dispatcher"} is not clocked in.`
                }
            />

            <div className="flex flex-col gap-4 rounded-[20px] border border-hairline bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[17px] font-semibold">
                            {staff?.name}
                        </p>
                        <p className="text-[13px] text-slate-gray">
                            Dispatcher
                        </p>
                    </div>
                    <Badge variant={clockedIn ? "success" : "secondary"}>
                        {clockedIn ? "Clocked in" : "Clocked out"}
                    </Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 border-t border-hairline pt-3.5 text-[13px] sm:grid-cols-3">
                    <div>
                        <p className="font-semibold">
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
                        <p className="font-semibold">Clock in</p>
                        <p className="text-[12px] text-slate-gray">
                            {formatClock(session?.clockInAt)}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">Clock out</p>
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
                            {clockingOut ? "Clocking out…" : "Clock out"}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={handleClockIn}
                        >
                            <LogIn className="size-4" />
                            {clockingIn ? "Clocking in…" : "Clock in"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[20px] border border-hairline bg-card p-5">
                    <p className="text-[13px] text-slate-gray">Open calls</p>
                    <p className="mt-2 text-[28px] font-semibold">
                        {openCalls}
                    </p>
                    <Phone className="mt-2 size-4 text-slate-gray" />
                </div>
                <div className="rounded-[20px] border border-hairline bg-card p-5">
                    <p className="text-[13px] text-slate-gray">
                        Cash collected
                    </p>
                    <p className="mt-2 text-[22px] font-semibold text-brand">
                        {formatEtb(Number(cashSummary?.cashCollected ?? 0))}
                    </p>
                    <Wallet className="mt-2 size-4 text-slate-gray" />
                </div>
                <div className="rounded-[20px] border border-hairline bg-card p-5">
                    <p className="text-[13px] text-slate-gray">Ready items</p>
                    <p className="mt-2 text-[28px] font-semibold">
                        {calls.reduce((s, c) => s + c.readyItemCount, 0)}
                    </p>
                    <Bell className="mt-2 size-4 text-slate-gray" />
                </div>
                <div className="rounded-[20px] border border-hairline bg-card p-5">
                    <p className="text-[13px] text-slate-gray">Cooking</p>
                    <p className="mt-2 text-[28px] font-semibold">
                        {calls.reduce((s, c) => s + c.cookingItemCount, 0)}
                    </p>
                    <Flame className="mt-2 size-4 text-slate-gray" />
                </div>
            </div>

            <div className="space-y-2 rounded-[20px] border border-hairline bg-card p-5">
                <p className="text-[15px] font-semibold">
                    Cash on you: {formatEtb(cashOnHand)}
                </p>
                <Link
                    href="/dispatcher/cash"
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand"
                >
                    <Wallet className="size-4" /> Drop cash to cashier
                </Link>
                <Link
                    href="/dispatcher"
                    className="flex items-center gap-1.5 pt-2 text-[14px] font-medium text-foreground"
                >
                    <Phone className="size-4" /> Open call board
                </Link>
            </div>
        </section>
    );
}
