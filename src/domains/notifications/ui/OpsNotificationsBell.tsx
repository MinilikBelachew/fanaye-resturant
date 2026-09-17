"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Radio } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    useMarkAllNotificationsReadMutation,
    useMarkNotificationReadMutation,
} from "@/context/services/notificationsApi";
import {
    markAllLocalRead,
    markLocalRead,
} from "@/context/slices/notificationsSlice";
import { notificationsPathForRole } from "@/domains/identity/application/homePath";
import {
    isNotificationVisibleForRole,
    notificationHref,
    type OpsNotification,
} from "@/domains/notifications/domain/opsNotification";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function severityDot(severity: OpsNotification["severity"]) {
    if (severity === "URGENT") return "bg-red-500";
    if (severity === "ATTENTION") return "bg-amber-500";
    return "bg-emerald-500";
}

function timeAgo(iso: string) {
    const diff = Date.now() - Date.parse(iso);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}

export default function OpsNotificationsBell({
    className,
}: {
    className?: string;
}) {
    const dispatch = useAppDispatch();
    const staff = useAppSelector(selectCurrentStaff);
    const items = useAppSelector(state => state.notifications.items);
    const connected = useAppSelector(state => state.notifications.connected);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const [markRead] = useMarkNotificationReadMutation();
    const [markAllRead] = useMarkAllNotificationsReadMutation();

    const visible = useMemo(() => {
        if (!staff) return [];
        return items.filter(note =>
            isNotificationVisibleForRole(note.type, staff.role),
        );
    }, [items, staff]);
    const unread = visible.filter(note => !note.readAt).length;
    const preview = useMemo(() => visible.slice(0, 12), [visible]);
    const inboxHref = staff ? notificationsPathForRole(staff.role) : null;

    useEffect(() => {
        if (!open) return;
        function onPointer(event: MouseEvent) {
            if (!panelRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    async function onOpenNote(note: OpsNotification) {
        if (note.id && !note.readAt) {
            dispatch(markLocalRead(note.id));
            try {
                await markRead(note.id).unwrap();
            } catch {
                // Local mark is enough if network fails.
            }
        }
        setOpen(false);
    }

    async function onMarkAll() {
        dispatch(markAllLocalRead());
        try {
            await markAllRead().unwrap();
        } catch {
            // Keep local state.
        }
    }

    if (!staff) return null;

    return (
        <div ref={panelRef} className={cn("relative", className)}>
            <button
                type="button"
                aria-label="Notifications"
                aria-expanded={open}
                onClick={() => setOpen(value => !value)}
                className="relative flex size-8 items-center justify-center rounded-md text-foreground/80 hover:bg-secondary"
            >
                <Bell className="size-4" />
                {unread > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute top-10 right-0 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-hairline bg-white shadow-xl dark:bg-card">
                    <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold tracking-tight">
                                Alerts
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-gray">
                                <Radio
                                    className={cn(
                                        "size-3",
                                        connected
                                            ? "text-emerald-500"
                                            : "text-slate-400",
                                    )}
                                />
                                {connected ? "Live" : "Reconnecting…"}
                            </p>
                        </div>
                        {unread > 0 ? (
                            <button
                                type="button"
                                onClick={() => void onMarkAll()}
                                className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium hover:bg-secondary"
                            >
                                <CheckCheck className="size-3" />
                                Mark all
                            </button>
                        ) : null}
                    </div>

                    <ul className="max-h-[min(70vh,420px)] overflow-y-auto">
                        {preview.length === 0 ? (
                            <li className="px-4 py-10 text-center text-sm text-slate-gray">
                                No alerts yet. Live events will appear here.
                            </li>
                        ) : (
                            preview.map(note => {
                                const href = notificationHref(note, staff.role);
                                const content = (
                                    <div className="flex gap-3 px-4 py-3">
                                        <span
                                            className={cn(
                                                "mt-1.5 size-2 shrink-0 rounded-full",
                                                severityDot(note.severity),
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        "text-[13px] leading-snug",
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
                                                <p className="mt-1 line-clamp-2 text-[12px] text-slate-gray">
                                                    {note.body}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                );

                                return (
                                    <li
                                        key={
                                            note.id ??
                                            `${note.type}-${note.createdAt}`
                                        }
                                        className={cn(
                                            "border-b border-hairline last:border-b-0",
                                            !note.readAt &&
                                                "bg-amber-50/40 dark:bg-amber-500/5",
                                        )}
                                    >
                                        {href ? (
                                            <Link
                                                href={href}
                                                onClick={() =>
                                                    void onOpenNote(note)
                                                }
                                                className="block hover:bg-secondary/60"
                                            >
                                                {content}
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                className="block w-full text-left hover:bg-secondary/60"
                                                onClick={() =>
                                                    void onOpenNote(note)
                                                }
                                            >
                                                {content}
                                            </button>
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    {inboxHref ? (
                        <div className="border-t border-hairline p-2">
                            <Link
                                href={inboxHref}
                                onClick={() => setOpen(false)}
                                className="flex h-9 items-center justify-center rounded-xl text-[13px] font-medium text-brand hover:bg-secondary"
                            >
                                View all notifications
                            </Link>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
