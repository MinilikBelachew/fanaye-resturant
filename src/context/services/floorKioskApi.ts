import { API_BASE_URL } from "@/context/env";
import { api } from "./index";

export interface FloorKioskReadyItem {
    id: string;
    name: string;
    quantity: number;
    stationName: string;
    readyAt: string | null;
}

export interface FloorKioskTable {
    id: string;
    displayName: string;
    displayNumber: string | null;
    locationName: string;
    status: string;
    isVip: boolean;
    assignedWaiterId: string | null;
    assignedWaiterName: string | null;
    activeSession: {
        id: string;
        status: string;
        openedAt: string;
        billRequestedAt: string | null;
    } | null;
    readyItems: FloorKioskReadyItem[];
    oldestReadyAt: string | null;
}

export interface FloorKioskBoardResponse {
    branchId: string;
    branchName: string;
    readyOverdueMinutes: number;
    serverTime: string;
    tables: FloorKioskTable[];
}

export interface UnlockFloorKioskResponse {
    kioskToken: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    branchId: string;
    branchName: string;
    readyOverdueMinutes: number;
}

async function kioskFetch<T>(
    path: string,
    options: RequestInit & { token?: string } = {},
): Promise<T> {
    const { token, headers, ...rest } = options;
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(headers ?? {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg =
            data?.message || data?.error || `Request failed (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    }
    return data as T;
}

export function unlockFloorKiosk(payload: {
    tenantIdentifier?: string;
    branchId?: string;
    pin: string;
}) {
    return kioskFetch<UnlockFloorKioskResponse>("/floor/kiosk/unlock", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function fetchFloorKioskBoard(kioskToken: string) {
    return kioskFetch<FloorKioskBoardResponse>("/floor/kiosk/board", {
        method: "GET",
        token: kioskToken,
    });
}

export function verifyFloorKioskTableAccess(
    kioskToken: string,
    payload: { tableId: string; pin: string },
) {
    return kioskFetch<{
        tableId: string;
        tableName: string;
        sessionId: string | null;
    }>("/floor/kiosk/verify-table-access", {
        method: "POST",
        token: kioskToken,
        body: JSON.stringify(payload),
    });
}

export interface FloorKioskSettingsDto {
    branchId: string;
    floorKioskPin: string | null;
    readyOverdueMinutes: number;
}

export const floorKioskSettingsApi = api.injectEndpoints({
    endpoints: builder => ({
        getFloorKioskSettings: builder.query<
            FloorKioskSettingsDto,
            { branchId?: string } | void
        >({
            query: params => ({
                url: "/floor/kiosk/settings",
                method: "GET",
                params: params ?? undefined,
            }),
            providesTags: ["Floor"],
        }),
        updateFloorKioskSettings: builder.mutation<
            FloorKioskSettingsDto,
            {
                branchId?: string;
                floorKioskPin?: string | null;
                readyOverdueMinutes?: number;
            }
        >({
            query: body => ({
                url: "/floor/kiosk/settings",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        pairFloorKioskDevice: builder.mutation<
            UnlockFloorKioskResponse,
            { branchId?: string } | void
        >({
            query: body => ({
                url: "/floor/kiosk/pair-device",
                method: "POST",
                body: body ?? {},
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetFloorKioskSettingsQuery,
    useUpdateFloorKioskSettingsMutation,
    usePairFloorKioskDeviceMutation,
} = floorKioskSettingsApi;
