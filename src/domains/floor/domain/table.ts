export type TableStatus =
    | "available"
    | "occupied"
    | "active_order"
    | "bill_requested"
    | "payment_pending"
    | "paid"
    | "closed";

export interface DiningTable {
    id: string;
    number: string;
    seats: number;
    status: TableStatus;
    currentSessionId: string | null;
}

export type TableSessionStatus =
    | "open"
    | "active_order"
    | "bill_requested"
    | "payment_pending"
    | "paid"
    | "closed";

export interface TableSession {
    id: string;
    tableId: string;
    waiterId: string;
    guestCount: number;
    status: TableSessionStatus;
    openedAt: string;
    closedAt: string | null;
}

export function createFloorTables(): DiningTable[] {
    return Array.from({ length: 16 }, (_, index) => {
        const number = String(index + 1);
        return {
            id: `table-${number}`,
            number,
            seats: number === "12" ? 4 : 2 + (index % 4),
            status: "available" as const,
            currentSessionId: null,
        };
    });
}
