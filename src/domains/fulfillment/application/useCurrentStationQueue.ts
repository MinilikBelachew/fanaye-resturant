"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/context/hooks";
import {
    useGetStationsQuery,
    useStationQueueQuery,
} from "@/context/services/stationsApi";
import { stationQueueCounts } from "@/domains/fulfillment/domain/stationTicket";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";
import type { StationRole } from "@/domains/identity/domain/role";

export function useCurrentStationQueue(role?: StationRole) {
    const sessionStationId = useAppSelector(
        state => state.identity.session?.stationId,
    );
    const { data: stations = [] } = useGetStationsQuery(undefined, {
        skip: Boolean(sessionStationId),
    });

    const stationId = useMemo(() => {
        if (sessionStationId) return sessionStationId;
        if (!role || stations.length === 0) return null;
        const normalizedRole = role.toLowerCase().replace(/[-_]/g, "");
        const matched = stations.find(s => {
            const code = (s.code ?? "").toLowerCase().replace(/[-_]/g, "");
            const name = (s.name ?? "").toLowerCase().replace(/[-_]/g, "");
            return (
                code === normalizedRole ||
                name.includes(normalizedRole) ||
                (normalizedRole === "softdrinks" &&
                    (code.includes("drink") ||
                        name.includes("drink") ||
                        name.includes("bar")))
            );
        });
        return matched?.id ?? null;
    }, [sessionStationId, role, stations]);

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
