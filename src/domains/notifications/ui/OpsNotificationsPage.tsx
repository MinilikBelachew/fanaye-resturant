"use client";

import { useMemo, useState } from "react";
import {
    Bell,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    useListNotificationsQuery,
    useMarkAllNotificationsReadMutation,
    useMarkNotificationReadMutation,
} from "@/context/services/notificationsApi";
import {
    markAllLocalRead,
    markLocalRead,
} from "@/context/slices/notificationsSlice";
import {
    isNotificationVisibleForRole,
    notificationHref,
    type OpsNotification,
} from "@/domains/notifications/domain/opsNotification";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

function severityDot(severity: OpsNotification["severity"]) {
    if (severity === "URGENT") return "bg-red-500";
    if (severity === "ATTENTION") return "bg-amber-500";
    return "bg-emerald-500";
}

function timeAgo(iso: string) {
    const diff = Date.now() - Date.parse(iso);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function OpsNotificationsPage() {
    const dispatch = useAppDispatch();
    const staff = useAppSelector(selectCurrentStaff);
    const [page, setPage] = useState(1);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [markRead] = useMarkNotificationReadMutation();
    const [markAllRead, { isLoading: markingAll }] =
        useMarkAllNotificationsReadMutation();

    const { data, isLoading, isError, isFetching } = useListNotificationsQuery(
        { page, limit: PAGE_SIZE, unreadOnly },
        { skip: !staff, refetchOnMountOrArgChange: true },
    );

    const visible = useMemo(() => {
        if (!staff || !data?.data) return [];
        return data.data.filter(note =>
            isNotificationVisibleForRole(note.type, staff.role),
        );
    }, [data?.data, staff]);

    const pagination = data?.pagination;
    const unreadCount = data?.unreadCount ?? 0;

    async function onOpenNote(note: OpsNotification) {
        if (note.id && !note.readAt) {
            dispatch(markLocalRead(note.id));
            try {
                await markRead(note.id).unwrap();
            } catch {
                // Local mark is enough if network fails.
            }
        }
    }

    async function onMarkAll() {
        dispatch(markAllLocalRead());
        try {
            await markAllRead().unwrap();
        } catch {
            // Keep local state.
        }
    }

    if (!staff) {
        return (
            <p className="text-sm text-slate-gray">
                Sign in to view notifications.
            </p>
        );
    }

    return (
        <div className="mx-auto w-full max-w-2xl">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[24px] font-semibold tracking-tight">
                        Notifications
                    </h1>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {unreadCount > 0
                            ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
                            : "You're caught up."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg border border-hairline p-0.5">
                        <button
                            type="button"
                            className={cn(
                                "rounded-md px-2.5 py-1.5 text-[12px] font-medium",
                                !unreadOnly
                                    ? "bg-secondary text-foreground"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                            onClick={() => {
                                setUnreadOnly(false);
                                setPage(1);
                            }}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            className={cn(
                                "rounded-md px-2.5 py-1.5 text-[12px] font-medium",
                                unreadOnly
                                    ? "bg-secondary text-foreground"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                            onClick={() => {
                                setUnreadOnly(true);
                                setPage(1);
                            }}
                        >
                            Unread
                        </button>
                    </div>
                    {unreadCount > 0 ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={markingAll}
                            className="h-8 gap-1.5"
                            onClick={() => void onMarkAll()}
                        >
                            <CheckCheck className="size-3.5" />
                            Mark all read
                        </Button>
                    ) : null}
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-hairline bg-white px-4 py-12 text-center text-sm text-slate-gray dark:bg-card">
                    Loading notifications…
                </div>
            ) : null}

            {isError ? (
                <div className="rounded-2xl border border-hairline bg-white px-4 py-12 text-center text-sm text-red-600 dark:bg-card">
                    Could not load notifications.
                </div>
            ) : null}

            {!isLoading && !isError && visible.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-14 text-center dark:bg-card">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-slate-gray">
                        <Inbox className="size-5" />
                    </span>
                    <div>
                        <p className="text-sm font-medium">No alerts yet</p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {unreadOnly
                                ? "No unread notifications on this page."
                                : "Live floor events will show up here."}
                        </p>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError && visible.length > 0 ? (
                <ul
                    className={cn(
                        "overflow-hidden rounded-2xl border border-hairline bg-white dark:bg-card",
                        isFetching && "opacity-80",
                    )}
                >
                    {visible.map(note => {
                        const href = notificationHref(note, staff.role);
                        const content = (
                            <div className="flex gap-3 px-4 py-3.5">
                                <span
                                    className={cn(
                                        "mt-1.5 size-2 shrink-0 rounded-full",
                                        severityDot(note.severity),
                                    )}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p
                                            className={cn(
                                                "text-[14px] leading-snug",
                                                note.readAt
                                                    ? "font-medium text-foreground/80"
                                                    : "font-semibold",
                                            )}
                                        >
                                            {note.title}
                                        </p>
                                        <span className="shrink-0 text-[11px] text-slate-gray">
                                            {timeAgo(note.createdAt)}
                                        </span>
                                    </div>
                                    {note.body ? (
                                        <p className="mt-1 line-clamp-2 text-[13px] text-slate-gray">
                                            {note.body}
                                        </p>
                                    ) : null}
                                    <p className="mt-1.5 text-[11px] uppercase tracking-wide text-slate-gray/80">
                                        {note.type.replace(/\./g, " · ")}
                                    </p>
                                </div>
                            </div>
                        );

                        return (
                            <li
                                key={
                                    note.id ?? `${note.type}-${note.createdAt}`
                                }
                                className={cn(
                                    "border-b border-hairline last:border-b-0",
                                    !note.readAt &&
                                        "bg-amber-50/50 dark:bg-amber-500/5",
                                )}
                            >
                                {href ? (
                                    <Link
                                        href={href}
                                        onClick={() => void onOpenNote(note)}
                                        className="block hover:bg-secondary/50"
                                    >
                                        {content}
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        className="block w-full text-left hover:bg-secondary/50"
                                        onClick={() => void onOpenNote(note)}
                                    >
                                        {content}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            {pagination && pagination.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-slate-gray">
                    <span>
                        Page <strong>{pagination.page}</strong> of{" "}
                        <strong>{pagination.totalPages}</strong>
                        <span className="hidden sm:inline">
                            {" "}
                            · {pagination.total} total
                        </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 px-2.5"
                            disabled={page <= 1 || isFetching}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="size-3.5" />
                            Prev
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 px-2.5"
                            disabled={
                                page >= pagination.totalPages || isFetching
                            }
                            onClick={() =>
                                setPage(p =>
                                    Math.min(pagination.totalPages, p + 1),
                                )
                            }
                        >
                            Next
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            ) : null}

            <p className="mt-6 flex items-center gap-1.5 text-[12px] text-slate-gray">
                <Bell className="size-3.5" />
                New alerts also appear on the bell while you work.
            </p>
        </div>
    );
}
