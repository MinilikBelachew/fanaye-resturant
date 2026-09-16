import {
    STATION_IDS,
    type StationId,
} from "@/domains/fulfillment/domain/station";

export const ROLES = [
    "super_admin",
    "owner",
    "manager",
    "cashier",
    "waiter",
    "kitchen",
    "barista",
    "cakes",
    "soft_drinks",
] as const;

export type StandardRole = (typeof ROLES)[number];
export type Role = StandardRole | string;

export const STATION_ROLES = [
    "kitchen",
    "barista",
    "cakes",
    "soft_drinks",
] as const;

export type StationRole = (typeof STATION_ROLES)[number] | string;

export const ROLE_LABELS: Record<string, string> = {
    super_admin: "Platform Super Admin",
    owner: "Owner / Tenant Admin",
    manager: "Manager",
    cashier: "Cashier",
    waiter: "Waiter",
    kitchen: "Kitchen",
    barista: "Barista",
    cakes: "Cakes",
    soft_drinks: "Soft Drinks",
};

export function isStationRole(role: string): boolean {
    return (
        (STATION_ROLES as readonly string[]).includes(role) ||
        role.startsWith("station:") ||
        role.toLowerCase().startsWith("station")
    );
}

export function stationIdForRole(role: string): StationId {
    if (role.startsWith("station:")) {
        return role.replace("station:", "");
    }
    const map: Record<string, StationId> = {
        kitchen: STATION_IDS.kitchen,
        barista: STATION_IDS.barista,
        cakes: STATION_IDS.cakes,
        soft_drinks: STATION_IDS.soft_drinks,
    };
    return map[role] || role;
}
