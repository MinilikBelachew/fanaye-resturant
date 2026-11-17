import { api } from "./index";

export type TalentRoleCategory =
    | "CHEF"
    | "WAITER"
    | "BARISTA"
    | "CASHIER"
    | "BAKER"
    | "STORE_MANAGER"
    | "RECEPTIONIST"
    | "DRIVER"
    | "CLEANER"
    | "OTHER";

export type TalentAvailability =
    | "IMMEDIATE"
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT";

export type TalentProfileStatus =
    | "AVAILABLE"
    | "IN_PROCESS"
    | "HIRED"
    | "ARCHIVED";

export type TalentRequestStatus =
    | "CONTACTED"
    | "INTERVIEWING"
    | "HIRED"
    | "CANCELLED";

export interface TalentProfile {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    photoUrl: string | null;
    roleCategory: TalentRoleCategory;
    roleTitle: string;
    location: string;
    yearsExperience: number;
    availability: TalentAvailability;
    skills: string[];
    languages: string[];
    bio: string | null;
    isVerified: boolean;
    status: TalentProfileStatus;
    hiredByTenantId: string | null;
    hiredByTenantName: string | null;
    hiredAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TalentHireRequest {
    id: string;
    talentProfileId: string;
    talentProfile: TalentProfile;
    tenantId: string;
    tenantName: string | null;
    branchId: string | null;
    branchName: string | null;
    requestedById: string;
    requestedByName: string | null;
    status: TalentRequestStatus;
    notes: string | null;
    adminNotes: string | null;
    onboardedMembershipId: string | null;
    contactedAt: string;
    interviewingAt: string | null;
    hiredAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TalentProfileListResponse {
    items: TalentProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts?: {
        ALL: number;
        AVAILABLE: number;
        IN_PROCESS: number;
        HIRED: number;
        ARCHIVED: number;
    };
}

export interface TalentRequestListResponse {
    items: TalentHireRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts: {
        ALL: number;
        CONTACTED: number;
        INTERVIEWING: number;
        HIRED: number;
        CANCELLED: number;
    };
}

export interface ListTalentProfilesParams {
    page?: number;
    limit?: number;
    roleCategory?: TalentRoleCategory;
    availability?: TalentAvailability;
    status?: TalentProfileStatus;
    location?: string;
    minExperience?: number;
    search?: string;
}

export interface ListTalentRequestsParams {
    page?: number;
    limit?: number;
    status?: TalentRequestStatus;
    search?: string;
}

export interface CreateTalentProfileBody {
    fullName: string;
    phone: string;
    email?: string;
    photoUrl?: string;
    roleCategory: TalentRoleCategory;
    roleTitle: string;
    location: string;
    yearsExperience: number;
    availability?: TalentAvailability;
    skills?: string[];
    languages?: string[];
    bio?: string;
    isVerified?: boolean;
}

export interface UpdateTalentProfileBody
    extends Partial<CreateTalentProfileBody> {
    id: string;
    status?: TalentProfileStatus;
}

export const talentApi = api.injectEndpoints({
    endpoints: builder => ({
        browseTalentProfiles: builder.query<
            TalentProfileListResponse,
            ListTalentProfilesParams | void
        >({
            query: params => ({
                url: "/talent/profiles",
                method: "GET",
                params: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 12,
                    ...(params?.roleCategory
                        ? { roleCategory: params.roleCategory }
                        : {}),
                    ...(params?.availability
                        ? { availability: params.availability }
                        : {}),
                    ...(params?.location?.trim()
                        ? { location: params.location.trim() }
                        : {}),
                    ...(params?.minExperience !== undefined
                        ? { minExperience: params.minExperience }
                        : {}),
                    ...(params?.search?.trim()
                        ? { search: params.search.trim() }
                        : {}),
                },
            }),
            providesTags: ["Talent"],
        }),
        listTalentRequests: builder.query<
            TalentRequestListResponse,
            ListTalentRequestsParams | void
        >({
            query: params => ({
                url: "/talent/requests",
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
            providesTags: ["Talent"],
        }),
        logTalentContactRequest: builder.mutation<
            TalentHireRequest,
            { talentProfileId: string; branchId?: string; notes?: string }
        >({
            query: body => ({
                url: "/talent/requests",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Talent"],
        }),
        hireTalentToStaff: builder.mutation<
            TalentHireRequest,
            {
                talentProfileId: string;
                branchId?: string;
                roleCode?: string;
                pin?: string;
                notes?: string;
            }
        >({
            query: body => ({
                url: "/talent/hire",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Talent", "Floor"],
        }),
        updateTenantTalentRequest: builder.mutation<
            TalentHireRequest,
            { id: string; status: TalentRequestStatus }
        >({
            query: ({ id, status }) => ({
                url: `/talent/requests/${id}`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: ["Talent"],
        }),
        listSuperAdminTalentProfiles: builder.query<
            TalentProfileListResponse,
            ListTalentProfilesParams | void
        >({
            query: params => ({
                url: "/super-admin/talent/profiles",
                method: "GET",
                params: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 12,
                    ...(params?.roleCategory
                        ? { roleCategory: params.roleCategory }
                        : {}),
                    ...(params?.status ? { status: params.status } : {}),
                    ...(params?.search?.trim()
                        ? { search: params.search.trim() }
                        : {}),
                },
            }),
            providesTags: ["Talent"],
        }),
        createSuperAdminTalentProfile: builder.mutation<
            TalentProfile,
            CreateTalentProfileBody
        >({
            query: body => ({
                url: "/super-admin/talent/profiles",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Talent"],
        }),
        updateSuperAdminTalentProfile: builder.mutation<
            TalentProfile,
            UpdateTalentProfileBody
        >({
            query: ({ id, ...body }) => ({
                url: `/super-admin/talent/profiles/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Talent"],
        }),
        listSuperAdminTalentRequests: builder.query<
            TalentRequestListResponse,
            ListTalentRequestsParams | void
        >({
            query: params => ({
                url: "/super-admin/talent/requests",
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
            providesTags: ["Talent"],
        }),
        getSuperAdminTalentRequest: builder.query<TalentHireRequest, string>({
            query: id => ({
                url: `/super-admin/talent/requests/${id}`,
                method: "GET",
            }),
            providesTags: ["Talent"],
        }),
        updateSuperAdminTalentRequest: builder.mutation<
            TalentHireRequest,
            { id: string; status: TalentRequestStatus; adminNotes?: string }
        >({
            query: ({ id, ...body }) => ({
                url: `/super-admin/talent/requests/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Talent"],
        }),
    }),
});

export const {
    useBrowseTalentProfilesQuery,
    useListTalentRequestsQuery,
    useLogTalentContactRequestMutation,
    useHireTalentToStaffMutation,
    useUpdateTenantTalentRequestMutation,
    useListSuperAdminTalentProfilesQuery,
    useCreateSuperAdminTalentProfileMutation,
    useUpdateSuperAdminTalentProfileMutation,
    useListSuperAdminTalentRequestsQuery,
    useGetSuperAdminTalentRequestQuery,
    useUpdateSuperAdminTalentRequestMutation,
} = talentApi;
