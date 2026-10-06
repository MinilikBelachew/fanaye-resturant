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
    collectionsTrend?: string;
    collectionsTrendLabel?: string;
    stationBacklogFormatted: string;
    stationBacklogCount: number;
    stationBacklogHint: string;
    pendingActionsFormatted: string;
    pendingBillRequests: number;
    pendingCashDrops: number;
    pendingCancellations?: number;
    pendingOrderChanges?: number;
    openProductionExceptions?: number;
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

export interface StationPrepPoint {
    station: string;
    avgMinutes: number;
    tickets: number;
}

export interface WeeklyCashMovementPoint {
    day: string;
    digitalInflow: number;
    cashDrop: number;
}

export interface PaymentMixPoint {
    period: string;
    cash: number;
    digital: number;
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

export interface WaiterPerformancePoint {
    name: string;
    covers: number;
    tables: number;
    revenue: number;
    revenueFormatted: string;
    avgCheck: number;
}

export interface ActNowInsight {
    readyTooLongCount: number;
    readyTooLongHint: string;
    latePrepCount: number;
    latePrepHint: string;
    staffOfflineCount: number;
    staffOfflineHint: string;
    lowStockCount: number;
    lowStockHint: string;
    unpaidBillsCount: number;
    unpaidGapValue: number;
    unpaidGapFormatted: string;
    unpaidGapHint: string;
}

export type ManagerDashboardPeriod =
    | "today"
    | "week"
    | "month"
    | "quarter"
    | "year"
    | "custom";

export interface ManagerDashboardData {
    kpis: ManagerKpi;
    actNow?: ActNowInsight;
    salesTrend: RevenueVsCollectionsPoint[];
    paymentChannels: PaymentChannelBreakdownItem[];
    prepBuckets: PrepDurationBucket[];
    stationPrepAvg?: StationPrepPoint[];
    weeklyCashMovement: WeeklyCashMovementPoint[];
    topDishes: TopSellingDish[];
    hourlySales: HourlySalesPoint[];
    stationThroughput: StationThroughputPoint[];
    orderVolumeTrend: OrderVolumePoint[];
    paymentMixTrend?: PaymentMixPoint[];
    waiterPerformance?: WaiterPerformancePoint[];
    businessDate: string;
    fromDate?: string;
    toDate?: string;
    period?: ManagerDashboardPeriod;
    periodLabel?: string;
    timezone?: string;
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
    overrideExisting: true,
    endpoints: builder => ({
        getManagerDashboard: builder.query<
            ManagerDashboardResponse,
            {
                businessDate?: string;
                period?: ManagerDashboardPeriod;
                fromDate?: string;
                toDate?: string;
                /** Owner: `all` totals every active branch */
                scope?: "branch" | "all";
            } | void
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
