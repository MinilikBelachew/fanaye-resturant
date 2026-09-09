"use client";

import { useState } from "react";
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
import { useTableSessionOrdersQuery } from "@/context/services/ordersApi";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import AddOrderMenu from "@/domains/floor/ui/AddOrderMenu";
import WaiterMarkServedButton from "@/domains/floor/ui/WaiterMarkServedButton";
import WaiterOrderItemActions from "@/domains/floor/ui/WaiterOrderItemActions";
import { lineTotal } from "@/domains/ordering/application/mapWaiterMenu";
import WaiterPaymentPanel from "@/domains/payments/ui/WaiterPaymentPanel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";

const ORDERABLE = new Set(["OPEN", "ACTIVE_ORDER", "ATTENTION_REQUIRED"]);
const REQUESTABLE = new Set(["OPEN", "ACTIVE_ORDER", "ATTENTION_REQUIRED"]);

function itemStateLabel(state: string) {
    if (state === "READY") return "Ready to serve";
    if (state === "SERVED") return "Served";
    return state.replaceAll("_", " ");
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
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

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
    const tickets = orders?.data ?? [];
    const itemCount = tickets.reduce(
        (sum, order) => sum + order.items.length,
        0,
    );
    const sessionStatus =
        billing?.tableSession.status ?? table?.sessionStatus ?? null;
    const sessionVersion = billing?.tableSession.version ?? table?.version ?? 1;
    const bill = billing?.bill ?? null;
    const pendingRequest =
        billing?.billRequest?.status === "PENDING" ? billing.billRequest : null;

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
        return <p className="text-slate-gray">Loading table…</p>;
    }

    if (isError || !table) {
        return (
            <div>
                <Link href="/waiter/tables" className="text-brand">
                    ← Floor
                </Link>
                <p className="mt-3 text-slate-gray">Table not found.</p>
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
        <div>
            <Link href="/waiter/tables" className="text-[14px] text-brand">
                ← Floor
            </Link>
            <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-[28px] font-semibold md:text-[32px]">
                        Table {tableNumber(table)}
                    </h1>
                    <p className="text-[13px] text-slate-gray">
                        {table.locationName}
                    </p>
                    <p className="text-[14px] text-slate-gray">
                        {occupied
                            ? `${table.waiterName ?? "Waiter"} · ${sessionLabel(sessionStatus)}`
                            : "No guests yet. Take this table to start a visit."}
                    </p>
                    {table.guestCount ? (
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {table.guestCount} guests
                        </p>
                    ) : null}
                </div>
            </div>

            {error ? (
                <p className="mt-3 text-[13px] text-red-600">{error}</p>
            ) : null}

            {!occupied && clockedIn ? (
                <Button
                    className="mt-4"
                    disabled={starting}
                    onClick={takeTable}
                >
                    {starting ? "Opening…" : "Take table"}
                </Button>
            ) : null}

            {occupied && table.mine ? (
                <div className="mt-6 space-y-3">
                    {canOrder ? (
                        <Button onClick={() => setMenuOpen(true)}>
                            Add order
                        </Button>
                    ) : null}

                    {sessionStatus === "BILL_REQUESTED" && pendingRequest ? (
                        <div className="rounded-[16px] border border-hairline bg-card p-4">
                            <p className="font-medium">Bill requested</p>
                            <p className="mt-1 text-[14px] text-slate-gray">
                                Waiting for cashier to generate the bill.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-3"
                                disabled={cancelling}
                                onClick={onResumeOrdering}
                            >
                                {cancelling ? "Resuming…" : "Resume ordering"}
                            </Button>
                        </div>
                    ) : null}

                    {bill && table.tableSessionId ? (
                        <div className="space-y-3">
                            <div className="rounded-[16px] border border-hairline bg-card p-4">
                                <p className="text-[12px] font-medium tracking-wide text-slate-gray uppercase">
                                    Bill {bill.billNumber}
                                </p>
                                <p className="mt-1 text-[22px] font-semibold">
                                    {formatEtb(Number(bill.total))}
                                </p>
                                <ul className="mt-3 space-y-1 text-[14px]">
                                    {bill.lines.map(line => (
                                        <li
                                            key={line.billLineId}
                                            className="flex justify-between gap-3"
                                        >
                                            <span>
                                                {line.quantity}× {line.itemName}
                                            </span>
                                            <span className="font-medium">
                                                {formatEtb(
                                                    Number(line.lineTotal),
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <WaiterPaymentPanel
                                bill={bill}
                                tableSessionId={table.tableSessionId}
                            />
                        </div>
                    ) : null}

                    {tickets.length > 0 ? (
                        <div className="space-y-3">
                            {tickets.map(order => (
                                <div
                                    key={order.orderId}
                                    className="rounded-[16px] border border-hairline bg-card p-4"
                                >
                                    <p className="text-[12px] font-medium tracking-wide text-slate-gray uppercase">
                                        {new Date(
                                            order.confirmedAt,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                    <ul className="mt-2 space-y-2">
                                        {order.items.map(item => {
                                            const extras = [
                                                item.modifiers
                                                    .map(entry => entry.name)
                                                    .join(" · "),
                                                item.specialInstruction ?? "",
                                            ]
                                                .filter(Boolean)
                                                .join(" · ");
                                            return (
                                                <li
                                                    key={item.orderItemId}
                                                    className="flex items-start justify-between gap-3 text-[14px]"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium">
                                                            {item.quantity}×{" "}
                                                            {item.itemName}
                                                        </p>
                                                        <p
                                                            className={
                                                                item.state ===
                                                                "READY"
                                                                    ? "text-[12px] font-medium text-brand"
                                                                    : "text-[12px] text-slate-gray"
                                                            }
                                                        >
                                                            {item.stationName} ·{" "}
                                                            {itemStateLabel(
                                                                item.state,
                                                            )}
                                                            {extras
                                                                ? ` · ${extras}`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                                        <span className="font-semibold">
                                                            {formatEtb(
                                                                lineTotal(
                                                                    item.unitPrice,
                                                                    item.quantity,
                                                                    item.modifiers,
                                                                ),
                                                            )}
                                                        </span>
                                                        {table.tableSessionId ? (
                                                            <>
                                                                <WaiterMarkServedButton
                                                                    item={item}
                                                                    tableSessionId={
                                                                        table.tableSessionId
                                                                    }
                                                                />
                                                                <WaiterOrderItemActions
                                                                    item={item}
                                                                    tableSessionId={
                                                                        table.tableSessionId
                                                                    }
                                                                />
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[14px] text-slate-gray">
                            No dishes yet. Add an order to send tickets to the
                            stations.
                        </p>
                    )}

                    {canRequestBill ? (
                        <Button disabled={requesting} onClick={onRequestBill}>
                            {requesting ? "Requesting…" : "Request bill"}
                        </Button>
                    ) : null}

                    {canClosePaid || canCloseEmpty ? (
                        <Button
                            variant="outline"
                            disabled={closing}
                            onClick={releaseTable}
                        >
                            {closing
                                ? "Closing…"
                                : canClosePaid
                                  ? "Close paid table"
                                  : "Close empty table"}
                        </Button>
                    ) : itemCount > 0 && sessionStatus !== "PAID" ? (
                        <p className="text-[13px] text-slate-gray">
                            Close this table after the bill is paid.
                        </p>
                    ) : null}
                </div>
            ) : null}

            {occupied && !table.mine ? (
                <p className="mt-4 text-[14px] text-slate-gray">
                    {table.waiterName} has this table.
                </p>
            ) : null}

            {menuOpen && table.tableSessionId ? (
                <AddOrderMenu
                    tableSessionId={table.tableSessionId}
                    expectedVersion={sessionVersion}
                    tableLabel={`Table ${tableNumber(table)}`}
                    onClose={() => setMenuOpen(false)}
                />
            ) : null}
        </div>
    );
}
