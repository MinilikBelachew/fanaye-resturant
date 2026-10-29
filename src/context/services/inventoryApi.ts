import { api } from "./index";

export interface InventoryUnit {
    id: string;
    code: string;
    name: string;
    category: string;
    sortOrder: number;
    isBuiltIn: boolean;
    tenantId: string | null;
}

export interface InventoryUnitConversion {
    id: string;
    fromUnit: string;
    toUnit: string;
    factor: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomUnitPayload {
    code: string;
    name: string;
    category: "weight" | "volume" | "count" | "pack";
    sortOrder?: number;
}

export interface UpdateCustomUnitPayload {
    name?: string;
    category?: "weight" | "volume" | "count" | "pack";
    sortOrder?: number;
    status?: string;
}

export interface CreateUnitConversionPayload {
    fromUnit: string;
    toUnit: string;
    factor: number;
}

export interface UpdateUnitConversionPayload {
    fromUnit?: string;
    toUnit?: string;
    factor?: number;
    status?: string;
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
    imageUrl?: string | null;
    categoryId?: string | null;
    category?: {
        id: string;
        name: string;
        amharicName?: string | null;
        code: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryCategoryItem {
    id: string;
    tenantId: string;
    branchId: string | null;
    name: string;
    amharicName?: string | null;
    code: string;
    description?: string | null;
    sortOrder: number;
    status: string;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInventoryCategoryPayload {
    name: string;
    amharicName?: string;
    code?: string;
    description?: string;
    sortOrder?: number;
    branchId?: string;
}

export interface UpdateInventoryCategoryPayload {
    name?: string;
    amharicName?: string;
    code?: string;
    description?: string;
    sortOrder?: number;
    status?: string;
    branchId?: string;
}

export interface InventoryYieldTest {
    id: string;
    unit?: string | null;
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
    unitSent?: string | null;
    unitReceived?: string | null;
    ingredient: {
        id: string;
        name: string;
        unit: string;
        itemKind: string;
    };
}

export interface InventoryDriver {
    id: string;
    tenantId: string;
    displayName: string;
    phone: string | null;
    licencePlate: string | null;
    vehicleDesc: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export type VendorType = "FARM" | "NEGADE" | "OTHER";

export interface InventoryVendor {
    id: string;
    type: string;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVendorPayload {
    type: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
}

export interface UpdateVendorPayload {
    type?: string;
    name?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    status?: string;
}

export interface CreateDriverPayload {
    displayName: string;
    phone?: string;
    licencePlate?: string;
    vehicleDesc?: string;
}

export interface UpdateDriverPayload {
    displayName?: string;
    phone?: string;
    licencePlate?: string;
    vehicleDesc?: string;
    status?: string;
}

export interface DispatchTransferPayload {
    driverId: string;
    note?: string;
}

export interface InventoryPushDrop {
    id: string;
    status: string;
    label: string | null;
    note: string | null;
    scheduledDate: string | null;
    fromLocation: InventoryLocation;
    transfers: InventoryTransfer[];
    createdAt: string;
    updatedAt?: string;
}

export interface CreatePushDropPayload {
    fromLocationId?: string;
    driverId?: string;
    label?: string;
    note?: string;
    scheduledDate?: string;
    branches: Array<{
        toLocationId: string;
        lines: Array<{ ingredientId: string; quantity: number; unit?: string }>;
    }>;
}

export interface CreateSupplyRequestV2Payload {
    fromLocationId?: string;
    note?: string;
    autoApprove?: boolean;
    lines: Array<{ ingredientId: string; quantity: number; unit?: string }>;
}

export interface InventoryTransfer {
    id: string;
    status: string;
    note: string | null;
    fromLocation: InventoryLocation;
    toLocation: InventoryLocation;
    sentAt: string | null;
    receivedAt: string | null;
    dispatchedAt?: string | null;
    driverId?: string | null;
    driver?: InventoryDriver | null;
    pushDropId?: string | null;
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
        unit?: string | null;
        ingredient: {
            id: string;
            name: string;
            unit: string;
            itemKind: string;
        };
    }>;
}

export interface DriverProfile {
    id: string;
    name: string;
    phone?: string | null;
    licencePlate?: string | null;
    vehicleDesc?: string | null;
    status: string;
}

export interface DriverTransfersResponse {
    driver: DriverProfile | null;
    pendingPickup: InventoryTransfer[];
    inTransit: InventoryTransfer[];
    completed: InventoryTransfer[];
}

export interface InventoryProductionBatch {
    id: string;
    note: string | null;
    outputQuantity: number;
    outputUnit?: string | null;
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
        unit?: string | null;
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
    imageUrl?: string | null;
    categoryId?: string | null;
    category?: {
        id: string;
        name: string;
        amharicName?: string | null;
        code: string;
    } | null;
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
    vendor?: {
        id: string;
        name: string;
        type: string;
        phone: string | null;
    } | null;
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
        countedUnit?: string;
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
    categoryId?: string;
    direction?: "incoming" | "outgoing" | "all" | string;
}

export type BranchAnalyticsRange = "today" | "week" | "month";

export interface BranchAnalyticsItem {
    ingredientId: string;
    name: string;
    unit: string;
    onHandQty: number;
    incomingQty: number;
    usedQty: number;
    usedValue: number;
    wasteQty: number;
    wasteValue: number;
    change24h: number;
    dailyUsed: number[];
    dailyReceived: number[];
    usedBy: { label: string; qty: number }[];
}

export interface BranchAnalyticsMenuItem {
    name: string;
    value: number;
    ingredients: {
        ingredientId: string;
        name: string;
        unit: string;
        totalQty: number;
        value: number;
        daily: number[];
    }[];
}

export interface BranchAnalytics {
    range: BranchAnalyticsRange;
    from: string;
    to: string;
    summary: {
        usedQty: number;
        usedValue: number;
        wasteQty: number;
        wasteValue: number;
        incomingCount: number;
        stockValue: number;
        lowStockCount: number;
    };
    trend: { date: string; used: number; waste: number; received: number }[];
    incomingTransfers: {
        id: string;
        status: string;
        fromName: string | null;
        toName: string | null;
        sentAt: string | null;
    }[];
    items: BranchAnalyticsItem[];
    menuItems: BranchAnalyticsMenuItem[];
}

export interface CentralAnalyticsItem {
    ingredientId: string;
    name: string;
    unit: string;
    onHandQty: number;
    receivedQty: number;
    receivedValue: number;
    sentQty: number;
    sentValue: number;
    wasteQty: number;
    wasteValue: number;
    change24h: number;
    dailyReceived: number[];
    dailySent: number[];
}

export interface CentralAnalytics {
    range: BranchAnalyticsRange;
    from: string;
    to: string;
    summary: {
        receivedQty: number;
        receivedValue: number;
        sentQty: number;
        sentValue: number;
        wasteQty: number;
        wasteValue: number;
        pendingRequests: number;
        inTransit: number;
        stockValue: number;
        lowStockCount: number;
    };
    trend: { date: string; received: number; sent: number }[];
    items: CentralAnalyticsItem[];
    sentPerBranch: {
        branchName: string;
        qty: number;
        value: number;
        daily: number[];
    }[];
    receivedPerVendor: {
        vendorName: string;
        qty: number;
        value: number;
        daily: number[];
    }[];
    pendingRequests: {
        id: string;
        status: string;
        fromName: string | null;
        note: string | null;
        requestedAt: string;
        lines: {
            ingredientId: string;
            name: string;
            unit: string;
            quantityRequested: number;
        }[];
    }[];
}

export interface InventoryMaterial {
    id: string;
    name: string;
    amharicName?: string | null;
    code: string;
    category:
        | "CUTLERY"
        | "CROCKERY"
        | "GLASSWARE"
        | "TRAYS"
        | "WARMERS_CARRIERS"
        | "CONTAINERS"
        | "OTHER"
        | string;
    unit: string;
    isReusable: boolean;
    imageUrl?: string | null;
    description?: string | null;
    sortOrder: number;
    status: string;
    onHandQty: number;
    issuedQty: number;
    lostQty: number;
    createdAt: string;
    updatedAt: string;
}

export interface ListMaterialsQuery {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    isReusable?: string;
    q?: string;
}

export interface CreateMaterialPayload {
    name: string;
    amharicName?: string;
    code?: string;
    category?: string;
    unit?: string;
    isReusable?: boolean;
    imageUrl?: string;
    description?: string;
    sortOrder?: number;
}

export interface UpdateMaterialPayload {
    name?: string;
    amharicName?: string;
    code?: string;
    category?: string;
    unit?: string;
    isReusable?: boolean;
    imageUrl?: string;
    description?: string;
    sortOrder?: number;
    status?: string;
}

export interface UpsertMaterialBalancePayload {
    materialId: string;
    branchId?: string;
    locationId?: string;
    onHandDelta?: number;
    issuedDelta?: number;
    lostDelta?: number;
    setOnHand?: number;
    setIssued?: number;
    setLost?: number;
}

export const inventoryApi = api.injectEndpoints({
    endpoints: builder => ({
        getBranchAnalytics: builder.query<
            { data: BranchAnalytics },
            { range?: BranchAnalyticsRange } | void
        >({
            query: (params: { range?: BranchAnalyticsRange } | void) => ({
                url: "/inventory/analytics/branch",
                params: params ?? {},
            }),
            providesTags: ["Inventory"],
        }),
        getCentralAnalytics: builder.query<
            { data: CentralAnalytics },
            { range?: BranchAnalyticsRange } | void
        >({
            query: (params: { range?: BranchAnalyticsRange } | void) => ({
                url: "/inventory/analytics/central",
                params: params ?? {},
            }),
            providesTags: ["Inventory"],
        }),
        listInventoryUnits: builder.query<{ data: InventoryUnit[] }, void>({
            query: () => ({ url: "/inventory/units" }),
            providesTags: ["Inventory"],
        }),
        listCompatibleInventoryUnits: builder.query<
            { data: InventoryUnit[] },
            { baseUnit: string }
        >({
            query: params => ({
                url: "/inventory/units/compatible",
                params,
            }),
            providesTags: ["Inventory"],
        }),
        createInventoryCustomUnit: builder.mutation<
            { data: InventoryUnit },
            CreateCustomUnitPayload
        >({
            query: body => ({
                url: "/inventory/units",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateInventoryCustomUnit: builder.mutation<
            { data: InventoryUnit },
            { id: string; body: UpdateCustomUnitPayload }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/units/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        deleteInventoryCustomUnit: builder.mutation<
            { data: { id: string } },
            string
        >({
            query: id => ({
                url: `/inventory/units/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Inventory"],
        }),
        listInventoryUnitConversions: builder.query<
            { data: InventoryUnitConversion[] },
            void
        >({
            query: () => ({ url: "/inventory/unit-conversions" }),
            providesTags: ["Inventory"],
        }),
        createInventoryUnitConversion: builder.mutation<
            { data: InventoryUnitConversion },
            CreateUnitConversionPayload
        >({
            query: body => ({
                url: "/inventory/unit-conversions",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateInventoryUnitConversion: builder.mutation<
            { data: InventoryUnitConversion },
            { id: string; body: UpdateUnitConversionPayload }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/unit-conversions/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        deleteInventoryUnitConversion: builder.mutation<
            { data: { id: string } },
            string
        >({
            query: id => ({
                url: `/inventory/unit-conversions/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Inventory"],
        }),
        listInventoryCategories: builder.query<
            { data: InventoryCategoryItem[] },
            void
        >({
            query: () => ({ url: "/inventory/categories" }),
            providesTags: ["Inventory"],
        }),
        createInventoryCategory: builder.mutation<
            { data: InventoryCategoryItem },
            CreateInventoryCategoryPayload
        >({
            query: body => ({
                url: "/inventory/categories",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateInventoryCategory: builder.mutation<
            { data: InventoryCategoryItem },
            { id: string; body: UpdateInventoryCategoryPayload }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/categories/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        deleteInventoryCategory: builder.mutation<{ success: boolean }, string>(
            {
                query: id => ({
                    url: `/inventory/categories/${id}`,
                    method: "DELETE",
                }),
                invalidatesTags: ["Inventory"],
            },
        ),
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
                lines: Array<{
                    ingredientId: string;
                    quantity: number;
                    unit?: string;
                }>;
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
                        unit?: string;
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
                lines: Array<{
                    ingredientId: string;
                    quantity: number;
                    unit?: string;
                }>;
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
            {
                id: string;
                decisionNote?: string;
                driverId?: string;
                immediateTransit?: boolean;
            }
        >({
            query: ({ id, decisionNote, driverId, immediateTransit }) => ({
                url: `/inventory/supply-requests/${id}/approve`,
                method: "POST",
                body: {
                    ...(decisionNote ? { decisionNote } : {}),
                    ...(driverId ? { driverId } : {}),
                    ...(immediateTransit !== undefined
                        ? { immediateTransit }
                        : {}),
                },
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
        startPreparingSupplyRequest: builder.mutation<
            { data: InventorySupplyRequest },
            { id: string }
        >({
            query: ({ id }) => ({
                url: `/inventory/supply-requests/${id}/prepare`,
                method: "POST",
            }),
            invalidatesTags: ["Inventory"],
        }),
        dispatchSupplyRequest: builder.mutation<
            {
                data: InventorySupplyRequest;
                transfer: InventoryTransfer;
            },
            {
                id: string;
                driverId?: string;
                immediateTransit?: boolean;
                decisionNote?: string;
            }
        >({
            query: ({ id, decisionNote, driverId, immediateTransit }) => ({
                url: `/inventory/supply-requests/${id}/dispatch`,
                method: "POST",
                body: {
                    ...(decisionNote ? { decisionNote } : {}),
                    ...(driverId ? { driverId } : {}),
                    ...(immediateTransit !== undefined
                        ? { immediateTransit }
                        : {}),
                },
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
                outputUnit?: string;
                expectedOutputQuantity?: number;
                outputItemKind?: "PRODUCED" | "FINISHED";
                locationId?: string;
                note?: string;
                inputs: Array<{
                    ingredientId: string;
                    quantity: number;
                    unit?: string;
                }>;
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
                imageUrl?: string;
                categoryId?: string;
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
                    imageUrl?: string | null;
                    categoryId?: string | null;
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
                vendorId?: string;
                quantity: number;
                unit?: string;
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
        receiveInventoryStockBatch: builder.mutation<
            {
                data: {
                    receivedCount: number;
                    vendorId: string | null;
                    vendorName: string | null;
                    invoiceRef: string | null;
                };
            },
            {
                vendorId?: string;
                locationId?: string;
                invoiceRef?: string;
                note?: string;
                receiptUrl?: string;
                items: Array<{
                    ingredientId: string;
                    quantity: number;
                    unit?: string;
                    unitCost?: number;
                }>;
            }
        >({
            query: body => ({
                url: "/inventory/receive-batch",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        wasteInventoryStock: builder.mutation<
            { data: InventoryIngredient },
            {
                ingredientId: string;
                quantity: number;
                unit?: string;
                note?: string;
            }
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
                unit?: string;
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
                    unit?: string;
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
                lines: Array<{
                    ingredientId: string;
                    countedQty: number;
                    unit?: string;
                }>;
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
        listDrivers: builder.query<
            { data: InventoryDriver[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/drivers",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        createDriver: builder.mutation<
            { data: InventoryDriver },
            CreateDriverPayload
        >({
            query: body => ({
                url: "/inventory/drivers",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateDriver: builder.mutation<
            { data: InventoryDriver },
            { id: string; body: UpdateDriverPayload }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/drivers/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        deleteDriver: builder.mutation<{ success: boolean }, string>({
            query: id => ({
                url: `/inventory/drivers/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Inventory"],
        }),
        listVendors: builder.query<
            { data: InventoryVendor[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/vendors",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        createVendor: builder.mutation<
            { data: InventoryVendor },
            CreateVendorPayload
        >({
            query: body => ({
                url: "/inventory/vendors",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateVendor: builder.mutation<
            { data: InventoryVendor },
            { id: string; body: UpdateVendorPayload }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/vendors/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        deleteVendor: builder.mutation<{ data: { id: string } }, string>({
            query: id => ({
                url: `/inventory/vendors/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Inventory"],
        }),
        dispatchTransfer: builder.mutation<
            { data: InventoryTransfer },
            { id: string; body: DispatchTransferPayload }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/transfers/${id}/dispatch`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        listPushDrops: builder.query<
            { data: InventoryPushDrop[]; meta: InventoryPageMeta },
            InventoryListParams | void
        >({
            query: params => ({
                url: "/inventory/push-drops",
                params: params ?? undefined,
            }),
            providesTags: ["Inventory"],
        }),
        createPushDrop: builder.mutation<
            { data: InventoryPushDrop },
            CreatePushDropPayload
        >({
            query: body => ({
                url: "/inventory/push-drops",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        createSupplyRequestV2: builder.mutation<
            { data: InventorySupplyRequest },
            CreateSupplyRequestV2Payload
        >({
            query: body => ({
                url: "/inventory/supply-requests/v2",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        getMyDriverTransfers: builder.query<
            { data: DriverTransfersResponse },
            void
        >({
            query: () => "/inventory/driver/my-transfers",
            providesTags: ["Inventory"],
        }),
        startDriverTrip: builder.mutation<
            { data: InventoryTransfer },
            { id: string; notes?: string }
        >({
            query: ({ id, notes }) => ({
                url: `/inventory/transfers/${id}/start-trip`,
                method: "POST",
                body: { notes },
            }),
            invalidatesTags: ["Inventory"],
        }),
        markDriverArrived: builder.mutation<
            { data: InventoryTransfer },
            { id: string; notes?: string }
        >({
            query: ({ id, notes }) => ({
                url: `/inventory/transfers/${id}/arrived`,
                method: "POST",
                body: { notes },
            }),
            invalidatesTags: ["Inventory"],
        }),
        listInventoryMaterials: builder.query<
            {
                data: InventoryMaterial[];
                meta: {
                    total: number;
                    page: number;
                    limit: number;
                    hasMore: boolean;
                };
            },
            ListMaterialsQuery | void
        >({
            query: params => ({
                url: "/inventory/materials",
                params: params ?? {},
            }),
            providesTags: ["Inventory"],
        }),
        createInventoryMaterial: builder.mutation<
            { data: InventoryMaterial },
            CreateMaterialPayload
        >({
            query: body => ({
                url: "/inventory/materials",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        updateInventoryMaterial: builder.mutation<
            { data: InventoryMaterial },
            { id: string; body: UpdateMaterialPayload }
        >({
            query: ({ id, body }) => ({
                url: `/inventory/materials/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
        deleteInventoryMaterial: builder.mutation<
            { data: { success: boolean } },
            string
        >({
            query: id => ({
                url: `/inventory/materials/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Inventory"],
        }),
        upsertMaterialBalance: builder.mutation<
            { data: any },
            UpsertMaterialBalancePayload
        >({
            query: body => ({
                url: "/inventory/materials/balances",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Inventory"],
        }),
    }),
});

export const {
    useGetBranchAnalyticsQuery,
    useGetCentralAnalyticsQuery,
    useListInventoryUnitsQuery,
    useListCompatibleInventoryUnitsQuery,
    useCreateInventoryCustomUnitMutation,
    useUpdateInventoryCustomUnitMutation,
    useDeleteInventoryCustomUnitMutation,
    useListInventoryUnitConversionsQuery,
    useCreateInventoryUnitConversionMutation,
    useUpdateInventoryUnitConversionMutation,
    useDeleteInventoryUnitConversionMutation,
    useListInventoryCategoriesQuery,
    useCreateInventoryCategoryMutation,
    useUpdateInventoryCategoryMutation,
    useDeleteInventoryCategoryMutation,
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
    useStartPreparingSupplyRequestMutation,
    useDispatchSupplyRequestMutation,
    useListProductionBatchesQuery,
    usePostProductionBatchMutation,
    useListInventoryIngredientsQuery,
    useCreateInventoryIngredientMutation,
    useUpdateInventoryIngredientMutation,
    useDeleteInventoryIngredientMutation,
    useListInventoryBalancesQuery,
    useReceiveInventoryStockMutation,
    useReceiveInventoryStockBatchMutation,
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
    useListDriversQuery,
    useCreateDriverMutation,
    useUpdateDriverMutation,
    useDeleteDriverMutation,
    useListVendorsQuery,
    useCreateVendorMutation,
    useUpdateVendorMutation,
    useDeleteVendorMutation,
    useDispatchTransferMutation,
    useListPushDropsQuery,
    useCreatePushDropMutation,
    useCreateSupplyRequestV2Mutation,
    useGetMyDriverTransfersQuery,
    useStartDriverTripMutation,
    useMarkDriverArrivedMutation,
    useListInventoryMaterialsQuery,
    useCreateInventoryMaterialMutation,
    useUpdateInventoryMaterialMutation,
    useDeleteInventoryMaterialMutation,
    useUpsertMaterialBalanceMutation,
} = inventoryApi;
