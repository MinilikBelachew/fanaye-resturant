"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/context/hooks";
import {
    homePathForRole,
    roleAllowsPath,
} from "@/domains/identity/application/homePath";
import ResponsiveDeskShell from "@/components/layout/ResponsiveDeskShell";
import WaiterShell from "@/components/layout/WaiterShell";
import { SidebarUiProvider } from "@/components/layout/SidebarUi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
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
        ) : (
            <ResponsiveDeskShell role={staff.role}>
                {children}
            </ResponsiveDeskShell>
        );

    return <SidebarUiProvider>{content}</SidebarUiProvider>;
}
