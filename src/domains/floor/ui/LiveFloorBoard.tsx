"use client";

import { CookingPot, User, Utensils } from "lucide-react";
import { useFloorTablesQuery } from "@/context/services/floorApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import { cn } from "@/lib/utils";

export default function LiveFloorBoard() {
    const { data, isLoading } = useFloorTablesQuery();
    const open = (data?.data ?? []).filter(table => table.tableSessionId);

    if (isLoading) {
        return <p className="text-slate-gray">Loading floor…</p>;
    }

    if (open.length === 0) {
        return (
            <div className="rounded-[16px] border border-hairline bg-card p-6 text-center text-slate-gray">
                <Utensils className="mx-auto mb-2 size-6 text-slate-400" />
                <p className="text-[14px] font-medium text-foreground">
                    No active table sessions
                </p>
                <p className="mt-0.5 text-[12px]">
                    All tables are free.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {open.map(table => (
                <article
                    key={table.tableId}
                    className={cn(
                        "flex flex-col justify-between rounded-[16px] border p-4",
                        table.mine
                            ? "border-primary/40 bg-accent/40"
                            : "border-amber-200 bg-amber-50/20",
                    )}
                >
                    <div>
                        <p className="text-[12px] font-medium text-slate-gray">
                            Table
                        </p>
                        <h2 className="text-[24px] font-bold leading-tight">
                            {tableNumber(table)}
                        </h2>
                        <p className="mt-1 text-[12px] text-slate-gray">
                            {table.locationName}
                        </p>
                    </div>
                    <div className="mt-3 space-y-1 text-[13px]">
                        <p className="flex items-center gap-1.5">
                            <User className="size-3.5" />
                            {table.waiterName ?? "Waiter"}
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-gray">
                            <CookingPot className="size-3.5" />
                            {table.cookingItemCount} cooking ·{" "}
                            {table.readyItemCount} ready
                        </p>
                    </div>
                </article>
            ))}
        </div>
    );
}
