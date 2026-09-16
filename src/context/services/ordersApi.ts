import type {
    ConfirmOrderRequest,
    ConfirmOrderResponse,
    SessionOrdersResponse,
    WaiterMenuResponse,
} from "@/domains/ordering/domain/waiterMenu";
import { api } from "./index";

function idempotencyKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type ServedOrderItemResponse = {
    orderItemId: string;
    state: string;
    servedAt: string;
    version: number;
};

export const ordersApi = api.injectEndpoints({
    endpoints: builder => ({
        waiterMenu: builder.query<
            WaiterMenuResponse,
            { tableSessionId?: string; search?: string; categoryId?: string }
        >({
            query: params => ({
                url: "/waiter/menu",
                method: "GET",
                params,
            }),
            providesTags: ["Menu"],
        }),
        tableSessionOrders: builder.query<SessionOrdersResponse, string>({
            query: tableSessionId => ({
                url: `/table-sessions/${tableSessionId}/orders`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [{ type: "Order", id }],
        }),
        confirmOrder: builder.mutation<
            ConfirmOrderResponse,
            ConfirmOrderRequest
        >({
            query: body => ({
                url: "/orders",
                method: "POST",
                body,
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Menu",
                "Station",
                { type: "Order", id: arg.tableSessionId },
            ],
        }),
        markOrderItemServed: builder.mutation<
            ServedOrderItemResponse,
            {
                orderItemId: string;
                expectedVersion: number;
                tableSessionId: string;
            }
        >({
            query: ({ orderItemId, expectedVersion }) => ({
                url: `/order-items/${orderItemId}/served`,
                method: "POST",
                body: { expectedVersion },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Station",
                { type: "Order", id: arg.tableSessionId },
            ],
        }),
        cancelOrderItem: builder.mutation<
            {
                data: {
                    orderItemId: string;
                    state: string;
                    version: number;
                    itemName?: string;
                };
            },
            {
                orderItemId: string;
                expectedVersion: number;
                reason: string;
                tableSessionId: string;
            }
        >({
            query: ({ orderItemId, expectedVersion, reason }) => ({
                url: `/order-items/${orderItemId}/cancel`,
                method: "POST",
                body: { expectedVersion, reason },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Station",
                "Approvals",
                { type: "Order", id: arg.tableSessionId },
            ],
        }),
        requestOrderCancellation: builder.mutation<
            {
                data: {
                    orderItemId: string;
                    state: string;
                    version: number;
                    cancellationRequestId?: string | null;
                    status?: string;
                };
            },
            {
                orderItemId: string;
                expectedVersion: number;
                reason: string;
                tableSessionId: string;
            }
        >({
            query: ({ orderItemId, expectedVersion, reason }) => ({
                url: `/order-items/${orderItemId}/cancellation-requests`,
                method: "POST",
                body: { expectedVersion, reason },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Station",
                "Approvals",
                { type: "Order", id: arg.tableSessionId },
            ],
        }),
        requestOrderChange: builder.mutation<
            {
                data: {
                    orderItemId: string;
                    state: string;
                    version: number;
                    itemName?: string;
                    applied?: boolean;
                    changeRequestId?: string | null;
                    status?: string;
                };
            },
            {
                orderItemId: string;
                expectedVersion: number;
                reason?: string;
                requestedChange: {
                    menuItemId?: string;
                    specialInstruction?: string | null;
                };
                tableSessionId: string;
            }
        >({
            query: ({
                orderItemId,
                expectedVersion,
                reason,
                requestedChange,
            }) => ({
                url: `/order-items/${orderItemId}/change-requests`,
                method: "POST",
                body: { expectedVersion, reason, requestedChange },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Station",
                "Menu",
                "Approvals",
                { type: "Order", id: arg.tableSessionId },
            ],
        }),
        orderMutationApprovals: builder.query<
            {
                data: Array<{
                    type: "CANCELLATION" | "CHANGE";
                    requestId: string;
                    orderItemId: string;
                    itemName: string;
                    tableDisplayName: string;
                    stationName: string;
                    itemState: string;
                    itemVersion: number;
                    reason: string | null;
                    requestedChange?: Record<string, unknown> | null;
                    requestedByName: string;
                    requestedAt: string;
                }>;
            },
            void
        >({
            query: () => ({
                url: "/approvals/order-mutations",
                method: "GET",
            }),
            providesTags: ["Approvals"],
        }),
        approveCancellationRequest: builder.mutation<
            unknown,
            {
                requestId: string;
                expectedOrderItemVersion: number;
                decisionReason?: string;
            }
        >({
            query: ({ requestId, ...body }) => ({
                url: `/cancellation-requests/${requestId}/approve`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Approvals", "Floor", "Station", "Order"],
        }),
        rejectCancellationRequest: builder.mutation<
            unknown,
            {
                requestId: string;
                expectedOrderItemVersion: number;
                decisionReason?: string;
            }
        >({
            query: ({ requestId, ...body }) => ({
                url: `/cancellation-requests/${requestId}/reject`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Approvals", "Floor", "Station", "Order"],
        }),
        approveChangeRequest: builder.mutation<
            unknown,
            {
                requestId: string;
                expectedOrderItemVersion: number;
                decisionReason?: string;
            }
        >({
            query: ({ requestId, ...body }) => ({
                url: `/change-requests/${requestId}/approve`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Approvals", "Floor", "Station", "Order"],
        }),
        rejectChangeRequest: builder.mutation<
            unknown,
            {
                requestId: string;
                expectedOrderItemVersion: number;
                decisionReason?: string;
            }
        >({
            query: ({ requestId, ...body }) => ({
                url: `/change-requests/${requestId}/reject`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Approvals", "Floor", "Station", "Order"],
        }),
        sendToKitchen: builder.mutation<
            { success: boolean; count: number; message: string },
            { tableSessionId: string; orderId?: string }
        >({
            query: body => ({
                url: "/orders/send-to-kitchen",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Station",
                { type: "Order", id: arg.tableSessionId },
            ],
        }),
    }),
});

export const {
    useWaiterMenuQuery,
    useTableSessionOrdersQuery,
    useConfirmOrderMutation,
    useMarkOrderItemServedMutation,
    useCancelOrderItemMutation,
    useRequestOrderCancellationMutation,
    useRequestOrderChangeMutation,
    useOrderMutationApprovalsQuery,
    useApproveCancellationRequestMutation,
    useRejectCancellationRequestMutation,
    useApproveChangeRequestMutation,
    useRejectChangeRequestMutation,
    useSendToKitchenMutation,
} = ordersApi;
