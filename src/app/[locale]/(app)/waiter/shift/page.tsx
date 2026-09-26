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
import { useTranslations } from "next-intl";

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

export default function WaiterShiftPage() {
    const t = useTranslations("waiter");
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
    const staffName = staff?.name ?? t("server");

    function shiftErrorMessage(error: unknown) {
        if (error && typeof error === "object" && "data" in error) {
            const data = (
                error as {
                    data?: { errors?: { shift?: string }; openTables?: number };
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
            if (data?.errors && "version" in data.errors) {
                return t("shiftChangedRefresh");
            }
        }
        return t("couldNotUpdateShift");
    }

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
                        ? t("clockedInDesc", { name: staffName })
                        : t("notClockedInDesc", { name: staffName })
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-hairline pt-3.5 text-[13px]">
                    <div>
                        <p className="font-semibold text-foreground">
                            {session?.definitionName ||
                                upcoming?.definitionName ||
                                t("navShift")}
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
                            {t("clockIn")}
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            {formatClock(session?.clockInAt)}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">
                            {t("clockOut")}
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
                            {clockingOut ? t("clockingOut") : t("clockOut")}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={handleClockIn}
                        >
                            <LogIn className="size-4" />
                            {clockingIn ? t("clockingIn") : t("clockIn")}
                        </Button>
                    )}
                </div>
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
                    className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle transition-colors hover:bg-secondary/50"
                >
                    <p className="text-[13px] font-medium text-slate-gray">
                        {t("floorLink")}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold">
                        {t("openTables")}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        {t("floorLinkDesc")}
                    </p>
                </Link>
                <Link
                    href="/waiter/ready"
                    className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle transition-colors hover:bg-secondary/50"
                >
                    <p className="text-[13px] font-medium text-slate-gray">
                        {t("serviceLink")}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold">
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

            <div className="flex items-start gap-3 rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Wallet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">
                        {t("cashOnYou")}
                    </p>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {t("cashOnYouHint", {
                            amount: formatEtb(cashOnHand),
                        })}
                    </p>
                    <Link
                        href="/waiter/cash"
                        className="mt-3 inline-flex text-[14px] font-medium text-brand"
                    >
                        {t("dropCashLink")}
                    </Link>
                </div>
            </div>
        </section>
    );
}
