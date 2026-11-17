"use client";

import type {
    TalentAvailability,
    TalentProfileStatus,
    TalentRequestStatus,
    TalentRoleCategory,
} from "@/context/services/talentApi";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const TALENT_ROLE_LABELS: Record<TalentRoleCategory, string> = {
    CHEF: "Chef",
    WAITER: "Waiter",
    BARISTA: "Barista",
    CASHIER: "Cashier",
    BAKER: "Baker",
    STORE_MANAGER: "Store Manager",
    RECEPTIONIST: "Receptionist",
    DRIVER: "Driver",
    CLEANER: "Cleaner",
    OTHER: "Other",
};

export const TALENT_AVAILABILITY_LABELS: Record<TalentAvailability, string> = {
    IMMEDIATE: "Immediate",
    FULL_TIME: "Full-Time",
    PART_TIME: "Part-Time",
    CONTRACT: "Contract",
};

export const TALENT_PROFILE_STATUS_META: Record<
    TalentProfileStatus,
    { label: string; className: string }
> = {
    AVAILABLE: {
        label: "Available",
        className:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
    IN_PROCESS: {
        label: "In Process",
        className:
            "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    },
    HIRED: {
        label: "Hired",
        className:
            "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    },
    ARCHIVED: {
        label: "Archived",
        className: "bg-muted text-muted-foreground border-border",
    },
};

export const TALENT_REQUEST_STATUS_META: Record<
    TalentRequestStatus,
    { label: string; className: string }
> = {
    CONTACTED: {
        label: "Contacted",
        className:
            "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
    INTERVIEWING: {
        label: "Interviewing",
        className:
            "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    },
    HIRED: {
        label: "Hired",
        className:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
    CANCELLED: {
        label: "Cancelled",
        className:
            "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    },
};

export const ALLOWED_TALENT_REQUEST_TRANSITIONS: Record<
    TalentRequestStatus,
    TalentRequestStatus[]
> = {
    CONTACTED: ["INTERVIEWING", "HIRED", "CANCELLED"],
    INTERVIEWING: ["HIRED", "CANCELLED"],
    HIRED: [],
    CANCELLED: [],
};

export function TalentRequestStatusBadge({
    status,
}: {
    status: TalentRequestStatus;
}) {
    const meta = TALENT_REQUEST_STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

export function TalentProfileStatusBadge({
    status,
}: {
    status: TalentProfileStatus;
}) {
    const meta = TALENT_PROFILE_STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

export function TalentPagination({
    page,
    limit,
    total,
    totalPages,
    onPageChange,
}: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (nextPage: number) => void;
}) {
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(total, page * limit);

    return (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
                Showing <strong className="text-foreground">{start}</strong>–
                <strong className="text-foreground">{end}</strong> of{" "}
                <strong className="text-foreground">{total}</strong>
            </span>
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
