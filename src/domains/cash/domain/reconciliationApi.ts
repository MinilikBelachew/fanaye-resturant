export type ReconciliationPreview = {
    cashierFinancialSessionId: string;
    openingFloat: string;
    cashDropsReceived: string;
    otherInflows: string;
    otherOutflows: string;
    expectedCash: string;
    currencyCode: string;
    existingReconciliationId?: string | null;
    existingStatus?: string | null;
    existingCountedCash?: string | null;
    existingVariance?: string | null;
    existingExpectedCash?: string | null;
    sessionStatus?: string | null;
    needsResubmit?: boolean;
    // Bills breakdown
    billsCount?: number;
    billsTotalCash?: string;
    billsTotalDigital?: string;
    billsGrandTotal?: string;
    digitalVerified?: string;
    digitalPending?: string;
};

export type Reconciliation = {
    reconciliationId: string;
    cashierFinancialSessionId: string;
    expectedCash: string;
    countedCash: string;
    variance: string;
    currencyCode: string;
    status: string;
    cashierComment: string | null;
    submittedAt: string;
    review: {
        reviewedAt: string | null;
        reviewComment: string | null;
        reviewedByMembershipId: string | null;
    } | null;
    version: number;
    cashierName?: string;
    businessDate?: string;
};
