import type { SelectedModifier } from "@/domains/catalog/domain/modifiers";
import type { StationId } from "@/domains/fulfillment/domain/station";

export const ORDER_ITEM_STATUSES = [
    "draft",
    "confirmed",
    "queued",
    "acknowledged",
    "in_preparation",
    "ready",
    "served",
    "cancelled",
    "change_requested",
    "cancellation_requested",
    "rejected_by_station",
    "blocked",
] as const;

export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

export const STATION_STATUS_LABELS: Record<OrderItemStatus, string> = {
    draft: "Draft",
    confirmed: "Confirmed",
    queued: "New order",
    acknowledged: "Acknowledged",
    in_preparation: "In progress",
    ready: "Ready",
    served: "Served",
    cancelled: "Cancelled",
    change_requested: "Change requested",
    cancellation_requested: "Cancel requested",
    rejected_by_station: "Cannot prepare",
    blocked: "Blocked",
};

export interface Order {
    id: string;
    sessionId: string;
    waiterId: string;
    createdAt: string;
    confirmedAt: string;
}

export interface OrderItem {
    id: string;
    orderId: string | null;
    sessionId: string;
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    stationId: StationId;
    expectedPreparationMinutes: number;
    modifiers: SelectedModifier[];
    instruction: string;
    status: OrderItemStatus;
    createdAt: string;
    queuedAt: string | null;
    acknowledgedAt: string | null;
    prepStartedAt: string | null;
    readyAt: string | null;
    servedAt: string | null;
    rejectReason: string | null;
}

export function isActiveStationStatus(status: OrderItemStatus): boolean {
    return (
        status === "queued" ||
        status === "acknowledged" ||
        status === "in_preparation" ||
        status === "ready"
    );
}

export function isExceptionStatus(status: OrderItemStatus): boolean {
    return (
        status === "rejected_by_station" ||
        status === "cancellation_requested" ||
        status === "blocked" ||
        status === "cancelled"
    );
}
