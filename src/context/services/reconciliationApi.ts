import type {
    Reconciliation,
    ReconciliationPreview,
} from "@/domains/cash/domain/reconciliationApi";
import { api } from "./index";

function idempotencyKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const reconciliationApi = api.injectEndpoints({
    endpoints: builder => ({
        reconciliationPreview: builder.query<
            { data: ReconciliationPreview },
            { from?: string; to?: string } | void
        >({
            query: args => ({
                url: "/cashier/reconciliation/preview",
                method: "GET",
                params: {
                    ...(args && (args as { from?: string }).from
                        ? { from: (args as { from?: string }).from }
                        : {}),
                    ...(args && (args as { to?: string }).to
                        ? { to: (args as { to?: string }).to }
                        : {}),
                },
            }),
            providesTags: ["Reconciliation"],
        }),
        submitReconciliation: builder.mutation<
            { data: Reconciliation },
            {
                cashierFinancialSessionId: string;
                countedCash: string;
                comment?: string;
            }
        >({
            query: body => ({
                url: "/cashier/reconciliations",
                method: "POST",
                body,
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["Reconciliation", "DailyClose", "Cash"],
        }),
        pendingReconciliations: builder.query<{ data: Reconciliation[] }, void>(
            {
                query: () => ({
                    url: "/approvals/reconciliations",
                    method: "GET",
                }),
                providesTags: ["Reconciliation"],
            },
        ),
        approveReconciliation: builder.mutation<
            { data: Reconciliation },
            { reconciliationId: string; reviewComment?: string }
        >({
            query: ({ reconciliationId, reviewComment }) => ({
                url: `/reconciliations/${reconciliationId}/approve`,
                method: "POST",
                body: { reviewComment },
            }),
            invalidatesTags: ["Reconciliation", "DailyClose"],
        }),
        flagReconciliation: builder.mutation<
            { data: Reconciliation },
            { reconciliationId: string; reviewComment?: string }
        >({
            query: ({ reconciliationId, reviewComment }) => ({
                url: `/reconciliations/${reconciliationId}/flag`,
                method: "POST",
                body: { reviewComment },
            }),
            invalidatesTags: ["Reconciliation", "DailyClose"],
        }),
    }),
});

export const {
    useReconciliationPreviewQuery,
    useSubmitReconciliationMutation,
    usePendingReconciliationsQuery,
    useApproveReconciliationMutation,
    useFlagReconciliationMutation,
} = reconciliationApi;
