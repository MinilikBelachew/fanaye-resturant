"use client";

import { useMemo, useState } from "react";
import { BedDouble } from "lucide-react";
import {
    useMyRoomsQuery,
    useOpenRoomSessionMutation,
} from "@/context/services/roomsApi";
import { useAppSelector } from "@/context/hooks";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { toast } from "@/lib/toast";

export default function WaiterRoomsBoard() {
    const clockedIn = Boolean(
        useAppSelector(state => state.identity.session?.shiftSessionId),
    );
    const { data, isLoading, isError } = useMyRoomsQuery();
    const [openSession, { isLoading: opening }] = useOpenRoomSessionMutation();
    const [busyId, setBusyId] = useState<string | null>(null);
    const router = useRouter();

    const rooms = useMemo(() => data?.data ?? [], [data?.data]);
    const mine = rooms.filter(r => r.mine);

    async function enterRoom(room: (typeof rooms)[number]) {
        if (room.roomSessionId) {
            router.push(`/waiter/rooms/${room.hotelRoomId}`);
            return;
        }
        if (!room.stayId) {
            toast.error("No guest in this room");
            return;
        }
        if (!clockedIn) {
            toast.error("Clock in before opening room service");
            return;
        }
        setBusyId(room.hotelRoomId);
        try {
            await openSession({ roomStayId: room.stayId }).unwrap();
            toast.success(`Room ${room.roomNumber} opened`);
            router.push(`/waiter/rooms/${room.hotelRoomId}`);
        } catch (err) {
            toast.fromUnknown(err, "Could not open room session");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-[20px] font-semibold tracking-tight md:text-[22px]">
                        My rooms
                    </h1>
                    <p className="mt-0.5 text-[14px] text-slate-gray">
                        In-house rooms assigned to you for room service.
                    </p>
                </div>
                <Link
                    href="/waiter/tables"
                    className="text-[13px] font-medium text-slate-gray underline-offset-4 hover:underline"
                >
                    Tables
                </Link>
            </div>

            {!clockedIn ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                    Clock in to open room sessions.
                </p>
            ) : null}

            {isLoading ? (
                <p className="text-[13px] text-slate-gray">Loading…</p>
            ) : isError ? (
                <p className="text-[13px] text-slate-gray">
                    Room service may be disabled for this branch.
                </p>
            ) : mine.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <BedDouble className="h-8 w-8 text-slate-gray" />
                    <p className="text-[14px] text-slate-gray">
                        No rooms assigned right now.
                    </p>
                </div>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {mine.map(room => (
                        <li
                            key={room.hotelRoomId}
                            className="flex flex-col gap-3 border border-hairline p-4"
                        >
                            <div>
                                <p className="text-[18px] font-semibold">
                                    {room.roomNumber}
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    {[
                                        room.floor
                                            ? `Floor ${room.floor}`
                                            : null,
                                        room.guestName,
                                        room.sessionStatus ?? room.status,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            </div>
                            <Button
                                type="button"
                                disabled={
                                    busyId === room.hotelRoomId || opening
                                }
                                onClick={() => enterRoom(room)}
                            >
                                {room.roomSessionId
                                    ? "Open"
                                    : room.stayId
                                      ? "Start service"
                                      : "Vacant"}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
