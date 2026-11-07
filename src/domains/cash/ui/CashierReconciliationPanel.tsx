"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    Calendar,
    CheckCircle2,
    CreditCard,
    RefreshCw,
} from "lucide-react";
import {
    useReconciliationPreviewQuery,
    useSubmitReconciliationMutation,
} from "@/context/services/reconciliationApi";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

type DatePreset = "today" | "yesterday" | "custom";

function DateFilterBar({
    preset,
    from,
    to,
    onPreset,
    onFrom,
    onTo,
}: {
    preset: DatePreset;
    from: string;
    to: string;
    onPreset: (p: DatePreset) => void;
    onFrom: (v: string) => void;
    onTo: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {(["today", "yesterday", "custom"] as DatePreset[]).map(p => (
                <button
                    key={p}
                    type="button"
                    onClick={() => onPreset(p)}
                    className={cn(
                        "h-8 rounded-xl border px-3 text-[12px] font-medium transition-colors",
                        preset === p
                            ? "border-brand bg-brand/8 text-brand"
                            : "border-hairline bg-card text-slate-gray hover:text-foreground",
                    )}
                >
                    {p === "today"
                        ? "Today"
                        : p === "yesterday"
                          ? "Yesterday"
                          : "Custom"}
                </button>
            ))}
            {preset === "custom" && (
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-gray" />
                        <Input
                            type="date"
                            value={from}
                            onChange={e => onFrom(e.target.value)}
                            className="h-8 rounded-xl pl-8 text-[12px]"
                        />
                    </div>
                    <ArrowRight className="size-3.5 text-slate-gray" />
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-gray" />
                        <Input
                            type="date"
                            value={to}
                            onChange={e => onTo(e.target.value)}
                            className="h-8 rounded-xl pl-8 text-[12px]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({
    icon: Icon,
    iconBg,
    title,
    description,
    children,
}: {
    icon: React.ElementType;
    iconBg: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-hairline bg-card">
            <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
                <div
                    className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        iconBg,
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <div>
                    <p className="text-[14px] font-semibold text-foreground">
                        {title}
                    </p>
                    <p className="text-[11px] text-slate-gray">{description}</p>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Row({
    label,
    value,
    sub,
    accent,
    bold,
}: {
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
    bold?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5">
            <div>
                <p
                    className={cn(
                        "text-[13px]",
                        bold
                            ? "font-semibold text-foreground"
                            : "text-slate-gray",
                    )}
                >
                    {label}
                </p>
                {sub && <p className="text-[11px] text-slate-gray">{sub}</p>}
            </div>
            <p
                className={cn(
                    "tabular-nums text-[14px] font-semibold",
                    accent ? "text-brand" : "text-foreground",
                )}
            >
                {value}
            </p>
        </div>
    );
}

export default function CashierReconciliationPanel() {
    const t = useTranslations("cashier");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const [preset, setPreset] = useState<DatePreset>("today");
    const [customFrom, setCustomFrom] = useState(fmt(today));
    const [customTo, setCustomTo] = useState(fmt(today));

    const queryArgs = useMemo(() => {
        if (preset === "yesterday")
            return { from: fmt(yesterday), to: fmt(yesterday) };
        if (preset === "custom" && customFrom && customTo)
            return { from: customFrom, to: customTo };
        return undefined;
    }, [preset, customFrom, customTo]);

    const { data, isLoading, isError, refetch, isFetching } =
        useReconciliationPreviewQuery(queryArgs, { pollingInterval: 10000 });

    const [submit, { isLoading: submitting }] =
        useSubmitReconciliationMutation();
    const preview = data?.data;
    const [counted, setCounted] = useState("");
    const [comment, setComment] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [submitOk, setSubmitOk] = useState("");

    const expected = Number(preview?.expectedCash ?? 0);
    const countedValue = counted === "" ? expected : Number(counted);
    const variance = countedValue - expected;
    const alreadySubmitted = Boolean(preview?.existingReconciliationId);
    const needsResubmit = Boolean(preview?.needsResubmit);
    const showForm = !alreadySubmitted || needsResubmit;

    const billsGrand = Number(preview?.billsGrandTotal ?? 0);
    const billsCash = Number(preview?.billsTotalCash ?? 0);
    const billsDigital = Number(preview?.billsTotalDigital ?? 0);
    const digitalVerified = Number(preview?.digitalVerified ?? 0);
    const digitalPending = Number(preview?.digitalPending ?? 0);
    const billsCount = preview?.billsCount ?? 0;
    const cashVariance = expected - billsCash;
    const cashMatches = Math.abs(cashVariance) < 0.01;

    async function onSubmit() {
        if (!preview) return;
        setSubmitError("");
        setSubmitOk("");
        try {
            await submit({
                cashierFinancialSessionId: preview.cashierFinancialSessionId,
                countedCash: Number(counted || preview.expectedCash).toFixed(2),
                comment: comment.trim() || undefined,
            }).unwrap();
            setCounted("");
            setComment("");
            setSubmitOk(
                needsResubmit
                    ? t("updatedReconciliationSubmitted")
                    : t("reconciliationSubmitted"),
            );
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "RECONCILIATION_VARIANCE_EXPLANATION_REQUIRED") {
                    setSubmitError(t("varianceExplanationRequired"));
                    return;
                }
                if (code === "RECONCILIATION_ALREADY_SUBMITTED") {
                    setSubmitError(t("alreadySubmittedSession"));
                    return;
                }
            }
            setSubmitError(t("submitReconciliationError"));
        }
    }

    if (isLoading)
        return (
            <div className="flex min-h-[200px] items-center justify-center gap-2 text-[13px] text-slate-gray">
                <RefreshCw className="size-4 animate-spin" /> Loading…
            </div>
        );

    if (isError || !preview)
        return (
            <div className="rounded-2xl border border-hairline bg-card px-5 py-10 text-center text-[13px] text-slate-gray">
                {t("clockInToReconcile")}
            </div>
        );

    return (
        <div className="space-y-5">
            {/* Date filter + refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <DateFilterBar
                    preset={preset}
                    from={customFrom}
                    to={customTo}
                    onPreset={setPreset}
                    onFrom={setCustomFrom}
                    onTo={setCustomTo}
                />
                <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[12px] text-slate-gray hover:text-foreground disabled:opacity-50"
                >
                    <RefreshCw
                        className={cn("size-3.5", isFetching && "animate-spin")}
                    />
                    Refresh
                </button>
            </div>

            {/* Section 1: Bills generated */}
            <Section
                icon={CreditCard}
                iconBg="bg-brand/8 text-brand"
                title="Bills generated this shift"
                description={`${billsCount} receipt${billsCount === 1 ? "" : "s"} — cash + digital breakdown`}
            >
                <div className="divide-y divide-hairline">
                    <Row
                        label="Cash payments"
                        value={formatEtb(billsCash)}
                        sub="Physical cash collected from guests"
                    />
                    <Row
                        label="Digital payments"
                        value={formatEtb(billsDigital)}
                        sub="Telebirr, bank transfer, card"
                    />
                    {billsDigital > 0 && (
                        <div className="pl-4 divide-y divide-hairline/60">
                            <Row
                                label="→ Verified"
                                value={formatEtb(digitalVerified)}
                                sub="Transfer receipts confirmed"
                            />
                            {digitalPending > 0 && (
                                <Row
                                    label="→ Pending"
                                    value={formatEtb(digitalPending)}
                                    sub="Awaiting manager verification"
                                />
                            )}
                        </div>
                    )}
                    <Row
                        label="Grand total"
                        value={formatEtb(billsGrand)}
                        sub="All receipts combined"
                        bold
                        accent
                    />
                </div>
            </Section>

            {/* Section 2: Cash drawer */}
            <Section
                icon={Banknote}
                iconBg="bg-emerald-500/10 text-emerald-600"
                title="Cash drawer"
                description="Physical cash — float + drops from waiters"
            >
                <div className="divide-y divide-hairline">
                    <Row
                        label="Opening float"
                        value={formatEtb(Number(preview.openingFloat))}
                        sub="Set at shift start"
                    />
                    <Row
                        label="Cash drops received"
                        value={formatEtb(Number(preview.cashDropsReceived))}
                        sub="Waiter drops counted and received"
                    />
                    {Number(preview.otherInflows) > 0 && (
                        <Row
                            label="Other inflows"
                            value={formatEtb(Number(preview.otherInflows))}
                        />
                    )}
                    {Number(preview.otherOutflows) > 0 && (
                        <Row
                            label="Other outflows"
                            value={`–${formatEtb(Number(preview.otherOutflows))}`}
                        />
                    )}
                    <Row
                        label="Expected in drawer"
                        value={formatEtb(expected)}
                        sub="Float + all drops"
                        bold
                        accent
                    />
                </div>
                {/* Cash match indicator */}
                <div
                    className={cn(
                        "mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-[12px]",
                        cashMatches
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
                    )}
                >
                    {cashMatches ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    ) : (
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    )}
                    <div>
                        <p className="font-semibold">
                            {cashMatches
                                ? "Drawer matches cash bills ✓"
                                : `Drawer differs from cash bills by ${formatEtb(Math.abs(cashVariance))}`}
                        </p>
                        <p className="mt-0.5 opacity-75">
                            {cashMatches
                                ? `Cash bills ${formatEtb(billsCash)} = expected drawer ${formatEtb(expected)}`
                                : cashVariance > 0
                                  ? "More in drawer than billed — check for unreceived drops"
                                  : "Less in drawer than billed — check for missing drops"}
                        </p>
                    </div>
                </div>
            </Section>

            {/* Section 3: Submitted status OR count form */}
            {alreadySubmitted && !needsResubmit ? (
                <Section
                    icon={CheckCircle2}
                    iconBg="bg-emerald-500/10 text-emerald-600"
                    title="Reconciliation submitted"
                    description="Awaiting manager review"
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] text-slate-gray">
                                Status
                            </p>
                            <Badge variant="success">
                                {preview.existingStatus}
                            </Badge>
                        </div>
                        <div className="divide-y divide-hairline rounded-xl border border-hairline">
                            <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                                <span className="text-slate-gray">Counted</span>
                                <span className="font-semibold tabular-nums">
                                    {formatEtb(
                                        Number(
                                            preview.existingCountedCash ?? 0,
                                        ),
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                                <span className="text-slate-gray">
                                    Expected
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {formatEtb(
                                        Number(
                                            preview.existingExpectedCash ?? 0,
                                        ),
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                                <span className="text-slate-gray">
                                    Variance
                                </span>
                                <span
                                    className={cn(
                                        "font-semibold tabular-nums",
                                        Number(
                                            preview.existingVariance ?? 0,
                                        ) === 0
                                            ? "text-emerald-600"
                                            : "text-amber-600",
                                    )}
                                >
                                    {formatEtb(
                                        Number(preview.existingVariance ?? 0),
                                    )}
                                </span>
                            </div>
                        </div>
                        <p className="text-[12px] text-emerald-600 dark:text-emerald-400">
                            ✓ You can now clock out from Shift
                        </p>
                    </div>
                </Section>
            ) : showForm ? (
                <Section
                    icon={Banknote}
                    iconBg="bg-foreground/8 text-foreground"
                    title={
                        needsResubmit ? "Recount required" : "Count & submit"
                    }
                    description={
                        needsResubmit
                            ? "More cash arrived — recount your drawer and resubmit"
                            : "Count the physical cash in your drawer and submit"
                    }
                >
                    {needsResubmit && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-[12px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <p>
                                More cash landed after your last submission.
                                Expected is now{" "}
                                <strong>{formatEtb(expected)}</strong>. Recount
                                and resubmit.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">
                                Physical cash counted
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-gray">
                                    ETB
                                </span>
                                <Input
                                    value={counted}
                                    onChange={e => setCounted(e.target.value)}
                                    placeholder={preview.expectedCash}
                                    inputMode="decimal"
                                    className="h-11 rounded-xl pl-12 text-[15px] font-semibold tabular-nums"
                                />
                            </div>
                            <p className="text-[11px] text-slate-gray">
                                Leave blank to confirm the expected amount (
                                {formatEtb(expected)})
                            </p>
                        </div>

                        {counted !== "" && (
                            <div
                                className={cn(
                                    "flex items-center justify-between rounded-xl px-4 py-3 text-[13px]",
                                    Math.abs(variance) < 0.01
                                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30"
                                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/30",
                                )}
                            >
                                <span>Variance</span>
                                <span className="font-bold tabular-nums">
                                    {variance >= 0 ? "+" : ""}
                                    {formatEtb(variance)}
                                </span>
                            </div>
                        )}

                        {Math.abs(variance) > 0.001 && (
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-foreground">
                                    Variance note{" "}
                                    <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder={t("variancePlaceholder")}
                                    className="h-10 rounded-xl"
                                />
                                <p className="text-[11px] text-slate-gray">
                                    Required when cash count differs from
                                    expected
                                </p>
                            </div>
                        )}

                        <button
                            type="button"
                            disabled={
                                submitting ||
                                (Math.abs(variance) > 0.001 && !comment.trim())
                            }
                            onClick={() => void onSubmit()}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-[13px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="size-4 animate-spin" />{" "}
                                    Submitting…
                                </>
                            ) : needsResubmit ? (
                                t("updateReconciliation")
                            ) : (
                                t("submitReconciliation")
                            )}
                        </button>

                        {submitError && (
                            <p className="text-[12px] text-destructive">
                                {submitError}
                            </p>
                        )}
                        {submitOk && (
                            <p className="text-[12px] text-emerald-600 dark:text-emerald-400">
                                {submitOk}
                            </p>
                        )}
                    </div>
                </Section>
            ) : null}
        </div>
    );
}
