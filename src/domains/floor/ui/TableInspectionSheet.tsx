"use client";

import { Clock, User, Users, Utensils, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FloorTable } from "@/domains/floor/domain/floorApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import { cn } from "@/lib/utils";

interface TableInspectionSheetProps {
    table: FloorTable | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function TableInspectionSheet({
    table,
    isOpen,
    onClose,
}: TableInspectionSheetProps) {
    if (!isOpen || !table) return null;

    const occupied = Boolean(table.tableSessionId);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            <div className="flex-1" onClick={onClose} aria-hidden="true" />
            <div className="relative flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-hairline bg-card font-bold text-[18px]">
                            {tableNumber(table)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[17px] font-semibold">
                                    Table {tableNumber(table)}
                                </h2>
                                <Badge
                                    variant={occupied ? "warning" : "secondary"}
                                >
                                    {occupied ? "Occupied" : "Available"}
                                </Badge>
                            </div>
                            <p className="text-[13px] text-slate-gray">
                                {table.locationName}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-secondary"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                        <Info
                            icon={User}
                            label="Waiter"
                            value={table.waiterName ?? "—"}
                        />
                        <Info
                            icon={Users}
                            label="Guests"
                            value={
                                table.guestCount != null
                                    ? String(table.guestCount)
                                    : "—"
                            }
                        />
                        <Info
                            icon={Utensils}
                            label="Status"
                            value={table.sessionStatus ?? table.tableStatus}
                        />
                        <Info
                            icon={Clock}
                            label="Opened"
                            value={
                                table.visitStartedAt
                                    ? new Date(
                                          table.visitStartedAt,
                                      ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "—"
                            }
                        />
                    </div>
                    <p className={cn("text-[13px] text-slate-gray")}>
                        {table.readyItemCount} ready · {table.cookingItemCount}{" "}
                        cooking. Item lines will show here when orders are
                        wired.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Info({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof User;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[12px] border border-hairline p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-slate-gray">
                <Icon className="size-3.5" />
                {label}
            </p>
            <p className="mt-1 font-medium">{value}</p>
        </div>
    );
}
