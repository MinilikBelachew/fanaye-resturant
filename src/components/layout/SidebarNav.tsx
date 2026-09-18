"use client";

import { Suspense, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
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

const TITLE_KEYS: Record<string, string> = {
    Overview: "overview",
    Platform: "platform",
    Trust: "trust",
    Business: "business",
    House: "house",
    Control: "control",
    Floor: "floor",
    Close: "close",
    Shift: "shift",
    Queue: "queue",
    Operations: "operations",
    Catalog: "catalog",
    Management: "management",
    Cashier: "cashier",
};

const LABEL_KEYS: Record<string, string> = {
    Dashboard: "dashboard",
    "Live Ops": "liveOps",
    "Live Operations": "liveOps",
    Tenants: "tenants",
    "Staff Directory": "staffDirectory",
    "Platform Audit": "audit",
    Audit: "audit",
    Branches: "branches",
    Reports: "reports",
    "Daily Close": "reconciliation",
    Settings: "settings",
    Website: "website",
    Menu: "menu",
    "Menu Items": "menuItems",
    "QR Menu Builder": "qrMenu",
    "Print Menu Builder": "printMenu",
    Stations: "stations",
    Tables: "tables",
    Staff: "staff",
    Approvals: "approvals",
    Payments: "payments",
    "Bill requests": "billRequests",
    "Cash drops": "cashDrops",
    "Closed Bills": "closedBills",
    Reconciliation: "reconciliation",
    Cash: "cash",
    Ready: "ready",
    Shift: "shift",
    Profile: "profile",
    "All tickets": "allTickets",
    New: "new",
    "In progress": "preparing",
    Exceptions: "exceptions",
    Notifications: "notifications",
};

export default function SidebarNav(props: {
    sections: NavSection[];
    badges?: Partial<
        Record<"new" | "preparing" | "ready" | "exceptions", number>
    >;
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
    badges?: Partial<
        Record<"new" | "preparing" | "ready" | "exceptions", number>
    >;
    extraBadges?: Record<string, number>;
    onNavigate?: () => void;
    collapsed?: boolean;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tNav = useTranslations("appNav");

    const translateTitle = (title: string) => {
        const key = TITLE_KEYS[title];
        if (key && tNav.has(key)) return tNav(key);
        return title;
    };

    const translateLabel = (label: string) => {
        const key = LABEL_KEYS[label];
        if (key && tNav.has(key)) return tNav(key);
        return label;
    };

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

    const [submenusOpen, setSubmenusOpen] = useState<Record<string, boolean>>(
        () => {
            const initial: Record<string, boolean> = {};
            for (const section of sections) {
                for (const item of section.items) {
                    if (item.children && item.children.length > 0) {
                        initial[item.href] = true;
                    }
                }
            }
            return initial;
        },
    );

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
                    const translated = translateLabel(item.label);
                    return (
                        <div key={item.href} className="group relative">
                            <Link
                                href={href}
                                onClick={onNavigate}
                                aria-label={translated}
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
                                {translated}
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
            {sections.map(section => {
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
                            <span>{translateTitle(section.title)}</span>
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
                                    if (
                                        item.children &&
                                        item.children.length > 0
                                    ) {
                                        const isAnyChildActive =
                                            item.children.some(child =>
                                                activeHref(child),
                                            );
                                        const isSubOpen =
                                            submenusOpen[item.href] !== false;

                                        return (
                                            <li
                                                key={item.href}
                                                className="space-y-0.5"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSubmenusOpen(
                                                            prev => ({
                                                                ...prev,
                                                                [item.href]:
                                                                    !isSubOpen,
                                                            }),
                                                        )
                                                    }
                                                    className={cn(
                                                        "group flex w-full items-center justify-between gap-2.5 py-2 px-3 text-[13px] font-medium rounded-xl transition-all duration-150",
                                                        isAnyChildActive
                                                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold"
                                                            : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <item.icon
                                                            className={cn(
                                                                "size-4 shrink-0 transition-colors",
                                                                isAnyChildActive
                                                                    ? "text-orange-600 dark:text-orange-400"
                                                                    : "text-muted-foreground/70 group-hover:text-foreground",
                                                            )}
                                                        />
                                                        <span className="truncate">
                                                            {translateLabel(
                                                                item.label,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <ChevronDown
                                                        className={cn(
                                                            "size-3.5 shrink-0 transition-transform duration-200",
                                                            isSubOpen
                                                                ? "rotate-0 text-orange-500"
                                                                : "-rotate-90 text-muted-foreground/60",
                                                        )}
                                                    />
                                                </button>

                                                {isSubOpen ? (
                                                    <div className="ml-5 pl-2.5 my-0.5 border-l-2 border-orange-500/25 space-y-0.5">
                                                        {item.children.map(
                                                            child => {
                                                                const childActive =
                                                                    activeHref(
                                                                        child,
                                                                    );
                                                                return (
                                                                    <Link
                                                                        key={
                                                                            child.href
                                                                        }
                                                                        href={
                                                                            child.href
                                                                        }
                                                                        onClick={
                                                                            onNavigate
                                                                        }
                                                                        className={cn(
                                                                            "group flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all duration-150",
                                                                            childActive
                                                                                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold shadow-2xs border border-orange-500/20"
                                                                                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                                                        )}
                                                                    >
                                                                        <child.icon
                                                                            className={cn(
                                                                                "size-3.5 shrink-0 transition-colors",
                                                                                childActive
                                                                                    ? "text-orange-600 dark:text-orange-400"
                                                                                    : "text-muted-foreground/70 group-hover:text-foreground",
                                                                            )}
                                                                        />
                                                                        <span className="truncate">
                                                                            {translateLabel(
                                                                                child.label,
                                                                            )}
                                                                        </span>
                                                                    </Link>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                ) : null}
                                            </li>
                                        );
                                    }

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
                                                    {translateLabel(item.label)}
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
