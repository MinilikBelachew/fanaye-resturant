export type TableStatus =
    | "available"
    | "occupied"
    | "active_order"
    | "bill_requested"
    | "payment_pending"
    | "paid"
    | "closed";

export interface TableLocation {
    id: string;
    code: "GROUND" | "TOP_FLOOR" | "OUTSIDE";
    name: string;
    sortOrder: number;
}

export const TABLE_LOCATIONS: TableLocation[] = [
    { id: "loc-ground", code: "GROUND", name: "Ground Floor", sortOrder: 0 },
    { id: "loc-top", code: "TOP_FLOOR", name: "Top Floor", sortOrder: 1 },
    { id: "loc-outside", code: "OUTSIDE", name: "Outside", sortOrder: 2 },
];

export interface DiningTable {
    id: string;
    number: string;
    seats: number;
    locationId: string;
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

const LOCATION_TABLE_COUNTS: Array<{ locationId: string; count: number }> = [
    { locationId: "loc-ground", count: 6 },
    { locationId: "loc-top", count: 6 },
    { locationId: "loc-outside", count: 4 },
];

export function createFloorTables(): DiningTable[] {
    const tables: DiningTable[] = [];
    let number = 1;

    for (const group of LOCATION_TABLE_COUNTS) {
        for (let index = 0; index < group.count; index += 1) {
            const label = String(number);
            tables.push({
                id: `table-${label}`,
                number: label,
                seats: label === "12" ? 4 : 2 + ((number - 1) % 4),
                locationId: group.locationId,
                status: "available",
                currentSessionId: null,
            });
            number += 1;
        }
    }

    return tables;
}

export function locationForTable(table: Pick<DiningTable, "locationId">) {
    return (
        TABLE_LOCATIONS.find(location => location.id === table.locationId) ??
        TABLE_LOCATIONS[0]
    );
}

export function groupTablesByLocation(tables: DiningTable[]) {
    return TABLE_LOCATIONS.map(location => ({
        location,
        tables: tables.filter(table => table.locationId === location.id),
    })).filter(group => group.tables.length > 0);
}

export function withTableLocations(tables: DiningTable[]): DiningTable[] {
    const catalog = createFloorTables();
    return tables.map(table => {
        const fresh = catalog.find(entry => entry.id === table.id);
        return {
            ...table,
            locationId:
                table.locationId ??
                fresh?.locationId ??
                TABLE_LOCATIONS[0].id,
        };
    });
}
