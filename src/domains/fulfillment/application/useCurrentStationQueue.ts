"use client";

import { useAppSelector } from "@/context/hooks";
import { useStationQueueQuery } from "@/context/services/stationsApi";
import { stationQueueCounts } from "@/domains/fulfillment/domain/stationTicket";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";

export function useCurrentStationQueue() {
    const stationId = useAppSelector(
        state => state.identity.session?.stationId,
    );
    const pollMs = useRealtimePollMs(12_000);
    const query = useStationQueueQuery(stationId ?? "", {
        skip: !stationId,
        // Socket invalidates instantly; poll only as backup when disconnected.
        pollingInterval: pollMs,
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
