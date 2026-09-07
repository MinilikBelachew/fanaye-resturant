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

export type Role = (typeof ROLES)[number];

export const STATION_ROLES = [
    "kitchen",
    "barista",
    "cakes",
    "soft_drinks",
] as const;

export type StationRole = (typeof STATION_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
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

export function isStationRole(role: Role): role is StationRole {
    return (STATION_ROLES as readonly string[]).includes(role);
}

export function stationIdForRole(role: StationRole): StationId {
    const map: Record<StationRole, StationId> = {
        kitchen: STATION_IDS.kitchen,
        barista: STATION_IDS.barista,
        cakes: STATION_IDS.cakes,
        soft_drinks: STATION_IDS.soft_drinks,
    };
    return map[role];
}
