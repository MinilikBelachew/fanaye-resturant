import { api } from "./index";
import type { AuthContext } from "@/domains/identity/domain/authContext";

export type BranchManagerSummary = {
    membershipId: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
};

export type BranchDto = {
    id: string;
    tenantId: string;
    name: string;
    displayCode: string | null;
    timezone: string;
    status: string;
    createdAt: string;
    manager: BranchManagerSummary | null;
    tableCount: number;
    stationCount: number;
    staffCount: number;
    serviceMode?: string;
};

export type BranchListResponse = {
    data: BranchDto[];
    maxBranches: number;
    activeCount: number;
};

export type CreateBranchBody = {
    name: string;
    displayCode?: string;
    timezone?: string;
    copyFromBranchId?: string;
    tableCount?: number;
    tenantId?: string;
    serviceMode?: string;
    manager: {
        name: string;
        email?: string;
        phone?: string;
        password: string;
    };
};

export type UpdateBranchBody = {
    name?: string;
    displayCode?: string;
    status?: string;
    tenantId?: string;
    serviceMode?: string;
};

export const branchesApi = api.injectEndpoints({
    endpoints: builder => ({
        listBranches: builder.query<
            BranchListResponse,
            { tenantId?: string; activeOnly?: boolean } | void
        >({
            query: args => ({
                url: "/branches",
                params: {
                    ...(args?.tenantId ? { tenantId: args.tenantId } : {}),
                    ...(args?.activeOnly === false
                        ? { activeOnly: "false" }
                        : {}),
                },
            }),
            providesTags: ["Branches"],
        }),
        createBranch: builder.mutation<{ data: BranchDto }, CreateBranchBody>({
            query: body => ({
                url: "/branches",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Branches"],
        }),
        updateBranch: builder.mutation<
            { data: BranchDto },
            { branchId: string; body: UpdateBranchBody }
        >({
            query: ({ branchId, body }) => ({
                url: `/branches/${branchId}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Branches"],
        }),
        switchBranch: builder.mutation<AuthContext, { branchId: string }>({
            query: body => ({
                url: "/branches/switch",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const {
    useListBranchesQuery,
    useCreateBranchMutation,
    useUpdateBranchMutation,
    useSwitchBranchMutation,
} = branchesApi;
