"use client";

import React, { useState, useEffect } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    AlertTriangle,
    Banknote,
    CheckCircle2,
    Clock,
    DollarSign,
    ShieldAlert,
    Table2,
    UserCheck,
    Vault,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
    ActiveShiftSummary,
    useManagerForceClockOutMutation,
    useManagerForceCloseCashierDrawerMutation,
} from "@/context/services/shiftsApi";
import { formatEtb } from "@/lib/money";
import { useTranslations } from "next-intl";

interface CandidateWaiter {
    staffMembershipId: string;
    name: string;
    roleName?: string;
}

interface ManagerForceClockOutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: ActiveShiftSummary | null;
    candidates: CandidateWaiter[];
    onSuccess?: () => void;
}

export const ManagerForceClockOutModal: React.FC<
    ManagerForceClockOutModalProps
> = ({ open, onOpenChange, session, candidates, onSuccess }) => {
    const t = useTranslations("managerForceClockOut");
    const [managerForceClockOut, { isLoading: isWaiterLoading }] =
        useManagerForceClockOutMutation();
    const [managerForceCloseCashier, { isLoading: isCashierLoading }] =
        useManagerForceCloseCashierDrawerMutation();

    const isLoading = isWaiterLoading || isCashierLoading;

    // Waiter states
    const [tableAction, setTableAction] = useState<"reassign" | "close">(
        "reassign",
    );
    const [targetWaiterId, setTargetWaiterId] = useState<string>("");
    const [cashHandling, setCashHandling] = useState<
        "DROP_TO_SAFE" | "FLAG_AS_SHORTAGE" | "NONE"
    >("DROP_TO_SAFE");

    // Cashier states
    const [cashierReconMode, setCashierReconMode] = useState<"QUICK" | "COUNT">(
        "QUICK",
    );
    const [countedCashInput, setCountedCashInput] = useState<string>("");
    const [depositToSafe, setDepositToSafe] = useState<boolean>(true);

    // Common states
    const [cashNotes, setCashNotes] = useState<string>("");
    const [reason, setReason] = useState<string>("");

    // Set default target waiter if available
    useEffect(() => {
        if (candidates.length > 0 && !targetWaiterId) {
            const other = candidates.find(
                c => c.staffMembershipId !== session?.staffMembershipId,
            );
            if (other) {
                setTargetWaiterId(other.staffMembershipId);
            }
        }
    }, [candidates, session, targetWaiterId]);

    // Reset default form state when session changes
    useEffect(() => {
        if (session) {
            const isCashierRole =
                session.roleCode === "CASHIER" || session.hasCashierDrawer;
            if (isCashierRole) {
                setCashierReconMode("QUICK");
                const expected = parseFloat(session.drawerExpectedCash || "0");
                setCountedCashInput(expected.toFixed(2));
                setDepositToSafe(true);
                setReason(
                    "Shift ended; cashier departed without clocking out or drawer reconciliation.",
                );
            } else {
                const hasCash = parseFloat(session.undroppedCash || "0") > 0;
                setCashHandling(hasCash ? "DROP_TO_SAFE" : "NONE");
                setReason(
                    "Shift duration ended; staff departed without clocking out.",
                );
                setTableAction("reassign");
            }
            setCashNotes("");
        }
    }, [session]);

    if (!open || !session) return null;

    const isCashier =
        session.roleCode === "CASHIER" || session.hasCashierDrawer;
    const hasTables = session.openTablesCount > 0;
    const hasCash = parseFloat(session.undroppedCash || "0") > 0;
    const availableCandidates = candidates.filter(
        c => c.staffMembershipId !== session.staffMembershipId,
    );

    // Cashier drawer calculations
    const expectedDrawerCash = parseFloat(session.drawerExpectedCash || "0");
    const parsedCountedCash = parseFloat(countedCashInput);
    const countedDrawerCash =
        cashierReconMode === "QUICK"
            ? expectedDrawerCash
            : isNaN(parsedCountedCash)
              ? 0
              : parsedCountedCash;
    const drawerVariance = countedDrawerCash - expectedDrawerCash;

    async function handleConfirm() {
        if (!reason.trim()) {
            toast.error(t("reasonRequired"));
            return;
        }

        if (isCashier) {
            // Cashier force close flow
            if (cashierReconMode === "COUNT" && isNaN(parsedCountedCash)) {
                toast.error(t("validAmountRequired"));
                return;
            }

            try {
                const res = await managerForceCloseCashier({
                    shiftSessionId: session!.shiftSessionId,
                    reason: reason.trim(),
                    countedCashAmount:
                        cashierReconMode === "COUNT"
                            ? countedDrawerCash
                            : undefined,
                    depositToSafe,
                    cashNotes: cashNotes.trim() || undefined,
                }).unwrap();

                toast.success(
                    t("cashierSuccessTitle"),
                    res.message ||
                        t("cashierSuccessDefault", {
                            name: session!.staffName,
                        }),
                );
                onOpenChange(false);
                onSuccess?.();
            } catch (err: unknown) {
                const apiErr = err as {
                    data?: { message?: string };
                    message?: string;
                };
                const msg =
                    apiErr?.data?.message ||
                    apiErr?.message ||
                    t("cashierErrorDefault");
                toast.error(t("cashierErrorTitle"), msg);
            }
            return;
        }

        // Waiter force clock-out flow
        if (hasTables && tableAction === "reassign" && !targetWaiterId) {
            toast.error(t("selectWaiterError"));
            return;
        }

        try {
            const res = await managerForceClockOut({
                shiftSessionId: session!.shiftSessionId,
                reason: reason.trim(),
                reassignTablesToMembershipId:
                    hasTables && tableAction === "reassign"
                        ? targetWaiterId
                        : undefined,
                closeOpenTables: hasTables && tableAction === "close",
                cashHandling: hasCash ? cashHandling : "NONE",
                cashNotes: cashNotes.trim() || undefined,
            }).unwrap();

            toast.success(
                t("staffSuccessTitle"),
                res.message ||
                    t("staffSuccessDefault", { name: session!.staffName }),
            );
            onOpenChange(false);
            onSuccess?.();
        } catch (err: unknown) {
            const apiErr = err as {
                data?: { message?: string };
                message?: string;
            };
            const msg =
                apiErr?.data?.message ||
                apiErr?.message ||
                t("staffErrorDefault");
            toast.error(t("staffErrorTitle"), msg);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div
                className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/30">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={`flex size-9 items-center justify-center rounded-xl ${
                                isCashier
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                        >
                            {isCashier ? (
                                <Banknote className="size-5" />
                            ) : (
                                <ShieldAlert className="size-5" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">
                                {isCashier
                                    ? t("titleCashier")
                                    : t("titleStaff")}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {isCashier
                                    ? t("subtitleCashier")
                                    : t("subtitleStaff")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Staff Profile Card */}
                    <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                                    {session.staffName.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">
                                        {session.staffName}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        {session.roleName ||
                                            session.roleCode ||
                                            t("staffMember")}
                                    </p>
                                </div>
                            </div>
                            {session.isExpired ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="size-3" />
                                    {t("expiredShift")}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                    <Clock className="size-3" />
                                    {t("activeShift")}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-[11px]">
                            <div>
                                <span className="text-muted-foreground">
                                    {t("clockInAt")}{" "}
                                </span>
                                <span className="font-medium text-foreground">
                                    {new Date(
                                        session.clockInAt,
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                            <div>
                                {isCashier ? (
                                    <>
                                        <span className="text-muted-foreground">
                                            {t("drawerExpected")}{" "}
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatEtb(expectedDrawerCash)}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-muted-foreground">
                                            {t("openTables", {
                                                count: session.openTablesCount,
                                            })}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CASHIER FLOW: Drawer Reconciliation */}
                    {isCashier ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-300">
                                    <Banknote className="size-4" />
                                    <span>{t("registerCustody")}</span>
                                </div>
                                <span className="font-bold text-sm text-foreground">
                                    {formatEtb(expectedDrawerCash)}
                                </span>
                            </div>

                            {session.drawerOpeningFloat ? (
                                <p className="text-[11px] text-muted-foreground">
                                    {t("openingFloat")}{" "}
                                    <span className="font-medium text-foreground">
                                        {formatEtb(
                                            parseFloat(
                                                session.drawerOpeningFloat,
                                            ),
                                        )}
                                    </span>{" "}
                                    · {t("status")}{" "}
                                    <span className="font-medium uppercase text-emerald-700 dark:text-emerald-400">
                                        {session.cashierDrawerStatus || "OPEN"}
                                    </span>
                                </p>
                            ) : null}

                            <div className="space-y-2 pt-1 border-t border-emerald-500/20 text-xs">
                                <p className="text-[11px] font-medium text-muted-foreground">
                                    {t("selectResolution")}
                                </p>

                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="cashierReconMode"
                                        checked={cashierReconMode === "QUICK"}
                                        onChange={() =>
                                            setCashierReconMode("QUICK")
                                        }
                                        className="mt-0.5 accent-brand"
                                    />
                                    <div>
                                        <span className="font-medium text-foreground">
                                            {t("quickClose", {
                                                amount: formatEtb(
                                                    expectedDrawerCash,
                                                ),
                                            })}
                                        </span>
                                        <p className="text-[11px] text-muted-foreground">
                                            {t("quickCloseDesc")}
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="cashierReconMode"
                                        checked={cashierReconMode === "COUNT"}
                                        onChange={() =>
                                            setCashierReconMode("COUNT")
                                        }
                                        className="mt-0.5 accent-brand"
                                    />
                                    <div>
                                        <span className="font-medium text-foreground">
                                            {t("countedWithVariance")}
                                        </span>
                                        <p className="text-[11px] text-muted-foreground">
                                            {t("countedWithVarianceDesc")}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {cashierReconMode === "COUNT" ? (
                                <div className="ml-5 space-y-2 pt-1">
                                    <div>
                                        <label className="text-[11px] font-medium text-foreground">
                                            {t("physicalCashLabel")}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={countedCashInput}
                                            onChange={e =>
                                                setCountedCashInput(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="0.00"
                                            className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono font-semibold"
                                        />
                                    </div>

                                    {/* Variance indicator */}
                                    <div
                                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                            Math.abs(drawerVariance) < 0.01
                                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                                                : drawerVariance < 0
                                                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                                                  : "bg-blue-500/15 text-blue-800 dark:text-blue-300"
                                        }`}
                                    >
                                        <span>
                                            {t("reconciliationVariance")}
                                        </span>
                                        <span className="font-bold">
                                            {drawerVariance > 0 ? "+" : ""}
                                            {formatEtb(drawerVariance)}
                                            {drawerVariance < 0
                                                ? ` ${t("shortage")}`
                                                : drawerVariance > 0
                                                  ? ` ${t("overage")}`
                                                  : ` ${t("balanced")}`}
                                        </span>
                                    </div>
                                    {drawerVariance < 0 ? (
                                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                            {t("shortageNotice")}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="pt-2 border-t border-emerald-500/20">
                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={depositToSafe}
                                        onChange={e =>
                                            setDepositToSafe(e.target.checked)
                                        }
                                        className="accent-brand"
                                    />
                                    <Vault className="size-3.5 text-muted-foreground" />
                                    <span className="font-medium text-foreground">
                                        {t("depositSafeLabel", {
                                            amount: formatEtb(
                                                countedDrawerCash,
                                            ),
                                        })}
                                    </span>
                                </label>
                                <p className="ml-5 text-[11px] text-muted-foreground">
                                    {t("depositSafeDesc")}
                                </p>
                            </div>

                            <input
                                type="text"
                                placeholder={t("cashNotesCashierPlaceholder")}
                                value={cashNotes}
                                onChange={e => setCashNotes(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                            />
                        </div>
                    ) : (
                        /* WAITER FLOW: Open Tables & Waiter Undropped Cash */
                        <>
                            {hasTables ? (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                        <Table2 className="size-4" />
                                        <span>
                                            {t("activeTablesCount", {
                                                count: session.openTablesCount,
                                            })}
                                        </span>
                                    </div>

                                    {/* Tables tags preview */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {session.openTables.map(tbl => (
                                            <span
                                                key={tbl.sessionTableId}
                                                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium"
                                            >
                                                {tbl.tableName}
                                                {tbl.locationName
                                                    ? ` (${tbl.locationName})`
                                                    : ""}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tableAction"
                                                checked={
                                                    tableAction === "reassign"
                                                }
                                                onChange={() =>
                                                    setTableAction("reassign")
                                                }
                                                className="accent-brand"
                                            />
                                            <span className="font-medium text-foreground">
                                                {t("reassignTables")}
                                            </span>
                                        </label>

                                        {tableAction === "reassign" ? (
                                            <div className="ml-5 space-y-1">
                                                <select
                                                    value={targetWaiterId}
                                                    onChange={e =>
                                                        setTargetWaiterId(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                                                >
                                                    <option value="">
                                                        {t(
                                                            "selectWorkingWaiter",
                                                        )}
                                                    </option>
                                                    {availableCandidates.map(
                                                        c => (
                                                            <option
                                                                key={
                                                                    c.staffMembershipId
                                                                }
                                                                value={
                                                                    c.staffMembershipId
                                                                }
                                                            >
                                                                {c.name}
                                                                {c.roleName
                                                                    ? ` (${c.roleName})`
                                                                    : ""}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        ) : null}

                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tableAction"
                                                checked={
                                                    tableAction === "close"
                                                }
                                                onChange={() =>
                                                    setTableAction("close")
                                                }
                                                className="accent-brand"
                                            />
                                            <span className="font-medium text-foreground">
                                                {t("closeTablesDirectly")}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    <span>{t("noOpenTablesAssigned")}</span>
                                </div>
                            )}

                            {hasCash ? (
                                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                            <DollarSign className="size-4 text-emerald-600" />
                                            <span>
                                                {t("undroppedCashTitle")}
                                            </span>
                                        </div>
                                        <span className="font-bold text-sm text-foreground">
                                            {formatEtb(
                                                parseFloat(
                                                    session.undroppedCash,
                                                ),
                                            )}
                                        </span>
                                    </div>

                                    <p className="text-[11px] text-muted-foreground">
                                        {t("selectCashAccounting")}
                                    </p>

                                    <div className="space-y-2 text-xs">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="cashHandling"
                                                value="DROP_TO_SAFE"
                                                checked={
                                                    cashHandling ===
                                                    "DROP_TO_SAFE"
                                                }
                                                onChange={() =>
                                                    setCashHandling(
                                                        "DROP_TO_SAFE",
                                                    )
                                                }
                                                className="mt-0.5 accent-brand"
                                            />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {t("turnedInSafe")}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {t("turnedInSafeDesc")}
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="cashHandling"
                                                value="FLAG_AS_SHORTAGE"
                                                checked={
                                                    cashHandling ===
                                                    "FLAG_AS_SHORTAGE"
                                                }
                                                onChange={() =>
                                                    setCashHandling(
                                                        "FLAG_AS_SHORTAGE",
                                                    )
                                                }
                                                className="mt-0.5 accent-brand"
                                            />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {t("uncollectedShortage")}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {t(
                                                        "uncollectedShortageDesc",
                                                    )}
                                                </p>
                                            </div>
                                        </label>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder={t(
                                            "cashNotesStaffPlaceholder",
                                        )}
                                        value={cashNotes}
                                        onChange={e =>
                                            setCashNotes(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                                    />
                                </div>
                            ) : null}
                        </>
                    )}

                    {/* Section: Manager Audit Reason */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {t("managerReasonLabel")}{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={2}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder={t("reasonPlaceholder")}
                            className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                            required
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5 bg-muted/20">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={
                            isCashier
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                                : "bg-amber-600 hover:bg-amber-700 text-white shadow-none"
                        }
                    >
                        {isLoading ? (
                            <RestorchSpinner className="mr-1.5 size-3.5 " />
                        ) : isCashier ? (
                            <Banknote className="mr-1.5 size-3.5" />
                        ) : (
                            <UserCheck className="mr-1.5 size-3.5" />
                        )}
                        {isCashier ? t("confirmCashier") : t("confirmStaff")}
                    </Button>
                </div>
            </div>
        </div>
    );
};
export default ManagerForceClockOutModal;
