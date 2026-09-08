"use client";

import { useMemo, useState } from "react";
import { User } from "lucide-react";
import { useFloorTablesQuery } from "@/context/services/floorApi";
import type { FloorTable } from "@/domains/floor/domain/floorApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import FloorLocationSections from "@/domains/floor/ui/FloorLocationSections";
import FloorTableCard from "@/domains/floor/ui/FloorTableCard";
import { cn } from "@/lib/utils";
import TableInspectionSheet from "./TableInspectionSheet";

export default function ManagerTablesBoard() {
    const { data, isLoading, isError } = useFloorTablesQuery();
    const tables = data?.data ?? [];
    const locations = data?.locations ?? [];

    const [statusFilter, setStatusFilter] = useState<
        "all" | "occupied" | "available"
    >("all");
    const [waiterFilter, setWaiterFilter] = useState("all");
    const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);

    const stats = useMemo(() => {
        const occupied = tables.filter(table => table.tableSessionId);
        const waiters = new Set(
            occupied
                .map(table => table.primaryWaiterMembershipId)
                .filter(Boolean),
        );
        return {
            total: tables.length,
            occupiedCount: occupied.length,
            availableCount: tables.length - occupied.length,
            occupancyRate:
                tables.length > 0
                    ? Math.round((occupied.length / tables.length) * 100)
                    : 0,
            totalGuests: occupied.reduce(
                (sum, table) => sum + (table.guestCount ?? 0),
                0,
            ),
            activeWaitersCount: waiters.size,
        };
    }, [tables]);

    const waiterOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const table of tables) {
            if (table.assignedWaiterMembershipId && table.assignedWaiterName) {
                map.set(
                    table.assignedWaiterMembershipId,
                    table.assignedWaiterName,
                );
            }
            if (table.primaryWaiterMembershipId && table.waiterName) {
                map.set(table.primaryWaiterMembershipId, table.waiterName);
            }
        }
        return [...map.entries()].map(([id, name]) => ({ id, name }));
    }, [tables]);

    const filteredTables = tables.filter(table => {
        const occupied = Boolean(table.tableSessionId);
        if (statusFilter === "occupied" && !occupied) return false;
        if (statusFilter === "available" && occupied) return false;
        if (waiterFilter !== "all") {
            return (
                table.assignedWaiterMembershipId === waiterFilter ||
                table.primaryWaiterMembershipId === waiterFilter
            );
        }
        return true;
    });

    if (isLoading) {
        return <p className="text-slate-gray">Loading floor…</p>;
    }
    if (isError) {
        return <p className="text-red-600">Could not load tables.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[13px] font-medium text-slate-gray">
                        Occupied Tables
                    </p>
                    <p className="mt-2 text-[26px] font-semibold">
                        {stats.occupiedCount}{" "}
                        <span className="text-[16px] font-normal text-slate-gray">
                            / {stats.total}
                        </span>
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        {stats.occupancyRate}% full
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[13px] font-medium text-slate-gray">
                        Available Tables
                    </p>
                    <p className="mt-2 text-[26px] font-semibold">
                        {stats.availableCount}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Waiters on Floor
                        </p>
                        <User className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold">
                        {stats.activeWaitersCount}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card p-4">
                    <p className="text-[13px] font-medium text-slate-gray">
                        Guests seated
                    </p>
                    <p className="mt-2 text-[26px] font-semibold text-primary">
                        {stats.totalGuests}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Running tabs come with orders
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[16px] border border-hairline bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {(
                        [
                            ["all", `All Tables (${stats.total})`],
                            ["occupied", `Occupied (${stats.occupiedCount})`],
                            ["available", `Available (${stats.availableCount})`],
                        ] as const
                    ).map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setStatusFilter(id)}
                            className={cn(
                                "rounded-full px-3.5 py-1.5 text-[12px] font-semibold",
                                statusFilter === id
                                    ? "bg-foreground text-background"
                                    : "text-slate-gray hover:bg-secondary",
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <select
                    value={waiterFilter}
                    onChange={e => setWaiterFilter(e.target.value)}
                    className="rounded-full border border-hairline bg-surface-ivory px-3 py-1.5 text-[12px] font-medium outline-none"
                >
                    <option value="all">All servers</option>
                    {waiterOptions.map(waiter => (
                        <option key={waiter.id} value={waiter.id}>
                            {waiter.name}
                        </option>
                    ))}
                </select>
            </div>

            <FloorLocationSections
                tables={filteredTables}
                locations={locations}
                renderTable={table => {
                    const occupied = Boolean(table.tableSessionId);
                    const footerLeft = !occupied
                        ? "Available"
                        : table.readyItemCount > 0
                          ? `${table.readyItemCount} ready`
                          : table.cookingItemCount > 0
                            ? `${table.cookingItemCount} cooking`
                            : table.sessionStatus ?? "Open";

                    return (
                        <FloorTableCard
                            key={table.tableId}
                            tableNumber={tableNumber(table)}
                            location={table.locationName}
                            badge={
                                occupied
                                    ? { label: "Occupied", tone: "occupied" }
                                    : { label: "Available", tone: "available" }
                            }
                            waiter={
                                occupied
                                    ? table.waiterName
                                    : table.assignedWaiterName
                            }
                            note={
                                occupied
                                    ? null
                                    : table.assignedWaiterName
                                      ? `Assigned · ${table.assignedWaiterName}`
                                      : "No waiter assigned"
                            }
                            total={null}
                            footerLeft={footerLeft}
                            footerAction="Inspect →"
                            onClick={() => setSelectedTable(table)}
                        />
                    );
                }}
            />

            <TableInspectionSheet
                table={selectedTable}
                isOpen={Boolean(selectedTable)}
                onClose={() => setSelectedTable(null)}
            />
        </div>
    );
}
