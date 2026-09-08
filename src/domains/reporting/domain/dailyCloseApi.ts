export type DailyCloseBlocker = {
    code: string;
    message: string;
    entityId?: string | null;
};

export type DailyCloseSummary = {
    grossOrderValue: string;
    cancelledValue: string;
    netBilledSales: string;
    cashSales: string;
    verifiedTransferSales: string;
    pendingTransferAmount: string;
    suspiciousTransferAmount: string;
    cashierExpectedCash: string;
    cashierCountedCash: string;
    cashierVariance: string;
    undroppedWaiterCash: string;
};

export type DailyCloseWaiterLine = {
    waiterMembershipId: string;
    waiterName: string;
    shiftSessionId: string;
    ordersCreatedCount: number;
    tablesServedCount: number;
    netAttributedSales: string;
    cashCollected: string;
    cashDropped: string;
    undroppedCash: string;
    verifiedTransferAmount: string;
};

export type DailyCloseStationLine = {
    stationId: string;
    stationName: string;
    itemsHandledCount: number;
    delayedItemCount: number;
    cannotPrepareCount: number;
};

export type DailyClosePreview = {
    businessDate: string;
    currencyCode: string;
    readiness: {
        ready: boolean;
        blockers: DailyCloseBlocker[];
    };
    summary: DailyCloseSummary;
    waiters: DailyCloseWaiterLine[];
    stations: DailyCloseStationLine[];
    existingDailyCloseId?: string | null;
    existingStatus?: string | null;
    existingVersion?: number | null;
};

export type DailyClose = {
    dailyCloseId: string;
    businessDate: string;
    status: string;
    currencyCode: string;
    summary: DailyCloseSummary;
    waiters: DailyCloseWaiterLine[];
    stations: DailyCloseStationLine[];
    readiness: {
        ready: boolean;
        blockers: DailyCloseBlocker[];
    };
    approvedAt: string | null;
    lockedAt: string | null;
    version: number;
};
