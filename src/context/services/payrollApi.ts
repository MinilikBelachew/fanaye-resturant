import { api } from "./index";

export type PayrollRunSummary = {
    id: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    label: string | null;
    currencyCode: string;
    branchId: string | null;
    totalGross: number;
    totalOt: number;
    totalTips: number;
    totalDeductions: number;
    totalNet: number;
    approvedAt: string | null;
    paidAt: string | null;
    createdAt: string;
    lineCount: number;
};

export type PayrollLine = {
    id: string;
    runId: string;
    staffMembershipId: string;
    staffName: string;
    roleCode: string | null;
    payType: string | null;
    basePay: number | null;
    regularHours: number | null;
    otHours: number;
    otRate: number | null;
    otAmount: number;
    tipAmount: number;
    baseGross: number;
    deductions: number;
    gross: number;
    net: number;
    payMethod: string | null;
    paidAt: string | null;
    notes: string | null;
    runLabel?: string | null;
    periodStart?: string;
    periodEnd?: string;
    runStatus?: string;
};

export type PayrollRunDetail = PayrollRunSummary & {
    lines: PayrollLine[];
};

export const payrollApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        listPayrollRuns: builder.query<
            { data: PayrollRunSummary[] },
            { branchId?: string } | void
        >({
            query: arg => ({
                url: "/admin/payroll/runs",
                params:
                    arg && typeof arg === "object" && arg.branchId
                        ? { branchId: arg.branchId }
                        : undefined,
            }),
            providesTags: ["Floor"],
        }),
        getPayrollRun: builder.query<{ data: PayrollRunDetail }, string>({
            query: runId => ({ url: `/admin/payroll/runs/${runId}` }),
            providesTags: ["Floor"],
        }),
        createPayrollRun: builder.mutation<
            { data: PayrollRunDetail },
            {
                periodStart: string;
                periodEnd: string;
                label?: string;
                branchId?: string;
            }
        >({
            query: body => ({
                url: "/admin/payroll/runs",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        updatePayrollLine: builder.mutation<
            { data: PayrollLine },
            {
                runId: string;
                lineId: string;
                body: {
                    regularHours?: number;
                    otHours?: number;
                    otRate?: number;
                    otAmount?: number;
                    tipAmount?: number;
                    deductions?: number;
                    payMethod?: "CASH" | "BANK";
                    notes?: string;
                };
            }
        >({
            query: ({ runId, lineId, body }) => ({
                url: `/admin/payroll/runs/${runId}/lines/${lineId}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        approvePayrollRun: builder.mutation<
            { data: PayrollRunSummary },
            string
        >({
            query: runId => ({
                url: `/admin/payroll/runs/${runId}/approve`,
                method: "POST",
            }),
            invalidatesTags: ["Floor"],
        }),
        markPayrollPaid: builder.mutation<
            { data: PayrollRunDetail },
            {
                runId: string;
                lineIds?: string[];
                payMethod?: "CASH" | "BANK";
            }
        >({
            query: ({ runId, ...body }) => ({
                url: `/admin/payroll/runs/${runId}/mark-paid`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Floor"],
        }),
        listStaffPayHistory: builder.query<{ data: PayrollLine[] }, string>({
            query: membershipId => ({
                url: `/admin/payroll/staff/${membershipId}/history`,
            }),
            providesTags: ["Floor"],
        }),
    }),
});

export const {
    useListPayrollRunsQuery,
    useGetPayrollRunQuery,
    useCreatePayrollRunMutation,
    useUpdatePayrollLineMutation,
    useApprovePayrollRunMutation,
    useMarkPayrollPaidMutation,
    useListStaffPayHistoryQuery,
} = payrollApi;
