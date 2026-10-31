import { api } from "./index";

export type ReportsPeriod = "day" | "week" | "month";
export type ReportsSection =
    | "all"
    | "waiters"
    | "cancels"
    | "inventory"
    | "cash"
    | "stations"
    | "fb";

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

export type FbReportCategoryRow = {
    categoryName: string;
    quantitySold: number;
    revenue: string;
    cost: string;
    grossMargin: string;
    marginPct: number;
    costPct: number;
};

export type FbReportStationRow = {
    stationName: string;
    workflowMode: string;
    itemsPrepared: number;
    revenue: string;
    cost: string;
    costPct: number;
};

export type FbReportTopItem = {
    name: string;
    station: string;
    quantitySold: number;
    revenue: string;
    cost: string;
    profit: string;
    marginPct: number;
};

export type FbReportCostDriver = {
    name: string;
    unit: string;
    quantityConsumed: number;
    totalCost: string;
    unitCost: string;
    costSharePct: number;
};

export type FbReportWasteItem = {
    name: string;
    unit: string;
    quantityWasted: number;
    wasteCost: string;
    reason: string;
};

export type FbReportItemIngredient = {
    name: string;
    unit: string;
    quantityPerServing: number;
    unitCost: string;
    costPerServing: string;
    totalQuantityUsed: number;
    totalCostUsed: string;
};

export type FbReportSoldItem = {
    id: string;
    name: string;
    categoryName: string;
    station: string;
    quantitySold: number;
    unitPrice: string;
    revenue: string;
    cost: string;
    profit: string;
    marginPct: number;
    orderCount: number;
    ingredients?: FbReportItemIngredient[];
};

export type FbReportDailyVolume = {
    date: string;
    displayDate: string;
    totalItems: number;
    foodCount: number;
    beverageCount: number;
    totalRevenue: string;
};

export type FbReportItemOrderInstance = {
    id: string;
    orderId: string;
    menuItemId?: string;
    itemName: string;
    categoryName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    tableLabel: string;
    waiterName: string;
    confirmedAt: string;
    state: string;
    specialInstruction?: string;
    modifiers: string[];
    billNumber?: string;
    paymentStatus?: string;
    billTotal?: string;
    amountPaid?: string;
    paymentMethods?: string[];
};

export type FbReportData = {
    period: ReportsPeriod;
    from: string;
    to: string;
    currencyCode: string;
    branchName: string;
    totalRevenue: string;
    totalCost: string;
    grossProfit: string;
    overallCostPct: number;
    overallMarginPct: number;
    food: {
        revenue: string;
        cost: string;
        margin: string;
        costPct: number;
        marginPct: number;
        sharePct: number;
    };
    beverage: {
        revenue: string;
        cost: string;
        margin: string;
        costPct: number;
        marginPct: number;
        sharePct: number;
    };
    totalWasteCost: string;
    topWasteItems: FbReportWasteItem[];
    topCostDrivers: FbReportCostDriver[];
    categories: FbReportCategoryRow[];
    stations: FbReportStationRow[];
    topSellingItems: FbReportTopItem[];
    topProfitableItems: FbReportTopItem[];
    dailyVolumes?: FbReportDailyVolume[];
    soldItems?: FbReportSoldItem[];
    orderInstances?: FbReportItemOrderInstance[];
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
            {
                period?: ReportsPeriod;
                section?: ReportsSection;
                from?: string;
                to?: string;
            }
        >({
            query: ({ period = "day", section = "all", from, to } = {}) => ({
                url: "/manager/reports",
                method: "GET",
                params: {
                    period,
                    section,
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                },
            }),
            providesTags: ["Approvals", "Floor", "Station", "Inventory"],
        }),
        fbReport: builder.query<
            { data: FbReportData },
            { period?: ReportsPeriod; from?: string; to?: string }
        >({
            query: ({ period = "day", from, to } = {}) => ({
                url: "/manager/reports/fb",
                method: "GET",
                params: {
                    period,
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                },
            }),
            providesTags: ["Floor", "Station", "Inventory"],
        }),
    }),
});

export const useManagerReportsQuery =
    managerReportsApi.endpoints.managerReports.useQuery;

export const useFbReportQuery =
    managerReportsApi.endpoints.fbReport.useQuery;
