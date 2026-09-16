import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Staff } from "@/domains/identity/domain/staff";
import type { AuthContext } from "@/domains/identity/domain/authContext";
import type { CurrentShiftResponse } from "@/domains/identity/domain/shift";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import { authApi } from "@/context/services/authApi";
import { shiftsApi } from "@/context/services/shiftsApi";
import { API_BASE_URL } from "@/context/env";

const STAFF_LIST_STORAGE_KEY = "fanaye.demo.staffList.v1";

interface IdentityState {
    apiBaseUrl: string;
    accessToken: string | null;
    tokenExpires: number | null;
    session: AuthContext | null;
    staffMembers: Staff[];
    hydrated: boolean;
    isAddEditOpen: boolean;
    editingStaff: Staff | null;
    isAssignTablesOpen: boolean;
    assigningWaiter: Staff | null;
}

const initialState: IdentityState = {
    apiBaseUrl: API_BASE_URL,
    accessToken: null,
    tokenExpires: null,
    session: null,
    staffMembers: DEMO_STAFF,
    hydrated: false,
    isAddEditOpen: false,
    editingStaff: null,
    isAssignTablesOpen: false,
    assigningWaiter: null,
};

function applyShiftToSession(
    session: AuthContext | null,
    shift: CurrentShiftResponse,
): AuthContext | null {
    if (!session) return session;
    return {
        ...session,
        shiftSessionId: shift.shiftSession?.id ?? null,
    };
}

export const identitySlice = createSlice({
    name: "identity",
    initialState,
    reducers: {
        setSession: (state, action: PayloadAction<AuthContext>) => {
            state.session = action.payload;
        },
        setAccessToken: (
            state,
            action: PayloadAction<{ token: string; tokenExpires: number }>,
        ) => {
            state.accessToken = action.payload.token;
            state.tokenExpires = action.payload.tokenExpires;
        },
        clearSession: state => {
            state.session = null;
            state.accessToken = null;
            state.tokenExpires = null;
        },
        markHydrated: state => {
            state.hydrated = true;
        },
        hydrateStaff: (state, action: PayloadAction<Staff[] | null>) => {
            if (
                action.payload &&
                Array.isArray(action.payload) &&
                action.payload.length > 0
            ) {
                state.staffMembers = action.payload;
            }
        },
        addStaff: (state, action: PayloadAction<Staff>) => {
            state.staffMembers.push(action.payload);
            state.isAddEditOpen = false;
            state.editingStaff = null;
        },
        updateStaff: (state, action: PayloadAction<Staff>) => {
            const index = state.staffMembers.findIndex(
                s => s.id === action.payload.id,
            );
            if (index !== -1) {
                state.staffMembers[index] = action.payload;
            }
            state.isAddEditOpen = false;
            state.editingStaff = null;
        },
        deleteStaff: (state, action: PayloadAction<string>) => {
            state.staffMembers = state.staffMembers.filter(
                s => s.id !== action.payload,
            );
            state.isAddEditOpen = false;
            state.editingStaff = null;
        },
        toggleStaffActive: (state, action: PayloadAction<string>) => {
            const staff = state.staffMembers.find(s => s.id === action.payload);
            if (staff) {
                staff.active = !staff.active;
            }
        },
        setStaffShiftStatus: (
            state,
            action: PayloadAction<{
                staffId: string;
                status: "on_duty" | "on_break" | "off_duty";
            }>,
        ) => {
            const staff = state.staffMembers.find(
                s => s.id === action.payload.staffId,
            );
            if (staff) {
                staff.shiftStatus = action.payload.status;
            }
        },
        assignTablesToWaiter: (
            state,
            action: PayloadAction<{ waiterId: string; tableIds: string[] }>,
        ) => {
            const waiter = state.staffMembers.find(
                s => s.id === action.payload.waiterId,
            );
            if (waiter) {
                waiter.assignedTableIds = action.payload.tableIds;
            }
            state.isAssignTablesOpen = false;
            state.assigningWaiter = null;
        },
        openAddStaff: (
            state,
            action: PayloadAction<Staff["role"] | undefined>,
        ) => {
            state.isAddEditOpen = true;
            state.editingStaff = action.payload
                ? {
                      id: `staff-${Date.now().toString(36)}`,
                      name: "",
                      role: action.payload,
                      pinHint: "1234",
                      phone: "",
                      active: true,
                      shiftStatus: "on_duty",
                      assignedTableIds: [],
                      joinedDate: new Date().toISOString().split("T")[0],
                  }
                : null;
        },
        openEditStaff: (state, action: PayloadAction<Staff>) => {
            state.isAddEditOpen = true;
            state.editingStaff = action.payload;
        },
        closeAddEditStaff: state => {
            state.isAddEditOpen = false;
            state.editingStaff = null;
        },
        openAssignTables: (state, action: PayloadAction<Staff>) => {
            state.isAssignTablesOpen = true;
            state.assigningWaiter = action.payload;
        },
        closeAssignTables: state => {
            state.isAssignTablesOpen = false;
            state.assigningWaiter = null;
        },
    },
    extraReducers: builder => {
        builder.addMatcher(
            authApi.endpoints.login.matchFulfilled,
            (state, action) => {
                state.session = action.payload.context;
                state.accessToken = action.payload.token;
                state.tokenExpires = action.payload.tokenExpires;
            },
        );
        builder.addMatcher(
            authApi.endpoints.pinLogin.matchFulfilled,
            (state, action) => {
                state.session = action.payload.context;
                state.accessToken = action.payload.token;
                state.tokenExpires = action.payload.tokenExpires;
            },
        );
        builder.addMatcher(
            authApi.endpoints.refresh.matchFulfilled,
            (state, action) => {
                state.accessToken = action.payload.token;
                state.tokenExpires = action.payload.tokenExpires;
            },
        );
        builder.addMatcher(
            authApi.endpoints.me.matchFulfilled,
            (state, action) => {
                state.session = action.payload.context;
            },
        );
        builder.addMatcher(authApi.endpoints.logout.matchFulfilled, state => {
            state.session = null;
            state.accessToken = null;
            state.tokenExpires = null;
        });
        builder.addMatcher(
            shiftsApi.endpoints.currentShift.matchFulfilled,
            (state, action) => {
                state.session = applyShiftToSession(
                    state.session,
                    action.payload,
                );
            },
        );
        builder.addMatcher(
            shiftsApi.endpoints.clockIn.matchFulfilled,
            (state, action) => {
                state.session = applyShiftToSession(
                    state.session,
                    action.payload,
                );
            },
        );
        builder.addMatcher(
            shiftsApi.endpoints.clockOut.matchFulfilled,
            (state, action) => {
                state.session = applyShiftToSession(
                    state.session,
                    action.payload,
                );
            },
        );
    },
});

export const {
    setSession,
    setAccessToken,
    clearSession,
    markHydrated,
    hydrateStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    toggleStaffActive,
    setStaffShiftStatus,
    assignTablesToWaiter,
    openAddStaff,
    openEditStaff,
    closeAddEditStaff,
    openAssignTables,
    closeAssignTables,
} = identitySlice.actions;

export default identitySlice.reducer;
export { STAFF_LIST_STORAGE_KEY };
