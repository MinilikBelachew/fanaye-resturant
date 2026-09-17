import type { LucideIcon } from "lucide-react";
import {
    Activity,
    AlertTriangle,
    Bell,
    BookOpen,
    Building2,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    CreditCard,
    Flag,
    Flame,
    Globe,
    Inbox,
    LayoutDashboard,
    LayoutGrid,
    QrCode,
    Radio,
    ScrollText,
    Store,
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
                {
                    href: `${home}?status=new`,
                    label: "New",
                    icon: Inbox,
                    filter: "new",
                    badgeKey: "new",
                },
                {
                    href: `${home}?status=preparing`,
                    label: "In progress",
                    icon: Flame,
                    filter: "preparing",
                    badgeKey: "preparing",
                },
                {
                    href: `${home}?status=ready`,
                    label: "Ready",
                    icon: CheckCircle2,
                    filter: "ready",
                    badgeKey: "ready",
                },
                {
                    href: `${home}?status=exceptions`,
                    label: "Exceptions",
                    icon: AlertTriangle,
                    filter: "exceptions",
                    badgeKey: "exceptions",
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

export function navForRole(role: Role): NavSection[] {
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
                            href: "/super-admin/staff",
                            label: "Staff Directory",
                            icon: Users,
                        },
                        {
                            href: "/super-admin/flags",
                            label: "Feature Flags",
                            icon: Flag,
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
                            href: "/owner/reports",
                            label: "Reports",
                            icon: ScrollText,
                        },
                        {
                            href: "/owner/daily-close",
                            label: "Daily Close",
                            icon: ClipboardCheck,
                        },
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
                            ],
                        },
                        {
                            href: "/manager/stations",
                            label: "Stations",
                            icon: Warehouse,
                        },
                        {
                            href: "/manager/tables",
                            label: "Tables",
                            icon: Store,
                        },
                        {
                            href: "/manager/staff",
                            label: "Staff",
                            icon: Users,
                        },
                        {
                            href: "/manager/website",
                            label: "Website",
                            icon: Globe,
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
                            href: "/manager/daily-close",
                            label: "Daily Close",
                            icon: Wallet,
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
        case "kitchen":
        case "barista":
        case "cakes":
        case "soft_drinks":
            return stationQueueNav(homePathForRole(role));
        default:
            return [];
    }
}
