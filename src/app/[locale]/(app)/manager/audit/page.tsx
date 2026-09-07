"use client";

import { useMemo, useState } from "react";
import {
    Activity,
    CheckCircle2,
    Clock,
    CreditCard,
    Filter,
    QrCode,
    Receipt,
    Search,
    Shield,
    Store,
    User,
    UtensilsCrossed,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AuditEvent {
    id: string;
    timestamp: string;
    actor: string;
    actorRole: string;
    action: string;
    category: "orders" | "fulfillment" | "payments" | "system";
    details?: string;
    badgeLabel: string;
    badgeVariant: "default" | "success" | "warning" | "secondary";
}

const AUDIT_EVENTS: AuditEvent[] = [
    {
        id: "aud-1",
        timestamp: "Today · 12:46",
        actor: "Karim Tesfaye",
        actorRole: "Waiter",
        action: "TinaVerify QR scan validation initiated",
        category: "payments",
        details: "Fiscal tax QR check submitted for Table 12 bill (ETB 1,480.00)",
        badgeLabel: "Fiscal Check",
        badgeVariant: "warning",
    },
    {
        id: "aud-2",
        timestamp: "Today · 12:44",
        actor: "Yonas Girma",
        actorRole: "Kitchen Cook",
        action: "Marked Cheeseburger (x2) Ready",
        category: "fulfillment",
        details: "Ticket #104 completed in 6m 12s on Kitchen Station",
        badgeLabel: "Dish Ready",
        badgeVariant: "success",
    },
    {
        id: "aud-3",
        timestamp: "Today · 12:41",
        actor: "Karim Tesfaye",
        actorRole: "Waiter",
        action: "Sent 4-item order on Table 12",
        category: "orders",
        details: "Items dispatched to Kitchen (2) and Barista (2)",
        badgeLabel: "Order Sent",
        badgeVariant: "default",
    },
    {
        id: "aud-4",
        timestamp: "Today · 12:35",
        actor: "Sara Mekonnen",
        actorRole: "Cashier",
        action: "Confirmed Telebirr Payment on Table 3",
        category: "payments",
        details: "Transaction ref: TB-9821448 · ETB 720.00 received",
        badgeLabel: "Payment Confirmed",
        badgeVariant: "success",
    },
    {
        id: "aud-5",
        timestamp: "Today · 12:20",
        actor: "Meron Alemu",
        actorRole: "Barista",
        action: "Marked Caramel Macchiato Ready",
        category: "fulfillment",
        details: "Barista station queue completed in 3m 40s",
        badgeLabel: "Dish Ready",
        badgeVariant: "success",
    },
    {
        id: "aud-6",
        timestamp: "Today · 11:58",
        actor: "Hana Tadesse",
        actorRole: "Manager",
        action: "Assigned Tables 1-4 to Karim Tesfaye",
        category: "system",
        details: "Shift section zone allocation updated",
        badgeLabel: "Table Allocation",
        badgeVariant: "secondary",
    },
    {
        id: "aud-7",
        timestamp: "Today · 11:30",
        actor: "Sara Mekonnen",
        actorRole: "Cashier",
        action: "Opened morning cash register drawer",
        category: "payments",
        details: "Opening float balance verified: ETB 2,500.00",
        badgeLabel: "Shift Open",
        badgeVariant: "secondary",
    },
    {
        id: "aud-8",
        timestamp: "Today · 09:14",
        actor: "Hana Tadesse",
        actorRole: "Manager",
        action: "System health check & cloud sync completed",
        category: "system",
        details: "All local offline queues synchronized with cloud database",
        badgeLabel: "System Sync",
        badgeVariant: "secondary",
    },
];

type CategoryFilter = "all" | "orders" | "fulfillment" | "payments" | "system";

export default function ManagerAuditPage() {
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEvents = useMemo(() => {
        return AUDIT_EVENTS.filter(event => {
            if (selectedCategory !== "all" && event.category !== selectedCategory) {
                return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchActor = event.actor.toLowerCase().includes(q);
                const matchAction = event.action.toLowerCase().includes(q);
                const matchRole = event.actorRole.toLowerCase().includes(q);
                const matchDetails = event.details ? event.details.toLowerCase().includes(q) : false;
                if (!matchActor && !matchAction && !matchRole && !matchDetails) {
                    return false;
                }
            }

            return true;
        });
    }, [selectedCategory, searchQuery]);

    return (
        <DashboardFrame>
            {/* Header */}
            <PageHeader
                eyebrow="Security & Operations"
                title="Audit Trail"
                description="Append-only, immutable activity log. Records table orders, kitchen ticket completions, fiscal receipts, and system events."
            />

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Logged Events
                        </p>
                        <Activity className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {AUDIT_EVENTS.length}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Captured today
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Fiscal Scans
                        </p>
                        <QrCode className="size-4 text-purple-600" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        100%
                    </p>
                    <p className="mt-1 text-[12px] text-emerald-600 font-medium">
                        TinaVerify compliant
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Fulfillments Logged
                        </p>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {AUDIT_EVENTS.filter(e => e.category === "fulfillment").length}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Station completions
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Log Integrity
                        </p>
                        <Shield className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-emerald-600">
                        Locked
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Tamper-proof storage
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 rounded-[14px] border border-hairline bg-surface-ivory/50 p-1">
                    {[
                        { id: "all", label: "All Activity" },
                        { id: "orders", label: "Orders" },
                        { id: "fulfillment", label: "Kitchen & Bar" },
                        { id: "payments", label: "Payments & Tax" },
                        { id: "system", label: "System & Staff" },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
                            className={cn(
                                "rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-all",
                                selectedCategory === tab.id
                                    ? "bg-white text-foreground shadow-xs font-semibold dark:bg-card"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-gray" />
                    <Input
                        placeholder="Search audit actions, staff..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9.5 pl-9 rounded-[12px] text-[13px] bg-white dark:bg-card"
                    />
                </div>
            </div>

            {/* Events Timeline List */}
            <div className="space-y-3">
                {filteredEvents.length === 0 ? (
                    <div className="rounded-[16px] border border-hairline bg-card p-12 text-center text-slate-gray">
                        <p className="text-[15px] font-medium text-foreground">
                            No audit events found
                        </p>
                        <p className="mt-1 text-[13px]">
                            Try clearing your search query or choosing another category filter.
                        </p>
                    </div>
                ) : (
                    filteredEvents.map(event => (
                        <article
                            key={event.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[16px] border border-hairline bg-white p-5 shadow-xs transition-all hover:border-slate-300 dark:bg-card"
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-slate-gray">
                                    {event.category === "orders" ? (
                                        <UtensilsCrossed className="size-4 text-primary" />
                                    ) : event.category === "fulfillment" ? (
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                    ) : event.category === "payments" ? (
                                        <Receipt className="size-4 text-amber-600" />
                                    ) : (
                                        <Shield className="size-4 text-blue-600" />
                                    )}
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-[14px] font-semibold text-foreground">
                                            {event.action}
                                        </h3>
                                        <Badge variant={event.badgeVariant}>
                                            {event.badgeLabel}
                                        </Badge>
                                    </div>

                                    {event.details && (
                                        <p className="mt-1 text-[13px] text-slate-gray leading-relaxed">
                                            {event.details}
                                        </p>
                                    )}

                                    <div className="mt-2 flex items-center gap-3 text-[12px] text-slate-gray">
                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                            <User className="size-3 text-slate-gray" />
                                            {event.actor}
                                            <span className="text-slate-gray font-normal">
                                                ({event.actorRole})
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex sm:flex-col sm:items-end shrink-0 gap-1 text-[12px] text-slate-gray border-t sm:border-t-0 pt-2 sm:pt-0 border-hairline">
                                <span className="flex items-center gap-1 font-medium text-slate-gray">
                                    <Clock className="size-3" />
                                    {event.timestamp}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                    Immutable Log ID: {event.id}
                                </span>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </DashboardFrame>
    );
}
