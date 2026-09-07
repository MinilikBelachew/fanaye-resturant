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
            <nav className="sidebar-scroll flex min-h-0 flex-1 flex-col items-center gap-1 px-2 py-1">
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
                                    "relative flex size-10 items-center justify-center rounded-full transition-colors",
                                    active
                                        ? "bg-secondary text-foreground font-semibold shadow-xs"
                                        : "text-slate-gray hover:bg-secondary hover:text-foreground",
                                )}
                            >
                                <item.icon className="size-4" />
                                {count > 0 ? (
                                    <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand" />
                                ) : null}
                            </Link>
                            <span className="pointer-events-none absolute top-1/2 left-[calc(100%+10px)] z-50 -translate-y-1/2 rounded-md bg-foreground px-2 py-1 text-[12px] font-medium whitespace-nowrap text-background opacity-0 shadow-subtle transition-opacity group-hover:opacity-100">
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
        <nav className="sidebar-scroll min-h-0 flex-1 px-3 py-2">
            {sections.map((section, index) => {
                const expanded = open[section.title] !== false;
                return (
                    <div
                        key={section.title}
                        className={cn(
                            index > 0 && "mt-3 border-t border-dashed border-hairline pt-3",
                        )}
                    >
                        <button
                            type="button"
                            className="mb-1 flex w-full items-center justify-between rounded-[10px] px-2 py-1.5 text-[11px] font-medium tracking-[0.08em] text-steel-gray uppercase hover:bg-secondary transition-colors"
                            onClick={() =>
                                setOpen(current => ({
                                    ...current,
                                    [section.title]: !expanded,
                                }))
                            }
                        >
                            {section.title}
                            <ChevronDown
                                className={cn(
                                    "size-3.5 transition-transform",
                                    expanded ? "rotate-180" : "",
                                )}
                            />
                        </button>
                        {expanded ? (
                            <ul className="ml-2 space-y-0.5 border-l border-hairline pl-2">
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
                                                    "flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[14px] font-medium transition-colors",
                                                    active
                                                        ? "bg-secondary text-foreground font-semibold"
                                                        : "text-slate-gray hover:bg-secondary/70 hover:text-foreground",
                                                )}
                                            >
                                                <item.icon className="size-4 shrink-0" />
                                                <span className="min-w-0 flex-1 truncate">
                                                    {item.label}
                                                </span>
                                                {item.badgeKey || count > 0 ? (
                                                    <span className="rounded-full bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-slate-gray">
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
