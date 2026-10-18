"use client";

import { use } from "react";
import WaiterRoomDetail from "@/domains/rooms/ui/WaiterRoomDetail";

export default function WaiterRoomDetailPage({
    params,
}: {
    params: Promise<{ hotelRoomId: string }>;
}) {
    const { hotelRoomId } = use(params);
    return <WaiterRoomDetail hotelRoomId={hotelRoomId} />;
}
