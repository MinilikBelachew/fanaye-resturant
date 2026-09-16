"use client";

import { useState } from "react";
import {
    useCashierPaymentsQuery,
    useLazyGetBillQuery,
} from "@/context/services/billingApi";
import { Bill } from "@/domains/billing/domain/billingApi";
import { CashierReceiptModal } from "@/domains/payments/ui/CashierReceiptModal";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { Loader2, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { CashierPaymentsSkeleton } from "@/components/custom/molecules/Skeletons";

export default function CashierPaymentsLog() {
    const tCashier = useTranslations("cashier");
    const tCommon = useTranslations("common");
    const { data, isLoading, isError } = useCashierPaymentsQuery(undefined, {
        pollingInterval: 5000,
    });
    const [triggerGetBill] = useLazyGetBillQuery();
    const [activeReceipt, setActiveReceipt] = useState<{
        bill: Bill;
        tableDisplayName: string;
        waiterName: string;
    } | null>(null);
    const [loadingBillId, setLoadingBillId] = useState<string | null>(null);

    const payments = data?.data ?? [];

    function methodLabel(method: string, channel: string | null) {
        if (method === "CASH") return tCashier("cash");
        if (channel === "TELEBIRR") return tCashier("telebirr");
        if (channel === "BANK") return tCashier("transfer");
        return tCashier("transfer");
    }

    async function viewReceipt(payment: (typeof payments)[number]) {
        setLoadingBillId(payment.billId);
        try {
            const bill = await triggerGetBill(payment.billId).unwrap();
            setActiveReceipt({
                bill,
                tableDisplayName: payment.tableDisplayName,
                waiterName: payment.waiterName,
            });
        } catch {
            toast.error("Could not load receipt details.");
        } finally {
            setLoadingBillId(null);
        }
    }

    if (isLoading) {
        return <CashierPaymentsSkeleton />;
    }

    if (isError) {
        return <p className="text-red-600">{tCommon("error")}</p>;
    }

    if (payments.length === 0) {
        return (
            <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray">
                {tCashier("noPayments")}
            </p>
        );
    }

    return (
        <>
            <ul className="space-y-3">
                {payments.map(payment => (
                    <li
                        key={payment.paymentId}
                        className="rounded-[16px] border border-hairline bg-card p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[13px] text-slate-gray">
                                    {tCommon("table")}{" "}
                                    {payment.tableDisplayName} ·{" "}
                                    {payment.waiterName}
                                </p>
                                <p className="text-[20px] font-semibold">
                                    {formatEtb(Number(payment.amount))}
                                </p>
                                <p className="mt-1 text-[13px] text-slate-gray">
                                    {methodLabel(
                                        payment.method,
                                        payment.transferChannel,
                                    )}{" "}
                                    · {payment.billNumber}
                                    {payment.tableClosed
                                        ? ` · ${tCashier("tableClosed")}`
                                        : ` · ${tCashier("tableOpen")}`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => viewReceipt(payment)}
                                    disabled={loadingBillId === payment.billId}
                                    className="h-8 gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    {loadingBillId === payment.billId ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Receipt className="size-3.5 text-amber-600" />
                                    )}
                                    {tCashier("receipt")}
                                </Button>
                                <span className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-slate-gray">
                                    {tCashier("recorded")}
                                </span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Thermal POS Receipt Modal */}
            <CashierReceiptModal
                open={Boolean(activeReceipt)}
                onOpenChange={open => !open && setActiveReceipt(null)}
                bill={activeReceipt?.bill || null}
                tableDisplayName={activeReceipt?.tableDisplayName}
                waiterName={activeReceipt?.waiterName}
            />
        </>
    );
}
