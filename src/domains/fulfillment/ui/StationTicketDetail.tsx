"use client";

import { useState } from "react";
import { useAppSelector } from "@/context/hooks";
import {
    useStationOrderItemQuery,
    useStationQueueQuery,
} from "@/context/services/stationsApi";
import StationTicketActions from "@/domains/fulfillment/ui/StationTicketActions";
import TicketExtras from "@/domains/fulfillment/ui/TicketExtras";
import IssueMaterialsModal from "@/domains/outside-orders/ui/IssueMaterialsModal";
import { homePathForRole } from "@/domains/identity/application/homePath";
import type { StationRole } from "@/domains/identity/domain/role";
import { stationStateLabel } from "@/domains/fulfillment/domain/stationTicket";
import { lineTotal } from "@/domains/ordering/application/mapWaiterMenu";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StationTicketDetail({
    role,
    itemId,
}: {
    role: StationRole;
    itemId: string;
}) {
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const stationId = useAppSelector(
        state => state.identity.session?.stationId,
    );
    const {
        data: ticket,
        isLoading,
        isError,
    } = useStationOrderItemQuery(itemId, { skip: !itemId });
    const { data: queue } = useStationQueueQuery(stationId ?? "", {
        skip: !stationId,
    });
    const workflowMode = queue?.workflowMode ?? "FULL_PREP";
    const home = homePathForRole(role);

    if (isLoading) {
        return <p className="text-slate-gray">Loading ticket…</p>;
    }

    if (isError || !ticket) {
        return (
            <div>
                <Link href={home} className="text-[14px] text-brand">
                    ← Queue
                </Link>
                <h1 className="mt-3 text-[24px] font-semibold">
                    Ticket not found
                </h1>
                <p className="mt-2 text-slate-gray">
                    This order is not on this station, or it has already been
                    served.
                </p>
            </div>
        );
    }

    const extras = ticket.modifiers.map((entry, index) => ({
        groupId: "mod",
        optionId: `${index}`,
        name: entry.name,
        priceDelta: Number(entry.priceDelta),
    }));
    const hasExtras =
        extras.length > 0 || Boolean(ticket.specialInstruction?.trim());

    return (
        <div className="mx-auto w-full max-w-6xl">
            <Link href={home} className="text-[14px] text-brand">
                ← Queue
            </Link>
            <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[13px] text-slate-gray">
                        {ticket.outsideOrderId
                            ? `Outside Order · ${ticket.tableDisplayName}`
                            : ticket.tableDisplayName
                                    .toLowerCase()
                                    .startsWith("call")
                              ? ticket.tableDisplayName
                              : `Table ${ticket.tableDisplayName}`}{" "}
                        · {ticket.waiter.displayName}
                        {ticket.tableDisplayName
                            .toLowerCase()
                            .startsWith("call")
                            ? " (Dispatcher)"
                            : ""}
                    </p>
                    <h1 className="text-[32px] font-semibold">
                        {ticket.quantity}× {ticket.itemName}
                    </h1>
                </div>
                <span
                    className={cn(
                        "rounded-full px-3 py-1 text-[12px] font-medium",
                        ticket.state === "READY"
                            ? "bg-accent text-accent-foreground"
                            : ticket.delayed ||
                                ticket.state === "CANNOT_PREPARE"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-slate-gray",
                    )}
                >
                    {ticket.delayed && ticket.state !== "READY"
                        ? "Delayed"
                        : stationStateLabel(ticket.state)}
                </span>
            </div>

            <article className="mt-6 rounded-[16px] border border-hairline bg-card p-5 shadow-subtle">
                <p className="text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                    Order detail
                </p>
                {hasExtras ? (
                    <TicketExtras
                        modifiers={extras}
                        instruction={ticket.specialInstruction ?? ""}
                    />
                ) : (
                    <p className="mt-3 text-[14px] text-slate-gray">
                        As listed. No holds or extras.
                    </p>
                )}
                <dl className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                        <dt className="text-slate-gray">Ticket</dt>
                        <dd className="font-medium">
                            {ticket.orderItemId.slice(-8)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-slate-gray">Price</dt>
                        <dd className="font-medium">
                            {formatEtb(
                                lineTotal(
                                    ticket.unitPrice,
                                    ticket.quantity,
                                    ticket.modifiers,
                                ),
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-slate-gray">Status</dt>
                        <dd className="font-medium">
                            {ticket.delayed
                                ? `Delayed · ${stationStateLabel(ticket.state)}`
                                : stationStateLabel(ticket.state)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-slate-gray">Prep time</dt>
                        <dd className="font-medium">
                            ~{ticket.expectedPrepMinutes} min
                        </dd>
                    </div>
                </dl>
                {stationId && ticket.exceptionReason ? (
                    <p className="mt-4 text-[13px] text-destructive">
                        {ticket.exceptionReason}
                    </p>
                ) : null}

                {/* Material Assignment for Outside Orders */}
                {ticket.outsideOrderId && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-amber-900">
                                    Outside Delivery Order
                                </p>
                                <p className="text-[11px] text-amber-700 mt-0.5">
                                    Assign returnable materials for delivery
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setIssueModalOpen(true)}
                                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 gap-1.5"
                            >
                                <Boxes className="size-3" />
                                Assign Materials
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    <StationTicketActions
                        ticket={ticket}
                        workflowMode={workflowMode}
                    />
                </div>
            </article>

            {/* Material Issue Modal */}
            {issueModalOpen && ticket.outsideOrderId ? (
                <IssueMaterialsModal
                    outsideOrderId={ticket.outsideOrderId}
                    destinationName={ticket.tableDisplayName}
                    onClose={() => setIssueModalOpen(false)}
                    onSuccess={() => {
                        setIssueModalOpen(false);
                        // Optionally refetch ticket data
                    }}
                />
            ) : null}
        </div>
    );
}
