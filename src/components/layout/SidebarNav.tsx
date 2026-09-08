"use client";

import { Suspense, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavSection } from "@/domains/identity/application/nav";
import { homePathForRole } from "@/domains/identity/application/homePath";
import {
    parseQueueFilter,
    parseQueueView,
    stationQueueHref,
} from "@/domains/fulfillment/application/queueFilter";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useAppSelector } from "@/context/hooks";
import { Link, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SidebarNav(props: {
    sections: NavSection[];
    badges?: Partial<Record<"new" | "preparing" | "ready" | "exceptions", number>>;
    extraBadges?: Record<string, number>;
    onNavigate?: () => void;
    collapsed?: boolean;
}) {
    return (
        <Suspense
            fallback={
                <nav className="sidebar-scroll min-h-0 flex-1 px-3 py-2" />
            }
        >
            <SidebarNavInner {...props} />
        </Suspense>
    );
}

function SidebarNavInner({
    sections,
    badges = {},
    extraBadges = {},
    onNavigate,
    collapsed = false,
    }: {
    sections: NavSection[];
    badges?: Partial<Record<"new" | "preparing" | "ready" | "exceptions", number>>;
    extraBadges?: Record<string, number>;
    onNavigate?: () => void;
    collapsed?: boolean;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const home = staff ? homePathForRole(staff.role) : "/";
    const [open, setOpen] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(sections.map(section => [section.title, true])),
    );

    const filter = parseQueueFilter(searchParams.get("status"));
    const view = parseQueueView(searchParams.get("view"));
    const query = searchParams.get("q") ?? "";

    const activeHref = useMemo(() => {
        return (item: NavSection["items"][number]) => {
            if (item.filter) {
                return pathname === home && item.filter === filter;
            }
            const pathOnly = item.href.split("?")[0];
            return (
                pathname === pathOnly ||
                (pathOnly !== home && pathname.startsWith(`${pathOnly}/`))
            );
        };
    }, [filter, home, pathname]);

    const items = sections.flatMap(section => section.items);

    if (collapsed) {
        return (
            <nav className="sidebar-scroll flex min-h-0 flex-1 flex-col items-center gap-1.5 px-2 py-2">
                {items.map(item => {
                    const active = activeHref(item);
                    const count =
                        (item.badgeKey
                            ? badges[item.badgeKey]
                            : extraBadges[item.href]) ?? 0;
                    const href = item.filter
                        ? stationQueueHref(home, {
                              status: item.filter,
                              q: query,
                              view,
                          })
                        : item.href;
                    return (
                        <div key={item.href} className="group relative">
                            <Link
                                href={href}
                                onClick={onNavigate}
                                aria-label={item.label}
                                className={cn(
                                    "relative flex size-10 items-center justify-center rounded-xl transition-all duration-150",
                                    active
                                        ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold shadow-xs border border-orange-500/30"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                )}
                            >
                                <item.icon className="size-4" />
                                {count > 0 ? (
                                    <span className="absolute top-1 right-1 size-2 rounded-full bg-orange-500 animate-pulse" />
                                ) : null}
                            </Link>
                            <span className="pointer-events-none absolute top-1/2 left-[calc(100%+12px)] z-50 -translate-y-1/2 rounded-lg border border-border/80 bg-popover px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                                {item.label}
                                {count > 0 ? ` · ${count}` : ""}
                            </span>
                        </div>
                    );
                })}
            </nav>
        );
    }

    return (
        <nav className="sidebar-scroll min-h-0 flex-1 px-3 py-3 space-y-4">
            {sections.map((section, index) => {
                const expanded = open[section.title] !== false;
                return (
                    <div key={section.title} className="space-y-1">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest text-muted-foreground/80 uppercase hover:text-foreground transition-colors"
                            onClick={() =>
                                setOpen(current => ({
                                    ...current,
                                    [section.title]: !expanded,
                                }))
                            }
                        >
                            <span>{section.title}</span>
                            <ChevronDown
                                className={cn(
                                    "size-3 text-muted-foreground/60 transition-transform duration-200",
                                    expanded ? "rotate-0" : "-rotate-90",
                                )}
                            />
                        </button>
                        {expanded ? (
                            <ul className="space-y-0.5">
                                {section.items.map(item => {
                                    const active = activeHref(item);
                                    const count =
                                        (item.badgeKey
                                            ? badges[item.badgeKey]
                                            : extraBadges[item.href]) ?? 0;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={
                                                    item.filter
                                                        ? stationQueueHref(
                                                              home,
                                                              {
                                                                  status: item.filter,
                                                                  q: query,
                                                                  view,
                                                              },
                                                          )
                                                        : item.href
                                                }
                                                onClick={onNavigate}
                                                className={cn(
                                                    "group flex items-center gap-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                                                    active
                                                        ? "rounded-r-xl rounded-l-xs border-l-[3px] border-orange-500 bg-gradient-to-r from-orange-500/15 via-orange-500/8 to-transparent pl-3 pr-2.5 text-orange-600 dark:text-orange-400 font-semibold"
                                                        : "rounded-xl px-3 text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "size-4 shrink-0 transition-colors",
                                                        active
                                                            ? "text-orange-600 dark:text-orange-400"
                                                            : "text-muted-foreground/70 group-hover:text-foreground",
                                                    )}
                                                />
                                                <span className="min-w-0 flex-1 truncate">
                                                    {item.label}
                                                </span>
                                                {item.badgeKey || count > 0 ? (
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2 py-0.5 text-[10px] font-bold font-mono tracking-tight",
                                                            count > 0
                                                                ? "bg-orange-500 text-white"
                                                                : "bg-secondary text-muted-foreground",
                                                        )}
                                                    >
                                                        {count}
                                                    </span>
                                                ) : null}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </div>
                );
            })}
        </nav>
    );
}
