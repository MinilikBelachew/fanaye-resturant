import { api } from "./index";

export interface InventoryUnit {
    id: string;
    code: string;
    name: string;
    category: string;
    sortOrder: number;
}

export interface InventoryIngredient {
    id: string;
    name: string;
    unit: string;
    unitCost: number;
    stockValue?: number;
    parLevel: number;
    onHandQty: number;
    isLowStock: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryBalanceRow {
    ingredientId: string;
    name: string;
    unit: string;
    unitCost: number;
    stockValue: number;
    parLevel: number;
    onHandQty: number;
    isLowStock: boolean;
    status: string;
    updatedAt: string;
}

export interface InventoryMoneySummary {
    currencyCode: string;
    skuCount: number;
    lowStockCount: number;
    totalStockValue: number;
    lowStockValue: number;
}

export interface InventoryLedgerRow {
    id: string;
    entryType: string;
    quantityDelta: number;
    unitCostSnapshot: number | null;
    unitCost?: number;
    lineValue?: number;
    note: string | null;
    supplierNote: string | null;
    invoiceRef: string | null;
    createdAt: string;
    ingredient: { id: string; name: string; unit: string };
}

export interface InventoryCountSummary {
    id: string;
    status: string;
    notes: string | null;
    lineCount: number;
    createdAt: string;
    postedAt: string | null;
}

export interface InventoryCountDetail {
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
    postedAt: string | null;
    lines: Array<{
        id: string;
        ingredientId: string;
        name: string;
        unit: string;
        bookQty: number;
        countedQty: number | null;
        varianceQty: number | null;
    }>;
}

export interface InventoryPageMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface InventoryListParams {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    lowStock?: string;
    type?: string;
    from?: string;
    to?: string;
}

export const inventoryApi = api.injectEndpoints({
    endpoints: builder => ({
        listInventoryUnits: builder.query<{ data: InventoryUnit[] }, void>({
            query: () => ({ url: "/inventory/units" }),
            providesTags: ["Inventory"],
        }),
        listInventoryIngredients: builder.query<
            { data: InventoryIngredient[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/ingredients",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        createInventoryIngredient: builder.mutation<
            { data: InventoryIngredient },
            {
                name: string;
                unit: string;
                unitCost?: number;
                parLevel?: number;
                initialQty?: number;
            }
        >({
            query: body => ({
                url: "/inventory/ingredients",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateInventoryIngredient: builder.mutation<
            { data: InventoryIngredient },
            {
                id: string;
                body: {
                    name?: string;
                    unit?: string;
                    unitCost?: number;
                    parLevel?: number;
                    status?: string;
                };
            }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/ingredients/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        listInventoryBalances: builder.query<
            {
                data: InventoryBalanceRow[];
                meta: InventoryPageMeta;
                summary?: InventoryMoneySummary;
            },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/balances",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        receiveInventoryStock: builder.mutation<
            { data: InventoryIngredient },
            {
                ingredientId: string;
                quantity: number;
                unitCost?: number;
                supplierNote?: string;
                invoiceRef?: string;
                note?: string;
            }
        >({
            query: body => ({
                url: "/inventory/receive",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        wasteInventoryStock: builder.mutation<
            { data: InventoryIngredient },
            { ingredientId: string; quantity: number; note?: string }
        >({
            query: body => ({
                url: "/inventory/waste",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        listInventoryLedger: builder.query<
            { data: InventoryLedgerRow[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/ledger",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        listInventoryCounts: builder.query<
            { data: InventoryCountSummary[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/counts",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        startInventoryCount: builder.mutation<
            { data: InventoryCountDetail },
            { notes?: string } | void
        >({
            query: body => ({
                url: "/inventory/counts",
                method: "POST",
                body: body ?? {},
            }),
            invalidatesTags: ["Inventory"],
        }),
        getInventoryCount: builder.query<
            { data: InventoryCountDetail },
            string
        >({
            query: id => `/inventory/counts/${id}`,
            providesTags: ["Inventory"],
        }),
        updateInventoryCountLines: builder.mutation<
            { data: InventoryCountDetail },
            {
                id: string;
                lines: Array<{ ingredientId: string; countedQty: number }>;
            }
        >({
            query: ({ id, lines }) => ({
                url: `/inventory/counts/${id}/lines`,
                method: "PATCH",
                body: { lines },
            }),
            invalidatesTags: ["Inventory"],
        }),
        postInventoryCount: builder.mutation<
            { data: InventoryCountDetail },
            string
        >({
            query: id => ({
                url: `/inventory/counts/${id}/post`,
                method: "POST",
            }),
            invalidatesTags: ["Inventory"],
        }),
    }),
});

export const {
    useListInventoryUnitsQuery,
    useListInventoryIngredientsQuery,
    useCreateInventoryIngredientMutation,
    useUpdateInventoryIngredientMutation,
    useListInventoryBalancesQuery,
    useReceiveInventoryStockMutation,
    useWasteInventoryStockMutation,
    useListInventoryLedgerQuery,
    useListInventoryCountsQuery,
    useStartInventoryCountMutation,
    useGetInventoryCountQuery,
    useUpdateInventoryCountLinesMutation,
    usePostInventoryCountMutation,
} = inventoryApi;
