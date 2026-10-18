import { api } from "./index";

export type HrAttendanceRow = {
    id: string;
    businessDate: string;
    staffMembershipId: string;
    staffName: string;
    jobTitle: string | null;
    branchId: string;
    branchName: string;
    roleLabel: string | null;
    clockInAt: string;
    clockOutAt: string | null;
    lateByMinutes: number;
    hoursWorked: number | null;
    state: string;
};

export type HrLeaveType = {
    id: string;
    name: string;
    tracksBalance: boolean;
    defaultDays: number;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
};

export type HrLeaveBalance = {
    leaveTypeId: string;
    leaveTypeName: string;
    tracksBalance: boolean;
    defaultDays?: number;
    entitlementDays?: number;
    overrideDays?: number | null;
    balanceDays: number;
    usedDays?: number;
};

export type HrLeaveRow = {
    id: string;
    leaveTypeId: string | null;
    leaveType: string;
    tracksBalance?: boolean;
    startDate: string;
    endDate: string;
    days: number;
    reason: string | null;
    status: string;
    decidedAt: string | null;
    decisionNote: string | null;
    createdAt: string;
    staffMembershipId: string;
    staffName: string;
    annualLeaveBalanceDays: number;
    branchId: string;
    branchName: string;
    decidedByName: string | null;
};

export type HrListParams = {
    from?: string;
    to?: string;
    branchId?: string;
    membershipId?: string;
    status?: string;
};

export const hrApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        listHrAttendance: builder.query<
            { data: HrAttendanceRow[] },
            HrListParams | void
        >({
            query: params => ({
                url: "/admin/hr/attendance",
                params: params ?? undefined,
            }),
            providesTags: ["Floor"],
        }),
        listLeaveTypes: builder.query<{ data: HrLeaveType[] }, void>({
            query: () => ({ url: "/admin/hr/leave-types" }),
            providesTags: ["Floor"],
        }),
        createLeaveType: builder.mutation<
            { data: HrLeaveType },
            {
                name: string;
                defaultDays?: number;
                tracksBalance?: boolean;
                sortOrder?: number;
            }
        >({
            query: body => ({
                url: "/admin/hr/leave-types",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        updateLeaveType: builder.mutation<
            { data: HrLeaveType },
            {
                id: string;
                name?: string;
                defaultDays?: number;
                tracksBalance?: boolean;
                isActive?: boolean;
                sortOrder?: number;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/admin/hr/leave-types/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        deleteLeaveType: builder.mutation<
            {
                data: { id: string } | HrLeaveType;
                deleted?: boolean;
                deactivated?: boolean;
            },
            { id: string }
        >({
            query: ({ id }) => ({
                url: `/admin/hr/leave-types/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Floor"],
        }),
        listStaffLeaveBalances: builder.query<
            { data: HrLeaveBalance[] },
            string
        >({
            query: membershipId => ({
                url: `/admin/hr/leave-balances/${membershipId}`,
            }),
            providesTags: (_r, _e, membershipId) => [
                { type: "Floor", id: `leave-bal-${membershipId}` },
                "Floor",
            ],
        }),
        setStaffLeaveOverrides: builder.mutation<
            { data: HrLeaveBalance[] },
            {
                membershipId: string;
                overrides: {
                    leaveTypeId: string;
                    entitlementDays?: number | null;
                }[];
            }
        >({
            query: body => ({
                url: "/admin/hr/leave-overrides",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        listHrLeave: builder.query<{ data: HrLeaveRow[] }, HrListParams | void>(
            {
                query: params => ({
                    url: "/admin/hr/leave",
                    params: params ?? undefined,
                }),
                providesTags: ["Floor"],
            },
        ),
        createHrLeave: builder.mutation<
            { data: HrLeaveRow },
            {
                leaveTypeId: string;
                membershipId?: string;
                startDate: string;
                endDate: string;
                reason?: string;
                branchId?: string;
            }
        >({
            query: body => ({
                url: "/admin/hr/leave",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        decideHrLeave: builder.mutation<
            { data: HrLeaveRow },
            {
                id: string;
                status: "APPROVED" | "REJECTED";
                decisionNote?: string;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/admin/hr/leave/${id}/decide`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        listMyLeave: builder.query<
            {
                data: {
                    leaveTypes: HrLeaveType[];
                    balances: HrLeaveBalance[];
                    defaultLeaveTypeId: string | null;
                    annualLeaveBalanceDays: number;
                    requests: HrLeaveRow[];
                };
            },
            void
        >({
            query: () => ({ url: "/me/hr/leave" }),
            providesTags: ["Floor"],
        }),
        requestMyLeave: builder.mutation<
            { data: HrLeaveRow },
            {
                leaveTypeId: string;
                startDate: string;
                endDate: string;
                reason?: string;
            }
        >({
            query: body => ({
                url: "/me/hr/leave",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        cancelMyLeave: builder.mutation<{ data: HrLeaveRow }, { id: string }>({
            query: ({ id }) => ({
                url: `/me/hr/leave/${id}/cancel`,
                method: "PATCH",
            }),
            invalidatesTags: ["Floor"],
        }),
    }),
});

export const {
    useListHrAttendanceQuery,
    useListLeaveTypesQuery,
    useCreateLeaveTypeMutation,
    useUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,
    useListStaffLeaveBalancesQuery,
    useSetStaffLeaveOverridesMutation,
    useListHrLeaveQuery,
    useCreateHrLeaveMutation,
    useDecideHrLeaveMutation,
    useListMyLeaveQuery,
    useRequestMyLeaveMutation,
    useCancelMyLeaveMutation,
} = hrApi;
