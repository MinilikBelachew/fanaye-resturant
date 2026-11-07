"use client";

import { useState } from "react";
import {
    BellRing,
    ChefHat,
    CookingPot,
    LayoutGrid,
    Map,
    User,
} from "lucide-react";
import { useFloorTablesQuery } from "@/context/services/floorApi";
import {
    groupFloorTables,
    tableNumber,
} from "@/domains/floor/application/groupFloor";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { LiveFloorSkeleton } from "@/components/custom/molecules/Skeletons";
import { Link, usePathname } from "@/i18n/navigation";
import type { FloorTable } from "@/domains/floor/domain/floorApi";

type LiveView = "cards" | "map";

function statusTone(table: FloorTable) {
    if (!table.tableSessionId) return "free" as const;
    if ((table.readyItemCount ?? 0) > 0) return "ready" as const;
    if ((table.cookingItemCount ?? 0) > 0) return "cooking" as const;
    return "open" as const;
}

export default function LiveFloorBoard() {
    const tWaiter = useTranslations("waiter");
    const tCommon = useTranslations("common");
    const tLive = useTranslations("liveOps");
    const pathname = usePathname();
    const basePath = pathname.startsWith("/owner/")
        ? "/owner/live"
        : "/manager/live";

    const [view, setView] = useState<LiveView>("cards");
    const { data, isLoading } = useFloorTablesQuery(undefined, {
        pollingInterval: 8000,
    });

    const tables = data?.data ?? [];
    const locations = data?.locations ?? [];
    const open = tables.filter(t => t.tableSessionId);
    const ready = tables.filter(t => (t.readyItemCount ?? 0) > 0);
    const cooking = tables.filter(
        t => (t.cookingItemCount ?? 0) > 0 && (t.readyItemCount ?? 0) === 0,
    );

    if (isLoading) return <LiveFloorSkeleton />;

    return (
        <div className="flex flex-col gap-5">
            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-hairline bg-card px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-[10px] text-slate-gray sm:text-[11px]">
                        Open tables
                    </p>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums text-foreground sm:text-[24px]">
                        {open.length}
                        <span className="ml-1 text-[12px] font-normal text-slate-gray sm:ml-1.5 sm:text-[13px]">
                            / {tables.length}
                        </span>
                    </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-card px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-[10px] text-slate-gray sm:text-[11px]">
                        Cooking
                    </p>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums text-foreground sm:text-[24px]">
                        {cooking.length}
                        <span className="ml-1 text-[12px] font-normal text-slate-gray sm:ml-1.5 sm:text-[13px]">
                            tables
                        </span>
                    </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-card px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-[10px] text-slate-gray sm:text-[11px]">
                        Ready
                    </p>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums text-foreground sm:text-[24px]">
                        {ready.length}
                        <span className="ml-1 text-[12px] font-normal text-slate-gray sm:ml-1.5 sm:text-[13px]">
                            tables
                        </span>
                    </p>
                </div>
            </div>

            {/* View toggle + legend */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Legend — wraps to its own row on mobile */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <LegendDot
                        className="bg-hairline border border-hairline"
                        label="Free"
                    />
                    <LegendDot
                        className="bg-foreground/15 border border-foreground/10"
                        label="Open"
                    />
                    <LegendDot
                        className="bg-amber-300/70 border border-amber-300"
                        label={tWaiter("cooking")}
                    />
                    <LegendDot
                        className="bg-emerald-400/70 border border-emerald-300"
                        label="Ready"
                    />
                </div>
                {/* Toggle — right side on desktop, full-width on mobile */}
                <div className="inline-flex self-start rounded-xl border border-hairline bg-card p-0.5 sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setView("cards")}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                            view === "cards"
                                ? "bg-foreground text-background"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <LayoutGrid className="size-3.5" />
                        {tLive("viewCards")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("map")}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                            view === "map"
                                ? "bg-foreground text-background"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <Map className="size-3.5" />
                        {tLive("viewMap")}
                    </button>
                </div>
            </div>

            {/* Card view */}
            {view === "cards" ? (
                open.length === 0 ? (
                    <EmptyFloor />
                ) : (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                        {open.map(table => (
                            <TableCard
                                key={table.tableId}
                                table={table}
                                href={`${basePath}/${table.tableId}`}
                                labels={{
                                    table: tCommon("table"),
                                    waiter: tCommon("waiter"),
                                    cooking: tWaiter("cooking"),
                                    ready: tWaiter("readyCount"),
                                }}
                            />
                        ))}
                    </div>
                )
            ) : tables.length === 0 ? (
                <EmptyFloor />
            ) : (
                <FloorMapView
                    tables={tables}
                    locations={locations}
                    basePath={basePath}
                    labels={{
                        free: tLive("free"),
                        open: tLive("open"),
                        cooking: tWaiter("cooking"),
                        ready: tWaiter("readyCount"),
                        waiter: tCommon("waiter"),
                    }}
                />
            )}
        </div>
    );
}

function EmptyFloor() {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card text-center">
            <CookingPot className="size-8 text-slate-gray/40" />
            <p className="mt-3 text-[14px] font-medium text-foreground">
                All tables are free
            </p>
            <p className="mt-1 text-[12px] text-slate-gray">
                No active sessions right now
            </p>
        </div>
    );
}

function TableCard({
    table,
    href,
    labels,
}: {
    table: FloorTable;
    href: string;
    labels: {
        table: string;
        waiter: string;
        cooking: string;
        ready: string;
    };
}) {
    const tone = statusTone(table);
    const hasReady = (table.readyItemCount ?? 0) > 0;
    const hasCooking = (table.cookingItemCount ?? 0) > 0;

    return (
        <Link
            href={href}
            className={cn(
                "group flex flex-col gap-2.5 rounded-2xl border p-3 transition-colors hover:border-foreground/20 sm:gap-3 sm:p-4",
                tone === "ready"
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : tone === "cooking"
                      ? "border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/15"
                      : "border-hairline bg-card",
            )}
        >
            {/* Table number + location */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-gray">
                        {labels.table}
                    </p>
                    <p className="mt-0.5 text-[22px] font-semibold leading-none tracking-tight text-foreground sm:text-[26px]">
                        {tableNumber(table)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-gray sm:mt-1.5 sm:text-[12px]">
                        {table.locationName}
                    </p>
                </div>
                <span
                    className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        tone === "ready"
                            ? "bg-emerald-500"
                            : tone === "cooking"
                              ? "bg-amber-500"
                              : "bg-foreground/20",
                    )}
                />
            </div>

            {/* Waiter */}
            <div className="flex items-center gap-1.5 text-[11px] text-foreground/80 sm:text-[12px]">
                <User className="size-3 shrink-0 text-slate-gray sm:size-3.5" />
                <span className="truncate">
                    {table.waiterName ?? labels.waiter}
                </span>
            </div>

            {/* Kitchen status */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline pt-2 sm:pt-2.5">
                {hasCooking && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 sm:px-2 sm:py-1 sm:text-[11px]">
                        <ChefHat className="size-2.5 sm:size-3" />
                        {table.cookingItemCount}
                        <span className="hidden sm:inline">
                            {" "}
                            {labels.cooking}
                        </span>
                    </span>
                )}
                {hasReady && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 sm:px-2 sm:py-1 sm:text-[11px]">
                        <BellRing className="size-2.5 sm:size-3" />
                        {table.readyItemCount}
                        <span className="hidden sm:inline">
                            {" "}
                            {labels.ready}
                        </span>
                    </span>
                )}
                {!hasCooking && !hasReady && (
                    <span className="text-[10px] text-slate-gray sm:text-[11px]">
                        0 · 0
                    </span>
                )}
            </div>
        </Link>
    );
}

function FloorMapView({
    tables,
    locations,
    basePath,
    labels,
}: {
    tables: FloorTable[];
    locations: Parameters<typeof groupFloorTables>[1];
    basePath: string;
    labels: {
        free: string;
        open: string;
        cooking: string;
        ready: string;
        waiter: string;
    };
}) {
    const groups = groupFloorTables(tables, locations);

    return (
        <div className="space-y-4">
            {groups.map(group => {
                const openInGroup = group.tables.filter(
                    t => t.tableSessionId,
                ).length;
                return (
                    <section
                        key={group.location.id}
                        className="rounded-2xl border border-hairline bg-card"
                    >
                        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
                            <h2 className="text-[13px] font-semibold text-foreground">
                                {group.location.name}
                            </h2>
                            <span className="text-[12px] text-slate-gray">
                                {openInGroup}/{group.tables.length}{" "}
                                {labels.open.toLowerCase()}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-5 sm:gap-2 sm:p-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                            {group.tables.map(table => {
                                const tone = statusTone(table);
                                const occupied = Boolean(table.tableSessionId);
                                const cell = (
                                    <div
                                        className={cn(
                                            "flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition-colors",
                                            tone === "ready"
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : tone === "cooking"
                                                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                                  : occupied
                                                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                                                    : "border-hairline bg-secondary/50 text-slate-gray",
                                            occupied &&
                                                "hover:border-foreground/30",
                                        )}
                                    >
                                        <span className="text-[15px] font-semibold leading-none">
                                            {tableNumber(table)}
                                        </span>
                                        <span className="mt-1 max-w-full truncate px-1 text-[9px]">
                                            {occupied
                                                ? (table.waiterName?.split(
                                                      " ",
                                                  )[0] ?? labels.waiter)
                                                : labels.free}
                                        </span>
                                    </div>
                                );

                                if (!occupied) {
                                    return (
                                        <div
                                            key={table.tableId}
                                            className="min-w-0"
                                        >
                                            {cell}
                                        </div>
                                    );
                                }
                                return (
                                    <Link
                                        key={table.tableId}
                                        href={`${basePath}/${table.tableId}`}
                                        className="min-w-0"
                                    >
                                        {cell}
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function LegendDot({ className, label }: { className: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-gray">
            <span className={cn("size-2.5 rounded-full", className)} />
            {label}
        </span>
    );
}
