"use client";

import { useState } from "react";
import {
    useAcknowledgeOrderItemMutation,
    useMarkItemReadyMutation,
    useReportCannotPrepareMutation,
    useStartPreparationMutation,
} from "@/context/services/stationsApi";
import {
    isQuickServeWorkflow,
    type StationTicket,
} from "@/domains/fulfillment/domain/stationTicket";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function StationTicketActions({
    ticket,
    compact = false,
    overlay = false,
    workflowMode,
}: {
    ticket: StationTicket;
    compact?: boolean;
    overlay?: boolean;
    workflowMode?: string | null;
}) {
    const [acknowledge, { isLoading: acknowledging }] =
        useAcknowledgeOrderItemMutation();
    const [start, { isLoading: starting }] = useStartPreparationMutation();
    const [ready, { isLoading: markingReady }] = useMarkItemReadyMutation();
    const [cannotPrepare, { isLoading: reporting }] =
        useReportCannotPrepareMutation();

    const [cannotPrepareModal, setCannotPrepareModal] = useState(false);

    const size = compact ? "sm" : "default";
    const body = {
        orderItemId: ticket.orderItemId,
        expectedVersion: ticket.version,
    };
    const busy = acknowledging || starting || markingReady || reporting;
    const label = ticket.itemName || "Ticket";
    const quickServe = isQuickServeWorkflow(workflowMode);

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

    async function executeCannotPrepare(markSoldOut: boolean) {
        setCannotPrepareModal(false);
        try {
            await cannotPrepare({
                ...body,
                reasonDetail: "Cannot prepare",
                markSoldOut,
            }).unwrap();
            toast.success(
                markSoldOut
                    ? "Cannot prepare · sold out for waiters"
                    : "Reported cannot prepare",
                label,
            );
        } catch (err) {
            toast.fromUnknown(err, "Could not report cannot prepare.");
        }
    }

    const secondaryBtnClass = overlay
        ? "border-white/30 bg-white/15 text-white hover:bg-white/25 hover:text-white backdrop-blur-md"
        : "border-hairline bg-secondary text-foreground hover:bg-secondary/80";

    const primaryBtnClass =
        "bg-primary text-primary-foreground hover:bg-primary-deep shadow-sm font-semibold";

    const readyButton = (
        <Button
            size={size}
            disabled={busy}
            className={primaryBtnClass}
            onClick={() => {
                void run(
                    () => ready(body).unwrap(),
                    "Ready to serve",
                    "Could not mark ready.",
                );
            }}
        >
            {compact ? "Ready" : "Ready to serve"}
        </Button>
    );

    const cannotPrepareButton = (
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
            onClick={() => setCannotPrepareModal(true)}
        >
            Cannot prepare
        </Button>
    );

    // Cannot Prepare modal — shared between both button usages
    const cannotPrepareDialog = (
        <Dialog open={cannotPrepareModal} onOpenChange={setCannotPrepareModal}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Cannot Prepare — Mark Sold Out?</DialogTitle>
                    <DialogDescription>
                        Would you also like to mark <strong>{label}</strong> as
                        sold out so waiters cannot order it again?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => void executeCannotPrepare(false)}
                    >
                        No — just report
                    </Button>
                    <Button
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => void executeCannotPrepare(true)}
                    >
                        Yes — also sold out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    if (ticket.state === "QUEUED") {
        if (quickServe) {
            return (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        {readyButton}
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
                    {cannotPrepareDialog}
                </>
            );
        }

        return (
            <>
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
                {cannotPrepareDialog}
            </>
        );
    }

    if (ticket.state === "ACKNOWLEDGED") {
        if (quickServe) {
            return (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        {readyButton}
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
                            Start preparing
                        </Button>
                    </div>
                    {cannotPrepareDialog}
                </>
            );
        }

        return (
            <>
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
                {cannotPrepareDialog}
            </>
        );
    }

    if (ticket.state === "IN_PREPARATION") {
        return (
            <>
                <div className="flex flex-wrap items-center gap-2">
                    {readyButton}
                    {cannotPrepareButton}
                </div>
                {cannotPrepareDialog}
            </>
        );
    }

    return null;
}
