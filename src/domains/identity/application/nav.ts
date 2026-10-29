import type { LucideIcon } from "lucide-react";
import {
    Activity,
    AlertTriangle,
    Banknote,
    BarChart3,
    BedDouble,
    Bell,
    BookOpen,
    Boxes,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChefHat,
    ClipboardCheck,
    Clock3,
    ConciergeBell,
    CreditCard,
    Crown,
    Flame,
    Globe,
    HandCoins,
    Inbox,
    LayoutDashboard,
    LayoutGrid,
    MessageSquareQuote,
    Package,
    Phone,
    QrCode,
    Radio,
    ScrollText,
    Shield,
    Store,
    Truck,
    UserRound,
    Users,
    UtensilsCrossed,
    Wallet,
    Warehouse,
} from "lucide-react";
import type { Role } from "../domain/role";
import { homePathForRole } from "./homePath";

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    filter?: "all" | "new" | "preparing" | "ready" | "exceptions";
    badgeKey?: "new" | "preparing" | "ready" | "exceptions";
    children?: NavItem[];
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

function stationQueueNav(home: string): NavSection[] {
    return [
        {
            title: "Queue",
            items: [
                {
                    href: home,
                    label: "All tickets",
                    icon: LayoutGrid,
                    filter: "all",
                },
            ],
        },
        {
            title: "Station",
            items: [
                {
                    href: `${home}/materials`,
                    label: "Returnable Materials",
                    icon: Boxes,
                },
                {
                    href: `${home}/menu`,
                    label: "Station menu",
                    icon: UtensilsCrossed,
                },
                {
                    href: `${home}/leave`,
                    label: "My leave",
                    icon: CalendarDays,
                },
            ],
        },
        {
            title: "Alerts",
            items: [
                {
                    href: `${home}/notifications`,
                    label: "Notifications",
                    icon: Bell,
                },
            ],
        },
    ];
}

function navSectionsForRole(role: Role): NavSection[] {
    switch (role) {
        case "super_admin":
            return [
                {
                    title: "Overview",
                    items: [
                        {
                            href: "/super-admin",
                            label: "Dashboard",
                            icon: LayoutDashboard,
                        },
                        {
                            href: "/super-admin/live-ops",
                            label: "Live Ops",
                            icon: Radio,
                        },
                    ],
                },
                {
                    title: "Platform",
                    items: [
                        {
                            href: "/super-admin/tenants",
                            label: "Tenants",
                            icon: Building2,
                        },
                        {
                            href: "/super-admin/plans",
                            label: "Plans",
                            icon: CreditCard,
                        },
                        {
                            href: "/super-admin/staff",
                            label: "Staff Directory",
                            icon: Users,
                        },
                        {
                            href: "/super-admin/roles",
                            label: "Roles & Permissions",
                            icon: Shield,
                        },
                    ],
                },
                {
                    title: "Trust",
                    items: [
                        {
                            href: "/super-admin/audit",
                            label: "Platform Audit",
                            icon: ScrollText,
                        },
                    ],
                },
            ];
        case "owner":
            return [
                {
                    title: "Business",
                    items: [
                        {
                            href: "/owner",
                            label: "Dashboard",
                            icon: LayoutDashboard,
                        },
                        {
                            href: "/owner/live",
                            label: "Live Operations",
                            icon: Activity,
                        },
                        {
                            href: "/owner/outside",
                            label: "Outside Orders",
                            icon: Building2,
                        },
                        /* {
                            href: "/owner/fresh-prep",
                            label: "Fresh Prep",
                            icon: ChefHat,
                        }, */
                        {
                            href: "/owner/notifications",
                            label: "Notifications",
                            icon: Bell,
                        },
                        {
                            href: "/owner/website",
                            label: "Website",
                            icon: Globe,
                        },
                        {
                            href: "/owner/feedback",
                            label: "Feedback",
                            icon: MessageSquareQuote,
                        },
                        {
                            href: "/owner/menu-engineering",
                            label: "Menu Engineering",
                            icon: BarChart3,
                        },
                        {
                            href: "/owner/branches",
                            label: "Branches",
                            icon: Building2,
                        },
                        {
                            href: "/owner/staff",
                            label: "HR",
                            icon: Users,
                            children: [
                                {
                                    href: "/owner/staff",
                                    label: "Directory",
                                    icon: Users,
                                },
                                {
                                    href: "/owner/staff/schedule",
                                    label: "Schedule",
                                    icon: LayoutGrid,
                                },
                                {
                                    href: "/owner/staff/shifts",
                                    label: "Shifts",
                                    icon: Clock3,
                                },
                                {
                                    href: "/owner/staff/attendance",
                                    label: "Attendance",
                                    icon: ClipboardCheck,
                                },
                                {
                                    href: "/owner/staff/leave",
                                    label: "Leave",
                                    icon: Inbox,
                                },
                            ],
                        },
                        {
                            href: "/owner/finance",
                            label: "Finance",
                            icon: Wallet,
                            children: [
                                {
                                    href: "/owner/finance",
                                    label: "Overview",
                                    icon: LayoutDashboard,
                                },
                                {
                                    href: "/owner/finance/cash",
                                    label: "Cash",
                                    icon: Banknote,
                                },
                                {
                                    href: "/owner/finance/closes",
                                    label: "Closes",
                                    icon: ClipboardCheck,
                                },
                                {
                                    href: "/owner/finance/reports",
                                    label: "Reports",
                                    icon: ScrollText,
                                },
                                {
                                    href: "/owner/finance/payroll",
                                    label: "Payroll",
                                    icon: HandCoins,
                                },
                            ],
                        },
                        {
                            href: "/owner/inventory",
                            label: "Inventory",
                            icon: Package,
                            children: [
                                {
                                    href: "/owner/inventory/analytics",
                                    label: "Analytics",
                                    icon: BarChart3,
                                },
                                {
                                    href: "/owner/inventory",
                                    label: "Stock & Items",
                                    icon: Boxes,
                                },
                                {
                                    href: "/owner/inventory/materials",
                                    label: "Materials",
                                    icon: UtensilsCrossed,
                                },
                                {
                                    href: "/owner/inventory/transfers",
                                    label: "Branch Supply",
                                    icon: Truck,
                                },
                                {
                                    href: "/owner/inventory/receiving",
                                    label: "Receiving & Audit",
                                    icon: ClipboardCheck,
                                },
                                {
                                    href: "/owner/inventory/prep",
                                    label: "Central Prep",
                                    icon: ChefHat,
                                },
                            ],
                        },
                        {
                            href: "/owner/settings",
                            label: "Settings",
                            icon: Store,
                        },
                    ],
                },
            ];
        case "manager":
            return [
                {
                    title: "Overview",
                    items: [
                        {
                            href: "/manager",
                            label: "Dashboard",
                            icon: LayoutDashboard,
                        },
                        {
                            href: "/manager/live",
                            label: "Live Operations",
                            icon: Activity,
                        },
                        /* {
                            href: "/manager/fresh-prep",
                            label: "Fresh Prep",
                            icon: ChefHat,
                        }, */
                    ],
                },
                {
                    title: "House",
                    items: [
                        {
                            href: "/manager/menu",
                            label: "Menu",
                            icon: UtensilsCrossed,
                            children: [
                                {
                                    href: "/manager/menu",
                                    label: "Menu Items",
                                    icon: UtensilsCrossed,
                                },
                                {
                                    href: "/manager/qr-menu",
                                    label: "QR Menu Builder",
                                    icon: QrCode,
                                },
                                {
                                    href: "/manager/print-menu",
                                    label: "Print Menu Builder",
                                    icon: BookOpen,
                                },
                                {
                                    href: "/manager/menu/vip-pricing",
                                    label: "VIP Pricing",
                                    icon: Crown,
                                },
                                {
                                    href: "/manager/menu-engineering",
                                    label: "Menu Engineering",
                                    icon: BarChart3,
                                },
                            ],
                        },
                        {
                            href: "/manager/stations",
                            label: "Stations",
                            icon: Warehouse,
                        },
                        {
                            href: "/manager/inventory",
                            label: "Inventory",
                            icon: Package,
                            children: [
                                {
                                    href: "/manager/inventory/analytics",
                                    label: "Analytics",
                                    icon: BarChart3,
                                },
                                {
                                    href: "/manager/inventory",
                                    label: "Stock & Items",
                                    icon: Boxes,
                                },
                                {
                                    href: "/manager/inventory/materials",
                                    label: "Materials",
                                    icon: UtensilsCrossed,
                                },
                                {
                                    href: "/manager/inventory/transfers",
                                    label: "Branch Supply",
                                    icon: Truck,
                                },
                                {
                                    href: "/manager/inventory/receiving",
                                    label: "Receiving & Audit",
                                    icon: ClipboardCheck,
                                },
                                {
                                    href: "/manager/inventory/prep",
                                    label: "Central Prep",
                                    icon: ChefHat,
                                },
                            ],
                        },
                        {
                            href: "/manager/tables",
                            label: "Tables",
                            icon: Store,
                        },
                        {
                            href: "/manager/rooms",
                            label: "Rooms",
                            icon: BedDouble,
                        },
                        {
                            href: "/manager/outside",
                            label: "Outside Orders",
                            icon: Building2,
                        },
                        {
                            href: "/manager/front-desk",
                            label: "Front desk",
                            icon: ConciergeBell,
                        },
                        {
                            href: "/manager/staff",
                            label: "HR",
                            icon: Users,
                            children: [
                                {
                                    href: "/manager/staff",
                                    label: "Directory",
                                    icon: Users,
                                },
                                {
                                    href: "/manager/staff/schedule",
                                    label: "Schedule",
                                    icon: LayoutGrid,
                                },
                                {
                                    href: "/manager/staff/shifts",
                                    label: "Shifts",
                                    icon: Clock3,
                                },
                                {
                                    href: "/manager/staff/attendance",
                                    label: "Attendance",
                                    icon: ClipboardCheck,
                                },
                                {
                                    href: "/manager/staff/leave",
                                    label: "Leave",
                                    icon: Inbox,
                                },
                            ],
                        },
                        {
                            href: "/manager/finance",
                            label: "Finance",
                            icon: Wallet,
                            children: [
                                {
                                    href: "/manager/finance",
                                    label: "Overview",
                                    icon: LayoutDashboard,
                                },
                                {
                                    href: "/manager/finance/cash",
                                    label: "Cash",
                                    icon: Banknote,
                                },
                                {
                                    href: "/manager/finance/closes",
                                    label: "Closes",
                                    icon: ClipboardCheck,
                                },
                                {
                                    href: "/manager/finance/payroll",
                                    label: "Payroll",
                                    icon: HandCoins,
                                },
                            ],
                        },
                        {
                            href: "/manager/waiters",
                            label: "Waiters",
                            icon: UserRound,
                        },
                        {
                            href: "/manager/website",
                            label: "Website",
                            icon: Globe,
                        },
                        {
                            href: "/manager/feedback",
                            label: "Feedback",
                            icon: MessageSquareQuote,
                        },
                    ],
                },
                {
                    title: "Control",
                    items: [
                        {
                            href: "/manager/approvals",
                            label: "Approvals",
                            icon: ClipboardCheck,
                        },
                        {
                            href: "/manager/reports",
                            label: "Reports",
                            icon: ScrollText,
                        },
                        {
                            href: "/manager/audit",
                            label: "Audit",
                            icon: ScrollText,
                        },
                        {
                            href: "/manager/notifications",
                            label: "Notifications",
                            icon: Bell,
                        },
                        {
                            href: "/manager/settings",
                            label: "Settings",
                            icon: Store,
                        },
                    ],
                },
            ];
        case "cashier":
            return [
                {
                    title: "Floor",
                    items: [
                        {
                            href: "/cashier",
                            label: "Dashboard",
                            icon: LayoutDashboard,
                        },
                        {
                            href: "/cashier/notifications",
                            label: "Notifications",
                            icon: Bell,
                        },
                        {
                            href: "/cashier/payments",
                            label: "Payments",
                            icon: Wallet,
                        },
                        {
                            href: "/cashier/bills",
                            label: "Bill requests",
                            icon: ClipboardCheck,
                        },
                        {
                            href: "/cashier/cash-drops",
                            label: "Cash drops",
                            icon: Warehouse,
                        },
                    ],
                },
                {
                    title: "Shift",
                    items: [
                        {
                            href: "/cashier/shift",
                            label: "Shift",
                            icon: Clock3,
                        },
                        {
                            href: "/cashier/leave",
                            label: "My leave",
                            icon: CalendarDays,
                        },
                    ],
                },
                {
                    title: "Close",
                    items: [
                        {
                            href: "/cashier/closed",
                            label: "Closed Bills",
                            icon: ScrollText,
                        },
                        {
                            href: "/cashier/reconciliation",
                            label: "Reconciliation",
                            icon: CreditCard,
                        },
                        {
                            href: "/cashier/daily-close",
                            label: "Daily Close",
                            icon: ClipboardCheck,
                        },
                    ],
                },
            ];
        case "waiter":
            return [
                {
                    title: "Floor",
                    items: [
                        {
                            href: "/waiter/tables",
                            label: "Tables",
                            icon: LayoutGrid,
                        },
                        {
                            href: "/waiter/rooms",
                            label: "Rooms",
                            icon: BedDouble,
                        },
                        {
                            href: "/waiter/outside",
                            label: "Outside",
                            icon: Building2,
                        },
                        {
                            href: "/waiter/ready",
                            label: "Ready",
                            icon: CheckCircle2,
                        },
                        {
                            href: "/waiter/notifications",
                            label: "Notifications",
                            icon: Bell,
                        },
                    ],
                },
                {
                    title: "Shift",
                    items: [
                        {
                            href: "/waiter/shift",
                            label: "Shift",
                            icon: Clock3,
                        },
                        {
                            href: "/waiter/leave",
                            label: "My leave",
                            icon: CalendarDays,
                        },
                        {
                            href: "/waiter/cash",
                            label: "Cash",
                            icon: Wallet,
                        },
                        {
                            href: "/waiter/profile",
                            label: "Profile",
                            icon: UserRound,
                        },
                    ],
                },
            ];
        case "dispatcher":
            return [
                {
                    title: "Calls",
                    items: [
                        {
                            href: "/dispatcher",
                            label: "Board",
                            icon: Phone,
                        },
                        {
                            href: "/dispatcher/notifications",
                            label: "Notifications",
                            icon: Bell,
                        },
                    ],
                },
                {
                    title: "Shift",
                    items: [
                        {
                            href: "/dispatcher/shift",
                            label: "Shift",
                            icon: Clock3,
                        },
                        {
                            href: "/dispatcher/leave",
                            label: "My leave",
                            icon: CalendarDays,
                        },
                        {
                            href: "/dispatcher/cash",
                            label: "Cash",
                            icon: Wallet,
                        },
                        {
                            href: "/dispatcher/profile",
                            label: "Profile",
                            icon: UserRound,
                        },
                    ],
                },
            ];
        case "store_manager":
            return [
                {
                    title: "Warehouse",
                    items: [
                        {
                            href: "/store",
                            label: "Dashboard",
                            icon: LayoutDashboard,
                        },
                        {
                            href: "/store/inventory",
                            label: "Inventory",
                            icon: Package,
                            children: [
                                {
                                    href: "/store/inventory/analytics",
                                    label: "Analytics",
                                    icon: BarChart3,
                                },
                                {
                                    href: "/store/inventory",
                                    label: "Stock & Items",
                                    icon: Boxes,
                                },
                                {
                                    href: "/store/inventory/materials",
                                    label: "Materials",
                                    icon: UtensilsCrossed,
                                },
                                {
                                    href: "/store/inventory/transfers",
                                    label: "Branch Supply",
                                    icon: Truck,
                                },
                                {
                                    href: "/store/inventory/receiving",
                                    label: "Receiving & Audit",
                                    icon: ClipboardCheck,
                                },
                                {
                                    href: "/store/inventory/prep",
                                    label: "Central Prep",
                                    icon: ChefHat,
                                },
                            ],
                        },
                        {
                            href: "/store/notifications",
                            label: "Notifications",
                            icon: Bell,
                        },
                        {
                            href: "/store/leave",
                            label: "My leave",
                            icon: CalendarDays,
                        },
                    ],
                },
            ];
        case "receptionist":
            return [
                {
                    title: "Front desk",
                    items: [
                        {
                            href: "/receptionist",
                            label: "In house",
                            icon: ConciergeBell,
                        },
                    ],
                },
            ];
        case "driver":
            return [
                {
                    title: "Driver",
                    items: [
                        {
                            href: "/driver",
                            label: "Shipments & Transfers",
                            icon: Truck,
                        },
                    ],
                },
            ];
        case "kitchen":
        case "barista":
        case "cakes":
        case "soft_drinks":
            return stationQueueNav(homePathForRole(role));
        default:
            return [];
    }
}

const BAKERY_HIDDEN = new Set([
    "/manager/live",
    "/manager/stations",
    "/manager/tables",
    "/manager/waiters",
    "/manager/inventory",
    "/owner/live",
    "/owner/inventory",
    "/cashier/notifications",
    "/cashier/bills",
    "/cashier/cash-drops",
]);

const WAITER_ROOMS_HREF = "/waiter/rooms";

export type NavOptions = {
    serviceMode?: string | null;
    /** When false, hide waiter Rooms (branch has no hotel rooms). */
    roomsEnabled?: boolean | null;
};

function navForRole(
    role: Role,
    serviceModeOrOptions?: string | null | NavOptions,
    roomsEnabledArg?: boolean | null,
): NavSection[] {
    const options: NavOptions =
        serviceModeOrOptions && typeof serviceModeOrOptions === "object"
            ? serviceModeOrOptions
            : {
                  serviceMode: serviceModeOrOptions,
                  roomsEnabled: roomsEnabledArg,
              };

    let sections = navSectionsForRole(role);

    // Waiter Rooms only when this branch actually has rooms configured.
    if (role === "waiter" && options.roomsEnabled !== true) {
        sections = sections
            .map(section => ({
                ...section,
                items: section.items.filter(
                    item => item.href !== WAITER_ROOMS_HREF,
                ),
            }))
            .filter(section => section.items.length > 0);
    }

    if (options.serviceMode !== "BAKERY") return sections;

    return sections
        .map(section => ({
            ...section,
            title: section.title === "Floor" ? "Counter POS" : section.title,
            items: section.items
                .map(item => {
                    if (item.href === "/cashier/bills") {
                        return {
                            ...item,
                            href: "/cashier/sale",
                            label: "Bakery POS",
                            icon: Store,
                        };
                    }
                    return item;
                })
                .filter(item => !BAKERY_HIDDEN.has(item.href)),
        }))
        .filter(section => section.items.length > 0);
}

export { navForRole };
