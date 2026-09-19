"use client";

import { CheckCircle2, Clock3, LayoutGrid, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/context/hooks";
import {
    selectCurrentStaff,
    selectUnreadReadyCount,
} from "@/domains/ordering/application/selectors";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function WaiterBottomNav() {
    const t = useTranslations("appNav");
    const staff = useAppSelector(selectCurrentStaff);
    const pathname = usePathname();
    const unread = useAppSelector(state =>
        staff ? selectUnreadReadyCount(state, staff.id) : 0,
    );

    const items = [
        {
            href: "/waiter/tables",
            labelKey: "tables" as const,
            icon: LayoutGrid,
        },
        {
            href: "/waiter/ready",
            labelKey: "ready" as const,
            icon: CheckCircle2,
        },
        { href: "/waiter/shift", labelKey: "shift" as const, icon: Clock3 },
        {
            href: "/waiter/profile",
            labelKey: "profile" as const,
            icon: UserRound,
        },
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
                                    active ? "text-brand" : "text-slate-gray",
                                )}
                            >
                                <Icon className="size-5" />
                                {t(item.labelKey)}
                                {item.href === "/waiter/ready" && unread > 0 ? (
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
