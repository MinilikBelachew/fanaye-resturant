import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEMO_MENU, unitPriceFor, type MenuItem } from "@/domains/catalog/domain/menu";
import {
    modifiersKey,
    type SelectedModifier,
} from "@/domains/catalog/domain/modifiers";
import {
    createFloorTables,
    withTableLocations,
} from "@/domains/floor/domain/table";
import type {
    DiningTable,
    TableSession,
} from "@/domains/floor/domain/table";
import type { StaffNotification } from "@/domains/notifications/domain/notification";
import type { Order, OrderItem } from "@/domains/ordering/domain/order";
import type { Payment } from "@/domains/payments/domain/payment";
import { isDigitalMethod, isLoggedPayment } from "@/domains/payments/domain/payment";
import { createId } from "@/lib/ids";

export const OPS_KEY = "fanaye.demo.ops.v1";

export interface OpsState {
    tables: DiningTable[];
    sessions: TableSession[];
    orders: Order[];
    items: OrderItem[];
    notifications: StaffNotification[];
    payments: Payment[];
    hydrated: boolean;
}

function emptyOps(): OpsState {
    return {
        tables: createFloorTables(),
        sessions: [],
        orders: [],
        items: [],
        notifications: [],
        payments: [],
        hydrated: false,
    };
}

function closePaidSession(state: OpsState, sessionId: string, at: string) {
    const session = state.sessions.find(entry => entry.id === sessionId);
    if (!session || session.status === "paid") return;
    session.status = "paid";
    session.closedAt = at;
    const table = findTable(state, session.tableId);
    if (table && table.currentSessionId === session.id) {
        table.status = "available";
        table.currentSessionId = null;
    }
}

function isLiveSession(session: TableSession | undefined) {
    return Boolean(
        session && session.status !== "paid" && session.status !== "closed",
    );
}

function normalizePayment(payment: Payment): Payment {
    const logged =
        payment.status === "pending_cashier" ||
        payment.status === "confirmed" ||
        payment.status === "logged";
    return {
        ...payment,
        status: logged ? "logged" : payment.status,
        confirmedAt: logged
            ? (payment.confirmedAt ?? payment.createdAt)
            : payment.confirmedAt,
    };
}

function findTable(state: OpsState, tableId: string) {
    return state.tables.find(table => table.id === tableId);
}

function findItem(state: OpsState, itemId: string) {
    return state.items.find(item => item.id === itemId);
}

function normalizeItem(item: OrderItem): OrderItem {
    return {
        ...item,
        modifiers: item.modifiers ?? [],
        instruction: item.instruction ?? "",
    };
}

function notifyItemReady(state: OpsState, item: OrderItem, now: string) {
    const session = state.sessions.find(entry => entry.id === item.sessionId);
    if (!session) return;
    const already = state.notifications.some(
        note => note.itemId === item.id && note.type === "item_ready",
    );
    if (already) return;
    const table = findTable(state, session.tableId);
    state.notifications.unshift({
        id: createId("note"),
        waiterId: session.waiterId,
        tableId: session.tableId,
        tableNumber: table?.number ?? "?",
        itemId: item.id,
        type: "item_ready",
        title: `${item.name} ready`,
        body: `Table ${table?.number ?? "?"} — ${item.quantity}× ${item.name}${item.modifiers?.length ? ` (${item.modifiers.map(entry => entry.name).join(", ")})` : ""} is ready to serve.`,
        read: false,
        createdAt: now,
    });
}

export const STATION_SETTABLE_STATUSES = [
    "queued",
    "acknowledged",
    "in_preparation",
    "ready",
    "rejected_by_station",
] as const;

export type StationSettableStatus =
    (typeof STATION_SETTABLE_STATUSES)[number];

export const opsSlice = createSlice({
    name: "ops",
    initialState: emptyOps(),
    reducers: {
        hydrateOps: (state, action: PayloadAction<OpsState | null>) => {
            if (action.payload) {
                state.tables = withTableLocations(action.payload.tables);
                state.sessions = action.payload.sessions;
                state.orders = action.payload.orders;
                state.items = action.payload.items.map(normalizeItem);
                state.notifications = action.payload.notifications;
                state.payments = (action.payload.payments ?? []).map(
                    normalizePayment,
                );
                state.payments.forEach(payment => {
                    if (isLoggedPayment(payment.status)) {
                        closePaidSession(
                            state,
                            payment.sessionId,
                            payment.confirmedAt ?? payment.createdAt,
                        );
                    }
                });
            } else {
                const fresh = emptyOps();
                state.tables = fresh.tables;
                state.sessions = [];
                state.orders = [];
                state.items = [];
                state.notifications = [];
                state.payments = [];
            }
            state.hydrated = true;
        },
        resetDemoOps: () => ({ ...emptyOps(), hydrated: true }),
        startTableSession: (
            state,
            action: PayloadAction<{
                tableId: string;
                waiterId: string;
                guestCount: number;
            }>,
        ) => {
            const table = findTable(state, action.payload.tableId);
            if (!table) return;
            const current = table.currentSessionId
                ? state.sessions.find(entry => entry.id === table.currentSessionId)
                : undefined;
            if (isLiveSession(current)) return;
            table.currentSessionId = null;
            const session: TableSession = {
                id: createId("session"),
                tableId: table.id,
                waiterId: action.payload.waiterId,
                guestCount: action.payload.guestCount,
                status: "open",
                openedAt: new Date().toISOString(),
                closedAt: null,
            };
            state.sessions.push(session);
            table.currentSessionId = session.id;
            table.status = "occupied";
        },
        addDraftItem: (
            state,
            action: PayloadAction<{
                sessionId: string;
                menuItemId: string;
                quantity: number;
                instruction: string;
                modifiers: SelectedModifier[];
                itemSnapshot?: MenuItem;
            }>,
        ) => {
            const menuItem =
                action.payload.itemSnapshot ??
                DEMO_MENU.find(item => item.id === action.payload.menuItemId);
            if (!menuItem || !menuItem.available) return;
            const modifiers = action.payload.modifiers ?? [];
            const instruction = action.payload.instruction.trim();
            const key = modifiersKey(modifiers);
            const existing = state.items.find(
                item =>
                    item.sessionId === action.payload.sessionId &&
                    item.status === "draft" &&
                    item.menuItemId === menuItem.id &&
                    item.instruction === instruction &&
                    modifiersKey(item.modifiers ?? []) === key,
            );
            if (existing) {
                existing.quantity += action.payload.quantity;
                return;
            }
            state.items.push({
                id: createId("item"),
                orderId: null,
                sessionId: action.payload.sessionId,
                menuItemId: menuItem.id,
                name: menuItem.name,
                quantity: action.payload.quantity,
                unitPrice: unitPriceFor(menuItem, modifiers),
                stationId: menuItem.stationId,
                expectedPreparationMinutes:
                    menuItem.expectedPreparationMinutes,
                modifiers,
                instruction,
                status: "draft",
                createdAt: new Date().toISOString(),
                queuedAt: null,
                acknowledgedAt: null,
                prepStartedAt: null,
                readyAt: null,
                servedAt: null,
                rejectReason: null,
            });
        },
        removeDraftItem: (state, action: PayloadAction<string>) => {
            const item = findItem(state, action.payload);
            if (!item || item.status !== "draft") return;
            state.items = state.items.filter(
                entry => entry.id !== action.payload,
            );
        },
        confirmOrder: (
            state,
            action: PayloadAction<{ sessionId: string; waiterId: string }>,
        ) => {
            const drafts = state.items.filter(
                item =>
                    item.sessionId === action.payload.sessionId &&
                    item.status === "draft",
            );
            if (drafts.length === 0) return;
            const now = new Date().toISOString();
            const order: Order = {
                id: createId("order"),
                sessionId: action.payload.sessionId,
                waiterId: action.payload.waiterId,
                createdAt: now,
                confirmedAt: now,
            };
            state.orders.push(order);
            drafts.forEach(item => {
                item.orderId = order.id;
                item.status = "queued";
                item.queuedAt = now;
            });
            const session = state.sessions.find(
                entry => entry.id === action.payload.sessionId,
            );
            if (session) session.status = "active_order";
            const table = state.tables.find(
                entry => entry.currentSessionId === action.payload.sessionId,
            );
            if (table) table.status = "active_order";
        },
        acknowledgeItem: (state, action: PayloadAction<string>) => {
            const item = findItem(state, action.payload);
            if (!item || item.status !== "queued") return;
            item.status = "acknowledged";
            item.acknowledgedAt = new Date().toISOString();
        },
        startPreparation: (state, action: PayloadAction<string>) => {
            const item = findItem(state, action.payload);
            if (
                !item ||
                (item.status !== "queued" && item.status !== "acknowledged")
            ) {
                return;
            }
            item.status = "in_preparation";
            item.prepStartedAt = new Date().toISOString();
            if (!item.acknowledgedAt) {
                item.acknowledgedAt = item.prepStartedAt;
            }
        },
        markItemReady: (state, action: PayloadAction<string>) => {
            const item = findItem(state, action.payload);
            if (!item || item.status !== "in_preparation") return;
            const now = new Date().toISOString();
            item.status = "ready";
            item.readyAt = now;
            notifyItemReady(state, item, now);
        },
        setStationItemStatus: (
            state,
            action: PayloadAction<{
                itemId: string;
                status: StationSettableStatus;
            }>,
        ) => {
            const item = findItem(state, action.payload.itemId);
            if (!item) return;
            if (
                item.status === "served" ||
                item.status === "cancelled" ||
                item.status === "draft"
            ) {
                return;
            }
            const next = action.payload.status;
            if (item.status === next) return;
            const now = new Date().toISOString();
            const wasReady = item.status === "ready";

            if (next === "queued") {
                item.status = "queued";
                item.rejectReason = null;
                return;
            }
            if (next === "acknowledged") {
                item.status = "acknowledged";
                item.acknowledgedAt = item.acknowledgedAt ?? now;
                item.rejectReason = null;
                return;
            }
            if (next === "in_preparation") {
                item.status = "in_preparation";
                item.acknowledgedAt = item.acknowledgedAt ?? now;
                item.prepStartedAt = item.prepStartedAt ?? now;
                item.rejectReason = null;
                return;
            }
            if (next === "ready") {
                item.status = "ready";
                item.acknowledgedAt = item.acknowledgedAt ?? now;
                item.prepStartedAt = item.prepStartedAt ?? now;
                item.readyAt = now;
                item.rejectReason = null;
                if (!wasReady) notifyItemReady(state, item, now);
                return;
            }
            item.status = "rejected_by_station";
            item.rejectReason = item.rejectReason ?? "Cannot prepare";
        },
        markItemServed: (state, action: PayloadAction<string>) => {
            const item = findItem(state, action.payload);
            if (!item || item.status !== "ready") return;
            item.status = "served";
            item.servedAt = new Date().toISOString();
        },
        cannotPrepareItem: (
            state,
            action: PayloadAction<{ itemId: string; reason: string }>,
        ) => {
            const item = findItem(state, action.payload.itemId);
            if (!item) return;
            if (
                item.status !== "queued" &&
                item.status !== "acknowledged" &&
                item.status !== "in_preparation"
            ) {
                return;
            }
            item.status = "rejected_by_station";
            item.rejectReason = action.payload.reason;
        },
        markNotificationRead: (state, action: PayloadAction<string>) => {
            const note = state.notifications.find(
                entry => entry.id === action.payload,
            );
            if (note) note.read = true;
        },
        markAllNotificationsRead: (
            state,
            action: PayloadAction<string>,
        ) => {
            state.notifications.forEach(note => {
                if (note.waiterId === action.payload) note.read = true;
            });
        },
        requestBill: (state, action: PayloadAction<string>) => {
            const session = state.sessions.find(
                entry => entry.id === action.payload,
            );
            if (!session) return;
            if (
                session.status === "payment_pending" ||
                session.status === "paid"
            ) {
                return;
            }
            session.status = "bill_requested";
            const table = findTable(state, session.tableId);
            if (table) table.status = "bill_requested";
        },
        submitPayment: (
            state,
            action: PayloadAction<{
                sessionId: string;
                waiterId: string;
                method: Payment["method"];
                evidenceDataUrl: string | null;
            }>,
        ) => {
            const session = state.sessions.find(
                entry => entry.id === action.payload.sessionId,
            );
            if (!session || session.status !== "bill_requested") return;
            const already = state.payments.find(
                payment =>
                    payment.sessionId === session.id &&
                    isLoggedPayment(payment.status),
            );
            if (already) return;
            if (
                isDigitalMethod(action.payload.method) &&
                !action.payload.evidenceDataUrl
            ) {
                return;
            }
            const amount = state.items
                .filter(
                    item =>
                        item.sessionId === session.id &&
                        item.status !== "cancelled" &&
                        item.status !== "draft",
                )
                .reduce(
                    (sum, item) => sum + item.unitPrice * item.quantity,
                    0,
                );
            const table = findTable(state, session.tableId);
            const now = new Date().toISOString();
            state.payments.unshift({
                id: createId("pay"),
                sessionId: session.id,
                tableId: session.tableId,
                tableNumber: table?.number ?? "?",
                waiterId: action.payload.waiterId,
                amount,
                method: action.payload.method,
                status: "logged",
                evidenceDataUrl: action.payload.evidenceDataUrl,
                createdAt: now,
                confirmedAt: now,
                confirmedBy: null,
                rejectReason: null,
            });
            closePaidSession(state, session.id, now);
        },
        confirmPayment: (
            state,
            action: PayloadAction<{ paymentId: string; cashierId: string }>,
        ) => {
            const payment = state.payments.find(
                entry => entry.id === action.payload.paymentId,
            );
            if (!payment || payment.status !== "pending_cashier") return;
            const now = new Date().toISOString();
            payment.status = "confirmed";
            payment.confirmedAt = now;
            payment.confirmedBy = action.payload.cashierId;
            const session = state.sessions.find(
                entry => entry.id === payment.sessionId,
            );
            if (!session) return;
            session.status = "paid";
            session.closedAt = now;
            const table = findTable(state, session.tableId);
            if (table) {
                table.status = "available";
                table.currentSessionId = null;
            }
        },
        rejectPayment: (
            state,
            action: PayloadAction<{ paymentId: string; reason: string }>,
        ) => {
            const payment = state.payments.find(
                entry => entry.id === action.payload.paymentId,
            );
            if (!payment || payment.status !== "pending_cashier") return;
            payment.status = "rejected";
            payment.rejectReason = action.payload.reason;
            const session = state.sessions.find(
                entry => entry.id === payment.sessionId,
            );
            if (!session) return;
            session.status = "bill_requested";
            const table = findTable(state, session.tableId);
            if (table) table.status = "bill_requested";
        },
    },
});

export const {
    hydrateOps,
    resetDemoOps,
    startTableSession,
    addDraftItem,
    removeDraftItem,
    confirmOrder,
    acknowledgeItem,
    startPreparation,
    markItemReady,
    markItemServed,
    cannotPrepareItem,
    setStationItemStatus,
    markNotificationRead,
    markAllNotificationsRead,
    requestBill,
    submitPayment,
    confirmPayment,
    rejectPayment,
} = opsSlice.actions;

export default opsSlice.reducer;
