"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    useCashierPaymentsQuery,
    useLazyGetBillQuery,
} from "@/context/services/billingApi";
import type { Bill } from "@/domains/billing/domain/billingApi";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { CashierReceiptModal } from "@/domains/payments/ui/CashierReceiptModal";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";
import { exportElementToPdf } from "@/lib/pdfExport";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { FileDown, LayoutGrid, Loader2, Receipt, Table2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { CashierPaymentsSkeleton } from "@/components/custom/molecules/Skeletons";

type ViewMode = "table" | "cards";

export default function CashierPaymentsLog() {
    const tCashier = useTranslations("cashier");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const logRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<ViewMode>("table");
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const { data, isLoading, isError } = useCashierPaymentsQuery(undefined, {
        pollingInterval: 5000,
    });
    const [triggerGetBill] = useLazyGetBillQuery();
    const [loadingBillId, setLoadingBillId] = useState<string | null>(null);
    const [activeReceipt, setActiveReceipt] = useState<{
        bill: Bill;
        tableDisplayName: string;
        waiterName: string;
    } | null>(null);

    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    const payments = data?.data ?? [];
    const totalCollected = payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
    );
    const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
    const pagePayments = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return payments.slice(start, start + PAGE_SIZE);
    }, [payments, page]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    function methodLabel(method: string, channel: string | null) {
        if (method === "CASH") return tCashier("cash");
        if (channel === "TELEBIRR") return tCashier("telebirr");
        if (channel === "BANK") return tCashier("transfer");
        return tCashier("transfer");
    }

    function openDetail(paymentId: string) {
        router.push(`/cashier/payments/${paymentId}`);
    }

    async function openBillReceipt(
        payment: (typeof payments)[number],
        event?: { stopPropagation: () => void },
    ) {
        event?.stopPropagation();
        setLoadingBillId(payment.billId);
        try {
            const bill = await triggerGetBill(payment.billId).unwrap();
            setActiveReceipt({
                bill,
                tableDisplayName: payment.tableDisplayName,
                waiterName: payment.waiterName,
            });
        } catch {
            toast.error(tCashier("receiptLoadError"));
        } finally {
            setLoadingBillId(null);
        }
    }

    async function handleExportPdf() {
        if (!logRef.current) return;
        setIsExportingPdf(true);
        try {
            await exportElementToPdf(logRef.current, {
                filename: `cashier-payments-log-${new Date().toISOString().slice(0, 10)}.pdf`,
                scale: 2.5,
                orientation: "portrait",
            });
        } finally {
            setIsExportingPdf(false);
        }
    }

    const columns = useMemo<DataTableColumn<(typeof payments)[number]>[]>(
        () => [
            {
                id: "table",
                header: tCommon("table"),
                cell: row => row.tableDisplayName,
                sortValue: row => row.tableDisplayName,
            },
            {
                id: "waiter",
                header: tCommon("waiter"),
                cell: row => row.waiterName,
                sortValue: row => row.waiterName,
            },
            {
                id: "amount",
                header: tCommon("amount"),
                cell: row => (
                    <span className="tabular-nums">
                        {formatEtb(Number(row.amount))}
                    </span>
                ),
                sortValue: row => Number(row.amount),
                className: "text-right",
                headerClassName: "text-right",
            },
            {
                id: "method",
                header: tCommon("method"),
                cell: row => methodLabel(row.method, row.transferChannel),
                sortValue: row => methodLabel(row.method, row.transferChannel),
            },
            {
                id: "bill",
                header: tCommon("bill"),
                cell: row => row.billNumber,
                sortValue: row => row.billNumber,
            },
            {
                id: "status",
                header: tCommon("table"),
                cell: row =>
                    row.tableClosed
                        ? tCashier("tableClosed")
                        : tCashier("tableOpen"),
            },
            {
                id: "billReceipt",
                header: tCashier("billReceipt"),
                cell: row => (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={event => void openBillReceipt(row, event)}
                        disabled={loadingBillId === row.billId}
                        className="h-8 gap-1.5 px-2 text-[12px] font-normal"
                    >
                        {loadingBillId === row.billId ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Receipt className="size-3.5" />
                        )}
                        {tCashier("receipt")}
                    </Button>
                ),
            },
            {
                id: "detail",
                header: tCashier("detail"),
                cell: row => (
                    <span className="text-[12px] text-slate-gray">
                        {row.hasTransferReceipt
                            ? tCashier("viewSlip")
                            : tCashier("openDetail")}
                    </span>
                ),
            },
        ],
        [loadingBillId, tCashier, tCommon],
    );

    if (isLoading) {
        return <CashierPaymentsSkeleton />;
    }

    if (isError) {
        return <p className="text-[13px] text-red-600">{tCommon("error")}</p>;
    }

    if (payments.length === 0) {
        return (
            <p className="rounded-[14px] border border-hairline bg-card p-5 text-[13px] text-slate-gray">
                {tCashier("noPayments")}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-hairline bg-card px-4 py-3">
                <div>
                    <p className="text-[11px] tracking-wide text-slate-gray">
                        {tCashier("shiftCollections", {
                            count: payments.length,
                        })}
                    </p>
                    <p className="mt-0.5 text-[18px] font-medium tabular-nums tracking-tight">
                        {formatEtb(totalCollected)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-full border border-hairline p-0.5">
                        <button
                            type="button"
                            onClick={() => setView("table")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]",
                                view === "table"
                                    ? "bg-secondary text-foreground"
                                    : "text-slate-gray",
                            )}
                        >
                            <Table2 className="size-3.5" />
                            {tCommon("table")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("cards")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]",
                                view === "cards"
                                    ? "bg-secondary text-foreground"
                                    : "text-slate-gray",
                            )}
                        >
                            <LayoutGrid className="size-3.5" />
                            {tCommon("cards")}
                        </button>
                    </div>
                    <Button
                        onClick={() => void handleExportPdf()}
                        disabled={isExportingPdf}
                        variant="outline"
                        className="h-8 gap-1.5 rounded-full text-[12px] font-normal"
                    >
                        {isExportingPdf ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <FileDown className="size-3.5" />
                        )}
                        {tCommon("exportPdf")}
                    </Button>
                </div>
            </div>

            <div ref={logRef}>
                {view === "table" ? (
                    <DataTable
                        columns={columns}
                        data={pagePayments}
                        rowKey={row => row.paymentId}
                        empty={tCashier("noPayments")}
                        searchPlaceholder={null}
                        showColumnToggle={false}
                        onRowClick={row => openDetail(row.paymentId)}
                        pagination={{
                            page,
                            totalPages,
                            total: payments.length,
                            onPageChange: setPage,
                        }}
                    />
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {pagePayments.map(payment => (
                            <li
                                key={payment.paymentId}
                                role="button"
                                tabIndex={0}
                                onClick={() => openDetail(payment.paymentId)}
                                onKeyDown={event => {
                                    if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    ) {
                                        event.preventDefault();
                                        openDetail(payment.paymentId);
                                    }
                                }}
                                className="cursor-pointer rounded-[14px] border border-hairline bg-card p-4 transition-colors hover:bg-secondary/30"
                            >
                                <p className="text-[12px] text-slate-gray">
                                    {tCommon("table")}{" "}
                                    {payment.tableDisplayName} ·{" "}
                                    {payment.waiterName}
                                </p>
                                <p className="mt-1 text-[15px] font-medium tabular-nums tracking-tight">
                                    {formatEtb(Number(payment.amount))}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    {methodLabel(
                                        payment.method,
                                        payment.transferChannel,
                                    )}{" "}
                                    · {payment.billNumber}
                                    {payment.tableClosed
                                        ? ` · ${tCashier("tableClosed")}`
                                        : ` · ${tCashier("tableOpen")}`}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={event =>
                                            void openBillReceipt(payment, event)
                                        }
                                        disabled={
                                            loadingBillId === payment.billId
                                        }
                                        className="h-8 gap-1.5 rounded-full text-[12px] font-normal"
                                    >
                                        {loadingBillId === payment.billId ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Receipt className="size-3.5" />
                                        )}
                                        {tCashier("billReceipt")}
                                    </Button>
                                    <span className="inline-flex h-8 items-center text-[12px] text-slate-gray">
                                        {tCashier("openDetail")}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <CashierReceiptModal
                open={Boolean(activeReceipt)}
                onOpenChange={open => !open && setActiveReceipt(null)}
                bill={activeReceipt?.bill || null}
                tableDisplayName={activeReceipt?.tableDisplayName}
                waiterName={activeReceipt?.waiterName}
            />
        </div>
    );
}
