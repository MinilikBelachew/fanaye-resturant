export type FloorLocation = {
    id: string;
    code: string;
    name: string;
    sortOrder: number;
};

export type FloorTable = {
    tableId: string;
    displayName: string;
    displayNumber: string | null;
    locationId: string;
    locationName: string;
    locationCode: string;
    tableStatus: string;
    tableSessionId: string | null;
    sessionStatus: string | null;
    visitStartedAt: string | null;
    guestCount: number | null;
    primaryWaiterMembershipId: string | null;
    waiterName: string | null;
    assignedWaiterMembershipId: string | null;
    assignedWaiterName: string | null;
    mine: boolean;
    readyItemCount: number;
    cookingItemCount: number;
    delayedItemCount: number;
    version: number;
};

export type FloorTablesResponse = {
    locations: FloorLocation[];
    data: FloorTable[];
};

export type TableSessionResponse = {
    tableSessionId: string;
    tableId: string;
    displayName: string;
    displayNumber: string | null;
    locationName: string;
    status: string;
    primaryWaiterMembershipId: string;
    waiterName: string;
    guestCount: number | null;
    openedAt: string;
    closedAt: string | null;
    businessDate: string;
    version: number;
    mine: boolean;
};

export type WaiterTableView = "my" | "available" | "attention" | "all";
