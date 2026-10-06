import type {
    Bill,
    BillRequestCreated,
    CashierBillRequest,
    CashierPaymentDetail,
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
    overrideExisting: true,
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
        getBill: builder.query<Bill, string>({
            query: billId => ({
                url: `/bills/${billId}`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [{ type: "Bill", id }],
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
            query: ({ billId, amount, cashTendered, expectedBillVersion }) => ({
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
                tipAmount?: string;
                verifiedAmount?: string;
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
                reference?: string;
                bankProvider?: string;
                accountSuffix?: string;
                phoneNumber?: string;
            }
        >({
            query: ({
                billId,
                amount,
                expectedBillVersion,
                transferChannel,
                fileId,
                reference,
                bankProvider,
                accountSuffix,
                phoneNumber,
            }) => ({
                url: `/bills/${billId}/payments/transfer`,
                method: "POST",
                body: {
                    amount,
                    expectedBillVersion,
                    transferChannel,
                    fileId,
                    ...(reference ? { reference } : {}),
                    ...(bankProvider ? { bankProvider } : {}),
                    ...(accountSuffix ? { accountSuffix } : {}),
                    ...(phoneNumber ? { phoneNumber } : {}),
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
        cashierPayments: builder.query<
            { data: CashierPaymentLogItem[] },
            { from?: string; to?: string } | void
        >({
            query: arg => ({
                url: "/cashier/payments",
                method: "GET",
                params: {
                    ...(arg?.from ? { from: arg.from } : {}),
                    ...(arg?.to ? { to: arg.to } : {}),
                },
            }),
            providesTags: ["Bill"],
        }),
        cashierPaymentDetail: builder.query<CashierPaymentDetail, string>({
            query: paymentId => ({
                url: `/cashier/payments/${paymentId}`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [
                { type: "Bill", id },
                "Bill",
            ],
        }),
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
        extractReceipt: builder.mutation<
            {
                reference: string | null;
                bankProvider: string | null;
                amount: string | null;
                confidence: number;
                source: string;
                rawHint?: string | null;
            },
            { file: File; transferChannel?: "TELEBIRR" | "BANK" }
        >({
            query: ({ file, transferChannel }) => {
                const body = new FormData();
                body.append("file", file);
                return {
                    url: "/payments/receipt-extract",
                    method: "POST",
                    body,
                    headers: transferChannel
                        ? { "x-transfer-channel": transferChannel }
                        : undefined,
                };
            },
        }),
        sendBillToWaiter: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: billId => ({
                url: `/bills/${billId}/send-to-waiter`,
                method: "POST",
            }),
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
    useCashierPaymentDetailQuery,
    useUploadReceiptMutation,
    useExtractReceiptMutation,
    useSendBillToWaiterMutation,
    useGetBillQuery,
    useLazyGetBillQuery,
} = billingApi;
