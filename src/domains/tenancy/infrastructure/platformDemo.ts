import type { Tenant } from "../domain/tenant";

export interface PlatformTenant extends Tenant {
    logo: string;
    city: string;
    area: string;
    address: string;
    phone: string;
    email: string;
    manager: string;
    hours: string;
    staffCount: number;
    tableCount: number;
    branches: number;
    gmvToday: number;
    concept: string;
    provisionedAt: string;
}

export const PLATFORM_TENANTS: PlatformTenant[] = [
    {
        id: "tenant-fanaye",
        name: "Fanaye Restaurant",
        plan: "pro",
        active: true,
        logo: "/media/logos/fanaye.svg",
        city: "Addis Ababa",
        area: "Bole",
        address: "Bole Road, next to Edna Mall, Addis Ababa",
        phone: "+251 11 667 2100",
        email: "hello@fanaye.et",
        manager: "Hiwot Bekele",
        hours: "10:00 – 23:00",
        staffCount: 24,
        tableCount: 16,
        branches: 1,
        gmvToday: 38720,
        concept: "Casual dining",
        provisionedAt: "12 Mar 2026",
    },
    {
        id: "tenant-buna",
        name: "Buna House",
        plan: "starter",
        active: true,
        logo: "/media/logos/buna.svg",
        city: "Adama",
        area: "Downtown",
        address: "Main Street 48, Adama",
        phone: "+251 22 111 4450",
        email: "team@bunahouse.et",
        manager: "Yonas Alemu",
        hours: "07:00 – 20:00",
        staffCount: 8,
        tableCount: 10,
        branches: 1,
        gmvToday: 12440,
        concept: "Cafe",
        provisionedAt: "2 Jun 2026",
    },
    {
        id: "tenant-oven",
        name: "Oven & Vine",
        plan: "enterprise",
        active: true,
        logo: "/media/logos/oven.svg",
        city: "Bahir Dar",
        area: "Lakeside",
        address: "Lake Avenue 12, Bahir Dar",
        phone: "+251 58 220 9012",
        email: "ops@ovenandvine.et",
        manager: "Marta Tadesse",
        hours: "11:00 – 00:00",
        staffCount: 61,
        tableCount: 42,
        branches: 3,
        gmvToday: 51280,
        concept: "Multi-branch dining",
        provisionedAt: "18 Jan 2026",
    },
    {
        id: "tenant-lake",
        name: "Lake Terrace",
        plan: "pro",
        active: false,
        logo: "/media/logos/lake.svg",
        city: "Hawassa",
        area: "Boardwalk",
        address: "Boardwalk Plaza, Hawassa",
        phone: "+251 46 220 1188",
        email: "desk@laketerrace.et",
        manager: "Samuel Girma",
        hours: "12:00 – 22:00",
        staffCount: 18,
        tableCount: 22,
        branches: 2,
        gmvToday: 0,
        concept: "Lakeside restaurant",
        provisionedAt: "9 Nov 2025",
    },
];

export function getPlatformTenant(id: string) {
    return PLATFORM_TENANTS.find(tenant => tenant.id === id) ?? null;
}

export const PLATFORM_PLANS = [
    {
        id: "starter",
        name: "Starter",
        price: "ETB 2,400 / mo",
        seats: "1 branch · 8 staff",
        features: ["Waiter + Kitchen", "Cash collection", "Daily close"],
    },
    {
        id: "pro",
        name: "Pro",
        price: "ETB 6,800 / mo",
        seats: "3 branches · 40 staff",
        features: [
            "All four stations",
            "TinaVerify",
            "Manager approvals",
            "Live ops",
        ],
        current: true,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Custom",
        seats: "Unlimited branches",
        features: [
            "Multi-brand",
            "Priority support",
            "Feature flags",
            "Audit export",
        ],
    },
];

export const FEATURE_FLAGS = [
    {
        key: "tinaverify",
        name: "TinaVerify transfers",
        enabled: true,
        scope: "Platform",
    },
    {
        key: "barista",
        name: "Barista station",
        enabled: true,
        scope: "Pro+",
    },
    {
        key: "cakes",
        name: "Cakes station",
        enabled: true,
        scope: "Pro+",
    },
    {
        key: "soft_drinks",
        name: "Soft drinks station",
        enabled: true,
        scope: "Pro+",
    },
    {
        key: "qr_guest",
        name: "Guest QR ordering",
        enabled: false,
        scope: "Deferred",
    },
];

export const SUPPORT_TICKETS = [
    {
        id: "SUP-1042",
        tenant: "Fanaye Restaurant",
        topic: "TinaVerify pending on Table 12",
        status: "Open",
        priority: "High",
    },
    {
        id: "SUP-1038",
        tenant: "Oven & Vine",
        topic: "Need a third branch seat",
        status: "Waiting",
        priority: "Medium",
    },
    {
        id: "SUP-1021",
        tenant: "Buna House",
        topic: "Reset manager PIN",
        status: "Resolved",
        priority: "Low",
    },
];

export const PLATFORM_AUDIT = [
    {
        at: "Today · 09:14",
        actor: "Selam Bekele",
        action: "Activated tenant Oven & Vine",
    },
    {
        at: "Today · 08:02",
        actor: "System",
        action: "Pro plan renewal · Fanaye Restaurant",
    },
    {
        at: "Yesterday · 18:40",
        actor: "Selam Bekele",
        action: "Disabled QR guest ordering flag",
    },
    {
        at: "Yesterday · 11:20",
        actor: "Support",
        action: "Opened authorized support session · Buna House",
    },
];
