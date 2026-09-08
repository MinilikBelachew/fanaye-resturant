import type {
    CashDrop,
    WaiterCashSummary,
} from "@/domains/cash/domain/cashApi";
import { api } from "./index";

function idempotencyKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const cashApi = api.injectEndpoints({
    endpoints: builder => ({
        waiterCashSummary: builder.query<WaiterCashSummary, void>({
            query: () => ({
                url: "/waiter/cash-summary",
                method: "GET",
            }),
            providesTags: ["Cash"],
        }),
        waiterCashDrops: builder.query<{ data: CashDrop[] }, void>({
            query: () => ({
                url: "/waiter/cash-drops",
                method: "GET",
            }),
            providesTags: ["Cash"],
        }),
        initiateCashDrop: builder.mutation<CashDrop, { amount: string }>({
            query: body => ({
                url: "/cash-drops",
                method: "POST",
                body,
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["Cash"],
        }),
        cashierCashDrops: builder.query<
            { data: CashDrop[] },
            { status?: string } | void
        >({
            query: arg => ({
                url: "/cashier/cash-drops",
                method: "GET",
                params: arg?.status ? { status: arg.status } : undefined,
            }),
            providesTags: ["Cash"],
        }),
        receiveCashDrop: builder.mutation<
            {
                cashDropId: string;
                status: string;
                declaredAmount: string;
                countedAmount: string;
                acceptedCustodyAmount: string | null;
                variance: string | null;
                disputeId: string | null;
                version: number;
            },
            {
                cashDropId: string;
                countedAmount: string;
                expectedVersion: number;
            }
        >({
            query: ({ cashDropId, countedAmount, expectedVersion }) => ({
                url: `/cash-drops/${cashDropId}/receive`,
                method: "POST",
                body: { countedAmount, expectedVersion },
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["Cash"],
        }),
        resolveCashDropDispute: builder.mutation<
            CashDrop,
            {
                disputeId: string;
                resolution:
                    | "ACCEPT_COUNTED"
                    | "ACCEPT_DECLARED"
                    | "OTHER_APPROVED_AMOUNT";
                resolutionAmount?: string;
                resolutionNote?: string;
            }
        >({
            query: ({ disputeId, ...body }) => ({
                url: `/cash-drop-disputes/${disputeId}/resolve`,
                method: "POST",
                body,
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: ["Cash"],
        }),
    }),
});

export const {
    useWaiterCashSummaryQuery,
    useWaiterCashDropsQuery,
    useInitiateCashDropMutation,
    useCashierCashDropsQuery,
    useReceiveCashDropMutation,
    useResolveCashDropDisputeMutation,
} = cashApi;
