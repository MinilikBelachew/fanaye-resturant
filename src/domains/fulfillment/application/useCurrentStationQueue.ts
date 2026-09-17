"use client";

import { useAppSelector } from "@/context/hooks";
import { useStationQueueQuery } from "@/context/services/stationsApi";
import { stationQueueCounts } from "@/domains/fulfillment/domain/stationTicket";

export function useCurrentStationQueue() {
    const stationId = useAppSelector(
        state => state.identity.session?.stationId,
    );
    const query = useStationQueueQuery(stationId ?? "", {
        skip: !stationId,
        // Keep board fresh; sockets also invalidate this tag instantly.
        pollingInterval: 3000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    const tickets = query.data?.data ?? [];

    return {
        stationId: stationId ?? null,
        tickets,
        counts: stationQueueCounts(tickets),
        ...query,
    };
}
