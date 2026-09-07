"use client";

import { Clock, CookingPot, DollarSign, User, Users, Utensils, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import type { DiningTable, TableSession } from "@/domains/floor/domain/table";
import type { OrderItem } from "@/domains/ordering/domain/order";
import { STATION_STATUS_LABELS } from "@/domains/ordering/domain/order";
import { formatTicketExtras } from "@/domains/ordering/application/selectors";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

interface TableInspectionSheetProps {
    table: DiningTable | null;
    session: TableSession | null;
    items: OrderItem[];
    isOpen: boolean;
    onClose: () => void;
}

export default function TableInspectionSheet({
    table,
    session,
    items,
    isOpen,
    onClose,
}: TableInspectionSheetProps) {
    if (!isOpen || !table) return null;

    const isOccupied = Boolean(session && table.status !== "available");
    const waiter = session
        ? DEMO_STAFF.find(person => person.id === session.waiterId)
        : null;

    const activeItems = items.filter(
        item => item.sessionId === session?.id && item.status !== "draft",
    );

    const subtotal = activeItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
    );
    const tax = Math.round(subtotal * 0.15);
    const total = subtotal + tax;

    const cookingCount = activeItems.filter(
        i =>
            i.status === "queued" ||
            i.status === "acknowledged" ||
            i.status === "in_preparation",
    ).length;
    const readyCount = activeItems.filter(i => i.status === "ready").length;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="flex-1" onClick={onClose} aria-hidden="true" />

            {/* Slide-over panel */}
            <div className="relative flex h-full w-full max-w-lg flex-col border-l border-hairline bg-card shadow-2xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-ivory px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-hairline bg-card text-foreground font-bold text-[18px]">
                            {table.number}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[17px] font-semibold text-foreground">
                                    Table {table.number}
                                </h2>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
                                        isOccupied
                                            ? "bg-primary/10 text-primary border-primary/20"
                                            : "bg-secondary text-slate-gray border-hairline",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "size-1.5 rounded-full",
                                            isOccupied
                                                ? "bg-primary animate-pulse"
                                                : "bg-slate-400",
                                        )}
                                    />
                                    {isOccupied ? "Occupied" : "Available"}
                                </span>
                            </div>
                            <p className="text-[12px] text-slate-gray">
                                Dining Room · Main Floor
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-full text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Status & Staff Overview */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-hairline bg-surface-ivory p-3.5">
                            <p className="text-[11px] text-slate-gray uppercase tracking-wider font-medium">
                                Assigned Waiter
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <User className="size-3.5" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-foreground">
                                        {waiter?.name ?? (isOccupied ? "Assigned Staff" : "None (Free)")}
                                    </p>
                                    <p className="text-[11px] text-slate-gray">
                                        {isOccupied ? "Table Server" : "Ready for allocation"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-hairline bg-surface-ivory p-3.5">
                            <p className="text-[11px] text-slate-gray uppercase tracking-wider font-medium">
                                Running Total
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                    <DollarSign className="size-3.5" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-foreground">
                                        {isOccupied ? formatEtb(subtotal) : "ETB 0.00"}
                                    </p>
                                    <p className="text-[11px] text-slate-gray">
                                        {isOccupied ? `${activeItems.length} active items` : "No open order"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preparation / Kitchen Status Pills */}
                    {isOccupied ? (
                        <div className="flex items-center gap-3 text-[12px]">
                            <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5">
                                <CookingPot className="size-3.5 text-amber-600" />
                                <span>
                                    <strong className="font-semibold text-foreground">{cookingCount}</strong> Cooking
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>
                                    <strong className="font-semibold text-foreground">{readyCount}</strong> Ready to serve
                                </span>
                            </div>
                        </div>
                    ) : null}

                    <hr className="border-hairline" />

                    {/* Ordered Items List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[14px] font-semibold text-foreground">
                                Active Order Items ({activeItems.length})
                            </h3>
                            {isOccupied ? (
                                <span className="text-[12px] font-semibold text-primary">
                                    Running Total: {formatEtb(subtotal)}
                                </span>
                            ) : null}
                        </div>

                        {!isOccupied || activeItems.length === 0 ? (
                            <div className="rounded-xl border border-hairline bg-surface-ivory p-6 text-center text-slate-gray">
                                <Utensils className="mx-auto size-6 text-slate-400 mb-2" />
                                <p className="text-[13px] font-medium text-foreground">
                                    No active orders
                                </p>
                                <p className="text-[12px] mt-0.5">
                                    {isOccupied
                                        ? "Guest seated, awaiting order placement."
                                        : "Table is currently clean and available for seating."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeItems.map(item => {
                                    const extras = formatTicketExtras(item);
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-start justify-between gap-3 rounded-xl border border-hairline bg-card p-3.5"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex size-5 items-center justify-center rounded-md bg-secondary text-[11px] font-bold text-foreground">
                                                        {item.quantity}×
                                                    </span>
                                                    <p className="text-[13px] font-semibold text-foreground">
                                                        {item.name}
                                                    </p>
                                                </div>
                                                {extras ? (
                                                    <p className="mt-1 text-[11px] text-slate-gray pl-7">
                                                        {extras}
                                                    </p>
                                                ) : null}
                                                {item.instruction ? (
                                                    <p className="mt-0.5 text-[11px] italic text-amber-700 pl-7">
                                                        Note: {item.instruction}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="text-[13px] font-semibold text-foreground">
                                                    {formatEtb(item.unitPrice * item.quantity)}
                                                </p>
                                                <span
                                                    className={cn(
                                                        "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
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
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bill Breakdown Summary if Occupied */}
                    {isOccupied && activeItems.length > 0 ? (
                        <div className="rounded-xl border border-hairline bg-surface-ivory p-4 space-y-2 text-[13px]">
                            <div className="flex justify-between text-slate-gray">
                                <span>Subtotal</span>
                                <span>{formatEtb(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-gray">
                                <span>VAT (15%)</span>
                                <span>{formatEtb(tax)}</span>
                            </div>
                            <div className="border-t border-hairline pt-2 flex justify-between font-semibold text-foreground text-[14px]">
                                <span>Total Payable</span>
                                <span className="text-primary">{formatEtb(total)}</span>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-surface-ivory px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-hairline bg-card px-5 py-2 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                        Close
                    </button>
                    {isOccupied ? (
                        <div className="text-[12px] font-medium text-slate-gray">
                            Managed by <strong className="text-foreground">{waiter?.name ?? "Server"}</strong>
                        </div>
                    ) : (
                        <span className="text-[12px] font-medium text-emerald-600">
                            Available for Walk-ins
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
