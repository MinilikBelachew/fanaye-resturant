"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, LogOut, PanelLeft, X } from "lucide-react";
import AccountMenu from "@/components/layout/AccountMenu";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import AppTopBar from "@/components/layout/AppTopBar";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import SidebarNav from "@/components/layout/SidebarNav";
import StationKdsNav from "@/components/layout/StationKdsNav";
import StationTopBarTools from "@/components/layout/StationTopBarTools";
import OpsNotificationsBell from "@/domains/notifications/ui/OpsNotificationsBell";
import BranchSwitcher from "@/components/layout/BranchSwitcher";
import { navForRole } from "@/domains/identity/application/nav";
import { useGetInventoryNetworkStatusQuery } from "@/context/services/inventoryApi";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { isStationRole, type Role } from "@/domains/identity/domain/role";
import RoleSwitcher from "@/domains/identity/ui/RoleSwitcher";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
    getPostSignOutPath,
    performSignOut,
} from "@/domains/identity/application/signOut";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/theme/LocaleSwitcher";
import { RestorchLogo } from "@/components/common/RestorchLogo";
import { useAppDispatch, useAppSelector } from "@/context/hooks";

const NAV_LABEL_KEYS: Record<string, string> = {
    Dashboard: "dashboard",
    "Live Ops": "liveOps",
    "Live Operations": "liveOps",
    "Fresh Prep": "freshPrep",
    Tenants: "tenants",
    "Staff Directory": "staffDirectory",
    "Roles & Permissions": "rolesPermissions",
    "Platform Audit": "audit",
    Audit: "audit",
    Branches: "branches",
    Reports: "reports",
    "Reports & Audits": "reports",
    "Daily Close": "dailyClose",
    Settings: "settings",
    Website: "website",
    Menu: "menu",
    "Menu catalog": "menu",
    "Menu Items": "menuItems",
    "QR Menu Builder": "qrMenu",
    "Print Menu Builder": "printMenu",
    "VIP Pricing": "vipPricing",
    "Menu Engineering": "menuEngineering",
    Feedback: "feedback",
    Customers: "customers",
    Stations: "stations",
    Tables: "tables",
    Rooms: "rooms",
    "Outside Orders": "outsideOrders",
    "Front desk": "frontDesk",
    "Front Desk": "frontDesk",
    Staff: "staff",
    HR: "staff",
    Directory: "staffDirectory",
    "Active Shifts": "activeShifts",
    "Shift Handovers": "shiftHandovers",
    Schedule: "schedule",
    Shifts: "shift",
    Attendance: "attendance",
    Leave: "leave",
    "My leave": "leave",
    Finance: "finance",
    Overview: "overview",
    Cash: "cash",
    "Cash custody": "cash",
    Closes: "closes",
    Payroll: "payroll",
    Waiters: "waiters",
    Approvals: "approvals",
    Payments: "payments",
    "Bill requests": "billRequests",
    "New sale": "newSale",
    "Bakery POS": "bakeryPos",
    "Cash drops": "cashDrops",
    "Closed Bills": "closedBills",
    Reconciliation: "reconciliation",
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
    "Returnable Materials": "materials",
    Materials: "materials",
    "Branch Supply": "branchSupply",
    "Receiving & Audit": "receivingAudit",
    "Central Prep": "centralPrep",
    Prep: "centralPrep",
    Analytics: "analytics",
    Plans: "plans",
    "Tenant Activity": "tenantActivity",
    Marketing: "marketing",
    Talent: "talent",
    "Market Prices": "marketPrices",
    Testimonials: "testimonials",
    "Automated Backups": "automatedBackups",
    "Backup & Restore": "backupRestore",
    "AI Advisor": "aiAdvisor",
    "Station menu": "stationMenu",
    "Customers & Loyalty": "customersLoyalty",
    Outside: "outside",
    Board: "board",
    "In house": "inHouse",
    "Shipments & Transfers": "shipmentsTransfers",
};

function ResponsiveNavRails({
    role,
    sections,
}: {
    role: Role;
    sections: ReturnType<typeof navForRole>;
}) {
    const pathname = usePathname();
    const tNav = useTranslations("appNav");
    const home = homePathForRole(role);

    const translateLabel = (label: string) => {
        const key = NAV_LABEL_KEYS[label];
        if (key && tNav.has(key)) return tNav(key);
        return label;
    };

    const items = useMemo(
        () => sections.flatMap(section => section.items),
        [sections],
    );

    // Determine the active top-level item (matches directly or contains an active child)
    const activeParent = useMemo(() => {
        for (const item of items) {
            const pathOnly = item.href.split("?")[0];
            if (pathname === pathOnly) return item;
            if (
                item.children?.some(c => {
                    const cPath = c.href.split("?")[0];
                    return (
                        pathname === cPath ||
                        (cPath !== home && pathname.startsWith(`${cPath}/`))
                    );
                })
            ) {
                return item;
            }
            if (pathOnly !== home && pathname.startsWith(`${pathOnly}/`)) {
                return item;
            }
        }
        if (pathname === home) {
            return items.find(item => item.href === home);
        }
        return null;
    }, [items, pathname, home]);

    // Primary Rail scrolling
    const activePrimaryRef = useRef<HTMLAnchorElement | null>(null);
    const primaryScrollRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeftPrimary, setCanScrollLeftPrimary] = useState(false);
    const [canScrollRightPrimary, setCanScrollRightPrimary] = useState(false);

    const updatePrimaryScroll = () => {
        const el = primaryScrollRef.current;
        if (!el) return;
        setCanScrollLeftPrimary(el.scrollLeft > 6);
        setCanScrollRightPrimary(
            el.scrollLeft < el.scrollWidth - el.clientWidth - 6,
        );
    };

    useEffect(() => {
        updatePrimaryScroll();
        if (activePrimaryRef.current) {
            activePrimaryRef.current.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
        }
    }, [pathname]);

    // Secondary Rail scrolling
    const activeChildRef = useRef<HTMLAnchorElement | null>(null);
    const childScrollRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeftChild, setCanScrollLeftChild] = useState(false);
    const [canScrollRightChild, setCanScrollRightChild] = useState(false);

    const updateChildScroll = () => {
        const el = childScrollRef.current;
        if (!el) return;
        setCanScrollLeftChild(el.scrollLeft > 6);
        setCanScrollRightChild(
            el.scrollLeft < el.scrollWidth - el.clientWidth - 6,
        );
    };

    useEffect(() => {
        updateChildScroll();
        if (activeChildRef.current) {
            activeChildRef.current.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
        }
    }, [pathname, activeParent]);

    const hasChildren = Boolean(
        activeParent?.children && activeParent.children.length > 0,
    );

    return (
        <div className="flex flex-col gap-1 w-full">
            {/* Primary Rail */}
            <div className="relative w-full overflow-hidden">
                <div
                    className={cn(
                        "pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-r from-white to-transparent dark:from-card transition-opacity duration-200",
                        canScrollLeftPrimary ? "opacity-100" : "opacity-0",
                    )}
                />
                <nav
                    ref={primaryScrollRef}
                    onScroll={updatePrimaryScroll}
                    className="no-scrollbar scrollbar-none flex items-center gap-1.5 sm:gap-2 overflow-x-auto scroll-smooth px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {items.map(item => {
                        const pathOnly = item.href.split("?")[0];
                        const isActive =
                            activeParent?.href === item.href ||
                            pathname === pathOnly ||
                            (pathOnly !== home &&
                                pathname.startsWith(`${pathOnly}/`));
                        const label = translateLabel(item.label);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                ref={isActive ? activePrimaryRef : null}
                                className={cn(
                                    "group flex shrink-0 items-center gap-1.5 rounded-[12px] border px-2.5 py-1.5 text-[12px] font-medium transition-all active:scale-95 sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px]",
                                    isActive
                                        ? "border-transparent bg-accent text-accent-foreground font-semibold shadow-xs"
                                        : "border-hairline bg-card text-slate-gray hover:bg-muted/70 hover:text-foreground",
                                )}
                            >
                                <Icon className="size-3.5 sm:size-4 shrink-0" />
                                <span>{label}</span>
                                {item.children && item.children.length > 0 && (
                                    <span
                                        className={cn(
                                            "size-1.5 rounded-full shrink-0 transition-opacity",
                                            isActive
                                                ? "bg-accent-foreground opacity-60"
                                                : "bg-muted-foreground/40 group-hover:bg-foreground/50",
                                        )}
                                        title="Has sub-pages"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div
                    className={cn(
                        "pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-l from-white to-transparent dark:from-card transition-opacity duration-200",
                        canScrollRightPrimary ? "opacity-100" : "opacity-0",
                    )}
                />
            </div>

            {/* Secondary Sub-Nav Rail */}
            {hasChildren && activeParent?.children && (
                <div className="relative border-t border-border/40 bg-muted/20 px-1 py-1 rounded-xl">
                    <div
                        className={cn(
                            "pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-r from-muted/80 to-transparent transition-opacity duration-200",
                            canScrollLeftChild ? "opacity-100" : "opacity-0",
                        )}
                    />
                    <div
                        ref={childScrollRef}
                        onScroll={updateChildScroll}
                        className="no-scrollbar scrollbar-none flex items-center gap-1 sm:gap-1.5 overflow-x-auto scroll-smooth px-1 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <span className="shrink-0 pl-1 pr-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <span>{translateLabel(activeParent.label)}</span>
                            <ChevronRight className="size-3 opacity-60" />
                        </span>

                        {activeParent.children.map(child => {
                            const cPath = child.href.split("?")[0];
                            const isChildActive =
                                pathname === cPath ||
                                (cPath !== home &&
                                    pathname.startsWith(`${cPath}/`));
                            const Icon = child.icon;
                            const label = translateLabel(child.label);

                            return (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    ref={isChildActive ? activeChildRef : null}
                                    className={cn(
                                        "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] sm:text-[12px] font-medium transition-all active:scale-95",
                                        isChildActive
                                            ? "border-primary/40 bg-primary/15 text-primary font-semibold shadow-2xs dark:bg-primary/25 dark:text-primary-foreground"
                                            : "border-transparent bg-transparent text-slate-gray hover:bg-muted/80 hover:text-foreground",
                                    )}
                                >
                                    <Icon className="size-3 sm:size-3.5 shrink-0" />
                                    <span>{label}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <div
                        className={cn(
                            "pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-l from-muted/80 to-transparent transition-opacity duration-200",
                            canScrollRightChild ? "opacity-100" : "opacity-0",
                        )}
                    />
                </div>
            )}
        </div>
    );
}

export default function ResponsiveDeskShell({
    role,
    children,
}: {
    role: Role;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const tRoles = useTranslations("roleLabels");
    const tTopBar = useTranslations("topbar");
    const station = isStationRole(role);
    const home = homePathForRole(role);
    const stationQueueHome = station && pathname === home;
    const roleLabel = tRoles.has(role) ? tRoles(role) : role;

    const [drawerOpen, setDrawerOpen] = useState(false);

    const staff = useAppSelector(selectCurrentStaff);
    const serviceMode = useAppSelector(
        state => state.identity.session?.serviceMode,
    );
    const roomsEnabled = useAppSelector(
        state => state.identity.session?.roomsEnabled,
    );
    const isInventoryRole =
        role === "owner" || role === "manager" || role === "store_manager";

    const { data: networkRes } = useGetInventoryNetworkStatusQuery(undefined, {
        skip: !isInventoryRole,
    });
    const { data: siteRes } = useGetTenantSiteQuery();
    const site = siteRes?.data;

    const sessionHasMain = useAppSelector(
        state => state.identity.session?.hasMainWarehouse,
    );
    const hasMainWarehouse =
        networkRes?.data?.hasMainWarehouse ?? sessionHasMain === true;

    const hideNotifications = serviceMode === "BAKERY" && role === "cashier";

    const sections = useMemo(
        () =>
            navForRole(role, {
                serviceMode,
                roomsEnabled: roomsEnabled === true,
                hasMainWarehouse,
                featureInventory: site?.featureInventory,
                featureCentralWarehouse: site?.featureCentralWarehouse,
                featureTelegramBackup: site?.featureTelegramBackup,
                featureAiAdvisor: site?.featureAiAdvisor,
                featureOutsideOrders: site?.featureOutsideOrders,
            }),
        [
            role,
            serviceMode,
            roomsEnabled,
            hasMainWarehouse,
            site?.featureInventory,
            site?.featureCentralWarehouse,
            site?.featureTelegramBackup,
            site?.featureAiAdvisor,
            site?.featureOutsideOrders,
        ],
    );

    // Close mobile drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // Handle ESC to close drawer
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setDrawerOpen(false);
        };
        if (drawerOpen) {
            window.addEventListener("keydown", onKeyDown);
            return () => window.removeEventListener("keydown", onKeyDown);
        }
    }, [drawerOpen]);

    const staffInitials =
        staff?.name
            ?.split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "FA";

    return (
        <div className="flex h-svh overflow-hidden bg-white dark:bg-background">
            <DesktopSidebar className="hidden xl:flex" />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-background">
                {/* Non-Desktop Header (Tablets, iPads, Phones < xl) */}
                <header className="shrink-0 border-b border-black/[0.08] bg-white dark:border-white/[0.1] dark:bg-card xl:hidden">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-2 sm:gap-2.5 sm:px-4 md:px-6">
                        {/* Top Bar Row */}
                        <div className="flex h-10 items-center justify-between gap-2">
                            {/* Left: Drawer Toggle Button & Logo */}
                            <div className="min-w-0 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(true)}
                                    aria-label="Open navigation menu"
                                    title="Open navigation menu"
                                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                                >
                                    <PanelLeft className="size-4" />
                                </button>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <RestorchLogo variant="mark" height={22} />
                                    <h1 className="truncate text-[14px] sm:text-[15px] font-semibold tracking-tight text-foreground">
                                        {roleLabel}
                                    </h1>
                                </div>
                            </div>

                            {/* Right: Actions & Tools */}
                            <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
                                {stationQueueHome ? (
                                    <StationTopBarTools search={false} />
                                ) : hideNotifications ? null : (
                                    <OpsNotificationsBell />
                                )}
                                <BranchSwitcher compact showAlways />
                                <LocaleSwitcher className="scale-90 origin-right sm:scale-100" />
                                <ThemeToggleButton />
                                <AccountMenu compact />
                            </div>
                        </div>

                        {stationQueueHome ? (
                            <StationTopBarTools notify={false} />
                        ) : null}

                        {/* User Identity Banner: Clean on mobile, full on tablet */}
                        <div className="hidden sm:block pb-0.5">
                            <RoleSwitcher />
                        </div>
                        {staff && (
                            <div className="sm:hidden flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-2.5 py-1 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[9px] font-bold text-primary">
                                        {staffInitials}
                                    </div>
                                    <span className="truncate font-medium text-foreground text-[12px]">
                                        {staff.name}
                                    </span>
                                </div>
                                <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                                    {roleLabel}
                                </span>
                            </div>
                        )}

                        {/* Navigation Rails */}
                        {station ? (
                            <StationKdsNav role={role} />
                        ) : (
                            <ResponsiveNavRails
                                role={role}
                                sections={sections}
                            />
                        )}
                    </div>
                </header>

                {/* Mobile / Tablet Full Navigation Drawer */}
                {drawerOpen && (
                    <div
                        className="fixed inset-0 z-50 flex animate-in fade-in duration-200"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                            onClick={() => setDrawerOpen(false)}
                        />

                        {/* Drawer Panel */}
                        <div className="relative z-10 flex h-full w-[295px] max-w-[85vw] flex-col bg-background p-3.5 shadow-2xl border-r border-border animate-in slide-in-from-left duration-200">
                            {/* Drawer Header */}
                            <div className="flex shrink-0 items-center justify-between border-b border-border/40 pb-3">
                                <Link
                                    href="/"
                                    onClick={() => setDrawerOpen(false)}
                                    className="flex items-center gap-2"
                                    title="Restorch OS"
                                >
                                    <RestorchLogo variant="full" height={22} />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    aria-label="Close menu"
                                    className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Staff Identity in Drawer */}
                            <div className="shrink-0 pt-3 pb-1">
                                <RoleSwitcher />
                            </div>

                            {/* Full Hierarchical Nav with Sections and Children */}
                            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                                <SidebarNav
                                    sections={sections}
                                    onNavigate={() => setDrawerOpen(false)}
                                />
                            </div>

                            {/* Drawer Footer with Branch Info and Sign Out */}
                            <div className="shrink-0 border-t border-border/60 pt-3 flex items-center justify-between gap-2">
                                <BranchSwitcher compact showAlways />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setDrawerOpen(false);
                                        const r = staff?.role;
                                        await performSignOut(dispatch);
                                        router.push(getPostSignOutPath(r));
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                                >
                                    <LogOut className="size-3.5" />
                                    <span>{tTopBar("logOut")}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <AppTopBar className="hidden bg-white dark:bg-background xl:flex" />

                <main className="app-scroll mx-auto w-full max-w-6xl flex-1 bg-white p-3 sm:p-4 md:p-6 dark:bg-background xl:max-w-none xl:px-6 xl:pb-8 xl:pt-5">
                    {children}
                </main>
            </div>
        </div>
    );
}
