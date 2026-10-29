import { api } from "./index";

export type FeedbackSource = "QR_MENU" | "WEBSITE";
export type FeedbackStatus = "NEW" | "READ" | "RESOLVED";

export interface SubmitFeedbackPayload {
    rating: number;
    comment?: string;
    customerName?: string;
    customerPhone?: string;
}

export interface SubmitTableFeedbackPayload extends SubmitFeedbackPayload {
    orderId?: string;
}

export interface SubmitFeedbackResponse {
    success: boolean;
    id: string;
    message: string;
}

export interface PublicFeedbackSummary {
    averageRating: number;
    totalCount: number;
    distribution: Record<string, number>;
}

export interface FeedbackItem {
    id: string;
    rating: number;
    comment?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    source: FeedbackSource;
    status: FeedbackStatus;
    branchId?: string | null;
    branchName?: string | null;
    tableName?: string | null;
    orderId?: string | null;
    createdAt: string;
}

export interface FeedbackSummary {
    averageRating: number;
    total: number;
    newCount: number;
    resolvedCount: number;
    lowRatingCount: number;
    last30DaysCount: number;
    distribution: Record<string, number>;
    byBranch: {
        branchId: string;
        branchName: string;
        averageRating: number;
        total: number;
    }[];
}

export interface FeedbackListResponse {
    data: FeedbackItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    summary: FeedbackSummary;
}

export interface FeedbackListQuery {
    status?: FeedbackStatus | "ALL";
    rating?: number;
    source?: FeedbackSource | "ALL";
    from?: string;
    to?: string;
    branchId?: string;
    page?: number;
    limit?: number;
}

export const feedbackApi = api.injectEndpoints({
    endpoints: builder => ({
        getPublicFeedbackSummary: builder.query<
            PublicFeedbackSummary,
            { slug: string }
        >({
            query: ({ slug }) => ({
                url: `/public/r/${slug}/feedback/summary`,
                method: "GET",
            }),
            providesTags: ["Feedback"],
        }),
        submitTableFeedback: builder.mutation<
            SubmitFeedbackResponse,
            { slug: string; tableId: string; body: SubmitTableFeedbackPayload }
        >({
            query: ({ slug, tableId, body }) => ({
                url: `/public/r/${slug}/tables/${tableId}/feedback`,
                method: "POST",
                body,
            }),
        }),
        submitWebsiteFeedback: builder.mutation<
            SubmitFeedbackResponse,
            { slug: string; body: SubmitFeedbackPayload }
        >({
            query: ({ slug, body }) => ({
                url: `/public/r/${slug}/feedback`,
                method: "POST",
                body,
            }),
        }),
        getAdminFeedback: builder.query<
            FeedbackListResponse,
            FeedbackListQuery
        >({
            query: params => {
                const search = new URLSearchParams();
                Object.entries(params ?? {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        search.set(key, String(value));
                    }
                });
                const qs = search.toString();
                return {
                    url: `/admin/feedback${qs ? `?${qs}` : ""}`,
                    method: "GET",
                };
            },
            providesTags: ["Feedback"],
        }),
        getAdminFeedbackSummary: builder.query<FeedbackSummary, void>({
            query: () => ({
                url: "/admin/feedback/summary",
                method: "GET",
            }),
            providesTags: ["Feedback"],
        }),
        updateFeedbackStatus: builder.mutation<
            FeedbackItem,
            { id: string; status: FeedbackStatus }
        >({
            query: ({ id, status }) => ({
                url: `/admin/feedback/${id}`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: ["Feedback"],
        }),
    }),
});

export const {
    useGetPublicFeedbackSummaryQuery,
    useSubmitTableFeedbackMutation,
    useSubmitWebsiteFeedbackMutation,
    useGetAdminFeedbackQuery,
    useGetAdminFeedbackSummaryQuery,
    useUpdateFeedbackStatusMutation,
} = feedbackApi;
