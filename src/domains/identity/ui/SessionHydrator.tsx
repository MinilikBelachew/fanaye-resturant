"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { authApi } from "@/context/services/authApi";
import {
    clearSession,
    hydrateStaff,
    markHydrated,
    STAFF_LIST_STORAGE_KEY,
} from "@/context/slices/identitySlice";
import { hydrateOps, OPS_KEY } from "@/context/slices/opsSlice";
import { hydrateMenu, MENU_STORAGE_KEY } from "@/context/slices/menuSlice";
import {
    hydrateStations,
    STATIONS_STORAGE_KEY,
} from "@/context/slices/stationSlice";
import { clearLegacyAuthStorage } from "@/domains/identity/infrastructure/authSession";

const DEMO_STORAGE_KEYS = [
    STAFF_LIST_STORAGE_KEY,
    OPS_KEY,
    MENU_STORAGE_KEY,
    STATIONS_STORAGE_KEY,
    "fanaye.demo.staffList.v1",
    "fanaye.demo.ops.v1",
    "fanaye.demo.menu.v1",
    "fanaye.demo.stations.v1",
];

/** Boots auth session and clears leftover local demo state. */
export default function SessionHydrator({
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
        for (const key of DEMO_STORAGE_KEYS) {
            try {
                localStorage.removeItem(key);
            } catch {
                // Ignore private-mode / unavailable storage.
            }
        }

        dispatch(hydrateStaff([]));
        dispatch(hydrateOps(null));
        dispatch(hydrateMenu([]));
        dispatch(hydrateStations([]));
        clearLegacyAuthStorage();

        dispatch(authApi.endpoints.refresh.initiate())
            .unwrap()
            .then(() =>
                dispatch(
                    authApi.endpoints.me.initiate(undefined, {
                        forceRefetch: true,
                    }),
                ).unwrap(),
            )
            .catch(() => {
                dispatch(clearSession());
            })
            .finally(() => {
                dispatch(markHydrated());
            });
    }, [dispatch]);

    if (!identityReady || !opsReady || !menuReady || !stationReady) {
        return (
            <div className="flex h-svh items-center justify-center bg-background text-slate-gray">
                Loading…
            </div>
        );
    }

    return children;
}
