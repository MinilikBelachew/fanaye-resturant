"use client";

import React, { useRef, useState } from "react";
import {
    Check,
    FileDown,
    Lightbulb,
    Loader2,
    Printer,
    Send,
    X,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Bill } from "@/domains/billing/domain/billingApi";
import { useSendBillToWaiterMutation } from "@/context/services/billingApi";
import { exportElementToPdf } from "@/lib/pdfExport";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useAppSelector } from "@/context/hooks";
import { QrCodeSvg } from "@/components/common/QrCodeSvg";
import { DirectBluetoothPrintButton } from "@/domains/payments/ui/DirectBluetoothPrintButton";

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
    hideTable?: boolean;
}

export const CashierReceiptModal: React.FC<CashierReceiptModalProps> = ({
    open,
    onOpenChange,
    bill,
    tableDisplayName,
    waiterName,
    restaurantName = "Restaurant & Lounge",
    branchName = "Bole Medhanialem Branch",
    cashierName,
    showSendToWaiter = true,
    showPrintActions = true,
    hideTable = false,
}) => {
    const tReceipt = useTranslations("receipt");
    const tCommon = useTranslations("common");
    const tCashier = useTranslations("cashier");
    const locale = useLocale();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("58mm");
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [sendBillToWaiter, { isLoading: isSending }] =
        useSendBillToWaiterMutation();
    const session = useAppSelector(state => state.identity.session);
    const sessionBranchName = session?.branchName;
    const effectiveBranchName =
        bill?.branchName ||
        (branchName && branchName !== "Bole Medhanialem Branch" ? branchName : null) ||
        sessionBranchName ||
        "Main Branch";
    const effectiveRestaurantName =
        bill?.restaurantName ||
        (restaurantName && restaurantName !== "Restaurant & Lounge" ? restaurantName : null) ||
        "Restaurant";
    const effectiveAddress = bill?.address || null;
    const effectivePhone = bill?.phone || null;

    if (!open || !bill) return null;

    const total = Number(bill.total || bill.subtotal || 0);

    const displayTable = tableDisplayName || tCashier("diningTableFallback");
    const displayWaiter = waiterName || tCashier("floorServerFallback");
    const displayCashier = cashierName || tReceipt("cashier");
    const generatedTime = bill.generatedAt
        ? new Date(bill.generatedAt).toLocaleString([], {
              timeZone: "Africa/Addis_Ababa",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : new Date().toLocaleString([], {
              timeZone: "Africa/Addis_Ababa",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          });

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
        const receiptEl = receiptRef.current || document.getElementById("pos-thermal-receipt");
        if (!receiptEl) {
            window.print();
            return;
        }

        // Clean up any stale print iframe
        const staleFrame = document.getElementById("receipt-thermal-print-frame");
        if (staleFrame) staleFrame.remove();

        const iframe = document.createElement("iframe");
        iframe.id = "receipt-thermal-print-frame";
        iframe.style.position = "fixed";
        iframe.style.top = "-9999px";
        iframe.style.left = "-9999px";
        iframe.style.width = paperWidth === "58mm" ? "58mm" : "80mm";
        iframe.style.height = "auto";
        iframe.style.border = "none";
        document.body.appendChild(iframe);

        const frameDoc = iframe.contentWindow?.document;
        if (!frameDoc) {
            window.print();
            return;
        }

        const receiptContent = receiptEl.innerHTML;
        const widthMm = paperWidth === "58mm" ? "48mm" : "72mm";
        const pageMm = paperWidth === "58mm" ? "58mm" : "80mm";

        // Calculate exact receipt height in mm (1px ~= 0.2646mm) so Chrome doesn't produce an endless page
        const renderedHeightPx = receiptEl.scrollHeight || receiptEl.offsetHeight || 480;
        const calculatedHeightMm = Math.max(90, Math.ceil(renderedHeightPx * 0.265) + 4);

        frameDoc.open();
        frameDoc.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Receipt</title>
    <style>
        @page {
            size: ${pageMm} ${calculatedHeightMm}mm;
            margin: 0mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            border-width: 0;
            border-style: none;
            border-color: transparent;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        html, body {
            margin: 0 auto;
            padding: 1mm 0.5mm 2mm 0.5mm;
            background: #ffffff;
            color: #000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
            font-size: 11px;
            line-height: 1.35;
            width: ${widthMm};
            max-width: ${widthMm};
            height: auto;
            overflow: hidden;
        }
        div, p, span, strong, h2, table, tr, td {
            color: #000000 !important;
        }
        /* Only horizontal dashed divider lines - absolutely NO side or outer borders */
        .border-b {
            border-bottom: 1px dashed #000000 !important;
        }
        .border-t {
            border-top: 1px dashed #000000 !important;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .font-bold, strong { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .font-mono { font-family: "Courier New", Courier, monospace; }
        .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        svg { display: block; margin: 0 auto; }
        .space-y-1 > * + * { margin-top: 0.2rem; }
        .space-y-2 > * + * { margin-top: 0.4rem; }
        .pb-1 { padding-bottom: 0.2rem; }
        .pb-1\\.5 { padding-bottom: 0.35rem; }
        .pb-2 { padding-bottom: 0.4rem; }
        .pb-3 { padding-bottom: 0.6rem; }
        .pt-0\\.5 { padding-top: 0.1rem; }
        .pt-2 { padding-top: 0.4rem; }
        .pt-4 { padding-top: 0.8rem; }
        .py-2\\.5 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .mt-0\\.5 { margin-top: 0.1rem; }
        .mt-1 { margin-top: 0.2rem; }
        .mt-1\\.5 { margin-top: 0.3rem; }
        .mt-2 { margin-top: 0.4rem; }
        .text-\\[10px\\] { font-size: 10px; }
        .text-\\[9px\\] { font-size: 9px; }
        .text-\\[9\\.5px\\] { font-size: 9.5px; }
        .text-\\[8\\.5px\\] { font-size: 8.5px; }
        .text-\\[11px\\] { font-size: 11px; }
        .text-\\[13px\\] { font-size: 13px; }
        .text-sm { font-size: 14px; }
        .font-black { font-weight: 900; }
        .font-semibold { font-weight: 600; }
        .tracking-tight { letter-spacing: -0.025em; }
        .tracking-wider { letter-spacing: 0.05em; }
        .pl-4 { padding-left: 0.8rem; }
        .items-baseline { align-items: baseline; }
        .items-center { align-items: center; }
        .flex-col { flex-direction: column; }
        .inline-flex { display: inline-flex; }
        .rounded-lg { border-radius: 4px; }
    </style>
</head>
<body>
    <div style="width: 100%;">
        ${receiptContent}
    </div>
</body>
</html>`);
        frameDoc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                iframe.remove();
            }, 3000);
        }, 250);
    }

    async function handleSendToWaiter() {
        if (!bill) return;
        try {
            await sendBillToWaiter(bill.billId).unwrap();
            setSentSuccess(true);
            toast.success(
                tCashier("billSentTitle"),
                tCashier("billSentBody", {
                    waiter: displayWaiter,
                    table: displayTable,
                }),
            );
        } catch {
            toast.error(
                tCashier("billNotifyErrorTitle"),
                tCashier("billNotifyErrorBody"),
            );
        }
    }

    const receiptVerifyUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/${locale}/receipt/${bill.billId}`
            : `https://example.com/${locale}/receipt/${bill.billId}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
            {/* Standard React Compatible Print Stylesheet */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        @media print {
                            *, *::before, *::after {
                                box-shadow: none !important;
                                text-shadow: none !important;
                                filter: none !important;
                                backdrop-filter: none !important;
                                animation: none !important;
                                transition: none !important;
                            }
                            @page {
                                size: ${paperWidth === "58mm" ? "58mm auto" : "80mm auto"};
                                margin: 0mm;
                            }
                            html, body {
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #fff !important;
                                color: #000 !important;
                                width: ${paperWidth === "58mm" ? "48mm" : "78mm"} !important;
                            }
                            body * {
                                visibility: hidden !important;
                            }
                            #pos-thermal-receipt,
                            #pos-thermal-receipt * {
                                visibility: visible !important;
                                color: #000 !important;
                            }
                            #pos-thermal-receipt {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: ${paperWidth === "58mm" ? "48mm" : "78mm"} !important;
                                max-width: ${paperWidth === "58mm" ? "48mm" : "78mm"} !important;
                                margin: 0 !important;
                                padding: 1mm 1mm 4mm 1mm !important;
                                background: #fff !important;
                                border: none !important;
                                border-radius: 0 !important;
                                box-shadow: none !important;
                                display: block !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                        }
                    `,
                }}
            />

            <div className="relative flex max-h-[95vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden print:m-0 print:max-h-none print:w-auto print:rounded-none print:shadow-none">
                {/* Modal Header & Quick Action Buttons */}
                <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                            <Printer className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                {tReceipt("receiptTitle")}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                {hideTable
                                    ? `${paperWidth} Thermal POS`
                                    : `${paperWidth} Thermal POS · ${tCommon("table")} ${displayTable}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Paper Width Selector */}
                        <div className="flex items-center rounded-lg bg-slate-200/80 p-0.5 text-[11px] font-semibold">
                            <button
                                type="button"
                                onClick={() => setPaperWidth("58mm")}
                                className={`px-2 py-0.5 rounded-md transition-all ${
                                    paperWidth === "58mm"
                                        ? "bg-white text-slate-900 shadow-xs font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="58mm Mobile Thermal (ATP-BP21 / MPT-II)"
                            >
                                58mm
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaperWidth("80mm")}
                                className={`px-2 py-0.5 rounded-md transition-all ${
                                    paperWidth === "80mm"
                                        ? "bg-white text-slate-900 shadow-xs font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="80mm Desktop Counter POS"
                            >
                                80mm
                            </button>
                        </div>

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

                                <DirectBluetoothPrintButton
                                    bill={bill}
                                    paperWidth={paperWidth}
                                    tableDisplayName={displayTable}
                                    waiterName={displayWaiter}
                                    cashierName={displayCashier}
                                    restaurantName={effectiveRestaurantName}
                                    branchName={effectiveBranchName}
                                />
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
                    {/* Authentic POS Thermal Slip Container */}
                    <div
                        id="pos-thermal-receipt"
                        ref={receiptRef}
                        className={`${
                            paperWidth === "58mm"
                                ? "w-[270px] p-3.5 text-[10px]"
                                : "w-[340px] p-6 text-[11px]"
                        } rounded-2xl bg-white pb-6 shadow-xl border border-slate-300/80 font-mono leading-relaxed text-slate-800 transition-all`}
                        style={{ boxSizing: "border-box" }}
                    >
                        {/* Top Brand & Header */}
                        <div className="text-center pb-3 border-b border-dashed border-slate-300">
                            <h2 className="text-sm font-black uppercase tracking-tight text-slate-950 font-sans">
                                {effectiveRestaurantName}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-sans">
                                {effectiveBranchName}
                            </p>
                            {effectiveAddress ? (
                                <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                                    {effectiveAddress}
                                </p>
                            ) : null}
                            {effectivePhone ? (
                                <p className="text-[9.5px] text-slate-500 font-sans">
                                    Tel: {effectivePhone}
                                </p>
                            ) : null}

                        </div>

                        {/* Bill & Metadata Info */}
                        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tReceipt("receiptNo")}:
                                </span>
                                <strong className="text-slate-900 font-bold">
                                    {bill.billNumber}
                                    {bill.isVip ? " · VIP" : ""}
                                </strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tCommon("date")}:
                                </span>
                                <span>{generatedTime}</span>
                            </div>
                            {hideTable ? null : (
                                <>
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
                                </>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    {tReceipt("cashier")}:
                                </span>
                                <span>{displayCashier}</span>
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
                            <div className="flex justify-between text-[13px] font-black text-slate-950 pt-0.5 font-sans">
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
                            <div className="p-1.5 bg-white rounded-lg border border-slate-300/80 print:border-none print:p-0 inline-flex items-center justify-center">
                                <QrCodeSvg
                                    value={receiptVerifyUrl}
                                    size={paperWidth === "58mm" ? 64 : 84}
                                    fgColor="#000000"
                                />
                            </div>
                            <p className="text-[8.5px] font-semibold tracking-wider text-slate-500 mt-2 font-mono uppercase">
                                Scan to verify or view e-receipt
                            </p>
                            <p className="text-[11px] font-bold text-slate-900 mt-1.5 font-sans">
                                {tReceipt("thankYou")}
                            </p>
                            <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                                Restaurant POS System
                            </p>
                        </div>

                        {/* Bottom Disclaimer */}
                        <div className="pt-2 mt-1 border-t border-dashed border-slate-300 text-left">
                            <p className="text-[9px] font-bold tracking-wider uppercase text-slate-700 font-mono">
                                *** FOR INTERNAL USE ONLY ***
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer info bar */}
                <div className="no-print bg-slate-50 px-6 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <Lightbulb className="size-3.5 text-amber-500 shrink-0" />
                        {showSendToWaiter ? (
                            <span>
                                Click{" "}
                                <strong>&ldquo;Send to Waiter&rdquo;</strong> to
                                dispatch an instant alert to the server to
                                collect the bill.
                            </span>
                        ) : (
                            <span>
                                Present this digital receipt to the guest to
                                scan and verify or collect payment.
                            </span>
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
