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

export interface ManagerDashboardData {
    kpis: ManagerKpi;
    salesTrend: RevenueVsCollectionsPoint[];
    paymentChannels: PaymentChannelBreakdownItem[];
    prepBuckets: PrepDurationBucket[];
    weeklyCashMovement: WeeklyCashMovementPoint[];
    topDishes: TopSellingDish[];
    businessDate: string;
    branchName: string;
}

export interface ManagerDashboardResponse {
    data: ManagerDashboardData;
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
            providesTags: ["Order", "Bill", "DailyClose", "Floor", "Station", "Cash"],
        }),
    }),
});

export const { useGetManagerDashboardQuery } = managerDashboardApi;
