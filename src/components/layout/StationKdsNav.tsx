"use client";

import {
    AlertTriangle,
    CheckCircle2,
    Flame,
    Inbox,
    LayoutGrid,
} from "lucide-react";
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
        </nav>
    );
}
