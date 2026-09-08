"use client";

import {
    useAcknowledgeOrderItemMutation,
    useMarkItemReadyMutation,
    useReportCannotPrepareMutation,
    useStartPreparationMutation,
} from "@/context/services/stationsApi";
import type { StationTicket } from "@/domains/fulfillment/domain/stationTicket";
import { Button } from "@/components/ui/button";

export default function StationTicketActions({
    ticket,
    compact = false,
}: {
    ticket: StationTicket;
    compact?: boolean;
}) {
    const [acknowledge, { isLoading: acknowledging }] =
        useAcknowledgeOrderItemMutation();
    const [start, { isLoading: starting }] = useStartPreparationMutation();
    const [ready, { isLoading: markingReady }] = useMarkItemReadyMutation();
    const [cannotPrepare, { isLoading: reporting }] =
        useReportCannotPrepareMutation();
    const size = compact ? "sm" : "default";
    const body = {
        orderItemId: ticket.orderItemId,
        expectedVersion: ticket.version,
    };
    const busy = acknowledging || starting || markingReady || reporting;

    if (ticket.state === "QUEUED") {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    size={size}
                    disabled={busy}
                    onClick={() => {
                        void acknowledge(body);
                    }}
                >
                    Acknowledge
                </Button>
                <Button
                    size={size}
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                        void start(body);
                    }}
                >
                    Start
                </Button>
            </div>
        );
    }

    if (ticket.state === "ACKNOWLEDGED") {
        return (
            <Button
                size={size}
                disabled={busy}
                onClick={() => {
                    void start(body);
                }}
            >
                Start preparing
            </Button>
        );
    }

    if (ticket.state === "IN_PREPARATION") {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    size={size}
                    disabled={busy}
                    onClick={() => {
                        void ready(body);
                    }}
                >
                    Mark ready
                </Button>
                <Button
                    size={size}
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                        void cannotPrepare({
                            ...body,
                            reasonDetail: "Cannot prepare",
                        });
                    }}
                >
                    Cannot prepare
                </Button>
            </div>
        );
    }

    if (ticket.state === "READY") {
        return (
            <p className="text-[13px] text-slate-gray">
                Waiting for waiter to serve
            </p>
        );
    }

    if (ticket.state === "CANNOT_PREPARE") {
        return (
            <p className="text-[13px] text-destructive">
                {ticket.exceptionReason ?? "Cannot prepare"}
            </p>
        );
    }

    return null;
}
