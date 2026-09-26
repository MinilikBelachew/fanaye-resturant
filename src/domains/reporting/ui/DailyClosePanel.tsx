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
import { useTranslations } from "next-intl";

function statusBadge(status: string) {
    if (status === "LOCKED") return "success" as const;
    if (status === "APPROVED" || status === "READY_FOR_REVIEW")
        return "warning" as const;
    return "outline" as const;
}

function closeStatusLabel(
    status: string,
    t: ReturnType<typeof useTranslations<"managerDailyClose">>,
) {
    if (status === "NONE") return t("statusNotDrafted");
    if (status === "LOCKED") return t("statusLocked");
    if (status === "APPROVED") return t("statusApproved");
    if (status === "READY_FOR_REVIEW") return t("statusReadyForReview");
    return status;
}

type DailyClosePanelProps = {
    /** Cashiers prepare/refresh; managers approve & lock. */
    mode?: "manager" | "cashier";
};

export default function DailyClosePanel({
    mode = "manager",
}: DailyClosePanelProps) {
    const t = useTranslations("managerDailyClose");
    const isCashier = mode === "cashier";
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const { data, isLoading, isError } = useDailyClosePreviewQuery(
        { businessDate: today },
        { pollingInterval: 10000 },
    );
    const { data: pendingRecons } = usePendingReconciliationsQuery(undefined, {
        skip: isCashier,
        pollingInterval: 10000,
    });
    const [createClose, { isLoading: creating }] =
        useCreateDailyCloseMutation();
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
    const stations = preview?.stations ?? [];
    const recons = pendingRecons?.data ?? [];

    async function onCreate() {
        if (!preview) return;
        setError("");
        setOk("");
        try {
            await createClose({ businessDate: preview.businessDate }).unwrap();
            setOk(t("okDraftCreated"));
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "DAILY_CLOSE_ALREADY_EXISTS") {
                    setError(t("errorAlreadyExists"));
                    return;
                }
            }
            setError(t("errorCreate"));
        }
    }

    async function onRefresh() {
        if (!closeId) return;
        setError("");
        setOk("");
        try {
            await refreshClose({ dailyCloseId: closeId }).unwrap();
            setOk(t("okRefreshed"));
        } catch {
            setError(t("errorRefresh"));
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
            setOk(t("okApproved"));
        } catch {
            setError(t("errorApprove"));
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
            setOk(t("okLocked"));
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "DAILY_CLOSE_BLOCKED") {
                    setError(t("errorBlocked"));
                    return;
                }
            }
            setError(t("errorLock"));
        }
    }

    if (isLoading) {
        return <p className="text-slate-gray">{t("loading")}</p>;
    }

    if (isError || !preview) {
        return <p className="text-slate-gray">{t("loadError")}</p>;
    }

    const summary = preview.summary;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("netBilled")}
                    </p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(summary.netBilledSales))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("cashSales")}
                    </p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(summary.cashSales))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("verifiedTransfer")}
                    </p>
                    <p className="text-[20px] font-semibold text-brand">
                        {formatEtb(Number(summary.verifiedTransferSales))}
                    </p>
                </div>
            </div>

            <article className="rounded-[16px] border border-hairline bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold">
                            {preview.businessDate}
                        </h2>
                        <p className="text-[13px] text-slate-gray">
                            {t("cashierVarianceLine", {
                                variance: formatEtb(
                                    Number(summary.cashierVariance),
                                ),
                                undropped: formatEtb(
                                    Number(summary.undroppedWaiterCash),
                                ),
                            })}
                        </p>
                    </div>
                    <Badge variant={statusBadge(status)}>
                        {closeStatusLabel(status, t)}
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
                        {t("readyNoBlockers")}
                    </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    {!closeId ? (
                        <Button disabled={creating} onClick={onCreate}>
                            {creating ? t("creating") : t("createDraft")}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                disabled={refreshing || status === "LOCKED"}
                                onClick={onRefresh}
                            >
                                {refreshing ? t("refreshing") : t("refresh")}
                            </Button>
                            {!isCashier ? (
                                <>
                                    <Button
                                        variant="outline"
                                        disabled={
                                            approving ||
                                            status === "LOCKED" ||
                                            status === "APPROVED"
                                        }
                                        onClick={onApprove}
                                    >
                                        {approving
                                            ? t("approving")
                                            : t("approve")}
                                    </Button>
                                    <Button
                                        disabled={
                                            locking ||
                                            status === "LOCKED" ||
                                            !ready
                                        }
                                        onClick={onLock}
                                    >
                                        {locking ? t("locking") : t("lockDay")}
                                    </Button>
                                </>
                            ) : null}
                        </>
                    )}
                </div>
                {isCashier ? (
                    <p className="mt-3 text-[13px] text-slate-gray">
                        {t("cashierHint")}
                    </p>
                ) : null}
            </article>

            {waiters.length > 0 ? (
                <article className="rounded-[16px] border border-hairline bg-card p-6">
                    <h2 className="font-semibold">{t("waiterLines")}</h2>
                    <ul className="mt-4 space-y-3 text-[14px]">
                        {waiters.map(waiter => (
                            <li key={waiter.shiftSessionId}>
                                <div className="flex justify-between gap-3">
                                    <span>
                                        {waiter.waiterName} ·{" "}
                                        {t("ordersCount", {
                                            count: waiter.ordersCreatedCount,
                                        })}
                                    </span>
                                    <span>
                                        {formatEtb(
                                            Number(waiter.netAttributedSales),
                                        )}
                                    </span>
                                </div>
                                <p className="text-slate-gray">
                                    {t("waiterCashLine", {
                                        cash: formatEtb(
                                            Number(waiter.cashCollected),
                                        ),
                                        dropped: formatEtb(
                                            Number(waiter.cashDropped),
                                        ),
                                        still: formatEtb(
                                            Number(waiter.undroppedCash),
                                        ),
                                    })}
                                </p>
                            </li>
                        ))}
                    </ul>
                </article>
            ) : null}

            {stations.length > 0 ? (
                <article className="rounded-[16px] border border-hairline bg-card p-6">
                    <h2 className="font-semibold">{t("stationLines")}</h2>
                    <ul className="mt-4 space-y-3 text-[14px]">
                        {stations.map(station => (
                            <li key={station.stationId}>
                                <div className="flex justify-between gap-3">
                                    <span>{station.stationName}</span>
                                    <span>
                                        {t("itemsCount", {
                                            count: station.itemsHandledCount,
                                        })}
                                    </span>
                                </div>
                                <p className="text-slate-gray">
                                    {t("stationStats", {
                                        delayed: station.delayedItemCount,
                                        cannot: station.cannotPrepareCount,
                                    })}
                                </p>
                            </li>
                        ))}
                    </ul>
                </article>
            ) : null}

            {!isCashier && recons.length > 0 ? (
                <article className="rounded-[16px] border border-hairline bg-card p-6">
                    <h2 className="font-semibold">
                        {t("reconciliationsToReview")}
                    </h2>
                    <ul className="mt-4 space-y-3">
                        {recons.map(recon => (
                            <li
                                key={recon.reconciliationId}
                                className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3 last:border-0"
                            >
                                <div>
                                    <p className="font-medium">
                                        {recon.cashierName ??
                                            t("cashierFallback")}
                                    </p>
                                    <p className="text-[13px] text-slate-gray">
                                        {t("reconAmounts", {
                                            expected: formatEtb(
                                                Number(recon.expectedCash),
                                            ),
                                            counted: formatEtb(
                                                Number(recon.countedCash),
                                            ),
                                            variance: formatEtb(
                                                Number(recon.variance),
                                            ),
                                        })}
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
                                        {t("approve")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            void flagRecon({
                                                reconciliationId:
                                                    recon.reconciliationId,
                                                reviewComment:
                                                    t("flagFollowUp"),
                                            });
                                        }}
                                    >
                                        {t("flag")}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </article>
            ) : null}

            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            {ok ? <p className="text-[13px] text-[#046645]">{ok}</p> : null}
        </div>
    );
}
