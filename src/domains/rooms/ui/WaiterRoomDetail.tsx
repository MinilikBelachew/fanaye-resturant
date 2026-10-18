"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import {
    useMyRoomsQuery,
    useOpenRoomSessionMutation,
} from "@/context/services/roomsApi";
import {
    useMarkOrderItemServedMutation,
    useRoomSessionOrdersQuery,
} from "@/context/services/ordersApi";
import {
    useRequestRoomBillMutation,
    useRoomSessionBillQuery,
} from "@/context/services/billingApi";
import AddOrderMenu from "@/domains/floor/ui/AddOrderMenu";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useAppSelector } from "@/context/hooks";

export default function WaiterRoomDetail({
    hotelRoomId,
}: {
    hotelRoomId: string;
}) {
    const clockedIn = Boolean(
        useAppSelector(state => state.identity.session?.shiftSessionId),
    );
    const { data: roomsRes } = useMyRoomsQuery();
    const room = useMemo(
        () => roomsRes?.data?.find(r => r.hotelRoomId === hotelRoomId) ?? null,
        [roomsRes?.data, hotelRoomId],
    );
    const roomSessionId = room?.roomSessionId ?? null;
    const { data: ordersRes, refetch: refetchOrders } =
        useRoomSessionOrdersQuery(roomSessionId ?? "", {
            skip: !roomSessionId,
        });
    const { data: billRes } = useRoomSessionBillQuery(roomSessionId ?? "", {
        skip: !roomSessionId,
    });
    const [openSession] = useOpenRoomSessionMutation();
    const [requestBill, { isLoading: requesting }] =
        useRequestRoomBillMutation();
    const [markServed] = useMarkOrderItemServedMutation();
    const [menuOpen, setMenuOpen] = useState(false);

    const sessionVersion = ordersRes?.version ?? room?.sessionVersion ?? 1;
    const items = useMemo(
        () =>
            (ordersRes?.data ?? []).flatMap(order =>
                order.items.map(item => ({ ...item, orderId: order.orderId })),
            ),
        [ordersRes?.data],
    );

    async function ensureSession() {
        if (roomSessionId || !room?.stayId) return roomSessionId;
        if (!clockedIn) {
            toast.error("Clock in first");
            return null;
        }
        const res = await openSession({ roomStayId: room.stayId }).unwrap();
        return res.data.roomSessionId;
    }

    async function onAddOrder() {
        try {
            const id = await ensureSession();
            if (!id) return;
            setMenuOpen(true);
        } catch (err) {
            toast.fromUnknown(err, "Could not open session");
        }
    }

    async function onRequestBill() {
        if (!roomSessionId) {
            toast.error("No open room session");
            return;
        }
        try {
            await requestBill({
                roomSessionId,
                expectedRoomSessionVersion: sessionVersion,
            }).unwrap();
            toast.success("Bill requested");
        } catch (err) {
            toast.fromUnknown(err, "Bill request failed");
        }
    }

    if (!room) {
        return (
            <div className="space-y-4 pb-12">
                <Link
                    href="/waiter/rooms"
                    className="inline-flex items-center gap-1 text-[13px] text-slate-gray"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to rooms
                </Link>
                <p className="text-[14px] text-slate-gray">Room not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <Link
                        href="/waiter/rooms"
                        className="mb-2 inline-flex items-center gap-1 text-[13px] text-slate-gray"
                    >
                        <ArrowLeft className="h-4 w-4" /> Rooms
                    </Link>
                    <h1 className="text-[22px] font-semibold tracking-tight">
                        Room {room.roomNumber}
                    </h1>
                    <p className="text-[13px] text-slate-gray">
                        {[room.guestName, room.sessionStatus ?? "No session"]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                        type="button"
                        onClick={onAddOrder}
                        className="gap-1.5"
                    >
                        <Plus className="h-4 w-4" /> Add order
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!roomSessionId || requesting}
                        onClick={onRequestBill}
                        className="gap-1.5"
                    >
                        <Receipt className="h-4 w-4" /> Request bill
                    </Button>
                </div>
            </div>

            {billRes?.billRequest ? (
                <p className="text-[13px] text-slate-gray">
                    Bill request · {billRes.billRequest.status}
                    {billRes.bill
                        ? ` · Bill ${billRes.bill.billNumber} ${formatEtb(Number(billRes.bill.total))}`
                        : ""}
                </p>
            ) : null}

            <section className="space-y-2">
                <h2 className="text-[15px] font-semibold">Items</h2>
                {items.length === 0 ? (
                    <p className="text-[13px] text-slate-gray">
                        No orders yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-hairline border-y border-hairline">
                        {items.map(item => (
                            <li
                                key={item.orderItemId}
                                className="flex items-center justify-between gap-3 py-3"
                            >
                                <div>
                                    <p className="text-[14px] font-medium">
                                        {item.quantity}× {item.itemName}
                                    </p>
                                    <p className="text-[12px] text-slate-gray">
                                        {item.state} · {item.stationName}
                                    </p>
                                </div>
                                {item.state === "READY" ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                await markServed({
                                                    orderItemId:
                                                        item.orderItemId,
                                                    expectedVersion:
                                                        item.version,
                                                    tableSessionId:
                                                        roomSessionId ?? "",
                                                }).unwrap();
                                                void refetchOrders();
                                            } catch (err) {
                                                toast.fromUnknown(
                                                    err,
                                                    "Could not mark served",
                                                );
                                            }
                                        }}
                                    >
                                        Served
                                    </Button>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {menuOpen && roomSessionId ? (
                <AddOrderMenu
                    roomSessionId={roomSessionId}
                    expectedVersion={sessionVersion}
                    tableLabel={`Room ${room.roomNumber}`}
                    onClose={() => {
                        setMenuOpen(false);
                        void refetchOrders();
                    }}
                />
            ) : null}
        </div>
    );
}
