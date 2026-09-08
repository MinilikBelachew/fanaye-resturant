import type { AuthMeResponse, LoginResponse } from "@/domains/identity/domain/authContext";
import { loginErrorMessage } from "@/domains/identity/infrastructure/authSession";
import { api } from "./index";

export const authApi = api.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation<
            LoginResponse,
            { identifier: string; password: string; remember?: boolean }
        >({
            query: ({ identifier, password, remember = true }) => ({
                url: "/auth/login",
                method: "POST",
                body: { identifier, password, remember },
            }),
            transformErrorResponse: response => ({
                status: response.status,
                message: loginErrorMessage(response.data),
            }),
        }),
        refresh: builder.mutation<
            { token: string; tokenExpires: number },
            void
        >({
            query: () => ({
                url: "/auth/refresh",
                method: "POST",
                body: {},
            }),
        }),
        me: builder.query<AuthMeResponse, void>({
            query: () => ({
                url: "/auth/me",
                method: "GET",
            }),
            providesTags: ["Auth"],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            invalidatesTags: ["Auth", "Shift"],
        }),
    }),
});

export const {
    useLoginMutation,
    useMeQuery,
    useLogoutMutation,
    useRefreshMutation,
} = authApi;
