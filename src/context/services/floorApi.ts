import type {
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

export const floorApi = api.injectEndpoints({
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
                displayNumber?: string;
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
            { tableId: string; guestCount?: number }
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
    }),
});

export const {
    useFloorTablesQuery,
    useAdminFloorLayoutQuery,
    useCreateTableLocationMutation,
    useUpdateTableLocationMutation,
    useDeleteTableLocationMutation,
    useCreateDiningTableMutation,
    useUpdateDiningTableMutation,
    useDeleteDiningTableMutation,
    useWaiterTablesQuery,
    useTableSessionQuery,
    useStartTableSessionMutation,
    useCloseTableSessionMutation,
} = floorApi;
