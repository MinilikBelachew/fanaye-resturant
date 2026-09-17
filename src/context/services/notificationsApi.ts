import type { OpsNotification } from "@/domains/notifications/domain/opsNotification";
import { api } from "./index";

type InboxRow = {
    id: string;
    type: string;
    severity: string;
    title: string;
    body: string | null;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    payload: Record<string, unknown> | null;
    createdAt: string;
    readAt: string | null;
    acknowledgedAt: string | null;
};

export type NotificationsPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type NotificationsListResponse = {
    data: OpsNotification[];
    pagination: NotificationsPagination;
    unreadCount: number;
};

function mapRow(row: InboxRow): OpsNotification {
    return {
        id: row.id,
        type: row.type,
        tenantId: "",
        branchId: "",
        severity: (row.severity as OpsNotification["severity"]) || "INFO",
        title: row.title,
        body: row.body,
        relatedEntityType: row.relatedEntityType,
        relatedEntityId: row.relatedEntityId,
        payload: row.payload,
        createdAt: row.createdAt,
        recipientMembershipId: null,
        readAt: row.readAt,
    };
}

export const notificationsApi = api.injectEndpoints({
    endpoints: builder => ({
        listNotifications: builder.query<
            NotificationsListResponse,
            { unreadOnly?: boolean; page?: number; limit?: number } | void
        >({
            query: params => {
                const search = new URLSearchParams();
                if (params?.unreadOnly) search.set("unreadOnly", "true");
                search.set("page", String(params?.page ?? 1));
                search.set("limit", String(params?.limit ?? 20));
                return {
                    url: `/notifications?${search.toString()}`,
                    method: "GET",
                };
            },
            transformResponse: (response: {
                data: InboxRow[];
                pagination?: NotificationsPagination;
                unreadCount?: number;
            }) => ({
                data: (response.data ?? []).map(mapRow),
                pagination: response.pagination ?? {
                    page: 1,
                    limit: 20,
                    total: response.data?.length ?? 0,
                    totalPages: 1,
                },
                unreadCount: response.unreadCount ?? 0,
            }),
            providesTags: ["Notifications"],
        }),
        markNotificationRead: builder.mutation<{ success: boolean }, string>({
            query: id => ({
                url: `/notifications/${id}/read`,
                method: "PATCH",
            }),
            invalidatesTags: ["Notifications"],
        }),
        markAllNotificationsRead: builder.mutation<
            { success: boolean; count: number },
            void
        >({
            query: () => ({
                url: "/notifications/read-all",
                method: "PATCH",
            }),
            invalidatesTags: ["Notifications"],
        }),
    }),
});

export const {
    useListNotificationsQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
} = notificationsApi;
