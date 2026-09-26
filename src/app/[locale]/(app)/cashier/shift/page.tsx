"use client";

import {
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    LogIn,
    LogOut,
    Wallet,
    Warehouse,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
    const staff = useAppSelector(selectCurrentStaff);
    const hasSession = useAppSelector(state => Boolean(state.identity.session));
    const { data: shift, isFetching } = useCurrentShiftQuery(undefined, {
        skip: !hasSession,
    });
    const [clockIn, { isLoading: clockingIn }] = useClockInMutation();
    const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();
    const [actionError, setActionError] = useState("");
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
    const busy = clockingIn || clockingOut || isFetching;
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
                    data?: { errors?: { shift?: string }; openTables?: number };
                }
            ).data;
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

                <article
                    className={cn(
                        "overflow-hidden rounded-[22px] border border-hairline bg-card shadow-subtle transition-[box-shadow,transform] duration-300",
                        clockedIn &&
                            "shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]",
                    )}
                >
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
                                <span
                                    className={cn(
                                        "relative flex size-12 items-center justify-center rounded-full text-[18px] font-bold transition-colors duration-300",
                                        clockedIn
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                            : "bg-secondary text-slate-gray",
                                    )}
                                >
                                    {staff?.name?.charAt(0) ?? "C"}
                                    <span
                                        className={cn(
                                            "absolute top-1 right-1 size-2.5 rounded-full ring-2 ring-card transition-colors duration-300",
                                            clockedIn
                                                ? "bg-emerald-500"
                                                : "bg-slate-400",
                                        )}
                                    />
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[17px] font-semibold tracking-tight text-foreground">
                                            {staff?.name ?? tCommon("cashier")}
                                        </p>
                                        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-brand">
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
                            <Badge variant={phaseCopy[phase].badgeVariant}>
                                {phaseCopy[phase].badge}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4 px-5 py-5 sm:px-6">
                        <div className="grid grid-cols-3 gap-3 text-[13px]">
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.06em] text-slate-gray uppercase">
                                    {t("assignment")}
                                </p>
                                <p className="mt-1 font-semibold text-foreground">
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
                                <p className="mt-1 font-semibold text-foreground">
                                    {formatClock(session?.clockInAt)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.06em] text-slate-gray uppercase">
                                    {t("clockOut")}
                                </p>
                                <p className="mt-1 font-semibold text-foreground">
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
                            <div className="rounded-[20px] border border-hairline bg-card p-4 shadow-subtle">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[12px] font-medium tracking-[0.06em] text-slate-gray uppercase">
                                        {t("expectedInDrawer")}
                                    </p>
                                    <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                                        <Wallet className="size-4" />
                                    </span>
                                </div>
                                <p className="mt-2 text-[22px] font-semibold tracking-tight text-brand">
                                    {formatEtb(expected)}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("floatPlusDrops", {
                                        float: formatEtb(float),
                                        drops: formatEtb(dropsReceived),
                                    })}
                                </p>
                            </div>

                            <div className="rounded-[20px] border border-hairline bg-card p-4 shadow-subtle">
                                <p className="text-[12px] text-slate-gray">
                                    {t("openingFloat")}
                                </p>
                                <p className="mt-2 text-[22px] font-semibold tracking-tight">
                                    {formatEtb(float)}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("fixedAtZero")}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    "rounded-[20px] border border-hairline bg-card p-4 shadow-subtle",
                                    pendingDrops > 0 &&
                                        "border-amber-300/70 bg-amber-50/50 dark:bg-amber-950/20",
                                )}
                            >
                                <p className="text-[12px] text-slate-gray">
                                    {t("pendingDrops")}
                                </p>
                                <p className="mt-2 text-[22px] font-semibold tracking-tight">
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
                                className="group rounded-[18px] border border-hairline bg-card p-4 shadow-subtle transition-colors hover:bg-secondary/45"
                            >
                                <div className="flex items-center justify-between">
                                    <Warehouse className="size-4 text-slate-gray" />
                                    <ArrowRight className="size-3.5 text-slate-gray opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="mt-3 text-[15px] font-semibold">
                                    {t("metricCashDrops")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("receiveWaiterCustody")}
                                </p>
                            </Link>
                            <Link
                                href="/cashier/reconciliation"
                                className="group rounded-[18px] border border-hairline bg-card p-4 shadow-subtle transition-colors hover:bg-secondary/45"
                            >
                                <div className="flex items-center justify-between">
                                    <CreditCard className="size-4 text-slate-gray" />
                                    <ArrowRight className="size-3.5 text-slate-gray opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="mt-3 text-[15px] font-semibold">
                                    {t("reconcile")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {t("countVsExpected")}
                                </p>
                            </Link>
                            <Link
                                href="/cashier/daily-close"
                                className="group rounded-[18px] border border-hairline bg-card p-4 shadow-subtle transition-colors hover:bg-secondary/45"
                            >
                                <div className="flex items-center justify-between">
                                    <ClipboardCheck className="size-4 text-slate-gray" />
                                    <ArrowRight className="size-3.5 text-slate-gray opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="mt-3 text-[15px] font-semibold">
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
        </DashboardFrame>
    );
}
