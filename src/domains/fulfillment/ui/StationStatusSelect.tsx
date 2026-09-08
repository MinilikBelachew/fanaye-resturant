"use client";

import {
    useAcknowledgeOrderItemMutation,
    useMarkItemReadyMutation,
    useReportCannotPrepareMutation,
    useStartPreparationMutation,
} from "@/context/services/stationsApi";
import {
    stationStateLabel,
    type StationTicket,
} from "@/domains/fulfillment/domain/stationTicket";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SETTABLE = [
    "QUEUED",
    "ACKNOWLEDGED",
    "IN_PREPARATION",
    "READY",
    "CANNOT_PREPARE",
] as const;

function tone(ticket: StationTicket) {
    if (ticket.state === "CANNOT_PREPARE" || ticket.delayed) {
        return "bg-destructive/10 text-destructive hover:bg-destructive/15";
    }
    if (ticket.state === "READY") {
        return "bg-accent text-accent-foreground hover:bg-accent/80";
    }
    if (ticket.state === "IN_PREPARATION") {
        return "bg-[#fff4e5] text-[#c2410c] hover:bg-[#ffedd5]";
    }
    return "bg-secondary text-slate-gray hover:bg-secondary/80";
}

export default function StationStatusSelect({
    ticket,
}: {
    ticket: StationTicket;
}) {
    const [acknowledge] = useAcknowledgeOrderItemMutation();
    const [start] = useStartPreparationMutation();
    const [ready] = useMarkItemReadyMutation();
    const [cannotPrepare] = useReportCannotPrepareMutation();
    const current = SETTABLE.includes(
        ticket.state as (typeof SETTABLE)[number],
    )
        ? ticket.state
        : null;

    if (!current) {
        return (
            <Badge
                variant={
                    ticket.state === "READY"
                        ? "default"
                        : ticket.delayed
                          ? "danger"
                          : "secondary"
                }
            >
                {stationStateLabel(ticket.state)}
            </Badge>
        );
    }

    const body = {
        orderItemId: ticket.orderItemId,
        expectedVersion: ticket.version,
    };

    function apply(next: string) {
        if (next === ticket.state) return;
        if (next === "ACKNOWLEDGED") void acknowledge(body);
        else if (next === "IN_PREPARATION") void start(body);
        else if (next === "READY") void ready(body);
        else if (next === "CANNOT_PREPARE") {
            void cannotPrepare({ ...body, reasonDetail: "Cannot prepare" });
        }
    }

    return (
        <Select value={current} onValueChange={apply}>
            <SelectTrigger
                size="sm"
                aria-label="Status"
                className={cn(
                    "h-7 min-w-[8.5rem] rounded-full border-0 px-2.5 text-[12px] font-medium shadow-none focus-visible:ring-1",
                    tone(ticket),
                )}
            >
                <SelectValue>{stationStateLabel(ticket.state)}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
                {SETTABLE.map(state => (
                    <SelectItem key={state} value={state}>
                        {stationStateLabel(state)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
