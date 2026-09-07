import { homePathForRole } from "@/domains/identity/application/homePath";
import type { StationRole } from "@/domains/identity/domain/role";
import { redirect } from "@/i18n/navigation";

const TABS = ["new", "preparing", "ready", "exceptions"] as const;

export function redirectStationTab(
    role: StationRole,
    tab: string,
    locale: string,
) {
    const home = homePathForRole(role);
    const href = (TABS as readonly string[]).includes(tab)
        ? `${home}?status=${tab}`
        : home;
    return redirect({ href, locale });
}
