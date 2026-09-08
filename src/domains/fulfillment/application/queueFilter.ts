import {
    isExceptionStatus,
    type OrderItem,
} from "@/domains/ordering/domain/order";
import type { StationTicket } from "@/domains/fulfillment/domain/stationTicket";

function isDelayed(item: OrderItem, now = Date.now()): boolean {
    if (
        item.status !== "queued" &&
        item.status !== "acknowledged" &&
        item.status !== "in_preparation"
    ) {
        return false;
    }
    const start = Date.parse(
        item.prepStartedAt ?? item.queuedAt ?? item.createdAt,
    );
    return now - start > item.expectedPreparationMinutes * 60 * 1000;
}

export const QUEUE_FILTERS = [
    "all",
    "new",
    "preparing",
    "ready",
    "exceptions",
] as const;

export type QueueFilter = (typeof QUEUE_FILTERS)[number];
export type QueueView = "cards" | "table";

export function parseQueueFilter(value: string | null): QueueFilter {
    if (
        value === "new" ||
        value === "preparing" ||
        value === "ready" ||
        value === "exceptions"
    ) {
        return value;
    }
    return "all";
}

export function parseQueueView(value: string | null): QueueView {
    return value === "table" ? "table" : "cards";
}

export function matchesQueueFilter(
    item: OrderItem,
    filter: QueueFilter,
): boolean {
    if (filter === "all") return true;
    const delayed = isDelayed(item);
    if (filter === "new") {
        return item.status === "queued" || item.status === "acknowledged";
    }
    if (filter === "preparing") {
        return item.status === "in_preparation";
    }
    if (filter === "ready") {
        return item.status === "ready";
    }
    return isExceptionStatus(item.status) || delayed;
}

export function matchesStationFilter(
    ticket: StationTicket,
    filter: QueueFilter,
): boolean {
    if (filter === "all") return true;
    if (filter === "new") {
        return ticket.state === "QUEUED" || ticket.state === "ACKNOWLEDGED";
    }
    if (filter === "preparing") {
        return ticket.state === "IN_PREPARATION";
    }
    if (filter === "ready") {
        return ticket.state === "READY";
    }
    return ticket.state === "CANNOT_PREPARE" || ticket.delayed;
}

export function stationQueueHref(
    home: string,
    options: {
        status?: QueueFilter;
        q?: string;
        view?: QueueView;
    } = {},
) {
    const params = new URLSearchParams();
    if (options.status && options.status !== "all") {
        params.set("status", options.status);
    }
    const query = options.q?.trim();
    if (query) params.set("q", query);
    if (options.view && options.view !== "cards") {
        params.set("view", options.view);
    }
    const qs = params.toString();
    return qs ? `${home}?${qs}` : home;
}

export const QUEUE_FILTER_LABELS: Record<QueueFilter, string> = {
    all: "All tickets",
    new: "New",
    preparing: "In progress",
    ready: "Ready",
    exceptions: "Exceptions",
};
