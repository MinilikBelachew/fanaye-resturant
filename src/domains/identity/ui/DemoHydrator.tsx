"use client";

import { useEffect } from "react";
import { store } from "@/context/store";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    hydrateIdentity,
    hydrateStaff,
    STAFF_KEY,
    STAFF_LIST_STORAGE_KEY,
} from "@/context/slices/identitySlice";
import {
    hydrateOps,
    OPS_KEY,
    type OpsState,
} from "@/context/slices/opsSlice";
import {
    hydrateMenu,
    MENU_STORAGE_KEY,
} from "@/context/slices/menuSlice";
import {
    hydrateStations,
    STATIONS_STORAGE_KEY,
} from "@/context/slices/stationSlice";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import type { PreparationStation } from "@/domains/fulfillment/domain/station";
import type { Staff } from "@/domains/identity/domain/staff";

function persistOps() {
    const state = store.getState();
    if (!state.ops.hydrated) return;
    const payload: OpsState = {
        tables: state.ops.tables,
        sessions: state.ops.sessions,
        orders: state.ops.orders,
        items: state.ops.items,
        notifications: state.ops.notifications,
        payments: state.ops.payments,
        hydrated: true,
    };
    localStorage.setItem(OPS_KEY, JSON.stringify(payload));

    if (state.menu.hydrated) {
        localStorage.setItem(
            MENU_STORAGE_KEY,
            JSON.stringify(state.menu.items),
        );
    }

    if (state.station.hydrated) {
        localStorage.setItem(
            STATIONS_STORAGE_KEY,
            JSON.stringify(state.station.stations),
        );
    }

    if (state.identity.hydrated) {
        localStorage.setItem(
            STAFF_LIST_STORAGE_KEY,
            JSON.stringify(state.identity.staffMembers),
        );
    }
}

export default function DemoHydrator({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useAppDispatch();
    const identityReady = useAppSelector(state => state.identity.hydrated);
    const opsReady = useAppSelector(state => state.ops.hydrated);
    const menuReady = useAppSelector(state => state.menu.hydrated);
    const stationReady = useAppSelector(state => state.station.hydrated);

    useEffect(() => {
        try {
            const rawStaff = localStorage.getItem(STAFF_LIST_STORAGE_KEY);
            dispatch(
                hydrateStaff(
                    rawStaff ? (JSON.parse(rawStaff) as Staff[]) : null,
                ),
            );
        } catch {
            dispatch(hydrateStaff(null));
        }

        const staffId = localStorage.getItem(STAFF_KEY);
        dispatch(hydrateIdentity(staffId));

        try {
            const rawOps = localStorage.getItem(OPS_KEY);
            dispatch(hydrateOps(rawOps ? (JSON.parse(rawOps) as OpsState) : null));
        } catch {
            dispatch(hydrateOps(null));
        }

        try {
            const rawMenu = localStorage.getItem(MENU_STORAGE_KEY);
            dispatch(
                hydrateMenu(rawMenu ? (JSON.parse(rawMenu) as MenuItem[]) : null),
            );
        } catch {
            dispatch(hydrateMenu(null));
        }

        try {
            const rawStations = localStorage.getItem(STATIONS_STORAGE_KEY);
            dispatch(
                hydrateStations(
                    rawStations
                        ? (JSON.parse(rawStations) as PreparationStation[])
                        : null,
                ),
            );
        } catch {
            dispatch(hydrateStations(null));
        }
    }, [dispatch]);

    useEffect(() => {
        if (!opsReady || !menuReady || !stationReady || !identityReady) return;
        persistOps();
        return store.subscribe(persistOps);
    }, [opsReady, menuReady, stationReady, identityReady]);

    if (!identityReady || !opsReady || !menuReady || !stationReady) {
        return (
            <div className="flex h-svh items-center justify-center bg-background text-slate-gray">
                Loading Fanaye…
            </div>
        );
    }

    return children;
}
