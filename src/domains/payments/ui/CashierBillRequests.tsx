"use client";

import { useState } from "react";
import {
    useCashierBillRequestsQuery,
    useGenerateBillMutation,
} from "@/context/services/billingApi";
import { Bill } from "@/domains/billing/domain/billingApi";
import { CashierReceiptModal } from "@/domains/payments/ui/CashierReceiptModal";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";
import { CashierBillsSkeleton } from "@/components/custom/molecules/Skeletons";

export default function CashierBillRequests() {
    const tCashier = useTranslations("cashier");
    const tCommon = useTranslations("common");
    const { data, isLoading, isError } = useCashierBillRequestsQuery(
        undefined,
        { pollingInterval: 5000 },
    );
    const [generateBill, { isLoading: generatingId }] =
        useGenerateBillMutation();
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");
    const [activeReceipt, setActiveReceipt] = useState<{
        bill: Bill;
        tableDisplayName: string;
        waiterName: string;
    } | null>(null);

    const requests = data?.data ?? [];

    async function generate(request: (typeof requests)[number]) {
        setError("");
        setBusyId(request.billRequestId);
        try {
            const bill = await generateBill({
                billRequestId: request.billRequestId,
                expectedTableSessionVersion:
                    request.expectedTableSessionVersion,
                tableSessionId: request.tableSessionId,
            }).unwrap();
            toast.success(
                "Bill generated!",
                `Table ${request.tableDisplayName || request.tableSessionId} · Ready for receipt & printing.`,
            );
            setActiveReceipt({
                bill,
                tableDisplayName: request.tableDisplayName || "Table",
                waiterName: request.waiter?.displayName || "Waiter",
            });
        } catch (err) {
            const message =
                "Could not generate this bill. Refresh and try again.";
            setError(message);
            toast.fromUnknown(err, message);
        } finally {
            setBusyId("");
        }
    }

    if (isLoading) {
        return <CashierBillsSkeleton />;
    }

    if (isError) {
        return <p className="text-red-600">{tCommon("error")}</p>;
    }

    if (requests.length === 0) {
        return (
            <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray">
                {tCashier("noPendingBills")}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            <div className="grid gap-3 md:grid-cols-2">
                {requests.map(request => (
                    <article
                        key={request.billRequestId}
                        className="rounded-[16px] border border-hairline bg-card p-5"
                    >
                        <p className="text-[13px] text-slate-gray">
                            {tCommon("table")} {request.tableDisplayName} ·{" "}
                            {request.waiter.displayName}
                        </p>
                        <p className="text-[20px] font-semibold">
                            {formatEtb(Number(request.estimatedAmount))}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            Waiting {Math.floor(request.requestAgeSeconds / 60)}{" "}
                            min
                            {request.warnings.length > 0
                                ? ` · ${request.warnings.join(", ").toLowerCase().replaceAll("_", " ")}`
                                : ""}
                        </p>
                        <Button
                            className="mt-4"
                            disabled={
                                busyId === request.billRequestId ||
                                Boolean(generatingId)
                            }
                            onClick={() => {
                                void generate(request);
                            }}
                        >
                            {busyId === request.billRequestId
                                ? tCashier("generating")
                                : tCashier("generateBill")}
                        </Button>
                    </article>
                ))}
            </div>

            {/* Thermal POS Receipt & Print/Export Modal */}
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
