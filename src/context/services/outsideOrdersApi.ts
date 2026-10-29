import { api } from "./index";

export type DestinationType = "BUILDING" | "CAFE" | "KIOSK" | "OTHER";
export type OutsideOrderStatus = "OPEN" | "IN_TRANSIT" | "DELIVERED" | "CLOSED";
export type MaterialIssueStatus =
    | "PENDING"
    | "ISSUED"
    | "RETURNED"
    | "APPROVED"
    | "DISPUTED"
    | "CANCELLED";
export type MaterialCondition = "OK" | "DAMAGED" | "LOST";

export interface OutsideOrderSummary {
    id: string;
    destinationType: DestinationType | string;
    destinationName: string;
    destinationNote?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    status: OutsideOrderStatus | string;
    requiresMaterialReturn: boolean;
    openedAt: string;
    closedAt?: string | null;
    version: number;
    waiter: {
        id: string;
        name: string;
    };
    ordersCount: number;
    itemsCount: number;
    bill?: {
        id: string;
        status: string;
        totalAmount: string | number;
        subtotalAmount: string | number;
    } | null;
    materialsSummary: {
        totalIssued: number;
        totalReturned: number;
        totalShortfall: number;
        hasDispute: boolean;
        issuesCount: number;
        allReturned: boolean;
    };
}

export interface MaterialIssueLine {
    id: string;
    materialId: string;
    materialNameSnapshot: string;
    qtyIssued: number;
    qtyReturned: number;
    qtyShortfall: number;
    condition: MaterialCondition;
    note?: string | null;
    material?: {
        id: string;
        name: string;
        code: string;
        category: string;
        imageUrl?: string | null;
    };
}

export interface OrderMaterialIssue {
    id: string;
    tenantId: string;
    branchId: string;
    orderId: string;
    status: MaterialIssueStatus;
    issuedAt: string;
    returnedAt?: string | null;
    approvedAt?: string | null;
    note?: string | null;
    disputeReason?: string | null;
    version: number;
    lines: MaterialIssueLine[];
    issuedBy?: { id: string; employeeDisplayName: string } | null;
    approvedBy?: { id: string; employeeDisplayName: string } | null;
    waiter?: { id: string; employeeDisplayName: string } | null;
    order?: {
        id: string;
        outsideOrder?: {
            id: string;
            destinationName: string;
            customerName?: string | null;
        } | null;
    } | null;
}

export interface OutsideOrderDetail {
    id: string;
    destinationType: DestinationType | string;
    destinationName: string;
    destinationNote?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    status: OutsideOrderStatus | string;
    requiresMaterialReturn: boolean;
    openedAt: string;
    closedAt?: string | null;
    version: number;
    createdBy: {
        id: string;
        employeeDisplayName: string;
    };
    closedBy?: {
        id: string;
        employeeDisplayName: string;
    } | null;
    orders: Array<{
        id: string;
        status: string;
        confirmedAt?: string;
        items: Array<{
            id: string;
            itemNameSnapshot: string;
            quantity: number;
            state: string;
            priceSnapshot: string | number;
            modifiers?: Array<{
                id: string;
                nameSnapshot: string;
                priceDeltaSnapshot: string | number;
            }>;
        }>;
    }>;
    bills: Array<{
        id: string;
        status: string;
        totalAmount: string | number;
        subtotalAmount: string | number;
        taxAmount?: string | number;
    }>;
    materialIssues: OrderMaterialIssue[];
}

export interface CreateOutsideOrderPayload {
    destinationType?: DestinationType;
    destinationName: string;
    destinationNote?: string;
    customerName?: string;
    customerPhone?: string;
    requiresMaterialReturn?: boolean;
}

export interface UpdateOutsideOrderPayload {
    destinationType?: DestinationType;
    destinationName?: string;
    destinationNote?: string;
    customerName?: string;
    customerPhone?: string;
    status?: OutsideOrderStatus;
}

export interface IssueMaterialsPayload {
    orderId?: string;
    outsideOrderId?: string;
    note?: string;
    lines: Array<{
        materialId: string;
        quantity: number;
        note?: string;
    }>;
}

export interface ReturnMaterialsPayload {
    note?: string;
    lines: Array<{
        lineId: string;
        qtyReturned: number;
        condition?: MaterialCondition;
        note?: string;
    }>;
}

export interface AuditMaterialPayload {
    action: "APPROVE" | "DISPUTE";
    disputeReason?: string;
    note?: string;
}

export const outsideOrdersApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        listOutsideOrders: builder.query<
            { data: OutsideOrderSummary[] },
            { status?: string; businessDate?: string; limit?: number } | void
        >({
            query: params => ({
                url: "/outside-orders",
                method: "GET",
                params: params || {},
            }),
            providesTags: ["OutsideOrders"],
        }),

        getOutsideOrder: builder.query<{ data: OutsideOrderDetail }, string>({
            query: id => ({
                url: `/outside-orders/${id}`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [
                { type: "OutsideOrders", id },
            ],
        }),

        listActiveMaterialIssues: builder.query<
            { data: OrderMaterialIssue[] },
            void
        >({
            query: () => ({
                url: "/outside-orders/materials/active",
                method: "GET",
            }),
            providesTags: ["Materials"],
        }),

        createOutsideOrder: builder.mutation<
            { data: OutsideOrderSummary },
            CreateOutsideOrderPayload
        >({
            query: body => ({
                url: "/outside-orders",
                method: "POST",
                body,
            }),
            invalidatesTags: ["OutsideOrders"],
        }),

        updateOutsideOrder: builder.mutation<
            { data: OutsideOrderSummary },
            { id: string; payload: UpdateOutsideOrderPayload }
        >({
            query: ({ id, payload }) => ({
                url: `/outside-orders/${id}`,
                method: "PATCH",
                body: payload,
            }),
            invalidatesTags: (_res, _err, { id }) => [
                "OutsideOrders",
                { type: "OutsideOrders", id },
            ],
        }),

        closeOutsideOrder: builder.mutation<{ data: any }, string>({
            query: id => ({
                url: `/outside-orders/${id}/close`,
                method: "POST",
            }),
            invalidatesTags: (_res, _err, id) => [
                "OutsideOrders",
                { type: "OutsideOrders", id },
                "Materials",
            ],
        }),

        issueMaterials: builder.mutation<{ data: any }, IssueMaterialsPayload>({
            query: body => ({
                url: "/outside-orders/materials/issue",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Materials", "OutsideOrders", "Inventory"],
        }),

        returnMaterials: builder.mutation<
            { data: any },
            { issueId: string; payload: ReturnMaterialsPayload }
        >({
            query: ({ issueId, payload }) => ({
                url: `/outside-orders/materials/${issueId}/return`,
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Materials", "OutsideOrders"],
        }),

        auditMaterialIssue: builder.mutation<
            { data: any },
            { issueId: string; payload: AuditMaterialPayload }
        >({
            query: ({ issueId, payload }) => ({
                url: `/outside-orders/materials/${issueId}/audit`,
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Materials", "OutsideOrders", "Inventory"],
        }),

        requestMaterials: builder.mutation<
            { data: any },
            { outsideOrderId: string; note: string }
        >({
            query: ({ outsideOrderId, note }) => ({
                url: `/outside-orders/${outsideOrderId}/request-materials`,
                method: "POST",
                body: { note },
            }),
        }),
    }),
});

export const {
    useListOutsideOrdersQuery,
    useGetOutsideOrderQuery,
    useListActiveMaterialIssuesQuery,
    useCreateOutsideOrderMutation,
    useUpdateOutsideOrderMutation,
    useCloseOutsideOrderMutation,
    useIssueMaterialsMutation,
    useReturnMaterialsMutation,
    useAuditMaterialIssueMutation,
    useRequestMaterialsMutation,
} = outsideOrdersApi;
