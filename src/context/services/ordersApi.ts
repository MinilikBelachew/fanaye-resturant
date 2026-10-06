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

export type ApprovalRequestType = "CANCELLATION" | "CHANGE";
export type ApprovalPeriod = "day" | "week" | "month";

export type ApprovalQueueItem = {
    type: ApprovalRequestType;
    requestId: string;
    orderItemId: string;
    orderId: string;
    tableId: string;
    itemName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    currencyCode: string;
    tableDisplayName: string;
    tableDisplayNumber?: string | null;
    stationName: string;
    stationId?: string | null;
    itemState: string;
    stateAtRequest: string;
    itemVersion: number;
    status: string;
    reason: string | null;
    specialInstruction?: string | null;
    requestedChange?: Record<string, unknown> | null;
    requestedByName: string;
    requestedAt: string;
    decidedByName?: string | null;
    decidedAt?: string | null;
    decisionReason?: string | null;
};

export type ApprovalQueueResponse = {
    data: ApprovalQueueItem[];
    summary?: {
        pendingCount: number;
        cancellationCount: number;
        changeCount: number;
    };
};

export type ApprovalHistoryParams = {
    period?: ApprovalPeriod;
    type?: ApprovalRequestType | "ALL";
    q?: string;
    page?: number;
    limit?: number;
};

export type ApprovalHistoryResponse = {
    period: string;
    from: string;
    to: string;
    data: ApprovalQueueItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export const ordersApi = api.injectEndpoints({
    overrideExisting: true,
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
        orderMutationApprovals: builder.query<ApprovalQueueResponse, void>({
            query: () => ({
                url: "/approvals/order-mutations",
                method: "GET",
            }),
            providesTags: ["Approvals"],
        }),
        approvalDetail: builder.query<
            { data: ApprovalQueueItem },
            { type: ApprovalRequestType; requestId: string }
        >({
            query: ({ type, requestId }) => ({
                url: `/approvals/order-mutations/${type.toLowerCase()}/${requestId}`,
                method: "GET",
            }),
            providesTags: (_result, _error, arg) => [
                "Approvals",
                {
                    type: "Approvals" as const,
                    id: `${arg.type}-${arg.requestId}`,
                },
            ],
        }),
        approvalHistory: builder.query<
            ApprovalHistoryResponse,
            ApprovalHistoryParams | void
        >({
            query: (params = {}) => ({
                url: "/approvals/order-mutations/history",
                method: "GET",
                params: {
                    ...(params?.period ? { period: params.period } : {}),
                    ...(params?.type && params.type !== "ALL"
                        ? { type: params.type }
                        : {}),
                    ...(params?.q ? { q: params.q } : {}),
                    ...(params?.page ? { page: params.page } : {}),
                    ...(params?.limit ? { limit: params.limit } : {}),
                },
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

export const useWaiterMenuQuery = ordersApi.endpoints.waiterMenu.useQuery;
export const useTableSessionOrdersQuery =
    ordersApi.endpoints.tableSessionOrders.useQuery;
export const useConfirmOrderMutation =
    ordersApi.endpoints.confirmOrder.useMutation;
export const useMarkOrderItemServedMutation =
    ordersApi.endpoints.markOrderItemServed.useMutation;
export const useCancelOrderItemMutation =
    ordersApi.endpoints.cancelOrderItem.useMutation;
export const useRequestOrderCancellationMutation =
    ordersApi.endpoints.requestOrderCancellation.useMutation;
export const useRequestOrderChangeMutation =
    ordersApi.endpoints.requestOrderChange.useMutation;
export const useOrderMutationApprovalsQuery =
    ordersApi.endpoints.orderMutationApprovals.useQuery;
export const useApprovalDetailQuery =
    ordersApi.endpoints.approvalDetail.useQuery;
export const useApprovalHistoryQuery =
    ordersApi.endpoints.approvalHistory.useQuery;
export const useApproveCancellationRequestMutation =
    ordersApi.endpoints.approveCancellationRequest.useMutation;
export const useRejectCancellationRequestMutation =
    ordersApi.endpoints.rejectCancellationRequest.useMutation;
export const useApproveChangeRequestMutation =
    ordersApi.endpoints.approveChangeRequest.useMutation;
export const useRejectChangeRequestMutation =
    ordersApi.endpoints.rejectChangeRequest.useMutation;
export const useSendToKitchenMutation =
    ordersApi.endpoints.sendToKitchen.useMutation;
