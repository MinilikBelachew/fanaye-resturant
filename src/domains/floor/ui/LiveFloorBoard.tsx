"use client";

import { useState } from "react";
import { CookingPot, LayoutGrid, Map, User } from "lucide-react";
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
    const open = tables.filter(table => table.tableSessionId);

    if (isLoading) {
        return <LiveFloorSkeleton />;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-muted-foreground">
                    {tLive("openCount", { count: open.length })}
                    <span className="mx-1.5 text-border">·</span>
                    {tLive("totalCount", { count: tables.length })}
                </p>
                <div className="inline-flex rounded-lg border border-border p-0.5">
                    <button
                        type="button"
                        onClick={() => setView("cards")}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] transition-colors",
                            view === "cards"
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <LayoutGrid className="size-3.5" />
                        {tLive("viewCards")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("map")}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] transition-colors",
                            view === "map"
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Map className="size-3.5" />
                        {tLive("viewMap")}
                    </button>
                </div>
            </div>

            {view === "cards" ? (
                open.length === 0 ? (
                    <EmptyState
                        title={tWaiter("noActiveSessions")}
                        body={tWaiter("allTablesFree")}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                <EmptyState
                    title={tLive("noTables")}
                    body={tLive("noTablesHint")}
                />
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

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-xl border border-border px-6 py-10 text-center">
            <p className="text-[14px] text-foreground">{title}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{body}</p>
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

    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col justify-between rounded-xl border px-4 py-3.5 transition-colors hover:border-foreground/25",
                tone === "ready"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : tone === "cooking"
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-border bg-background",
            )}
        >
            <div>
                <p className="text-[11px] tracking-wide text-muted-foreground">
                    {labels.table}
                </p>
                <p className="mt-0.5 text-[22px] tracking-tight text-foreground">
                    {tableNumber(table)}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                    {table.locationName}
                </p>
            </div>
            <div className="mt-3 space-y-1 text-[12px] text-muted-foreground">
                <p className="flex items-center gap-1.5">
                    <User className="size-3.5 shrink-0" />
                    <span className="truncate text-foreground/80">
                        {table.waiterName ?? labels.waiter}
                    </span>
                </p>
                <p className="flex items-center gap-1.5">
                    <CookingPot className="size-3.5 shrink-0" />
                    {table.cookingItemCount} {labels.cooking} ·{" "}
                    {table.readyItemCount} {labels.ready}
                </p>
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
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <LegendDot className="bg-muted" label={labels.free} />
                <LegendDot className="bg-foreground/15" label={labels.open} />
                <LegendDot className="bg-amber-300/80" label={labels.cooking} />
                <LegendDot className="bg-emerald-400/80" label={labels.ready} />
            </div>

            {groups.map(group => (
                <section
                    key={group.location.id}
                    className="rounded-xl border border-border px-4 py-4"
                >
                    <div className="mb-3 flex items-baseline justify-between gap-2">
                        <h2 className="text-[13px] tracking-wide text-foreground">
                            {group.location.name}
                        </h2>
                        <span className="text-[11px] text-muted-foreground">
                            {group.tables.filter(t => t.tableSessionId).length}/
                            {group.tables.length} {labels.open.toLowerCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                        {group.tables.map(table => {
                            const tone = statusTone(table);
                            const occupied = Boolean(table.tableSessionId);
                            const inner = (
                                <div
                                    className={cn(
                                        "flex aspect-square flex-col items-center justify-center rounded-lg border px-1.5 text-center transition-colors",
                                        tone === "ready"
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                            : tone === "cooking"
                                              ? "border-amber-300 bg-amber-50 text-amber-900"
                                              : occupied
                                                ? "border-foreground/20 bg-foreground/[0.04] text-foreground"
                                                : "border-border bg-muted/40 text-muted-foreground",
                                        occupied &&
                                            "hover:border-foreground/35",
                                    )}
                                >
                                    <span className="text-[15px] tracking-tight">
                                        {tableNumber(table)}
                                    </span>
                                    {occupied ? (
                                        <span className="mt-0.5 max-w-full truncate text-[9px] text-muted-foreground">
                                            {table.waiterName?.split(" ")[0] ??
                                                labels.waiter}
                                        </span>
                                    ) : (
                                        <span className="mt-0.5 text-[9px]">
                                            {labels.free}
                                        </span>
                                    )}
                                </div>
                            );

                            if (!occupied) {
                                return (
                                    <div
                                        key={table.tableId}
                                        className="min-w-0"
                                    >
                                        {inner}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={table.tableId}
                                    href={`${basePath}/${table.tableId}`}
                                    className="min-w-0"
                                >
                                    {inner}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}

function LegendDot({ className, label }: { className: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", className)} />
            {label}
        </span>
    );
}
