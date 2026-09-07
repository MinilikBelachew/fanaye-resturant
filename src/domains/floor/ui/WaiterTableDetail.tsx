"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    markItemServed,
    removeDraftItem,
    requestBill,
    startTableSession,
} from "@/context/slices/opsSlice";
import AddOrderMenu from "@/domains/floor/ui/AddOrderMenu";
import WaiterPaymentPanel from "@/domains/payments/ui/WaiterPaymentPanel";
import {
    displayStatus,
    formatTicketExtras,
    selectCurrentStaff,
    selectItemsForSession,
    selectSessionForTable,
    stationLabel,
} from "@/domains/ordering/application/selectors";
import { STATION_STATUS_LABELS } from "@/domains/ordering/domain/order";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";

export default function WaiterTableDetail({ tableId }: { tableId: string }) {
    const dispatch = useAppDispatch();
    const staff = useAppSelector(selectCurrentStaff);
    const table = useAppSelector(state =>
        state.ops.tables.find(entry => entry.id === tableId),
    );
    const session = useAppSelector(state =>
        selectSessionForTable(state, tableId),
    );
    const items = useAppSelector(state =>
        session ? selectItemsForSession(state, session.id) : [],
    );
    const [menuOpen, setMenuOpen] = useState(false);
    const drafts = items.filter(item => item.status === "draft");
    const live = items.filter(item => item.status !== "draft");
    const ready = live.filter(item => item.status === "ready");
    const cooking = live.filter(
        item =>
            item.status === "queued" ||
            item.status === "acknowledged" ||
            item.status === "in_preparation",
    );
    const total = items
        .filter(item => item.status !== "cancelled" && item.status !== "draft")
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const billRequested = session?.status === "bill_requested";
    const paymentPending = session?.status === "payment_pending";
    const canRequestBill =
        live.length > 0 &&
        drafts.length === 0 &&
        !billRequested &&
        !paymentPending &&
        session?.status !== "paid";

    if (!table) {
        return <p>Table not found.</p>;
    }

    if (!session) {
        return (
            <div>
                <Link href="/waiter/tables" className="text-brand">
                    ← Floor
                </Link>
                <h1 className="mt-3 text-[24px] font-semibold">
                    Table {table.number}
                </h1>
                <p className="mt-2 text-slate-gray">
                    No guests yet. Take this table to add an order.
                </p>
                {staff ? (
                    <Button
                        className="mt-4"
                        onClick={() => {
                            dispatch(
                                startTableSession({
                                    tableId: table.id,
                                    waiterId: staff.id,
                                    guestCount: table.seats,
                                }),
                            );
                        }}
                    >
                        Take table
                    </Button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
            <div>
                <Link
                    href="/waiter/tables"
                    className="text-[14px] text-brand"
                >
                    ← Floor
                </Link>
                <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-[28px] font-semibold md:text-[32px]">
                            Table {table.number}
                        </h1>
                        <p className="text-[14px] text-slate-gray">
                            {billRequested
                                ? "Bill requested"
                                : paymentPending
                                  ? "Awaiting cashier"
                                  : ready.length > 0
                                    ? `${ready.length} ready`
                                    : cooking.length > 0
                                      ? `${cooking.length} cooking`
                                      : live.length > 0
                                        ? "Taken"
                                        : "No order yet"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] text-slate-gray">Due</p>
                        <p className="text-[20px] font-semibold">
                            {formatEtb(total)}
                        </p>
                    </div>
                </div>

                {ready.length > 0 ? (
                    <div className="mt-4 rounded-[16px] border border-transparent bg-accent p-4">
                        <p className="text-[13px] font-medium text-accent-foreground">
                            {ready.length} item{ready.length > 1 ? "s" : ""}{" "}
                            ready — pick up and serve
                        </p>
                    </div>
                ) : null}

                <section className="mt-5 space-y-3">
                    {live.length === 0 && drafts.length === 0 ? (
                        <p className="rounded-[16px] border border-hairline bg-white p-4 text-slate-gray">
                            No items yet. Add dishes and send the order.
                        </p>
                    ) : null}
                    {live.map(item => (
                        <article
                            key={item.id}
                            className="rounded-[16px] border border-hairline bg-white p-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium">
                                        {item.quantity}× {item.name}
                                    </p>
                                    {formatTicketExtras(item) ? (
                                        <p className="text-[13px] text-ink-charcoal">
                                            {formatTicketExtras(item)}
                                        </p>
                                    ) : null}
                                    <p className="text-[13px] text-slate-gray">
                                        {stationLabel(item.stationId)} ·{" "}
                                        {displayStatus(item)}
                                    </p>
                                </div>
                                <span className="rounded-full bg-secondary px-3 py-1 text-[12px]">
                                    {STATION_STATUS_LABELS[item.status]}
                                </span>
                            </div>
                            {item.status === "ready" ? (
                                <Button
                                    className="mt-3"
                                    onClick={() =>
                                        dispatch(markItemServed(item.id))
                                    }
                                >
                                    Mark served
                                </Button>
                            ) : null}
                        </article>
                    ))}
                    {drafts.map(item => (
                        <article
                            key={item.id}
                            className="rounded-[16px] border border-dashed border-hairline bg-secondary p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p>
                                        {item.quantity}× {item.name}{" "}
                                        <span className="text-slate-gray">
                                            (not sent)
                                        </span>
                                    </p>
                                    {formatTicketExtras(item) ? (
                                        <p className="text-[13px] text-slate-gray">
                                            {formatTicketExtras(item)}
                                        </p>
                                    ) : null}
                                    <p className="mt-1 text-[13px]">
                                        {formatEtb(
                                            item.unitPrice * item.quantity,
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="text-[13px] text-destructive"
                                    onClick={() =>
                                        dispatch(removeDraftItem(item.id))
                                    }
                                >
                                    Remove
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </div>

            <aside className="mt-6 space-y-3 lg:sticky lg:top-8 lg:mt-10">
                <div className="rounded-[16px] border border-hairline bg-white p-4">
                    <p className="text-[12px] text-slate-gray">Check</p>
                    <p className="text-[22px] font-semibold">
                        {formatEtb(total)}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        {ready.length} ready · {cooking.length} in station
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => setMenuOpen(true)}>
                        Add dishes
                    </Button>
                    <Button
                        variant="outline"
                        disabled={!canRequestBill}
                        onClick={() => dispatch(requestBill(session.id))}
                    >
                        Request bill
                    </Button>
                    {staff ? (
                        <WaiterPaymentPanel
                            sessionId={session.id}
                            waiterId={staff.id}
                            billRequested={Boolean(billRequested)}
                        />
                    ) : null}
                </div>
                <p className="text-[12px] leading-5 text-slate-gray">
                    Send the order, serve ready items, then request the bill.
                    Collect the total at the table in cash, or photograph a
                    bank/Telebirr receipt. That amount is logged to the cashier.
                </p>
            </aside>

            {menuOpen ? (
                <AddOrderMenu
                    sessionId={session.id}
                    pendingDraftCount={drafts.length}
                    onClose={() => setMenuOpen(false)}
                />
            ) : null}
        </div>
    );
}
