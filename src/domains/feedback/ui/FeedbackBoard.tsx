"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
    CheckCheck,
    Globe,
    Inbox,
    MailOpen,
    MessageSquareQuote,
    RefreshCw,
    Star,
    ThumbsDown,
} from "lucide-react";
import KpiCard from "@/components/custom/organisms/KpiCard";
import { Button } from "@/components/ui/button";
import { RestorchLoader } from "@/components/common/RestorchLoader";
import { cn } from "@/lib/utils";
import {
    FeedbackListQuery,
    FeedbackSource,
    FeedbackStatus,
    useGetAdminFeedbackQuery,
    useSetFeedbackWebsiteApprovalMutation,
    useUpdateFeedbackStatusMutation,
} from "@/context/services/feedbackApi";

function getStatusLabel(status: FeedbackStatus, isAm: boolean): string {
    if (isAm) {
        if (status === "NEW") return "አዲስ";
        if (status === "READ") return "የተነበበ";
        return "የተፈታ";
    }
    if (status === "NEW") return "New";
    if (status === "READ") return "Read";
    return "Resolved";
}

const STATUS_STYLES: Record<FeedbackStatus, string> = {
    NEW: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
    READ: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300",
    RESOLVED:
        "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
};

function getSourceLabel(source: FeedbackSource, isAm: boolean): string {
    if (isAm) {
        if (source === "QR_MENU") return "QR ሜኑ";
        return "ድር ጣቢያ";
    }
    if (source === "QR_MENU") return "QR Menu";
    return "Website";
}

function StarRow({
    rating,
    size = "size-3.5",
}: {
    rating: number;
    size?: string;
}) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    className={cn(
                        size,
                        star <= rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-slate-300 dark:text-slate-600",
                    )}
                />
            ))}
        </span>
    );
}

function formatDateTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function FeedbackBoard() {
    const isAm = useLocale() === "am";
    const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "ALL">(
        "ALL",
    );
    const [sourceFilter, setSourceFilter] = useState<FeedbackSource | "ALL">(
        "ALL",
    );
    const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
    const [page, setPage] = useState(1);

    const query: FeedbackListQuery = useMemo(
        () => ({
            status: statusFilter,
            source: sourceFilter,
            rating: ratingFilter === "ALL" ? undefined : ratingFilter,
            page,
            limit: 20,
        }),
        [statusFilter, sourceFilter, ratingFilter, page],
    );

    const { data, isLoading, isFetching, refetch } =
        useGetAdminFeedbackQuery(query);
    const [updateStatus, { isLoading: isUpdating }] =
        useUpdateFeedbackStatusMutation();
    const [setWebsiteApproval, { isLoading: isApprovingSite }] =
        useSetFeedbackWebsiteApprovalMutation();

    const summary = data?.summary;
    const items = data?.data ?? [];
    const meta = data?.meta;
    const maxBucket = summary
        ? Math.max(1, ...Object.values(summary.distribution))
        : 1;

    async function changeStatus(id: string, status: FeedbackStatus) {
        try {
            await updateStatus({ id, status }).unwrap();
        } catch {
            // surfaced by RTK cache; no-op here
        }
    }

    async function toggleWebsiteApproval(id: string, approved: boolean) {
        try {
            await setWebsiteApproval({ id, approved }).unwrap();
        } catch {
            // non-owner or network error
        }
    }

    return (
        <div className="space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard
                    label={isAm ? "አማካኝ ደረጃ" : "Average rating"}
                    value={
                        summary
                            ? `${summary.averageRating.toFixed(1)} / 5`
                            : "—"
                    }
                    hint={
                        summary
                            ? isAm
                                ? `በአጠቃላይ ${summary.total} ግምገማዎች`
                                : `${summary.total} review${summary.total === 1 ? "" : "s"} total`
                            : undefined
                    }
                    tone="amber"
                    accent
                />
                <KpiCard
                    label={isAm ? "አዲስ / ያልተነበበ" : "New / unread"}
                    value={String(summary?.newCount ?? 0)}
                    hint={isAm ? "ክትትል የሚጠብቅ" : "Waiting for follow-up"}
                    icon={<Inbox className="size-4" />}
                />
                <KpiCard
                    label={isAm ? "ዝቅተኛ ደረጃዎች (1–2★)" : "Low ratings (1–2★)"}
                    value={String(summary?.lowRatingCount ?? 0)}
                    hint={isAm ? "ትኩረት የሚሻ" : "Needs attention"}
                    icon={<ThumbsDown className="size-4" />}
                />
                <KpiCard
                    label={isAm ? "ያለፉት 30 ቀናት" : "Last 30 days"}
                    value={String(summary?.last30DaysCount ?? 0)}
                    hint={
                        isAm
                            ? `${summary?.resolvedCount ?? 0} የተፈቱ`
                            : `${summary?.resolvedCount ?? 0} resolved`
                    }
                    icon={<MessageSquareQuote className="size-4" />}
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                {/* Reviews list */}
                <div className="space-y-3">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background p-3">
                        <select
                            value={statusFilter}
                            onChange={e => {
                                setStatusFilter(
                                    e.target.value as FeedbackStatus | "ALL",
                                );
                                setPage(1);
                            }}
                            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                        >
                            <option value="ALL">
                                {isAm ? "ሁሉም ሁኔታዎች" : "All statuses"}
                            </option>
                            <option value="NEW">{isAm ? "አዲስ" : "New"}</option>
                            <option value="READ">
                                {isAm ? "የተነበበ" : "Read"}
                            </option>
                            <option value="RESOLVED">
                                {isAm ? "የተፈታ" : "Resolved"}
                            </option>
                        </select>

                        <select
                            value={sourceFilter}
                            onChange={e => {
                                setSourceFilter(
                                    e.target.value as FeedbackSource | "ALL",
                                );
                                setPage(1);
                            }}
                            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                        >
                            <option value="ALL">
                                {isAm ? "ሁሉም ምንጮች" : "All sources"}
                            </option>
                            <option value="QR_MENU">
                                {isAm ? "QR ሜኑ" : "QR Menu"}
                            </option>
                            <option value="WEBSITE">
                                {isAm ? "ድር ጣቢያ" : "Website"}
                            </option>
                        </select>

                        <select
                            value={ratingFilter}
                            onChange={e => {
                                const value = e.target.value;
                                setRatingFilter(
                                    value === "ALL" ? "ALL" : Number(value),
                                );
                                setPage(1);
                            }}
                            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                        >
                            <option value="ALL">
                                {isAm ? "ሁሉም ደረጃዎች" : "All ratings"}
                            </option>
                            {[5, 4, 3, 2, 1].map(star => (
                                <option key={star} value={star}>
                                    {isAm
                                        ? `${star} ኮከብ`
                                        : `${star} star${star === 1 ? "" : "s"}`}
                                </option>
                            ))}
                        </select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetch()}
                            className="ml-auto gap-1.5 text-xs"
                        >
                            <RefreshCw
                                className={cn(
                                    "size-3.5",
                                    isFetching && "animate-spin",
                                )}
                            />
                            {isAm ? "አድስ" : "Refresh"}
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center rounded-2xl border border-border bg-background py-14">
                            <RestorchLoader
                                size="md"
                                label={
                                    isAm
                                        ? "የደንበኞች አስተያየት በመጫን ላይ…"
                                        : "Loading customer feedback…"
                                }
                            />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-background py-16 text-center">
                            <MessageSquareQuote className="mx-auto size-8 text-muted-foreground/50" />
                            <p className="mt-2 text-sm font-medium">
                                {isAm
                                    ? "እስካሁን ምንም አስተያየት የለም"
                                    : "No feedback yet"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {isAm
                                    ? "ከQR ጠረጴዛ ሜኑ እና ከድር ጣቢያዎ የሚመጡ ግምገማዎች እዚህ ይታያሉ።"
                                    : "Reviews from the QR table menu and your website will appear here."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-border bg-background p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <StarRow rating={item.rating} />
                                            <span className="text-xs font-semibold">
                                                {item.rating.toFixed(1)}
                                            </span>
                                            <span
                                                className={cn(
                                                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                                    STATUS_STYLES[item.status],
                                                )}
                                            >
                                                {getStatusLabel(
                                                    item.status,
                                                    isAm,
                                                )}
                                            </span>
                                            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                {getSourceLabel(
                                                    item.source,
                                                    isAm,
                                                )}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">
                                            {formatDateTime(item.createdAt)}
                                        </span>
                                    </div>

                                    {item.comment ? (
                                        <p className="mt-2.5 text-sm leading-relaxed text-foreground">
                                            {item.comment}
                                        </p>
                                    ) : (
                                        <p className="mt-2.5 text-xs italic text-muted-foreground">
                                            {isAm
                                                ? "ምንም አስተያየት አልተሰጠም።"
                                                : "No comment provided."}
                                        </p>
                                    )}

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                            <span>
                                                {item.customerName ||
                                                    (isAm
                                                        ? "ስም ያልጠቀሰ እንግዳ"
                                                        : "Anonymous guest")}
                                            </span>
                                            {item.tableName ? (
                                                <span>· {item.tableName}</span>
                                            ) : null}
                                            {item.branchName ? (
                                                <span>· {item.branchName}</span>
                                            ) : null}
                                            {item.customerPhone ? (
                                                <span>
                                                    · {item.customerPhone}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant={
                                                    item.isApprovedForSite
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                disabled={isApprovingSite}
                                                onClick={() =>
                                                    void toggleWebsiteApproval(
                                                        item.id,
                                                        !item.isApprovedForSite,
                                                    )
                                                }
                                                className={cn(
                                                    "gap-1.5 text-xs",
                                                    item.isApprovedForSite &&
                                                        "bg-emerald-600 hover:bg-emerald-700 text-white",
                                                )}
                                            >
                                                <Globe className="size-3.5" />
                                                {item.isApprovedForSite
                                                    ? isAm
                                                        ? "በድረ-ገጹ ላይ"
                                                        : "On Website"
                                                    : isAm
                                                      ? "ለድረ-ገጽ አጽድቅ"
                                                      : "Approve for Site"}
                                            </Button>
                                            {item.status === "NEW" ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        void changeStatus(
                                                            item.id,
                                                            "READ",
                                                        )
                                                    }
                                                    className="gap-1.5 text-xs"
                                                >
                                                    <MailOpen className="size-3.5" />
                                                    {isAm
                                                        ? "እንደተነበበ ምልክት አድርግ"
                                                        : "Mark read"}
                                                </Button>
                                            ) : null}
                                            {item.status !== "RESOLVED" ? (
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        void changeStatus(
                                                            item.id,
                                                            "RESOLVED",
                                                        )
                                                    }
                                                    className="gap-1.5 text-xs"
                                                >
                                                    <CheckCheck className="size-3.5" />
                                                    {isAm
                                                        ? "መፍትሔ ስጥ"
                                                        : "Resolve"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        void changeStatus(
                                                            item.id,
                                                            "NEW",
                                                        )
                                                    }
                                                    className="text-xs"
                                                >
                                                    {isAm
                                                        ? "እንደገና ክፈት"
                                                        : "Reopen"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {meta && meta.totalPages > 1 ? (
                        <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-2.5 text-xs">
                            <span className="text-muted-foreground">
                                {isAm
                                    ? `ገጽ ${meta.page} ከ ${meta.totalPages} · በአጠቃላይ ${meta.total}`
                                    : `Page ${meta.page} of ${meta.totalPages} · ${meta.total} total`}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.page <= 1}
                                    onClick={() =>
                                        setPage(p => Math.max(1, p - 1))
                                    }
                                    className="text-xs"
                                >
                                    {isAm ? "ቀዳሚ" : "Previous"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.page >= meta.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="text-xs"
                                >
                                    {isAm ? "ቀጣይ" : "Next"}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Side stats */}
                <div className="space-y-5">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            {isAm ? "የደረጃዎች ስርጭት" : "Rating distribution"}
                        </h3>
                        <div className="mt-3 space-y-2">
                            {[5, 4, 3, 2, 1].map(star => {
                                const count =
                                    summary?.distribution[String(star)] ?? 0;

                                return (
                                    <div
                                        key={star}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="w-10 shrink-0 text-[11px] font-medium text-muted-foreground">
                                            {star} ★
                                        </span>
                                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                            <span
                                                className="block h-full rounded-full bg-amber-500"
                                                style={{
                                                    width: `${(count / maxBucket) * 100}%`,
                                                }}
                                            />
                                        </span>
                                        <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {summary && summary.byBranch.length > 1 ? (
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                {isAm ? "በቅርንጫፍ" : "By branch"}
                            </h3>
                            <div className="mt-3 space-y-2.5">
                                {summary.byBranch.map(branch => (
                                    <div
                                        key={branch.branchId}
                                        className="flex items-center justify-between gap-2 text-xs"
                                    >
                                        <span className="min-w-0 truncate">
                                            {branch.branchName}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-1.5">
                                            <Star
                                                className="size-3 fill-amber-500 text-amber-500"
                                                aria-hidden
                                            />
                                            <span className="font-semibold tabular-nums">
                                                {branch.averageRating.toFixed(
                                                    1,
                                                )}
                                            </span>
                                            <span className="text-muted-foreground">
                                                ({branch.total})
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
