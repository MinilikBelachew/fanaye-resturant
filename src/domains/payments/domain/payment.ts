export type PaymentMethod = "cash" | "bank" | "telebirr";

export type PaymentStatus =
    | "logged"
    | "pending_cashier"
    | "confirmed"
    | "rejected";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    cash: "Cash",
    bank: "Bank transfer",
    telebirr: "Telebirr",
};

export interface Payment {
    id: string;
    sessionId: string;
    tableId: string;
    tableNumber: string;
    waiterId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    evidenceDataUrl: string | null;
    createdAt: string;
    confirmedAt: string | null;
    confirmedBy: string | null;
    rejectReason: string | null;
}

export function isDigitalMethod(method: PaymentMethod): boolean {
    return method === "bank" || method === "telebirr";
}

export function isLoggedPayment(status: PaymentStatus): boolean {
    return (
        status === "logged" ||
        status === "confirmed" ||
        status === "pending_cashier"
    );
}
