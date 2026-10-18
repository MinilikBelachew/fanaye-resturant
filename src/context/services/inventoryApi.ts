import { api } from "./index";

export interface InventoryUnit {
    id: string;
    code: string;
    name: string;
    category: string;
    sortOrder: number;
}

export type InventoryItemKind = "RAW" | "PRODUCED" | "FINISHED";

export interface InventoryIngredient {
    id: string;
    name: string;
    unit: string;
    itemKind?: InventoryItemKind | string;
    /** Purchase / as-purchased unit cost (AP). */
    unitCost: number;
    /** AP→EP yield % (e.g. 80). */
    standardYieldPercent?: number | null;
    /** Derived edible unit cost = unitCost ÷ (yield%/100). */
    usableUnitCost?: number;
    stockValue?: number;
    parLevel: number;
    onHandQty: number;
    isLowStock: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryYieldTest {
    id: string;
    purchasedQuantity: number;
    usableQuantity: number;
    trimQuantity: number;
    yieldPercent: number;
    apUnitCost: number;
    epUnitCost: number;
    wroteOffTrim: boolean;
    note: string | null;
    locationId: string | null;
    createdAt: string;
    updatedAt: string;
    ingredient: {
        id: string;
        name: string;
        unit: string;
        unitCost: number;
        itemKind: string;
    };
    location: {
        id: string;
        name: string;
        type: string;
        code: string;
    } | null;
}

export interface InventoryLocation {
    id: string;
    code: string;
    name: string;
    type: "MAIN_WAREHOUSE" | "BRANCH_STORE" | "SHARED_STORE" | string;
    isDefault: boolean;
    status: string;
    branchId: string | null;
    branch: { id: string; name: string; displayCode: string } | null;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryNetworkStatus {
    hasMainWarehouse: boolean;
    mode: "SIMPLE" | "NETWORK" | string;
    mainLocation: InventoryLocation | null;
    activeLocationCount: number;
    scope?: "TENANT" | "BRANCH" | string;
    canManageLocations?: boolean;
    canEnableMain?: boolean;
    canDisableMain?: boolean;
    canOperateCentral?: boolean;
}

export interface InventoryTransferLine {
    id: string;
    ingredientId: string;
    quantitySent: number;
    quantityReceived: number | null;
    ingredient: {
        id: string;
        name: string;
        unit: string;
        itemKind: string;
    };
}

export interface InventoryTransfer {
    id: string;
    status: string;
    note: string | null;
    fromLocation: InventoryLocation;
    toLocation: InventoryLocation;
    sentAt: string | null;
    receivedAt: string | null;
    createdAt: string;
    lines: InventoryTransferLine[];
}

export interface InventorySupplyRequest {
    id: string;
    status: string;
    note: string | null;
    decisionNote: string | null;
    submittedAt: string | null;
    decidedAt: string | null;
    createdAt: string;
    fromLocation: InventoryLocation;
    toLocation: InventoryLocation;
    transfer: { id: string; status: string } | null;
    lines: Array<{
        id: string;
        ingredientId: string;
        quantityRequested: number;
        ingredient: {
            id: string;
            name: string;
            unit: string;
            itemKind: string;
        };
    }>;
}

export interface InventoryProductionBatch {
    id: string;
    note: string | null;
    outputQuantity: number;
    expectedOutputQuantity: number | null;
    yieldPercent: number | null;
    inputCostTotal: number;
    outputUnitCost: number;
    createdAt: string;
    location: InventoryLocation;
    output: {
        id: string;
        name: string;
        unit: string;
        itemKind: string;
    };
    inputs: Array<{
        id: string;
        ingredientId: string;
        quantity: number;
        ingredient: {
            id: string;
            name: string;
            unit: string;
            itemKind: string;
        };
    }>;
}

export interface InventoryBalanceRow {
    ingredientId: string;
    name: string;
    unit: string;
    unitCost: number;
    standardYieldPercent?: number | null;
    usableUnitCost?: number;
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
    orderItemId?: string | null;
    countSessionId?: string | null;
    transferId?: string | null;
    productionBatchId?: string | null;
    locationId?: string | null;
    createdAt: string;
    ingredient: { id: string; name: string; unit: string };
    location?: {
        id: string;
        name: string;
        type: string;
        code: string;
        branchName: string | null;
    } | null;
    createdByName?: string | null;
}

export interface InventoryMovementPoint {
    date: string;
    receive: number;
    waste: number;
    produceOut: number;
    produceUse: number;
    transferOut: number;
    transferIn: number;
    sales: number;
}

export interface InventoryMovementSeries {
    from: string;
    to: string;
    currencyCode: string;
    series: InventoryMovementPoint[];
    totals: Omit<InventoryMovementPoint, "date">;
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
    locationId?: string;
    direction?: "incoming" | "outgoing" | "all" | string;
}

export const inventoryApi = api.injectEndpoints({
    endpoints: builder => ({
        listInventoryUnits: builder.query<{ data: InventoryUnit[] }, void>({
            query: () => ({ url: "/inventory/units" }),
            providesTags: ["Inventory"],
        }),
        getInventoryNetworkStatus: builder.query<
            { data: InventoryNetworkStatus },
            void
        >({
            query: () => ({ url: "/inventory/network-status" }),
            providesTags: ["Inventory"],
        }),
        listInventoryLocations: builder.query<
            {
                data: InventoryLocation[];
                meta: { hasMainWarehouse: boolean; mode: string };
            },
            void
        >({
            query: () => ({ url: "/inventory/locations" }),
            providesTags: ["Inventory"],
        }),
        createMainWarehouse: builder.mutation<
            {
                data: InventoryLocation;
                meta: { hasMainWarehouse: boolean; mode: string };
            },
            { name?: string; code?: string } | void
        >({
            query: body => ({
                url: "/inventory/locations/main",
                method: "POST",
                body: body ?? {},
            }),
            invalidatesTags: ["Inventory"],
        }),
        disableMainWarehouse: builder.mutation<
            {
                data: InventoryLocation;
                meta: { hasMainWarehouse: boolean; mode: string };
            },
            void
        >({
            query: () => ({
                url: "/inventory/locations/main/disable",
                method: "POST",
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateInventoryLocation: builder.mutation<
            { data: InventoryLocation },
            { id: string; name?: string; code?: string }
        >({
            query: ({ id, ...body }) => ({
                url: `/inventory/locations/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        listInventoryTransfers: builder.query<
            { data: InventoryTransfer[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/transfers",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        createInventoryTransfer: builder.mutation<
            { data: InventoryTransfer },
            {
                toLocationId: string;
                fromLocationId?: string;
                note?: string;
                lines: Array<{ ingredientId: string; quantity: number }>;
            }
        >({
            query: body => ({
                url: "/inventory/transfers",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        acceptInventoryTransfer: builder.mutation<
            { data: InventoryTransfer },
            {
                id: string;
                body?: {
                    lines?: Array<{
                        ingredientId: string;
                        quantityReceived: number;
                    }>;
                    note?: string;
                };
            }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/transfers/${id}/accept`,
                method: "POST",
                body: body ?? {},
            }),
            invalidatesTags: ["Inventory"],
        }),
        rejectInventoryTransfer: builder.mutation<
            { data: InventoryTransfer },
            { id: string; note?: string }
        >({
            query: ({ id, note }) => ({
                url: `/inventory/transfers/${id}/reject`,
                method: "POST",
                body: note ? { note } : {},
            }),
            invalidatesTags: ["Inventory"],
        }),
        listSupplyRequests: builder.query<
            { data: InventorySupplyRequest[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/supply-requests",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        createSupplyRequest: builder.mutation<
            { data: InventorySupplyRequest },
            {
                fromLocationId?: string;
                note?: string;
                lines: Array<{ ingredientId: string; quantity: number }>;
            }
        >({
            query: body => ({
                url: "/inventory/supply-requests",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        approveSupplyRequest: builder.mutation<
            {
                data: InventorySupplyRequest;
                transfer?: InventoryTransfer;
            },
            { id: string; decisionNote?: string }
        >({
            query: ({ id, decisionNote }) => ({
                url: `/inventory/supply-requests/${id}/approve`,
                method: "POST",
                body: decisionNote ? { decisionNote } : {},
            }),
            invalidatesTags: ["Inventory"],
        }),
        rejectSupplyRequest: builder.mutation<
            { data: InventorySupplyRequest },
            { id: string; decisionNote?: string }
        >({
            query: ({ id, decisionNote }) => ({
                url: `/inventory/supply-requests/${id}/reject`,
                method: "POST",
                body: decisionNote ? { decisionNote } : {},
            }),
            invalidatesTags: ["Inventory"],
        }),
        listProductionBatches: builder.query<
            { data: InventoryProductionBatch[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/production-batches",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        postProductionBatch: builder.mutation<
            { data: InventoryProductionBatch },
            {
                outputIngredientId: string;
                outputQuantity: number;
                expectedOutputQuantity?: number;
                outputItemKind?: "PRODUCED" | "FINISHED";
                locationId?: string;
                note?: string;
                inputs: Array<{ ingredientId: string; quantity: number }>;
            }
        >({
            query: body => ({
                url: "/inventory/production-batches",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
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
                itemKind?: InventoryItemKind;
                unitCost?: number;
                parLevel?: number;
                initialQty?: number;
                locationId?: string;
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
                    itemKind?: InventoryItemKind;
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
        deleteInventoryIngredient: builder.mutation<
            { data: InventoryIngredient },
            string
        >({
            query: id => ({
                url: `/inventory/ingredients/${id}`,
                method: "DELETE",
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
                locationId?: string;
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
        listYieldTests: builder.query<
            { data: InventoryYieldTest[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/yield-tests",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        postYieldTest: builder.mutation<
            { data: InventoryYieldTest },
            {
                ingredientId: string;
                purchasedQuantity: number;
                usableQuantity: number;
                locationId?: string;
                writeOffTrim?: boolean;
                note?: string;
            }
        >({
            query: body => ({
                url: "/inventory/yield-tests",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateYieldTest: builder.mutation<
            { data: InventoryYieldTest },
            {
                id: string;
                body: {
                    purchasedQuantity?: number;
                    usableQuantity?: number;
                    note?: string | null;
                };
            }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/yield-tests/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        deleteYieldTest: builder.mutation<{ data: { id: string } }, string>({
            query: id => ({
                url: `/inventory/yield-tests/${id}`,
                method: "DELETE",
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
        getInventoryLedgerEntry: builder.query<
            { data: InventoryLedgerRow },
            string
        >({
            query: id => ({ url: `/inventory/ledger/${id}` }),
            providesTags: ["Inventory"],
        }),
        getInventoryMovementSeries: builder.query<
            { data: InventoryMovementSeries },
            { from?: string; to?: string; locationId?: string } | void
        >({
            query: params => ({
                url: "/inventory/movement-series",
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
    useGetInventoryNetworkStatusQuery,
    useListInventoryLocationsQuery,
    useCreateMainWarehouseMutation,
    useDisableMainWarehouseMutation,
    useUpdateInventoryLocationMutation,
    useListInventoryTransfersQuery,
    useCreateInventoryTransferMutation,
    useAcceptInventoryTransferMutation,
    useRejectInventoryTransferMutation,
    useListSupplyRequestsQuery,
    useCreateSupplyRequestMutation,
    useApproveSupplyRequestMutation,
    useRejectSupplyRequestMutation,
    useListProductionBatchesQuery,
    usePostProductionBatchMutation,
    useListInventoryIngredientsQuery,
    useCreateInventoryIngredientMutation,
    useUpdateInventoryIngredientMutation,
    useDeleteInventoryIngredientMutation,
    useListInventoryBalancesQuery,
    useReceiveInventoryStockMutation,
    useWasteInventoryStockMutation,
    useListYieldTestsQuery,
    usePostYieldTestMutation,
    useUpdateYieldTestMutation,
    useDeleteYieldTestMutation,
    useListInventoryLedgerQuery,
    useGetInventoryLedgerEntryQuery,
    useLazyGetInventoryLedgerEntryQuery,
    useGetInventoryMovementSeriesQuery,
    useListInventoryCountsQuery,
    useStartInventoryCountMutation,
    useGetInventoryCountQuery,
    useUpdateInventoryCountLinesMutation,
    usePostInventoryCountMutation,
} = inventoryApi;
