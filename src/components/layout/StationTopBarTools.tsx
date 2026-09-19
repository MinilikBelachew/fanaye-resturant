"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Bell, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/context/hooks";
import { stationQueueHref } from "@/domains/fulfillment/application/queueFilter";
import { useCurrentStationQueue } from "@/domains/fulfillment/application/useCurrentStationQueue";
import {
    homePathForRole,
    stationOrderPath,
} from "@/domains/identity/application/homePath";
import { isStationRole } from "@/domains/identity/domain/role";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Input } from "@/components/ui/input";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StationTopBarTools({
    className,
    search = true,
    notify = true,
}: {
    className?: string;
    search?: boolean;
    notify?: boolean;
}) {
    return (
        <Suspense fallback={<div className={cn("h-8", className)} />}>
            <StationTopBarToolsInner
                className={className}
                search={search}
                notify={notify}
            />
        </Suspense>
    );
}

function StationTopBarToolsInner({
    className,
    search = true,
    notify = true,
}: {
    className?: string;
    search?: boolean;
    notify?: boolean;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tStations = useTranslations("stations");
    const tCommon = useTranslations("common");
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const station = staff && isStationRole(staff.role) ? staff.role : null;
    const home = station ? homePathForRole(station) : "";
    const isQueueHome = Boolean(station && pathname === home);

    const { tickets, counts } = useCurrentStationQueue();
    const incoming = tickets.filter(
        ticket => ticket.state === "QUEUED" || ticket.state === "ACKNOWLEDGED",
    );
    const urlQuery = searchParams.get("q") ?? "";
    const [query, setQuery] = useState(urlQuery);

    useEffect(() => {
        setQuery(urlQuery);
    }, [urlQuery]);

    useEffect(() => {
        if (!isQueueHome || !search) return;
        const timer = window.setTimeout(() => {
            const next = query.trim();
            if (next === urlQuery) return;
            const params = new URLSearchParams(searchParams.toString());
            if (next) params.set("q", next);
            else params.delete("q");
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [isQueueHome, pathname, query, router, search, searchParams, urlQuery]);

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (!panelRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, []);

    if (!station || !isQueueHome) return null;

    return (
        <div className={cn("flex min-w-0 items-center gap-2", className)}>
            {search ? (
                <label className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-gray" />
                    <Input
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder={tStations("searchPlaceholder")}
                        className="h-8 rounded-md border-hairline bg-transparent pl-9"
                        aria-label={tStations("searchAria")}
                    />
                </label>
            ) : null}
            {notify ? (
                <div className="relative shrink-0" ref={panelRef}>
                    <button
                        type="button"
                        className="relative flex size-8 items-center justify-center rounded-md text-slate-gray hover:bg-secondary hover:text-foreground"
                        aria-label={tStations("newOrders")}
                        onClick={() => setOpen(current => !current)}
                    >
                        <Bell className="size-4" />
                        {counts.new > 0 ? (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                                {counts.new}
                            </span>
                        ) : null}
                    </button>
                    {open ? (
                        <div className="absolute top-[calc(100%+8px)] right-0 z-50 w-[min(90vw,320px)] overflow-hidden rounded-[16px] border border-hairline bg-card shadow-subtle">
                            <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                                <p className="text-[13px] font-semibold">
                                    {tStations("newOrders")}
                                </p>
                                <Link
                                    href={stationQueueHref(home, {
                                        status: "new",
                                        q: urlQuery,
                                        view:
                                            searchParams.get("view") === "table"
                                                ? "table"
                                                : "cards",
                                    })}
                                    className="text-[12px] font-medium text-brand"
                                    onClick={() => setOpen(false)}
                                >
                                    {tStations("viewAll")}
                                </Link>
                            </div>
                            {incoming.length === 0 ? (
                                <p className="px-3 py-6 text-center text-[13px] text-slate-gray">
                                    {tStations("noNewTickets")}
                                </p>
                            ) : (
                                <ul className="max-h-72 overflow-y-auto">
                                    {incoming.map(ticket => (
                                        <li key={ticket.orderItemId}>
                                            <Link
                                                href={stationOrderPath(
                                                    station,
                                                    ticket.orderItemId,
                                                )}
                                                className="block px-3 py-2.5 hover:bg-secondary"
                                                onClick={() => setOpen(false)}
                                            >
                                                <p className="text-[14px] font-medium">
                                                    {ticket.quantity}×{" "}
                                                    {ticket.itemName}
                                                </p>
                                                <p className="text-[12px] text-slate-gray">
                                                    {tCommon("table")}{" "}
                                                    {ticket.tableDisplayName}
                                                </p>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
