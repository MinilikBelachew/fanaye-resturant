export type WaiterCashSummary = {
    shiftSessionId: string;
    currencyCode: string;
    cashCollected: string;
    cashDropped: string;
    undroppedCash: string;
    pendingCashDropAmount: string;
    disputedCashDropAmount: string;
};

export type CashDrop = {
    cashDropId: string;
    declaredAmount: string;
    currencyCode: string;
    status: string;
    initiatedAt: string;
    countedAmount: string | null;
    receivedAt: string | null;
    resolutionAmount: string | null;
    version: number;
    waiterName?: string;
    variance?: string | null;
    disputeId?: string | null;
    disputeStatus?: string | null;
};

export type WaiterCustodyItem = {
    membershipId: string;
    waiterName: string;
    photoUrl: string | null;
    branchId: string;
    branchName: string;
    shiftSessionId: string;
    clockInAt: string;
    cashCollected: string;
    cashDropped: string;
    pendingDropAmount: string;
    undroppedCash: string;
    riskLevel: "NORMAL" | "ELEVATED" | "CRITICAL";
};

export type CashierDrawerItem = {
    sessionId: string;
    cashierName: string;
    branchId: string;
    branchName: string;
    openedAt: string;
    openingFloat: string;
    dropsReceived: string;
    directCashSales: string;
    expectedDrawerCash: string;
};

export type CashDropOverviewItem = {
    id: string;
    branchId: string;
    branchName: string;
    waiterName: string;
    cashierName: string | null;
    declaredAmount: string;
    countedAmount: string | null;
    variance: string | null;
    status: string;
    initiatedAt: string;
    receivedAt: string | null;
    disputeId: string | null;
    disputeStatus: string | null;
    disputeReason: string | null;
};

export type CashCustodySummary = {
    totalWaiterUndropped: string;
    totalCashierDrawer: string;
    totalDroppedToday: string;
    activeDisputesCount: number;
    activeWaitersCount: number;
    activeCashiersCount: number;
};

export type BranchOption = {
    id: string;
    name: string;
    displayCode: string | null;
};

export type CashCustodyOverviewResponse = {
    summary: CashCustodySummary;
    waiters: WaiterCustodyItem[];
    cashiers: CashierDrawerItem[];
    recentDrops: CashDropOverviewItem[];
    branches: BranchOption[];
    currentBranchId: string | null;
    isOwner: boolean;
};
