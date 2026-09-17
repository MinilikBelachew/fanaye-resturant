"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "@/context/env";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { api } from "@/context/services";
import { useListNotificationsQuery } from "@/context/services/notificationsApi";
import {
    hydrateInbox,
    pushNotification,
    setConnected,
} from "@/context/slices/notificationsSlice";
import {
    isNotificationVisibleForRole,
    type OpsNotification,
} from "@/domains/notifications/domain/opsNotification";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { toast } from "@/lib/toast";

function invalidateForType(
    dispatch: ReturnType<typeof useAppDispatch>,
    type: string,
) {
    if (
        type === "item.ready" ||
        type === "ticket.queued" ||
        type === "ticket.updated"
    ) {
        dispatch(
            api.util.invalidateTags([
                "Station",
                "Floor",
                "Order",
                "Notifications",
            ]),
        );
    }
    if (type === "bill.request.created" || type === "bill.ready") {
        dispatch(api.util.invalidateTags(["Bill", "Floor", "Notifications"]));
    }
    if (type.startsWith("cash_drop")) {
        dispatch(api.util.invalidateTags(["Cash", "Notifications"]));
    }
    if (type.startsWith("approval") || type === "production.exception") {
        dispatch(
            api.util.invalidateTags([
                "Approvals",
                "Order",
                "Floor",
                "Notifications",
            ]),
        );
    }
    if (type.startsWith("guest.")) {
        dispatch(api.util.invalidateTags(["Floor", "Order", "Notifications"]));
    }
}

export function useOpsSocket() {
    const dispatch = useAppDispatch();
    const accessToken = useAppSelector(state => state.identity.accessToken);
    const staff = useAppSelector(selectCurrentStaff);
    const role = staff?.role ?? "";
    const socketRef = useRef<Socket | null>(null);
    const seenRef = useRef<Set<string>>(new Set());

    const { data: inbox } = useListNotificationsQuery(
        { page: 1, limit: 40 },
        { skip: !accessToken || !staff },
    );

    useEffect(() => {
        if (!inbox?.data || !role) return;
        dispatch(
            hydrateInbox(
                inbox.data.filter(note =>
                    isNotificationVisibleForRole(note.type, role),
                ),
            ),
        );
    }, [dispatch, inbox?.data, role]);

    useEffect(() => {
        if (!accessToken || !staff) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            dispatch(setConnected(false));
            return;
        }

        const socket = io(`${SOCKET_BASE_URL}/ops`, {
            auth: { token: accessToken },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1200,
            reconnectionAttempts: 20,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            dispatch(setConnected(true));
        });
        socket.on("disconnect", () => {
            dispatch(setConnected(false));
        });
        socket.on("connect_error", () => {
            dispatch(setConnected(false));
        });

        socket.on("ops.notification", (raw: OpsNotification) => {
            const key = raw.id ?? `${raw.type}:${raw.createdAt}:${raw.title}`;
            if (seenRef.current.has(key)) return;
            seenRef.current.add(key);
            if (seenRef.current.size > 200) {
                seenRef.current = new Set([...seenRef.current].slice(-100));
            }

            // Always refresh boards for relevant events, even if inbox hides them.
            invalidateForType(dispatch, raw.type);

            if (!isNotificationVisibleForRole(raw.type, staff.role)) {
                return;
            }

            dispatch(pushNotification({ ...raw, readAt: raw.readAt ?? null }));

            if (raw.severity === "URGENT" || raw.severity === "ATTENTION") {
                toast.info(raw.title, raw.body ?? undefined);
            }
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
            dispatch(setConnected(false));
        };
    }, [accessToken, dispatch, staff]);
}
