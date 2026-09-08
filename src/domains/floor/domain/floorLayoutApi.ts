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
    version: number;
};

export type AdminTableLocation = {
    id: string;
    name: string;
    code: string;
    sortOrder: number;
    status: string;
    tables: AdminDiningTable[];
};

export type AdminFloorLayoutResponse = {
    data: AdminTableLocation[];
    waiters: AdminWaiterOption[];
};
