"use client";

import { useState } from "react";
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
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

function localYmd(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function shiftYmd(ymd: string, days: number) {
    const date = new Date(`${ymd}T12:00:00`);
    date.setDate(date.getDate() + days);
    return localYmd(date);
}

function closeStatusLabel(
    status: string,
    t: ReturnType<typeof useTranslations<"managerDailyClose">>,
) {
    if (status === "NONE") return t("statusNotDrafted");
    if (status === "LOCKED") return t("statusLocked");
    if (status === "APPROVED") return t("statusApproved");
    if (status === "READY_FOR_REVIEW") return t("statusReadyForReview");
    if (status === "DRAFT") return t("statusDraft");
    return status;
}

function blockerTitle(
    code: string,
    t: ReturnType<typeof useTranslations<"managerDailyClose">>,
) {
    const key = `blocker.${code}` as const;
    return t.has(key) ? t(key) : code.replaceAll("_", " ").toLowerCase();
}

type DailyClosePanelProps = {
    mode?: "manager" | "cashier";
};

export default function DailyClosePanel({
    mode = "manager",
}: DailyClosePanelProps) {
    const t = useTranslations("managerDailyClose");
    const isCashier = mode === "cashier";
    const today = localYmd();
    const yesterday = shiftYmd(today, -1);
    const [selectedDate, setSelectedDate] = useState(today);
    const businessDate = isCashier ? today : selectedDate;
    const { data, isLoading, isError } = useDailyClosePreviewQuery(
        { businessDate },
        { pollingInterval: 10000, refetchOnFocus: true },
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
        return <p className="text-[12px] text-slate-gray">{t("loading")}</p>;
    }

    if (isError || !preview) {
        return <p className="text-[12px] text-slate-gray">{t("loadError")}</p>;
    }

    const summary = preview.summary;
    const pendingTransfer = Number(summary.pendingTransferAmount);
    const undropped = Number(summary.undroppedWaiterCash);
    const openTables = preview.openTableCount ?? 0;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {isCashier ? (
                        <p className="text-[12px] font-medium text-foreground">
                            {t("todayOnly")}
                        </p>
                    ) : (
                        <div className="inline-flex rounded-full border border-hairline bg-card p-0.5">
                            {(
                                [
                                    { id: today, label: t("today") },
                                    { id: yesterday, label: t("yesterday") },
                                ] as const
                            ).map(chip => (
                                <button
                                    key={chip.id}
                                    type="button"
                                    onClick={() => setSelectedDate(chip.id)}
                                    className={cn(
                                        "h-6 rounded-full px-2 text-[11px] font-medium",
                                        selectedDate === chip.id
                                            ? "bg-foreground text-background"
                                            : "text-slate-gray hover:text-foreground",
                                    )}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <Badge
                        variant={
                            status === "LOCKED"
                                ? "success"
                                : status === "NONE"
                                  ? "outline"
                                  : "warning"
                        }
                    >
                        {closeStatusLabel(status, t)}
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {!closeId ? (
                        <button
                            type="button"
                            disabled={creating}
                            onClick={() => void onCreate()}
                            className="inline-flex h-7 items-center rounded-full bg-foreground px-3 text-[11px] font-medium text-background disabled:opacity-50"
                        >
                            {creating ? t("creating") : t("createDraft")}
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={refreshing || status === "LOCKED"}
                            onClick={() => void onRefresh()}
                            className="inline-flex h-7 items-center rounded-full border border-hairline px-3 text-[11px] font-medium disabled:opacity-50"
                        >
                            {refreshing ? t("refreshing") : t("refresh")}
                        </button>
                    )}
                    {!isCashier && closeId ? (
                        <>
                            <button
                                type="button"
                                disabled={
                                    approving ||
                                    status === "LOCKED" ||
                                    status === "APPROVED"
                                }
                                onClick={() => void onApprove()}
                                className="inline-flex h-7 items-center rounded-full border border-hairline px-3 text-[11px] font-medium disabled:opacity-50"
                            >
                                {approving ? t("approving") : t("approve")}
                            </button>
                            <button
                                type="button"
                                disabled={
                                    locking || status === "LOCKED" || !ready
                                }
                                onClick={() => void onLock()}
                                className="inline-flex h-7 items-center rounded-full bg-foreground px-3 text-[11px] font-medium text-background disabled:opacity-50"
                            >
                                {locking ? t("locking") : t("lockDay")}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-gray">
                <span>
                    <strong className="text-[16px] text-foreground">
                        {preview.orderCount ?? 0}
                    </strong>{" "}
                    {t("ordersToday")}
                </span>
                <span>
                    <strong className="text-[16px] text-foreground">
                        {preview.itemCount ?? 0}
                    </strong>{" "}
                    {t("itemsToday")}
                </span>
                <span
                    className={openTables > 0 ? "text-destructive" : undefined}
                >
                    <strong className="text-[16px]">{openTables}</strong>{" "}
                    {t("openTables")}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                    [
                        {
                            label: t("netBilled"),
                            value: formatEtb(Number(summary.netBilledSales)),
                        },
                        {
                            label: t("cashSales"),
                            value: formatEtb(Number(summary.cashSales)),
                        },
                        {
                            label: t("expectedCash"),
                            value: formatEtb(
                                Number(summary.cashierExpectedCash),
                            ),
                        },
                        {
                            label: t("undroppedCash"),
                            value: formatEtb(undropped),
                            warn: undropped > 0,
                        },
                    ] as const
                ).map(card => (
                    <div
                        key={card.label}
                        className="rounded-2xl border border-hairline bg-card px-4 py-3"
                    >
                        <p className="text-[11px] font-medium text-slate-gray">
                            {card.label}
                        </p>
                        <p
                            className={cn(
                                "mt-1 text-[18px] font-semibold tracking-tight",
                                "warn" in card && card.warn
                                    ? "text-destructive"
                                    : "text-foreground",
                            )}
                        >
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            {pendingTransfer > 0 ? (
                <p className="text-[13px] text-destructive">
                    {t("pendingTransfer")}: {formatEtb(pendingTransfer)}
                </p>
            ) : null}

            <section className="rounded-2xl border border-hairline bg-card p-4">
                <h2 className="text-[14px] font-semibold">
                    {t("leftoverTitle")}
                </h2>
                {blockers.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                        {blockers.map(blocker => (
                            <li
                                key={`${blocker.code}-${blocker.entityId ?? blocker.message}`}
                                className="rounded-xl border border-hairline bg-secondary/40 px-3 py-2"
                            >
                                <p className="text-[13px] font-semibold text-foreground">
                                    {blockerTitle(blocker.code, t)}
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    {blocker.message}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-1 text-[13px] text-slate-gray">
                        {t("leftoverEmpty")}
                    </p>
                )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-hairline bg-card">
                <div className="border-b border-hairline px-4 py-3">
                    <h2 className="text-[14px] font-semibold">
                        {t("waiterLines")}
                    </h2>
                    <p className="text-[12px] text-slate-gray">
                        {t("waiterLinesHint")}
                    </p>
                </div>
                {waiters.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-hairline text-[11px] font-medium text-slate-gray">
                                    <th className="px-4 py-2">
                                        {t("colWaiter")}
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        {t("colOrders")}
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        {t("colCash")}
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        {t("colDropped")}
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        {t("colStill")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {waiters.map(waiter => (
                                    <tr key={waiter.shiftSessionId}>
                                        <td className="px-4 py-2.5 font-medium">
                                            {waiter.waiterName}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-gray">
                                            {waiter.ordersCreatedCount}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            {formatEtb(
                                                Number(waiter.cashCollected),
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            {formatEtb(
                                                Number(waiter.cashDropped),
                                            )}
                                        </td>
                                        <td
                                            className={cn(
                                                "px-4 py-2.5 text-right font-medium",
                                                Number(waiter.undroppedCash) > 0
                                                    ? "text-destructive"
                                                    : "text-slate-gray",
                                            )}
                                        >
                                            {formatEtb(
                                                Number(waiter.undroppedCash),
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="px-4 py-3 text-[13px] text-slate-gray">
                        {t("waiterLinesHint")}
                    </p>
                )}
            </section>

            {!isCashier && recons.length > 0 ? (
                <ul className="space-y-2">
                    {recons.map(recon => (
                        <li
                            key={recon.reconciliationId}
                            className="flex flex-wrap items-center justify-between gap-2 text-[12px]"
                        >
                            <span>
                                {recon.cashierName ?? t("cashierFallback")} ·{" "}
                                {formatEtb(Number(recon.countedCash))}
                            </span>
                            <span className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void approveRecon({
                                            reconciliationId:
                                                recon.reconciliationId,
                                        });
                                    }}
                                    className="h-7 rounded-full bg-foreground px-2.5 text-[11px] font-medium text-background"
                                >
                                    {t("approve")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        void flagRecon({
                                            reconciliationId:
                                                recon.reconciliationId,
                                            reviewComment: t("flagFollowUp"),
                                        });
                                    }}
                                    className="h-7 rounded-full border border-hairline px-2.5 text-[11px]"
                                >
                                    {t("flag")}
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            ) : null}

            {error ? (
                <p className="text-[12px] text-destructive">{error}</p>
            ) : null}
            {ok ? <p className="text-[12px] text-emerald-700">{ok}</p> : null}
        </div>
    );
}
