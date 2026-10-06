import { api } from "./index";

export type WaiterPeriod = "day" | "week" | "month";

export type WaiterShiftCoverage = {
    shiftDefinitionId: string;
    shiftName: string;
    startLocalTime: string;
    endLocalTime: string;
    tableCount: number;
};

export type WaiterPerformanceRow = {
    waiterMembershipId: string;
    waiterName: string;
    phone: string | null;
    active: boolean;
    clockedIn: boolean;
    clockInAt: string | null;
    clockOutAt: string | null;
    hoursWorked: number;
    sessionsCount: number;
    assignedShifts: WaiterShiftCoverage[];
    ordersCreatedCount: number;
    tablesServedCount: number;
    netAttributedSales: string;
    cashCollected: string;
    cashDropped: string;
    undroppedCash: string;
    verifiedTransferAmount: string;
};

export type WaiterPerformanceResponse = {
    period: WaiterPeriod;
    from: string;
    to: string;
    currencyCode: string;
    summary: {
        waiterCount: number;
        clockedInCount: number;
        totalHoursWorked: number;
        totalNetSales: string;
        totalCashCollected: string;
        totalUndroppedCash: string;
    };
    data: WaiterPerformanceRow[];
};

export type WaiterCoverageTable = {
    tableId: string;
    displayName: string;
    displayNumber?: string | null;
    locationName: string;
};

export type WaiterShiftCoverageDetail = WaiterShiftCoverage & {
    tables: WaiterCoverageTable[];
};

export type WaiterDetailKpis = {
    hoursWorked: number;
    sessionsCount: number;
    ordersCreatedCount: number;
    tablesServedCount: number;
    netAttributedSales: string;
    cashCollected: string;
    cashDropped: string;
    undroppedCash: string;
    verifiedTransferAmount: string;
    itemCount: number;
};

export type WaiterDetailResponse = {
    waiterMembershipId: string;
    waiterName: string;
    phone?: string | null;
    email?: string | null;
    active: boolean;
    clockedIn: boolean;
    clockInAt?: string | null;
    clockOutAt?: string | null;
    workingDays: string[];
    period: WaiterPeriod;
    from: string;
    to: string;
    currencyCode: string;
    kpis: WaiterDetailKpis;
    assignedShifts: WaiterShiftCoverageDetail[];
};

export type WaiterOrderHistoryParams = {
    membershipId: string;
    period?: WaiterPeriod;
    q?: string;
    page?: number;
    limit?: number;
};

export type WaiterOrderHistoryItem = {
    orderId: string;
    status: string;
    confirmedAt: string;
    businessDate: string;
    tableDisplayName: string;
    tableDisplayNumber?: string | null;
    tableId: string;
    itemCount: number;
    netSales: string;
    currencyCode: string;
};

export type WaiterOrderHistoryResponse = {
    waiterMembershipId: string;
    period: string;
    from: string;
    to: string;
    data: WaiterOrderHistoryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export const waiterPerformanceApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        waiterPerformance: builder.query<
            WaiterPerformanceResponse,
            { period?: WaiterPeriod }
        >({
            query: ({ period = "day" } = {}) => ({
                url: "/manager/waiters",
                method: "GET",
                params: { period },
            }),
            providesTags: ["Floor"],
        }),
        waiterDetail: builder.query<
            WaiterDetailResponse,
            { membershipId: string; period?: WaiterPeriod }
        >({
            query: ({ membershipId, period = "day" }) => ({
                url: `/manager/waiters/${membershipId}/detail`,
                method: "GET",
                params: { period },
            }),
            providesTags: (_result, _error, { membershipId }) => [
                { type: "Floor", id: `waiter-${membershipId}` },
                "Floor",
            ],
        }),
        waiterOrderHistory: builder.query<
            WaiterOrderHistoryResponse,
            WaiterOrderHistoryParams
        >({
            query: ({ membershipId, ...params }) => ({
                url: `/manager/waiters/${membershipId}/orders`,
                method: "GET",
                params: {
                    ...(params.period ? { period: params.period } : {}),
                    ...(params.q ? { q: params.q } : {}),
                    ...(params.page ? { page: params.page } : {}),
                    ...(params.limit ? { limit: params.limit } : {}),
                },
            }),
            providesTags: (_result, _error, { membershipId }) => [
                { type: "Floor", id: `waiter-${membershipId}-orders` },
                "Floor",
            ],
        }),
    }),
});

// Use endpoints.*.useQuery — more reliable after Fast Refresh than
// api.useXQuery aliases, which can be undefined until a full reload.
export const useWaiterPerformanceQuery =
    waiterPerformanceApi.endpoints.waiterPerformance.useQuery;
export const useWaiterDetailQuery =
    waiterPerformanceApi.endpoints.waiterDetail.useQuery;
export const useWaiterOrderHistoryQuery =
    waiterPerformanceApi.endpoints.waiterOrderHistory.useQuery;
