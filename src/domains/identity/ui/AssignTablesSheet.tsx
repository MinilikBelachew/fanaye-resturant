"use client";

import { useEffect, useState } from "react";
import {
    Check,
    Grid,
    LayoutGrid,
    Phone,
    UtensilsCrossed,
    User,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    assignTablesToWaiter,
    closeAssignTables,
} from "@/context/slices/identitySlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AssignTablesSheet() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(state => state.identity.isAssignTablesOpen);
    const waiter = useAppSelector(state => state.identity.assigningWaiter);
    const tables = useAppSelector(state => state.ops.tables);
    const sessions = useAppSelector(state => state.ops.sessions);

    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

    useEffect(() => {
        if (waiter) {
            setSelectedTableIds(waiter.assignedTableIds || []);
        } else {
            setSelectedTableIds([]);
        }
    }, [waiter, isOpen]);

    if (!isOpen || !waiter) return null;

    function handleToggle(tableId: string) {
        setSelectedTableIds(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId],
        );
    }

    function handleSave() {
        dispatch(
            assignTablesToWaiter({
                waiterId: waiter.id,
                tableIds: selectedTableIds,
            }),
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200">
            <div
                className="fixed inset-0"
                onClick={() => dispatch(closeAssignTables())}
            />

            <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-card border-l border-hairline overflow-hidden">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UtensilsCrossed className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                Assign Dining Tables
                            </h2>
                            <p className="text-[13px] text-slate-gray">
                                Table allocation for <span className="font-semibold text-foreground">{waiter.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => dispatch(closeAssignTables())}
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="app-scroll flex-1 space-y-6 overflow-y-auto p-6 text-[14px]">
                    {/* Waiter Profile Mini Card */}
                    <div className="flex items-center justify-between rounded-[16px] border border-hairline bg-surface-ivory/50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-[16px] font-bold text-foreground">
                                {waiter.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{waiter.name}</p>
                                <p className="text-[12px] text-slate-gray">
                                    {waiter.phone || "No phone registered"} · {waiter.shiftStatus === "on_duty" ? "● On Duty" : "○ Off Duty"}
                                </p>
                            </div>
                        </div>
                        <Badge variant="primary">
                            {selectedTableIds.length} Assigned
                        </Badge>
                    </div>

                    {/* Quick Selection Shortcuts */}
                    <div className="space-y-2">
                        <p className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                            Quick Zone Allocation
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedTableIds(
                                        tables.slice(0, 8).map(t => t.id),
                                    )
                                }
                                className="rounded-full border border-hairline bg-surface-ivory px-3 py-1 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                                Zone A (Tables 1-8)
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedTableIds(
                                        tables.slice(8, 16).map(t => t.id),
                                    )
                                }
                                className="rounded-full border border-hairline bg-surface-ivory px-3 py-1 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                                Zone B (Tables 9-16)
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedTableIds(tables.map(t => t.id))
                                }
                                className="rounded-full border border-hairline bg-surface-ivory px-3 py-1 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                                All Tables
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTableIds([])}
                                className="rounded-full border border-hairline bg-surface-ivory px-3 py-1 text-[12px] font-medium text-slate-gray hover:bg-secondary transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Table Grid (16 Tables) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[12px] font-semibold tracking-wider text-slate-gray uppercase">
                                Floor Tables Map
                            </p>
                            <span className="text-[12px] text-slate-gray">
                                Tap table to toggle assignment
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {tables.map(table => {
                                const isSelected = selectedTableIds.includes(table.id);
                                const session = sessions.find(
                                    s =>
                                        s.tableId === table.id &&
                                        s.status !== "paid" &&
                                        s.status !== "closed",
                                );
                                const isOccupied = Boolean(session);

                                return (
                                    <button
                                        key={table.id}
                                        type="button"
                                        onClick={() => handleToggle(table.id)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-between rounded-[14px] border p-4 text-center transition-all",
                                            isSelected
                                                ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/40 shadow-xs"
                                                : "border-hairline bg-white hover:border-slate-300 dark:bg-card",
                                        )}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className="text-[11px] font-medium text-slate-gray">
                                                Table
                                            </span>
                                            {isSelected ? (
                                                <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                    <Check className="size-2.5 stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="size-4 rounded-full border border-hairline" />
                                            )}
                                        </div>

                                        <p className="my-2 text-[22px] font-bold text-foreground">
                                            {table.number}
                                        </p>

                                        <div className="flex w-full items-center justify-center gap-1.5">
                                            <span
                                                className={cn(
                                                    "size-1.5 rounded-full",
                                                    isOccupied
                                                        ? "bg-amber-500"
                                                        : "bg-emerald-500",
                                                )}
                                            />
                                            <span className="text-[11px] text-slate-gray">
                                                {isOccupied ? "Occupied" : "Available"}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-white p-4 dark:bg-card">
                    <p className="text-[13px] text-slate-gray">
                        <span className="font-semibold text-foreground">
                            {selectedTableIds.length}
                        </span>{" "}
                        of {tables.length} tables selected
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => dispatch(closeAssignTables())}
                            className="rounded-full text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold px-5"
                        >
                            Save Allocation
                        </Button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
