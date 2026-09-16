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
import { cn } from "@/lib/utils";

export default function StationTicketActions({
    ticket,
    compact = false,
    overlay = false,
}: {
    ticket: StationTicket;
    compact?: boolean;
    overlay?: boolean;
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

    const secondaryBtnClass = overlay
        ? "border-white/30 bg-white/15 text-white hover:bg-white/25 hover:text-white backdrop-blur-md"
        : "border-hairline bg-secondary text-foreground hover:bg-secondary/80";

    const primaryBtnClass =
        "bg-primary text-primary-foreground hover:bg-primary-deep shadow-sm font-semibold";

    if (ticket.state === "QUEUED") {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size={size}
                    disabled={busy}
                    className={primaryBtnClass}
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
                    className={secondaryBtnClass}
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
                className={primaryBtnClass}
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
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size={size}
                    disabled={busy}
                    className={primaryBtnClass}
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
                    className={cn(
                        secondaryBtnClass,
                        overlay
                            ? "text-red-200 border-red-300/30 hover:bg-red-500/20"
                            : "text-destructive hover:bg-destructive/10",
                    )}
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
