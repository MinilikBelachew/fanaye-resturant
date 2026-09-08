import type {
    StationQueueResponse,
    StationTicket,
} from "@/domains/fulfillment/domain/stationTicket";
import { api } from "./index";

export const stationsApi = api.injectEndpoints({
    endpoints: builder => ({
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
    useStationQueueQuery,
    useStationOrderItemQuery,
    useAcknowledgeOrderItemMutation,
    useStartPreparationMutation,
    useMarkItemReadyMutation,
    useReportCannotPrepareMutation,
} = stationsApi;
