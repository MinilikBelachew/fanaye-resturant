import type {
    ClockInRequest,
    ClockOutRequest,
    CurrentShiftResponse,
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
    }),
});

export const {
    useCurrentShiftQuery,
    useClockInMutation,
    useClockOutMutation,
} = shiftsApi;
