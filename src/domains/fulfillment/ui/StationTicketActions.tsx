"use client";

import {
    useAcknowledgeOrderItemMutation,
    useMarkItemReadyMutation,
    useReportCannotPrepareMutation,
    useStartPreparationMutation,
} from "@/context/services/stationsApi";
import type { StationTicket } from "@/domains/fulfillment/domain/stationTicket";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

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
    const label = ticket.itemName || "Ticket";

    async function run(
        action: () => Promise<unknown>,
        success: string,
        fallback: string,
    ) {
        try {
            await action();
            toast.success(success, label);
        } catch (err) {
            toast.fromUnknown(err, fallback);
        }
    }

    if (ticket.state === "QUEUED") {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    size={size}
                    disabled={busy}
                    onClick={() => {
                        void run(
                            () => acknowledge(body).unwrap(),
                            "Acknowledged",
                            "Could not acknowledge ticket.",
                        );
                    }}
                >
                    Acknowledge
                </Button>
                <Button
                    size={size}
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                        void run(
                            () => start(body).unwrap(),
                            "Prep started",
                            "Could not start preparation.",
                        );
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
                    void run(
                        () => start(body).unwrap(),
                        "Prep started",
                        "Could not start preparation.",
                    );
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
                        void run(
                            () => ready(body).unwrap(),
                            "Marked ready",
                            "Could not mark ready.",
                        );
                    }}
                >
                    Mark ready
                </Button>
                <Button
                    size={size}
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                        void run(
                            () =>
                                cannotPrepare({
                                    ...body,
                                    reasonDetail: "Cannot prepare",
                                }).unwrap(),
                            "Reported cannot prepare",
                            "Could not report exception.",
                        );
                    }}
                >
                    Cannot prepare
                </Button>
            </div>
        );
    }

    return null;
}
