"use client";

import { useEffect, useMemo, useState } from "react";
import {
    useCashierBillRequestsQuery,
    useGenerateBillMutation,
} from "@/context/services/billingApi";
import { Bill } from "@/domains/billing/domain/billingApi";
import { CashierReceiptModal } from "@/domains/payments/ui/CashierReceiptModal";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    ArrowRightLeft,
    LayoutGrid,
    Lock,
    LogIn,
    Table2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCurrentShiftQuery } from "@/context/services/shiftsApi";
import { checkShiftExpiry } from "@/domains/identity/domain/shift";
import { useTranslations } from "next-intl";
import { CashierBillsSkeleton } from "@/components/custom/molecules/Skeletons";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";

type ViewMode = "table" | "cards";

export default function CashierBillRequests() {
    const tCashier = useTranslations("cashier");
    const tCommon = useTranslations("common");
    const [view, setView] = useState<ViewMode>("table");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    const pollMs = useRealtimePollMs(12_000);
    const { data, isLoading, isError } = useCashierBillRequestsQuery(
        undefined,
        { pollingInterval: pollMs, refetchOnFocus: true },
    );
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
    } | null>(null);
    const [recentGeneratedBills, setRecentGeneratedBills] = useState<
        Array<{
            bill: Bill;
            tableDisplayName: string;
            waiterName: string;
            generatedTime: string;
        }>
    >([]);

    const requests = data?.data ?? [];
    const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
    const pageRequests = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return requests.slice(start, start + PAGE_SIZE);
    }, [requests, page]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

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

            const item = {
                bill,
                tableDisplayName: request.tableDisplayName || tCommon("table"),
                waiterName: request.waiter?.displayName || tCommon("waiter"),
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
                tableDisplayName: request.tableDisplayName || tCommon("table"),
                waiterName: request.waiter?.displayName || tCommon("waiter"),
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
        } catch (err) {
            const message = tCashier("billGenerateError");
            setError(message);
            toast.fromUnknown(err, message);
        } finally {
            setBusyId("");
        }
    }

    const columns = useMemo<DataTableColumn<(typeof requests)[number]>[]>(
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

    if (isLoading) {
        return <CashierBillsSkeleton />;
    }

    if (isError) {
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

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[13px] font-medium tracking-tight">
                        {tCashier("pendingRequests")}
                    </p>
                    <p className="text-[12px] text-slate-gray">
                        {tCashier("waitingCount", { count: requests.length })}
                    </p>
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

            {requests.length === 0 ? (
                <p className="rounded-[14px] border border-hairline bg-card p-5 text-[13px] text-slate-gray">
                    {tCashier("noPendingBills")}
                </p>
            ) : view === "table" ? (
                <DataTable
                    columns={columns}
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
                                {tCommon("table")} {request.tableDisplayName} ·{" "}
                                {request.waiter.displayName}
                            </p>
                            <p className="mt-1 text-[15px] font-medium tabular-nums tracking-tight">
                                {formatEtb(Number(request.estimatedAmount))}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-gray">
                                {tCommon("waiting")}{" "}
                                {Math.floor(request.requestAgeSeconds / 60)} min
                                {request.warnings.length > 0
                                    ? ` · ${request.warnings
                                          .join(", ")
                                          .toLowerCase()
                                          .replaceAll("_", " ")}`
                                    : ""}
                            </p>
                            {(() => {
                                const isOff =
                                    currentShift && !currentShift.clockedIn;
                                return (
                                    <Button
                                        className={cn(
                                            "mt-3 h-8 rounded-full text-[12px] font-normal",
                                            isOff &&
                                                "opacity-80 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100",
                                        )}
                                        disabled={
                                            Boolean(isOff) ||
                                            busyId === request.billRequestId ||
                                            Boolean(generating)
                                        }
                                        onClick={() => void generate(request)}
                                    >
                                        {busyId === request.billRequestId ? (
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

            {recentGeneratedBills.length > 0 ? (
                <div className="space-y-3">
                    <div>
                        <p className="text-[13px] font-medium tracking-tight">
                            Generated this session
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            {recentGeneratedBills.length} ready to print
                        </p>
                    </div>
                    <div className="overflow-x-auto rounded-[14px] border border-hairline">
                        <table className="w-full min-w-[520px] text-left text-[12px]">
                            <thead className="border-b border-hairline bg-muted/30 text-slate-gray">
                                <tr>
                                    <th className="px-4 py-2.5 font-medium">
                                        Table
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Waiter
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Bill
                                    </th>
                                    <th className="px-4 py-2.5 font-medium text-right">
                                        Total
                                    </th>
                                    <th className="px-4 py-2.5 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {recentGeneratedBills.map(item => (
                                    <tr
                                        key={item.bill.billId}
                                        className="border-b border-hairline last:border-0"
                                    >
                                        <td className="px-4 py-2.5">
                                            {item.tableDisplayName}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-gray">
                                            {item.waiterName}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-gray">
                                            #{item.bill.billNumber} ·{" "}
                                            {item.generatedTime}
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                            {formatEtb(Number(item.bill.total))}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 rounded-full px-2 text-[12px] font-normal"
                                                onClick={() =>
                                                    setActiveReceipt({
                                                        bill: item.bill,
                                                        tableDisplayName:
                                                            item.tableDisplayName,
                                                        waiterName:
                                                            item.waiterName,
                                                    })
                                                }
                                            >
                                                Receipt
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

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
