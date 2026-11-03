import { api } from "./index";

export type CustomerVipTier = "REGULAR" | "VIP" | "VVIP" | "BLACKLISTED";

export interface CustomerVisitLog {
    id: string;
    detectedAt: string;
    matchScore: number;
    cameraLocation?: string | null;
    tableSessionId?: string | null;
}

export interface CustomerBiometricProfile {
    id: string;
    tenantId: string;
    branchId: string;
    customerCode: string;
    displayName?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    vipTier: CustomerVipTier;
    avatarUrl?: string | null;
    totalVisits: number;
    firstVisitAt: string;
    lastVisitAt: string;
    createdAt: string;
    updatedAt: string;
    branch?: { id: string; name: string; displayCode?: string | null } | null;
    visitLogs?: CustomerVisitLog[];
    _count?: {
        visitLogs: number;
    };
}

export interface CustomerListResponse {
    items: CustomerBiometricProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: {
        totalEnrolledCustomers: number;
        totalVisitsAccumulated: number;
        vipCount: number;
        regularCount: number;
    };
}

export interface CustomerListQuery {
    search?: string;
    vipTier?: CustomerVipTier;
    branchId?: string;
    page?: number;
    limit?: number;
}

export interface UpdateCustomerPayload {
    displayName?: string;
    phone?: string;
    email?: string;
    notes?: string;
    vipTier?: CustomerVipTier;
}

export interface CreateCustomerPayload {
    displayName?: string;
    phone?: string;
    notes?: string;
    vipTier?: CustomerVipTier;
}

export const biometricsApi = api.injectEndpoints({
    endpoints: builder => ({
        listCustomers: builder.query<
            CustomerListResponse,
            CustomerListQuery | void
        >({
            query: params => {
                const search = new URLSearchParams();
                if (params?.search) search.set("search", params.search);
                if (params?.vipTier) search.set("vipTier", params.vipTier);
                if (params?.branchId) search.set("branchId", params.branchId);
                if (params?.page) search.set("page", String(params.page));
                if (params?.limit) search.set("limit", String(params.limit));
                const qs = search.toString();
                return {
                    url: `/biometrics/customers${qs ? `?${qs}` : ""}`,
                    method: "GET",
                };
            },
            providesTags: ["Biometrics"],
        }),

        getCustomer: builder.query<CustomerBiometricProfile, string>({
            query: id => ({
                url: `/biometrics/customers/${id}`,
                method: "GET",
            }),
            providesTags: (result, error, id) => [{ type: "Biometrics", id }],
        }),

        updateCustomer: builder.mutation<
            CustomerBiometricProfile,
            { id: string; body: UpdateCustomerPayload }
        >({
            query: ({ id, body }) => ({
                url: `/biometrics/customers/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Biometrics"],
        }),

        createCustomer: builder.mutation<
            CustomerBiometricProfile,
            FormData | CreateCustomerPayload
        >({
            query: body => ({
                url: `/biometrics/customers`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Biometrics"],
        }),

        deleteCustomer: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: id => ({
                url: `/biometrics/customers/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Biometrics"],
        }),

        scanCustomer: builder.mutation<any, FormData>({
            query: formData => ({
                url: `/biometrics/scan-customer`,
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Biometrics"],
        }),
    }),
});

export const {
    useListCustomersQuery,
    useGetCustomerQuery,
    useUpdateCustomerMutation,
    useCreateCustomerMutation,
    useDeleteCustomerMutation,
    useScanCustomerMutation,
} = biometricsApi;
