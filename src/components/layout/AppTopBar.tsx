"use client";

import AccountMenu from "@/components/layout/AccountMenu";
import StationTopBarTools from "@/components/layout/StationTopBarTools";
import { useSidebarUi } from "@/components/layout/SidebarUi";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { LocaleSwitcher } from "@/components/theme/LocaleSwitcher";
import OpsNotificationsBell from "@/domains/notifications/ui/OpsNotificationsBell";
import BranchSwitcher from "@/components/layout/BranchSwitcher";
import { navForRole } from "@/domains/identity/application/nav";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { isStationRole } from "@/domains/identity/domain/role";
import { parseQueueFilter } from "@/domains/fulfillment/application/queueFilter";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useAppSelector } from "@/context/hooks";
import { usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

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
    "Daily Close": "dailyClose",
    Settings: "settings",
    Website: "website",
    Menu: "menu",
    "Menu Items": "menuItems",
    "QR Menu Builder": "qrMenu",
    "Print Menu Builder": "printMenu",
    Stations: "stations",
    Tables: "tables",
    Staff: "staff",
    Waiters: "waiters",
    Approvals: "approvals",
    Payments: "payments",
    "Bill requests": "billRequests",
    "New sale": "newSale",
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
};

const headerClass =
    "flex h-14 w-full shrink-0 items-center gap-2 border-b border-black/[0.08] bg-white px-4 dark:border-white/[0.1] dark:bg-background md:gap-3 md:px-6";

export default function AppTopBar({ className }: { className?: string }) {
    return (
        <Suspense fallback={<header className={cn(headerClass, className)} />}>
            <AppTopBarInner className={className} />
        </Suspense>
    );
}

function AppTopBarInner({ className }: { className?: string }) {
    const staff = useAppSelector(selectCurrentStaff);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tTopBar = useTranslations("topbar");
    const tNav = useTranslations("appNav");
    const tRoles = useTranslations("roleLabels");

    const translateLabel = (label: string) => {
        const key = LABEL_KEYS[label];
        if (key && tNav.has(key)) return tNav(key);
        return label;
    };

    const { toggle } = useSidebarUi();
    const home = staff ? homePathForRole(staff.role) : "/";
    const serviceMode = useAppSelector(
        state => state.identity.session?.serviceMode,
    );
    const sections = staff ? navForRole(staff.role, serviceMode) : [];
    const items = sections.flatMap(section => section.items);
    const isOrderDetail = pathname.includes("/orders/");
    const status = parseQueueFilter(searchParams.get("status"));
    const current =
        items.find(item => {
            if (item.filter) {
                if (isOrderDetail || pathname !== home) return false;
                return item.filter === status;
            }
            return (
                pathname === item.href ||
                (item.href !== home &&
                    !item.href.endsWith("/orders") &&
                    pathname.startsWith(`${item.href}/`))
            );
        }) ?? items.find(item => item.href === home || item.filter === "all");
    const title = isOrderDetail
        ? tTopBar("orderDetail")
        : current
          ? translateLabel(current.label)
          : tTopBar("dashboard");
    const roleContext =
        staff && tRoles.has(staff.role) ? tRoles(staff.role) : staff?.role;
    const stationQueue =
        staff && isStationRole(staff.role) && pathname === home;

    return (
        <header className={cn(headerClass, className)}>
            <button
                type="button"
                aria-label={tTopBar("toggleSidebar")}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={toggle}
            >
                <PanelLeft className="size-4" />
            </button>

            <span className="inline-flex h-8 min-w-0 max-w-[min(100%,22rem)] items-center gap-1.5 rounded-full border border-border px-3 text-[12px]">
                {roleContext ? (
                    <>
                        <span className="truncate text-muted-foreground">
                            {roleContext}
                        </span>
                        <span className="shrink-0 text-muted-foreground/50">
                            /
                        </span>
                    </>
                ) : null}
                <span className="truncate font-medium text-foreground">
                    {title}
                </span>
            </span>

            {stationQueue ? (
                <StationTopBarTools
                    notify={false}
                    className="hidden min-w-0 max-w-md flex-1 md:flex"
                />
            ) : null}

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                <BranchSwitcher />
                {stationQueue ? (
                    <StationTopBarTools search={false} />
                ) : serviceMode === "BAKERY" &&
                  staff?.role === "cashier" ? null : (
                    <OpsNotificationsBell />
                )}
                <LocaleSwitcher className="hidden sm:inline-flex" />
                <ThemeToggleButton />
                <AccountMenu compact />
            </div>
        </header>
    );
}
