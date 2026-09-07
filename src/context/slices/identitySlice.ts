import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Staff } from "@/domains/identity/domain/staff";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";

const STAFF_KEY = "fanaye.demo.staffId";
const STAFF_LIST_STORAGE_KEY = "fanaye.demo.staffList.v1";

interface IdentityState {
    staffId: string | null;
    staffMembers: Staff[];
    hydrated: boolean;
    isAddEditOpen: boolean;
    editingStaff: Staff | null;
    isAssignTablesOpen: boolean;
    assigningWaiter: Staff | null;
}

const initialState: IdentityState = {
    staffId: null,
    staffMembers: DEMO_STAFF,
    hydrated: false,
    isAddEditOpen: false,
    editingStaff: null,
    isAssignTablesOpen: false,
    assigningWaiter: null,
};

export const identitySlice = createSlice({
    name: "identity",
    initialState,
    reducers: {
        hydrateIdentity: (state, action: PayloadAction<string | null>) => {
            const staffId = action.payload;
            const exists = state.staffMembers.some(person => person.id === staffId);
            state.staffId = exists ? staffId : (state.staffMembers[4]?.id ?? null);
            state.hydrated = true;
        },
        hydrateStaff: (state, action: PayloadAction<Staff[] | null>) => {
            if (action.payload && Array.isArray(action.payload) && action.payload.length > 0) {
                state.staffMembers = action.payload;
            }
        },
        switchDemoStaff: (state, action: PayloadAction<string>) => {
            state.staffId = action.payload;
            if (typeof window !== "undefined") {
                localStorage.setItem(STAFF_KEY, action.payload);
            }
        },
        signOutDemo: state => {
            state.staffId = null;
            if (typeof window !== "undefined") {
                localStorage.removeItem(STAFF_KEY);
            }
        },
        // Staff Registration & Management
        addStaff: (state, action: PayloadAction<Staff>) => {
            state.staffMembers.push(action.payload);
            state.isAddEditOpen = false;
            state.editingStaff = null;
        },
        updateStaff: (state, action: PayloadAction<Staff>) => {
            const index = state.staffMembers.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.staffMembers[index] = action.payload;
            }
            state.isAddEditOpen = false;
            state.editingStaff = null;
        },
        deleteStaff: (state, action: PayloadAction<string>) => {
            state.staffMembers = state.staffMembers.filter(s => s.id !== action.payload);
            if (state.staffId === action.payload) {
                state.staffId = state.staffMembers[0]?.id ?? null;
            }
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
            const staff = state.staffMembers.find(s => s.id === action.payload.staffId);
            if (staff) {
                staff.shiftStatus = action.payload.status;
            }
        },
        assignTablesToWaiter: (
            state,
            action: PayloadAction<{ waiterId: string; tableIds: string[] }>,
        ) => {
            const waiter = state.staffMembers.find(s => s.id === action.payload.waiterId);
            if (waiter) {
                waiter.assignedTableIds = action.payload.tableIds;
            }
            state.isAssignTablesOpen = false;
            state.assigningWaiter = null;
        },
        openAddStaff: (state, action: PayloadAction<Staff["role"] | undefined>) => {
            state.isAddEditOpen = true;
            state.editingStaff = action.payload ? {
                id: `staff-${Date.now().toString(36)}`,
                name: "",
                role: action.payload,
                pinHint: "1234",
                phone: "",
                active: true,
                shiftStatus: "on_duty",
                assignedTableIds: [],
                joinedDate: new Date().toISOString().split("T")[0],
            } : null;
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
});

export const {
    hydrateIdentity,
    hydrateStaff,
    switchDemoStaff,
    signOutDemo,
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
export { STAFF_KEY, STAFF_LIST_STORAGE_KEY };
