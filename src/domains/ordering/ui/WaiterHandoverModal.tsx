"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    ArrowRightLeft,
    CheckCircle2,
    DollarSign,
    Lock,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UtensilsCrossed,
    X,
} from "lucide-react";
import {
    useWaiterHandoverCandidatesQuery,
    useWaiterHandoverMutation,
} from "@/context/services/shiftsApi";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { WaiterShiftHandoverResponse } from "@/domains/identity/domain/shift";

interface WaiterHandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentVersion: number;
    openTablesCount?: number;
    openTablesNames?: string[];
    cashOnHand?: number;
}

export default function WaiterHandoverModal({
    isOpen,
    onClose,
    currentVersion,
    openTablesCount = 0,
    openTablesNames = [],
    cashOnHand = 0,
}: WaiterHandoverModalProps) {
    const { data: candidates, isLoading: candidatesLoading } =
        useWaiterHandoverCandidatesQuery(undefined, { skip: !isOpen });
    const [executeHandover, { isLoading: submitting }] =
        useWaiterHandoverMutation();

    const [step, setStep] = useState<"details" | "incoming_pin" | "complete">(
        "details",
    );
    const [cashInput, setCashInput] = useState(
        cashOnHand > 0 ? String(cashOnHand) : "0",
    );
    const [selectedCandidateId, setSelectedCandidateId] = useState("");
    const [incomingPin, setIncomingPin] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [completedSummary, setCompletedSummary] =
        useState<WaiterShiftHandoverResponse | null>(null);

    const cashAmount = Math.max(0, parseFloat(cashInput) || 0);

    const selectedCandidate = useMemo(
        () => candidates?.find(c => c.membershipId === selectedCandidateId),
        [candidates, selectedCandidateId],
    );

    if (!isOpen) return null;

    const handleContinueToPin = () => {
        setError("");
        if (!selectedCandidateId) {
            setError("Please select the incoming waiter who will take over.");
            return;
        }
        if (cashAmount > cashOnHand + 0.01) {
            setError(
                `Transferred cash (ETB ${cashAmount.toFixed(2)}) cannot exceed cash on hand (ETB ${cashOnHand.toFixed(2)}).`,
            );
            return;
        }
        setStep("incoming_pin");
    };

    const handleConfirmHandover = async () => {
        setError("");
        if (!incomingPin || incomingPin.trim().length < 4) {
            setError(
                "Incoming waiter must enter their 4 to 6 digit security PIN.",
            );
            return;
        }

        try {
            const res = await executeHandover({
                expectedVersion: currentVersion,
                transferredCashAmount: cashAmount,
                incomingWaiterMembershipId: selectedCandidateId,
                incomingWaiterPin: incomingPin.trim(),
                notes: notes.trim() || undefined,
            }).unwrap();

            setCompletedSummary(res);
            setStep("complete");
            toast.success(
                "Shift & tables successfully handed over to next waiter!",
            );
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "data" in err
                    ? (
                          err as {
                              data?: {
                                  message?: string;
                                  errors?: { transferredCashAmount?: string };
                              };
                          }
                      ).data?.message ||
                      (
                          err as {
                              data?: {
                                  errors?: { transferredCashAmount?: string };
                              };
                          }
                      ).data?.errors?.transferredCashAmount ||
                      "Failed to complete shift handover."
                    : "Failed to complete shift handover.";
            setError(msg);
            toast.error(msg);
        }
    };

    const handleClose = () => {
        setStep("details");
        setError("");
        setIncomingPin("");
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div className="fixed inset-0" onClick={handleClose} />
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border/60 pb-3">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            <ShieldCheck className="size-3.5" />
                            Shift Handover & Custody Transfer
                        </span>
                        <h3 className="mt-1.5 text-lg font-bold tracking-tight text-foreground">
                            {step === "complete"
                                ? "Handover Completed"
                                : step === "incoming_pin"
                                  ? "Incoming Waiter PIN Confirmation"
                                  : "Handover Shift to Next Waiter"}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {error ? (
                    <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                        {error}
                    </div>
                ) : null}

                {/* Step 1: Handover Details */}
                {step === "details" && (
                    <div className="mt-4 space-y-4">
                        {/* Open Tables Section */}
                        <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                    <UtensilsCrossed className="size-4 text-primary" />
                                    Active Tables
                                </span>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                    {openTablesCount}{" "}
                                    {openTablesCount === 1 ? "Table" : "Tables"}
                                </span>
                            </div>
                            {openTablesCount > 0 ? (
                                <>
                                    <p className="text-[11px] text-muted-foreground">
                                        Active floor sessions will be reassigned
                                        directly to the incoming waiter:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {openTablesNames.map((name, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">
                                    You have no open tables. Ready to hand over
                                    cash and clock out cleanly.
                                </p>
                            )}
                        </div>

                        {/* Physical Cash Handover */}
                        <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    Physical Cash Handed Over (ETB)
                                </label>
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Pouch: ETB {cashOnHand.toFixed(2)}
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max={cashOnHand}
                                    step="0.5"
                                    value={cashInput}
                                    onChange={e => setCashInput(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-border bg-background pl-4 pr-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Declare the physical cash you are handing to the
                                next waiter. Cash drop liability will transfer
                                directly to them upon confirmation.
                            </p>
                        </div>

                        {/* Incoming Waiter Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Select Incoming Waiter
                            </label>
                            {candidatesLoading ? (
                                <div className="rounded-xl border border-border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                                    Loading active servers...
                                </div>
                            ) : !candidates || candidates.length === 0 ? (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                                    No other active staff available in this
                                    branch. Please ensure the incoming waiter is
                                    assigned to this branch.
                                </div>
                            ) : (
                                <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                                    {candidates.map(candidate => {
                                        const isSelected =
                                            selectedCandidateId ===
                                            candidate.membershipId;
                                        return (
                                            <button
                                                key={candidate.membershipId}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedCandidateId(
                                                        candidate.membershipId,
                                                    )
                                                }
                                                className={cn(
                                                    "w-full flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer",
                                                    isSelected
                                                        ? "border-primary bg-primary/10 shadow-xs"
                                                        : "border-border bg-card hover:bg-muted/40",
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-xs">
                                                        {candidate.displayName[0]?.toUpperCase() ??
                                                            "W"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-foreground truncate">
                                                            {
                                                                candidate.displayName
                                                            }
                                                        </p>
                                                        <span className="inline-block rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground uppercase">
                                                            {candidate.roleCode}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Optional Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                                Handover Notes (Optional)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="e.g., Table 4 requested separate checks when ready"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                            />
                        </div>

                        {/* Continue Button */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleContinueToPin}
                                disabled={!selectedCandidateId}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Continue to Waiter PIN Confirmation
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Incoming Waiter PIN Confirmation */}
                {step === "incoming_pin" && (
                    <div className="mt-4 space-y-4">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-1">
                            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                                <Lock className="size-5" />
                            </div>
                            <h4 className="font-bold text-foreground text-sm">
                                {selectedCandidate?.displayName}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Please enter your 4 to 6 digit security PIN to
                                confirm acceptance of:
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold text-foreground">
                                <span>
                                    🍽️ {openTablesCount} Active Table
                                    {openTablesCount === 1 ? "" : "s"}
                                </span>
                                <span>💵 ETB {cashAmount.toFixed(2)} Cash</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1 text-center">
                                Incoming Waiter PIN
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                autoFocus
                                value={incomingPin}
                                onChange={e => setIncomingPin(e.target.value)}
                                placeholder="••••"
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-center text-xl tracking-widest font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                            />
                            <p className="mt-1 text-center text-[11px] text-muted-foreground">
                                By entering your PIN, you confirm receiving the
                                open tables and cash liability into your shift
                                custody.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep("details")}
                                disabled={submitting}
                                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmHandover}
                                disabled={submitting || incomingPin.length < 4}
                                className="flex-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                {submitting
                                    ? "Confirming Handover..."
                                    : "Confirm & Transfer Custody"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Success Summary */}
                {step === "complete" && completedSummary && (
                    <div className="mt-4 space-y-4 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-7" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-foreground">
                                Handover Completed Successfully!
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Shift custody and active table sessions have
                                been transferred. Your shift is now closed.
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-left text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Outgoing Server:
                                </span>
                                <span className="font-semibold text-foreground">
                                    {completedSummary.outgoingWaiterName}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Incoming Server:
                                </span>
                                <span className="font-semibold text-foreground">
                                    {completedSummary.incomingWaiterName}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tables Transferred:
                                </span>
                                <span className="font-bold text-primary">
                                    {completedSummary.tablesTransferredCount}{" "}
                                    {completedSummary.tablesTransferredCount ===
                                    1
                                        ? "Table"
                                        : "Tables"}
                                </span>
                            </div>
                            {completedSummary.tablesTransferredNames?.length >
                                0 && (
                                <div className="text-[11px] text-muted-foreground pl-2">
                                    {completedSummary.tablesTransferredNames.join(
                                        ", ",
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between border-t border-border/50 pt-1.5">
                                <span className="text-muted-foreground">
                                    Cash Transferred:
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {completedSummary.cashTransferredFormatted}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
