"use client";

import { useMemo, useState } from "react";
import {
    ArrowLeft,
    BellRing,
    CheckCircle2,
    ChefHat,
    Clock,
    MapPin,
    Plus,
    QrCode,
    Receipt,
    User,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import {
    useCancelBillRequestMutation,
    useRequestBillMutation,
    useSessionBillQuery,
} from "@/context/services/billingApi";
import {
    useCloseTableSessionMutation,
    useStartTableSessionMutation,
    useWaiterTablesQuery,
} from "@/context/services/floorApi";
import {
    useTableSessionOrdersQuery,
    useSendToKitchenMutation,
} from "@/context/services/ordersApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import AddOrderMenu from "@/domains/floor/ui/AddOrderMenu";
import WaiterMarkServedButton from "@/domains/floor/ui/WaiterMarkServedButton";
import WaiterOrderItemActions from "@/domains/floor/ui/WaiterOrderItemActions";
import { lineTotal } from "@/domains/ordering/application/mapWaiterMenu";
import WaiterPaymentPanel from "@/domains/payments/ui/WaiterPaymentPanel";
import { CashierReceiptModal } from "@/domains/payments/ui/CashierReceiptModal";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TableDetailSkeleton } from "@/components/custom/molecules/Skeletons";

const ORDERABLE = new Set(["OPEN", "ACTIVE_ORDER", "ATTENTION_REQUIRED"]);
const REQUESTABLE = new Set(["OPEN", "ACTIVE_ORDER", "ATTENTION_REQUIRED"]);

function itemStateInfo(state: string, tWaiter?: (key: string) => string) {
    if (state === "CONFIRMED") {
        return {
            label: tWaiter
                ? tWaiter("needsSendToKitchen")
                : "Needs Send to Kitchen",
            icon: <ChefHat className="size-3 text-amber-500 animate-pulse" />,
            badgeClass:
                "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold",
        };
    }
    if (state === "READY") {
        return {
            label: tWaiter ? tWaiter("readyToServe") : "Ready to serve",
            icon: (
                <BellRing className="size-3 animate-bounce text-emerald-500" />
            ),
            badgeClass:
                "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        };
    }
    if (state === "IN_PREPARATION" || state === "COOKING") {
        return {
            label: tWaiter ? tWaiter("cooking") : "Cooking in station",
            icon: <ChefHat className="size-3 text-amber-500" />,
            badgeClass:
                "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        };
    }
    if (state === "QUEUED") {
        return {
            label: tWaiter ? tWaiter("queued") : "Queued",
            icon: <Clock className="size-3 text-sky-500" />,
            badgeClass:
                "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
        };
    }
    if (state === "SERVED") {
        return {
            label: tWaiter ? tWaiter("served") : "Served",
            icon: <CheckCircle2 className="size-3 text-slate-gray" />,
            badgeClass: "bg-secondary text-slate-gray border-hairline",
        };
    }
    return {
        label: state.replaceAll("_", " "),
        icon: <Clock className="size-3 text-slate-gray" />,
        badgeClass: "bg-secondary text-slate-gray border-hairline",
    };
}

function sessionLabel(status: string | null | undefined) {
    if (!status) return "OPEN";
    return status.replaceAll("_", " ");
}

export default function WaiterTableDetail({ tableId }: { tableId: string }) {
    const clockedIn = Boolean(
        useAppSelector(state => state.identity.session?.shiftSessionId),
    );
    const { data, isLoading, isError } = useWaiterTablesQuery("all", {
        pollingInterval: 5000,
    });
    const [startSession, { isLoading: starting }] =
        useStartTableSessionMutation();
    const [closeSession, { isLoading: closing }] =
        useCloseTableSessionMutation();
    const [requestBill, { isLoading: requesting }] = useRequestBillMutation();
    const [cancelBillRequest, { isLoading: cancelling }] =
        useCancelBillRequestMutation();
    const [sendToKitchen, { isLoading: isSendingToKitchen }] =
        useSendToKitchenMutation();
    const tWaiter = useTranslations("waiter");
    const tCommon = useTranslations("common");
    const staff = useAppSelector(selectCurrentStaff);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);

    const table = data?.data.find(entry => entry.tableId === tableId);
    const sessionId = table?.tableSessionId ?? "";
    const { data: orders } = useTableSessionOrdersQuery(sessionId, {
        skip: !sessionId,
        pollingInterval: 5000,
    });
    const { data: billing } = useSessionBillQuery(sessionId, {
        skip: !sessionId,
        pollingInterval: 5000,
    });
    const tickets = useMemo(() => orders?.data ?? [], [orders?.data]);
    const itemCount = useMemo(
        () => tickets.reduce((sum, order) => sum + order.items.length, 0),
        [tickets],
    );
    const sessionStatus =
        billing?.tableSession.status ?? table?.sessionStatus ?? null;
    const sessionVersion = billing?.tableSession.version ?? table?.version ?? 1;
    const bill = billing?.bill ?? null;
    const pendingRequest =
        billing?.billRequest?.status === "PENDING" ? billing.billRequest : null;

    // Running tab calculation
    const runningTotal = useMemo(() => {
        if (bill?.total) return Number(bill.total);
        return tickets.reduce((sum, order) => {
            return (
                sum +
                order.items.reduce(
                    (itemSum, item) =>
                        itemSum +
                        lineTotal(
                            item.unitPrice,
                            item.quantity,
                            item.modifiers,
                        ),
                    0,
                )
            );
        }, 0);
    }, [bill, tickets]);

    const pendingKitchenCount = useMemo(() => {
        return tickets.reduce(
            (sum, order) =>
                sum + order.items.filter(i => i.state === "CONFIRMED").length,
            0,
        );
    }, [tickets]);

    async function onSendToKitchen(orderId?: string) {
        if (!sessionId) return;
        setError("");
        try {
            const res = await sendToKitchen({
                tableSessionId: sessionId,
                orderId,
            }).unwrap();
            toast.success(
                "Sent to Kitchen!",
                res.message ||
                    "Items have been dispatched to kitchen stations.",
            );
        } catch (err) {
            const message = "Could not send items to kitchen stations.";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function takeTable() {
        setError("");
        if (!clockedIn) {
            const message = "Clock in before taking a table.";
            setError(message);
            toast.error(message);
            return;
        }
        try {
            await startSession({ tableId }).unwrap();
            toast.success("Table taken");
        } catch (err) {
            const message =
                "Could not take this table. It may already be occupied.";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function releaseTable() {
        if (!table?.tableSessionId) return;
        setError("");
        try {
            await closeSession({
                tableSessionId: table.tableSessionId,
                expectedVersion: sessionVersion,
            }).unwrap();
            toast.success("Table closed");
        } catch (err) {
            if (err && typeof err === "object" && "data" in err) {
                const code = (err as { data?: { code?: string } }).data?.code;
                if (code === "TABLE_CLOSE_BLOCKED") {
                    const message =
                        "This table still has an order. Finish payment before closing.";
                    setError(message);
                    toast.error(message);
                    return;
                }
            }
            const message = "Could not close this table.";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function onRequestBill() {
        if (!table?.tableSessionId) return;
        setError("");
        try {
            await requestBill({
                tableSessionId: table.tableSessionId,
                expectedTableSessionVersion: sessionVersion,
            }).unwrap();
            toast.success("Bill requested", "Cashier has been notified.");
        } catch (err) {
            const message =
                "Could not request the bill. Refresh and try again.";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function onResumeOrdering() {
        if (!table?.tableSessionId || !pendingRequest) return;
        setError("");
        try {
            await cancelBillRequest({
                billRequestId: pendingRequest.billRequestId,
                tableSessionId: table.tableSessionId,
            }).unwrap();
            toast.success("Ordering resumed");
        } catch (err) {
            const message = "Could not resume ordering.";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    if (isLoading) {
        return <TableDetailSkeleton />;
    }

    if (isError || !table) {
        return (
            <div className="space-y-4">
                <Link
                    href="/waiter/tables"
                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    <span>{tWaiter("backToFloor")}</span>
                </Link>
                <div className="rounded-[18px] border border-hairline bg-card p-8 text-center text-slate-gray">
                    <p className="font-semibold text-foreground">
                        {tWaiter("tableNotFound")}
                    </p>
                    <p className="mt-1 text-sm">
                        {tWaiter("tableNotFoundDesc")}
                    </p>
                </div>
            </div>
        );
    }

    const occupied = Boolean(table.tableSessionId);
    const canOrder =
        occupied &&
        table.mine &&
        clockedIn &&
        ORDERABLE.has(sessionStatus ?? "");
    const canRequestBill =
        occupied &&
        table.mine &&
        clockedIn &&
        itemCount > 0 &&
        REQUESTABLE.has(sessionStatus ?? "") &&
        !bill;
    const canClosePaid = occupied && table.mine && sessionStatus === "PAID";
    const canCloseEmpty =
        occupied &&
        table.mine &&
        itemCount === 0 &&
        table.readyItemCount === 0 &&
        table.cookingItemCount === 0 &&
        sessionStatus !== "PAID";

    return (
        <div className="space-y-6 pb-16 animate-in fade-in duration-150">
            {/* 1. TOP BREADCRUMB */}
            <div>
                <Link
                    href="/waiter/tables"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand transition-colors hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    <span>{tWaiter("backToFloorOverview")}</span>
                </Link>
            </div>

            {/* 2. TABLE HERO HEADER CARD (Modern POS Standard) */}
            <div className="flex flex-col justify-between gap-4 rounded-[22px] border border-hairline bg-card p-5 shadow-subtle sm:p-6 lg:flex-row lg:items-center">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-[22px] font-semibold tracking-tight text-foreground md:text-[24px]">
                            {tCommon("table")} {tableNumber(table)}
                        </h1>
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                occupied
                                    ? "border-brand/30 bg-brand/10 text-brand"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            )}
                        >
                            <span
                                className={cn(
                                    "size-2 rounded-full",
                                    occupied
                                        ? "bg-brand animate-pulse"
                                        : "bg-emerald-500",
                                )}
                            />
                            <span>
                                {occupied
                                    ? `${tWaiter("inService")} · ${sessionLabel(sessionStatus)}`
                                    : tWaiter("available")}
                            </span>
                        </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[13px] text-slate-gray">
                        {table.locationName ? (
                            <div className="flex items-center gap-1 font-medium">
                                <MapPin className="size-3.5 text-slate-gray/80" />
                                <span>{table.locationName}</span>
                            </div>
                        ) : null}

                        {occupied && table.waiterName ? (
                            <div className="flex items-center gap-1 font-medium text-foreground">
                                <User className="size-3.5 text-brand" />
                                <span>
                                    {tWaiter("server")}:{" "}
                                    <strong>{table.waiterName}</strong>
                                </span>
                            </div>
                        ) : null}

                        {table.guestCount ? (
                            <div className="flex items-center gap-1 font-medium">
                                <Users className="size-3.5 text-slate-gray/80" />
                                <span>
                                    {table.guestCount} {tWaiter("guests")}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Right Hero Controls: Running Tab & Quick Actions */}
                <div className="flex flex-wrap items-center gap-3 border-t border-hairline/60 pt-3 lg:border-t-0 lg:pt-0">
                    {occupied ? (
                        <div className="rounded-[14px] bg-secondary/50 px-3.5 py-1.5 text-right">
                            <span className="text-[11px] font-medium text-slate-gray uppercase">
                                {tWaiter("runningTab")}
                            </span>
                            <p className="text-[16px] font-semibold text-foreground">
                                {formatEtb(runningTotal)}
                            </p>
                        </div>
                    ) : null}

                    {pendingKitchenCount > 0 && table.mine ? (
                        <Button
                            onClick={() => onSendToKitchen()}
                            disabled={isSendingToKitchen}
                            className="h-9 gap-1.5 rounded-full bg-amber-600 hover:bg-amber-700 px-4 text-[13px] font-bold text-white shadow-sm animate-pulse"
                        >
                            <ChefHat className="size-4" />
                            <span>
                                {isSendingToKitchen
                                    ? tWaiter("sending")
                                    : `${tWaiter("sendToKitchen")} (${pendingKitchenCount})`}
                            </span>
                        </Button>
                    ) : null}

                    {canOrder ? (
                        <Button
                            onClick={() => setMenuOpen(true)}
                            className="h-9 rounded-full bg-brand px-4 text-[13px] font-medium text-white shadow-xs hover:bg-brand-deep"
                        >
                            <Plus className="mr-1.5 size-4" />
                            <span>{tWaiter("addOrder")}</span>
                        </Button>
                    ) : null}

                    {!occupied && clockedIn ? (
                        <Button
                            className="h-9 rounded-full bg-brand px-5 text-[13px] font-medium text-white shadow-xs hover:bg-brand-deep"
                            disabled={starting}
                            onClick={takeTable}
                        >
                            {starting
                                ? tCommon("loading")
                                : tWaiter("startSession")}
                        </Button>
                    ) : null}
                </div>
            </div>

            {error ? (
                <div className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-3.5 text-[13px] font-medium text-destructive">
                    {error}
                </div>
            ) : null}

            {occupied && !table.mine ? (
                <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 p-4 text-[14px] font-semibold text-amber-900 dark:text-amber-200">
                    {tWaiter("assignedWarning")}
                </div>
            ) : null}

            {/* 2.5 BILL READY BANNER (Instant Visibility for Waiter) */}
            {bill &&
            table.tableSessionId &&
            bill.status !== "PAID" &&
            bill.status !== "CLOSED" ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[20px] border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4.5 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Receipt className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                    Bill Ready to Deliver
                                </span>
                                <span className="text-xs text-slate-gray font-mono">
                                    Bill #{bill.billNumber}
                                </span>
                            </div>
                            <p className="text-[18px] font-bold text-foreground mt-0.5">
                                {formatEtb(Number(bill.total))}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setReceiptModalOpen(true)}
                            className="h-9 gap-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 shadow-xs"
                        >
                            <QrCode className="size-3.5 text-amber-400" />
                            <span>Show QR E-Receipt</span>
                        </Button>
                    </div>
                </div>
            ) : null}

            {/* 3. SPLIT WORKSPACE: ACTIVE ORDERS (LEFT) & TABLE SUMMARY (RIGHT) */}
            {occupied && table.mine ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* LEFT COLUMN: LIVE TICKETS (7 or 8 cols on desktop) */}
                    <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-[15px] font-semibold text-foreground">
                                    {tWaiter("kitchenTickets")}
                                </h2>
                                <p className="text-[12.5px] text-slate-gray">
                                    {itemCount} {tCommon("items")}
                                </p>
                            </div>
                            {canOrder ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMenuOpen(true)}
                                    className="h-8 gap-1.5 rounded-full border-hairline text-xs font-medium"
                                >
                                    <Plus className="size-3.5 text-brand" />
                                    <span>{tWaiter("addMore")}</span>
                                </Button>
                            ) : null}
                        </div>

                        {tickets.length > 0 ? (
                            <div className="space-y-4">
                                {tickets.map((order, orderIndex) => (
                                    <div
                                        key={order.orderId}
                                        className="overflow-hidden rounded-[18px] border border-hairline bg-card shadow-subtle"
                                    >
                                        {/* Ticket Header */}
                                        <div className="flex items-center justify-between border-b border-hairline bg-secondary/30 px-4 py-2.5 text-[12.5px]">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3.5 text-slate-gray" />
                                                <span className="font-medium text-foreground">
                                                    {tWaiter("ticket")} #
                                                    {orderIndex + 1}
                                                </span>
                                                <span className="text-slate-gray">
                                                    ·{" "}
                                                    {new Date(
                                                        order.confirmedAt,
                                                    ).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {order.items.some(
                                                    i =>
                                                        i.state === "CONFIRMED",
                                                ) && table.mine ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            onSendToKitchen(
                                                                order.orderId,
                                                            )
                                                        }
                                                        disabled={
                                                            isSendingToKitchen
                                                        }
                                                        className="h-6 gap-1 rounded-full bg-amber-600 hover:bg-amber-700 px-2.5 text-[11px] font-bold text-white shadow-xs"
                                                    >
                                                        <ChefHat className="size-3" />
                                                        <span>
                                                            {tWaiter(
                                                                "sendToKitchen",
                                                            )}
                                                        </span>
                                                    </Button>
                                                ) : null}
                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-slate-gray">
                                                    {order.items.length}{" "}
                                                    {tCommon("items")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ticket Line Items */}
                                        <div className="divide-y divide-hairline/60 p-2">
                                            {order.items.map(item => {
                                                const stateInfo = itemStateInfo(
                                                    item.state,
                                                    tWaiter,
                                                );
                                                const extras = [
                                                    item.modifiers
                                                        .map(
                                                            entry => entry.name,
                                                        )
                                                        .join(" · "),
                                                    item.specialInstruction ??
                                                        "",
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ");

                                                return (
                                                    <div
                                                        key={item.orderItemId}
                                                        className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex size-5 items-center justify-center rounded bg-brand/10 text-[11px] font-semibold text-brand">
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                    ×
                                                                </span>
                                                                <span className="text-[14px] font-medium text-foreground">
                                                                    {
                                                                        item.itemName
                                                                    }
                                                                </span>
                                                            </div>

                                                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                                                                {/* Station Tag */}
                                                                <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-medium text-slate-gray">
                                                                    {
                                                                        item.stationName
                                                                    }
                                                                </span>

                                                                {/* State Tag */}
                                                                <span
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold",
                                                                        stateInfo.badgeClass,
                                                                    )}
                                                                >
                                                                    {
                                                                        stateInfo.icon
                                                                    }
                                                                    <span>
                                                                        {
                                                                            stateInfo.label
                                                                        }
                                                                    </span>
                                                                </span>

                                                                {/* Extras / Notes */}
                                                                {extras ? (
                                                                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                                                                        🏷️{" "}
                                                                        {extras}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        {/* Price & Actions */}
                                                        <div className="flex items-center justify-between gap-3 border-t border-hairline/40 pt-2 sm:border-t-0 sm:pt-0">
                                                            <span className="text-[14px] font-semibold text-foreground">
                                                                {formatEtb(
                                                                    lineTotal(
                                                                        item.unitPrice,
                                                                        item.quantity,
                                                                        item.modifiers,
                                                                    ),
                                                                )}
                                                            </span>

                                                            <div className="flex items-center gap-2">
                                                                {item.state ===
                                                                    "CONFIRMED" &&
                                                                table.mine ? (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            onSendToKitchen(
                                                                                order.orderId,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isSendingToKitchen
                                                                        }
                                                                        className="h-7 gap-1 rounded-full bg-amber-600 hover:bg-amber-700 px-2.5 text-[11px] font-bold text-white shadow-xs"
                                                                    >
                                                                        <ChefHat className="size-3" />
                                                                        <span>
                                                                            {tWaiter(
                                                                                "sendToKitchen",
                                                                            )}
                                                                        </span>
                                                                    </Button>
                                                                ) : null}
                                                                {table.tableSessionId ? (
                                                                    <>
                                                                        <WaiterMarkServedButton
                                                                            item={
                                                                                item
                                                                            }
                                                                            tableSessionId={
                                                                                table.tableSessionId
                                                                            }
                                                                        />
                                                                        <WaiterOrderItemActions
                                                                            item={
                                                                                item
                                                                            }
                                                                            tableSessionId={
                                                                                table.tableSessionId
                                                                            }
                                                                        />
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-hairline bg-card p-10 text-center text-slate-gray">
                                <div className="flex size-14 items-center justify-center rounded-full bg-secondary/60">
                                    <UtensilsCrossed className="size-6 opacity-40 text-brand" />
                                </div>
                                <div>
                                    <p className="text-[16px] font-bold text-foreground">
                                        {tWaiter("noOrders")}
                                    </p>
                                    <p className="mt-1 text-[13px] text-slate-gray">
                                        {tWaiter("openMenuToOrder")}
                                    </p>
                                </div>
                                {canOrder ? (
                                    <Button
                                        onClick={() => setMenuOpen(true)}
                                        className="mt-2 rounded-full bg-brand px-5 font-bold text-white shadow-sm hover:bg-brand-deep"
                                    >
                                        <Plus className="mr-1.5 size-4" />
                                        <span>{tWaiter("addFirstOrder")}</span>
                                    </Button>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: TABLE TAB & ACTIONS (5 or 4 cols on desktop) */}
                    <div className="space-y-4 lg:col-span-5 xl:col-span-4">
                        {/* Tab & Bill Summary Card */}
                        <div className="rounded-[18px] border border-hairline bg-card p-4.5 shadow-subtle space-y-3.5">
                            <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                                <div className="flex items-center gap-2">
                                    <Receipt className="size-4 text-brand" />
                                    <h3 className="text-[14px] font-semibold text-foreground">
                                        {tWaiter("tabSummary")}
                                    </h3>
                                </div>
                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-slate-gray">
                                    {tCommon("table")} {tableNumber(table)}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-[13px]">
                                <div className="flex justify-between text-slate-gray">
                                    <span>{tWaiter("itemsOrdered")}</span>
                                    <span className="font-medium text-foreground">
                                        {itemCount}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-gray">
                                    <span>{tCommon("subtotal")}</span>
                                    <span className="font-medium text-foreground">
                                        {formatEtb(runningTotal)}
                                    </span>
                                </div>
                                <div className="border-t border-hairline pt-2 flex items-center justify-between text-[15px] font-semibold text-foreground">
                                    <span>{tWaiter("totalTab")}</span>
                                    <span>{formatEtb(runningTotal)}</span>
                                </div>
                            </div>

                            {/* Pending Bill Request Notice */}
                            {sessionStatus === "BILL_REQUESTED" &&
                            pendingRequest ? (
                                <div className="rounded-[14px] border border-purple-500/30 bg-purple-500/10 p-3.5 text-purple-900 dark:text-purple-200">
                                    <p className="text-[13px] font-bold">
                                        {tWaiter("billRequested")}
                                    </p>
                                    <p className="mt-0.5 text-[12px] opacity-80">
                                        {tWaiter("cancelBill")}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2.5 w-full rounded-full border-hairline font-semibold"
                                        disabled={cancelling}
                                        onClick={onResumeOrdering}
                                    >
                                        {cancelling
                                            ? tCommon("loading")
                                            : tWaiter("cancelBill")}
                                    </Button>
                                </div>
                            ) : null}

                            {/* Bill generated details */}
                            {bill && table.tableSessionId ? (
                                <div className="space-y-3 border-t border-hairline pt-3">
                                    <div className="rounded-[14px] bg-secondary/40 p-3 space-y-2">
                                        <div className="flex justify-between text-[12px] font-semibold text-slate-gray">
                                            <span>BILL #{bill.billNumber}</span>
                                            <span className="text-foreground font-bold">
                                                {formatEtb(Number(bill.total))}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setReceiptModalOpen(true)
                                            }
                                            className="w-full h-8 gap-1.5 rounded-xl border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                                        >
                                            <QrCode className="size-3.5 text-amber-600" />
                                            <span>View & Show QR Receipt</span>
                                        </Button>
                                    </div>
                                    <WaiterPaymentPanel
                                        bill={bill}
                                        tableSessionId={table.tableSessionId}
                                    />
                                </div>
                            ) : null}

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-1.5">
                                {canRequestBill ? (
                                    <Button
                                        className="h-10 w-full rounded-full bg-brand text-[13px] font-medium text-white shadow-xs hover:bg-brand-deep"
                                        disabled={requesting}
                                        onClick={onRequestBill}
                                    >
                                        <Receipt className="mr-1.5 size-4" />
                                        <span>
                                            {requesting
                                                ? tCommon("loading")
                                                : tWaiter("requestBill")}
                                        </span>
                                    </Button>
                                ) : null}

                                {canClosePaid || canCloseEmpty ? (
                                    <Button
                                        variant="outline"
                                        className="h-10 w-full rounded-full border-hairline text-[13px] font-medium"
                                        disabled={closing}
                                        onClick={releaseTable}
                                    >
                                        {closing
                                            ? tCommon("loading")
                                            : canClosePaid
                                              ? tWaiter("closePaidTable")
                                              : tWaiter("closeEmptyTable")}
                                    </Button>
                                ) : itemCount > 0 &&
                                  sessionStatus !== "PAID" ? (
                                    <p className="text-center text-[12px] text-slate-gray">
                                        {tWaiter("closeAfterPayment")}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* FULL SCREEN POS ORDERING SCREEN */}
            {menuOpen && table.tableSessionId ? (
                <AddOrderMenu
                    tableSessionId={table.tableSessionId}
                    expectedVersion={sessionVersion}
                    tableLabel={`${tCommon("table")} ${tableNumber(table)}`}
                    onClose={() => setMenuOpen(false)}
                />
            ) : null}

            {/* Waiter QR E-Receipt & Bill Modal */}
            {bill ? (
                <CashierReceiptModal
                    open={receiptModalOpen}
                    onOpenChange={setReceiptModalOpen}
                    bill={bill}
                    tableDisplayName={tableNumber(table)}
                    waiterName={table.waiterName || staff?.name || "Server"}
                    showSendToWaiter={false}
                    showPrintActions={false}
                />
            ) : null}
        </div>
    );
}
