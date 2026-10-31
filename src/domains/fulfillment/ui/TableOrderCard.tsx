"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, Sparkles, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { stationOrderPath } from "@/domains/identity/application/homePath";
import type { StationRole } from "@/domains/identity/domain/role";
import {
    stationStateLabel,
    type StationTicket,
} from "@/domains/fulfillment/domain/stationTicket";
import { parseServingGroup } from "@/domains/fulfillment/application/servingGroup";
import { imageForDish } from "@/domains/catalog/application/menuImages";
import StationTicketActions from "@/domains/fulfillment/ui/StationTicketActions";
import { cn } from "@/lib/utils";

export interface TableGroupData {
    key: string;
    tableDisplayName: string;
    waiterName: string;
    tableSessionId?: string | null;
    outsideOrderId?: string | null;
    maxElapsedSeconds: number;
    isDelayed: boolean;
    hasFresh: boolean;
    tray1Items: StationTicket[];
    tray2Items: StationTicket[];
    tray3Items: StationTicket[];
    separateItems: StationTicket[];
    allTickets: StationTicket[];
}

function DishRow({
    ticket,
    role,
    workflowMode,
}: {
    ticket: StationTicket;
    role: StationRole;
    workflowMode?: string | null;
}) {
    const tStations = useTranslations("stations");
    const { cleanInstruction } = parseServingGroup(ticket.specialInstruction);
    const modifiersText = ticket.modifiers.map(m => m.name).join(" · ");
    const isReady = ticket.state === "READY";
    const isCooking = ticket.state === "IN_PREPARATION";
    const dishImage = imageForDish(ticket.itemName);

    return (
        <div
            className={cn(
                "group relative rounded-xl border border-hairline bg-card p-3 transition-all",
                isReady
                    ? "border-l-[3.5px] border-l-emerald-600"
                    : isCooking
                      ? "border-l-[3.5px] border-l-amber-500"
                      : ticket.delayed
                        ? "border-l-[3.5px] border-l-rose-500"
                        : "border-l-[3.5px] border-l-hairline",
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {dishImage ? (
                        <div className="size-9 rounded-full overflow-hidden border border-hairline shrink-0 bg-muted/40 shadow-2xs">
                            <img
                                src={dishImage}
                                alt={ticket.itemName}
                                className="size-full object-cover"
                                onError={e => {
                                    (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                                }}
                            />
                        </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[16px] sm:text-[17px] font-black text-foreground">
                                {ticket.quantity}×
                            </span>
                            <Link
                                href={stationOrderPath(role, ticket.orderItemId)}
                                className="text-[16px] sm:text-[17px] font-bold text-foreground hover:text-brand hover:underline transition-colors tracking-tight leading-snug"
                            >
                                {ticket.itemName}
                            </Link>
                            {isReady && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary border border-hairline text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide">
                                    <CheckCircle2 className="size-2.5 text-emerald-600" />
                                    Ready
                                </span>
                            )}
                        </div>

                        {modifiersText ? (
                            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                                {modifiersText}
                            </p>
                        ) : null}

                        {cleanInstruction ? (
                            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[11.5px] font-semibold text-amber-900 dark:text-amber-200">
                                📝 Note: {cleanInstruction}
                            </p>
                        ) : null}

                        {ticket.exceptionReason ? (
                            <p className="mt-1 text-[11.5px] font-semibold text-destructive">
                                {ticket.exceptionReason}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                    <StationTicketActions
                        ticket={ticket}
                        compact
                        workflowMode={workflowMode}
                    />
                </div>
            </div>
        </div>
    );
}

export default function TableOrderCard({
    group,
    role,
    workflowMode,
}: {
    group: TableGroupData;
    role: StationRole;
    workflowMode?: string | null;
}) {
    const tStations = useTranslations("stations");

    const readyCount = group.allTickets.filter(t => t.state === "READY").length;
    const totalCount = group.allTickets.length;
    const pendingItems = group.allTickets.filter(t => t.state !== "READY");
    const allAreReady = pendingItems.length === 0;

    const elapsedMinutes = Math.max(1, Math.round(group.maxElapsedSeconds / 60));

    return (
        <article
            className={cn(
                "flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card shadow-xs transition-all",
                allAreReady
                    ? "border-emerald-500/40"
                    : group.isDelayed
                      ? "border-destructive/30"
                      : "border-hairline",
            )}
        >
            {/* Header: Table, Waiter, Timer */}
            <div className="flex items-center justify-between border-b border-hairline bg-secondary/30 px-4 py-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[17px] font-black tracking-tight text-foreground uppercase">
                            {group.tableDisplayName}
                        </h2>
                        {group.hasFresh ? (
                            <span className="inline-flex items-center gap-1 rounded bg-brand/10 text-brand border border-brand/25 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider">
                                <Sparkles className="size-2.5" />
                                New
                            </span>
                        ) : null}
                        {group.isDelayed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                                <AlertCircle className="size-3" />
                                Delayed
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        Server:{" "}
                        <strong className="text-foreground font-semibold">
                            {group.waiterName}
                        </strong>{" "}
                        · {group.allTickets.length}{" "}
                        {group.allTickets.length === 1 ? "dish" : "dishes"}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-secondary border border-hairline px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground">
                        {allAreReady ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                {readyCount}/{totalCount} Ready
                            </span>
                        ) : (
                            <span>{readyCount}/{totalCount} Ready</span>
                        )}
                    </span>
                    <div className="flex items-center gap-1.5 rounded-full bg-card border border-hairline px-2.5 py-1 font-mono text-[12px] font-semibold text-muted-foreground shadow-2xs">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>{elapsedMinutes}m</span>
                    </div>
                </div>
            </div>

            {/* Sections Container */}
            <div className="flex-1 space-y-4 p-4">
                {/* TRAY 1 SECTION */}
                {group.tray1Items.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center justify-between border-b border-hairline/60 pb-1.5 px-0.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                🍱 Tray 1 · Shared Platter
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {group.tray1Items.length}{" "}
                                {group.tray1Items.length === 1 ? "dish" : "dishes"}
                            </span>
                        </div>
                        <div className="space-y-2 pl-0.5">
                            {group.tray1Items.map(ticket => (
                                <DishRow
                                    key={ticket.orderItemId}
                                    ticket={ticket}
                                    role={role}
                                    workflowMode={workflowMode}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* TRAY 2 SECTION */}
                {group.tray2Items.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center justify-between border-b border-hairline/60 pb-1.5 px-0.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                🍱 Tray 2 · Shared Platter
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {group.tray2Items.length} dishes
                            </span>
                        </div>
                        <div className="space-y-2 pl-0.5">
                            {group.tray2Items.map(ticket => (
                                <DishRow
                                    key={ticket.orderItemId}
                                    ticket={ticket}
                                    role={role}
                                    workflowMode={workflowMode}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* TRAY 3 SECTION (if any) */}
                {group.tray3Items.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center justify-between border-b border-hairline/60 pb-1.5 px-0.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                🍱 Tray 3 · Shared Platter
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {group.tray3Items.length} dishes
                            </span>
                        </div>
                        <div className="space-y-2 pl-0.5">
                            {group.tray3Items.map(ticket => (
                                <DishRow
                                    key={ticket.orderItemId}
                                    ticket={ticket}
                                    role={role}
                                    workflowMode={workflowMode}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* SEPARATE PLATES SECTION */}
                {group.separateItems.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center justify-between border-b border-hairline/60 pb-1.5 px-0.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                🍽️ Separate Plates
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {group.separateItems.length}{" "}
                                {group.separateItems.length === 1
                                    ? "plate"
                                    : "plates"}
                            </span>
                        </div>
                        <div className="space-y-2 pl-0.5">
                            {group.separateItems.map(ticket => (
                                <DishRow
                                    key={ticket.orderItemId}
                                    ticket={ticket}
                                    role={role}
                                    workflowMode={workflowMode}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-hairline bg-secondary/20 px-4 py-2.5">
                <span className="text-[12px] text-muted-foreground">
                    {allAreReady ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            Table completely ready
                        </span>
                    ) : (
                        <span>
                            {pendingItems.length} of {group.allTickets.length} remaining
                        </span>
                    )}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                    {group.tableDisplayName}
                </span>
            </div>
        </article>
    );
}

