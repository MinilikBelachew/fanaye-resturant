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

export const waiterPerformanceApi = api.injectEndpoints({
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
    }),
});

export const { useWaiterPerformanceQuery } = waiterPerformanceApi;
