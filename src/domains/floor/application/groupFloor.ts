import type { FloorLocation, FloorTable } from "@/domains/floor/domain/floorApi";

export function tableNumber(table: FloorTable) {
    return table.displayNumber ?? table.displayName.replace(/^Table\s+/i, "");
}

export function groupFloorTables(
    tables: FloorTable[],
    locations: FloorLocation[],
) {
    const known = locations
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(location => ({
            location,
            tables: tables.filter(table => table.locationId === location.id),
        }))
        .filter(group => group.tables.length > 0);

    const leftover = tables.filter(
        table => !locations.some(location => location.id === table.locationId),
    );
    if (leftover.length === 0) return known;

    return [
        ...known,
        {
            location: {
                id: "other",
                code: "OTHER",
                name: "Other",
                sortOrder: 999,
            },
            tables: leftover,
        },
    ];
}
