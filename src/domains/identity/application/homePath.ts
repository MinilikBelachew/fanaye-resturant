import type { Role } from "../domain/role";

export function homePathForRole(role: Role): string {
    switch (role) {
        case "super_admin":
            return "/super-admin";
        case "owner":
            return "/owner";
        case "manager":
            return "/manager";
        case "cashier":
            return "/cashier";
        case "waiter":
            return "/waiter/tables";
        case "kitchen":
            return "/kitchen";
        case "barista":
            return "/barista";
        case "cakes":
            return "/cakes";
        case "soft_drinks":
            return "/soft-drinks";
        default:
            return "/sign-in";
    }
}

export function roleAllowsPath(role: Role, pathname: string): boolean {
    const rest = pathname.replace(/^\/(en|ru|uz)/, "") || "/";
    if (rest === "/" || rest === "") return true;
    if (
        rest.startsWith("/sign-in") ||
        rest.startsWith("/sign-up") ||
        rest.startsWith("/forgot-password") ||
        rest.startsWith("/r/")
    ) {
        return true;
    }
    if (role === "waiter") {
        return rest.startsWith("/waiter");
    }
    if (role === "super_admin") {
        return rest.startsWith("/super-admin");
    }
    const home = homePathForRole(role);
    return rest === home || rest.startsWith(`${home}/`);
}

export function stationOrderPath(role: Role, itemId: string): string {
    return `${homePathForRole(role)}/orders/${itemId}`;
}

/** Full inbox page for the signed-in role. */
export function notificationsPathForRole(role: Role): string {
    if (role === "waiter") return "/waiter/notifications";
    if (role === "super_admin") return "/super-admin";
    return `${homePathForRole(role)}/notifications`;
}
