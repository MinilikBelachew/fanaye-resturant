"use client";

import { useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    ChefHat,
    Phone,
    Plus,
    Receipt,
    XCircle,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import {
    useGenerateBillMutation,
    useRequestBillMutation,
    useSessionBillQuery,
} from "@/context/services/billingApi";
import {
    useCloseTableSessionMutation,
    useTableSessionQuery,
} from "@/context/services/floorApi";
import {
    useSendToKitchenMutation,
    useTableSessionOrdersQuery,
} from "@/context/services/ordersApi";
import AddOrderMenu from "@/domains/floor/ui/AddOrderMenu";
import WaiterMarkServedButton from "@/domains/floor/ui/WaiterMarkServedButton";
import WaiterOrderItemActions from "@/domains/floor/ui/WaiterOrderItemActions";
import { lineTotal } from "@/domains/ordering/application/mapWaiterMenu";
import WaiterPaymentPanel from "@/domains/payments/ui/WaiterPaymentPanel";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ORDERABLE = new Set(["OPEN", "ACTIVE_ORDER", "ATTENTION_REQUIRED"]);

function itemTone(state: string) {
    if (state === "READY") {
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    }
    if (state === "CONFIRMED") {
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    }
    if (
        state === "QUEUED" ||
        state === "ACKNOWLEDGED" ||
        state === "IN_PREPARATION"
    ) {
        return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    }
    if (state === "CANCELLED") {
        return "bg-secondary text-slate-gray line-through";
    }
    return "bg-secondary text-slate-gray";
}

export default function DispatcherCallDetail({
    tableSessionId,
}: {
    tableSessionId: string;
}) {
    const router = useRouter();
    const staff = useAppSelector(selectCurrentStaff);
    const clockedIn = Boolean(
        useAppSelector(state => state.identity.session?.shiftSessionId),
    );
    const {
        data: session,
        isLoading,
        isError,
    } = useTableSessionQuery(tableSessionId, { pollingInterval: 4000 });
    const { data: ordersData } = useTableSessionOrdersQuery(tableSessionId, {
        skip: !session,
        pollingInterval: 3000,
    });
    const { data: billData } = useSessionBillQuery(tableSessionId, {
        skip: !session,
        pollingInterval: 3000,
    });
    const [closeSession, { isLoading: closing }] =
        useCloseTableSessionMutation();
    const [requestBill, { isLoading: requesting }] = useRequestBillMutation();
    const [generateBill, { isLoading: generating }] = useGenerateBillMutation();
    const [sendToKitchen, { isLoading: sending }] = useSendToKitchenMutation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [error, setError] = useState("");

    const tickets = ordersData?.data ?? [];
    const bill = billData?.bill ?? null;
    const pendingRequest = billData?.billRequest ?? null;
    const sessionVersion =
        billData?.tableSession.version ??
        ordersData?.version ??
        session?.version ??
        1;
    const sessionStatus =
        billData?.tableSession.status ??
        ordersData?.sessionStatus ??
        session?.status;
    const canOrder =
        Boolean(session?.mine) &&
        ORDERABLE.has(sessionStatus || "") &&
        !bill &&
        !pendingRequest;
    const allItems = tickets.flatMap(order => order.items);
    const pendingKitchenCount = allItems.filter(
        item => item.state === "CONFIRMED",
    ).length;
    const cookingCount = allItems.filter(item =>
        ["QUEUED", "ACKNOWLEDGED", "IN_PREPARATION"].includes(item.state),
    ).length;
    const readyCount = allItems.filter(item => item.state === "READY").length;
    const runningTotal = useMemo(
        () =>
            allItems.reduce(
                (sum, item) =>
                    item.state === "CANCELLED"
                        ? sum
                        : sum +
                          lineTotal(
                              item.unitPrice,
                              item.quantity,
                              item.modifiers,
                          ),
                0,
            ),
        [allItems],
    );
    const canClosePaid = sessionStatus === "PAID";
    const canCloseEmpty =
        allItems.length === 0 &&
        (sessionStatus === "OPEN" || sessionStatus === "ACTIVE_ORDER");

    const step =
        bill || sessionStatus === "PAID" ? 3 : allItems.length > 0 ? 2 : 1;

    async function onSendToKitchen(orderId?: string) {
        setError("");
        try {
            await sendToKitchen({ tableSessionId, orderId }).unwrap();
            toast.success("Sent to kitchen");
        } catch (err) {
            const message = "Could not send to kitchen";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function onBillAndPay() {
        setError("");
        try {
            let billRequestId = pendingRequest?.billRequestId;
            let version = sessionVersion;
            if (!billRequestId) {
                const created = await requestBill({
                    tableSessionId,
                    expectedTableSessionVersion: version,
                }).unwrap();
                billRequestId = created.billRequestId;
                version = created.tableSession.version;
            }
            await generateBill({
                billRequestId,
                expectedTableSessionVersion: version,
                tableSessionId,
            }).unwrap();
            toast.success("Bill ready");
        } catch (err) {
            const message = "Could not generate bill";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    async function onClose() {
        setError("");
        try {
            await closeSession({
                tableSessionId,
                expectedVersion: sessionVersion,
            }).unwrap();
            toast.success("Call closed");
            router.push("/dispatcher");
        } catch (err) {
            const message = "Could not close call";
            setError(message);
            toast.fromUnknown(err, message);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="h-8 w-40 animate-pulse rounded-lg bg-secondary" />
                <div className="h-28 animate-pulse rounded-3xl bg-secondary" />
                <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
            </div>
        );
    }

    if (isError || !session) {
        return (
            <div className="space-y-4">
                <Link
                    href="/dispatcher"
                    className="inline-flex items-center gap-2 text-[14px] text-slate-gray"
                >
                    <ArrowLeft className="size-4" /> Back
                </Link>
                <p className="text-[14px] text-destructive">Call not found.</p>
            </div>
        );
    }

    const label =
        session.customerName?.trim() || session.displayName || "Call pickup";

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link
                        href="/dispatcher"
                        className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
                    >
                        <ArrowLeft className="size-3.5" /> Board
                    </Link>
                    <h1 className="text-[26px] font-semibold tracking-tight">
                        {label}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-gray">
                        <span className="inline-flex items-center gap-1">
                            <Phone className="size-3.5" />
                            {session.customerPhone || "No phone"}
                        </span>
                        <span>· {session.displayName}</span>
                    </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-card px-4 py-2.5 text-right">
                    <p className="text-[11px] font-medium tracking-wide text-slate-gray uppercase">
                        Total
                    </p>
                    <p className="text-[20px] font-semibold tracking-tight">
                        {formatEtb(bill ? Number(bill.total) : runningTotal)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {[
                    { n: 1, label: "Order" },
                    { n: 2, label: "Kitchen" },
                    { n: 3, label: "Pay" },
                ].map(s => (
                    <div
                        key={s.n}
                        className={cn(
                            "rounded-2xl border px-3 py-2 text-center text-[12px] font-semibold",
                            step >= s.n
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                                : "border-hairline bg-card text-slate-gray",
                        )}
                    >
                        {s.n}. {s.label}
                    </div>
                ))}
            </div>

            {!clockedIn ? (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13px]">
                    Clock in on Shift before ordering or collecting payment.
                </div>
            ) : null}
            {error ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                    {error}
                </div>
            ) : null}
            {!session.mine ? (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13px]">
                    Another dispatcher owns this call.
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
                {canOrder ? (
                    <Button
                        className="rounded-full"
                        onClick={() => setMenuOpen(true)}
                    >
                        <Plus className="size-4" />
                        Add items
                    </Button>
                ) : null}
                {pendingKitchenCount > 0 && session.mine ? (
                    <Button
                        className="rounded-full bg-amber-600 hover:bg-amber-700"
                        disabled={sending}
                        onClick={() => onSendToKitchen()}
                    >
                        <ChefHat className="size-4" />
                        Send kitchen ({pendingKitchenCount})
                    </Button>
                ) : null}
                {!bill && allItems.length > 0 && session.mine ? (
                    <Button
                        variant="outline"
                        className="rounded-full"
                        disabled={requesting || generating || !clockedIn}
                        onClick={onBillAndPay}
                    >
                        <Receipt className="size-4" />
                        {requesting || generating
                            ? "Preparing…"
                            : "Generate bill"}
                    </Button>
                ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-7">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold">Items</h2>
                        <p className="text-[12px] text-slate-gray">
                            {cookingCount} cooking · {readyCount} ready
                        </p>
                    </div>

                    {allItems.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-hairline px-5 py-10 text-center">
                            <p className="text-[15px] font-semibold">
                                No items yet
                            </p>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                Add the guest’s order, then send to kitchen.
                            </p>
                            {canOrder ? (
                                <Button
                                    className="mt-4 rounded-full"
                                    onClick={() => setMenuOpen(true)}
                                >
                                    <Plus className="size-4" />
                                    Add items
                                </Button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tickets.map(order =>
                                order.items.map(item => (
                                    <div
                                        key={item.orderItemId}
                                        className="rounded-2xl border border-hairline bg-card px-4 py-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-medium">
                                                    {item.quantity}×{" "}
                                                    {item.itemName}
                                                </p>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                                            itemTone(
                                                                item.state,
                                                            ),
                                                        )}
                                                    >
                                                        {item.state.replaceAll(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                    {item.specialInstruction ? (
                                                        <span className="text-[11px] text-slate-gray">
                                                            {
                                                                item.specialInstruction
                                                            }
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {session.mine &&
                                                item.state === "READY" ? (
                                                    <div className="mt-2">
                                                        <WaiterMarkServedButton
                                                            item={item}
                                                            tableSessionId={
                                                                tableSessionId
                                                            }
                                                        />
                                                    </div>
                                                ) : null}
                                                {session.mine && canOrder ? (
                                                    <div className="mt-2">
                                                        <WaiterOrderItemActions
                                                            item={item}
                                                            tableSessionId={
                                                                tableSessionId
                                                            }
                                                        />
                                                    </div>
                                                ) : null}
                                            </div>
                                            <p className="shrink-0 text-[13px] font-semibold">
                                                {formatEtb(
                                                    lineTotal(
                                                        item.unitPrice,
                                                        item.quantity,
                                                        item.modifiers,
                                                    ),
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )),
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-3 lg:col-span-5">
                    <div className="rounded-3xl border border-hairline bg-card p-4">
                        <h2 className="text-[15px] font-semibold">Payment</h2>
                        <p className="mt-1 text-[12px] text-slate-gray">
                            Collect cash or transfer photo, then drop cash
                            later.
                        </p>

                        {bill ? (
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3 py-2.5 text-[13px]">
                                    <span className="font-medium text-slate-gray">
                                        Bill #{bill.billNumber}
                                    </span>
                                    <span className="font-semibold">
                                        {formatEtb(Number(bill.total))}
                                    </span>
                                </div>
                                <WaiterPaymentPanel
                                    bill={bill}
                                    tableSessionId={tableSessionId}
                                />
                            </div>
                        ) : (
                            <Button
                                className="mt-4 h-11 w-full rounded-full"
                                disabled={
                                    !session.mine ||
                                    requesting ||
                                    generating ||
                                    allItems.length === 0 ||
                                    !clockedIn
                                }
                                onClick={onBillAndPay}
                            >
                                <Receipt className="size-4" />
                                {requesting || generating
                                    ? "Preparing bill…"
                                    : "Generate bill & collect"}
                            </Button>
                        )}

                        {(canClosePaid || canCloseEmpty) && session.mine ? (
                            <Button
                                variant="outline"
                                className="mt-2 h-11 w-full rounded-full"
                                disabled={closing}
                                onClick={onClose}
                            >
                                {canClosePaid ? (
                                    <CheckCircle2 className="size-4" />
                                ) : (
                                    <XCircle className="size-4" />
                                )}
                                {closing
                                    ? "Closing…"
                                    : canClosePaid
                                      ? "Close paid call"
                                      : "Cancel empty call"}
                            </Button>
                        ) : null}

                        <p className="mt-3 text-[12px] text-slate-gray">
                            Dispatcher: {session.waiterName || staff?.name}
                        </p>
                    </div>
                </div>
            </div>

            {menuOpen ? (
                <AddOrderMenu
                    tableSessionId={tableSessionId}
                    expectedVersion={sessionVersion}
                    tableLabel={label}
                    variant="dispatcher"
                    onClose={() => setMenuOpen(false)}
                />
            ) : null}
        </div>
    );
}
