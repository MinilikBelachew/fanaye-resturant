import { api } from "./index";

export type BackupInterval = "DAILY" | "TWICE_DAILY" | "WEEKLY" | "MANUAL";

export type GlobalBackupSettings = {
    interval: BackupInterval;
    enabled: boolean;
    sendHour: number;
};

export type OwnerBackupStatus = {
    tenantId: string;
    tenantName: string;
    telegramLinked: boolean;
    telegramChatId?: string;
    telegramUsername?: string;
    deepLinkUrl: string;
    botUsername: string;
    lastBackupAt?: string;
    lastBackupStatus: "SUCCESS" | "FAILED" | "NEVER";
    lastBackupSizeKb?: number;
    lastBackupRowsCount?: number;
    globalInterval: BackupInterval;
};

export type TenantBackupSummary = {
    tenantId: string;
    tenantName: string;
    telegramLinked: boolean;
    telegramChatId?: string;
    telegramUsername?: string;
    lastBackupAt?: string;
    lastBackupStatus: "SUCCESS" | "FAILED" | "NEVER";
    lastBackupSizeKb?: number;
    lastBackupBillsCount?: number;
};

export type BackupTableSummary = {
    tableName: string;
    recordsCount: number;
};

export type BackupPreviewResponse = {
    valid: boolean;
    tenantId: string;
    tenantName: string;
    exportedAt: string;
    fileSizeKb: number;
    tables: BackupTableSummary[];
    totalRecords: number;
    totalStatements: number;
    isTenantMatch: boolean;
};

export type SuperAdminBackupOverview = {
    globalSettings: GlobalBackupSettings;
    botUsername: string;
    totalTenants: number;
    linkedTenants: number;
    tenants: TenantBackupSummary[];
};

export const backupApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        // Owner Endpoints
        getOwnerBackupStatus: builder.query<OwnerBackupStatus, void>({
            query: () => "/backup/my-status",
            providesTags: ["Backup"],
        }),
        sendBackupToMyTelegram: builder.mutation<
            { success: boolean; filename: string; sizeKb: number },
            void
        >({
            query: () => ({
                url: "/backup/my-telegram/send-now",
                method: "POST",
            }),
            invalidatesTags: ["Backup"],
        }),
        unlinkMyTelegram: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: "/backup/my-telegram/unlink",
                method: "DELETE",
            }),
            invalidatesTags: ["Backup"],
        }),
        previewBackup: builder.mutation<BackupPreviewResponse, FormData>({
            query: formData => ({
                url: "/backup/preview",
                method: "POST",
                body: formData,
            }),
        }),
        restoreMyBackup: builder.mutation<
            {
                tenantId: string;
                tenantName: string;
                statementsCount: number;
                success: boolean;
            },
            FormData
        >({
            query: formData => ({
                url: "/backup/restore",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Backup", "Menu", "Branches"],
        }),

        // Super Admin Endpoints
        getSuperAdminBackupOverview: builder.query<
            SuperAdminBackupOverview,
            void
        >({
            query: () => "/backup/super-admin/overview",
            providesTags: ["Backup"],
        }),
        updateGlobalBackupSettings: builder.mutation<
            { success: boolean; settings: GlobalBackupSettings },
            GlobalBackupSettings
        >({
            query: body => ({
                url: "/backup/super-admin/settings",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Backup"],
        }),
        triggerBackupAllTenants: builder.mutation<
            {
                totalTenants: number;
                sentCount: number;
                failedCount: number;
                results: any[];
            },
            void
        >({
            query: () => ({
                url: "/backup/super-admin/trigger-all",
                method: "POST",
            }),
            invalidatesTags: ["Backup"],
        }),
        sendBackupToTenantTelegram: builder.mutation<
            { success: boolean },
            string
        >({
            query: tenantId => ({
                url: `/backup/super-admin/send/${tenantId}`,
                method: "POST",
            }),
            invalidatesTags: ["Backup"],
        }),
    }),
});

export const {
    useGetOwnerBackupStatusQuery,
    useSendBackupToMyTelegramMutation,
    useUnlinkMyTelegramMutation,
    usePreviewBackupMutation,
    useRestoreMyBackupMutation,
    useGetSuperAdminBackupOverviewQuery,
    useUpdateGlobalBackupSettingsMutation,
    useTriggerBackupAllTenantsMutation,
    useSendBackupToTenantTelegramMutation,
} = backupApi;
