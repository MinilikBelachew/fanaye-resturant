"use client";

import React, { useRef, useState } from "react";
import { Check, FileDown, Loader2, Printer, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Bill } from "@/domains/billing/domain/billingApi";
import { useSendBillToWaiterMutation } from "@/context/services/billingApi";
import { exportElementToPdf } from "@/lib/pdfExport";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { GoldenClocheLogo } from "@/components/common/GoldenClocheLogo";
import { QrCodeSvg } from "@/components/common/QrCodeSvg";

interface CashierReceiptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bill: Bill | null;
    tableDisplayName?: string;
    waiterName?: string;
    restaurantName?: string;
    branchName?: string;
    cashierName?: string;
    showSendToWaiter?: boolean;
    showPrintActions?: boolean;
}

export const CashierReceiptModal: React.FC<CashierReceiptModalProps> = ({
    open,
    onOpenChange,
    bill,
    tableDisplayName,
    waiterName,
    restaurantName = "Fanaye Restaurant & Lounge",
    branchName = "Bole Medhanialem Branch",
    cashierName = "Cashier",
    showSendToWaiter = true,
    showPrintActions = true,
}) => {
    const tReceipt = useTranslations("receipt");
    const tCommon = useTranslations("common");
    const tCashier = useTranslations("cashier");
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [sendBillToWaiter, { isLoading: isSending }] =
        useSendBillToWaiterMutation();

    if (!open || !bill) return null;

    const subtotal = Number(bill.subtotal || bill.total || 0);
    const vat = (subtotal * 0.15) / 1.15; // 15% inclusive VAT standard in ET
    const net = subtotal - vat;
    const total = Number(bill.total || 0);

    const displayTable = tableDisplayName || "Dining Table";
    const displayWaiter = waiterName || "Floor Server";
    const generatedTime = bill.generatedAt
        ? new Date(bill.generatedAt).toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : new Date().toLocaleString();

    async function handleExportPdf() {
        if (!receiptRef.current) return;
        setIsExportingPdf(true);
        try {
            await exportElementToPdf(receiptRef.current, {
                filename: `receipt-${bill?.billNumber || "bill"}.pdf`,
                scale: 3,
                orientation: "portrait",
                isReceipt: true,
            });
        } finally {
            setIsExportingPdf(false);
        }
    }

    function handlePrint() {
        window.print();
    }

    async function handleSendToWaiter() {
        if (!bill) return;
        try {
            await sendBillToWaiter(bill.billId).unwrap();
            setSentSuccess(true);
            toast.success(
                "Bill Sent to Waiter!",
                `Notification dispatched to ${displayWaiter} to deliver to Table ${displayTable}.`,
            );
        } catch {
            toast.error(
                "Could not notify waiter",
                "Please confirm server assignment or deliver the printed receipt directly.",
            );
        }
    }

    const receiptVerifyUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/receipt/${bill.billId}`
            : `https://fanaye.et/receipt/${bill.billId}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
            {/* Dynamic 80mm POS Thermal Receipt Print Media Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #pos-thermal-receipt,
                    #pos-thermal-receipt * {
                        visibility: visible;
                    }
                    #pos-thermal-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 78mm !important;
                        margin: 0 !important;
                        padding: 4mm 4mm 8mm 4mm !important;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        border: none !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="relative flex max-h-[95vh] w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden print:m-0 print:max-h-none print:w-auto print:rounded-none print:shadow-none">
                {/* Modal Header & Quick Action Buttons */}
                <div className="no-print flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                            <GoldenClocheLogo className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                {tReceipt("receiptTitle")}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                80mm Thermal POS · {tCommon("table")}{" "}
                                {displayTable}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {showPrintActions ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={handleExportPdf}
                                    disabled={isExportingPdf}
                                    className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                                >
                                    {isExportingPdf ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <FileDown className="size-3.5" />
                                    )}
                                    {isExportingPdf
                                        ? tCommon("loading")
                                        : tReceipt("exportPdf")}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handlePrint}
                                    className="h-8 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Printer className="size-3.5 text-slate-600" />
                                    {tReceipt("printReceipt")}
                                </Button>
                            </>
                        ) : null}

                        {showSendToWaiter ? (
                            <Button
                                size="sm"
                                variant={sentSuccess ? "secondary" : "default"}
                                onClick={handleSendToWaiter}
                                disabled={isSending || sentSuccess}
                                className={`h-8 gap-1.5 text-xs font-semibold ${
                                    sentSuccess
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                        : "bg-slate-900 hover:bg-black text-white"
                                }`}
                            >
                                {isSending ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : sentSuccess ? (
                                    <Check className="size-3.5 text-emerald-600" />
                                ) : (
                                    <Send className="size-3.5 text-amber-400" />
                                )}
                                {sentSuccess
                                    ? tCashier("sentToWaiter")
                                    : tCashier("sendToWaiter")}
                            </Button>
                        ) : null}

                        <button
                            onClick={() => onOpenChange(false)}
                            className="ml-1 flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Receipt Preview Viewport */}
                <div className="flex-1 overflow-y-auto bg-slate-200/60 p-6 flex justify-center items-start">
                    {/* Authentic 80mm POS Thermal Slip Container */}
                    <div
                        id="pos-thermal-receipt"
                        ref={receiptRef}
                        className="w-[340px] rounded-2xl bg-white p-6 pb-6 shadow-xl border border-slate-300/80 font-mono text-[11px] leading-relaxed text-slate-800"
                        style={{ boxSizing: "border-box" }}
                    >
                        {/* Top Brand & Header */}
                        <div className="text-center pb-3 border-b border-dashed border-slate-300">
                            <div className="flex justify-center mb-1.5">
                                <GoldenClocheLogo className="size-8" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-tight text-slate-950 font-sans">
                                {restaurantName}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-sans">
                                {branchName}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                                {tReceipt("tin")}: 0048291047 ·{" "}
                                {tReceipt("vatReg")}: 918234
                            </p>
                            <p className="text-[9px] text-slate-400">
                                Tel: +251 11 661 2233 · Addis Ababa
                            </p>
                        </div>

                        {/* Bill & Metadata Info */}
                        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tReceipt("receiptNo")}:
                                </span>
                                <strong className="text-slate-900 font-bold">
                                    {bill.billNumber}
                                </strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tCommon("date")}:
                                </span>
                                <span>{generatedTime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tCommon("table")}:
                                </span>
                                <strong className="text-slate-900 font-bold uppercase">
                                    {displayTable}
                                </strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tReceipt("server")}:
                                </span>
                                <span>{displayWaiter}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tReceipt("cashier")}:
                                </span>
                                <span>{cashierName}</span>
                            </div>
                        </div>

                        {/* Itemized Line Items Table */}
                        <div className="py-2.5 border-b border-dashed border-slate-300">
                            <div className="flex justify-between font-bold text-[10px] text-slate-900 pb-1.5 border-b border-slate-200 uppercase">
                                <span>
                                    {tCommon("qty")} & {tCommon("items")}
                                </span>
                                <span>{tCommon("total")}</span>
                            </div>

                            <div className="mt-2 space-y-2">
                                {bill.lines && bill.lines.length > 0 ? (
                                    bill.lines.map((line, idx) => (
                                        <div key={line.billLineId || idx}>
                                            <div className="flex items-baseline justify-between">
                                                <span className="font-semibold text-slate-900">
                                                    {line.quantity}×{" "}
                                                    {line.itemName}
                                                </span>
                                                <span className="font-semibold text-slate-950">
                                                    {formatEtb(
                                                        Number(line.lineTotal),
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[9px] text-slate-500 pl-4">
                                                <span>
                                                    @
                                                    {formatEtb(
                                                        Number(line.unitPrice),
                                                    )}
                                                </span>
                                                {line.chargeStatus &&
                                                line.chargeStatus !==
                                                    "CHARGED" ? (
                                                    <span className="italic text-amber-700">
                                                        {line.chargeStatus}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-slate-400 text-center py-2">
                                        {tCommon("noData")}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Financial Totals Breakdown */}
                        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10.5px]">
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tReceipt("subtotal")}:
                                </span>
                                <span>{formatEtb(net)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>{tReceipt("vat")}:</span>
                                <span>{formatEtb(vat)}</span>
                            </div>
                            <div className="flex justify-between text-[13px] font-black text-slate-950 pt-1.5 border-t border-slate-300 font-sans">
                                <span>{tCommon("total")}:</span>
                                <span>{formatEtb(total)}</span>
                            </div>
                            <div className="flex justify-between text-[9.5px] text-slate-500 pt-0.5">
                                <span>{tCommon("status")}:</span>
                                <span className="font-bold text-amber-700 uppercase">
                                    {bill.status || "UNPAID"}
                                </span>
                            </div>
                        </div>

                        {/* Barcode / QR Code Slip Verification */}
                        <div className="pt-4 pb-2 text-center flex flex-col items-center">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-300/80 inline-flex items-center justify-center">
                                <QrCodeSvg
                                    value={receiptVerifyUrl}
                                    size={84}
                                    fgColor="#0f172a"
                                />
                            </div>
                            <p className="text-[8.5px] font-semibold tracking-wider text-slate-500 mt-2 font-mono uppercase">
                                Scan to verify or view e-receipt
                            </p>
                            <p className="text-[11px] font-bold text-slate-900 mt-1.5 font-sans">
                                {tReceipt("thankYou")}
                            </p>
                            <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                                Golden Cloche POS System · fanaye.et
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer info bar */}
                <div className="no-print bg-slate-50 px-6 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                        {showSendToWaiter ? (
                            <>
                                💡 Click{" "}
                                <strong>&ldquo;Send to Waiter&rdquo;</strong> to
                                dispatch an instant alert to the server to
                                collect the bill.
                            </>
                        ) : (
                            <>
                                💡 Present this digital receipt to the guest to
                                scan and verify or collect payment.
                            </>
                        )}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-xs h-7"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
