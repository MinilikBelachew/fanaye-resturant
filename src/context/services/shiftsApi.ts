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
export const useDeleteShiftDefinitionMutation =
    shiftsApi.useDeleteShiftDefinitionMutation;
