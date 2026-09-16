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
    stationCode?: string;
    preparationStationId?: string;
    shiftDefinitionId?: string;
    tableIds?: string[];
};

export type UpdateAdminStaffBody = {
    name?: string;
    role?: string;
    phone?: string;
    email?: string;
    pin?: string;
    active?: boolean;
    stationCode?: string;
    preparationStationId?: string;
};

export const staffApi = api.injectEndpoints({
    endpoints: builder => ({
        adminStaff: builder.query<AdminStaffListResponse, void>({
            query: () => ({
                url: "/admin/staff",
                method: "GET",
            }),
            providesTags: ["Floor"],
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

export const {
    useAdminStaffQuery,
    useAdminShiftFloorQuery,
    useCreateAdminStaffMutation,
    useUpdateAdminStaffMutation,
    useCreateShiftDefinitionMutation,
    useUpdateShiftDefinitionMutation,
    useSetWaiterTableCoverageMutation,
    useResetAdminStaffPinMutation,
    useResetAdminStaffPasswordMutation,
} = staffApi;
