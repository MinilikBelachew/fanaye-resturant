import type {
    AdminMenuItem,
    AdminMenuMeta,
    AdminModifierGroup,
    CreateAdminMenuItemBody,
    CreateAdminModifierGroupBody,
    ScannedMenuItem,
    UpdateAdminMenuItemBody,
    VipPricingResponse,
} from "@/domains/catalog/domain/menuApi";
import { api } from "./index";

export const menuApi = api.injectEndpoints({
    endpoints: builder => ({
        adminMenuMeta: builder.query<{ data: AdminMenuMeta }, void>({
            query: () => ({
                url: "/admin/menu-meta",
                method: "GET",
            }),
            providesTags: ["Menu"],
        }),
        adminMenuItems: builder.query<
            { data: AdminMenuItem[] },
            { q?: string; stationId?: string } | void
        >({
            query: params => ({
                url: "/admin/menu-items",
                method: "GET",
                params: {
                    ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
                    ...(params?.stationId && params.stationId !== "all"
                        ? { stationId: params.stationId }
                        : {}),
                },
            }),
            providesTags: ["Menu"],
        }),
        vipPricing: builder.query<VipPricingResponse, void>({
            query: () => ({
                url: "/admin/vip-pricing",
                method: "GET",
            }),
            providesTags: ["Menu"],
        }),
        updateDefaultVipPercent: builder.mutation<
            VipPricingResponse,
            { defaultVipPercent: number }
        >({
            query: body => ({
                url: "/admin/vip-pricing/default",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Menu"],
        }),
        adminModifierGroups: builder.query<
            { data: AdminModifierGroup[] },
            void
        >({
            query: () => ({
                url: "/admin/modifier-groups",
                method: "GET",
            }),
            providesTags: ["Menu"],
        }),
        createAdminModifierGroup: builder.mutation<
            { data: AdminModifierGroup },
            CreateAdminModifierGroupBody
        >({
            query: body => ({
                url: "/admin/modifier-groups",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Menu"],
        }),
        updateAdminModifierGroup: builder.mutation<
            { data: AdminModifierGroup },
            { id: string; body: CreateAdminModifierGroupBody }
        >({
            query: ({ id, body }) => ({
                url: `/admin/modifier-groups/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Menu"],
        }),
        deleteAdminModifierGroup: builder.mutation<
            { success: boolean },
            { id: string }
        >({
            query: ({ id }) => ({
                url: `/admin/modifier-groups/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Menu"],
        }),
        createAdminMenuItem: builder.mutation<
            { data: AdminMenuItem },
            CreateAdminMenuItemBody
        >({
            query: body => ({
                url: "/admin/menu-items",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Menu"],
        }),
        updateAdminMenuItem: builder.mutation<
            { data: AdminMenuItem },
            { id: string; body: UpdateAdminMenuItemBody }
        >({
            query: ({ id, body }) => ({
                url: `/admin/menu-items/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Menu"],
        }),
        uploadMenuImage: builder.mutation<
            { file: { id: string; path: string } },
            File
        >({
            query: file => {
                const body = new FormData();
                body.append("file", file);
                return {
                    url: "/files/upload",
                    method: "POST",
                    body,
                };
            },
        }),
        scanMenuFromImage: builder.mutation<
            {
                data: ScannedMenuItem[];
                itemCount: number;
                rawText?: string | null;
            },
            File
        >({
            query: file => {
                const body = new FormData();
                body.append("file", file);
                return {
                    url: "/admin/menu-items/scan-from-image",
                    method: "POST",
                    body,
                };
            },
        }),
        importScannedMenu: builder.mutation<
            {
                createdCount: number;
                createdIds: string[];
                errors?: string[];
            },
            { items: ScannedMenuItem[] }
        >({
            query: body => ({
                url: "/admin/menu-items/import-scanned",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Menu"],
        }),
        markMenuItemSoldOut: builder.mutation<
            { data: AdminMenuItem },
            { id: string }
        >({
            query: ({ id }) => ({
                url: `/admin/menu-items/${id}/sold-out`,
                method: "POST",
                body: {},
            }),
            invalidatesTags: ["Menu"],
        }),
        clearMenuItemSoldOut: builder.mutation<
            { data: AdminMenuItem },
            { id: string }
        >({
            query: ({ id }) => ({
                url: `/admin/menu-items/${id}/sold-out`,
                method: "DELETE",
            }),
            invalidatesTags: ["Menu"],
        }),
        deleteAdminCategory: builder.mutation<
            { success: boolean },
            { id: string }
        >({
            query: ({ id }) => ({
                url: `/menu/categories/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Menu"],
        }),
        deleteAdminMenuItem: builder.mutation<
            { success: boolean },
            { id: string }
        >({
            query: ({ id }) => ({
                url: `/menu/items/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Menu"],
        }),
    }),
});

export const {
    useAdminMenuMetaQuery,
    useAdminMenuItemsQuery,
    useVipPricingQuery,
    useUpdateDefaultVipPercentMutation,
    useAdminModifierGroupsQuery,
    useCreateAdminModifierGroupMutation,
    useUpdateAdminModifierGroupMutation,
    useDeleteAdminModifierGroupMutation,
    useCreateAdminMenuItemMutation,
    useUpdateAdminMenuItemMutation,
    useUploadMenuImageMutation,
    useScanMenuFromImageMutation,
    useImportScannedMenuMutation,
    useMarkMenuItemSoldOutMutation,
    useClearMenuItemSoldOutMutation,
    useDeleteAdminCategoryMutation,
    useDeleteAdminMenuItemMutation,
} = menuApi;
