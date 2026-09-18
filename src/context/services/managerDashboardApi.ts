import { api } from "./index";

export interface ManagerKpi {
    dailyRevenueFormatted: string;
    dailyRevenueValue: number;
    dailyRevenueTrend: string;
    dailyRevenueTrendLabel: string;
    avgPrepTimeFormatted: string;
    avgPrepTimeMinutes: number;
    avgPrepTimeTrend: string;
    avgPrepTimeTrendLabel: string;
    activeTablesFormatted: string;
    activeTablesCount: number;
    totalTablesCount: number;
    floorCapacityPercentage: string;
    tinaVerifyMixPercentage: string;
    tinaVerifyMixValue: number;
    tinaVerifyTrend: string;
    tinaVerifyTrendLabel: string;
    collectionsFormatted: string;
    collectionsValue: number;
    stationBacklogFormatted: string;
    stationBacklogCount: number;
    stationBacklogHint: string;
    pendingActionsFormatted: string;
    pendingBillRequests: number;
    pendingCashDrops: number;
    pendingActionsHint: string;
    billedFormatted: string;
    billedValue: number;
    collectionGapFormatted: string;
    collectionGapValue: number;
    avgCheckFormatted: string;
    avgCheckValue: number;
    coversFormatted: string;
    coversCount: number;
    ordersFormatted: string;
    ordersCount: number;
    cancelledItemsFormatted: string;
    cancelledItemsCount: number;
}

export interface RevenueVsCollectionsPoint {
    period: string;
    grossSales: number;
    netRevenue: number;
    collections: number;
}

export interface PaymentChannelBreakdownItem {
    id: string;
    name: string;
    sharePercentage: number;
    amountFormatted: string;
    amountValue: number;
    color: string;
}

export interface PrepDurationBucket {
    bucket: string;
    tickets: number;
    label: string;
}

export interface WeeklyCashMovementPoint {
    day: string;
    digitalInflow: number;
    cashDrop: number;
}

export interface TopSellingDish {
    name: string;
    category: string;
    revenue: number;
    orders: number;
    percent: number;
    image?: string;
}

export interface HourlySalesPoint {
    hour: string;
    billed: number;
    collected: number;
}

export interface StationThroughputPoint {
    station: string;
    queued: number;
    inPrep: number;
    ready: number;
    served: number;
    cancelled: number;
}

export interface OrderVolumePoint {
    period: string;
    orders: number;
    covers: number;
    avgCheck: number;
}

export interface ManagerDashboardData {
    kpis: ManagerKpi;
    salesTrend: RevenueVsCollectionsPoint[];
    paymentChannels: PaymentChannelBreakdownItem[];
    prepBuckets: PrepDurationBucket[];
    weeklyCashMovement: WeeklyCashMovementPoint[];
    topDishes: TopSellingDish[];
    hourlySales: HourlySalesPoint[];
    stationThroughput: StationThroughputPoint[];
    orderVolumeTrend: OrderVolumePoint[];
    businessDate: string;
    branchName: string;
}

export interface ManagerDashboardResponse {
    data: ManagerDashboardData;
}

export type BranchRevenuePeriod = "month" | "quarter" | "year";

export interface BranchRevenuePoint {
    period: string;
    grossSales: number;
    netRevenue: number;
    collections: number;
}

export interface BranchRevenueData {
    branchName: string;
    period: BranchRevenuePeriod;
    periodLabel: string;
    fromDate: string;
    toDate: string;
    revenueFormatted: string;
    revenueValue: number;
    collectionsFormatted: string;
    collectionsValue: number;
    billedFormatted: string;
    billedValue: number;
    revenueTrend: string;
    revenueTrendLabel: string;
    coversCount: number;
    coversFormatted: string;
    ordersCount: number;
    ordersFormatted: string;
    avgCheckFormatted: string;
    series: BranchRevenuePoint[];
}

export interface BranchRevenueResponse {
    data: BranchRevenueData;
}

export const managerDashboardApi = api.injectEndpoints({
    endpoints: builder => ({
        getManagerDashboard: builder.query<
            ManagerDashboardResponse,
            { businessDate?: string } | void
        >({
            query: params => ({
                url: "/manager/dashboard",
                method: "GET",
                params: params || undefined,
            }),
            providesTags: [
                "Order",
                "Bill",
                "DailyClose",
                "Floor",
                "Station",
                "Cash",
            ],
        }),
        getBranchRevenue: builder.query<
            BranchRevenueResponse,
            { period?: BranchRevenuePeriod } | void
        >({
            query: params => ({
                url: "/manager/dashboard/branch-revenue",
                method: "GET",
                params: {
                    period: params?.period ?? "month",
                },
            }),
            providesTags: ["Order", "Bill", "Cash", "DailyClose"],
        }),
    }),
});

export const { useGetManagerDashboardQuery, useGetBranchRevenueQuery } =
    managerDashboardApi;
