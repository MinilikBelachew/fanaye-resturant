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
            }
        >({
            query: ({ orderItemId, expectedVersion, reasonDetail }) => ({
                url: `/order-items/${orderItemId}/production-exceptions`,
                method: "POST",
                body: { expectedVersion, reasonDetail },
            }),
            invalidatesTags: ["Station", "Floor", "Order"],
        }),
    }),
});

export const {
    useGetStationsQuery,
    useCreateStationMutation,
    useUpdateStationMutation,
    useDeleteStationMutation,
    useStationQueueQuery,
    useStationOrderItemQuery,
    useAcknowledgeOrderItemMutation,
    useStartPreparationMutation,
    useMarkItemReadyMutation,
    useReportCannotPrepareMutation,
} = stationsApi;
