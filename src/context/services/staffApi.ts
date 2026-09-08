import type {
    AdminShiftDefinition,
    AdminShiftFloorResponse,
    AdminStaffListResponse,
} from "@/domains/identity/domain/staffApi";
import { api } from "./index";

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
                }
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
    }),
});

export const {
    useAdminStaffQuery,
    useAdminShiftFloorQuery,
    useCreateShiftDefinitionMutation,
    useUpdateShiftDefinitionMutation,
    useSetWaiterTableCoverageMutation,
} = staffApi;
