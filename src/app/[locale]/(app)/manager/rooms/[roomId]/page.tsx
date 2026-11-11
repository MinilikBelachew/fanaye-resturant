"use client";

import { use, useMemo, useRef, useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    ArrowLeft,
    BedDouble,
    Calendar,
    Camera,
    CheckCircle2,
    Coffee,
    LogIn,
    LogOut,
    Phone,
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
import { Link, usePathname } from "@/i18n/navigation";
import { useAppSelector } from "@/context/hooks";
import {
    getEthiopianDateDetails,
    type CalendarMode,
} from "@/lib/ethiopian-calendar";

// ── Ethiopian date alias helper ───────────────────────────────────────────────
function EthAlias({
    isoDate,
    mode,
}: {
    isoDate: string | null | undefined;
    mode: CalendarMode;
}) {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return null;
    if (mode !== "ETHIOPIAN") return null;
    const eth = getEthiopianDateDetails(date);
    return (
        <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {eth.formattedEn}
        </span>
    );
}

// ── Image upload field ────────────────────────────────────────────────────────
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
                <span className="text-slate-gray text-[11px]">optional</span>
            </Label>
            {value ? (
                <div className="relative w-full overflow-hidden rounded-xl border border-hairline">
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
                    className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-secondary/40 text-slate-gray hover:border-foreground/30 hover:bg-secondary/80 disabled:opacity-50"
                >
                    {isLoading ? (
                        <RestorchSpinner className="size-5 " />
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

// ── Check-in side sheet ───────────────────────────────────────────────────────
function CheckInSheet({
    roomId,
    roomLabel,
    open,
    onClose,
    calendarMode,
}: {
    roomId: string;
    roomLabel: string;
    open: boolean;
    onClose: () => void;
    calendarMode: CalendarMode;
}) {
    const [checkIn, { isLoading }] = useCheckInStayMutation();
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

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!guestName.trim() || !checkOutDate) {
            toast.error("Guest name and checkout date are required");
            return;
        }
        // Combine date + time → ISO string
        const plannedCheckOutAt = checkOutDate
            ? `${checkOutDate}T${checkOutTime}:00`
            : "";
        try {
            await checkIn({
                hotelRoomId: roomId,
                guestName: guestName.trim(),
                guestPhone: guestPhone.trim() || undefined,
                adults: Number(adults) || 1,
                kids: Number(kids) || 0,
                mealPlan,
                plannedCheckOutAt,
                guestIdImageUrl: idImageUrl || undefined,
            }).unwrap();
            toast.success(`${guestName.trim()} checked in`);
            // Reset
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
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Check-in failed");
        }
    }

    if (!open) return null;

    const checkInEth = checkInDate
        ? new Date(`${checkInDate}T${checkInTime}:00`)
        : null;
    const checkOutEth = checkOutDate
        ? new Date(`${checkOutDate}T${checkOutTime}:00`)
        : null;

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={onClose}
            />
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
                                {roomLabel}
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
                        {/* Guest name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ci-name">
                                Guest name{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                <Input
                                    id="ci-name"
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
                                <Label htmlFor="ci-phone">Phone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        id="ci-phone"
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
                                <Label htmlFor="ci-adults">Adults</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-gray" />
                                    <Input
                                        id="ci-adults"
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
                                <Label htmlFor="ci-kids">Children</Label>
                                <Input
                                    id="ci-kids"
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
                                                        Breakfast
                                                    </span>
                                                )}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Check-in date/time */}
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
                            {calendarMode === "ETHIOPIAN" &&
                                checkInEth &&
                                !isNaN(checkInEth.getTime()) && (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                        {
                                            getEthiopianDateDetails(checkInEth)
                                                .formattedEn
                                        }
                                    </p>
                                )}
                        </div>

                        {/* Checkout date/time */}
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
                            {calendarMode === "ETHIOPIAN" &&
                                checkOutEth &&
                                !isNaN(checkOutEth.getTime()) && (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                        {
                                            getEthiopianDateDetails(checkOutEth)
                                                .formattedEn
                                        }
                                    </p>
                                )}
                        </div>

                        {/* ID Image upload */}
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
                                isLoading || !guestName.trim() || !checkOutDate
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <RestorchSpinner className="size-4 " />
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

// ── Stay card ─────────────────────────────────────────────────────────────────
function StayCard({
    stay,
    calendarMode,
}: {
    stay: RoomStay;
    calendarMode: CalendarMode;
}) {
    const [checkOut, { isLoading: checkingOut }] = useCheckOutStayMutation();
    const [redeem, { isLoading: redeeming }] = useRedeemBreakfastMutation();

    const checkInDate = new Date(stay.checkInAt);
    const checkOutDate = new Date(stay.plannedCheckOutAt);
    const nights = Math.max(
        1,
        Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000),
    );

    const fmtDate = (d: Date) =>
        d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
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
        <div className="rounded-2xl border border-hairline bg-card p-5">
            {/* Guest header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-brand/8 text-brand">
                        <User className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-[15px] font-semibold text-foreground">
                                {stay.guestName}
                            </p>
                            {stay.mealPlan === "BREAKFAST" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                    <Coffee className="size-3" />
                                    Breakfast
                                </span>
                            )}
                        </div>
                        {stay.guestPhone && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-gray">
                                <Phone className="size-3.5" />
                                {stay.guestPhone}
                            </p>
                        )}
                    </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    In house
                </span>
            </div>

            {/* Stay details */}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-hairline pt-4">
                <div>
                    <p className="text-[11px] text-slate-gray">Check-in</p>
                    <p className="mt-0.5 text-[13px] font-medium text-foreground">
                        {fmtDate(checkInDate)}
                    </p>
                    <EthAlias isoDate={stay.checkInAt} mode={calendarMode} />
                </div>
                <div>
                    <p className="text-[11px] text-slate-gray">Checkout</p>
                    <p className="mt-0.5 text-[13px] font-medium text-foreground">
                        {fmtDate(checkOutDate)}
                    </p>
                    <EthAlias
                        isoDate={stay.plannedCheckOutAt}
                        mode={calendarMode}
                    />
                </div>
                <div>
                    <p className="text-[11px] text-slate-gray">Guests</p>
                    <p className="mt-0.5 text-[13px] font-medium text-foreground">
                        {stay.adults} adults
                        {stay.kids ? `, ${stay.kids} kids` : ""} · {nights}n
                    </p>
                </div>
            </div>

            {/* ID image */}
            {stay.guestIdImageUrl && (
                <div className="mt-4 border-t border-hairline pt-4">
                    <p className="mb-2 text-[11px] font-medium text-slate-gray uppercase tracking-[0.08em]">
                        Guest ID
                    </p>
                    <img
                        src={stay.guestIdImageUrl}
                        alt="Guest ID"
                        className="h-32 w-full rounded-xl border border-hairline object-cover"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-4">
                {stay.mealPlan === "BREAKFAST" && (
                    <button
                        type="button"
                        disabled={redeeming}
                        onClick={handleRedeem}
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[12px] font-medium hover:bg-secondary disabled:opacity-50"
                    >
                        {redeeming ? (
                            <RestorchSpinner className="size-3.5 " />
                        ) : (
                            <CheckCircle2 className="size-3.5 text-brand" />
                        )}
                        Redeem breakfast
                    </button>
                )}
                <button
                    type="button"
                    disabled={checkingOut}
                    onClick={handleCheckOut}
                    className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-xl bg-foreground px-3 text-[12px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                    {checkingOut ? (
                        <RestorchSpinner className="size-3.5 " />
                    ) : (
                        <LogOut className="size-3.5" />
                    )}
                    Check out
                </button>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RoomDetailPage({
    params,
}: {
    params: Promise<{ roomId: string }>;
}) {
    const { roomId } = use(params);
    const pathname = usePathname();
    const backHref = pathname.startsWith("/owner/")
        ? "/owner/rooms"
        : "/manager/rooms";

    const calendarMode =
        ((
            useAppSelector(state => state.identity.session) as Record<
                string,
                unknown
            > | null
        )?.calendarPreference as CalendarMode) ?? "ETHIOPIAN";

    const { data: roomsRes, isLoading: roomsLoading } = useHotelRoomsQuery();
    const { data: staysRes, isLoading: staysLoading } = useInHouseStaysQuery();
    const [checkInOpen, setCheckInOpen] = useState(false);

    const room = useMemo(
        () => roomsRes?.data.find(r => r.id === roomId),
        [roomsRes, roomId],
    );
    const activeStay = useMemo(
        () =>
            staysRes?.data.find(
                s => s.hotelRoomId === roomId && s.status === "IN_HOUSE",
            ),
        [staysRes, roomId],
    );

    const isLoading = roomsLoading || staysLoading;

    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex min-h-[200px] items-center justify-center gap-2 text-[13px] text-slate-gray">
                    <RestorchSpinner className="size-4 " />
                    Loading…
                </div>
            </DashboardFrame>
        );
    }

    if (!room) {
        return (
            <DashboardFrame>
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Rooms
                </Link>
                <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-[13px] text-destructive">
                    Room not found.
                </div>
            </DashboardFrame>
        );
    }

    const isOccupied = room.status === "OCCUPIED";
    const roomLabel = `Room ${room.roomNumber}${room.floor ? ` · Floor ${room.floor}` : ""}`;

    return (
        <DashboardFrame>
            <CheckInSheet
                roomId={roomId}
                roomLabel={roomLabel}
                open={checkInOpen}
                onClose={() => setCheckInOpen(false)}
                calendarMode={calendarMode}
            />

            {/* Back */}
            <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-gray hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Rooms
            </Link>

            {/* Hero */}
            <div className="rounded-2xl border border-hairline bg-card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                                isOccupied
                                    ? "bg-brand/8 text-brand"
                                    : "bg-secondary text-slate-gray",
                            )}
                        >
                            <BedDouble className="size-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                                    {roomLabel}
                                </h1>
                                <span
                                    className={cn(
                                        "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                        isOccupied
                                            ? "bg-brand/8 text-brand"
                                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                                    )}
                                >
                                    {isOccupied ? "Occupied" : "Available"}
                                </span>
                            </div>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {[
                                    room.wing ? `Wing ${room.wing}` : null,
                                    room.defaultWaiterName
                                        ? `Waiter: ${room.defaultWaiterName}`
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ") || "No additional info"}
                            </p>
                        </div>
                    </div>
                    {!isOccupied && (
                        <button
                            type="button"
                            onClick={() => setCheckInOpen(true)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background hover:bg-foreground/90"
                        >
                            <LogIn className="size-3.5" />
                            Check in
                        </button>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-5">
                    <div className="text-center">
                        <p className="text-[11px] text-slate-gray">Status</p>
                        <p className="mt-0.5 text-[14px] font-semibold">
                            {isOccupied ? "Occupied" : "Free"}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[11px] text-slate-gray">Guest</p>
                        <p className="mt-0.5 text-[14px] font-semibold">
                            {room.guestName || "—"}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[11px] text-slate-gray">Meal plan</p>
                        <p className="mt-0.5 text-[14px] font-semibold">
                            {room.mealPlan === "BREAKFAST"
                                ? "Breakfast"
                                : "None"}
                        </p>
                    </div>
                </div>
            </div>

            {activeStay ? (
                <StayCard stay={activeStay} calendarMode={calendarMode} />
            ) : (
                <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card text-center">
                    <BedDouble className="size-7 text-slate-gray/40" />
                    <p className="mt-2 text-[14px] font-semibold text-foreground">
                        Room is free
                    </p>
                    <p className="mt-1 text-[12px] text-slate-gray">
                        Use "Check in" to register a new guest
                    </p>
                </div>
            )}
        </DashboardFrame>
    );
}
