"use client";

import React, { useState, useEffect } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    Loader2,
    ShieldAlert,
    Table2,
    UserCheck,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
    ActiveShiftSummary,
    useManagerForceClockOutMutation,
} from "@/context/services/shiftsApi";
import { formatEtb } from "@/lib/money";

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
    const [managerForceClockOut, { isLoading }] =
        useManagerForceClockOutMutation();

    const [tableAction, setTableAction] = useState<"reassign" | "close">(
        "reassign",
    );
    const [targetWaiterId, setTargetWaiterId] = useState<string>("");
    const [cashHandling, setCashHandling] = useState<
        "DROP_TO_SAFE" | "FLAG_AS_SHORTAGE" | "NONE"
    >("DROP_TO_SAFE");
    const [cashNotes, setCashNotes] = useState<string>("");
    const [reason, setReason] = useState<string>("");

    // Set default target waiter if available
    useEffect(() => {
        if (candidates.length > 0 && !targetWaiterId) {
            // Pick first candidate that isn't the current staff
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
            const hasCash = parseFloat(session.undroppedCash || "0") > 0;
            setCashHandling(hasCash ? "DROP_TO_SAFE" : "NONE");
            setReason(
                "Shift duration ended; staff departed without clocking out.",
            );
            setCashNotes("");
            setTableAction("reassign");
        }
    }, [session]);

    if (!open || !session) return null;

    const hasTables = session.openTablesCount > 0;
    const hasCash = parseFloat(session.undroppedCash || "0") > 0;
    const availableCandidates = candidates.filter(
        c => c.staffMembershipId !== session.staffMembershipId,
    );

    async function handleConfirm() {
        if (!reason.trim()) {
            toast.error("Manager reason is required.");
            return;
        }

        if (hasTables && tableAction === "reassign" && !targetWaiterId) {
            toast.error(
                "Please select a waiter to receive open tables, or choose to close them.",
            );
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
                "Shift Force-Closed",
                res.message ||
                    `Successfully closed shift for ${session!.staffName}.`,
            );
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            const msg =
                err?.data?.message ||
                err?.message ||
                "Failed to force clock-out staff.";
            toast.error("Force Clock-Out Error", msg);
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
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <ShieldAlert className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">
                                Force Clock-Out Staff
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Resolve open tables, cash custody, and close
                                shift
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
                                <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                                    {session.staffName.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">
                                        {session.staffName}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        {session.roleName ||
                                            session.roleCode ||
                                            "Staff Member"}
                                    </p>
                                </div>
                            </div>
                            {session.isExpired ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="size-3" />
                                    Expired Shift
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                    <Clock className="size-3" />
                                    Active
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-[11px]">
                            <div>
                                <span className="text-muted-foreground">
                                    Clock-in:{" "}
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
                                <span className="text-muted-foreground">
                                    Open Tables:{" "}
                                </span>
                                <span
                                    className={`font-semibold ${
                                        hasTables
                                            ? "text-amber-600"
                                            : "text-foreground"
                                    }`}
                                >
                                    {session.openTablesCount} tables
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Open Tables Handling */}
                    {hasTables ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                <Table2 className="size-4" />
                                <span>
                                    {session.openTablesCount} Tables Currently
                                    Active
                                </span>
                            </div>

                            {/* Tables tags preview */}
                            <div className="flex flex-wrap gap-1.5">
                                {session.openTables.map(t => (
                                    <span
                                        key={t.sessionTableId}
                                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium"
                                    >
                                        {t.tableName}
                                        {t.locationName
                                            ? ` (${t.locationName})`
                                            : ""}
                                    </span>
                                ))}
                            </div>

                            <div className="space-y-2 pt-1">
                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tableAction"
                                        checked={tableAction === "reassign"}
                                        onChange={() =>
                                            setTableAction("reassign")
                                        }
                                        className="accent-brand"
                                    />
                                    <span className="font-medium text-foreground">
                                        Reassign tables to another waiter
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
                                                -- Select working waiter --
                                            </option>
                                            {availableCandidates.map(c => (
                                                <option
                                                    key={c.staffMembershipId}
                                                    value={c.staffMembershipId}
                                                >
                                                    {c.name}
                                                    {c.roleName
                                                        ? ` (${c.roleName})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tableAction"
                                        checked={tableAction === "close"}
                                        onChange={() => setTableAction("close")}
                                        className="accent-brand"
                                    />
                                    <span className="font-medium text-foreground">
                                        Close tables as manager force-closed
                                    </span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>
                                No open tables assigned. Shift can be closed
                                immediately.
                            </span>
                        </div>
                    )}

                    {/* Section 2: Cash Custody Handling */}
                    {hasCash ? (
                        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                    <DollarSign className="size-4 text-emerald-600" />
                                    <span>Undropped Cash on Hand</span>
                                </div>
                                <span className="font-bold text-sm text-foreground">
                                    {formatEtb(
                                        parseFloat(session.undroppedCash),
                                    )}
                                </span>
                            </div>

                            <p className="text-[11px] text-muted-foreground">
                                Select how this collected cash will be accounted
                                for:
                            </p>

                            <div className="space-y-2 text-xs">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="cashHandling"
                                        value="DROP_TO_SAFE"
                                        checked={
                                            cashHandling === "DROP_TO_SAFE"
                                        }
                                        onChange={() =>
                                            setCashHandling("DROP_TO_SAFE")
                                        }
                                        className="mt-0.5 accent-brand"
                                    />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Turned In to Branch Safe / Drawer
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Manager physically received the
                                            cash. Creates a safe drop receipt.
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="cashHandling"
                                        value="FLAG_AS_SHORTAGE"
                                        checked={
                                            cashHandling === "FLAG_AS_SHORTAGE"
                                        }
                                        onChange={() =>
                                            setCashHandling("FLAG_AS_SHORTAGE")
                                        }
                                        className="mt-0.5 accent-brand"
                                    />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Uncollected / Staff Shortage
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Staff departed with the cash. Logs a
                                            shortage discrepancy on their record
                                            for payroll recovery.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <input
                                type="text"
                                placeholder="Optional cash settlement note (e.g. Left in envelope #3)"
                                value={cashNotes}
                                onChange={e => setCashNotes(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                            />
                        </div>
                    ) : null}

                    {/* Section 3: Manager Audit Reason */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            Manager Reason{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={2}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Reason for force clock-out (for compliance audit trail)..."
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
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white shadow-none"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                            <UserCheck className="mr-1.5 size-3.5" />
                        )}
                        Confirm Force Clock-Out
                    </Button>
                </div>
            </div>
        </div>
    );
};
export default ManagerForceClockOutModal;
