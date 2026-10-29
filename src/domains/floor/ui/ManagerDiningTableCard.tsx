"use client";

import React from "react";
import {
    ChevronRight,
    Pencil,
    Sparkles,
    Trash2,
    UserRound,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDiningTable } from "@/domains/floor/domain/floorLayoutApi";
import { ArchitecturalTableVector } from "@/domains/floor/ui/ArchitecturalTableVector";
import { cn } from "@/lib/utils";

export interface ManagerDiningTableCardProps {
    table: AdminDiningTable;
    index?: number;
    labels: {
        assigned: string;
        open: string;
        vipBadge: string;
        noWaiterAssigned: string;
        viewDetail: string;
        edit: string;
        delete: string;
        confirm: string;
    };
    saving: boolean;
    confirmTableId: string | null;
    onOpenEdit: (table: AdminDiningTable) => void;
    onDeleteTable: (table: AdminDiningTable) => Promise<void>;
    onResetConfirm: () => void;
}

export function ManagerDiningTableCard({
    table,
    index = 0,
    labels,
    saving,
    confirmTableId,
    onOpenEdit,
    onDeleteTable,
    onResetConfirm,
}: ManagerDiningTableCardProps) {
    const assigned = Boolean(table.assignedWaiterName);
    const isConfirmingDelete = confirmTableId === table.id;

    // Architectural table shape: alternate round (4-top) and rectangle (6-top)
    const tableShape: "round" | "rectangle" =
        index % 2 === 0 ? "rectangle" : "round";

    const tableLabel = table.displayNumber
        ? `#${table.displayNumber}`
        : table.displayName;

    const tableRawNum =
        table.displayNumber ||
        table.displayName.replace(/[^0-9]/g, "") ||
        String(index + 1);

    const waiterInitials = table.assignedWaiterName
        ? table.assignedWaiterName
              .split(" ")
              .filter(Boolean)
              .map(p => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : null;

    return (
        <article
            className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-hairline transition-all duration-200",
                "bg-card shadow-xs hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                table.effectiveVip && "ring-1 ring-amber-500/30",
            )}
        >
            <div className="p-4">
                {/* Header: Table identifier and status badges */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[17px] font-bold tracking-tight text-foreground">
                                {tableLabel}
                            </span>
                            {table.effectiveVip ? (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 px-1.5 py-0 text-[10px] font-semibold shadow-2xs"
                                >
                                    <Sparkles className="size-2.5 text-amber-500" />
                                    {labels.vipBadge}
                                </Badge>
                            ) : null}
                        </div>
                        {table.displayNumber ? (
                            <p className="text-[12px] font-medium text-slate-gray">
                                {table.displayName}
                            </p>
                        ) : null}
                    </div>

                    <Badge variant={assigned ? "success" : "warning"}>
                        {assigned ? labels.assigned : labels.open}
                    </Badge>
                </div>

                {/* Central Architectural 2D Vector Dining Table */}
                <ArchitecturalTableVector
                    tableNumber={tableRawNum}
                    shape={tableShape}
                    status={assigned ? "assigned" : "open"}
                    isVip={table.effectiveVip}
                    className="mt-3.5"
                />

                {/* Assigned Waiter Banner */}
                <div className="mt-3 flex items-center justify-between rounded-xl border border-hairline/60 bg-secondary/35 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                        {assigned ? (
                            <>
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                    {waiterInitials}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-[12px] font-semibold text-foreground leading-tight">
                                        {table.assignedWaiterName}
                                    </p>
                                    <p className="text-[10px] text-slate-gray leading-tight">
                                        Assigned Waiter
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <UserRound className="size-3" />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-[12px] font-medium text-amber-700 dark:text-amber-400 leading-tight">
                                        {labels.noWaiterAssigned}
                                    </p>
                                    <p className="text-[10px] text-slate-gray leading-tight">
                                        Open for assignment
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex items-center gap-2 border-t border-hairline/70 bg-card/60 px-4 py-3">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                    asChild
                >
                    <Link href={`/manager/tables/${table.id}`}>
                        {labels.viewDetail}
                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenEdit(table)}
                    className="gap-1 font-medium"
                >
                    <Pencil className="size-3.5" />
                    {labels.edit}
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={isConfirmingDelete ? "destructive" : "outline"}
                    disabled={saving}
                    onClick={() => void onDeleteTable(table)}
                    onBlur={() => {
                        if (isConfirmingDelete) {
                            setTimeout(onResetConfirm, 250);
                        }
                    }}
                    className={cn(
                        "transition-all",
                        isConfirmingDelete && "animate-pulse",
                    )}
                    title={labels.delete}
                >
                    <Trash2 className="size-3.5" />
                    {isConfirmingDelete ? (
                        <span>{labels.confirm}</span>
                    ) : (
                        <span className="sr-only">{labels.delete}</span>
                    )}
                </Button>
            </div>
        </article>
    );
}

export default ManagerDiningTableCard;
