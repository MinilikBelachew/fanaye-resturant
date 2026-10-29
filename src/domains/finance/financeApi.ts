import { api } from "@/context/services";

export type FinanceAudience = "manager" | "owner";
export type FinancePeriod = "day" | "week" | "month";
export type FinanceDirection = "INCOME" | "EXPENSE";
export type FinanceSource =
    | "SALE"
    | "OTHER_INCOME"
    | "MANUAL_EXPENSE"
    | "PAYROLL"
    | "MATERIAL_COST";
export type FinanceSettledVia = "CASH" | "BANK" | "TELEBIRR" | "OTHER";
export type FinanceCategoryStatus = "ACTIVE" | "INACTIVE";
export type FinanceEntryDirection = "IN" | "OUT";

export type FinanceSummaryCategoryShare = {
    categoryId: string | null;
    code: string | null;
    name: string;
    amount: string;
    share: number;
};

export type FinanceSummarySeriesPoint = {
    date: string;
    revenue: string;
    materialCost: string;
    payroll: string;
    expenses: string;
    netProfit: string;
};

export type FinanceSummaryBranchRow = {
    branchId: string;
    branchName: string;
    revenue: string;
    materialCost: string;
    payroll: string;
    expensesTotal: string;
    netProfit: string;
};

export type FinanceInventoryPurchaseLine = {
    id: string | null;
    name: string;
    locationType?: string | null;
    amount: string;
    count: number;
};

export type FinanceInventoryStockLine = {
    locationId: string | null;
    locationName: string;
    locationType: string;
    value: string;
};

export type FinanceInventoryData = {
    purchases: {
        total: string;
        count: number;
        byVendor: FinanceInventoryPurchaseLine[];
        byLocation: FinanceInventoryPurchaseLine[];
    };
    transfersIn: string;
    transfersOut: string;
    transfersNet: string;
    consumption: string;
    waste: string;
    adjustments: string;
    stockOnHandValue: string;
    stockByLocation: FinanceInventoryStockLine[];
    netMovement: string;
    openingStockValue: string;
    closingStockValue: string;
    currencyCode: string;
};

export type FinanceIngredientMovementRow = {
    ingredientId: string;
    name: string;
    unit: string;
    itemKind: string;
    unitCost: string;
    openingQty: number;
    receivedQty: number;
    consumedQty: number;
    wasteQty: number;
    adjustedQty: number;
    transfersNetQty: number;
    otherQty: number;
    closingQty: number;
    consumedValue: string;
    closingValue: string;
};

export type FinanceIngredientMovements = {
    from: string;
    to: string;
    branchId: string | null;
    branchName: string | null;
    scope: "BRANCH" | "TENANT";
    currencyCode: string;
    data: FinanceIngredientMovementRow[];
};

export type FinanceIngredientMenuUsage = {
    menuItemId: string | null;
    menuItemName: string;
    qtyConsumed: number;
    plateCount: number;
    cost: string;
    share: number;
};

export type FinanceIngredientVendorLine = {
    vendorId: string | null;
    vendorName: string;
    qty: number;
    amount: string;
    count: number;
};

export type FinanceIngredientSeriesPoint = {
    date: string;
    receivedQty: number;
    consumedQty: number;
    wasteQty: number;
    closingQty: number;
};

export type FinanceIngredientUsage = {
    ingredientId: string;
    name: string;
    unit: string;
    itemKind: string;
    unitCost: string;
    from: string;
    to: string;
    openingQty: number;
    receivedQty: number;
    consumedQty: number;
    wasteQty: number;
    adjustedQty: number;
    transfersNetQty: number;
    otherQty: number;
    closingQty: number;
    openingValue: string;
    receivedValue: string;
    consumedValue: string;
    wasteValue: string;
    closingValue: string;
    byMenu: FinanceIngredientMenuUsage[];
    receivedByVendor: FinanceIngredientVendorLine[];
    series: FinanceIngredientSeriesPoint[];
};

export type FinanceSummaryData = {
    from: string;
    to: string;
    branchId: string | null;
    branchName: string | null;
    scope: "BRANCH" | "TENANT";
    currencyCode: string;
    revenue: {
        billed: string;
        cancelled: string;
        otherIncome: string;
        total: string;
        cash: string;
        transfer: string;
        billCount: number;
    };
    cost: {
        cogs: string;
        waste: string;
        materialCost: string;
        foodCostPct: number;
    };
    payroll: {
        amount: string;
        runsCount: number;
    };
    expenses: {
        manual: string;
        total: string;
        byCategory: FinanceSummaryCategoryShare[];
    };
    inventory: FinanceInventoryData;
    totals: {
        grossProfit: string;
        grossMarginPct: number;
        primeCost: string;
        expensesTotal: string;
        netProfit: string;
        netMarginPct: number;
    };
    series: FinanceSummarySeriesPoint[];
    branches?: FinanceSummaryBranchRow[];
};

export type FinanceEntryRow = {
    id: string;
    date: string;
    direction: FinanceEntryDirection;
    source: FinanceSource;
    categoryCode: string | null;
    categoryName: string | null;
    label: string;
    branchId: string;
    branchName: string;
    amount: string;
    signedAmount: string;
    currencyCode: string;
    recordedBy: string | null;
    counterparty: string | null;
    reference: string | null;
    status: string | null;
    receiptFileId: string | null;
    editable: boolean;
};

export type FinanceEntriesResponse = {
    data: FinanceEntryRow[];
    page: number;
    pageSize: number;
    total: number;
    totals: {
        income: string;
        expense: string;
        net: string;
    };
};

export type FinanceCategory = {
    id: string;
    direction: FinanceDirection;
    code: string;
    name: string;
    amharicName: string | null;
    isSystem: boolean;
    sortOrder: number;
    status: string;
};

export type FinanceEntryMutationResult = {
    data: {
        id: string;
        direction: FinanceDirection;
        branchId: string;
        businessDate: string;
        categoryId: string | null;
        label: string;
        amount: string;
        currencyCode: string;
        settledVia: FinanceSettledVia | null;
        counterparty: string | null;
        note: string | null;
        receiptFileId: string | null;
        status: string;
        version: number;
    };
};

export type FinanceEditableEntry = {
    id: string;
    direction: FinanceDirection;
    label: string;
    amount: string;
    businessDate: string;
    categoryId?: string | null;
    settledVia?: FinanceSettledVia | null;
    counterparty?: string | null;
    note?: string | null;
    version?: number;
};

export type CreateFinanceEntryBody = {
    direction: FinanceDirection;
    label: string;
    amount: number;
    businessDate?: string;
    categoryId?: string;
    newCategoryName?: string;
    settledVia?: FinanceSettledVia;
    counterparty?: string;
    note?: string;
    receiptFileId?: string;
    branchId?: string;
};

export type UpdateFinanceEntryBody = Partial<CreateFinanceEntryBody> & {
    version?: number;
};

export type VoidFinanceEntryBody = {
    reason?: string;
    version?: number;
};

export type CreateFinanceCategoryBody = {
    direction: FinanceDirection;
    name: string;
    amharicName?: string;
    code?: string;
    sortOrder?: number;
};

export type UpdateFinanceCategoryBody = {
    name?: string;
    amharicName?: string;
    sortOrder?: number;
    status?: FinanceCategoryStatus;
};

export type FinanceSummaryArgs = {
    audience: FinanceAudience;
    period?: FinancePeriod;
    date?: string;
    branchId?: string;
};

export type FinanceEntriesArgs = {
    audience: FinanceAudience;
    period?: FinancePeriod;
    date?: string;
    from?: string;
    to?: string;
    direction?: FinanceDirection;
    source?: FinanceSource;
    categoryId?: string;
    q?: string;
    page?: number;
    pageSize?: number;
    branchId?: string;
};

export type FinanceCategoriesArgs = {
    audience: FinanceAudience;
    direction: FinanceDirection;
};

export type FinanceInventoryItemsArgs = {
    audience: FinanceAudience;
    period?: FinancePeriod;
    from?: string;
    to?: string;
    date?: string;
    q?: string;
    branchId?: string;
};

export type FinanceInventoryItemUsageArgs = {
    audience: FinanceAudience;
    ingredientId: string;
    period?: FinancePeriod;
    from?: string;
    to?: string;
    date?: string;
    branchId?: string;
};

export const financeApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        getFinanceSummary: builder.query<
            { data: FinanceSummaryData },
            FinanceSummaryArgs
        >({
            query: ({ audience, period, date, branchId }) => ({
                url: `/${audience}/finance/summary`,
                method: "GET",
                params: {
                    ...(period ? { period } : {}),
                    ...(date ? { date } : {}),
                    ...(branchId ? { branchId } : {}),
                },
            }),
            providesTags: ["Finance"],
        }),
        getFinanceEntries: builder.query<
            FinanceEntriesResponse,
            FinanceEntriesArgs
        >({
            query: ({
                audience,
                period,
                date,
                from,
                to,
                direction,
                source,
                categoryId,
                q,
                page,
                pageSize,
                branchId,
            }) => ({
                url: `/${audience}/finance/entries`,
                method: "GET",
                params: {
                    ...(period ? { period } : {}),
                    ...(date ? { date } : {}),
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                    ...(direction ? { direction } : {}),
                    ...(source ? { source } : {}),
                    ...(categoryId ? { categoryId } : {}),
                    ...(q ? { q } : {}),
                    ...(page ? { page } : {}),
                    ...(pageSize ? { pageSize } : {}),
                    ...(branchId ? { branchId } : {}),
                },
            }),
            providesTags: ["Finance"],
        }),
        getFinanceCategories: builder.query<
            { data: FinanceCategory[] },
            FinanceCategoriesArgs
        >({
            query: ({ audience, direction }) => ({
                url: `/${audience}/finance/categories`,
                method: "GET",
                params: { direction },
            }),
            providesTags: ["Finance"],
        }),
        getFinanceInventoryItems: builder.query<
            FinanceIngredientMovements,
            FinanceInventoryItemsArgs
        >({
            query: ({ audience, period, from, to, date, q, branchId }) => ({
                url: `/${audience}/finance/inventory/items`,
                method: "GET",
                params: {
                    ...(period ? { period } : {}),
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                    ...(date ? { date } : {}),
                    ...(q ? { q } : {}),
                    ...(branchId ? { branchId } : {}),
                },
            }),
            providesTags: ["Finance"],
        }),
        getFinanceInventoryItemUsage: builder.query<
            { data: FinanceIngredientUsage },
            FinanceInventoryItemUsageArgs
        >({
            query: ({
                audience,
                ingredientId,
                period,
                from,
                to,
                date,
                branchId,
            }) => ({
                url: `/${audience}/finance/inventory/items/${ingredientId}`,
                method: "GET",
                params: {
                    ...(period ? { period } : {}),
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                    ...(date ? { date } : {}),
                    ...(branchId ? { branchId } : {}),
                },
            }),
            providesTags: ["Finance"],
        }),
        createFinanceEntry: builder.mutation<
            FinanceEntryMutationResult,
            { audience: FinanceAudience; body: CreateFinanceEntryBody }
        >({
            query: ({ audience, body }) => ({
                url: `/${audience}/finance/entries`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Finance"],
        }),
        updateFinanceEntry: builder.mutation<
            FinanceEntryMutationResult,
            {
                audience: FinanceAudience;
                id: string;
                body: UpdateFinanceEntryBody;
            }
        >({
            query: ({ audience, id, body }) => ({
                url: `/${audience}/finance/entries/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Finance"],
        }),
        voidFinanceEntry: builder.mutation<
            FinanceEntryMutationResult,
            {
                audience: FinanceAudience;
                id: string;
                body: VoidFinanceEntryBody;
            }
        >({
            query: ({ audience, id, body }) => ({
                url: `/${audience}/finance/entries/${id}/void`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Finance"],
        }),
        createFinanceCategory: builder.mutation<
            { data: FinanceCategory },
            { audience: FinanceAudience; body: CreateFinanceCategoryBody }
        >({
            query: ({ audience, body }) => ({
                url: `/${audience}/finance/categories`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Finance"],
        }),
        updateFinanceCategory: builder.mutation<
            { data: FinanceCategory },
            {
                audience: FinanceAudience;
                id: string;
                body: UpdateFinanceCategoryBody;
            }
        >({
            query: ({ audience, id, body }) => ({
                url: `/${audience}/finance/categories/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Finance"],
        }),
    }),
});

export const {
    useGetFinanceSummaryQuery,
    useGetFinanceEntriesQuery,
    useGetFinanceCategoriesQuery,
    useGetFinanceInventoryItemsQuery,
    useGetFinanceInventoryItemUsageQuery,
    useCreateFinanceEntryMutation,
    useUpdateFinanceEntryMutation,
    useVoidFinanceEntryMutation,
    useCreateFinanceCategoryMutation,
    useUpdateFinanceCategoryMutation,
} = financeApi;
