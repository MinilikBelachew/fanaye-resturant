export type ManagerForceClockOutRequest = {
    shiftSessionId: string;
    reason: string;
    reassignTablesToMembershipId?: string;
    closeOpenTables?: boolean;
    cashHandling?: "DROP_TO_SAFE" | "FLAG_AS_SHORTAGE" | "NONE";
    cashNotes?: string;
};

export type ManagerForceClockOutResponse = {
    success: boolean;
    message: string;
    shiftSessionId: string;
    staffName: string;
    clockOutAt: string;
    tablesTransferredCount: number;
    tablesClosedCount: number;
    cashHandledAmount: string;
    cashHandling: string;
};

export type ActiveShiftSummary = {
    shiftSessionId: string;
    staffMembershipId: string;
    staffName: string;
    roleCode?: string;
    roleName?: string;
    clockInAt: string;
    scheduledStartAt?: string | null;
    scheduledEndAt?: string | null;
    isExpired: boolean;
    lateByMinutes: number;
    openTablesCount: number;
    openTables: Array<{
        sessionTableId: string;
        tableId: string;
        tableName: string;
        locationName?: string;
        guestCount?: number | null;
        openedAt: string;
    }>;
    undroppedCash: string;
};

import type {
    ClockInRequest,
    ClockOutRequest,
    CreateShiftDefinitionRequest,
    CurrentShiftResponse,
    HandoverCandidate,
    ShiftDefinition,
    ShiftHandoverRequest,
    ShiftHandoverResponse,
    UpdateShiftDefinitionRequest,
    WaiterShiftHandoverRequest,
    WaiterShiftHandoverResponse,
} from "@/domains/identity/domain/shift";
import { api } from "./index";

export const shiftsApi = api.injectEndpoints({
    endpoints: builder => ({
        currentShift: builder.query<CurrentShiftResponse, void>({
            query: () => ({
                url: "/shifts/current",
                method: "GET",
            }),
            providesTags: ["Shift"],
        }),
        clockIn: builder.mutation<CurrentShiftResponse, ClockInRequest | void>({
            query: body => ({
                url: "/shifts/clock-in",
                method: "POST",
                body: body ?? {},
            }),
            invalidatesTags: ["Shift", "Auth"],
        }),
        clockOut: builder.mutation<CurrentShiftResponse, ClockOutRequest>({
            query: ({ shiftSessionId, expectedVersion }) => ({
                url: `/shifts/${shiftSessionId}/clock-out`,
                method: "POST",
                body: { expectedVersion },
            }),
            invalidatesTags: ["Shift", "Auth"],
        }),
        handoverCandidates: builder.query<HandoverCandidate[], void>({
            query: () => ({
                url: "/shifts/handover-candidates",
                method: "GET",
            }),
            providesTags: ["Shift"],
        }),
        handover: builder.mutation<ShiftHandoverResponse, ShiftHandoverRequest>(
            {
                query: body => ({
                    url: "/shifts/handover",
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["Shift", "Auth"],
            },
        ),
        waiterHandoverCandidates: builder.query<HandoverCandidate[], void>({
            query: () => ({
                url: "/shifts/waiter-handover-candidates",
                method: "GET",
            }),
            providesTags: ["Shift"],
        }),
        waiterHandover: builder.mutation<
            WaiterShiftHandoverResponse,
            WaiterShiftHandoverRequest
        >({
            query: body => ({
                url: "/shifts/waiter-handover",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Shift", "Auth", "Floor", "Cash", "Order"],
        }),
        shiftDefinitions: builder.query<{ data: ShiftDefinition[] }, void>({
            query: () => ({
                url: "/admin/shift-definitions",
                method: "GET",
            }),
            providesTags: ["Shift"],
        }),
        createShiftDefinition: builder.mutation<
            { data: ShiftDefinition },
            CreateShiftDefinitionRequest
        >({
            query: body => ({
                url: "/admin/shift-definitions",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Shift"],
        }),
        updateShiftDefinition: builder.mutation<
            { data: ShiftDefinition },
            { id: string } & UpdateShiftDefinitionRequest
        >({
            query: ({ id, ...body }) => ({
                url: `/admin/shift-definitions/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Shift"],
        }),
        managerActiveSessions: builder.query<ActiveShiftSummary[], void>({
            query: () => ({
                url: "/shifts/manager/active-sessions",
                method: "GET",
            }),
            providesTags: ["Shift"],
        }),
        managerForceClockOut: builder.mutation<
            ManagerForceClockOutResponse,
            ManagerForceClockOutRequest
        >({
            query: body => ({
                url: "/shifts/manager/force-clock-out",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Shift", "Floor", "Cash", "Order"],
        }),
        deleteShiftDefinition: builder.mutation<{ success: boolean }, string>({
            query: id => ({
                url: `/admin/shift-definitions/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Shift"],
        }),
    }),
    overrideExisting: true,
});

export const useCurrentShiftQuery = shiftsApi.useCurrentShiftQuery;
export const useClockInMutation = shiftsApi.useClockInMutation;
export const useClockOutMutation = shiftsApi.useClockOutMutation;
export const useHandoverCandidatesQuery = shiftsApi.useHandoverCandidatesQuery;
export const useHandoverMutation = shiftsApi.useHandoverMutation;
export const useWaiterHandoverCandidatesQuery =
    shiftsApi.useWaiterHandoverCandidatesQuery;
export const useWaiterHandoverMutation = shiftsApi.useWaiterHandoverMutation;
export const useShiftDefinitionsQuery = shiftsApi.useShiftDefinitionsQuery;
export const useCreateShiftDefinitionMutation =
    shiftsApi.useCreateShiftDefinitionMutation;
export const useUpdateShiftDefinitionMutation =
    shiftsApi.useUpdateShiftDefinitionMutation;
export const useManagerActiveSessionsQuery =
    shiftsApi.useManagerActiveSessionsQuery;
export const useManagerForceClockOutMutation =
    shiftsApi.useManagerForceClockOutMutation;
export const useDeleteShiftDefinitionMutation =
    shiftsApi.useDeleteShiftDefinitionMutation;
