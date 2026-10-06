"use client";

import { use, useState, type ComponentType } from "react";
import {
    ArrowLeft,
    Check,
    Clock3,
    LayoutGrid,
    Loader2,
    RefreshCw,
    Replace,
    ShoppingBag,
    UserRound,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useApprovalDetailQuery,
    useApproveCancellationRequestMutation,
    useApproveChangeRequestMutation,
    useRejectCancellationRequestMutation,
    useRejectChangeRequestMutation,
    type ApprovalRequestType,
} from "@/context/services/ordersApi";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const POLL_MS = 8000;

function formatChangeValue(value: unknown): string {
    if (value == null || value === "") return "—";
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(formatChangeValue).join(", ");
    }
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    return String(value);
}

function parseType(raw: string): ApprovalRequestType | null {
    const n = raw.trim().toLowerCase();
    if (n === "cancellation" || n === "cancel") return "CANCELLATION";
    if (n === "change" || n === "changes") return "CHANGE";
    return null;
}

function statusTone(
    status: string,
): "warning" | "success" | "danger" | "secondary" {
    switch (status) {
        case "PENDING":
            return "warning";
        case "APPROVED":
        case "APPLIED":
            return "success";
        case "REJECTED":
            return "danger";
        default:
            return "secondary";
    }
}

export default function ManagerApprovalDetailPage({
    params,
}: {
    params: Promise<{ type: string; requestId: string }>;
}) {
    const { type: typeRaw, requestId } = use(params);
    const type = parseType(typeRaw);
    const t = useTranslations("managerApprovals");
    const tCommon = useTranslations("common");
    const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

    const { data, isLoading, isError, isFetching, refetch } =
        useApprovalDetailQuery(
            { type: type ?? "CANCELLATION", requestId },
            { skip: !type, pollingInterval: POLL_MS },
        );

    const [approveCancel] = useApproveCancellationRequestMutation();
    const [rejectCancel] = useRejectCancellationRequestMutation();
    const [approveChange] = useApproveChangeRequestMutation();
    const [rejectChange] = useRejectChangeRequestMutation();

    const detail = data?.data;

    async function decide(decision: "approve" | "reject") {
        if (!detail || detail.status !== "PENDING") return;
        setBusy(decision);
        try {
            if (detail.type === "CANCELLATION") {
                if (decision === "approve") {
                    await approveCancel({
                        requestId: detail.requestId,
                        expectedOrderItemVersion: detail.itemVersion,
                    }).unwrap();
                } else {
                    await rejectCancel({
                        requestId: detail.requestId,
                        expectedOrderItemVersion: detail.itemVersion,
                        decisionReason: "Rejected",
                    }).unwrap();
                }
            } else if (decision === "approve") {
                await approveChange({
                    requestId: detail.requestId,
                    expectedOrderItemVersion: detail.itemVersion,
                }).unwrap();
            } else {
                await rejectChange({
                    requestId: detail.requestId,
                    expectedOrderItemVersion: detail.itemVersion,
                    decisionReason: "Rejected",
                }).unwrap();
            }
            toast.success(
                decision === "approve"
                    ? t("toastApproved")
                    : t("toastRejected"),
                detail.itemName,
            );
            void refetch();
        } catch (err) {
            toast.fromUnknown(
                err,
                decision === "approve"
                    ? t("toastApproveError")
                    : t("toastRejectError"),
            );
        } finally {
            setBusy(null);
        }
    }

    if (!type) {
        return (
            <DashboardFrame>
                <p className="text-slate-gray">{t("loadError")}</p>
                <Link
                    href="/manager/approvals"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-brand"
                >
                    <ArrowLeft className="size-3.5" />
                    {t("backToApprovals")}
                </Link>
            </DashboardFrame>
        );
    }

    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex items-center gap-2 text-slate-gray">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                </div>
            </DashboardFrame>
        );
    }

    if (isError || !detail) {
        return (
            <DashboardFrame>
                <p className="text-destructive">{t("loadError")}</p>
                <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/manager/approvals">
                            {t("backToApprovals")}
                        </Link>
                    </Button>
                    <Button size="sm" onClick={() => void refetch()}>
                        {t("tryAgain")}
                    </Button>
                </div>
            </DashboardFrame>
        );
    }

    const changeEntries = detail.requestedChange
        ? Object.entries(detail.requestedChange).filter(
              ([, value]) => value != null && value !== "",
          )
        : [];

    const isPending = detail.status === "PENDING";

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3">
                <Link
                    href="/manager/approvals"
                    className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate-gray transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {t("backToApprovals")}
                </Link>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span
                            className={cn(
                                "flex size-14 items-center justify-center rounded-2xl",
                                detail.type === "CANCELLATION"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-amber-500/10 text-amber-700",
                            )}
                        >
                            {detail.type === "CANCELLATION" ? (
                                <X className="size-6" />
                            ) : (
                                <Replace className="size-6" />
                            )}
                        </span>
                        <PageHeader
                            compact
                            eyebrow={t("eyebrow")}
                            title={
                                detail.type === "CANCELLATION"
                                    ? `${t("prefixCancel")} ${detail.itemName}`
                                    : `${t("prefixChange")} ${detail.itemName}`
                            }
                            description={t("detailDesc", {
                                table: detail.tableDisplayNumber
                                    ? `#${detail.tableDisplayNumber}`
                                    : detail.tableDisplayName,
                                station: detail.stationName,
                            })}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start">
                        <Badge
                            variant={statusTone(detail.status)}
                            className="rounded-full px-2.5 py-0.5"
                        >
                            {t.has(
                                `status.${detail.status}` as "status.PENDING",
                            )
                                ? t(
                                      `status.${detail.status}` as "status.PENDING",
                                  )
                                : detail.status}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isFetching}
                            onClick={() => void refetch()}
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3.5",
                                    isFetching && "animate-spin",
                                )}
                            />
                            {tCommon("refresh")}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label={t("cardQty")}
                    value={String(detail.quantity)}
                    hint={formatEtb(Number(detail.unitPrice)) + " / ea"}
                    icon={ShoppingBag}
                />
                <SummaryCard
                    label={t("cardLineTotal")}
                    value={formatEtb(Number(detail.lineTotal))}
                    hint={detail.currencyCode}
                    icon={LayoutGrid}
                    accent
                />
                <SummaryCard
                    label={t("cardTable")}
                    value={
                        detail.tableDisplayNumber
                            ? `#${detail.tableDisplayNumber}`
                            : detail.tableDisplayName
                    }
                    hint={detail.tableDisplayName}
                    icon={UtensilsCrossed}
                />
                <SummaryCard
                    label={t("cardStation")}
                    value={detail.stationName}
                    hint={
                        t.has(
                            `itemStates.${detail.itemState}` as "itemStates.READY",
                        )
                            ? t(
                                  `itemStates.${detail.itemState}` as "itemStates.READY",
                              )
                            : detail.itemState
                    }
                    icon={Clock3}
                />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionRequest")}
                    </h3>
                    <dl className="mt-3 space-y-3 text-[13px]">
                        <Row
                            label={t("requestedByLabel")}
                            value={detail.requestedByName}
                        />
                        <Row
                            label={t("requestedAtLabel")}
                            value={new Date(
                                detail.requestedAt,
                            ).toLocaleString()}
                        />
                        <Row
                            label={t("stateAtRequest")}
                            value={
                                t.has(
                                    `itemStates.${detail.stateAtRequest}` as "itemStates.READY",
                                )
                                    ? t(
                                          `itemStates.${detail.stateAtRequest}` as "itemStates.READY",
                                      )
                                    : detail.stateAtRequest
                            }
                        />
                        <Row
                            label={t("currentState")}
                            value={
                                t.has(
                                    `itemStates.${detail.itemState}` as "itemStates.READY",
                                )
                                    ? t(
                                          `itemStates.${detail.itemState}` as "itemStates.READY",
                                      )
                                    : detail.itemState
                            }
                        />
                        {detail.specialInstruction ? (
                            <Row
                                label={t("specialInstruction")}
                                value={detail.specialInstruction}
                            />
                        ) : null}
                        <div>
                            <dt className="text-slate-gray">{t("reason")}</dt>
                            <dd className="mt-0.5 font-medium text-foreground">
                                {detail.reason || "—"}
                            </dd>
                        </div>
                    </dl>

                    {changeEntries.length > 0 ? (
                        <div className="mt-4 border-t border-hairline pt-3">
                            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                                {t("sectionChange")}
                            </p>
                            <ul className="mt-2 space-y-1.5 text-[13px]">
                                {changeEntries.map(([key, value]) => (
                                    <li
                                        key={key}
                                        className="flex justify-between gap-3"
                                    >
                                        <span className="text-slate-gray">
                                            {key}
                                        </span>
                                        <span className="text-right font-medium">
                                            {formatChangeValue(value)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </section>

                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionDecision")}
                    </h3>
                    {isPending ? (
                        <div className="mt-4 space-y-3">
                            <p className="text-[13px] text-slate-gray">
                                {t("pendingHint")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    className="h-9 gap-1.5 rounded-full"
                                    disabled={!!busy}
                                    onClick={() => void decide("approve")}
                                >
                                    {busy === "approve" ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Check className="size-3.5" />
                                    )}
                                    {t("approve")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 gap-1.5 rounded-full"
                                    disabled={!!busy}
                                    onClick={() => void decide("reject")}
                                >
                                    {busy === "reject" ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <X className="size-3.5" />
                                    )}
                                    {t("reject")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <dl className="mt-3 space-y-3 text-[13px]">
                            <Row
                                label={t("decidedBy")}
                                value={detail.decidedByName || "—"}
                            />
                            <Row
                                label={t("decidedAt")}
                                value={
                                    detail.decidedAt
                                        ? new Date(
                                              detail.decidedAt,
                                          ).toLocaleString()
                                        : "—"
                                }
                            />
                            <div>
                                <dt className="text-slate-gray">
                                    {t("decisionReason")}
                                </dt>
                                <dd className="mt-0.5 font-medium text-foreground">
                                    {detail.decisionReason || "—"}
                                </dd>
                            </div>
                        </dl>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-4">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href={`/manager/tables/${detail.tableId}`}>
                                <UtensilsCrossed className="size-3.5" />
                                {t("openTable")}
                            </Link>
                        </Button>
                        {detail.stationId ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-full text-[12px]"
                                asChild
                            >
                                <Link
                                    href={`/manager/stations/${detail.stationId}`}
                                >
                                    <UserRound className="size-3.5" />
                                    {t("openStation")}
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </section>
            </div>
        </DashboardFrame>
    );
}

function SummaryCard({
    label,
    value,
    hint,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string;
    hint: string;
    icon: ComponentType<{ className?: string }>;
    accent?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-hairline bg-card px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-gray">
                    {label}
                </p>
                <Icon className="size-3.5 text-slate-gray" />
            </div>
            <p
                className={cn(
                    "mt-1.5 text-[18px] font-semibold tabular-nums",
                    accent ? "text-brand" : "text-foreground",
                )}
            >
                {value}
            </p>
            <p className="mt-0.5 text-[12px] text-slate-gray">{hint}</p>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <dt className="text-slate-gray">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
        </div>
    );
}
