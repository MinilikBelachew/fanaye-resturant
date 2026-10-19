"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    DollarSign,
    Lock,
    ShieldCheck,
    UserCheck,
    Vault,
    X,
} from "lucide-react";
import {
    useHandoverCandidatesQuery,
    useHandoverMutation,
} from "@/context/services/shiftsApi";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { getStaffAvatarUrl } from "@/lib/avatars";
import type { ShiftHandoverResponse } from "@/domains/identity/domain/shift";

interface CashierHandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentVersion: number;
    expectedCash?: number;
}

export default function CashierHandoverModal({
    isOpen,
    onClose,
    currentVersion,
    expectedCash = 0,
}: CashierHandoverModalProps) {
    const { data: candidates, isLoading: candidatesLoading } =
        useHandoverCandidatesQuery(undefined, { skip: !isOpen });
    const [executeHandover, { isLoading: submitting }] = useHandoverMutation();

    const [step, setStep] = useState<"count" | "incoming_pin" | "complete">(
        "count",
    );
    const [countedInput, setCountedInput] = useState(
        expectedCash > 0 ? String(expectedCash) : "",
    );
    const [floatInput, setFloatInput] = useState(
        expectedCash > 0 ? String(Math.min(2000, expectedCash)) : "0",
    );
    const [selectedCandidateId, setSelectedCandidateId] = useState("");
    const [incomingPin, setIncomingPin] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [completedSummary, setCompletedSummary] =
        useState<ShiftHandoverResponse | null>(null);

    const counted = Math.max(0, parseFloat(countedInput) || 0);
    const floatNext = Math.max(0, parseFloat(floatInput) || 0);
    const safeDrop = Math.max(0, counted - floatNext);
    const variance = counted - expectedCash;

    const selectedCandidate = useMemo(
        () => candidates?.find(c => c.membershipId === selectedCandidateId),
        [candidates, selectedCandidateId],
    );

    if (!isOpen) return null;

    const handleContinueToPin = () => {
        setError("");
        if (
            countedInput.trim() === "" ||
            Number.isNaN(parseFloat(countedInput))
        ) {
            setError(
                "Enter the physical cash counted in the drawer (0 is allowed if empty).",
            );
            return;
        }
        if (counted < 0) {
            setError("Counted cash cannot be negative.");
            return;
        }
        if (floatNext > counted) {
            setError("Starting float cannot exceed the total cash in drawer.");
            return;
        }
        if (!selectedCandidateId) {
            setError("Please select the incoming cashier who will take over.");
            return;
        }
        setStep("incoming_pin");
    };

    const handleConfirmHandover = async () => {
        setError("");
        if (!incomingPin || incomingPin.trim().length < 4) {
            setError("Incoming cashier must enter a 4 digit security PIN.");
            return;
        }

        try {
            const res = await executeHandover({
                expectedVersion: currentVersion,
                countedAmount: counted,
                floatForNextCashier: floatNext,
                incomingCashierMembershipId: selectedCandidateId,
                incomingCashierPin: incomingPin.trim(),
                notes: notes.trim() || undefined,
            }).unwrap();

            setCompletedSummary(res);
            setStep("complete");
            toast.success("Shift successfully handed over to next cashier!");
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "data" in err
                    ? (err as { data?: { message?: string } }).data?.message ||
                      "Failed to complete handover."
                    : "Failed to complete handover.";
            setError(msg);
            toast.error(msg);
        }
    };

    const handleClose = () => {
        setStep("count");
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
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-hairline bg-card p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-hairline pb-3">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-normal text-brand">
                            <ShieldCheck className="size-3.5" />
                            Shift Handover & Drawer Transfer
                        </span>
                        <h3 className="mt-1.5 text-base font-normal tracking-tight text-foreground">
                            {step === "complete"
                                ? "Handover Completed"
                                : "Transfer Cash Desk to Next Cashier"}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {error ? (
                    <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-normal text-destructive">
                        {error}
                    </div>
                ) : null}

                {/* Step 1: Count & Split */}
                {step === "count" && (
                    <div className="mt-4 space-y-4">
                        {/* Expected Cash Tile */}
                        <div className="rounded-xl border border-hairline bg-secondary/30 p-3.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Expected Drawer Balance (Ledger)</span>
                                <span className="font-normal text-foreground text-sm font-mono">
                                    ETB {expectedCash.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Physical Cash Count */}
                        <div>
                            <label className="block text-xs font-normal text-foreground mb-1">
                                Physical Cash Counted in Drawer (ETB)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={countedInput}
                                    onChange={e =>
                                        setCountedInput(e.target.value)
                                    }
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-hairline bg-card pl-9 pr-3 py-2 text-sm font-normal text-foreground focus:border-brand focus:outline-none"
                                />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">
                                    Variance:
                                </span>
                                <span
                                    className={cn(
                                        "font-normal",
                                        variance === 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : variance > 0
                                              ? "text-blue-600 dark:text-blue-400"
                                              : "text-destructive",
                                    )}
                                >
                                    {variance === 0
                                        ? "±0.00 ETB (Exact Match)"
                                        : variance > 0
                                          ? `+${variance.toFixed(2)} ETB (Overage)`
                                          : `${variance.toFixed(2)} ETB (Shortage)`}
                                </span>
                            </div>
                        </div>

                        {/* Allocation: Float vs Safe Drop */}
                        <div className="rounded-xl border border-hairline bg-secondary/20 p-3.5 space-y-3">
                            <p className="text-xs font-normal text-foreground">
                                Drawer Allocation
                            </p>
                            <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                    Leave as Starting Float for Next Cashier
                                    (ETB)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={counted}
                                    step="0.5"
                                    value={floatInput}
                                    onChange={e =>
                                        setFloatInput(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-normal text-foreground focus:border-brand focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-hairline pt-2 text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Vault className="size-3.5 text-amber-500" />
                                    Safe Drop to Office:
                                </span>
                                <span className="font-normal font-mono text-foreground">
                                    ETB {safeDrop.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Incoming Cashier Selection */}
                        <div>
                            <label className="block text-xs font-normal text-foreground mb-1.5">
                                Select Incoming Cashier
                            </label>
                            {candidatesLoading ? (
                                <div className="rounded-xl border border-hairline bg-secondary/20 p-3 text-center text-xs text-muted-foreground">
                                    Loading branch cashiers...
                                </div>
                            ) : candidates && candidates.length > 0 ? (
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
                                                    "w-full flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-colors cursor-pointer",
                                                    isSelected
                                                        ? "border-brand bg-brand/10 text-foreground"
                                                        : "border-hairline bg-card hover:bg-secondary/40 text-foreground",
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-hairline bg-secondary">
                                                        <img
                                                            src={getStaffAvatarUrl(
                                                                candidate.displayName,
                                                                candidate.photoUrl,
                                                            )}
                                                            alt={
                                                                candidate.displayName
                                                            }
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-normal text-foreground truncate">
                                                            {
                                                                candidate.displayName
                                                            }
                                                        </p>
                                                        <span className="inline-block rounded-md bg-secondary px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
                                                            Cashier
                                                        </span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="size-4 shrink-0 text-brand" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                                    No other active cashiers found in this
                                    branch. Only staff with the Cashier role can
                                    take over.
                                </div>
                            )}
                        </div>

                        {/* Handover Note */}
                        <div>
                            <label className="block text-[11px] font-normal text-muted-foreground mb-1">
                                Notes (Optional)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="e.g. Afternoon shift handover, verified 500 ETB bills"
                                className="w-full rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs text-foreground focus:border-brand focus:outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-xl border border-hairline px-4 py-2 text-xs font-normal text-muted-foreground hover:bg-secondary cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleContinueToPin}
                                disabled={!selectedCandidateId || counted <= 0}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-normal text-brand-foreground hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Next: Verify Incoming Cashier
                                <ArrowRight className="size-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Incoming Cashier PIN Verification */}
                {step === "incoming_pin" && (
                    <div className="mt-4 space-y-4">
                        <div className="rounded-xl border border-hairline bg-secondary/30 p-4 text-center space-y-2">
                            <div className="relative mx-auto size-12 overflow-hidden rounded-full border border-hairline bg-secondary">
                                <img
                                    src={getStaffAvatarUrl(
                                        selectedCandidate?.displayName,
                                        selectedCandidate?.photoUrl,
                                    )}
                                    alt={
                                        selectedCandidate?.displayName ||
                                        "Cashier"
                                    }
                                    className="size-full object-cover"
                                />
                            </div>
                            <h4 className="text-sm font-normal text-foreground">
                                Incoming Cashier Verification
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                <span className="font-normal text-foreground">
                                    {selectedCandidate?.displayName}
                                </span>
                                , please enter your security PIN to confirm
                                taking custody of the drawer.
                            </p>
                        </div>

                        {/* Handover Recap */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg border border-hairline bg-card p-2.5">
                                <p className="text-[10px] text-muted-foreground">
                                    Counted Cash
                                </p>
                                <p className="font-normal font-mono text-foreground">
                                    ETB {counted.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-hairline bg-card p-2.5">
                                <p className="text-[10px] text-muted-foreground">
                                    Starting Float for You
                                </p>
                                <p className="font-normal font-mono text-brand">
                                    ETB {floatNext.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* PIN Input */}
                        <div>
                            <label className="block text-xs font-normal text-foreground mb-1 text-center">
                                Enter 4 Digit PIN
                            </label>
                            <input
                                type="password"
                                maxLength={4}
                                autoFocus
                                value={incomingPin}
                                onChange={e =>
                                    setIncomingPin(
                                        e.target.value.replace(/\D/g, ""),
                                    )
                                }
                                placeholder="••••"
                                className="w-48 mx-auto block rounded-xl border border-hairline bg-card px-4 py-2 text-center text-lg tracking-[0.3em] font-mono text-foreground focus:border-brand focus:outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex items-center justify-between gap-2 border-t border-hairline pt-4">
                            <button
                                type="button"
                                onClick={() => setStep("count")}
                                className="rounded-xl border border-hairline px-4 py-2 text-xs font-normal text-muted-foreground hover:bg-secondary cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmHandover}
                                disabled={submitting || incomingPin.length < 4}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-normal text-brand-foreground hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {submitting
                                    ? "Transferring Drawer..."
                                    : "Confirm & Complete Handover"}
                                <CheckCircle2 className="size-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Complete Screen */}
                {step === "complete" && completedSummary && (
                    <div className="mt-4 space-y-4 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-7" />
                        </div>
                        <h4 className="text-base font-normal text-foreground">
                            Handover Complete
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Drawer custody transferred from{" "}
                            <span className="font-normal text-foreground">
                                {completedSummary.outgoingCashierName}
                            </span>{" "}
                            to{" "}
                            <span className="font-normal text-foreground">
                                {completedSummary.incomingCashierName}
                            </span>
                            .
                        </p>

                        <div className="rounded-xl border border-hairline bg-secondary/30 p-4 space-y-2 text-left text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Physical Cash Counted:
                                </span>
                                <span className="font-normal font-mono text-foreground">
                                    {completedSummary.countedAmountFormatted}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Opening Float Transferred:
                                </span>
                                <span className="font-normal font-mono text-brand">
                                    {completedSummary.floatTransferredFormatted}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Safe Drop Deposited:
                                </span>
                                <span className="font-normal font-mono text-foreground">
                                    {completedSummary.safeDropAmountFormatted}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Reconciliation Variance:
                                </span>
                                <span className="font-normal font-mono text-foreground">
                                    {completedSummary.varianceAmountFormatted}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-xl bg-brand px-6 py-2.5 text-xs font-normal text-brand-foreground hover:bg-brand/90 transition-colors cursor-pointer"
                            >
                                Finish & Exit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
