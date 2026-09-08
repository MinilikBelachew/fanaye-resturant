import type {
    Bill,
    BillRequestCreated,
    CashierBillRequest,
    CashierPaymentLogItem,
    SessionBillResponse,
} from "@/domains/billing/domain/billingApi";
import { api } from "./index";

function idempotencyKey() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const billingApi = api.injectEndpoints({
    endpoints: builder => ({
        sessionBill: builder.query<SessionBillResponse, string>({
            query: tableSessionId => ({
                url: `/table-sessions/${tableSessionId}/bill`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [
                { type: "Bill", id },
                "Bill",
            ],
        }),
        requestBill: builder.mutation<
            BillRequestCreated,
            { tableSessionId: string; expectedTableSessionVersion: number }
        >({
            query: ({ tableSessionId, expectedTableSessionVersion }) => ({
                url: `/table-sessions/${tableSessionId}/bill-requests`,
                method: "POST",
                body: { expectedTableSessionVersion },
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Bill",
                { type: "Bill", id: arg.tableSessionId },
                { type: "Order", id: arg.tableSessionId },
            ],
        }),
        cancelBillRequest: builder.mutation<
            BillRequestCreated,
            { billRequestId: string; tableSessionId: string }
        >({
            query: ({ billRequestId }) => ({
                url: `/bill-requests/${billRequestId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Bill",
                { type: "Bill", id: arg.tableSessionId },
            ],
        }),
        cashierBillRequests: builder.query<
            { data: CashierBillRequest[] },
            void
        >({
            query: () => ({
                url: "/cashier/bill-requests",
                method: "GET",
            }),
            providesTags: ["Bill"],
        }),
        generateBill: builder.mutation<
            Bill,
            {
                billRequestId: string;
                expectedTableSessionVersion: number;
                tableSessionId: string;
            }
        >({
            query: ({ billRequestId, expectedTableSessionVersion }) => ({
                url: `/bill-requests/${billRequestId}/generate`,
                method: "POST",
                body: { expectedTableSessionVersion },
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Bill",
                { type: "Bill", id: arg.tableSessionId },
            ],
        }),
        payCash: builder.mutation<
            {
                payment: { paymentId: string; status: string };
                change: string;
                bill: { billId: string; status: string; version: number };
                tableSession: { status: string; version: number };
            },
            {
                billId: string;
                tableSessionId: string;
                amount: string;
                cashTendered: string;
                expectedBillVersion: number;
            }
        >({
            query: ({
                billId,
                amount,
                cashTendered,
                expectedBillVersion,
            }) => ({
                url: `/bills/${billId}/payments/cash`,
                method: "POST",
                body: { amount, cashTendered, expectedBillVersion },
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Bill",
                "Cash",
                { type: "Bill", id: arg.tableSessionId },
            ],
        }),
        payTransfer: builder.mutation<
            {
                payment: { paymentId: string; status: string };
                bill: { billId: string; status: string; version: number };
                tableSession: { status: string; version: number };
            },
            {
                billId: string;
                tableSessionId: string;
                amount: string;
                expectedBillVersion: number;
                transferChannel: "TELEBIRR" | "BANK";
                fileId: string;
            }
        >({
            query: ({
                billId,
                amount,
                expectedBillVersion,
                transferChannel,
                fileId,
            }) => ({
                url: `/bills/${billId}/payments/transfer`,
                method: "POST",
                body: {
                    amount,
                    expectedBillVersion,
                    transferChannel,
                    fileId,
                },
                headers: { "Idempotency-Key": idempotencyKey() },
            }),
            invalidatesTags: (_result, _error, arg) => [
                "Floor",
                "Bill",
                "Cash",
                { type: "Bill", id: arg.tableSessionId },
            ],
        }),
        cashierPayments: builder.query<{ data: CashierPaymentLogItem[] }, void>(
            {
                query: () => ({
                    url: "/cashier/payments",
                    method: "GET",
                }),
                providesTags: ["Bill"],
            },
        ),
        uploadReceipt: builder.mutation<
            { file: { id: string; path: string } },
            File
        >({
            query: file => {
                const body = new FormData();
                body.append("file", file);
                return {
                    url: "/files/upload",
                    method: "POST",
                    body,
                };
            },
        }),
    }),
});

export const {
    useSessionBillQuery,
    useRequestBillMutation,
    useCancelBillRequestMutation,
    useCashierBillRequestsQuery,
    useGenerateBillMutation,
    usePayCashMutation,
    usePayTransferMutation,
    useCashierPaymentsQuery,
    useUploadReceiptMutation,
} = billingApi;
