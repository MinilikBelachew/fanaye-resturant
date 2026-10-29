const fs = require("fs");
const path = require("path");

const filePath = path.resolve(
    "c:/Users/Mekdim/Desktop/resturant/fanaye-resturant/src/context/services/inventoryApi.ts",
);
let code = fs.readFileSync(filePath, "utf8");

const interfaces = `
export interface InventoryMaterial {
    id: string;
    name: string;
    amharicName?: string | null;
    code: string;
    category: 'CUTLERY' | 'CROCKERY' | 'GLASSWARE' | 'TRAYS' | 'WARMERS_CARRIERS' | 'CONTAINERS' | 'OTHER' | string;
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
`;

if (!code.includes("interface InventoryMaterial")) {
    code = code.replace(
        "export const inventoryApi = api.injectEndpoints({",
        interfaces + "\nexport const inventoryApi = api.injectEndpoints({",
    );
}

const endpoints = `
        listInventoryMaterials: builder.query<
            { data: InventoryMaterial[]; meta: { total: number; page: number; limit: number; hasMore: boolean } },
            ListMaterialsQuery | void
        >({
            query: (params) => ({
                url: '/inventory/materials',
                params: params ?? {},
            }),
            providesTags: ['Inventory'],
        }),
        createInventoryMaterial: builder.mutation<
            { data: InventoryMaterial },
            CreateMaterialPayload
        >({
            query: (body) => ({
                url: '/inventory/materials',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Inventory'],
        }),
        updateInventoryMaterial: builder.mutation<
            { data: InventoryMaterial },
            { id: string; body: UpdateMaterialPayload }
        >({
            query: ({ id, body }) => ({
                url: \`/inventory/materials/\${id}\`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Inventory'],
        }),
        deleteInventoryMaterial: builder.mutation<
            { data: { success: boolean } },
            string
        >({
            query: (id) => ({
                url: \`/inventory/materials/\${id}\`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Inventory'],
        }),
        upsertMaterialBalance: builder.mutation<
            { data: any },
            UpsertMaterialBalancePayload
        >({
            query: (body) => ({
                url: '/inventory/materials/balances',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Inventory'],
        }),
`;

if (!code.includes("listInventoryMaterials:")) {
    const targetPattern =
        /invalidatesTags:\s*\["Inventory"\],\s*\}\),\s*\}\),\s*\}\);/;
    const match = code.match(targetPattern);
    if (match) {
        code = code.replace(
            match[0],
            'invalidatesTags: ["Inventory"],\n        }),' +
                endpoints +
                "    }),\n});",
        );
    }
}

const hooks = `    useListInventoryMaterialsQuery,
    useCreateInventoryMaterialMutation,
    useUpdateInventoryMaterialMutation,
    useDeleteInventoryMaterialMutation,
    useUpsertMaterialBalanceMutation,
`;

if (!code.includes("useListInventoryMaterialsQuery")) {
    code = code.replace(
        "    useMarkDriverArrivedMutation,\n} = inventoryApi;",
        "    useMarkDriverArrivedMutation,\n" + hooks + "} = inventoryApi;",
    );
}

fs.writeFileSync(filePath, code, "utf8");
console.log("Successfully updated inventoryApi.ts with materials RTK hooks");
