"use client";

import React, { useRef, useState } from "react";
import { Check, FileDown, Printer, X, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { CashDrop } from "@/domains/cash/domain/cashApi";
import { exportElementToPdf } from "@/lib/pdfExport";
import { formatEtb } from "@/lib/money";
import { GoldenClocheLogo } from "@/components/common/GoldenClocheLogo";
import { Badge } from "@/components/ui/badge";

interface CashDropReceiptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    drop: CashDrop | null;
    restaurantName?: string;
    branchName?: string;
    cashierName?: string;
}

export const CashDropReceiptModal: React.FC<CashDropReceiptModalProps> = ({
    open,
    onOpenChange,
    drop,
    restaurantName = "Restaurant & Lounge",
    branchName = "Bole Medhanialem Branch",
    cashierName,
}) => {
    const t = useTranslations("cashier");
    const tReceipt = useTranslations("receipt");
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    if (!open || !drop) return null;

    const declared = Number(drop.declaredAmount || 0);
    const counted = drop.countedAmount ? Number(drop.countedAmount) : declared;
    const variance = drop.variance ? Number(drop.variance) : 0;
    const displayCashier = cashierName || t("cashierCustodyFallback");
    const displayWaiter = drop.waiterName ?? t("floorWaiterFallback");

    const timestamp = drop.receivedAt
        ? new Date(drop.receivedAt).toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
          })
        : drop.initiatedAt
          ? new Date(drop.initiatedAt).toLocaleString([], {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
          : new Date().toLocaleString();

    const voucherId = `DROP-${drop.cashDropId.slice(0, 8).toUpperCase()}`;

    async function handleExportPdf() {
        if (!receiptRef.current) return;
        setIsExportingPdf(true);
        try {
            await exportElementToPdf(receiptRef.current, {
                filename: `cash-drop-voucher-${voucherId}.pdf`,
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-[420px] max-h-[92vh] overflow-y-auto rounded-2xl bg-card border border-border/80 shadow-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <h3 className="font-semibold text-sm text-foreground">
                            {t("cashDropVoucherTitle")}
                        </h3>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div
                    ref={receiptRef}
                    className="bg-white text-black p-6 rounded-xl border border-gray-200 shadow-sm font-sans space-y-4"
                >
                    <div className="text-center space-y-1">
                        <div className="flex justify-center mb-1">
                            <GoldenClocheLogo className="size-8 text-[#d97706]" />
                        </div>
                        <h2 className="text-base font-bold tracking-tight text-gray-900">
                            {restaurantName}
                        </h2>
                        <p className="text-xs text-gray-500">{branchName}</p>
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-mono font-semibold text-gray-700 tracking-wider uppercase mt-1">
                            {t("cashCustodyTransferVoucher")}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 pt-3 text-xs space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-gray-500">
                                {t("voucherRef")}:
                            </span>
                            <span className="font-mono font-bold text-gray-800">
                                {voucherId}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">
                                {t("dropTimestamp")}:
                            </span>
                            <span className="font-mono text-gray-800">
                                {timestamp}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">
                                {t("handedByWaiter")}:
                            </span>
                            <span className="font-semibold text-gray-900">
                                {displayWaiter}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">
                                {t("receivedByCashier")}:
                            </span>
                            <span className="font-semibold text-gray-900">
                                {displayCashier}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-b border-gray-200 py-3 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                            <span>{t("declaredWaiterAmount")}:</span>
                            <span className="font-mono">
                                {formatEtb(declared)}
                            </span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-gray-900">
                            <span>{t("verifiedCountedAmount")}:</span>
                            <span className="font-mono text-[#e85d04]">
                                {formatEtb(counted)}
                            </span>
                        </div>
                        {variance !== 0 ? (
                            <div className="flex justify-between text-amber-700 font-semibold text-xs bg-amber-50 p-1.5 rounded">
                                <span>{t("discrepancyVariance")}:</span>
                                <span className="font-mono">
                                    {formatEtb(variance)}
                                </span>
                            </div>
                        ) : (
                            <div className="flex justify-between text-emerald-700 text-[11px] bg-emerald-50 p-1 rounded font-medium">
                                <span>{t("countVerification")}:</span>
                                <span>{t("exactMatch")}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center pt-1">
                        <Badge
                            className={
                                drop.status === "RECEIVED" ||
                                drop.status === "RESOLVED"
                                    ? "bg-emerald-600 text-white hover:bg-emerald-600 text-xs px-3 py-1 font-semibold"
                                    : "bg-amber-600 text-white hover:bg-amber-600 text-xs px-3 py-1 font-semibold"
                            }
                        >
                            <Check className="size-3 mr-1 inline" />
                            {drop.status === "RECEIVED" ||
                            drop.status === "RESOLVED"
                                ? t("verifiedInDrawer")
                                : drop.status}
                        </Badge>
                        <p className="text-[10px] text-gray-400 mt-2">
                            {t("electronicCustodyNote")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border/50 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="flex-1 gap-1.5 text-xs font-medium"
                    >
                        <Printer className="size-3.5" />
                        {tReceipt("printReceipt")}
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        className="flex-1 gap-1.5 text-xs font-medium"
                    >
                        <FileDown className="size-3.5" />
                        {isExportingPdf ? t("exportingPdf") : t("downloadPdf")}
                    </Button>
                </div>
            </div>
        </div>
    );
};
export default CashDropReceiptModal;
