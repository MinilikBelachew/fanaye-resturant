"use client";

import { useAppSelector } from "@/context/hooks";

/**
 * When the ops Socket.IO connection is up, skip HTTP polling (0).
 * When disconnected, fall back to a slower interval than the old 3–5s storm.
 */
export function useRealtimePollMs(fallbackMs = 12_000): number {
    const connected = useAppSelector(state => state.notifications.connected);
    return connected ? 0 : fallbackMs;
}
