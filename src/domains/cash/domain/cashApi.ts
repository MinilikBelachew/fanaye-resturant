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
