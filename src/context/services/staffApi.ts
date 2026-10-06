import type {
    AdminShiftDefinition,
    AdminShiftFloorResponse,
    AdminStaffListResponse,
    AdminStaffMember,
} from "@/domains/identity/domain/staffApi";
import { api } from "./index";

export type CreateAdminStaffBody = {
    name: string;
    role: string;
    phone?: string;
    email?: string;
    pin?: string;
    active?: boolean;
    workingDays?: string[];
    stationCode?: string;
    preparationStationId?: string;
    shiftDefinitionId?: string;
    tableIds?: string[];
    /** Owner: create into a specific branch */
    branchId?: string;
};

export type AdminStaffQueryArg = {
    scope?: "branch" | "all";
    branchId?: string;
};

export type UpdateAdminStaffBody = {
    name?: string;
    role?: string;
    phone?: string;
    email?: string;
    pin?: string;
    active?: boolean;
    workingDays?: string[];
    stationCode?: string;
    preparationStationId?: string;
};

export type AdminStaffDetail = AdminStaffMember & {
    joinedAt?: string | null;
    createdAt?: string | null;
    tablesCoveredCount?: number;
    shiftsCoveredCount?: number;
};

export const staffApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        listAdminStaff: builder.query<
            AdminStaffListResponse,
            AdminStaffQueryArg | void
        >({
            query: arg => {
                const scope =
                    arg && typeof arg === "object" ? arg.scope : undefined;
                const branchId =
                    arg && typeof arg === "object" ? arg.branchId : undefined;
                return {
                    url: "/admin/staff",
                    method: "GET",
                    params: {
                        ...(scope ? { scope } : {}),
                        ...(branchId ? { branchId } : {}),
                        _sv: "2",
                    },
                };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const scope =
                    queryArgs && typeof queryArgs === "object"
                        ? (queryArgs.scope ?? "")
                        : "";
                const branchId =
                    queryArgs && typeof queryArgs === "object"
                        ? (queryArgs.branchId ?? "")
                        : "";
                return `${endpointName}|${scope}|${branchId}`;
            },
            forceRefetch({ currentArg, previousArg }) {
                return (
                    JSON.stringify(currentArg ?? null) !==
                    JSON.stringify(previousArg ?? null)
                );
            },
            providesTags: ["Floor"],
        }),
        adminStaffDetail: builder.query<{ data: AdminStaffDetail }, string>({
            query: membershipId => ({
                url: `/admin/staff/${membershipId}/detail`,
                method: "GET",
            }),
            providesTags: (_result, _error, membershipId) => [
                { type: "Floor", id: `staff-${membershipId}` },
                "Floor",
            ],
        }),
        adminShiftFloor: builder.query<AdminShiftFloorResponse, string>({
            query: shiftDefinitionId => ({
                url: `/admin/shift-definitions/${shiftDefinitionId}/floor`,
                method: "GET",
            }),
            providesTags: ["Floor"],
        }),
        createAdminStaff: builder.mutation<
            { data: AdminStaffMember },
            CreateAdminStaffBody
        >({
            query: body => ({
                url: "/admin/staff",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        updateAdminStaff: builder.mutation<
            { data: AdminStaffMember },
            { membershipId: string; body: UpdateAdminStaffBody }
        >({
            query: ({ membershipId, body }) => ({
                url: `/admin/staff/${membershipId}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        createShiftDefinition: builder.mutation<
            { data: AdminShiftDefinition },
            {
                name: string;
                startLocalTime: string;
                endLocalTime: string;
                graceMinutes?: number;
            }
        >({
            query: body => ({
                url: "/admin/shift-definitions",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        updateShiftDefinition: builder.mutation<
            { data: AdminShiftDefinition },
            {
                id: string;
                body: {
                    name?: string;
                    startLocalTime?: string;
                    endLocalTime?: string;
                };
            }
        >({
            query: ({ id, body }) => ({
                url: `/admin/shift-definitions/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        setWaiterTableCoverage: builder.mutation<
            {
                waiterMembershipId: string;
                shiftDefinitionId: string;
                tableIds: string[];
            },
            {
                membershipId: string;
                shiftDefinitionId: string;
                tableIds: string[];
            }
        >({
            query: ({ membershipId, shiftDefinitionId, tableIds }) => ({
                url: `/admin/staff/${membershipId}/table-coverage`,
                method: "PUT",
                body: { shiftDefinitionId, tableIds },
            }),
            invalidatesTags: ["Floor"],
        }),
        resetAdminStaffPin: builder.mutation<
            { success: boolean; message: string },
            { membershipId: string; pin: string }
        >({
            query: ({ membershipId, pin }) => ({
                url: `/admin/staff/${membershipId}/reset-pin`,
                method: "POST",
                body: { pin },
            }),
            invalidatesTags: ["Floor"],
        }),
        resetAdminStaffPassword: builder.mutation<
            { success: boolean; message: string },
            { membershipId: string; password: string }
        >({
            query: ({ membershipId, password }) => ({
                url: `/admin/staff/${membershipId}/reset-password`,
                method: "POST",
                body: { password },
            }),
            invalidatesTags: ["Floor"],
        }),
    }),
});

export const useAdminStaffQuery = staffApi.useListAdminStaffQuery;
export const useListAdminStaffQuery = staffApi.useListAdminStaffQuery;
export const useAdminStaffDetailQuery = staffApi.useAdminStaffDetailQuery;
export const useAdminShiftFloorQuery = staffApi.useAdminShiftFloorQuery;
export const useCreateAdminStaffMutation = staffApi.useCreateAdminStaffMutation;
export const useUpdateAdminStaffMutation = staffApi.useUpdateAdminStaffMutation;
export const useCreateShiftDefinitionMutation =
    staffApi.useCreateShiftDefinitionMutation;
export const useUpdateShiftDefinitionMutation =
    staffApi.useUpdateShiftDefinitionMutation;
export const useSetWaiterTableCoverageMutation =
    staffApi.useSetWaiterTableCoverageMutation;
export const useResetAdminStaffPinMutation =
    staffApi.useResetAdminStaffPinMutation;
export const useResetAdminStaffPasswordMutation =
    staffApi.useResetAdminStaffPasswordMutation;
