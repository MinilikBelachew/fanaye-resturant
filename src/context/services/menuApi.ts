import type {
    AdminMenuItem,
    AdminMenuMeta,
    AdminModifierGroup,
    CreateAdminMenuItemBody,
    CreateAdminModifierGroupBody,
    ScannedMenuItem,
    UpdateAdminMenuItemBody,
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
        adminMenuItems: builder.query<{ data: AdminMenuItem[] }, void>({
            query: () => ({
                url: "/admin/menu-items",
                method: "GET",
            }),
            providesTags: ["Menu"],
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
    }),
});

export const {
    useAdminMenuMetaQuery,
    useAdminMenuItemsQuery,
    useAdminModifierGroupsQuery,
    useCreateAdminModifierGroupMutation,
    useCreateAdminMenuItemMutation,
    useUpdateAdminMenuItemMutation,
    useUploadMenuImageMutation,
    useScanMenuFromImageMutation,
    useImportScannedMenuMutation,
    useMarkMenuItemSoldOutMutation,
    useClearMenuItemSoldOutMutation,
} = menuApi;
