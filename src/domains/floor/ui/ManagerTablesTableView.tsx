"use client";

import React from "react";
import Image from "next/image";
import {
    BellRing,
    ChefHat,
    ChevronRight,
    Sparkles,
    User,
    Users,
} from "lucide-react";
import type {
    FloorLocation,
    FloorTable,
} from "@/domains/floor/domain/floorApi";
import { groupFloorTables } from "@/domains/floor/application/groupFloor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ManagerTablesTableViewProps {
    tables: FloorTable[];
    locations: FloorLocation[];
    onSelectTable: (tableId: string) => void;
    labels: {
        table: string;
        location: string;
        status: string;
        server: string;
        orderStatus: string;
        guests: string;
        action: string;
        viewDetail: string;
        available: string;
        occupied: string;
        vipBadge: string;
        unassigned: string;
    };
}

export function ManagerTablesTableView({
    tables,
    locations,
    onSelectTable,
    labels,
}: ManagerTablesTableViewProps) {
    const groups = groupFloorTables(tables, locations);

    if (tables.length === 0) {
        return (
            <div className="rounded-[18px] border border-hairline bg-card p-12 text-center">
                <p className="text-[14px] text-slate-gray">No tables found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {groups.map(group => {
                if (group.tables.length === 0) return null;

                return (
                    <div
                        key={group.location.id}
                        className="overflow-hidden rounded-[18px] border border-hairline bg-card shadow-xs"
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-hairline bg-secondary/30 px-5 py-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[14px] font-bold text-foreground">
                                    {group.location.name}
                                </h3>
                                {group.location.isVip ? (
                                    <Badge
                                        variant="outline"
                                        className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 px-1.5 py-0 text-[10px]"
                                    >
                                        <Sparkles className="size-2.5" /> VIP
                                    </Badge>
                                ) : null}
                            </div>
                            <span className="text-[12px] font-medium text-slate-gray">
                                {group.tables.length} tables
                            </span>
                        </div>

                        {/* Table Layout */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-[13px]">
                                <thead>
                                    <tr className="border-b border-hairline/60 bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                        <th className="px-5 py-3">
                                            {labels.table}
                                        </th>
                                        <th className="px-4 py-3">
                                            {labels.status}
                                        </th>
                                        <th className="px-4 py-3">
                                            {labels.server}
                                        </th>
                                        <th className="px-4 py-3">
                                            {labels.orderStatus}
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            {labels.guests}
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            {labels.action}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline/50">
                                    {group.tables.map(table => {
                                        const occupied = Boolean(
                                            table.tableSessionId,
                                        );
                                        const waiter = occupied
                                            ? table.waiterName
                                            : table.assignedWaiterName;

                                        const waiterInitials = waiter
                                            ? waiter
                                                  .split(" ")
                                                  .filter(Boolean)
                                                  .map(p => p[0])
                                                  .slice(0, 2)
                                                  .join("")
                                                  .toUpperCase()
                                            : null;

                                        const tableNum = table.displayNumber
                                            ? `#${table.displayNumber}`
                                            : table.displayName;

                                        return (
                                            <tr
                                                key={table.tableId}
                                                onClick={() =>
                                                    onSelectTable(table.tableId)
                                                }
                                                className="group cursor-pointer transition-colors hover:bg-secondary/40"
                                            >
                                                {/* 1. TABLE COLUMN */}
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-neutral-900 shadow-2xs">
                                                            <Image
                                                                src="/images/dining_table_round.jpg"
                                                                alt={
                                                                    table.displayName
                                                                }
                                                                fill
                                                                sizes="40px"
                                                                className="object-cover object-center"
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-foreground">
                                                                    {tableNum}
                                                                </span>
                                                                {table.effectiveVip ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0 text-[9px] font-semibold"
                                                                    >
                                                                        VIP
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                            {table.displayNumber ? (
                                                                <p className="truncate text-[11px] text-slate-gray">
                                                                    {
                                                                        table.displayName
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. STATUS COLUMN */}
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            occupied
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        className={cn(
                                                            "gap-1.5 px-2.5 py-0.5 text-[11px] font-medium",
                                                            !occupied &&
                                                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "size-1.5 rounded-full",
                                                                occupied
                                                                    ? "bg-primary animate-pulse"
                                                                    : "bg-emerald-500",
                                                            )}
                                                        />
                                                        {occupied
                                                            ? labels.occupied
                                                            : labels.available}
                                                    </Badge>
                                                </td>

                                                {/* 3. SERVER COLUMN */}
                                                <td className="px-4 py-3">
                                                    {waiter ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                                                                {waiterInitials}
                                                            </span>
                                                            <span className="truncate font-medium text-foreground">
                                                                {waiter}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[12px] text-amber-700 dark:text-amber-400">
                                                            <User className="size-3" />
                                                            {labels.unassigned}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 4. ORDER / KITCHEN PROGRESS COLUMN */}
                                                <td className="px-4 py-3">
                                                    {table.readyItemCount >
                                                    0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            <BellRing className="size-3 animate-bounce" />
                                                            <span>
                                                                {
                                                                    table.readyItemCount
                                                                }{" "}
                                                                ready
                                                            </span>
                                                        </span>
                                                    ) : table.cookingItemCount >
                                                      0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                            <ChefHat className="size-3" />
                                                            <span>
                                                                {
                                                                    table.cookingItemCount
                                                                }{" "}
                                                                cooking
                                                            </span>
                                                        </span>
                                                    ) : occupied ? (
                                                        <span className="text-[12px] font-medium text-slate-gray">
                                                            Seated
                                                        </span>
                                                    ) : (
                                                        <span className="text-[12px] text-slate-gray">
                                                            Ready for seating
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 5. GUESTS COLUMN */}
                                                <td className="px-4 py-3 text-center">
                                                    {table.guestCount ? (
                                                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                                            <Users className="size-3 text-slate-gray" />
                                                            {table.guestCount}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-gray">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 6. ACTION COLUMN */}
                                                <td className="px-5 py-3 text-right">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="gap-1 font-semibold text-primary hover:text-primary hover:bg-primary/10"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            onSelectTable(
                                                                table.tableId,
                                                            );
                                                        }}
                                                    >
                                                        {labels.viewDetail}
                                                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ManagerTablesTableView;
