import { api } from "./index";

export type ReportsPeriod = "day" | "week" | "month";
export type ReportsSection =
    | "all"
    | "waiters"
    | "cancels"
    | "inventory"
    | "cash"
    | "stations";

export type ManagerReportsWaiterRow = {
    waiterMembershipId: string;
    waiterName: string;
    hoursWorked: number;
    ordersCreatedCount: number;
    tablesServedCount: number;
    netAttributedSales: string;
    cashCollected: string;
    cashDropped: string;
    undroppedCash: string;
    salesPerHour: string;
};

export type ManagerReportsData = {
    period: ReportsPeriod;
    from: string;
    to: string;
    currencyCode: string;
    branchName: string;
    waiters?: {
        waiterCount: number;
        totalHoursWorked: number;
        totalNetSales: string;
        totalOrders: number;
        totalUndroppedCash: string;
        rows: ManagerReportsWaiterRow[];
    };
    cancels?: {
        cancelledItemsCount: number;
        cancelledItemsValue: string;
        cancellationRequests: number;
        changeRequests: number;
        approvedCount: number;
        rejectedCount: number;
        pendingCount: number;
        approveRate: number;
        rejectRate: number;
        byType: Array<{
            type: "CANCELLATION" | "CHANGE";
            approved: number;
            rejected: number;
            pending: number;
        }>;
        topCancelledItems: Array<{
            itemName: string;
            count: number;
            value: string;
        }>;
    };
    inventory?: {
        totalStockValue: string;
        skuCount: number;
        lowStockCount: number;
        wasteQty: number;
        wasteValue: string;
        receiveValue: string;
        topWaste: Array<{
            ingredientId: string;
            name: string;
            qty: number;
            value: string;
            unit: string;
        }>;
    };
    cash?: {
        dropCount: number;
        cashDropped: string;
        cashReceived: string;
        pendingDropAmount: string;
        disputedAmount: string;
        varianceTotal: string;
        undroppedCashTotal: string;
        byWaiter: Array<{
            waiterMembershipId: string;
            waiterName: string;
            dropped: string;
            undropped: string;
            collected: string;
        }>;
    };
    stations?: {
        avgPrepMinutes: number;
        ticketsCompleted: number;
        delayedCount: number;
        delayedRate: number;
        cannotPrepareCount: number;
        rows: Array<{
            stationId: string;
            stationName: string;
            ticketsCompleted: number;
            avgPrepMinutes: number;
            delayedCount: number;
            delayedRate: number;
            cannotPrepareCount: number;
        }>;
    };
};

export const managerReportsApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        managerReports: builder.query<
            { data: ManagerReportsData },
            { period?: ReportsPeriod; section?: ReportsSection }
        >({
            query: ({ period = "day", section = "all" } = {}) => ({
                url: "/manager/reports",
                method: "GET",
                params: { period, section },
            }),
            providesTags: ["Approvals", "Floor", "Station", "Inventory"],
        }),
    }),
});

export const useManagerReportsQuery =
    managerReportsApi.endpoints.managerReports.useQuery;
