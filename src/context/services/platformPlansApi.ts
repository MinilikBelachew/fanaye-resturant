import { api } from "./index";
import type { SubscriptionPlanListResponse } from "./superAdminApi";

export const platformPlansApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        listPlatformPlans: builder.query<SubscriptionPlanListResponse, void>({
            query: () => ({
                url: "/super-admin/plans",
                method: "GET",
            }),
            providesTags: ["Auth"],
        }),
    }),
});

export const { useListPlatformPlansQuery } = platformPlansApi;
