"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/context/hooks";
import {
    homePathForRole,
    roleAllowsPath,
} from "@/domains/identity/application/homePath";
import DispatcherShell from "@/components/layout/DispatcherShell";
import ResponsiveDeskShell from "@/components/layout/ResponsiveDeskShell";
import WaiterShell from "@/components/layout/WaiterShell";
import { SidebarUiProvider } from "@/components/layout/SidebarUi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { usePathname, useRouter } from "@/i18n/navigation";

const BAKERY_REDIRECT: Record<string, string> = {
    "/manager/tables": "/manager/menu",
    "/manager/waiters": "/manager/menu",
    "/manager/stations": "/manager/menu",
    "/manager/live": "/manager/menu",
    "/cashier/bills": "/cashier/sale",
    "/cashier/notifications": "/cashier",
    "/cashier/cash-drops": "/cashier",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
    const staff = useAppSelector(selectCurrentStaff);
    const hydrated = useAppSelector(state => state.identity.hydrated);
    const serviceMode = useAppSelector(
        state => state.identity.session?.serviceMode,
    );
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!hydrated) return;
        if (!staff) {
            router.replace("/sign-in");
            return;
        }
        const home = homePathForRole(staff.role);
        if (!roleAllowsPath(staff.role, pathname)) {
            router.replace(home);
            return;
        }
        if (serviceMode === "BAKERY") {
            const rest = pathname.replace(/^\/(en|am|ru|uz)/, "") || "/";
            for (const [from, to] of Object.entries(BAKERY_REDIRECT)) {
                if (rest === from || rest.startsWith(`${from}/`)) {
                    router.replace(to);
                    return;
                }
            }
        }
    }, [hydrated, staff, pathname, router, serviceMode]);

    if (!staff) return null;

    const content =
        staff.role === "waiter" ? (
            <WaiterShell>{children}</WaiterShell>
        ) : staff.role === "dispatcher" ? (
            <DispatcherShell>{children}</DispatcherShell>
        ) : (
            <ResponsiveDeskShell role={staff.role}>
                {children}
            </ResponsiveDeskShell>
        );

    return <SidebarUiProvider>{content}</SidebarUiProvider>;
}
