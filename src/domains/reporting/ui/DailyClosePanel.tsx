"use client";

import { useMemo, useState } from "react";
import {
    useApproveDailyCloseMutation,
    useCreateDailyCloseMutation,
    useDailyClosePreviewQuery,
    useLockDailyCloseMutation,
    useRefreshDailyCloseMutation,
} from "@/context/services/dailyCloseApi";
import {
    useApproveReconciliationMutation,
    useFlagReconciliationMutation,
    usePendingReconciliationsQuery,
} from "@/context/services/reconciliationApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";

function statusBadge(status: string) {
    if (status === "LOCKED") return "success" as const;
    if (status === "APPROVED" || status === "READY_FOR_REVIEW")
        return "warning" as const;
    return "outline" as const;
}

export default function DailyClosePanel() {
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const { data, isLoading, isError } = useDailyClosePreviewQuery(
        { businessDate: today },
        { pollingInterval: 10000 },
    );
    const { data: pendingRecons } = usePendingReconciliationsQuery(undefined, {
        pollingInterval: 10000,
    });
    const [createClose, { isLoading: creating }] = useCreateDailyCloseMutation();
    const [refreshClose, { isLoading: refreshing }] =
        useRefreshDailyCloseMutation();
    const [approveClose, { isLoading: approving }] =
        useApproveDailyCloseMutation();
    const [lockClose, { isLoading: locking }] = useLockDailyCloseMutation();
    const [approveRecon] = useApproveReconciliationMutation();
    const [flagRecon] = useFlagReconciliationMutation();
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    const preview = data?.data;
    const closeId = preview?.existingDailyCloseId ?? null;
    const version = preview?.existingVersion ?? 1;
    const status = preview?.existingStatus ?? "NONE";
    const ready = preview?.readiness.ready ?? false;
    const blockers = preview?.readiness.blockers ?? [];
    const waiters = preview?.waiters ?? [];
    const recons = pendingRecons?.data ?? [];

    async function onCreate() {
        if (!preview) return;
        setError("");
        setOk("");
        try {
            await createClose({ businessDate: preview.businessDate }).unwrap();
            setOk("Daily close draft created.");
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "DAILY_CLOSE_ALREADY_EXISTS") {
                    setError("A close already exists for today — refresh it.");
                    return;
                }
            }
            setError("Could not create daily close.");
        }
    }

    async function onRefresh() {
        if (!closeId) return;
        setError("");
        setOk("");
        try {
            await refreshClose({ dailyCloseId: closeId }).unwrap();
            setOk("Snapshot refreshed.");
        } catch {
            setError("Could not refresh.");
        }
    }

    async function onApprove() {
        if (!closeId) return;
        setError("");
        setOk("");
        try {
            await approveClose({
                dailyCloseId: closeId,
                expectedVersion: version,
            }).unwrap();
            setOk("Daily close approved.");
        } catch {
            setError("Could not approve. Refresh and try again.");
        }
    }

    async function onLock() {
        if (!closeId) return;
        setError("");
        setOk("");
        try {
            await lockClose({
                dailyCloseId: closeId,
                expectedVersion: version,
            }).unwrap();
            setOk("Business day locked.");
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "DAILY_CLOSE_BLOCKED") {
                    setError(
                        "Still blocked — clear open tables, pending transfers, and missing reconciliations.",
                    );
                    return;
                }
            }
            setError("Could not lock. Refresh and try again.");
        }
    }

    if (isLoading) {
        return <p className="text-slate-gray">Loading daily close…</p>;
    }

    if (isError || !preview) {
        return (
            <p className="text-slate-gray">
                Could not load daily close preview.
            </p>
        );
    }

    const summary = preview.summary;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">Net billed</p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(summary.netBilledSales))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">Cash sales</p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(summary.cashSales))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        Verified transfer
                    </p>
                    <p className="text-[20px] font-semibold text-brand">
                        {formatEtb(Number(summary.verifiedTransferSales))}
                    </p>
                </div>
            </div>

            <article className="rounded-[16px] border border-hairline bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold">{preview.businessDate}</h2>
                        <p className="text-[13px] text-slate-gray">
                            Cashier variance{" "}
                            {formatEtb(Number(summary.cashierVariance))} ·
                            undropped{" "}
                            {formatEtb(Number(summary.undroppedWaiterCash))}
                        </p>
                    </div>
                    <Badge variant={statusBadge(status)}>
                        {status === "NONE" ? "Not drafted" : status}
                    </Badge>
                </div>

                {blockers.length > 0 ? (
                    <ul className="mt-4 space-y-2 text-[14px]">
                        {blockers.map(blocker => (
                            <li
                                key={`${blocker.code}-${blocker.entityId ?? blocker.message}`}
                                className="text-slate-gray"
                            >
                                <span className="font-medium text-foreground">
                                    {blocker.code}
                                </span>
                                {" — "}
                                {blocker.message}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 text-[14px] text-[#046645]">
                        Ready to lock — no blockers.
                    </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    {!closeId ? (
                        <Button disabled={creating} onClick={onCreate}>
                            {creating ? "Creating…" : "Create draft"}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                disabled={refreshing || status === "LOCKED"}
                                onClick={onRefresh}
                            >
                                {refreshing ? "Refreshing…" : "Refresh"}
                            </Button>
                            <Button
                                variant="outline"
                                disabled={
                                    approving ||
                                    status === "LOCKED" ||
                                    status === "APPROVED"
                                }
                                onClick={onApprove}
                            >
                                {approving ? "Approving…" : "Approve"}
                            </Button>
                            <Button
                                disabled={locking || status === "LOCKED" || !ready}
                                onClick={onLock}
                            >
                                {locking ? "Locking…" : "Lock day"}
                            </Button>
                        </>
                    )}
                </div>
            </article>

            {waiters.length > 0 ? (
                <article className="rounded-[16px] border border-hairline bg-card p-6">
                    <h2 className="font-semibold">Waiter lines</h2>
                    <ul className="mt-4 space-y-3 text-[14px]">
                        {waiters.map(waiter => (
                            <li key={waiter.shiftSessionId}>
                                <div className="flex justify-between gap-3">
                                    <span>
                                        {waiter.waiterName} ·{" "}
                                        {waiter.ordersCreatedCount} orders
                                    </span>
                                    <span>
                                        {formatEtb(
                                            Number(waiter.netAttributedSales),
                                        )}
                                    </span>
                                </div>
                                <p className="text-slate-gray">
                                    Cash{" "}
                                    {formatEtb(Number(waiter.cashCollected))} ·
                                    dropped{" "}
                                    {formatEtb(Number(waiter.cashDropped))} ·
                                    still on them{" "}
                                    {formatEtb(Number(waiter.undroppedCash))}
                                </p>
                            </li>
                        ))}
                    </ul>
                </article>
            ) : null}

            {recons.length > 0 ? (
                <article className="rounded-[16px] border border-hairline bg-card p-6">
                    <h2 className="font-semibold">
                        Reconciliations to review
                    </h2>
                    <ul className="mt-4 space-y-3">
                        {recons.map(recon => (
                            <li
                                key={recon.reconciliationId}
                                className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3 last:border-0"
                            >
                                <div>
                                    <p className="font-medium">
                                        {recon.cashierName ?? "Cashier"}
                                    </p>
                                    <p className="text-[13px] text-slate-gray">
                                        Expected{" "}
                                        {formatEtb(Number(recon.expectedCash))}{" "}
                                        · counted{" "}
                                        {formatEtb(Number(recon.countedCash))} ·
                                        variance{" "}
                                        {formatEtb(Number(recon.variance))}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            void approveRecon({
                                                reconciliationId:
                                                    recon.reconciliationId,
                                            });
                                        }}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            void flagRecon({
                                                reconciliationId:
                                                    recon.reconciliationId,
                                                reviewComment: "Needs follow-up",
                                            });
                                        }}
                                    >
                                        Flag
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </article>
            ) : null}

            {error ? (
                <p className="text-[13px] text-red-600">{error}</p>
            ) : null}
            {ok ? (
                <p className="text-[13px] text-[#046645]">{ok}</p>
            ) : null}
        </div>
    );
}
