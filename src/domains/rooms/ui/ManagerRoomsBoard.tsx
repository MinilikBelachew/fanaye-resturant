"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
    useArchiveHotelRoomMutation,
    useCreateHotelRoomMutation,
    useHotelRoomsQuery,
    useRoomSettingsQuery,
    useUpdateRoomSettingsMutation,
} from "@/context/services/roomsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { toast } from "@/lib/toast";

export default function ManagerRoomsBoard() {
    const { data: settingsRes, isLoading: settingsLoading } =
        useRoomSettingsQuery();
    const { data: roomsRes, isLoading: roomsLoading } = useHotelRoomsQuery(
        undefined,
        { skip: !settingsRes?.data.roomServiceEnabled },
    );
    const [updateSettings, { isLoading: savingSettings }] =
        useUpdateRoomSettingsMutation();
    const [createRoom, { isLoading: creating }] = useCreateHotelRoomMutation();
    const [archiveRoom] = useArchiveHotelRoomMutation();

    const settings = settingsRes?.data;
    const rooms = useMemo(() => roomsRes?.data ?? [], [roomsRes?.data]);

    const [roomNumber, setRoomNumber] = useState("");
    const [floor, setFloor] = useState("");

    async function toggleFeature(
        key: "roomServiceEnabled" | "breakfastEntitlementEnabled",
        value: boolean,
    ) {
        try {
            await updateSettings({ [key]: value }).unwrap();
            toast.success("Settings saved");
        } catch (err) {
            toast.fromUnknown(err, "Could not save settings");
        }
    }

    async function onCreate() {
        const number = roomNumber.trim();
        if (!number) {
            toast.error("Room number required");
            return;
        }
        try {
            await createRoom({
                roomNumber: number,
                floor: floor.trim() || undefined,
            }).unwrap();
            setRoomNumber("");
            setFloor("");
            toast.success(`Room ${number} added`);
        } catch (err) {
            toast.fromUnknown(err, "Could not create room");
        }
    }

    async function onArchive(id: string, label: string) {
        try {
            await archiveRoom(id).unwrap();
            toast.success(`Room ${label} archived`);
        } catch (err) {
            toast.fromUnknown(err, "Could not archive room");
        }
    }

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Rooms"
                description="Hotel rooms for room service and breakfast entitlements."
            />

            <section className="space-y-4">
                <h2 className="text-[15px] font-semibold text-foreground">
                    Feature flags
                </h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                        type="button"
                        variant={
                            settings?.roomServiceEnabled ? "default" : "outline"
                        }
                        disabled={settingsLoading || savingSettings}
                        onClick={() =>
                            toggleFeature(
                                "roomServiceEnabled",
                                !settings?.roomServiceEnabled,
                            )
                        }
                    >
                        Room service{" "}
                        {settings?.roomServiceEnabled ? "on" : "off"}
                    </Button>
                    <Button
                        type="button"
                        variant={
                            settings?.breakfastEntitlementEnabled
                                ? "default"
                                : "outline"
                        }
                        disabled={
                            settingsLoading ||
                            savingSettings ||
                            !settings?.roomServiceEnabled
                        }
                        onClick={() =>
                            toggleFeature(
                                "breakfastEntitlementEnabled",
                                !settings?.breakfastEntitlementEnabled,
                            )
                        }
                    >
                        Breakfast{" "}
                        {settings?.breakfastEntitlementEnabled ? "on" : "off"}
                    </Button>
                </div>
                {settings?.breakfastEntitlementEnabled ? (
                    <p className="text-[13px] text-slate-gray">
                        Window {settings.breakfastValidFromLocal}–
                        {settings.breakfastValidToLocal}
                    </p>
                ) : null}
            </section>

            {settings?.roomServiceEnabled ? (
                <>
                    <section className="space-y-3">
                        <h2 className="text-[15px] font-semibold text-foreground">
                            Add room
                        </h2>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="space-y-1">
                                <label className="text-[12px] text-slate-gray">
                                    Number
                                </label>
                                <Input
                                    value={roomNumber}
                                    onChange={e =>
                                        setRoomNumber(e.target.value)
                                    }
                                    placeholder="305"
                                    className="w-full sm:w-32"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[12px] text-slate-gray">
                                    Floor
                                </label>
                                <Input
                                    value={floor}
                                    onChange={e => setFloor(e.target.value)}
                                    placeholder="3"
                                    className="w-full sm:w-24"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={onCreate}
                                disabled={creating}
                                className="gap-1.5"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-[15px] font-semibold text-foreground">
                            Rooms ({rooms.length})
                        </h2>
                        {roomsLoading ? (
                            <p className="text-[13px] text-slate-gray">
                                Loading…
                            </p>
                        ) : rooms.length === 0 ? (
                            <p className="text-[13px] text-slate-gray">
                                No rooms yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-hairline border-y border-hairline">
                                {rooms.map(room => (
                                    <li
                                        key={room.id}
                                        className="flex items-center justify-between gap-3 py-3"
                                    >
                                        <div>
                                            <p className="text-[15px] font-semibold">
                                                Room {room.roomNumber}
                                            </p>
                                            <p className="text-[12px] text-slate-gray">
                                                {[
                                                    room.floor
                                                        ? `Floor ${room.floor}`
                                                        : null,
                                                    room.status,
                                                    room.guestName
                                                        ? room.guestName
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                onArchive(
                                                    room.id,
                                                    room.roomNumber,
                                                )
                                            }
                                        >
                                            Archive
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            ) : (
                <p className="text-[14px] text-slate-gray">
                    Turn on room service to manage hotel rooms.
                </p>
            )}
        </div>
    );
}
