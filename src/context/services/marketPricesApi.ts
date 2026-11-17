import { api } from "./index";

export interface MarketCategory {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
}

export interface MarketUnit {
    id: string;
    code: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
}

export interface Marketplace {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    area: string | null;
    isActive: boolean;
}

export interface MarketItemPriceEntry {
    id: string;
    marketplaceId: string;
    marketplaceName: string;
    marketplaceSlug: string;
    city: string | null;
    area: string | null;
    price: number;
    previousPrice: number | null;
    changePercent: number | null;
    updatedByName: string | null;
    updatedAt: string;
}

export interface MarketItem {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    category: { id: string; name: string; slug: string };
    unitId: string;
    unit: { id: string; code: string; label: string };
    photoUrl: string | null;
    description: string | null;
    isFeaturedOnLanding: boolean;
    isActive: boolean;
    averagePrice: number | null;
    previousAveragePrice: number | null;
    changePercent: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    marketplaceCount: number;
    marketPrices: MarketItemPriceEntry[];
    lastUpdatedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface MarketPriceHistoryEntry {
    id: string;
    marketplaceId: string;
    marketplaceName: string;
    price: number;
    recordedByName: string | null;
    recordedAt: string;
}

export interface MarketItemDetail extends MarketItem {
    history: MarketPriceHistoryEntry[];
}

export interface MarketMetadataResponse {
    categories: MarketCategory[];
    units: MarketUnit[];
    marketplaces: Marketplace[];
}

export interface PaginatedMarketItemsResponse {
    items: MarketItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PlatformMarketCapabilities {
    roleCode: string;
    isSuperAdmin: boolean;
    canUpdatePrices: boolean;
    canManageItems: boolean;
    canManageLocations: boolean;
}

export interface MarketReporter {
    id: string;
    userId: string;
    displayName: string;
    phone: string | null;
    email: string | null;
    status: "ACTIVE" | "DISABLED" | string;
    accountStatus: string;
    grantedAt: string;
}

export interface PlatformRolePermissionItem {
    permissionCode: string;
    label: string;
    description: string;
    enabled: boolean;
}

export interface PlatformRolePermissionsResponse {
    roleCode: string;
    permissions: PlatformRolePermissionItem[];
}

export interface ListMarketItemsParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    marketplaceId?: string;
    featuredOnly?: boolean;
    includeInactive?: boolean;
}

export const marketPricesApi = api.injectEndpoints({
    endpoints: build => ({
        // Public endpoints (no auth)
        getPublicMarketMetadata: build.query<MarketMetadataResponse, void>({
            query: () => ({ url: "/market-prices/public/metadata" }),
            providesTags: ["MarketPrices"],
        }),
        listPublicMarketItems: build.query<
            PaginatedMarketItemsResponse,
            ListMarketItemsParams | void
        >({
            query: params => ({
                url: "/market-prices/public/items",
                params: params ?? undefined,
            }),
            providesTags: ["MarketPrices"],
        }),
        getPublicMarketItemDetail: build.query<MarketItemDetail, string>({
            query: idOrSlug => ({
                url: `/market-prices/public/items/${encodeURIComponent(idOrSlug)}`,
            }),
            providesTags: ["MarketPrices"],
        }),
        listPublicMarketHistory: build.query<
            {
                entries: Array<{
                    id: string;
                    itemId: string;
                    itemName: string;
                    itemSlug: string;
                    categoryName: string;
                    unitCode: string;
                    marketplaceId: string;
                    marketplaceName: string;
                    price: number;
                    recordedByName: string | null;
                    recordedAt: string;
                }>;
                summary: {
                    count: number;
                    avgPrice: number | null;
                    minPrice: number | null;
                    maxPrice: number | null;
                };
            },
            {
                dateFrom?: string;
                dateTo?: string;
                itemId?: string;
                marketplaceId?: string;
                categoryId?: string;
                limit?: number;
            } | void
        >({
            query: params => ({
                url: "/market-prices/public/history",
                params: params ?? undefined,
            }),
            providesTags: ["MarketPrices"],
        }),

        // Tenant (Owner / Manager / Store Manager) endpoints
        listTenantMarketItems: build.query<
            PaginatedMarketItemsResponse,
            ListMarketItemsParams | void
        >({
            query: params => ({
                url: "/market-prices/tenant/items",
                params: params ?? undefined,
            }),
            providesTags: ["MarketPrices"],
        }),
        getTenantMarketItemDetail: build.query<MarketItemDetail, string>({
            query: idOrSlug => ({
                url: `/market-prices/tenant/items/${encodeURIComponent(idOrSlug)}`,
            }),
            providesTags: ["MarketPrices"],
        }),

        // Platform (Super Admin & Market Reporter) endpoints
        getMyMarketCapabilities: build.query<PlatformMarketCapabilities, void>({
            query: () => ({ url: "/market-prices/admin/me" }),
            providesTags: ["MarketPrices"],
        }),
        listAdminMarketMetadata: build.query<
            MarketMetadataResponse,
            { includeInactive?: boolean } | void
        >({
            query: params => ({
                url: "/market-prices/admin/metadata",
                params: params ?? undefined,
            }),
            providesTags: ["MarketPrices"],
        }),
        listAdminMarketItems: build.query<
            PaginatedMarketItemsResponse,
            ListMarketItemsParams | void
        >({
            query: params => ({
                url: "/market-prices/admin/items",
                params: params ?? undefined,
            }),
            providesTags: ["MarketPrices"],
        }),
        upsertMarketPrice: build.mutation<
            unknown,
            { itemId: string; marketplaceId: string; price: number }
        >({
            query: body => ({
                url: "/market-prices/admin/prices",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        bulkUpsertMarketPrices: build.mutation<
            { updatedCount: number },
            {
                entries: Array<{
                    itemId: string;
                    marketplaceId: string;
                    price: number;
                }>;
            }
        >({
            query: body => ({
                url: "/market-prices/admin/prices/bulk",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        createMarketItem: build.mutation<
            unknown,
            {
                name: string;
                categoryId: string;
                unitId: string;
                photoUrl?: string;
                description?: string;
                isFeaturedOnLanding?: boolean;
            }
        >({
            query: body => ({
                url: "/market-prices/admin/items",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        updateMarketItem: build.mutation<
            unknown,
            {
                id: string;
                name?: string;
                categoryId?: string;
                unitId?: string;
                photoUrl?: string;
                description?: string;
                isFeaturedOnLanding?: boolean;
                isActive?: boolean;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/market-prices/admin/items/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        createMarketCategory: build.mutation<
            MarketCategory,
            { name: string; sortOrder?: number }
        >({
            query: body => ({
                url: "/market-prices/admin/categories",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        updateMarketCategory: build.mutation<
            MarketCategory,
            {
                id: string;
                name?: string;
                sortOrder?: number;
                isActive?: boolean;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/market-prices/admin/categories/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        createMarketUnit: build.mutation<
            MarketUnit,
            { code: string; label: string; sortOrder?: number }
        >({
            query: body => ({
                url: "/market-prices/admin/units",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        updateMarketUnit: build.mutation<
            MarketUnit,
            {
                id: string;
                code?: string;
                label?: string;
                sortOrder?: number;
                isActive?: boolean;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/market-prices/admin/units/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        createMarketplace: build.mutation<
            Marketplace,
            { name: string; city?: string; area?: string }
        >({
            query: body => ({
                url: "/market-prices/admin/marketplaces",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        updateMarketplace: build.mutation<
            Marketplace,
            {
                id: string;
                name?: string;
                city?: string;
                area?: string;
                isActive?: boolean;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/market-prices/admin/marketplaces/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        listMarketReporters: build.query<MarketReporter[], void>({
            query: () => ({ url: "/market-prices/admin/reporters" }),
            providesTags: ["MarketPrices"],
        }),
        createMarketReporter: build.mutation<
            MarketReporter,
            {
                displayName: string;
                phone: string;
                email?: string;
                password: string;
            }
        >({
            query: body => ({
                url: "/market-prices/admin/reporters",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        updateMarketReporterStatus: build.mutation<
            { id: string; status: string },
            { id: string; status: "ACTIVE" | "DISABLED" }
        >({
            query: ({ id, status }) => ({
                url: `/market-prices/admin/reporters/${id}`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: ["MarketPrices"],
        }),
        getPlatformRolePermissions: build.query<
            PlatformRolePermissionsResponse,
            string
        >({
            query: roleCode => ({
                url: `/market-prices/admin/platform-roles/${encodeURIComponent(roleCode)}/permissions`,
            }),
            providesTags: ["MarketPrices"],
        }),
        updatePlatformRolePermissions: build.mutation<
            PlatformRolePermissionsResponse,
            {
                roleCode: string;
                permissions: Array<{
                    permissionCode: string;
                    enabled: boolean;
                }>;
            }
        >({
            query: ({ roleCode, permissions }) => ({
                url: `/market-prices/admin/platform-roles/${encodeURIComponent(roleCode)}/permissions`,
                method: "PUT",
                body: { permissions },
            }),
            invalidatesTags: ["MarketPrices"],
        }),
    }),
});

export const {
    useGetPublicMarketMetadataQuery,
    useListPublicMarketItemsQuery,
    useGetPublicMarketItemDetailQuery,
    useListPublicMarketHistoryQuery,
    useListTenantMarketItemsQuery,
    useGetTenantMarketItemDetailQuery,
    useGetMyMarketCapabilitiesQuery,
    useListAdminMarketMetadataQuery,
    useListAdminMarketItemsQuery,
    useUpsertMarketPriceMutation,
    useBulkUpsertMarketPricesMutation,
    useCreateMarketItemMutation,
    useUpdateMarketItemMutation,
    useCreateMarketCategoryMutation,
    useUpdateMarketCategoryMutation,
    useCreateMarketUnitMutation,
    useUpdateMarketUnitMutation,
    useCreateMarketplaceMutation,
    useUpdateMarketplaceMutation,
    useListMarketReportersQuery,
    useCreateMarketReporterMutation,
    useUpdateMarketReporterStatusMutation,
    useGetPlatformRolePermissionsQuery,
    useUpdatePlatformRolePermissionsMutation,
} = marketPricesApi;
