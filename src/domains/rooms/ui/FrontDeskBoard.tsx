"use client";

import { useMemo, useState } from "react";
import {
    useCheckInStayMutation,
    useCheckOutStayMutation,
    useHotelRoomsQuery,
    useInHouseStaysQuery,
    useRedeemBreakfastMutation,
} from "@/context/services/roomsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { toast } from "@/lib/toast";

export default function FrontDeskBoard() {
    const { data: roomsRes } = useHotelRoomsQuery();
    const { data: staysRes, isLoading } = useInHouseStaysQuery();
    const [checkIn, { isLoading: checkingIn }] = useCheckInStayMutation();
    const [checkOut, { isLoading: checkingOut }] = useCheckOutStayMutation();
    const [redeem, { isLoading: redeeming }] = useRedeemBreakfastMutation();

    const rooms = useMemo(() => roomsRes?.data ?? [], [roomsRes?.data]);
    const stays = useMemo(() => staysRes?.data ?? [], [staysRes?.data]);
    const available = rooms.filter(r => r.status === "AVAILABLE");

    const [hotelRoomId, setHotelRoomId] = useState("");
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [adults, setAdults] = useState("2");
    const [mealPlan, setMealPlan] = useState<"NONE" | "BREAKFAST">("NONE");
    const [plannedCheckOutAt, setPlannedCheckOutAt] = useState("");

    async function onCheckIn() {
        if (!hotelRoomId || !guestName.trim() || !plannedCheckOutAt) {
            toast.error("Room, guest name, and checkout date are required");
            return;
        }
        try {
            await checkIn({
                hotelRoomId,
                guestName: guestName.trim(),
                guestPhone: guestPhone.trim() || undefined,
                adults: Number(adults) || 1,
                mealPlan,
                plannedCheckOutAt,
            }).unwrap();
            setGuestName("");
            setGuestPhone("");
            setHotelRoomId("");
            toast.success("Guest checked in");
        } catch (err) {
            toast.fromUnknown(err, "Check-in failed");
        }
    }

    async function onCheckOut(stayId: string, name: string) {
        try {
            await checkOut(stayId).unwrap();
            toast.success(`${name} checked out`);
        } catch (err) {
            toast.fromUnknown(err, "Check-out failed");
        }
    }

    async function onRedeem(stayId: string) {
        try {
            const res = await redeem({
                roomStayId: stayId,
                quantity: 1,
            }).unwrap();
            toast.success(
                `Breakfast redeemed · ${res.data.qtyRemaining} remaining`,
            );
        } catch (err) {
            toast.fromUnknown(err, "Redeem failed");
        }
    }

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Front desk"
                description="Check guests in and out, redeem breakfast."
            />

            <section className="space-y-3">
                <h2 className="text-[15px] font-semibold">Check in</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                        <label className="text-[12px] text-slate-gray">
                            Room
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={hotelRoomId}
                            onChange={e => setHotelRoomId(e.target.value)}
                        >
                            <option value="">Select room</option>
                            {available.map(room => (
                                <option key={room.id} value={room.id}>
                                    {room.roomNumber}
                                    {room.floor ? ` · Fl ${room.floor}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] text-slate-gray">
                            Guest name
                        </label>
                        <Input
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] text-slate-gray">
                            Phone
                        </label>
                        <Input
                            value={guestPhone}
                            onChange={e => setGuestPhone(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] text-slate-gray">
                            Adults
                        </label>
                        <Input
                            type="number"
                            min={1}
                            value={adults}
                            onChange={e => setAdults(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] text-slate-gray">
                            Meal plan
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={mealPlan}
                            onChange={e =>
                                setMealPlan(
                                    e.target.value as "NONE" | "BREAKFAST",
                                )
                            }
                        >
                            <option value="NONE">None</option>
                            <option value="BREAKFAST">Breakfast</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] text-slate-gray">
                            Planned checkout
                        </label>
                        <Input
                            type="date"
                            value={plannedCheckOutAt}
                            onChange={e => setPlannedCheckOutAt(e.target.value)}
                        />
                    </div>
                </div>
                <Button type="button" onClick={onCheckIn} disabled={checkingIn}>
                    Check in
                </Button>
            </section>

            <section className="space-y-3">
                <h2 className="text-[15px] font-semibold">
                    In house ({stays.length})
                </h2>
                {isLoading ? (
                    <p className="text-[13px] text-slate-gray">Loading…</p>
                ) : stays.length === 0 ? (
                    <p className="text-[13px] text-slate-gray">
                        No guests in house.
                    </p>
                ) : (
                    <ul className="divide-y divide-hairline border-y border-hairline">
                        {stays.map(stay => (
                            <li
                                key={stay.id}
                                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="text-[15px] font-semibold">
                                        Room {stay.roomNumber} ·{" "}
                                        {stay.guestName}
                                    </p>
                                    <p className="text-[12px] text-slate-gray">
                                        {[
                                            stay.mealPlan === "BREAKFAST"
                                                ? "Breakfast"
                                                : null,
                                            `${stay.adults} adults`,
                                            stay.plannedCheckOutAt
                                                ? `Out ${String(stay.plannedCheckOutAt).slice(0, 10)}`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {stay.mealPlan === "BREAKFAST" ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={redeeming}
                                            onClick={() => onRedeem(stay.id)}
                                        >
                                            Redeem breakfast
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={checkingOut}
                                        onClick={() =>
                                            onCheckOut(stay.id, stay.guestName)
                                        }
                                    >
                                        Check out
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
