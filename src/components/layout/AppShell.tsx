"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/context/hooks";
import { homePathForRole, roleAllowsPath } from "@/domains/identity/application/homePath";
import { isStationRole } from "@/domains/identity/domain/role";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import AppTopBar from "@/components/layout/AppTopBar";
import ResponsiveDeskShell from "@/components/layout/ResponsiveDeskShell";
import WaiterShell from "@/components/layout/WaiterShell";
import { SidebarUiProvider } from "@/components/layout/SidebarUi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const hydrated = useAppSelector(state => state.identity.hydrated);
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
        }
    }, [hydrated, staff, pathname, router]);

    if (!staff) return null;

    const content =
        staff.role === "waiter" ? (
            <WaiterShell>{children}</WaiterShell>
        ) : staff.role === "cashier" || isStationRole(staff.role) ? (
            <ResponsiveDeskShell role={staff.role}>{children}</ResponsiveDeskShell>
        ) : (
            <div className="flex h-svh overflow-hidden bg-white dark:bg-background">
                <DesktopSidebar />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-background border-l border-hairline">
                    <AppTopBar className="bg-white dark:bg-background" />
                    <main className="app-scroll min-h-0 min-w-0 flex-1 bg-white p-6 dark:bg-background">
                        {children}
                    </main>
                </div>
            </div>
        );

    return <SidebarUiProvider>{content}</SidebarUiProvider>;
}
