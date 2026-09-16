import { api } from "./index";

export type AuditCategory = "orders" | "fulfillment" | "payments" | "system";

export interface AuditEventRow {
    id: string;
    occurredAt: string;
    timestampLabel: string;
    actorName: string;
    actorRole: string;
    action: string;
    actionLabel: string;
    category: AuditCategory;
    badgeLabel: string;
    badgeVariant: "default" | "success" | "warning" | "secondary";
    details?: string | null;
    entityType: string;
    entityId?: string | null;
}

export interface AuditSummary {
    totalToday: number;
    fulfillmentToday: number;
    paymentToday: number;
    orderToday: number;
    systemToday: number;
}

export interface AuditPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface AuditListResponse {
    data: AuditEventRow[];
    summary: AuditSummary;
    pagination?: AuditPagination;
}

export interface ListAuditParams {
    category?: string;
    q?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
    startDate?: string;
    endDate?: string;
}

export const auditApi = api.injectEndpoints({
    endpoints: builder => ({
        listAuditEvents: builder.query<
            AuditListResponse,
            ListAuditParams | void
        >({
            query: params => ({
                url: "/audit/events",
                method: "GET",
                params: params || undefined,
            }),
            providesTags: ["Audit"],
        }),
    }),
});

export const { useListAuditEventsQuery } = auditApi;
