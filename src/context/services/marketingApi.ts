import { api } from "./index";

export type MarketingCampaignStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PROMOTING"
    | "DONE"
    | "PAYMENT_SUBMITTED"
    | "PAID"
    | "CANCELLED";

export interface MarketingCampaign {
    id: string;
    tenantId: string;
    tenantName: string | null;
    branchId: string | null;
    branchName: string | null;
    menuItemId: string;
    menuItemName: string;
    menuItemPrice: number | null;
    menuItemCurrency: string;
    menuItemImage: string | null;
    requestedById: string;
    requestedByName: string | null;
    targetLocation: string;
    targetAgeMin: number;
    targetAgeMax: number;
    targetViews: number;
    notes: string | null;
    status: MarketingCampaignStatus;
    deliveredViews: number;
    amountDue: number | null;
    currencyCode: string;
    adminNotes: string | null;
    paymentReference: string | null;
    paymentNotes: string | null;
    confirmedAt: string | null;
    promotedAt: string | null;
    doneAt: string | null;
    paymentSubmittedAt: string | null;
    paidAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MarketingStatusCounts {
    ALL: number;
    PENDING: number;
    CONFIRMED: number;
    PROMOTING: number;
    DONE: number;
    PAYMENT_SUBMITTED: number;
    PAID: number;
    CANCELLED: number;
}

export interface MarketingCampaignListResponse {
    items: MarketingCampaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts: MarketingStatusCounts;
    totalAmountDue: number;
    totalDeliveredViews: number;
}

export interface ListMarketingCampaignsParams {
    page?: number;
    limit?: number;
    status?: MarketingCampaignStatus;
    search?: string;
    tenantId?: string;
}

export interface CreateMarketingCampaignBody {
    menuItemId: string;
    branchId?: string;
    targetLocation: string;
    targetAgeMin: number;
    targetAgeMax: number;
    targetViews: number;
    notes?: string;
}

export interface SubmitMarketingPaymentBody {
    id: string;
    paymentReference: string;
    paymentNotes?: string;
}

export interface UpdateSuperAdminMarketingCampaignBody {
    id: string;
    status: MarketingCampaignStatus;
    deliveredViews?: number;
    amountDue?: number;
    adminNotes?: string;
}

export const marketingApi = api.injectEndpoints({
    endpoints: builder => ({
        listMarketingCampaigns: builder.query<
            MarketingCampaignListResponse,
            ListMarketingCampaignsParams | void
        >({
            query: params => ({
                url: "/marketing/campaigns",
                method: "GET",
                params: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    ...(params?.status ? { status: params.status } : {}),
                    ...(params?.search?.trim()
                        ? { search: params.search.trim() }
                        : {}),
                },
            }),
            providesTags: ["Marketing"],
        }),
        createMarketingCampaign: builder.mutation<
            MarketingCampaign,
            CreateMarketingCampaignBody
        >({
            query: body => ({
                url: "/marketing/campaigns",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Marketing"],
        }),
        cancelMarketingCampaign: builder.mutation<MarketingCampaign, string>({
            query: id => ({
                url: `/marketing/campaigns/${id}/cancel`,
                method: "POST",
            }),
            invalidatesTags: ["Marketing"],
        }),
        submitMarketingPayment: builder.mutation<
            MarketingCampaign,
            SubmitMarketingPaymentBody
        >({
            query: ({ id, ...body }) => ({
                url: `/marketing/campaigns/${id}/submit-payment`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Marketing"],
        }),
        listSuperAdminMarketingCampaigns: builder.query<
            MarketingCampaignListResponse,
            ListMarketingCampaignsParams | void
        >({
            query: params => ({
                url: "/super-admin/marketing/campaigns",
                method: "GET",
                params: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    ...(params?.status ? { status: params.status } : {}),
                    ...(params?.search?.trim()
                        ? { search: params.search.trim() }
                        : {}),
                    ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
                },
            }),
            providesTags: ["Marketing"],
        }),
        getSuperAdminMarketingCampaign: builder.query<
            MarketingCampaign,
            string
        >({
            query: id => ({
                url: `/super-admin/marketing/campaigns/${id}`,
                method: "GET",
            }),
            providesTags: ["Marketing"],
        }),
        updateSuperAdminMarketingCampaign: builder.mutation<
            MarketingCampaign,
            UpdateSuperAdminMarketingCampaignBody
        >({
            query: ({ id, ...body }) => ({
                url: `/super-admin/marketing/campaigns/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Marketing"],
        }),
    }),
});

export const {
    useListMarketingCampaignsQuery,
    useCreateMarketingCampaignMutation,
    useCancelMarketingCampaignMutation,
    useSubmitMarketingPaymentMutation,
    useListSuperAdminMarketingCampaignsQuery,
    useGetSuperAdminMarketingCampaignQuery,
    useUpdateSuperAdminMarketingCampaignMutation,
} = marketingApi;
