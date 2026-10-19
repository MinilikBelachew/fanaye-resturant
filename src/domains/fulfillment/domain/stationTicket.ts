export type StationTicketModifier = {
    name: string;
    priceDelta: string;
};

export type StationTicket = {
    orderItemId: string;
    tableSessionId: string;
    tableDisplayName: string;
    itemName: string;
    quantity: number;
    unitPrice: string;
    currencyCode: string;
    modifiers: StationTicketModifier[];
    specialInstruction: string | null;
    waiter: { membershipId: string; displayName: string };
    state: string;
    queuedAt: string | null;
    expectedPrepMinutes: number;
    elapsedSeconds: number;
    delayed: boolean;
    version: number;
    exceptionReason: string | null;
};

export type StationWorkflowMode = "FULL_PREP" | "QUICK_SERVE";

export type StationQueueResponse = {
    stationId: string;
    stationName: string;
    stationCode: string | null;
    workflowMode?: StationWorkflowMode | string;
    stationOffline?: boolean;
    data: StationTicket[];
};

export function isQuickServeWorkflow(
    mode?: StationWorkflowMode | string | null,
) {
    return mode === "QUICK_SERVE";
}

export const STATION_STATE_LABELS: Record<string, string> = {
    QUEUED: "New order",
    ACKNOWLEDGED: "Acknowledged",
    IN_PREPARATION: "In progress",
    READY: "Ready",
    SERVED: "Served",
    CANNOT_PREPARE: "Cannot prepare",
    CANCELLED: "Cancelled",
};

export function stationStateLabel(state: string) {
    return STATION_STATE_LABELS[state] ?? state.replaceAll("_", " ");
}

export function stationTicketExtras(ticket: StationTicket) {
    return [
        ...ticket.modifiers.map(entry => entry.name),
        ticket.specialInstruction?.trim() ?? "",
    ]
        .filter(Boolean)
        .join(" · ");
}

/** Open tickets waiting this long are hard exceptions (not a live “New” rush). */
export const STALE_EXCEPTION_SECONDS = 4 * 60 * 60;

export function isStaleStationTicket(ticket: StationTicket) {
    return ticket.elapsedSeconds >= STALE_EXCEPTION_SECONDS;
}

export function stationQueueCounts(tickets: StationTicket[]) {
    return {
        new: tickets.filter(
            ticket =>
                (ticket.state === "QUEUED" ||
                    ticket.state === "ACKNOWLEDGED") &&
                !isStaleStationTicket(ticket),
        ).length,
        preparing: tickets.filter(
            ticket =>
                ticket.state === "IN_PREPARATION" &&
                !isStaleStationTicket(ticket),
        ).length,
        ready: tickets.filter(
            ticket => ticket.state === "READY" && !isStaleStationTicket(ticket),
        ).length,
        exceptions: tickets.filter(
            ticket =>
                ticket.state === "CANNOT_PREPARE" ||
                ticket.delayed ||
                isStaleStationTicket(ticket),
        ).length,
    };
}
