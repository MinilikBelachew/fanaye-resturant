import type { Role } from "../domain/role";
import type { AuthContext } from "../domain/authContext";
import type { Staff } from "../domain/staff";

const STATION_CODE_TO_ROLE: Record<string, Role> = {
    KITCHEN: "kitchen",
    BARISTA: "barista",
    CAKES: "cakes",
    SOFT_DRINKS: "soft_drinks",
};

export function mapRoleCodeToRole(
    roleCode: string,
    stationCode?: string | null,
): Role {
    switch (roleCode) {
        case "PLATFORM_SUPER_ADMIN":
            return "super_admin";
        case "OWNER_ADMIN":
            return "owner";
        case "MANAGER":
            return "manager";
        case "CASHIER":
            return "cashier";
        case "WAITER":
            return "waiter";
        case "STATION_OPERATOR": {
            const mapped = stationCode
                ? STATION_CODE_TO_ROLE[stationCode.toUpperCase()]
                : undefined;
            return mapped ?? "kitchen";
        }
        default:
            return "waiter";
    }
}

export function mapAuthContextToStaff(context: AuthContext): Staff {
    const role = mapRoleCodeToRole(context.roleCode, context.stationCode);

    return {
        id: context.staffMembershipId ?? context.userId,
        name: context.displayName,
        role,
        pinHint: "",
        phone: context.phone ?? undefined,
        email: context.email ?? undefined,
        stationId: context.stationId ?? undefined,
        stationRole:
            role === "kitchen" ||
            role === "barista" ||
            role === "cakes" ||
            role === "soft_drinks"
                ? role
                : undefined,
        active: true,
        assignedTableIds: [],
        shiftStatus: context.shiftSessionId ? "on_duty" : "off_duty",
    };
}
