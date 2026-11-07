"use client";

import {
    AlertTriangle,
    CheckCircle2,
    Flame,
    Inbox,
    LayoutGrid,
    UtensilsCrossed,
    CalendarDays,
    Boxes,
} from "lucide-react";
import { useGetTenantSiteQuery } from "@/context/services/siteApi";
import { Suspense } from "react";
import {
    parseQueueFilter,
    parseQueueView,
    stationQueueHref,
    type QueueFilter,
} from "@/domains/fulfillment/application/queueFilter";
import { Link, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { StationRole } from "@/domains/identity/domain/role";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { useCurrentStationQueue } from "@/domains/fulfillment/application/useCurrentStationQueue";

const TABS: { key: QueueFilter; label: string; icon: typeof Inbox }[] = [
    { key: "all", label: "All", icon: LayoutGrid },
    { key: "new", label: "New", icon: Inbox },
    { key: "preparing", label: "In progress", icon: Flame },
    { key: "ready", label: "Ready", icon: CheckCircle2 },
    { key: "exceptions", label: "Exceptions", icon: AlertTriangle },
];

export default function StationKdsNav({
    role,
    className,
}: {
    role: StationRole;
    className?: string;
}) {
    return (
        <Suspense fallback={<nav className={cn("h-[72px]", className)} />}>
            <StationKdsNavInner role={role} className={className} />
        </Suspense>
    );
}

function StationKdsNavInner({
    role,
    className,
}: {
    role: StationRole;
    className?: string;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const home = homePathForRole(role);
    const status = parseQueueFilter(searchParams.get("status"));
    const view = parseQueueView(searchParams.get("view"));
    const q = searchParams.get("q") ?? "";
    const onHome = pathname === home;
    const { counts } = useCurrentStationQueue();
    const { data: siteRes } = useGetTenantSiteQuery();
    const site = siteRes?.data;
    const tabCount: Record<QueueFilter, number | null> = {
        all: null,
        new: counts.new,
        preparing: counts.preparing,
        ready: counts.ready,
        exceptions: counts.exceptions,
    };

    return (
        <nav
            className={cn(
                "-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:gap-2",
                className,
            )}
        >
            {/* Queue filter tabs */}
            {TABS.map(tab => {
                const href = stationQueueHref(home, {
                    status: tab.key,
                    q,
                    view,
                });
                const Icon = tab.icon;
                const active = onHome && status === tab.key;
                return (
                    <Link
                        key={tab.key}
                        href={href}
                        className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-[12px] border px-2.5 py-1.5 text-[12px] font-medium sm:gap-2 sm:rounded-[16px] sm:px-3 sm:py-2 sm:text-[13px]",
                            active
                                ? "border-transparent bg-accent text-accent-foreground"
                                : "border-hairline bg-card text-slate-gray",
                        )}
                    >
                        <Icon className="size-3.5 sm:size-4" />
                        <span className="whitespace-nowrap">{tab.label}</span>
                        {tabCount[tab.key] ? (
                            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-medium sm:text-[11px] dark:bg-white/10">
                                {tabCount[tab.key]}
                            </span>
                        ) : null}
                    </Link>
                );
            })}

            {/* Divider between Queue tabs and Station tools */}
            <div className="h-6 w-px bg-border my-auto shrink-0 mx-0.5" />

            {/* Station Menu link */}
            <Link
                href={`${home}/menu`}
                className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-[12px] border px-2.5 py-1.5 text-[12px] font-medium sm:gap-2 sm:rounded-[16px] sm:px-3 sm:py-2 sm:text-[13px]",
                    pathname === `${home}/menu`
                        ? "border-transparent bg-accent text-accent-foreground"
                        : "border-hairline bg-card text-slate-gray hover:text-foreground",
                )}
            >
                <UtensilsCrossed className="size-3.5 sm:size-4" />
                <span className="whitespace-nowrap">Menu</span>
            </Link>

            {/* Returnable Materials link (if feature enabled) */}
            {site?.featureOutsideOrders !== false && (
                <Link
                    href={`${home}/materials`}
                    className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-[12px] border px-2.5 py-1.5 text-[12px] font-medium sm:gap-2 sm:rounded-[16px] sm:px-3 sm:py-2 sm:text-[13px]",
                        pathname === `${home}/materials`
                            ? "border-transparent bg-accent text-accent-foreground"
                            : "border-hairline bg-card text-slate-gray hover:text-foreground",
                    )}
                >
                    <Boxes className="size-3.5 sm:size-4 text-amber-500" />
                    <span className="whitespace-nowrap">Tableware</span>
                </Link>
            )}

            {/* My Leave link */}
            <Link
                href={`${home}/leave`}
                className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-[12px] border px-2.5 py-1.5 text-[12px] font-medium sm:gap-2 sm:rounded-[16px] sm:px-3 sm:py-2 sm:text-[13px]",
                    pathname === `${home}/leave`
                        ? "border-transparent bg-accent text-accent-foreground"
                        : "border-hairline bg-card text-slate-gray hover:text-foreground",
                )}
            >
                <CalendarDays className="size-3.5 sm:size-4" />
                <span className="whitespace-nowrap">Leave</span>
            </Link>
        </nav>
    );
}
