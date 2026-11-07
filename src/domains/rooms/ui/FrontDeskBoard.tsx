"use client";

import { useMemo, useRef, useState } from "react";
import {
    BedDouble,
    Calendar,
    CheckCircle2,
    Coffee,
    Loader2,
    LogIn,
    LogOut,
    Phone,
    Plus,
    Upload,
    User,
    Users,
    X,
} from "lucide-react";
import {
    useCheckInStayMutation,
    useCheckOutStayMutation,
    useHotelRoomsQuery,
    useInHouseStaysQuery,
    useRedeemBreakfastMutation,
    type RoomStay,
} from "@/context/services/roomsApi";
import { useUploadMenuImageMutation } from "@/context/services/menuApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/context/hooks";
import {
    getEthiopianDateDetails,
    type CalendarMode,
} from "@/lib/ethiopian-calendar";

// ── Ethiopian alias helper ─────────────────────────────────────────────────────
function EthAlias({
    isoDate,
    mode,
}: {
    isoDate: string | null | undefined;
    mode: CalendarMode;
}) {
    if (!isoDate || mode !== "ETHIOPIAN") return null;
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return null;
    const eth = getEthiopianDateDetails(d);
    return (
        <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
            {eth.formattedEn}
        </p>
    );
}

// ── ID image upload ────────────────────────────────────────────────────────────
function IdImageField({
    value,
    onChange,
}: {
    value: string;
    onChange: (url: string) => void;
}) {
    const [upload, { isLoading }] = useUploadMenuImageMutation();
    const fileRef = useRef<HTMLInputElement>(null);

    async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await upload(file).unwrap();
            onChange(res.file.path);
            toast.success("ID image uploaded");
        } catch (err) {
            toast.fromUnknown(err, "Upload failed");
        }
        e.target.value = "";
    }

    return (
        <div className="space-y-1.5">
            <Label>
                Guest ID photo{" "}
                <span className="text-[11px] text-slate-gray">optional</span>
            </Label>
            {value ? (
                <div className="relative overflow-hidden rounded-xl border border-hairline">
                    <img
                        src={value}
                        alt="Guest ID"
                        className="h-32 w-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-white"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isLoading}
                    className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-secondary/40 text-slate-gray hover:border-foreground/30 hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <>
                            <Upload className="size-5" />
                            <span className="text-[12px] font-medium">
                                Upload ID / passport photo
                            </span>
                        </>
                    )}
                </button>
            )}
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFile}
            />
        </div>
    );
}

// ── Check-in side sheet ────────────────────────────────────────────────────────
function CheckInSheet({
    open,
    rooms,
    calendarMode,
    onClose,
}: {
    open: boolean;
    rooms: Array<{ id: string; roomNumber: string; floor?: string | null }>;
    calendarMode: CalendarMode;
    onClose: () => void;
}) {
    const [checkIn, { isLoading }] = useCheckInStayMutation();

    const [hotelRoomId, setHotelRoomId] = useState(rooms[0]?.id ?? "");
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [adults, setAdults] = useState("1");
    const [kids, setKids] = useState("0");
    const [mealPlan, setMealPlan] = useState<"NONE" | "BREAKFAST">("NONE");
    const [checkInDate, setCheckInDate] = useState("");
    const [checkInTime, setCheckInTime] = useState("12:00");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [checkOutTime, setCheckOutTime] = useState("12:00");
    const [idImageUrl, setIdImageUrl] = useState("");

    function reset() {
        setHotelRoomId(rooms[0]?.id ?? "");
        setGuestName("");
        setGuestPhone("");
        setAdults("1");
        setKids("0");
        setMealPlan("NONE");
        setCheckInDate("");
        setCheckInTime("12:00");
        setCheckOutDate("");
        setCheckOutTime("12:00");
        setIdImageUrl("");
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!hotelRoomId || !guestName.trim() || !checkOutDate) {
            toast.error("Room, guest name, and checkout date are required");
            return;
        }
        const plannedCheckOutAt = `${checkOutDate}T${checkOutTime}:00`;
        try {
            await checkIn({
                hotelRoomId,
                guestName: guestName.trim(),
                guestPhone: guestPhone.trim() || undefined,
                adults: Number(adults) || 1,
                kids: Number(kids) || 0,
                mealPlan,
                plannedCheckOutAt,
                guestIdImageUrl: idImageUrl || undefined,
            }).unwrap();
            toast.success(`${guestName.trim()} checked in`);
            reset();
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Check-in failed");
        }
    }

    const checkInEth = checkInDate
        ? (() => {
              const d = new Date(`${checkInDate}T${checkInTime}:00`);
              return isNaN(d.getTime()) ? null : d;
          })()
        : null;
    const checkOutEth = checkOutDate
        ? (() => {
              const d = new Date(`${checkOutDate}T${checkOutTime}:00`);
              return isNaN(d.getTime()) ? null : d;
          })()
        : null;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={onClose}
                aria-label="Close"
            />

            {/* sheet */}
            <aside className="absolute inset-y-0 right-0 z-10 flex h-full w-[32rem] max-w-[calc(100vw-1rem)] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10">
                            <LogIn className="size-4 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-semibold">
                                Check in guest
                            </h2>
                            <p className="mt-0.5 text-[12px] text-slate-gray">
                                Fill in guest details
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-gray hover:bg-secondary"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="app-scroll flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        {/* Room picker */}
                        <div className="space-y-1.5">
                            <Label>
                                Room <span className="text-destructive">*</span>
                            </Label>
                            <select
                                value={hotelRoomId}
                                onChange={e => setHotelRoomId(e.target.value)}
                                className="h-10 w-full rounded-xl border border-hairline bg-card px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-brand"
                            >
                                <option value="">Select room</option>
                                {rooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        Room {room.roomNumber}
                                        {room.floor
                                            ? ` · Floor ${room.floor}`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Guest name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="fd-name">
                                Guest name{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                <Input
                                    id="fd-name"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    placeholder="Full name"
                                    className="h-10 rounded-xl pl-9"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Phone + Adults */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="fd-phone">Phone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        id="fd-phone"
                                        value={guestPhone}
                                        onChange={e =>
                                            setGuestPhone(e.target.value)
                                        }
                                        placeholder="+251 9…"
                                        className="h-10 rounded-xl pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="fd-adults">Adults</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        id="fd-adults"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={adults}
                                        onChange={e =>
                                            setAdults(e.target.value)
                                        }
                                        className="h-10 rounded-xl pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kids + Meal plan */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="fd-kids">Children</Label>
                                <Input
                                    id="fd-kids"
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={kids}
                                    onChange={e => setKids(e.target.value)}
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Meal plan</Label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {(["NONE", "BREAKFAST"] as const).map(
                                        opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setMealPlan(opt)}
                                                className={cn(
                                                    "h-10 rounded-xl border text-[12px] font-medium transition-all",
                                                    mealPlan === opt
                                                        ? "border-foreground bg-foreground text-background"
                                                        : "border-hairline bg-card hover:border-foreground/30",
                                                )}
                                            >
                                                {opt === "NONE" ? (
                                                    "None"
                                                ) : (
                                                    <span className="flex items-center justify-center gap-1">
                                                        <Coffee className="size-3" />
                                                        Bfast
                                                    </span>
                                                )}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Check-in date + time */}
                        <div className="space-y-1.5">
                            <Label>Check-in date & time</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        type="date"
                                        value={checkInDate}
                                        onChange={e =>
                                            setCheckInDate(e.target.value)
                                        }
                                        className="h-10 rounded-xl pl-9"
                                    />
                                </div>
                                <Input
                                    type="time"
                                    value={checkInTime}
                                    onChange={e =>
                                        setCheckInTime(e.target.value)
                                    }
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            {calendarMode === "ETHIOPIAN" && checkInEth && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                    {
                                        getEthiopianDateDetails(checkInEth)
                                            .formattedEn
                                    }
                                </p>
                            )}
                        </div>

                        {/* Checkout date + time */}
                        <div className="space-y-1.5">
                            <Label>
                                Planned checkout{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        type="date"
                                        value={checkOutDate}
                                        onChange={e =>
                                            setCheckOutDate(e.target.value)
                                        }
                                        className="h-10 rounded-xl pl-9"
                                    />
                                </div>
                                <Input
                                    type="time"
                                    value={checkOutTime}
                                    onChange={e =>
                                        setCheckOutTime(e.target.value)
                                    }
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            {calendarMode === "ETHIOPIAN" && checkOutEth && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                    {
                                        getEthiopianDateDetails(checkOutEth)
                                            .formattedEn
                                    }
                                </p>
                            )}
                        </div>

                        {/* ID image */}
                        <IdImageField
                            value={idImageUrl}
                            onChange={setIdImageUrl}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-hairline px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 rounded-xl px-4 text-[13px] font-medium text-slate-gray hover:bg-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                isLoading ||
                                !hotelRoomId ||
                                !guestName.trim() ||
                                !checkOutDate
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <LogIn className="size-4" />
                            )}
                            Check in
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}

// ── Stay row ───────────────────────────────────────────────────────────────────
function StayRow({
    stay,
    calendarMode,
}: {
    stay: RoomStay;
    calendarMode: CalendarMode;
}) {
    const [checkOut, { isLoading: checkingOut }] = useCheckOutStayMutation();
    const [redeem, { isLoading: redeeming }] = useRedeemBreakfastMutation();

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        });

    async function handleCheckOut() {
        if (!confirm(`Check out ${stay.guestName}?`)) return;
        try {
            await checkOut(stay.id).unwrap();
            toast.success(`${stay.guestName} checked out`);
        } catch (err) {
            toast.fromUnknown(err, "Check-out failed");
        }
    }

    async function handleRedeem() {
        try {
            const res = await redeem({
                roomStayId: stay.id,
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
        <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/8 text-brand">
                    <BedDouble className="size-4" />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-semibold text-foreground">
                            Room {stay.roomNumber}
                        </p>
                        <span className="text-[13px] text-foreground">
                            {stay.guestName}
                        </span>
                        {stay.mealPlan === "BREAKFAST" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                <Coffee className="size-3" />
                                Breakfast
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-slate-gray">
                        {stay.guestPhone && (
                            <span className="flex items-center gap-1">
                                <Phone className="size-3.5" />
                                {stay.guestPhone}
                            </span>
                        )}
                        <span>
                            {stay.adults} adults
                            {stay.kids ? `, ${stay.kids} kids` : ""}
                        </span>
                        <span>
                            In {fmtDate(stay.checkInAt)}
                            {calendarMode === "ETHIOPIAN" && (
                                <EthAlias
                                    isoDate={stay.checkInAt}
                                    mode={calendarMode}
                                />
                            )}
                            {" → "}
                            Out {fmtDate(stay.plannedCheckOutAt)}
                            {calendarMode === "ETHIOPIAN" && (
                                <EthAlias
                                    isoDate={stay.plannedCheckOutAt}
                                    mode={calendarMode}
                                />
                            )}
                        </span>
                    </div>
                    {/* ID image thumbnail */}
                    {stay.guestIdImageUrl && (
                        <img
                            src={stay.guestIdImageUrl}
                            alt="Guest ID"
                            className="mt-2 h-12 w-16 rounded-lg border border-hairline object-cover"
                        />
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
                {stay.mealPlan === "BREAKFAST" && (
                    <button
                        type="button"
                        disabled={redeeming}
                        onClick={handleRedeem}
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[12px] font-medium hover:bg-secondary disabled:opacity-50"
                    >
                        {redeeming ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="size-3.5 text-brand" />
                        )}
                        Redeem
                    </button>
                )}
                <button
                    type="button"
                    disabled={checkingOut}
                    onClick={handleCheckOut}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-foreground px-3 text-[12px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                    {checkingOut ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <LogOut className="size-3.5" />
                    )}
                    Check out
                </button>
            </div>
        </div>
    );
}

// ── Main board ─────────────────────────────────────────────────────────────────
export default function FrontDeskBoard() {
    const { data: roomsRes } = useHotelRoomsQuery();
    const { data: staysRes, isLoading } = useInHouseStaysQuery();
    const [showCheckIn, setShowCheckIn] = useState(false);

    const calendarMode =
        ((
            useAppSelector(state => state.identity.session) as Record<
                string,
                unknown
            > | null
        )?.calendarPreference as CalendarMode) ?? "ETHIOPIAN";

    const rooms = useMemo(() => roomsRes?.data ?? [], [roomsRes?.data]);
    const stays = useMemo(() => staysRes?.data ?? [], [staysRes?.data]);
    const availableRooms = rooms.filter(r => r.status === "AVAILABLE");

    const occupied = stays.length;
    const total = rooms.length;
    const withBreakfast = stays.filter(s => s.mealPlan === "BREAKFAST").length;

    return (
        <DashboardFrame>
            <CheckInSheet
                open={showCheckIn}
                rooms={availableRooms}
                calendarMode={calendarMode}
                onClose={() => setShowCheckIn(false)}
            />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="Front Desk"
                    title="In House"
                    description="Guest check-in, check-out, and breakfast redemption."
                />
                <button
                    type="button"
                    disabled={availableRooms.length === 0}
                    onClick={() => setShowCheckIn(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50 self-start"
                >
                    <Plus className="size-3.5" />
                    Check in guest
                </button>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
                {[
                    {
                        label: "Occupied",
                        value: occupied,
                        sub: `/ ${total} rooms`,
                    },
                    {
                        label: "Available",
                        value: total - occupied,
                        sub: "rooms free",
                    },
                    { label: "Breakfast", value: withBreakfast, sub: "guests" },
                ].map(s => (
                    <div key={s.label} className="bg-card px-4 py-3 sm:px-5">
                        <p className="text-[11px] text-slate-gray">{s.label}</p>
                        <p className="mt-1 text-[24px] font-semibold tabular-nums text-foreground">
                            {s.value}
                            <span className="ml-1.5 text-[13px] font-normal text-slate-gray">
                                {s.sub}
                            </span>
                        </p>
                    </div>
                ))}
            </div>

            {/* Guest list */}
            {isLoading ? (
                <div className="flex min-h-[140px] items-center justify-center gap-2 text-[13px] text-slate-gray">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                </div>
            ) : stays.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card text-center">
                    <BedDouble className="size-8 text-slate-gray/40" />
                    <p className="mt-3 text-[14px] font-semibold text-foreground">
                        No guests in house
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        Use "Check in guest" to register a new arrival
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {stays.map(stay => (
                        <StayRow
                            key={stay.id}
                            stay={stay}
                            calendarMode={calendarMode}
                        />
                    ))}
                </div>
            )}
        </DashboardFrame>
    );
}
