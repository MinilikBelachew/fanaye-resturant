"use client";

import { useAppDispatch } from "@/context/hooks";
import {
    setStationItemStatus,
    STATION_SETTABLE_STATUSES,
    type StationSettableStatus,
} from "@/context/slices/opsSlice";
import { STATION_STATUS_LABELS } from "@/domains/ordering/domain/order";
import type { OrderItem } from "@/domains/ordering/domain/order";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function isSettable(status: OrderItem["status"]): status is StationSettableStatus {
    return (STATION_SETTABLE_STATUSES as readonly string[]).includes(status);
}

function statusTone(item: OrderItem, delayed: boolean) {
    if (item.status === "rejected_by_station" || delayed) {
        return "bg-destructive/10 text-destructive hover:bg-destructive/15";
    }
    if (item.status === "ready") {
        return "bg-accent text-accent-foreground hover:bg-accent/80";
    }
    if (item.status === "in_preparation") {
        return "bg-[#fff4e5] text-[#c2410c] hover:bg-[#ffedd5]";
    }
    return "bg-secondary text-slate-gray hover:bg-secondary/80";
}

export default function StationStatusSelect({
    item,
    delayed = false,
}: {
    item: OrderItem;
    delayed?: boolean;
}) {
    const dispatch = useAppDispatch();
    const current = isSettable(item.status) ? item.status : null;

    if (!current) {
        return (
            <Badge
                variant={
                    item.status === "ready"
                        ? "default"
                        : delayed
                          ? "danger"
                          : "secondary"
                }
            >
                {STATION_STATUS_LABELS[item.status]}
            </Badge>
        );
    }

    return (
        <Select
            value={current}
            onValueChange={value =>
                dispatch(
                    setStationItemStatus({
                        itemId: item.id,
                        status: value as StationSettableStatus,
                    }),
                )
            }
        >
            <SelectTrigger
                size="sm"
                aria-label="Status"
                className={cn(
                    "h-7 min-w-[8.5rem] rounded-full border-0 px-2.5 text-[12px] font-medium shadow-none focus-visible:ring-1",
                    statusTone(item, delayed),
                )}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
                {STATION_SETTABLE_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                        {STATION_STATUS_LABELS[status]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
