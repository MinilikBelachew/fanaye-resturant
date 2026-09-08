import type {
    DailyClose,
    DailyClosePreview,
} from "@/domains/reporting/domain/dailyCloseApi";
import { api } from "./index";

function idempotencyKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const dailyCloseApi = api.injectEndpoints({
    endpoints: builder => ({
        dailyClosePreview: builder.query<
            { data: DailyClosePreview },
            { businessDate?: string } | void
        >({
            query: arg => ({
                url: "/daily-close/preview",
                method: "GET",
                params: arg?.businessDate
                    ? { businessDate: arg.businessDate }
                    : undefined,
            }),
            providesTags: ["DailyClose"],
        }),
        createDailyClose: builder.mutation<
            { data: DailyClose },
            { businessDate: string }
        >({
            query: body => ({
                url: "/daily-closes",
                method: "POST",
                body,
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["DailyClose"],
        }),
        refreshDailyClose: builder.mutation<
            { data: DailyClose },
            { dailyCloseId: string }
        >({
            query: ({ dailyCloseId }) => ({
                url: `/daily-closes/${dailyCloseId}/refresh`,
                method: "POST",
                body: {},
            }),
            invalidatesTags: ["DailyClose"],
        }),
        approveDailyClose: builder.mutation<
            { data: DailyClose },
            { dailyCloseId: string; expectedVersion: number }
        >({
            query: ({ dailyCloseId, expectedVersion }) => ({
                url: `/daily-closes/${dailyCloseId}/approve`,
                method: "POST",
                body: { expectedVersion },
            }),
            invalidatesTags: ["DailyClose"],
        }),
        lockDailyClose: builder.mutation<
            {
                data: {
                    dailyCloseId: string;
                    status: string;
                    businessDate: string;
                    lockedAt: string | null;
                    lockedByMembershipId: string | null;
                    version: number;
                };
            },
            { dailyCloseId: string; expectedVersion: number }
        >({
            query: ({ dailyCloseId, expectedVersion }) => ({
                url: `/daily-closes/${dailyCloseId}/lock`,
                method: "POST",
                body: { expectedVersion },
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["DailyClose"],
        }),
        getDailyClose: builder.query<
            { data: DailyClose },
            { dailyCloseId: string }
        >({
            query: ({ dailyCloseId }) => ({
                url: `/daily-closes/${dailyCloseId}`,
                method: "GET",
            }),
            providesTags: ["DailyClose"],
        }),
    }),
});

export const {
    useDailyClosePreviewQuery,
    useCreateDailyCloseMutation,
    useRefreshDailyCloseMutation,
    useApproveDailyCloseMutation,
    useLockDailyCloseMutation,
    useGetDailyCloseQuery,
} = dailyCloseApi;
