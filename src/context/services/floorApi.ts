import type {
    DispatcherBoardResponse,
    FloorTablesResponse,
    TableSessionResponse,
    WaiterTableView,
} from "@/domains/floor/domain/floorApi";
import type {
    AdminDiningTable,
    AdminFloorLayoutResponse,
    AdminTableLocation,
} from "@/domains/floor/domain/floorLayoutApi";
import { api } from "./index";

function idempotencyKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type TableKpiPeriod = {
    period: string;
    periodLabel: string;
    turns: number;
    revenue: number;
    avgTicket: number;
    covers: number;
    currencyCode: string;
};

export type TableLiveVisit = {
    tableSessionId: string;
    sessionStatus: string;
    guestCount?: number | null;
    openedAt: string;
    waiterName?: string | null;
    waiterMembershipId?: string | null;
    cookingItemCount: number;
    readyItemCount: number;
    delayedItemCount: number;
    openItemCount: number;
    billTotal?: number | null;
    amountPaid?: number | null;
    billStatus?: string | null;
    billNumber?: string | null;
};

export type TableDetailResponse = {
    id: string;
    displayName: string;
    displayNumber?: string | null;
    locationId: string;
    locationName: string;
    status: string;
    tableStatus: string;
    assignedWaiterMembershipId?: string | null;
    assignedWaiterName?: string | null;
    qrRelativeUrl?: string | null;
    qrSlug?: string | null;
    live?: TableLiveVisit | null;
    kpisToday: TableKpiPeriod;
    kpisWeek: TableKpiPeriod;
    version: number;
};

export type TableVisitHistoryPeriod = "today" | "week" | "month" | "custom";

export type TableVisitHistoryParams = {
    tableId: string;
    q?: string;
    period?: TableVisitHistoryPeriod;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
};

export type TableVisitHistoryItem = {
    tableSessionId: string;
    status: string;
    businessDate: string;
    openedAt: string;
    closedAt?: string | null;
    guestCount?: number | null;
    waiterName?: string | null;
    billNumber?: string | null;
    billStatus?: string | null;
    revenue: number;
    amountPaid: number;
    currencyCode: string;
    orderCount: number;
    itemCount: number;
    durationMinutes?: number | null;
};

export type TableVisitHistoryResponse = {
    tableId: string;
    period: string;
    periodLabel: string;
    data: TableVisitHistoryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export const floorApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        floorTables: builder.query<FloorTablesResponse, void>({
            query: () => ({
                url: "/floor/tables",
                method: "GET",
            }),
            providesTags: ["Floor"],
        }),
        adminFloorLayout: builder.query<AdminFloorLayoutResponse, void>({
            query: () => ({
                url: "/admin/floor-layout",
                method: "GET",
            }),
            providesTags: ["Floor"],
        }),
        createTableLocation: builder.mutation<
            { data: AdminTableLocation },
            { name: string; code?: string }
        >({
            query: body => ({
                url: "/admin/table-locations",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        updateTableLocation: builder.mutation<
            { data: AdminTableLocation },
            { id: string; body: { name?: string; code?: string } }
        >({
            query: ({ id, body }) => ({
                url: `/admin/table-locations/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        createDiningTable: builder.mutation<
            { data: AdminDiningTable },
            {
                locationId: string;
                displayName: string;
                displayNumber: string;
                assignedWaiterMembershipId?: string | null;
            }
        >({
            query: body => ({
                url: "/admin/dining-tables",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        updateDiningTable: builder.mutation<
            { data: AdminDiningTable },
            {
                id: string;
                body: {
                    locationId?: string;
                    displayName?: string;
                    displayNumber?: string;
                    assignedWaiterMembershipId?: string | null;
                };
            }
        >({
            query: ({ id, body }) => ({
                url: `/admin/dining-tables/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        deleteTableLocation: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: id => ({
                url: `/admin/table-locations/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Floor"],
        }),
        deleteDiningTable: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: id => ({
                url: `/admin/dining-tables/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Floor"],
        }),
        tableDetail: builder.query<TableDetailResponse, string>({
            query: tableId => ({
                url: `/admin/dining-tables/${tableId}/detail`,
                method: "GET",
            }),
            providesTags: (_result, _error, tableId) => [
                { type: "Floor", id: `${tableId}-detail` },
                "Floor",
            ],
        }),
        tableVisitHistory: builder.query<
            TableVisitHistoryResponse,
            TableVisitHistoryParams
        >({
            query: ({ tableId, ...params }) => ({
                url: `/admin/dining-tables/${tableId}/sessions`,
                method: "GET",
                params: {
                    ...(params.q ? { q: params.q } : {}),
                    ...(params.period ? { period: params.period } : {}),
                    ...(params.fromDate ? { fromDate: params.fromDate } : {}),
                    ...(params.toDate ? { toDate: params.toDate } : {}),
                    ...(params.page ? { page: params.page } : {}),
                    ...(params.limit ? { limit: params.limit } : {}),
                },
            }),
            providesTags: (_result, _error, { tableId }) => [
                { type: "Floor", id: `${tableId}-sessions` },
                "Floor",
            ],
        }),
        waiterTables: builder.query<
            FloorTablesResponse,
            WaiterTableView | void
        >({
            query: view => ({
                url: "/waiter/tables",
                method: "GET",
                params: { view: view ?? "all" },
            }),
            providesTags: ["Floor"],
        }),
        tableSession: builder.query<TableSessionResponse, string>({
            query: id => ({
                url: `/table-sessions/${id}`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [{ type: "Floor", id }],
        }),
        startTableSession: builder.mutation<
            TableSessionResponse,
            {
                tableId: string;
                guestCount?: number;
                sessionKind?: "DINE_IN" | "CALL_PICKUP";
                customerName?: string;
                customerPhone?: string;
            }
        >({
            query: body => ({
                url: "/table-sessions",
                method: "POST",
                body,
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["Floor", "Shift"],
        }),
        closeTableSession: builder.mutation<
            TableSessionResponse,
            { tableSessionId: string; expectedVersion: number }
        >({
            query: ({ tableSessionId, expectedVersion }) => ({
                url: `/table-sessions/${tableSessionId}/close`,
                method: "POST",
                body: { expectedVersion },
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["Floor", "Shift"],
        }),
        dispatcherCalls: builder.query<DispatcherBoardResponse, void>({
            query: () => ({
                url: "/dispatcher/calls",
                method: "GET",
            }),
            providesTags: ["Floor"],
        }),
        openCallPickup: builder.mutation<
            TableSessionResponse,
            { customerName: string; customerPhone?: string }
        >({
            query: body => ({
                url: "/dispatcher/calls",
                method: "POST",
                body,
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["Floor", "Shift"],
        }),
    }),
});

export const useFloorTablesQuery = floorApi.useFloorTablesQuery;
export const useAdminFloorLayoutQuery = floorApi.useAdminFloorLayoutQuery;
export const useCreateTableLocationMutation =
    floorApi.useCreateTableLocationMutation;
export const useUpdateTableLocationMutation =
    floorApi.useUpdateTableLocationMutation;
export const useDeleteTableLocationMutation =
    floorApi.useDeleteTableLocationMutation;
export const useCreateDiningTableMutation =
    floorApi.useCreateDiningTableMutation;
export const useUpdateDiningTableMutation =
    floorApi.useUpdateDiningTableMutation;
export const useDeleteDiningTableMutation =
    floorApi.useDeleteDiningTableMutation;
export const useTableDetailQuery = floorApi.useTableDetailQuery;
export const useTableVisitHistoryQuery = floorApi.useTableVisitHistoryQuery;
export const useWaiterTablesQuery = floorApi.useWaiterTablesQuery;
export const useTableSessionQuery = floorApi.useTableSessionQuery;
export const useStartTableSessionMutation =
    floorApi.useStartTableSessionMutation;
export const useCloseTableSessionMutation =
    floorApi.useCloseTableSessionMutation;
export const useDispatcherCallsQuery = floorApi.useDispatcherCallsQuery;
export const useOpenCallPickupMutation = floorApi.useOpenCallPickupMutation;
