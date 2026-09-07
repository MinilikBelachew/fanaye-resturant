"use client";

import { Bell, Clock3, LayoutGrid, UserRound } from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import {
    selectCurrentStaff,
    selectUnreadReadyCount,
} from "@/domains/ordering/application/selectors";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function WaiterBottomNav() {
    const staff = useAppSelector(selectCurrentStaff);
    const pathname = usePathname();
    const unread = useAppSelector(state =>
        staff ? selectUnreadReadyCount(state, staff.id) : 0,
    );

    const items = [
        { href: "/waiter/tables", label: "Tables", icon: LayoutGrid },
        { href: "/waiter/notifications", label: "Ready", icon: Bell },
        { href: "/waiter/shift", label: "Shift", icon: Clock3 },
        { href: "/waiter/profile", label: "Profile", icon: UserRound },
    ];

    return (
        <nav className="border-t border-hairline bg-card/95 backdrop-blur">
            <ul className="mx-auto grid max-w-lg grid-cols-4">
                {items.map(item => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center gap-1 py-3 text-[12px] font-medium",
                                    active
                                        ? "text-brand"
                                        : "text-slate-gray",
                                )}
                            >
                                <Icon className="size-5" />
                                {item.label}
                                {item.href === "/waiter/notifications" &&
                                unread > 0 ? (
                                    <span className="absolute top-2 right-6 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] text-white">
                                        {unread}
                                    </span>
                                ) : null}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
