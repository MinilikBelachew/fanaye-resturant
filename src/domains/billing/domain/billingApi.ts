export type BillLine = {
    billLineId: string;
    orderItemId: string | null;
    itemName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    chargeStatus: string;
};

export type Bill = {
    billId: string;
    tableSessionId: string;
    billNumber: string;
    status: string;
    currencyCode: string;
    subtotal: string;
    total: string;
    amountPaid: string;
    generatedAt: string;
    paidAt: string | null;
    version: number;
    lines: BillLine[];
};

export type BillRequestSummary = {
    billRequestId: string;
    status: string;
    requestedAt: string;
};

export type PaymentSummary = {
    paymentId: string;
    method: string;
    status: string;
    amount: string;
    currencyCode: string;
    transferChannel: string | null;
    collectorMembershipId: string;
    collectedAt: string | null;
    verifiedAt: string | null;
    settledAt: string | null;
};

export type SessionBillResponse = {
    bill: Bill | null;
    billRequest: BillRequestSummary | null;
    tableSession: {
        tableSessionId: string;
        status: string;
        version: number;
    };
    payments: PaymentSummary[];
};

export type BillRequestCreated = {
    billRequestId: string;
    status: string;
    requestedAt: string;
    tableSession: { status: string; version: number };
};

export type CashierBillRequest = {
    billRequestId: string;
    tableSessionId: string;
    tableDisplayName: string;
    waiter: { membershipId: string; displayName: string };
    requestedAt: string;
    requestAgeSeconds: number;
    estimatedAmount: string;
    currencyCode: string;
    expectedTableSessionVersion: number;
    warnings: string[];
};

export type CashierPaymentLogItem = PaymentSummary & {
    billId: string;
    billNumber: string;
    tableSessionId: string;
    tableDisplayName: string;
    waiterName: string;
    sessionStatus: string;
    tableClosed: boolean;
};
