"use client";

import type { ReactNode } from "react";
import { Truck } from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import AccountMenu from "@/components/layout/AccountMenu";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";

export default function DriverShell({ children }: { children: ReactNode }) {
    const staff = useAppSelector(selectCurrentStaff);

    return (
        <div className="flex h-svh flex-col overflow-hidden bg-slate-50 dark:bg-background">
            {/* Minimal Mobile-First Header */}
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-card/90">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Truck className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[14px] font-bold tracking-tight text-foreground">
                                Driver Portal
                            </span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                Transit
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-gray line-clamp-1">
                            {staff?.name || "Driver"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggleButton />
                    <AccountMenu />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="app-scroll flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-2xl p-4 pb-12 sm:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
