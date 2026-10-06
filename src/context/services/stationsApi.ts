import type {
    StationQueueResponse,
    StationTicket,
} from "@/domains/fulfillment/domain/stationTicket";
import type { PreparationStation } from "@/domains/fulfillment/domain/station";
import { api } from "./index";

export const stationsApi = api.injectEndpoints({
    endpoints: builder => ({
        getStations: builder.query<PreparationStation[], void>({
            query: () => ({
                url: "/stations",
                method: "GET",
            }),
            providesTags: ["Station"],
        }),
        createStation: builder.mutation<
            PreparationStation,
            {
                name: string;
                code?: string;
                description?: string;
                status?: string;
                defaultDelayThresholdMinutes?: number;
                avgPrepMin?: number;
                color?: string;
                category?: string;
                sortOrder?: number;
            }
        >({
            query: body => ({
                url: "/stations",
                method: "POST",
                body: {
                    name: body.name,
                    code: body.code,
                    status: body.status ?? "ACTIVE",
                    defaultDelayThresholdMinutes:
                        body.defaultDelayThresholdMinutes ??
                        body.avgPrepMin ??
                        10,
                    sortOrder: body.sortOrder ?? 0,
                },
            }),
            invalidatesTags: ["Station", "Menu", "Order"],
        }),
        updateStation: builder.mutation<
            PreparationStation,
            {
                id: string;
                name?: string;
                code?: string;
                description?: string;
                status?: string;
                enabled?: boolean;
                defaultDelayThresholdMinutes?: number;
                avgPrepMin?: number;
                color?: string;
                category?: string;
                sortOrder?: number;
            }
        >({
            query: ({ id, enabled, ...body }) => ({
                url: `/stations/${id}`,
                method: "PATCH",
                body: {
                    ...body,
                    ...(enabled !== undefined
                        ? { status: enabled ? "ACTIVE" : "DISABLED" }
                        : {}),
                    ...(body.avgPrepMin !== undefined
                        ? { defaultDelayThresholdMinutes: body.avgPrepMin }
                        : {}),
                },
            }),
            invalidatesTags: ["Station", "Menu", "Order"],
        }),
        deleteStation: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: id => ({
                url: `/stations/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Station", "Menu", "Order"],
        }),
        stationDetail: builder.query<StationDetailResponse, string>({
            query: stationId => ({
                url: `/stations/${stationId}/detail`,
                method: "GET",
            }),
            providesTags: (_result, _error, stationId) => [
                { type: "Station", id: `${stationId}-detail` },
                "Station",
            ],
        }),
        stationHistory: builder.query<
            StationHistoryResponse,
            StationHistoryParams
        >({
            query: ({ stationId, ...params }) => ({
                url: `/stations/${stationId}/history`,
                method: "GET",
                params: {
                    ...(params.q ? { q: params.q } : {}),
                    ...(params.state ? { state: params.state } : {}),
                    ...(params.period ? { period: params.period } : {}),
                    ...(params.fromDate ? { fromDate: params.fromDate } : {}),
                    ...(params.toDate ? { toDate: params.toDate } : {}),
                    ...(params.page ? { page: params.page } : {}),
                    ...(params.limit ? { limit: params.limit } : {}),
                },
            }),
            providesTags: (_result, _error, { stationId }) => [
                { type: "Station", id: `${stationId}-history` },
                "Station",
            ],
        }),
        stationQueue: builder.query<StationQueueResponse, string>({
            query: stationId => ({
                url: `/stations/${stationId}/queue`,
                method: "GET",
            }),
            providesTags: (_result, _error, stationId) => [
                { type: "Station", id: stationId },
                "Station",
            ],
        }),
        stationOrderItem: builder.query<StationTicket, string>({
            query: id => ({
                url: `/order-items/${id}`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [{ type: "Station", id }],
        }),
        acknowledgeOrderItem: builder.mutation<
            StationTicket,
            { orderItemId: string; expectedVersion: number }
        >({
            query: ({ orderItemId, expectedVersion }) => ({
                url: `/order-items/${orderItemId}/acknowledge`,
                method: "POST",
                body: { expectedVersion },
            }),
            invalidatesTags: ["Station", "Floor", "Order"],
        }),
        startPreparation: builder.mutation<
            StationTicket,
            { orderItemId: string; expectedVersion: number }
        >({
            query: ({ orderItemId, expectedVersion }) => ({
                url: `/order-items/${orderItemId}/start-preparation`,
                method: "POST",
                body: { expectedVersion },
            }),
            invalidatesTags: ["Station", "Floor", "Order"],
        }),
        markItemReady: builder.mutation<
            StationTicket,
            { orderItemId: string; expectedVersion: number }
        >({
            query: ({ orderItemId, expectedVersion }) => ({
                url: `/order-items/${orderItemId}/ready`,
                method: "POST",
                body: { expectedVersion },
            }),
            invalidatesTags: ["Station", "Floor", "Order"],
        }),
        reportCannotPrepare: builder.mutation<
            StationTicket,
            {
                orderItemId: string;
                expectedVersion: number;
                reasonDetail?: string;
                markSoldOut?: boolean;
            }
        >({
            query: ({
                orderItemId,
                expectedVersion,
                reasonDetail,
                markSoldOut,
            }) => ({
                url: `/order-items/${orderItemId}/production-exceptions`,
                method: "POST",
                body: { expectedVersion, reasonDetail, markSoldOut },
            }),
            invalidatesTags: ["Station", "Floor", "Order", "Menu"],
        }),
        stationMenu: builder.query<StationMenuResponse, string>({
            query: stationId => ({
                url: `/stations/${stationId}/menu`,
                method: "GET",
            }),
            providesTags: (_result, _error, stationId) => [
                { type: "Station", id: `${stationId}-menu` },
                "Menu",
            ],
        }),
        markStationItemSoldOut: builder.mutation<
            StationMenuItem,
            { stationId: string; menuItemId: string; reason?: string }
        >({
            query: ({ stationId, menuItemId, reason }) => ({
                url: `/stations/${stationId}/menu/${menuItemId}/sold-out`,
                method: "POST",
                body: reason ? { reason } : {},
            }),
            invalidatesTags: ["Station", "Menu", "Order"],
        }),
        clearStationItemSoldOut: builder.mutation<
            StationMenuItem,
            { stationId: string; menuItemId: string }
        >({
            query: ({ stationId, menuItemId }) => ({
                url: `/stations/${stationId}/menu/${menuItemId}/sold-out`,
                method: "DELETE",
            }),
            invalidatesTags: ["Station", "Menu", "Order"],
        }),
        setStationItemLimit: builder.mutation<
            StationMenuItem,
            {
                stationId: string;
                menuItemId: string;
                remainingQty: number;
                reason?: string;
            }
        >({
            query: ({ stationId, menuItemId, remainingQty, reason }) => ({
                url: `/stations/${stationId}/menu/${menuItemId}/limit`,
                method: "PUT",
                body: { remainingQty, reason },
            }),
            invalidatesTags: ["Station", "Menu", "Order"],
        }),
        clearStationItemLimit: builder.mutation<
            StationMenuItem,
            { stationId: string; menuItemId: string }
        >({
            query: ({ stationId, menuItemId }) => ({
                url: `/stations/${stationId}/menu/${menuItemId}/limit`,
                method: "DELETE",
            }),
            invalidatesTags: ["Station", "Menu", "Order"],
        }),
    }),
});

export type StationMenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: string;
    currencyCode: string;
    soldOut: boolean;
    remainingQty: number | null;
    availabilityState: string | null;
    availabilityReason: string | null;
    imageKey: string | null;
    imageUrl: string | null;
    categoryName: string | null;
};

export type StationMenuResponse = {
    stationId: string;
    stationName: string;
    data: StationMenuItem[];
};

export type StationOwner = {
    membershipId: string;
    displayName: string;
    assignedAt?: string;
};

export type StationDetailResponse = {
    id: string;
    name: string;
    code?: string | null;
    status: string;
    enabled: boolean;
    defaultDelayThresholdMinutes?: number | null;
    avgPrepMin?: number;
    sortOrder: number;
    owners: StationOwner[];
    openTickets: number;
    ticketsToday: number;
    menuItemCount: number;
    servedToday: number;
    createdAt: string;
    updatedAt: string;
};

export type StationHistoryPeriod =
    | "today"
    | "week"
    | "month"
    | "quarter"
    | "year"
    | "custom";

export type StationHistoryParams = {
    stationId: string;
    q?: string;
    state?: string;
    period?: StationHistoryPeriod;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
};

export type StationHistoryItem = {
    id: string;
    itemName: string;
    quantity: number;
    state: string;
    tableDisplayName: string;
    waiterName?: string | null;
    specialInstruction?: string | null;
    businessDate: string;
    confirmedAt: string;
    queuedAt?: string | null;
    readyAt?: string | null;
    servedAt?: string | null;
    prepMinutes?: number | null;
};

export type StationHistoryResponse = {
    stationId: string;
    period: string;
    periodLabel: string;
    data: StationHistoryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export const {
    useGetStationsQuery,
    useCreateStationMutation,
    useUpdateStationMutation,
    useDeleteStationMutation,
    useStationDetailQuery,
    useStationHistoryQuery,
    useStationQueueQuery,
    useStationOrderItemQuery,
    useAcknowledgeOrderItemMutation,
    useStartPreparationMutation,
    useMarkItemReadyMutation,
    useReportCannotPrepareMutation,
    useStationMenuQuery,
    useMarkStationItemSoldOutMutation,
    useClearStationItemSoldOutMutation,
    useSetStationItemLimitMutation,
    useClearStationItemLimitMutation,
} = stationsApi;
