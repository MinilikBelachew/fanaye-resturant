"use client";

import { useMemo, useState } from "react";
import { User } from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import type { DiningTable } from "@/domains/floor/domain/table";
import FloorTableCard from "@/domains/floor/ui/FloorTableCard";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import TableInspectionSheet from "./TableInspectionSheet";

export default function ManagerTablesBoard() {
    const tables = useAppSelector(state => state.ops.tables);
    const sessions = useAppSelector(state => state.ops.sessions);
    const items = useAppSelector(state => state.ops.items);
    const staffMembers = useAppSelector(
        state => state.identity.staffMembers ?? DEMO_STAFF,
    );

    const [statusFilter, setStatusFilter] = useState<"all" | "occupied" | "available">("all");
    const [waiterFilter, setWaiterFilter] = useState<string>("all");
    const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);

    // Compute floor statistics
    const stats = useMemo(() => {
        let occupiedCount = 0;
        let availableCount = 0;
        let totalGuests = 0;
        let totalRunningBill = 0;
        const activeWaiterIds = new Set<string>();

        tables.forEach(table => {
            const session = sessions.find(s => s.id === table.currentSessionId);
            const isOcc = Boolean(session && table.status !== "available");

            if (isOcc && session) {
                occupiedCount++;
                totalGuests += session.guestCount || table.seats;
                activeWaiterIds.add(session.waiterId);

                const sessionItems = items.filter(
                    i => i.sessionId === session.id && i.status !== "draft",
                );
                const tableTotal = sessionItems.reduce(
                    (sum, i) => sum + i.unitPrice * i.quantity,
                    0,
                );
                totalRunningBill += tableTotal;
            } else {
                availableCount++;
            }
        });

        return {
            total: tables.length,
            occupiedCount,
            availableCount,
            occupancyRate:
                tables.length > 0
                    ? Math.round((occupiedCount / tables.length) * 100)
                    : 0,
            totalGuests,
            activeWaitersCount: activeWaiterIds.size,
            totalRunningBill,
        };
    }, [tables, sessions, items]);

    // Filter tables
    const filteredTables = useMemo(() => {
        return tables.filter(table => {
            const session = sessions.find(s => s.id === table.currentSessionId);
            const isOcc = Boolean(session && table.status !== "available");

            if (statusFilter === "occupied" && !isOcc) return false;
            if (statusFilter === "available" && isOcc) return false;

            if (waiterFilter !== "all") {
                if (isOcc && session) {
                    if (session.waiterId !== waiterFilter) return false;
                } else {
                    const assignedWaiter = staffMembers.find(
                        s => s.assignedTableIds?.includes(table.id),
                    );
                    if (assignedWaiter?.id !== waiterFilter) return false;
                }
            }

            return true;
        });
    }, [tables, sessions, statusFilter, waiterFilter, staffMembers]);

    // Selected table's session and items
    const selectedSession = selectedTable
        ? sessions.find(s => s.id === selectedTable.currentSessionId) || null
        : null;

    const waiterStaffList = staffMembers.filter(
        s => s.role === "waiter" || s.role === "manager",
    );

    return (
        <div className="space-y-6">
            {/* 1. Floor Summary Cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Occupied Tables
                        </p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {stats.occupancyRate}% Full
                        </span>
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {stats.occupiedCount} <span className="text-[16px] font-normal text-slate-gray">/ {stats.total}</span>
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Active dining sessions
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Available Tables
                        </p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Ready
                        </span>
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {stats.availableCount}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Clean & ready for orders
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Waiters on Floor
                        </p>
                        <User className="size-4 text-slate-gray" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-foreground">
                        {stats.activeWaitersCount} <span className="text-[16px] font-normal text-slate-gray">Staff</span>
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Managing active tables
                    </p>
                </div>

                <div className="rounded-[16px] border border-hairline bg-card p-4 transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-slate-gray">
                            Running Floor Bill
                        </p>
                        <span className="size-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <p className="mt-2 text-[26px] font-semibold text-primary">
                        {formatEtb(stats.totalRunningBill)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Active open tabs total
                    </p>
                </div>
            </div>

            {/* 2. Interactive Filter & View Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[16px] border border-hairline bg-card p-3">
                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className={cn(
                            "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                            statusFilter === "all"
                                ? "bg-foreground text-background"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        All Tables ({stats.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter("occupied")}
                        className={cn(
                            "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all flex items-center gap-1.5",
                            statusFilter === "occupied"
                                ? "bg-primary text-white"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <span className="size-1.5 rounded-full bg-current" />
                        Occupied ({stats.occupiedCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter("available")}
                        className={cn(
                            "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                            statusFilter === "available"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-gray hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        Available ({stats.availableCount})
                    </button>
                </div>

                {/* Waiter Filter Dropdown */}
                <div className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-gray hidden sm:inline">
                        Filter Waiter:
                    </span>
                    <select
                        value={waiterFilter}
                        onChange={e => setWaiterFilter(e.target.value)}
                        className="rounded-full border border-hairline bg-surface-ivory px-3 py-1.5 text-[12px] font-medium text-foreground outline-none focus:border-primary"
                    >
                        <option value="all">All Servers</option>
                        {waiterStaffList.map(st => (
                            <option key={st.id} value={st.id}>
                                {st.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 3. Table Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTables.map(table => {
                    const session = sessions.find(
                        s => s.id === table.currentSessionId,
                    );
                    const isOcc = Boolean(
                        session && table.status !== "available",
                    );
                    const waiter = session
                        ? staffMembers.find(p => p.id === session.waiterId)
                        : staffMembers.find(p => p.assignedTableIds?.includes(table.id)) ?? null;

                    const sessionItems = session
                        ? items.filter(
                              i =>
                                  i.sessionId === session.id &&
                                  i.status !== "draft",
                          )
                        : [];

                    const tableBill = sessionItems.reduce(
                        (sum, i) => sum + i.unitPrice * i.quantity,
                        0,
                    );

                    const cookingCount = sessionItems.filter(
                        i =>
                            i.status === "queued" ||
                            i.status === "acknowledged" ||
                            i.status === "in_preparation",
                    ).length;
                    const readyCount = sessionItems.filter(
                        i => i.status === "ready",
                    ).length;
                    const footerLeft = !isOcc
                        ? "Available"
                        : readyCount > 0
                          ? `${readyCount} ready`
                          : cookingCount > 0
                            ? `${cookingCount} cooking`
                            : `${sessionItems.length} items ordered`;

                    return (
                        <FloorTableCard
                            key={table.id}
                            tableNumber={table.number}
                            seats={table.seats}
                            badge={
                                isOcc
                                    ? { label: "Occupied", tone: "occupied" }
                                    : { label: "Available", tone: "available" }
                            }
                            waiter={
                                isOcc
                                    ? (waiter?.name ?? "Server")
                                    : null
                            }
                            note={isOcc ? null : "No server assigned"}
                            total={isOcc ? formatEtb(tableBill) : null}
                            footerLeft={footerLeft}
                            footerAction="Inspect →"
                            onClick={() => setSelectedTable(table)}
                        />
                    );
                })}
            </div>

            {/* 4. Table Inspection Side Sheet */}
            <TableInspectionSheet
                table={selectedTable}
                session={selectedSession}
                items={items}
                isOpen={Boolean(selectedTable)}
                onClose={() => setSelectedTable(null)}
            />
        </div>
    );
}
