import { api } from "./index";

export interface QrMenuConfig {
    coverImageUrl?: string | null;
    welcomeMessage?: string;
    subtitle?: string;
    wifiSsid?: string;
    wifiPassword?: string;
    featuredItemIds?: string[];
    allowGuestOrders?: boolean;
    autoSendToKitchen?: boolean;
    enabledDietaryTags?: string[];
}

export interface PublicModifierOption {
    id: string;
    name: string;
    priceDelta: string;
    currencyCode: string;
}

export interface PublicModifierGroup {
    id: string;
    name: string;
    required: boolean;
    minSelections: number;
    maxSelections: number;
    options: PublicModifierOption[];
}

export interface PublicMenuItem {
    id: string;
    name: string;
    description?: string | null;
    price: string;
    currencyCode: string;
    badge?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    stationName?: string | null;
    imageUrl?: string | null;
    modifierGroups: PublicModifierGroup[];
}

export interface PublicMenuCategory {
    id: string;
    name: string;
    sortOrder: number;
    itemsCount: number;
}

export interface PublicActiveOrderItem {
    id: string;
    name: string;
    quantity: number;
    state: string;
    price: string;
    comment?: string | null;
    createdAt: string;
}

export interface PublicActiveSession {
    sessionId: string;
    status: string;
    customerCount?: number;
    openedAt: string;
    items: PublicActiveOrderItem[];
    totalAmount: string;
}

export interface PublicTableMenuResponse {
    tenant: {
        id: string;
        name: string;
        slug: string;
        logoUrl?: string | null;
        phone?: string | null;
        city?: string | null;
        address?: string | null;
        currencyCode: string;
    };
    table: {
        id: string;
        displayName: string;
        displayNumber?: string | null;
        locationName?: string | null;
        status: string;
        currentSessionId?: string | null;
    };
    config: QrMenuConfig;
    categories: PublicMenuCategory[];
    featuredItems: PublicMenuItem[];
    items: PublicMenuItem[];
    activeSession?: PublicActiveSession | null;
}

export interface GuestOrderItemPayload {
    menuItemId: string;
    quantity: number;
    comment?: string;
    modifiers?: { modifierOptionId: string }[];
}

export interface GuestOrderPayload {
    items: GuestOrderItemPayload[];
    customerCount?: number;
    notes?: string;
}

export interface GuestOrderResponse {
    orderId: string;
    tableSessionId: string;
    status: string;
    itemCount: number;
    estimatedWaitMinutes: number;
    message: string;
}

export interface ServiceRequestPayload {
    type:
        | "CALL_WAITER"
        | "REQUEST_WATER"
        | "REQUEST_BILL"
        | "EXTRA_NAPKINS"
        | "ASSISTANCE";
    comment?: string;
    paymentMethod?: "CASH" | "TELEBIRR";
}

export interface ServiceRequestResponse {
    success: boolean;
    message: string;
    requestedAt: string;
}

export interface AdminTableQrItem {
    id: string;
    displayName: string;
    displayNumber?: string | null;
    locationName?: string | null;
    status: string;
    qrRelativeUrl: string;
    qrFullUrl: string;
}

export interface AdminTablesQrResponse {
    slug: string;
    tables: AdminTableQrItem[];
}

export const qrMenuApi = api.injectEndpoints({
    endpoints: builder => ({
        getPublicTableMenu: builder.query<
            PublicTableMenuResponse,
            { slug: string; tableId: string }
        >({
            query: ({ slug, tableId }) => ({
                url: `/public/r/${slug}/tables/${tableId}`,
                method: "GET",
            }),
            providesTags: ["QrMenu", "Order", "Floor"],
        }),
        submitGuestOrder: builder.mutation<
            GuestOrderResponse,
            { slug: string; tableId: string; body: GuestOrderPayload }
        >({
            query: ({ slug, tableId, body }) => ({
                url: `/public/r/${slug}/tables/${tableId}/orders`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["QrMenu", "Order", "Floor"],
        }),
        submitServiceRequest: builder.mutation<
            ServiceRequestResponse,
            { slug: string; tableId: string; body: ServiceRequestPayload }
        >({
            query: ({ slug, tableId, body }) => ({
                url: `/public/r/${slug}/tables/${tableId}/service-request`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        getAdminQrMenuConfig: builder.query<QrMenuConfig, void>({
            query: () => ({
                url: "/admin/qr-menu/config",
                method: "GET",
            }),
            providesTags: ["QrMenu"],
        }),
        updateAdminQrMenuConfig: builder.mutation<QrMenuConfig, QrMenuConfig>({
            query: body => ({
                url: "/admin/qr-menu/config",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["QrMenu"],
        }),
        getAdminTablesQr: builder.query<AdminTablesQrResponse, void>({
            query: () => ({
                url: "/admin/qr-menu/tables",
                method: "GET",
            }),
            providesTags: ["Floor", "QrMenu"],
        }),
    }),
});

export const {
    useGetPublicTableMenuQuery,
    useSubmitGuestOrderMutation,
    useSubmitServiceRequestMutation,
    useGetAdminQrMenuConfigQuery,
    useUpdateAdminQrMenuConfigMutation,
    useGetAdminTablesQrQuery,
} = qrMenuApi;
