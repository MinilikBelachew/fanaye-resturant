export type BillStatus =
    | "not_requested"
    | "requested"
    | "generated"
    | "payment_pending"
    | "paid"
    | "closed";

export interface Bill {
    id: string;
    sessionId: string;
    status: BillStatus;
    total: number;
    generatedAt: string | null;
}
