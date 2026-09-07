"use client";

import { CookingPot, DollarSign, User, Utensils } from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import { formatTicketExtras } from "@/domains/ordering/application/selectors";
import { STATION_STATUS_LABELS } from "@/domains/ordering/domain/order";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function LiveFloorBoard() {
    const tables = useAppSelector(state => state.ops.tables);
    const sessions = useAppSelector(state => state.ops.sessions);
    const items = useAppSelector(state => state.ops.items);
    const open = tables.filter(table => table.currentSessionId);

    if (open.length === 0) {
        return (
            <div className="rounded-[16px] border border-hairline bg-card p-6 text-center text-slate-gray">
                <Utensils className="mx-auto size-6 text-slate-400 mb-2" />
                <p className="text-[14px] font-medium text-foreground">
                    No active table sessions
                </p>
                <p className="text-[12px] mt-0.5">
                    All tables are currently clean and available for walk-ins.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {open.map(table => {
                const session = sessions.find(
                    entry => entry.id === table.currentSessionId,
                );
                const waiter = DEMO_STAFF.find(
                    person => person.id === session?.waiterId,
                );
                const sessionItems = items.filter(
                    item =>
                        item.sessionId === session?.id &&
                        item.status !== "draft",
                );
                const total = sessionItems.reduce(
                    (sum, item) =>
                        sum + item.unitPrice * item.quantity,
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

                return (
                    <article
                        key={table.id}
                        className="flex flex-col justify-between rounded-[16px] border border-amber-200 bg-amber-50/20 p-4 transition-all hover:border-primary/50 hover:scale-[1.01]"
                    >
                        <div>
                            {/* Top Row: Table Number & Status Badge */}
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-[12px] font-medium text-slate-gray">
                                        Table
                                    </p>
                                    <h2 className="text-[24px] font-bold leading-tight text-foreground">
                                        {table.number}
                                    </h2>
                                </div>

                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-amber-100/70 text-amber-800 border-amber-300">
                                    <span className="size-1.5 rounded-full bg-amber-600 animate-pulse" />
                                    Occupied
                                </span>
                            </div>

                            {/* Middle Row: Waiter & Running Total */}
                            <div className="mt-3 space-y-1.5 border-t border-hairline/80 pt-3">
                                <div className="flex items-center gap-1.5 text-[13px]">
                                    <User className="size-3.5 text-primary shrink-0" />
                                    <span className="font-semibold text-foreground truncate">
                                        Waiter: {waiter?.name ?? "Server"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[12px] text-slate-gray">
                                    <span>Running Tab</span>
                                    <span className="font-semibold text-foreground text-[13px]">
                                        {formatEtb(total)}
                                    </span>
                                </div>
                            </div>

                            {/* Ordered Items Preview */}
                            {sessionItems.length > 0 ? (
                                <div className="mt-3 space-y-1.5 rounded-xl border border-hairline/80 bg-card p-2.5">
                                    {sessionItems.slice(0, 3).map(item => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between text-[12px]"
                                        >
                                            <span className="font-medium text-foreground truncate max-w-[140px]">
                                                {item.quantity}× {item.name}
                                            </span>
                                            <span
                                                className={cn(
                                                    "rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                                                    item.status === "in_preparation" ||
                                                    item.status === "acknowledged" ||
                                                    item.status === "queued"
                                                        ? "bg-amber-50 text-amber-700"
                                                        : item.status === "ready"
                                                          ? "bg-emerald-50 text-emerald-700"
                                                          : "bg-secondary text-slate-gray",
                                                )}
                                            >
                                                {STATION_STATUS_LABELS[item.status]}
                                            </span>
                                        </div>
                                    ))}
                                    {sessionItems.length > 3 ? (
                                        <p className="text-[11px] text-slate-gray pt-1 border-t border-hairline/60">
                                            +{sessionItems.length - 3} more items...
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="mt-3 rounded-xl border border-hairline/60 bg-surface-ivory/60 p-2 text-center text-[12px] text-slate-gray">
                                    Awaiting order placement
                                </div>
                            )}
                        </div>

                        {/* Bottom Status Tags */}
                        <div className="mt-3.5 flex items-center justify-between border-t border-hairline/60 pt-2.5 text-[11px]">
                            <div className="flex items-center gap-2">
                                {cookingCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-amber-700">
                                        <CookingPot className="size-3" />
                                        {cookingCount} cooking
                                    </span>
                                ) : null}
                                {readyCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {readyCount} ready
                                    </span>
                                ) : null}
                                {cookingCount === 0 && readyCount === 0 ? (
                                    <span className="text-slate-gray">
                                        {sessionItems.length} items
                                    </span>
                                ) : null}
                            </div>
                            <span className="text-[11px] font-medium text-primary">
                                Live
                            </span>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
