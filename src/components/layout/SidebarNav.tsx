"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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
    Alerts: "alerts",
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
    "Counter POS": "counterPos",
};

const LABEL_KEYS: Record<string, string> = {
    Dashboard: "dashboard",
    "Live Ops": "liveOps",
    "Live Operations": "liveOps",
    "Fresh Prep": "freshPrep",
    Tenants: "tenants",
    Plans: "plans",
    "Staff Directory": "staffDirectory",
    "Roles & Permissions": "rolesPermissions",
    "Platform Audit": "audit",
    Audit: "audit",
    Branches: "branches",
    Reports: "reports",
    "Daily Close": "dailyClose",
    Settings: "settings",
    Website: "website",
    Menu: "menu",
    "Menu Items": "menuItems",
    "QR Menu Builder": "qrMenu",
    "Print Menu Builder": "printMenu",
    "Menu Engineering": "menuEngineering",
    Feedback: "feedback",
    Stations: "stations",
    Tables: "tables",
    Staff: "staff",
    HR: "staff",
    Finance: "finance",
    Overview: "overview",
    Closes: "closes",
    Payroll: "payroll",
    Directory: "staffDirectory",
    Schedule: "schedule",
    Shifts: "shift",
    Attendance: "attendance",
    Leave: "leave",
    Waiters: "waiters",
    Approvals: "approvals",
    Payments: "payments",
    "Bill requests": "billRequests",
    "New sale": "newSale",
    "Bakery POS": "bakeryPos",
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
    Alerts: "alerts",
    Inventory: "inventory",
    "Stock & Items": "stockItems",
    "Branch Supply": "branchSupply",
    "Receiving & Audit": "receivingAudit",
    "Central Prep": "centralPrep",
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

    const filter = parseQueueFilter(searchParams.get("status"));
    const view = parseQueueView(searchParams.get("view"));
    const query = searchParams.get("q") ?? "";

    const allNavPaths = useMemo(() => {
        const paths: string[] = [];
        for (const section of sections) {
            for (const item of section.items) {
                paths.push(item.href.split("?")[0]);
                for (const child of item.children ?? []) {
                    paths.push(child.href.split("?")[0]);
                }
            }
        }
        return paths;
    }, [sections]);

    /** Exact match, or prefix only when no longer nav path also matches. */
    const pathIsActive = useMemo(() => {
        return (href: string) => {
            const pathOnly = href.split("?")[0];
            if (pathname === pathOnly) return true;
            if (pathOnly === home || !pathname.startsWith(`${pathOnly}/`)) {
                return false;
            }
            const hasLongerMatch = allNavPaths.some(
                candidate =>
                    candidate !== pathOnly &&
                    candidate.length > pathOnly.length &&
                    (pathname === candidate ||
                        pathname.startsWith(`${candidate}/`)),
            );
            return !hasLongerMatch;
        };
    }, [allNavPaths, home, pathname]);

    const activeHref = useMemo(() => {
        return (item: NavSection["items"][number]) => {
            if (item.filter) {
                return pathname === home && item.filter === filter;
            }
            return pathIsActive(item.href);
        };
    }, [filter, home, pathname, pathIsActive]);

    const items = sections.flatMap(section => section.items);

    const [submenusOpen, setSubmenusOpen] = useState<Record<string, boolean>>(
        () => {
            const initial: Record<string, boolean> = {};
            for (const section of sections) {
                for (const item of section.items) {
                    if (item.children && item.children.length > 0) {
                        initial[item.href] = item.children.some(child =>
                            pathIsActive(child.href),
                        );
                    }
                }
            }
            return initial;
        },
    );

    // Keep HR/Finance open when navigating between their children
    useEffect(() => {
        setSubmenusOpen(prev => {
            const next = { ...prev };
            let changed = false;
            for (const section of sections) {
                for (const item of section.items) {
                    if (!item.children?.length) continue;
                    const childActive = item.children.some(child =>
                        pathIsActive(child.href),
                    );
                    if (childActive && !next[item.href]) {
                        next[item.href] = true;
                        changed = true;
                    }
                }
            }
            return changed ? next : prev;
        });
    }, [pathname, pathIsActive, sections]);

    if (collapsed) {
        return (
            <nav className="sidebar-scroll mt-5 flex min-h-0 flex-1 flex-col items-center gap-1 px-2 py-2">
                {items.map(item => {
                    const childActive = Boolean(
                        item.children?.some(child => activeHref(child)),
                    );
                    // Collapsed: icon active only for leaf items, or when a child matches
                    const active = item.children?.length
                        ? childActive
                        : activeHref(item);
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
                                    "relative flex size-10 items-center justify-center rounded-full border transition-colors",
                                    active
                                        ? "border-border bg-background text-emerald-600 dark:text-emerald-400"
                                        : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground",
                                )}
                            >
                                <item.icon className="size-4" />
                                {count > 0 ? (
                                    <span className="absolute top-1 right-1 size-2 rounded-full bg-emerald-600" />
                                ) : null}
                            </Link>
                            <span className="pointer-events-none absolute top-1/2 left-[calc(100%+12px)] z-50 -translate-y-1/2 rounded-lg border border-border/80 bg-popover px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
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
        <nav className="sidebar-scroll mt-4 min-h-0 flex-1 px-3 pb-3">
            <ul className="flex flex-col gap-1">
                {sections.map(section => (
                    <li key={section.title} className="contents">
                        {sections.length > 1 ? (
                            <p className="mt-3 mb-1 px-3 text-[10px] font-medium tracking-wider text-muted-foreground uppercase first:mt-0">
                                {translateTitle(section.title)}
                            </p>
                        ) : null}
                        {section.items.map(item => {
                            const hasChildren = Boolean(
                                item.children && item.children.length > 0,
                            );
                            const isSubOpen = Boolean(submenusOpen[item.href]);
                            const childActive = Boolean(
                                item.children?.some(child => activeHref(child)),
                            );
                            // Parent with children: only the matching child is "active"
                            // (avoids HR + Schedule both highlighted).
                            const active = hasChildren
                                ? false
                                : activeHref(item);
                            const inSection = hasChildren && childActive;
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
                            const label = translateLabel(item.label);

                            if (hasChildren && item.children) {
                                return (
                                    <div key={item.href} className="space-y-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSubmenusOpen(prev => ({
                                                    ...prev,
                                                    [item.href]: !isSubOpen,
                                                }))
                                            }
                                            className={cn(
                                                "flex h-9 w-full items-center gap-3 rounded-full border px-3 text-[13px] transition-colors cursor-pointer",
                                                inSection || isSubOpen
                                                    ? "border-transparent text-foreground/90"
                                                    : "border-transparent text-foreground/80 hover:bg-background/70 hover:text-foreground",
                                            )}
                                            aria-expanded={isSubOpen}
                                            aria-label={
                                                isSubOpen
                                                    ? `Close ${label}`
                                                    : `Open ${label}`
                                            }
                                        >
                                            <item.icon
                                                className={cn(
                                                    "size-4 shrink-0",
                                                    inSection
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-muted-foreground",
                                                )}
                                            />
                                            <span className="min-w-0 flex-1 truncate text-left">
                                                {label}
                                            </span>
                                            {isSubOpen ? (
                                                <X className="size-3.5 shrink-0 text-muted-foreground" />
                                            ) : (
                                                <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                                            )}
                                        </button>
                                        {isSubOpen ? (
                                            <ul className="ml-4 flex flex-col gap-0.5 border-l border-border/70 pl-2">
                                                {item.children.map(child => {
                                                    const childIsActive =
                                                        activeHref(child);
                                                    return (
                                                        <li key={child.href}>
                                                            <Link
                                                                href={
                                                                    child.href
                                                                }
                                                                onClick={
                                                                    onNavigate
                                                                }
                                                                className={cn(
                                                                    "flex h-8 items-center gap-2.5 rounded-full px-3 text-[12px] transition-colors",
                                                                    childIsActive
                                                                        ? "bg-background font-medium text-emerald-600 dark:text-emerald-400"
                                                                        : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                                                                )}
                                                            >
                                                                <child.icon className="size-3.5 shrink-0" />
                                                                <span className="truncate">
                                                                    {translateLabel(
                                                                        child.label,
                                                                    )}
                                                                </span>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : null}
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={item.href}
                                    className="flex items-center gap-1.5"
                                >
                                    <Link
                                        href={href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "flex min-w-0 flex-1 items-center gap-3 rounded-full border text-[13px] transition-colors h-9 px-3",
                                            active
                                                ? "border-border bg-background font-medium text-foreground"
                                                : "border-transparent text-foreground/80 hover:bg-background/70 hover:text-foreground",
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "size-4 shrink-0",
                                                active
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-muted-foreground",
                                            )}
                                        />
                                        <span className="min-w-0 flex-1 truncate">
                                            {label}
                                        </span>
                                        {item.badgeKey || count > 0 ? (
                                            <span
                                                className={cn(
                                                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                                                    count > 0
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-background text-muted-foreground",
                                                )}
                                            >
                                                {count}
                                            </span>
                                        ) : null}
                                    </Link>
                                </div>
                            );
                        })}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
