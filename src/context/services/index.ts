import {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
    createApi,
    fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/context/env";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState, endpoint }) => {
        const token = (
            getState() as {
                identity?: { accessToken?: string | null };
            }
        ).identity?.accessToken;
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        if (endpoint !== "uploadReceipt" && endpoint !== "uploadMenuImage") {
            headers.set("Content-Type", "application/json");
        }
        return headers;
    },
});

function isAuthPath(args: string | FetchArgs, suffix: string) {
    const url = typeof args === "string" ? args : args.url;
    return url.includes(suffix);
}

let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);
    const skipRefresh =
        isAuthPath(args, "/auth/login") ||
        isAuthPath(args, "/auth/email/login") ||
        isAuthPath(args, "/auth/refresh") ||
        isAuthPath(args, "/auth/logout");

    if (result.error?.status !== 401 || skipRefresh) {
        return result;
    }

    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refreshResult = await rawBaseQuery(
                { url: "/auth/refresh", method: "POST", body: {} },
                api,
                extraOptions,
            );
            if (
                refreshResult.data &&
                typeof refreshResult.data === "object" &&
                "token" in refreshResult.data
            ) {
                const data = refreshResult.data as {
                    token: string;
                    tokenExpires: number;
                };
                const { setAccessToken } = await import(
                    "@/context/slices/identitySlice"
                );
                api.dispatch(
                    setAccessToken({
                        token: data.token,
                        tokenExpires: data.tokenExpires,
                    }),
                );
                return true;
            }

            const { clearSession } = await import(
                "@/context/slices/identitySlice"
            );
            api.dispatch(clearSession());
            return false;
        })().finally(() => {
            refreshPromise = null;
        });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
    }
    return result;
};

export const api = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        "Auth",
        "Shift",
        "Floor",
        "Menu",
        "Order",
        "Station",
        "Bill",
        "Cash",
        "Reconciliation",
        "DailyClose",
        "Approvals",
    ],
    endpoints: () => ({}),
});
