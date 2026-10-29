export type AdminWaiterOption = {
    id: string;
    name: string;
};

export type AdminDiningTable = {
    id: string;
    locationId: string;
    locationName: string;
    displayName: string;
    displayNumber: string | null;
    status: string;
    sortOrder: number;
    assignedWaiterMembershipId: string | null;
    assignedWaiterName: string | null;
    isVip: boolean;
    effectiveVip: boolean;
    version: number;
};

export type AdminTableLocation = {
    id: string;
    name: string;
    code: string;
    sortOrder: number;
    status: string;
    isVip: boolean;
    tables: AdminDiningTable[];
};

export type AdminFloorLayoutShift = {
    id: string;
    name: string;
    startLocalTime: string;
    endLocalTime: string;
};

export type AdminFloorLayoutResponse = {
    data: AdminTableLocation[];
    waiters: AdminWaiterOption[];
    shifts?: AdminFloorLayoutShift[];
    activeShiftId?: string | null;
    selectedShiftId?: string | null;
};
