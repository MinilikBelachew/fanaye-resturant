"use client";

import type {
    MarketingCampaignStatus,
    MarketingStatusCounts,
} from "@/context/services/marketingApi";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const STATUS_META: Record<
    MarketingCampaignStatus,
    { label: string; className: string }
> = {
    PENDING: {
        label: "Pending",
        className:
            "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
    CONFIRMED: {
        label: "Confirmed",
        className:
            "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    },
    PROMOTING: {
        label: "Promoting",
        className:
            "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    },
    DONE: {
        label: "Done • Pay Due",
        className:
            "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    },
    PAYMENT_SUBMITTED: {
        label: "Payment Sent",
        className:
            "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    },
    PAID: {
        label: "Paid",
        className:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
    CANCELLED: {
        label: "Cancelled",
        className:
            "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    },
};

export const ALLOWED_ADMIN_STATUS_TRANSITIONS: Record<
    MarketingCampaignStatus,
    MarketingCampaignStatus[]
> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROMOTING", "CANCELLED"],
    PROMOTING: ["DONE", "CANCELLED"],
    DONE: ["PAID", "CANCELLED"],
    PAYMENT_SUBMITTED: ["PAID", "DONE", "CANCELLED"],
    PAID: [],
    CANCELLED: [],
};

export function MarketingStatusBadge({
    status,
}: {
    status: MarketingCampaignStatus;
}) {
    const meta = STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

const TAB_ORDER: Array<{
    key: "ALL" | MarketingCampaignStatus;
    label: string;
}> = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PROMOTING", label: "Promoting" },
    { key: "DONE", label: "Done" },
    { key: "PAYMENT_SUBMITTED", label: "Payment Sent" },
    { key: "PAID", label: "Paid" },
    { key: "CANCELLED", label: "Cancelled" },
];

export function MarketingStatusTabs({
    value,
    counts,
    onChange,
}: {
    value: "ALL" | MarketingCampaignStatus;
    counts?: MarketingStatusCounts;
    onChange: (next: "ALL" | MarketingCampaignStatus) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {TAB_ORDER.map(tab => {
                const active = value === tab.key;
                const count = counts ? counts[tab.key] : 0;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onChange(tab.key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            active
                                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                active
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-muted text-foreground"
                            }`}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export function MarketingPagination({
    page,
    limit,
    total,
    totalPages,
    onPageChange,
    onLimitChange,
}: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (nextPage: number) => void;
    onLimitChange: (nextLimit: number) => void;
}) {
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(total, page * limit);

    return (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                    Showing <strong className="text-foreground">{start}</strong>
                    –<strong className="text-foreground">{end}</strong> of{" "}
                    <strong className="text-foreground">{total}</strong>
                </span>
                <select
                    aria-label="Rows per page"
                    value={limit}
                    onChange={e => onLimitChange(Number(e.target.value))}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                </select>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                </button>
                <span className="px-2 text-xs text-muted-foreground">
                    Page <strong className="text-foreground">{page}</strong> of{" "}
                    <strong className="text-foreground">{totalPages}</strong>
                </span>
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
