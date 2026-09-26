"use client";

import { useState } from "react";
import {
    useInitiateCashDropMutation,
    useWaiterCashDropsQuery,
    useWaiterCashSummaryQuery,
} from "@/context/services/cashApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";
import { useTranslations } from "next-intl";

function statusLabel(status: string) {
    return status.replaceAll("_", " ").toLowerCase();
}

export default function WaiterCashDropPanel() {
    const t = useTranslations("waiter");
    const {
        data: summary,
        isLoading,
        isError,
    } = useWaiterCashSummaryQuery(undefined, { pollingInterval: 5000 });
    const { data: dropsData } = useWaiterCashDropsQuery(undefined, {
        pollingInterval: 5000,
    });
    const [initiate, { isLoading: dropping }] = useInitiateCashDropMutation();
    const undropped = Number(summary?.undroppedCash ?? 0);
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const drops = dropsData?.data ?? [];

    async function onDrop() {
        setError("");
        setOk("");
        try {
            await initiate({ amount: Number(amount).toFixed(2) }).unwrap();
            setAmount("");
            setOk(t("cashDropSent"));
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "CASH_DROP_EXCEEDS_UNDROPPED") {
                    setError(
                        t("onlyHaveUndropped", {
                            amount: formatEtb(undropped),
                        }),
                    );
                    return;
                }
            }
            setError(t("couldNotStartCashDrop"));
        }
    }

    if (isLoading) {
        return <p className="text-slate-gray">{t("loadingCashPouch")}</p>;
    }

    if (isError || !summary) {
        return <p className="text-slate-gray">{t("clockInToSeeCash")}</p>;
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("collected")}
                    </p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(summary.cashCollected))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("dropped")}
                    </p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(summary.cashDropped))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("pendingDrop")}
                    </p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(summary.pendingCashDropAmount))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("stillOnYou")}
                    </p>
                    <p className="text-[20px] font-semibold text-brand">
                        {formatEtb(undropped)}
                    </p>
                </div>
            </div>

            <div className="rounded-[16px] border border-hairline bg-card p-4">
                <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                    {t("dropCashToCashier")}
                </p>
                <p className="mt-1 text-[14px] text-slate-gray">
                    {t("dropCashHint")}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                        value={amount}
                        onChange={event => setAmount(event.target.value)}
                        placeholder={undropped.toFixed(2)}
                        inputMode="decimal"
                        className="sm:max-w-[180px]"
                    />
                    <Button
                        disabled={dropping || undropped <= 0 || !amount}
                        onClick={onDrop}
                    >
                        {dropping ? t("sending") : t("startCashDrop")}
                    </Button>
                    {undropped > 0 ? (
                        <Button
                            variant="outline"
                            disabled={dropping}
                            onClick={() => {
                                setAmount(undropped.toFixed(2));
                            }}
                        >
                            {t("useFullAmount")}
                        </Button>
                    ) : null}
                </div>
                {error ? (
                    <p className="mt-2 text-[13px] text-red-600">{error}</p>
                ) : null}
                {ok ? (
                    <p className="mt-2 text-[13px] text-brand">{ok}</p>
                ) : null}
            </div>

            {drops.length > 0 ? (
                <ul className="space-y-2">
                    {drops.map(drop => (
                        <li
                            key={drop.cashDropId}
                            className="flex items-center justify-between rounded-[12px] border border-hairline bg-card px-4 py-3 text-[14px]"
                        >
                            <span>
                                {formatEtb(Number(drop.declaredAmount))}
                                {drop.countedAmount
                                    ? ` · ${t("countedAmount", {
                                          amount: formatEtb(
                                              Number(drop.countedAmount),
                                          ),
                                      })}`
                                    : ""}
                            </span>
                            <span className="text-[12px] font-medium uppercase text-slate-gray">
                                {statusLabel(drop.status)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
