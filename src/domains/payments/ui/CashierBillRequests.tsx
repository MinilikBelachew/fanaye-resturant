"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/context/hooks";
import {
    useCashierActiveBillsQuery,
    useCashierBillRequestsQuery,
    useGenerateBillMutation,
} from "@/context/services/billingApi";
import { Bill, CashierActiveBill } from "@/domains/billing/domain/billingApi";
import { CashierReceiptModal } from "@/domains/payments/ui/CashierReceiptModal";
import WaiterPaymentPanel from "@/domains/payments/ui/WaiterPaymentPanel";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    CreditCard,
    LayoutGrid,
    Lock,
    LogIn,
    Receipt,
    Table2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCurrentShiftQuery } from "@/context/services/shiftsApi";
import { checkShiftExpiry } from "@/domains/identity/domain/shift";
import { useTranslations } from "next-intl";
import { CashierBillsSkeleton } from "@/components/custom/molecules/Skeletons";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";

type ViewMode = "table" | "cards";
type TabMode = "requests" | "awaiting";

export default function CashierBillRequests() {
    const tCashier = useTranslations("cashier");
    const tCommon = useTranslations("common");
    const searchParams = useSearchParams();
    const initialTab =
        searchParams.get("tab") === "awaiting" ? "awaiting" : "requests";
    const currentUserDisplayName = useAppSelector(
        state => state.identity.session?.displayName ?? null,
    );

    const [activeTab, setActiveTab] = useState<TabMode>(initialTab);
    const [view, setView] = useState<ViewMode>("table");
    const [page, setPage] = useState(1);
    const [awaitingPage, setAwaitingPage] = useState(1);
    const PAGE_SIZE = 10;
    const pollMs = useRealtimePollMs(12_000);

    const {
        data: requestsData,
        isLoading: requestsLoading,
        isError: requestsError,
    } = useCashierBillRequestsQuery(undefined, {
        pollingInterval: pollMs,
        refetchOnFocus: true,
    });

    const {
        data: activeBillsData,
        isLoading: activeBillsLoading,
        isError: activeBillsError,
    } = useCashierActiveBillsQuery(undefined, {
        pollingInterval: pollMs,
        refetchOnFocus: true,
    });

    const { data: currentShift } = useCurrentShiftQuery(undefined, {
        pollingInterval: pollMs || 15_000,
        refetchOnFocus: true,
    });

    const shiftExpiry = useMemo(
        () => checkShiftExpiry(currentShift?.shiftSession),
        [currentShift?.shiftSession],
    );

    const [generateBill, { isLoading: generating }] = useGenerateBillMutation();
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");

    const [activeReceipt, setActiveReceipt] = useState<{
        bill: Bill;
        tableDisplayName: string;
        waiterName: string;
        cashierName?: string;
    } | null>(null);

    const [payModalBill, setPayModalBill] = useState<CashierActiveBill | null>(
        null,
    );

    const requests = requestsData?.data ?? [];
    const activeBills = activeBillsData?.data ?? [];

    const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
    const pageRequests = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return requests.slice(start, start + PAGE_SIZE);
    }, [requests, page]);

    const totalAwaitingPages = Math.max(
        1,
        Math.ceil(activeBills.length / PAGE_SIZE),
    );
    const pageActiveBills = useMemo(() => {
        const start = (awaitingPage - 1) * PAGE_SIZE;
        return activeBills.slice(start, start + PAGE_SIZE);
    }, [activeBills, awaitingPage]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    useEffect(() => {
        if (awaitingPage > totalAwaitingPages)
            setAwaitingPage(totalAwaitingPages);
    }, [awaitingPage, totalAwaitingPages]);

    // Auto switch to awaiting tab if no pending requests and has active bills on first load
    useEffect(() => {
        if (
            !searchParams.get("tab") &&
            requests.length === 0 &&
            activeBills.length > 0
        ) {
            setActiveTab("awaiting");
        }
    }, [requests.length, activeBills.length, searchParams]);

    async function generate(request: (typeof requests)[number]) {
        if (currentShift && !currentShift.clockedIn) {
            toast.error(
                "Clock In Required",
                "You must clock in to your shift before generating customer bills.",
            );
            return;
        }
        setError("");
        setBusyId(request.billRequestId);
        try {
            const bill = await generateBill({
                billRequestId: request.billRequestId,
                expectedTableSessionVersion:
                    request.expectedTableSessionVersion,
                expectedRoomSessionVersion: request.expectedRoomSessionVersion,
                tableSessionId: request.tableSessionId,
                roomSessionId: request.roomSessionId,
            }).unwrap();

            setActiveReceipt({
                bill,
                tableDisplayName: request.tableDisplayName || tCommon("table"),
                waiterName: request.waiter?.displayName || tCommon("waiter"),
                cashierName:
                    currentUserDisplayName || bill.cashierName || undefined,
            });

            toast.success(
                tCashier("billGenerated"),
                tCashier("billGeneratedBody", {
                    table:
                        request.tableDisplayName ||
                        request.tableSessionId ||
                        tCommon("table"),
                }),
            );
            setActiveTab("awaiting");
        } catch (err) {
            const message = tCashier("billGenerateError");
            setError(message);
            toast.fromUnknown(err, message);
        } finally {
            setBusyId("");
        }
    }

    const requestColumns = useMemo<
        DataTableColumn<(typeof requests)[number]>[]
    >(
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
                cell: row => row.waiter.displayName,
                sortValue: row => row.waiter.displayName,
            },
            {
                id: "amount",
                header: tCommon("estimate"),
                cell: row => (
                    <span className="tabular-nums">
                        {formatEtb(Number(row.estimatedAmount))}
                    </span>
                ),
                sortValue: row => Number(row.estimatedAmount),
                className: "text-right",
                headerClassName: "text-right",
            },
            {
                id: "wait",
                header: tCommon("waiting"),
                cell: row => `${Math.floor(row.requestAgeSeconds / 60)} min`,
                sortValue: row => row.requestAgeSeconds,
            },
            {
                id: "warnings",
                header: tCommon("notes"),
                cell: row =>
                    row.warnings.length
                        ? row.warnings
                              .join(", ")
                              .toLowerCase()
                              .replaceAll("_", " ")
                        : "—",
            },
            {
                id: "actions",
                header: "",
                cell: row => {
                    const isOff = currentShift && !currentShift.clockedIn;
                    return (
                        <Button
                            size="sm"
                            className={cn(
                                "h-8 rounded-full px-3 text-[12px] font-normal",
                                isOff &&
                                    "opacity-80 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100",
                            )}
                            disabled={
                                Boolean(isOff) ||
                                busyId === row.billRequestId ||
                                Boolean(generating)
                            }
                            onClick={() => void generate(row)}
                        >
                            {busyId === row.billRequestId ? (
                                tCashier("generating")
                            ) : isOff ? (
                                <span className="flex items-center gap-1.5">
                                    <Lock className="size-3" />
                                    Clock In to Bill
                                </span>
                            ) : (
                                tCashier("generateBill")
                            )}
                        </Button>
                    );
                },
            },
        ],
        [busyId, currentShift, generating, tCashier, tCommon],
    );

    const activeBillColumns = useMemo<DataTableColumn<CashierActiveBill>[]>(
        () => [
            {
                id: "table",
                header: tCommon("table"),
                cell: row => (
                    <div className="font-semibold text-foreground">
                        {row.tableDisplayName}
                    </div>
                ),
                sortValue: row => row.tableDisplayName,
            },
            {
                id: "billNumber",
                header: "Bill #",
                cell: row => (
                    <span className="font-mono text-xs text-muted-foreground">
                        #{row.billNumber}
                    </span>
                ),
                sortValue: row => row.billNumber,
            },
            {
                id: "waiter",
                header: tCommon("waiter"),
                cell: row => (
                    <span className="text-slate-gray">{row.waiterName}</span>
                ),
                sortValue: row => row.waiterName,
            },
            {
                id: "total",
                header: tCommon("total"),
                cell: row => (
                    <span className="font-semibold tabular-nums text-foreground">
                        {formatEtb(Number(row.total))}
                    </span>
                ),
                sortValue: row => Number(row.total),
                className: "text-right",
                headerClassName: "text-right",
            },
            {
                id: "status",
                header: tCommon("status"),
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="size-3" />
                        Awaiting Payment
                    </span>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: row => (
                    <div className="flex items-center justify-end gap-1.5">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 rounded-full px-2.5 text-[11px]"
                            onClick={() =>
                                setActiveReceipt({
                                    bill: row,
                                    tableDisplayName: row.tableDisplayName,
                                    waiterName: row.waiterName,
                                    cashierName:
                                        currentUserDisplayName ||
                                        row.cashierName ||
                                        undefined,
                                })
                            }
                        >
                            <Receipt className="size-3" />
                            <span>Receipt</span>
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 gap-1.5 rounded-full bg-primary px-3 text-[11px] font-semibold text-white shadow-xs hover:bg-primary/90"
                            onClick={() => setPayModalBill(row)}
                        >
                            <CreditCard className="size-3" />
                            <span>Collect</span>
                        </Button>
                    </div>
                ),
            },
        ],
        [tCashier, tCommon],
    );

    if (requestsLoading && activeBillsLoading) {
        return <CashierBillsSkeleton />;
    }

    if (requestsError && activeBillsError) {
        return <p className="text-[13px] text-red-600">{tCommon("error")}</p>;
    }

    return (
        <div className="space-y-5">
            {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

            {currentShift && !currentShift.clockedIn ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card p-4 dark:border-amber-600/30">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="size-5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-foreground">
                                    Off The Clock — Bill Generation Locked
                                </p>
                                {currentShift.upcomingAssignment
                                    ?.definitionName ? (
                                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-semibold">
                                        Scheduled:{" "}
                                        {
                                            currentShift.upcomingAssignment
                                                .definitionName
                                        }
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                You are currently off the clock. Clock in to an
                                open shift session to generate receipts and
                                accept customer payments.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/cashier/shift"
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 dark:bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors self-start sm:self-auto"
                    >
                        <LogIn className="size-3.5" />
                        <span>Go to Shift Desk</span>
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>
            ) : null}

            {currentShift?.clockedIn && shiftExpiry.isPast ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-rose-300/80 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-card p-4 dark:border-rose-700/40">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="size-5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-foreground">
                                    Scheduled Shift Ended (
                                    {shiftExpiry.minutesOverdue}m Overtime)
                                </p>
                                <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-bold">
                                    Wrapping Up Allowed
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                You can finish remaining pending bills, but your
                                scheduled shift has passed. Please complete
                                transactions and hand over the cash drawer to
                                the incoming cashier.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Link
                            href="/cashier/shift"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 dark:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors"
                        >
                            <ArrowRightLeft className="size-3.5" />
                            <span>Go to Handover</span>
                            <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                </div>
            ) : null}

            {/* TAB SELECTOR & VIEW MODE */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
                <div className="inline-flex rounded-full border border-hairline bg-muted/40 p-1 text-[12px]">
                    <button
                        type="button"
                        onClick={() => setActiveTab("requests")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-3.5 py-1.5 font-semibold transition-all",
                            activeTab === "requests"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <span>Pending Requests</span>
                        {requests.length > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
                                {requests.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("awaiting")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-3.5 py-1.5 font-semibold transition-all",
                            activeTab === "awaiting"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <span>Awaiting Payment</span>
                        {activeBills.length > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                                {activeBills.length}
                            </span>
                        )}
                    </button>
                </div>

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
            </div>

            {/* TAB 1: PENDING REQUESTS */}
            {activeTab === "requests" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-medium tracking-tight">
                                {tCashier("pendingRequests")}
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {tCashier("waitingCount", {
                                    count: requests.length,
                                })}
                            </p>
                        </div>
                    </div>

                    {requests.length === 0 ? (
                        <div className="rounded-[14px] border border-hairline bg-card p-6 text-center space-y-2">
                            <p className="text-[13px] text-slate-gray">
                                {tCashier("noPendingBills")}
                            </p>
                            {activeBills.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("awaiting")}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                >
                                    <span>
                                        View {activeBills.length} generated
                                        bill(s) awaiting payment
                                    </span>
                                    <ArrowRight className="size-3" />
                                </button>
                            )}
                        </div>
                    ) : view === "table" ? (
                        <DataTable
                            columns={requestColumns}
                            data={pageRequests}
                            rowKey={row => row.billRequestId}
                            empty={tCashier("noPendingBills")}
                            searchPlaceholder={null}
                            showColumnToggle={false}
                            pagination={{
                                page,
                                totalPages,
                                total: requests.length,
                                onPageChange: setPage,
                            }}
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {pageRequests.map(request => (
                                <article
                                    key={request.billRequestId}
                                    className="rounded-[14px] border border-hairline bg-card p-4"
                                >
                                    <p className="text-[12px] text-slate-gray">
                                        {tCommon("table")}{" "}
                                        {request.tableDisplayName} ·{" "}
                                        {request.waiter.displayName}
                                    </p>
                                    <p className="mt-1 text-[15px] font-medium tabular-nums tracking-tight">
                                        {formatEtb(
                                            Number(request.estimatedAmount),
                                        )}
                                    </p>
                                    <p className="mt-1 text-[12px] text-slate-gray">
                                        {tCommon("waiting")}{" "}
                                        {Math.floor(
                                            request.requestAgeSeconds / 60,
                                        )}{" "}
                                        min
                                        {request.warnings.length > 0
                                            ? ` · ${request.warnings
                                                  .join(", ")
                                                  .toLowerCase()
                                                  .replaceAll("_", " ")}`
                                            : ""}
                                    </p>
                                    {(() => {
                                        const isOff =
                                            currentShift &&
                                            !currentShift.clockedIn;
                                        return (
                                            <Button
                                                className={cn(
                                                    "mt-3 h-8 rounded-full text-[12px] font-normal",
                                                    isOff &&
                                                        "opacity-80 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100",
                                                )}
                                                disabled={
                                                    Boolean(isOff) ||
                                                    busyId ===
                                                        request.billRequestId ||
                                                    Boolean(generating)
                                                }
                                                onClick={() =>
                                                    void generate(request)
                                                }
                                            >
                                                {busyId ===
                                                request.billRequestId ? (
                                                    tCashier("generating")
                                                ) : isOff ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <Lock className="size-3" />
                                                        Clock In to Bill
                                                    </span>
                                                ) : (
                                                    tCashier("generateBill")
                                                )}
                                            </Button>
                                        );
                                    })()}
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: AWAITING PAYMENT (GENERATED BILLS) */}
            {activeTab === "awaiting" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-medium tracking-tight">
                                Bills Awaiting Settlement
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {activeBills.length} bill(s) generated and
                                awaiting cash or transfer collection
                            </p>
                        </div>
                    </div>

                    {activeBills.length === 0 ? (
                        <div className="rounded-[14px] border border-hairline bg-card p-6 text-center space-y-1">
                            <p className="text-[13px] text-slate-gray">
                                No active bills awaiting payment.
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                When a bill is generated, it stays here until
                                paid by the waiter or cashier.
                            </p>
                        </div>
                    ) : view === "table" ? (
                        <DataTable
                            columns={activeBillColumns}
                            data={pageActiveBills}
                            rowKey={row => row.billId}
                            empty="No active bills awaiting payment"
                            searchPlaceholder={null}
                            showColumnToggle={false}
                            pagination={{
                                page: awaitingPage,
                                totalPages: totalAwaitingPages,
                                total: activeBills.length,
                                onPageChange: setAwaitingPage,
                            }}
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {pageActiveBills.map(bill => (
                                <article
                                    key={bill.billId}
                                    className="rounded-[14px] border border-hairline bg-card p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                {bill.tableDisplayName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                #{bill.billNumber} · Server:{" "}
                                                {bill.waiterName}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                            Awaiting Payment
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold tabular-nums text-foreground">
                                        {formatEtb(Number(bill.total))}
                                    </p>
                                    <div className="flex items-center gap-2 pt-1 border-t border-hairline">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 flex-1 gap-1.5 rounded-full text-xs"
                                            onClick={() =>
                                                setActiveReceipt({
                                                    bill,
                                                    tableDisplayName:
                                                        bill.tableDisplayName,
                                                    waiterName: bill.waiterName,
                                                    cashierName:
                                                        currentUserDisplayName ||
                                                        bill.cashierName ||
                                                        undefined,
                                                })
                                            }
                                        >
                                            <Receipt className="size-3.5" />
                                            <span>Receipt</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 flex-1 gap-1.5 rounded-full bg-primary text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
                                            onClick={() =>
                                                setPayModalBill(bill)
                                            }
                                        >
                                            <CreditCard className="size-3.5" />
                                            <span>Collect</span>
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* RECEIPT MODAL */}
            {activeReceipt && (
                <CashierReceiptModal
                    open={Boolean(activeReceipt)}
                    onOpenChange={open => !open && setActiveReceipt(null)}
                    bill={activeReceipt.bill}
                    tableDisplayName={activeReceipt.tableDisplayName}
                    waiterName={activeReceipt.waiterName}
                    cashierName={activeReceipt.cashierName}
                />
            )}

            {/* COLLECT PAYMENT MODAL */}
            {payModalBill && payModalBill.tableSessionId ? (
                <Dialog
                    open={Boolean(payModalBill)}
                    onOpenChange={open => !open && setPayModalBill(null)}
                >
                    <DialogContent className="max-w-md p-6">
                        <div className="flex items-center justify-between pb-3 border-b border-hairline">
                            <div>
                                <h3 className="text-base font-bold text-foreground">
                                    Collect Payment ·{" "}
                                    {payModalBill.tableDisplayName}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Bill #{payModalBill.billNumber} · Server:{" "}
                                    {payModalBill.waiterName}
                                </p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <WaiterPaymentPanel
                                bill={payModalBill}
                                tableSessionId={payModalBill.tableSessionId}
                                onSuccess={() => setPayModalBill(null)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            ) : null}
        </div>
    );
}
