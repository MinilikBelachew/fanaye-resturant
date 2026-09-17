"use client";

import { type ReactNode } from "react";
import AccountMenu from "@/components/layout/AccountMenu";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import AppTopBar from "@/components/layout/AppTopBar";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import StationKdsNav from "@/components/layout/StationKdsNav";
import StationTopBarTools from "@/components/layout/StationTopBarTools";
import OpsNotificationsBell from "@/domains/notifications/ui/OpsNotificationsBell";
import { navForRole } from "@/domains/identity/application/nav";
import { homePathForRole } from "@/domains/identity/application/homePath";
import {
    isStationRole,
    ROLE_LABELS,
    type Role,
} from "@/domains/identity/domain/role";
import RoleSwitcher from "@/domains/identity/ui/RoleSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import LocaleSwitcher from "@/components/theme/LocaleSwitcher";

function CompactNav({ role }: { role: Role }) {
    const pathname = usePathname();
    const home = homePathForRole(role);
    const items = navForRole(role).flatMap(section => section.items);

    return (
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {items.map(item => {
                const pathOnly = item.href.split("?")[0];
                const active =
                    pathname === pathOnly ||
                    (pathOnly !== home && pathname.startsWith(`${pathOnly}/`));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex shrink-0 items-center gap-2 rounded-[12px] border px-3 py-2 text-[13px] font-medium",
                            active
                                ? "border-transparent bg-accent text-accent-foreground"
                                : "border-hairline bg-card text-slate-gray",
                        )}
                    >
                        <item.icon className="size-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}

export default function ResponsiveDeskShell({
    role,
    children,
}: {
    role: Role;
    children: ReactNode;
}) {
    const station = isStationRole(role);

    return (
        <div className="flex h-svh overflow-hidden bg-white dark:bg-background">
            <DesktopSidebar className="hidden xl:flex" />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-background xl:border-l xl:border-hairline">
                <header className="shrink-0 border-b border-black/[0.08] bg-white dark:border-white/[0.1] dark:bg-card xl:hidden">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-2 md:px-6">
                        <div className="flex h-10 items-center gap-3">
                            <div className="min-w-0">
                                <h1 className="truncate text-[15px] font-medium tracking-tight">
                                    {ROLE_LABELS[role]}
                                </h1>
                            </div>
                            <div className="ml-auto flex shrink-0 items-center gap-1">
                                {station ? (
                                    <StationTopBarTools search={false} />
                                ) : null}
                                <OpsNotificationsBell />
                                <LocaleSwitcher />
                                <ThemeToggleButton />
                                <AccountMenu compact />
                            </div>
                        </div>
                        {station ? <StationTopBarTools notify={false} /> : null}
                        <div className="pb-1">
                            <RoleSwitcher />
                        </div>
                        {station ? (
                            <StationKdsNav role={role} />
                        ) : (
                            <CompactNav role={role} />
                        )}
                    </div>
                </header>
                <AppTopBar className="hidden bg-white dark:bg-background xl:flex" />
                <main className="app-scroll mx-auto w-full max-w-6xl flex-1 bg-white p-4 md:p-6 dark:bg-background xl:max-w-none xl:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
