import type { Role } from "../domain/role";
import type { AuthContext } from "../domain/authContext";
import type { Staff } from "../domain/staff";
import { DEMO_STAFF } from "../infrastructure/demoStaff";

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
    const demo = DEMO_STAFF.find(
        person =>
            person.email &&
            context.email &&
            person.email.toLowerCase() === context.email.toLowerCase(),
    );

    return {
        id: demo?.id ?? context.staffMembershipId ?? context.userId,
        name: context.displayName,
        role,
        pinHint: "",
        phone: context.phone ?? demo?.phone,
        email: context.email ?? demo?.email,
        stationId: context.stationId ?? demo?.stationId,
        stationRole: role === "kitchen" || role === "barista" || role === "cakes" || role === "soft_drinks"
            ? role
            : undefined,
        active: true,
        assignedTableIds: demo?.assignedTableIds ?? [],
        shiftStatus: context.shiftSessionId ? "on_duty" : "off_duty",
        shiftSchedule: demo?.shiftSchedule,
        shiftHours: demo?.shiftHours,
        workingDays: demo?.workingDays,
        joinedDate: demo?.joinedDate,
    };
}
