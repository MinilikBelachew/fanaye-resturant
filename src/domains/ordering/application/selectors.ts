import type { RootState } from "@/context/store";
import { mapAuthContextToStaff } from "@/domains/identity/application/mapAuthToStaff";
import type { StationId } from "@/domains/fulfillment/domain/station";
import {
    isExceptionStatus,
    STATION_STATUS_LABELS,
    type OrderItem,
} from "@/domains/ordering/domain/order";

export function selectStaffList(state: RootState) {
    return state.identity.staffMembers ?? [];
}

export function selectCurrentStaff(state: RootState) {
    if (!state.identity.session) return null;
    return mapAuthContextToStaff(state.identity.session);
}

export function selectWaitersList(state: RootState) {
    const list = state.identity.staffMembers ?? [];
    return list.filter(person => person.role === "waiter" && person.active);
}

export function selectSessionForTable(state: RootState, tableId: string) {
    const table = state.ops.tables.find(entry => entry.id === tableId);
    if (!table?.currentSessionId) return null;
    const session =
        state.ops.sessions.find(entry => entry.id === table.currentSessionId) ??
        null;
    if (!session || session.status === "paid" || session.status === "closed") {
        return null;
    }
    return session;
}

export function selectItemsForSession(
    state: RootState,
    sessionId: string,
): OrderItem[] {
    return state.ops.items.filter(item => item.sessionId === sessionId);
}

export function selectStationItems(
    state: RootState,
    stationId: StationId,
): OrderItem[] {
    return state.ops.items.filter(
        item =>
            item.stationId === stationId &&
            item.status !== "draft" &&
            item.status !== "served",
    );
}

export function isItemDelayed(item: OrderItem, now = Date.now()): boolean {
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

export function selectUnreadReadyCount(
    state: RootState,
    waiterId: string,
): number {
    return state.ops.notifications.filter(
        note => note.waiterId === waiterId && !note.read,
    ).length;
}

export function displayStatus(item: OrderItem, now = Date.now()): string {
    if (isItemDelayed(item, now) && !isExceptionStatus(item.status)) {
        return `Delayed · ${STATION_STATUS_LABELS[item.status]}`;
    }
    return STATION_STATUS_LABELS[item.status];
}

export function selectStationQueueCounts(
    state: RootState,
    stationId: StationId,
) {
    const items = selectStationItems(state, stationId);
    return {
        new: items.filter(
            item => item.status === "queued" || item.status === "acknowledged",
        ).length,
        preparing: items.filter(item => item.status === "in_preparation")
            .length,
        ready: items.filter(item => item.status === "ready").length,
        exceptions: items.filter(
            item => isExceptionStatus(item.status) || isItemDelayed(item),
        ).length,
    };
}

export function formatTicketExtras(item: {
    modifiers?: { name: string }[];
    instruction?: string;
}): string {
    const parts = [
        ...(item.modifiers ?? []).map(entry => entry.name),
        item.instruction?.trim() ? item.instruction.trim() : "",
    ].filter(Boolean);
    return parts.join(" · ");
}

export function stationLabel(stationId: string): string {
    if (stationId.includes("barista")) return "Barista";
    if (stationId.includes("cake")) return "Cakes";
    if (stationId.includes("soft")) return "Soft drinks";
    return "Kitchen";
}

export function selectWaiterFloorSummary(state: RootState, waiterId: string) {
    const mySessions = state.ops.sessions.filter(
        session =>
            session.waiterId === waiterId &&
            session.status !== "closed" &&
            session.status !== "paid",
    );
    const myItems = state.ops.items.filter(item =>
        mySessions.some(session => session.id === item.sessionId),
    );
    const readyCount = myItems.filter(item => item.status === "ready").length;
    const cookingCount = myItems.filter(
        item =>
            item.status === "queued" ||
            item.status === "acknowledged" ||
            item.status === "in_preparation",
    ).length;
    const sales = myItems
        .filter(item => item.status !== "draft" && item.status !== "cancelled")
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return {
        openTables: mySessions.length,
        readyCount,
        cookingCount,
        sales,
    };
}
