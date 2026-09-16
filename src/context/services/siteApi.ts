import { api } from "@/context/services";

export interface SiteTheme {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    logoUrl?: string | null;
    fontDisplay?: string;
    fontBody?: string;
    backgroundType?: "solid" | "gradient" | "image" | null;
    backgroundGradient?: string | null;
    backgroundImageUrl?: string | null;
    backgroundOverlayOpacity?: number | null;
    borderRadius?: "none" | "md" | "xl" | "full" | null;
}

export interface TenantSite {
    id: string;
    tenantId: string;
    tenantName: string;
    slug: string;
    status: string;
    theme: SiteTheme;
    draftData: Record<string, unknown>;
    publishedData?: Record<string, unknown> | null;
    publishedAt?: string | null;
    publicPath: string;
}

export interface SiteResponse {
    data: TenantSite;
}

export interface PublicMenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    currencyCode: string;
    imageUrl?: string | null;
    categoryId: string;
    categoryName: string;
    soldOut: boolean;
}

export interface PublicSite {
    slug: string;
    tenantName: string;
    theme: SiteTheme;
    data: Record<string, unknown>;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    address?: string | null;
    hours?: string | null;
    menuItems: PublicMenuItem[];
}

export interface PublicSiteResponse {
    data: PublicSite;
}

export interface UpdateSitePayload {
    slug?: string;
    theme?: Partial<SiteTheme>;
    draftData?: Record<string, unknown>;
}

export const siteApi = api.injectEndpoints({
    endpoints: builder => ({
        getTenantSite: builder.query<SiteResponse, void>({
            query: () => ({ url: "/site", method: "GET" }),
            providesTags: ["Site"],
        }),
        updateTenantSite: builder.mutation<SiteResponse, UpdateSitePayload>({
            query: body => ({ url: "/site", method: "PUT", body }),
            invalidatesTags: ["Site"],
        }),
        publishTenantSite: builder.mutation<SiteResponse, void>({
            query: () => ({ url: "/site/publish", method: "POST" }),
            invalidatesTags: ["Site"],
        }),
        unpublishTenantSite: builder.mutation<SiteResponse, void>({
            query: () => ({ url: "/site/unpublish", method: "POST" }),
            invalidatesTags: ["Site"],
        }),
        getPublicSite: builder.query<PublicSiteResponse, string>({
            query: slug => ({
                url: `/site/public/${encodeURIComponent(slug)}`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    useGetTenantSiteQuery,
    useUpdateTenantSiteMutation,
    usePublishTenantSiteMutation,
    useUnpublishTenantSiteMutation,
    useGetPublicSiteQuery,
    useLazyGetPublicSiteQuery,
} = siteApi;
