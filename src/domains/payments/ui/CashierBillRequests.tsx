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

    const [recentGeneratedBills, setRecentGeneratedBills] = useState<
        Array<{
            bill: Bill;
            tableDisplayName: string;
            waiterName: string;
            generatedTime: string;
        }>
    >([]);

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

            const item = {
                bill,
                tableDisplayName: request.tableDisplayName || "Table",
                waiterName: request.waiter?.displayName || "Waiter",
                generatedTime: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setRecentGeneratedBills(prev => [
                item,
                ...prev.filter(b => b.bill.billId !== bill.billId),
            ]);

            setActiveReceipt({
                bill,
                tableDisplayName: request.tableDisplayName || "Table",
                waiterName: request.waiter?.displayName || "Waiter",
            });

            toast.success(
                "Bill generated!",
                `Table ${request.tableDisplayName || request.tableSessionId} · Ready for receipt & printing.`,
            );
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

    return (
        <div className="space-y-6">
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}

            {/* PENDING WAITER BILL REQUESTS */}
            <div className="space-y-3">
                <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                    <span>Pending Table Requests</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-slate-gray">
                        {requests.length}
                    </span>
                </h3>

                {requests.length === 0 ? (
                    <p className="rounded-[16px] border border-hairline bg-card p-5 text-slate-gray text-[13px]">
                        {tCashier("noPendingBills")}
                    </p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {requests.map(request => (
                            <article
                                key={request.billRequestId}
                                className="rounded-[16px] border border-hairline bg-card p-5 shadow-xs"
                            >
                                <p className="text-[13px] text-slate-gray">
                                    {tCommon("table")}{" "}
                                    {request.tableDisplayName} ·{" "}
                                    {request.waiter.displayName}
                                </p>
                                <p className="text-[22px] font-bold text-foreground mt-0.5">
                                    {formatEtb(Number(request.estimatedAmount))}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-gray">
                                    Waiting{" "}
                                    {Math.floor(request.requestAgeSeconds / 60)}{" "}
                                    min
                                    {request.warnings.length > 0
                                        ? ` · ${request.warnings.join(", ").toLowerCase().replaceAll("_", " ")}`
                                        : ""}
                                </p>
                                <Button
                                    className="mt-4 w-full sm:w-auto h-9 rounded-xl font-semibold"
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
                )}
            </div>

            {/* RECENTLY GENERATED BILLS SECTION */}
            {recentGeneratedBills.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                        <span>Generated Bills Today</span>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium">
                            {recentGeneratedBills.length} ready
                        </span>
                    </h3>

                    <div className="grid gap-3 md:grid-cols-2">
                        {recentGeneratedBills.map(item => (
                            <article
                                key={item.bill.billId}
                                className="rounded-[16px] border border-emerald-500/20 bg-card p-5 shadow-xs flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[13px] font-medium text-foreground">
                                            {tCommon("table")}{" "}
                                            {item.tableDisplayName} ·{" "}
                                            {item.waiterName}
                                        </p>
                                        <span className="text-[11px] text-slate-gray">
                                            {item.generatedTime}
                                        </span>
                                    </div>
                                    <p className="text-[20px] font-bold text-foreground mt-1">
                                        {formatEtb(Number(item.bill.total))}
                                    </p>
                                    <p className="text-[11.5px] text-slate-gray mt-0.5">
                                        Bill #{item.bill.billNumber} ·{" "}
                                        {item.bill.lines?.length || 0} items
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                            setActiveReceipt({
                                                bill: item.bill,
                                                tableDisplayName:
                                                    item.tableDisplayName,
                                                waiterName: item.waiterName,
                                            })
                                        }
                                        className="h-8 rounded-lg text-[12px] font-semibold"
                                    >
                                        View & Print Receipt
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

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
