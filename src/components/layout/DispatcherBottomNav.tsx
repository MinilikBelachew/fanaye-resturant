"use client";

import { Clock3, Phone, UserRound, Wallet } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
    { href: "/dispatcher", label: "Calls", icon: Phone, exact: true },
    { href: "/dispatcher/cash", label: "Cash", icon: Wallet },
    { href: "/dispatcher/shift", label: "Shift", icon: Clock3 },
    { href: "/dispatcher/profile", label: "Profile", icon: UserRound },
] as const;

export default function DispatcherBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="border-t border-hairline bg-card/95 backdrop-blur">
            <ul className="mx-auto grid max-w-lg grid-cols-4">
                {ITEMS.map(item => {
                    const Icon = item.icon;
                    const active =
                        "exact" in item && item.exact
                            ? pathname === item.href ||
                              pathname.startsWith("/dispatcher/calls")
                            : pathname.startsWith(item.href);
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center gap-1 py-3 text-[12px] font-medium transition-colors",
                                    active ? "text-brand" : "text-slate-gray",
                                )}
                            >
                                <Icon className="size-5" />
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
