"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import AccountMenu from "@/components/layout/AccountMenu";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import AppTopBar from "@/components/layout/AppTopBar";
import WaiterBottomNav from "@/components/layout/WaiterBottomNav";
import WaiterNavPanel from "@/components/layout/WaiterNavPanel";
import { useSidebarUi } from "@/components/layout/SidebarUi";
import OpsNotificationsBell from "@/domains/notifications/ui/OpsNotificationsBell";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { usePathname } from "@/i18n/navigation";

export default function WaiterShell({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const { collapsed } = useSidebarUi();
    const staff = useAppSelector(selectCurrentStaff);

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    const title = pathname.startsWith("/waiter/ready")
        ? "Ready"
        : pathname.startsWith("/waiter/notifications")
          ? "Notifications"
          : pathname.startsWith("/waiter/shift")
            ? "Shift"
            : pathname.startsWith("/waiter/profile")
              ? "Profile"
              : pathname.startsWith("/waiter/tables/")
                ? "Table"
                : "Tables";

    return (
        <div className="flex h-svh overflow-hidden bg-white dark:bg-background">
            <aside
                className={
                    collapsed
                        ? "hidden h-svh w-16 shrink-0 border-r border-hairline bg-white dark:bg-card lg:flex"
                        : "hidden h-svh w-[280px] shrink-0 p-3 bg-white dark:bg-background lg:flex"
                }
            >
                <WaiterNavPanel collapsed={collapsed} />
            </aside>

            {open ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpen(false)}
                    />
                    <aside className="absolute top-0 left-0 h-full w-[min(86vw,320px)] p-3 bg-white dark:bg-background">
                        <WaiterNavPanel onNavigate={() => setOpen(false)} />
                    </aside>
                </div>
            ) : null}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-background lg:border-l lg:border-hairline">
                <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-black/[0.08] bg-white px-4 dark:border-white/[0.1] dark:bg-background lg:hidden">
                    <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-md hover:bg-secondary"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                    >
                        {open ? (
                            <X className="size-4" />
                        ) : (
                            <Menu className="size-4" />
                        )}
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium tracking-tight">
                            {title}
                        </p>
                        {staff ? (
                            <p className="truncate text-[11px] text-slate-gray">
                                {staff.name}
                            </p>
                        ) : null}
                    </div>
                    <OpsNotificationsBell />
                    <ThemeToggleButton />
                    <AccountMenu compact />
                </header>

                <AppTopBar className="hidden bg-white dark:bg-background lg:flex" />

                <main className="app-scroll mx-auto w-full max-w-6xl flex-1 bg-white p-4 md:p-6 md:pb-8 dark:bg-background lg:p-8">
                    {children}
                </main>

                <div className="shrink-0 md:hidden">
                    <WaiterBottomNav />
                </div>
            </div>
        </div>
    );
}
