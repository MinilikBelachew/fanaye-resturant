"use client";

import { useAppDispatch } from "@/context/hooks";
import {
    acknowledgeItem,
    cannotPrepareItem,
    markItemReady,
    startPreparation,
} from "@/context/slices/opsSlice";
import type { OrderItem } from "@/domains/ordering/domain/order";
import { Button } from "@/components/ui/button";

export default function StationTicketActions({
    item,
    compact = false,
}: {
    item: OrderItem;
    compact?: boolean;
}) {
    const dispatch = useAppDispatch();
    const size = compact ? "sm" : "default";

    if (item.status === "queued") {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    size={size}
                    onClick={() => dispatch(acknowledgeItem(item.id))}
                >
                    Acknowledge
                </Button>
                <Button
                    size={size}
                    variant="outline"
                    onClick={() => dispatch(startPreparation(item.id))}
                >
                    Start
                </Button>
            </div>
        );
    }

    if (item.status === "acknowledged") {
        return (
            <Button
                size={size}
                onClick={() => dispatch(startPreparation(item.id))}
            >
                Start preparing
            </Button>
        );
    }

    if (item.status === "in_preparation") {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    size={size}
                    onClick={() => dispatch(markItemReady(item.id))}
                >
                    Mark ready
                </Button>
                <Button
                    size={size}
                    variant="outline"
                    onClick={() =>
                        dispatch(
                            cannotPrepareItem({
                                itemId: item.id,
                                reason: "Cannot prepare",
                            }),
                        )
                    }
                >
                    Cannot prepare
                </Button>
            </div>
        );
    }

    if (item.status === "ready") {
        return (
            <p className="text-[13px] text-slate-gray">
                Waiting for waiter to serve
            </p>
        );
    }

    return null;
}
