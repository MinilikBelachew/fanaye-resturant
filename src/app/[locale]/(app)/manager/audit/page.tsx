"use client";

import { useMemo, useState } from "react";
import {
    Activity,
    CheckCircle2,
    Clock,
    QrCode,
    Receipt,
    Search,
    Shield,
    User,
    UtensilsCrossed,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    useListAuditEventsQuery,
    type AuditCategory,
} from "@/context/services/auditApi";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | AuditCategory;

export default function ManagerAuditPage() {
    const [selectedCategory, setSelectedCategory] =
        useState<CategoryFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { data, isLoading, isError } = useListAuditEventsQuery(
        {
            category: selectedCategory === "all" ? undefined : selectedCategory,
            q: searchQuery.trim() || undefined,
            limit: 100,
        },
        { pollingInterval: 15000 },
    );

    const events = data?.data ?? [];
    const summary = data?.summary;

    const filteredEvents = useMemo(() => events, [events]);

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Security & Operations"
                title="Audit Trail"
                description="Append-only activity log from live branch events — orders, kitchen tickets, payments, and system actions."
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Logged Events
                        </p>
                        <Activity className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading ? "…" : (summary?.totalToday ?? 0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Captured today
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Payments Logged
                        </p>
                        <QrCode className="size-4 text-amber-600" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {isLoading ? "…" : (summary?.paymentToday ?? 0)}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-emerald-600">
                        Cash, transfer & fiscal
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
                        {isLoading ? "…" : (summary?.fulfillmentToday ?? 0)}
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
                        Append-only storage
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5 rounded-[14px] border border-hairline bg-surface-ivory/50 p-1">
                    {(
                        [
                            { id: "all", label: "All Activity" },
                            { id: "orders", label: "Orders" },
                            { id: "fulfillment", label: "Kitchen & Bar" },
                            { id: "payments", label: "Payments & Tax" },
                            { id: "system", label: "System & Staff" },
                        ] as const
                    ).map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedCategory(tab.id)}
                            className={cn(
                                "rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-all",
                                selectedCategory === tab.id
                                    ? "bg-white font-semibold text-foreground shadow-xs dark:bg-card"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                    <Input
                        placeholder="Search audit actions, staff..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9.5 rounded-[12px] bg-white pl-9 text-[13px] dark:bg-card"
                    />
                </div>
            </div>

            {isError ? (
                <p className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
                    Could not load audit events. Sign in as manager and check
                    the API.
                </p>
            ) : null}

            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-slate-gray">Loading audit trail…</p>
                ) : null}
                {!isLoading && !isError && filteredEvents.length === 0 ? (
                    <div className="rounded-[16px] border border-hairline bg-card p-12 text-center text-slate-gray">
                        <p className="text-[15px] font-medium text-foreground">
                            No audit events found
                        </p>
                        <p className="mt-1 text-[13px]">
                            Try clearing your search or choosing another
                            category. New actions appear here as staff work the
                            floor.
                        </p>
                    </div>
                ) : null}
                {filteredEvents.map(event => (
                    <article
                        key={event.id}
                        className="flex flex-col justify-between gap-4 rounded-[16px] border border-hairline bg-white p-5 shadow-xs transition-all hover:border-slate-300 sm:flex-row sm:items-center dark:bg-card"
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
                                        {event.actionLabel}
                                    </h3>
                                    <Badge variant={event.badgeVariant}>
                                        {event.badgeLabel}
                                    </Badge>
                                </div>

                                {event.details ? (
                                    <p className="mt-1 text-[13px] leading-relaxed text-slate-gray">
                                        {event.details}
                                    </p>
                                ) : null}

                                <div className="mt-2 flex items-center gap-3 text-[12px] text-slate-gray">
                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                        <User className="size-3 text-slate-gray" />
                                        {event.actorName}
                                        <span className="font-normal text-slate-gray">
                                            ({event.actorRole})
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 gap-1 border-t border-hairline pt-2 text-[12px] text-slate-gray sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                            <span className="flex items-center gap-1 font-medium text-slate-gray">
                                <Clock className="size-3" />
                                {event.timestampLabel}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                                Immutable Log ID: {event.id.slice(0, 8)}…
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </DashboardFrame>
    );
}
