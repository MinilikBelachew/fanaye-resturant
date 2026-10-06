"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, Phone, X } from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import AccountMenu from "@/components/layout/AccountMenu";
import AppTopBar from "@/components/layout/AppTopBar";
import DispatcherBottomNav from "@/components/layout/DispatcherBottomNav";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import OpsNotificationsBell from "@/domains/notifications/ui/OpsNotificationsBell";
import { navForRole } from "@/domains/identity/application/nav";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function titleForPath(pathname: string) {
    if (pathname.startsWith("/dispatcher/calls")) return "Call order";
    if (pathname.startsWith("/dispatcher/cash")) return "Cash";
    if (pathname.startsWith("/dispatcher/shift")) return "Shift";
    if (pathname.startsWith("/dispatcher/profile")) return "Profile";
    if (pathname.startsWith("/dispatcher/notifications"))
        return "Notifications";
    return "Call pickup";
}

export default function DispatcherShell({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const staff = useAppSelector(selectCurrentStaff);
    const sections = navForRole("dispatcher");

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-svh overflow-hidden bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(16,185,129,0.12),transparent),radial-gradient(900px_500px_at_90%_0%,rgba(14,165,233,0.10),transparent)] dark:bg-background">
            <aside className="hidden h-svh w-[260px] shrink-0 border-r border-hairline bg-card/80 p-4 backdrop-blur lg:flex lg:flex-col">
                <div className="mb-6 flex items-center gap-3 px-1">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <Phone className="size-5" />
                    </span>
                    <div>
                        <p className="text-[15px] font-semibold tracking-tight">
                            Call pickup
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            {staff?.name ?? "Dispatcher"}
                        </p>
                    </div>
                </div>
                <nav className="space-y-5">
                    {sections.map(section => (
                        <div key={section.title}>
                            <p className="mb-2 px-2 text-[11px] font-semibold tracking-[0.08em] text-slate-gray uppercase">
                                {section.title}
                            </p>
                            <ul className="space-y-1">
                                {section.items.map(item => {
                                    const Icon = item.icon;
                                    const active =
                                        pathname === item.href ||
                                        (item.href !== "/dispatcher" &&
                                            pathname.startsWith(item.href)) ||
                                        (item.href === "/dispatcher" &&
                                            (pathname === "/dispatcher" ||
                                                pathname.startsWith(
                                                    "/dispatcher/calls",
                                                )));
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                                                    active
                                                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                                                        : "text-slate-gray hover:bg-secondary hover:text-foreground",
                                                )}
                                            >
                                                <Icon className="size-4" />
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {open ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpen(false)}
                    />
                    <aside className="absolute top-0 left-0 h-full w-[min(86vw,300px)] border-r border-hairline bg-card p-4">
                        <div className="mb-5 flex items-center justify-between">
                            <p className="text-[15px] font-semibold">
                                Call pickup
                            </p>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-md p-1.5 hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <nav className="space-y-1">
                            {sections
                                .flatMap(s => s.items)
                                .map(item => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium text-foreground hover:bg-secondary"
                                        >
                                            <Icon className="size-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                        </nav>
                    </aside>
                </div>
            ) : null}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-hairline bg-card/90 px-4 backdrop-blur lg:hidden">
                    <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-md hover:bg-secondary"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="size-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium tracking-tight">
                            {titleForPath(pathname)}
                        </p>
                    </div>
                    <OpsNotificationsBell />
                    <ThemeToggleButton />
                    <AccountMenu compact />
                </header>

                <AppTopBar className="hidden bg-transparent lg:flex" />

                <main className="app-scroll mx-auto w-full max-w-5xl flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>

                <div className="shrink-0 lg:hidden">
                    <DispatcherBottomNav />
                </div>
            </div>
        </div>
    );
}
