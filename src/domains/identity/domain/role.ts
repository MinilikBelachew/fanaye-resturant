import {
    STATION_IDS,
    type StationId,
} from "@/domains/fulfillment/domain/station";

export const ROLES = [
    "super_admin",
    "owner",
    "manager",
    "store_manager",
    "cashier",
    "waiter",
    "dispatcher",
    "receptionist",
    "driver",
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

/** Roles that clock in/out for operational shifts (top-bar pill). */
export const SHIFT_CLOCK_ROLES = [
    "waiter",
    "cashier",
    "dispatcher",
    "manager",
    "kitchen",
    "barista",
    "cakes",
    "soft_drinks",
] as const;

/** Owner / store manager / super admin do not use shift clock-in. */
export function roleUsesShiftClock(role: string | null | undefined): boolean {
    if (!role) return false;
    return (SHIFT_CLOCK_ROLES as readonly string[]).includes(role);
}

export const ROLE_LABELS: Record<string, string> = {
    super_admin: "Platform Super Admin",
    owner: "Owner / Tenant Admin",
    manager: "Manager",
    store_manager: "Store manager",
    cashier: "Cashier",
    waiter: "Waiter",
    dispatcher: "Dispatcher",
    receptionist: "Receptionist",
    driver: "Driver / Transit",
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
