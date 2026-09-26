"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useReconciliationPreviewQuery,
    useSubmitReconciliationMutation,
} from "@/context/services/reconciliationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatEtb } from "@/lib/money";

export default function CashierReconciliationPanel() {
    const t = useTranslations("cashier");
    const { data, isLoading, isError } = useReconciliationPreviewQuery(
        undefined,
        { pollingInterval: 8000 },
    );
    const [submit, { isLoading: submitting }] =
        useSubmitReconciliationMutation();
    const preview = data?.data;
    const [counted, setCounted] = useState("");
    const [comment, setComment] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    const expected = Number(preview?.expectedCash ?? 0);
    const countedValue = counted === "" ? expected : Number(counted);
    const variance = useMemo(
        () => countedValue - expected,
        [countedValue, expected],
    );
    const alreadySubmitted = Boolean(preview?.existingReconciliationId);
    const needsResubmit = Boolean(preview?.needsResubmit);
    const showForm = !alreadySubmitted || needsResubmit;

    async function onSubmit() {
        if (!preview) return;
        setError("");
        setOk("");
        try {
            await submit({
                cashierFinancialSessionId: preview.cashierFinancialSessionId,
                countedCash: Number(counted || preview.expectedCash).toFixed(2),
                comment: comment.trim() || undefined,
            }).unwrap();
            setCounted("");
            setComment("");
            setOk(
                needsResubmit
                    ? t("updatedReconciliationSubmitted")
                    : t("reconciliationSubmitted"),
            );
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "RECONCILIATION_VARIANCE_EXPLANATION_REQUIRED") {
                    setError(t("varianceExplanationRequired"));
                    return;
                }
                if (code === "RECONCILIATION_ALREADY_SUBMITTED") {
                    setError(t("alreadySubmittedSession"));
                    return;
                }
            }
            setError(t("submitReconciliationError"));
        }
    }

    if (isLoading) {
        return <p className="text-slate-gray">{t("loadingDrawerTotals")}</p>;
    }

    if (isError || !preview) {
        return <p className="text-slate-gray">{t("clockInToReconcile")}</p>;
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">{t("float")}</p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(preview.openingFloat))}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {t("floatAlwaysZero")}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("dropsReceived")}
                    </p>
                    <p className="text-[20px] font-semibold">
                        {formatEtb(Number(preview.cashDropsReceived))}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[12px] text-slate-gray">
                        {t("expectedNow")}
                    </p>
                    <p className="text-[20px] font-semibold text-brand">
                        {formatEtb(expected)}
                    </p>
                </div>
            </div>

            {alreadySubmitted ? (
                <article className="rounded-[16px] border border-hairline bg-card p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-semibold">
                            {needsResubmit
                                ? t("previousSubmissionOutdated")
                                : t("submitted")}
                        </h2>
                        <Badge variant={needsResubmit ? "warning" : "success"}>
                            {preview.existingStatus}
                        </Badge>
                    </div>
                    <p className="mt-2 text-[14px] text-slate-gray">
                        {t("lastCountLine", {
                            counted: formatEtb(
                                Number(preview.existingCountedCash ?? 0),
                            ),
                        })}
                        {preview.existingExpectedCash
                            ? ` ${t("againstExpected", {
                                  expected: formatEtb(
                                      Number(preview.existingExpectedCash),
                                  ),
                              })}`
                            : ""}
                        {preview.existingVariance
                            ? ` · ${t("varianceLine", {
                                  amount: formatEtb(
                                      Number(preview.existingVariance),
                                  ),
                              })}`
                            : ""}
                    </p>
                    {needsResubmit ? (
                        <p className="mt-3 text-[14px] text-[#c2410c]">
                            {t("moreCashLanded", {
                                expected: formatEtb(expected),
                            })}
                        </p>
                    ) : (
                        <p className="mt-3 text-[14px] text-[#046645]">
                            {t("drawerMatches")}
                        </p>
                    )}
                </article>
            ) : null}

            {showForm ? (
                <article className="rounded-[16px] border border-hairline bg-card p-5 space-y-3">
                    <h2 className="font-semibold">
                        {needsResubmit
                            ? t("countDrawerAgain")
                            : t("countDrawerCash")}
                    </h2>
                    <p className="text-[14px] text-slate-gray">
                        {t("countDrawerHint")}
                    </p>
                    <div>
                        <label className="text-[13px] text-slate-gray">
                            {t("countedAmount")}
                        </label>
                        <Input
                            className="mt-1 max-w-[220px]"
                            value={counted}
                            onChange={event => setCounted(event.target.value)}
                            placeholder={preview.expectedCash}
                            inputMode="decimal"
                        />
                    </div>
                    {Math.abs(variance) > 0.001 ? (
                        <div>
                            <p className="text-[13px] text-slate-gray">
                                {t("varianceNoteRequired", {
                                    amount: formatEtb(variance),
                                })}
                            </p>
                            <Input
                                className="mt-1"
                                value={comment}
                                onChange={event =>
                                    setComment(event.target.value)
                                }
                                placeholder={t("variancePlaceholder")}
                            />
                        </div>
                    ) : null}
                    <Button disabled={submitting} onClick={onSubmit}>
                        {submitting
                            ? t("submitting")
                            : needsResubmit
                              ? t("updateReconciliation")
                              : t("submitReconciliation")}
                    </Button>
                </article>
            ) : null}

            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            {ok ? <p className="text-[13px] text-[#046645]">{ok}</p> : null}
        </div>
    );
}
