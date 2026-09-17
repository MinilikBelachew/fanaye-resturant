import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OpsNotification } from "@/domains/notifications/domain/opsNotification";

interface NotificationsState {
    items: OpsNotification[];
    connected: boolean;
    hydrated: boolean;
}

const initialState: NotificationsState = {
    items: [],
    connected: false,
    hydrated: false,
};

function noteKey(note: OpsNotification) {
    return note.id ?? `${note.type}:${note.createdAt}:${note.title}`;
}

const notificationsSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        setConnected: (state, action: PayloadAction<boolean>) => {
            state.connected = action.payload;
        },
        hydrateInbox: (state, action: PayloadAction<OpsNotification[]>) => {
            const fromApi = action.payload;
            const byId = new Map<string, OpsNotification>();
            for (const note of fromApi) {
                if (note.id) byId.set(note.id, note);
            }
            for (const note of state.items) {
                if (note.id) {
                    if (!byId.has(note.id)) byId.set(note.id, note);
                } else {
                    byId.set(noteKey(note), note);
                }
            }
            state.items = [...byId.values()].sort(
                (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
            );
            state.hydrated = true;
        },
        pushNotification: (state, action: PayloadAction<OpsNotification>) => {
            const incoming = action.payload;
            const key = noteKey(incoming);
            const exists = state.items.some(item => noteKey(item) === key);
            if (exists) return;
            state.items.unshift({
                ...incoming,
                readAt: incoming.readAt ?? null,
            });
            if (state.items.length > 80) {
                state.items = state.items.slice(0, 80);
            }
        },
        markLocalRead: (state, action: PayloadAction<string>) => {
            const note = state.items.find(
                item =>
                    item.id === action.payload ||
                    noteKey(item) === action.payload,
            );
            if (note && !note.readAt) {
                note.readAt = new Date().toISOString();
            }
        },
        markAllLocalRead: state => {
            const now = new Date().toISOString();
            state.items.forEach(note => {
                if (!note.readAt) note.readAt = now;
            });
        },
        clearInbox: state => {
            state.items = [];
            state.hydrated = false;
            state.connected = false;
        },
    },
});

export const {
    setConnected,
    hydrateInbox,
    pushNotification,
    markLocalRead,
    markAllLocalRead,
    clearInbox,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

export function selectUnreadOpsCount(state: {
    notifications: NotificationsState;
}) {
    return state.notifications.items.filter(note => !note.readAt).length;
}
