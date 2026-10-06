export type OpsSeverity = "INFO" | "ATTENTION" | "URGENT";

export type OpsNotificationType =
    | "item.ready"
    | "ticket.queued"
    | "ticket.updated"
    | "station.status.changed"
    | "bill.request.created"
    | "bill.ready"
    | "cash_drop.pending"
    | "cash_drop.resolved"
    | "approval.requested"
    | "approval.decided"
    | "production.exception"
    | "guest.order_placed"
    | "guest.service_request"
    | "floor.updated"
    | string;

export interface OpsNotification {
    id: string | null;
    type: OpsNotificationType;
    tenantId: string;
    branchId: string;
    severity: OpsSeverity;
    title: string;
    body: string | null;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    payload: Record<string, unknown> | null;
    createdAt: string;
    recipientMembershipId: string | null;
    readAt?: string | null;
}

export function isNotificationVisibleForRole(
    type: string,
    role: string,
): boolean {
    const normalized = type.toUpperCase().replace(/\./g, "_");
    const stationRoles = ["kitchen", "barista", "cakes", "soft_drinks"];

    if (stationRoles.includes(role)) {
        // Stations only get new-ticket + exception alerts.
        // ticket.updated / item.ready belong to board refresh / waiters.
        return (
            type === "ticket.queued" ||
            type === "production.exception" ||
            normalized === "TICKET_QUEUED" ||
            normalized === "PRODUCTION_EXCEPTION"
        );
    }

    if (role === "cashier") {
        return (
            type === "bill.request.created" ||
            type === "cash_drop.pending" ||
            type === "cash_drop.resolved" ||
            normalized === "BILL_REQUEST_CREATED" ||
            normalized === "CASH_DROP_PENDING" ||
            normalized.includes("BILL_REQUEST")
        );
    }

    if (role === "waiter") {
        return (
            type === "item.ready" ||
            type === "bill.ready" ||
            type === "guest.order_placed" ||
            type === "guest.service_request" ||
            type === "approval.decided" ||
            type === "cash_drop.resolved" ||
            type === "production.exception" ||
            type === "menu.item.availability" ||
            normalized === "BILL_READY" ||
            normalized === "GUEST_ORDER_PLACED" ||
            normalized === "ITEM_READY" ||
            normalized === "MENU_ITEM_AVAILABILITY" ||
            [
                "CALL_WAITER",
                "REQUEST_WATER",
                "REQUEST_BILL",
                "EXTRA_NAPKINS",
                "ASSISTANCE",
            ].includes(type) ||
            [
                "CALL_WAITER",
                "REQUEST_WATER",
                "REQUEST_BILL",
                "EXTRA_NAPKINS",
                "ASSISTANCE",
            ].includes(normalized)
        );
    }

    if (role === "manager" || role === "owner") {
        return (
            type === "approval.requested" ||
            type === "production.exception" ||
            type === "cash_drop.pending" ||
            type === "bill.request.created" ||
            type === "ticket.queued" ||
            type === "menu.item.availability" ||
            type.startsWith("approval") ||
            type.startsWith("cash_drop") ||
            type.startsWith("bill.")
        );
    }

    return true;
}

export function notificationHref(
    note: OpsNotification,
    role: string,
): string | null {
    const payload = note.payload ?? {};
    const tableSessionId =
        typeof payload.tableSessionId === "string"
            ? payload.tableSessionId
            : null;
    const tableId =
        typeof payload.tableId === "string" ? payload.tableId : null;

    switch (note.type) {
        case "item.ready":
        case "guest.order_placed":
        case "guest.service_request":
        case "bill.ready":
            if (role === "waiter") {
                if (tableId) return `/waiter/tables/${tableId}`;
                return "/waiter/ready";
            }
            if (role === "dispatcher") {
                if (tableSessionId) {
                    return `/dispatcher/calls/${tableSessionId}`;
                }
                return "/dispatcher";
            }
            return null;
        case "ticket.queued":
            if (
                role === "kitchen" ||
                role === "barista" ||
                role === "cakes" ||
                role === "soft_drinks"
            ) {
                if (role === "soft_drinks") return "/soft-drinks";
                return `/${role}`;
            }
            return null;
        case "ticket.updated":
            return null;
        case "bill.request.created":
            return role === "cashier" ? "/cashier/bills" : null;
        case "cash_drop.pending":
            return role === "cashier" ? "/cashier/cash-drops" : null;
        case "cash_drop.resolved":
            if (role === "waiter") return "/waiter/cash";
            if (role === "dispatcher") return "/dispatcher/cash";
            return null;
        case "approval.requested": {
            if (role !== "manager" && role !== "owner") return null;
            const requestType =
                typeof payload.requestType === "string"
                    ? payload.requestType.toUpperCase()
                    : "";
            const requestId =
                typeof payload.requestId === "string"
                    ? payload.requestId
                    : note.relatedEntityId;
            if (
                requestId &&
                (requestType === "CANCELLATION" || requestType === "CHANGE")
            ) {
                const kind =
                    requestType === "CANCELLATION" ? "cancellation" : "change";
                return `/manager/approvals/${kind}/${requestId}`;
            }
            if (
                requestId &&
                (note.relatedEntityType === "CancellationRequest" ||
                    note.relatedEntityType === "OrderChangeRequest")
            ) {
                const kind =
                    note.relatedEntityType === "CancellationRequest"
                        ? "cancellation"
                        : "change";
                return `/manager/approvals/${kind}/${requestId}`;
            }
            return "/manager/approvals";
        }
        case "approval.decided":
            if (role === "waiter") {
                return tableId ? `/waiter/tables/${tableId}` : "/waiter/tables";
            }
            if (role === "dispatcher") {
                return tableSessionId
                    ? `/dispatcher/calls/${tableSessionId}`
                    : "/dispatcher";
            }
            return null;
        case "production.exception":
            if (role === "manager" || role === "owner") {
                return "/manager/approvals";
            }
            if (role === "waiter" && tableId) {
                return `/waiter/tables/${tableId}`;
            }
            if (role === "dispatcher" && tableSessionId) {
                return `/dispatcher/calls/${tableSessionId}`;
            }
            return null;
        default:
            return tableSessionId || tableId ? null : null;
    }
}
