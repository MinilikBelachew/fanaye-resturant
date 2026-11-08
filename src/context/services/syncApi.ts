import { api } from "./index";
import type { LoginResponse } from "@/domains/identity/domain/authContext";

export type SyncStatusResponse = {
    offlineSyncEnabled: boolean;
    cloudSyncUrl: string;
    tenantId: string;
    cloudReachable: boolean;
    lastSyncedAt: string | null;
    pendingOrdersCount: number;
    pendingBillsCount: number;
    localServerIp?: string;
    availableIps?: { name: string; ip: string }[];
};

export type PullFromCloudRequest = {
    cloudUrl: string;
    tenantId: string;
    token?: string;
    downloadImages?: boolean;
};

export type PullFromCloudResponse = {
    success: boolean;
    message: string;
    tenantId: string;
    tenantName: string;
    statementsExecuted: number;
    imagesCachedCount: number;
    syncedAt: string;
};

export type FirstTimeSetupRequest = {
    cloudUrl: string;
    email: string;
    password: string;
    downloadImages?: boolean;
};

export type SyncConfigUpdateRequest = {
    cloudSyncUrl?: string;
    tenantId?: string;
    cloudSyncToken?: string;
    offlineSyncEnabled?: boolean;
};

export const syncApi = api.injectEndpoints({
    endpoints: build => ({
        getSyncStatus: build.query<SyncStatusResponse, void>({
            query: () => "/sync/status",
            providesTags: ["Sync"],
        }),
        firstTimeSetup: build.mutation<LoginResponse, FirstTimeSetupRequest>({
            query: body => ({
                url: "/sync/first-time-setup",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Sync", "Auth"],
        }),
        pullAllFromCloud: build.mutation<
            PullFromCloudResponse,
            PullFromCloudRequest
        >({
            query: body => ({
                url: "/sync/pull-all",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Sync"],
        }),
        triggerSyncNow: build.mutation<
            { status: string; message: string },
            void
        >({
            query: () => ({
                url: "/sync/trigger-now",
                method: "POST",
            }),
            invalidatesTags: ["Sync"],
        }),
        updateSyncConfig: build.mutation<
            SyncStatusResponse,
            SyncConfigUpdateRequest
        >({
            query: body => ({
                url: "/sync/configure",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Sync"],
        }),
    }),
    overrideExisting: true,
});

export const {
    useGetSyncStatusQuery,
    useFirstTimeSetupMutation,
    usePullAllFromCloudMutation,
    useTriggerSyncNowMutation,
    useUpdateSyncConfigMutation,
} = syncApi;
