"use client";

import { useMemo, useState } from "react";
import {
    BedDouble,
    Coffee,
    Loader2,
    Plus,
    Settings2,
    User,
    X,
} from "lucide-react";
import {
    useArchiveHotelRoomMutation,
    useCreateHotelRoomMutation,
    useHotelRoomsQuery,
    useRoomSettingsQuery,
    useUpdateRoomSettingsMutation,
    type HotelRoom,
} from "@/context/services/roomsApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "@/i18n/navigation";

// ── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({
    label,
    description,
    checked,
    disabled,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-hairline bg-card p-4 transition-colors hover:border-foreground/20">
            <div>
                <p className="text-[14px] font-medium text-foreground">
                    {label}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-gray">
                    {description}
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40",
                    checked ? "bg-brand" : "bg-slate-gray/30",
                )}
            >
                <span
                    className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                        checked ? "translate-x-5" : "translate-x-0.5",
                    )}
                />
            </button>
        </label>
    );
}

// ── Add Room Sheet ────────────────────────────────────────────────────────────
function AddRoomSheet({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [createRoom, { isLoading }] = useCreateHotelRoomMutation();
    const [roomNumber, setRoomNumber] = useState("");
    const [floor, setFloor] = useState("");
    const [wing, setWing] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [roomNumberError, setRoomNumberError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const number = roomNumber.trim();
        if (!number) {
            setRoomNumberError("Room number is required");
            return;
        }
        setRoomNumberError(null);
        try {
            await createRoom({
                roomNumber: number,
                floor: floor.trim() || undefined,
                wing: wing.trim() || undefined,
                sortOrder: sortOrder ? Number(sortOrder) : undefined,
            }).unwrap();
            toast.success(`Room ${number} added`);
            setRoomNumber("");
            setFloor("");
            setWing("");
            setSortOrder("");
            onClose();
        } catch (err: unknown) {
            const errors = (
                err as { data?: { errors?: Record<string, string> } }
            )?.data?.errors;
            if (errors?.roomNumber === "duplicate") {
                setRoomNumberError(
                    `Room ${number} already exists in this branch. Use a different number.`,
                );
            } else {
                toast.fromUnknown(err, "Could not create room");
            }
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={onClose}
                aria-label="Close"
            />
            <aside className="absolute inset-y-0 right-0 z-10 flex h-full w-[28rem] max-w-[calc(100vw-1rem)] flex-col border-l border-hairline bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10">
                            <BedDouble className="size-4 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-semibold">
                                Add room
                            </h2>
                            <p className="mt-0.5 text-[12px] text-slate-gray">
                                Configure a new hotel room
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
                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        {/* Room number */}
                        <div className="space-y-1.5">
                            <Label htmlFor="rn-number">
                                Room number{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="rn-number"
                                value={roomNumber}
                                onChange={e => {
                                    setRoomNumber(e.target.value);
                                    setRoomNumberError(null);
                                }}
                                placeholder="e.g. 101, 305, B2"
                                className={cn(
                                    "h-10 rounded-xl",
                                    roomNumberError &&
                                        "border-destructive focus-visible:ring-destructive/20",
                                )}
                                autoFocus
                            />
                            {roomNumberError ? (
                                <p className="flex items-center gap-1 text-[12px] text-destructive">
                                    <span className="inline-block size-1.5 shrink-0 rounded-full bg-destructive" />
                                    {roomNumberError}
                                </p>
                            ) : (
                                <p className="text-[11px] text-slate-gray">
                                    Staff call out this number at the floor
                                </p>
                            )}
                        </div>

                        {/* Floor + Wing */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="rn-floor">
                                    Floor{" "}
                                    <span className="text-slate-gray text-[11px]">
                                        optional
                                    </span>
                                </Label>
                                <Input
                                    id="rn-floor"
                                    value={floor}
                                    onChange={e => setFloor(e.target.value)}
                                    placeholder="3"
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="rn-wing">
                                    Wing{" "}
                                    <span className="text-slate-gray text-[11px]">
                                        optional
                                    </span>
                                </Label>
                                <Input
                                    id="rn-wing"
                                    value={wing}
                                    onChange={e => setWing(e.target.value)}
                                    placeholder="North"
                                    className="h-10 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Sort order */}
                        <div className="space-y-1.5">
                            <Label htmlFor="rn-sort">
                                Sort order{" "}
                                <span className="text-slate-gray text-[11px]">
                                    optional
                                </span>
                            </Label>
                            <Input
                                id="rn-sort"
                                type="number"
                                min={0}
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                                placeholder="0"
                                className="h-10 rounded-xl"
                            />
                            <p className="text-[11px] text-slate-gray">
                                Lower numbers appear first in lists
                            </p>
                        </div>
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
                            disabled={isLoading || !roomNumber.trim()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-5 text-[13px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Plus className="size-4" />
                            )}
                            Add room
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const s = status.toUpperCase();
    const cls =
        s === "OCCUPIED"
            ? "bg-brand/8 text-brand"
            : s === "AVAILABLE"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-secondary text-slate-gray";
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                cls,
            )}
        >
            <span
                className={cn(
                    "mr-1.5 size-1.5 rounded-full",
                    s === "OCCUPIED"
                        ? "bg-brand"
                        : s === "AVAILABLE"
                          ? "bg-emerald-500"
                          : "bg-slate-gray/50",
                )}
            />
            {s === "OCCUPIED"
                ? "Occupied"
                : s === "AVAILABLE"
                  ? "Available"
                  : status}
        </span>
    );
}

// ── Board ─────────────────────────────────────────────────────────────────────
export default function ManagerRoomsBoard() {
    const router = useRouter();
    const pathname = usePathname();
    const basePath = pathname.startsWith("/owner/") ? "/owner" : "/manager";

    const { data: settingsRes, isLoading: settingsLoading } =
        useRoomSettingsQuery();
    const { data: roomsRes, isLoading: roomsLoading } = useHotelRoomsQuery(
        undefined,
        { skip: !settingsRes?.data.roomServiceEnabled },
    );
    const [updateSettings, { isLoading: savingSettings }] =
        useUpdateRoomSettingsMutation();
    const [archiveRoom] = useArchiveHotelRoomMutation();

    const settings = settingsRes?.data;
    const rooms = useMemo(() => roomsRes?.data ?? [], [roomsRes?.data]);
    const [addOpen, setAddOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Stats
    const available = rooms.filter(r => r.status === "AVAILABLE").length;
    const occupied = rooms.filter(r => r.status === "OCCUPIED").length;

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

    async function onArchive(id: string, label: string) {
        if (!confirm(`Archive Room ${label}? This cannot be undone.`)) return;
        try {
            await archiveRoom(id).unwrap();
            toast.success(`Room ${label} archived`);
        } catch (err) {
            toast.fromUnknown(err, "Could not archive room");
        }
    }

    // DataTable columns
    const columns = useMemo<DataTableColumn<HotelRoom>[]>(
        () => [
            {
                id: "room",
                header: "Room",
                sortValue: row => row.roomNumber,
                cell: row => (
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                row.status === "OCCUPIED"
                                    ? "bg-brand/8 text-brand"
                                    : "bg-secondary text-slate-gray",
                            )}
                        >
                            <BedDouble className="size-4" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-foreground">
                                Room {row.roomNumber}
                            </p>
                            <p className="text-[11px] text-slate-gray">
                                {[
                                    row.floor ? `Floor ${row.floor}` : null,
                                    row.wing ? `Wing ${row.wing}` : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ") || "—"}
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                id: "status",
                header: "Status",
                sortValue: row => row.status,
                cell: row => <StatusBadge status={row.status} />,
            },
            {
                id: "guest",
                header: "Guest",
                cell: row =>
                    row.guestName ? (
                        <div className="flex items-center gap-1.5 text-[13px] text-foreground">
                            <User className="size-3.5 text-slate-gray" />
                            {row.guestName}
                            {row.mealPlan === "BREAKFAST" ? (
                                <Coffee className="size-3.5 text-amber-500" />
                            ) : null}
                        </div>
                    ) : (
                        <span className="text-[12px] text-slate-gray">—</span>
                    ),
            },
            {
                id: "waiter",
                header: "Assigned waiter",
                cell: row =>
                    row.defaultWaiterName ? (
                        <span className="text-[13px] text-foreground">
                            {row.defaultWaiterName}
                        </span>
                    ) : (
                        <span className="text-[12px] text-slate-gray">
                            Unassigned
                        </span>
                    ),
            },
            {
                id: "actions",
                header: "",
                cell: row => (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                router.push(
                                    `${basePath}/rooms/${row.id}` as never,
                                );
                            }}
                            className="h-7 rounded-lg border border-hairline px-2.5 text-[12px] font-medium hover:border-foreground/20"
                        >
                            Details
                        </button>
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                void onArchive(row.id, row.roomNumber);
                            }}
                            className="h-7 rounded-lg px-2.5 text-[12px] font-medium text-destructive hover:bg-destructive/8"
                        >
                            Archive
                        </button>
                    </div>
                ),
            },
        ],
        [basePath, router],
    );

    return (
        <DashboardFrame>
            <AddRoomSheet open={addOpen} onClose={() => setAddOpen(false)} />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="House"
                    title="Rooms"
                    description="Hotel rooms for room service and breakfast entitlements."
                />
                <div className="flex items-center gap-2 self-start">
                    <button
                        type="button"
                        onClick={() => setShowSettings(s => !s)}
                        className={cn(
                            "inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline px-3 text-[13px] font-medium transition-colors",
                            showSettings
                                ? "bg-secondary text-foreground"
                                : "bg-card text-slate-gray hover:text-foreground",
                        )}
                    >
                        <Settings2 className="size-4" />
                        Settings
                    </button>
                    {settings?.roomServiceEnabled && (
                        <button
                            type="button"
                            onClick={() => setAddOpen(true)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background hover:bg-foreground/90"
                        >
                            <Plus className="size-3.5" />
                            Add room
                        </button>
                    )}
                </div>
            </div>

            {settingsLoading ? (
                <div className="flex min-h-[180px] items-center justify-center gap-2 text-[13px] text-slate-gray">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Settings panel */}
                    {showSettings && (
                        <section className="space-y-2">
                            <ToggleRow
                                label="Room service"
                                description="Enable hotel room ordering and guest check-in"
                                checked={settings?.roomServiceEnabled ?? false}
                                disabled={savingSettings}
                                onChange={v =>
                                    void toggleFeature("roomServiceEnabled", v)
                                }
                            />
                            <ToggleRow
                                label="Breakfast entitlement"
                                description={
                                    settings?.breakfastEntitlementEnabled
                                        ? `Window ${settings.breakfastValidFromLocal}–${settings.breakfastValidToLocal}`
                                        : "Included breakfast redemption per stay per day"
                                }
                                checked={
                                    settings?.breakfastEntitlementEnabled ??
                                    false
                                }
                                disabled={
                                    savingSettings ||
                                    !settings?.roomServiceEnabled
                                }
                                onChange={v =>
                                    void toggleFeature(
                                        "breakfastEntitlementEnabled",
                                        v,
                                    )
                                }
                            />
                        </section>
                    )}

                    {settings?.roomServiceEnabled ? (
                        <>
                            {/* KPI strip */}
                            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
                                {[
                                    {
                                        label: "Total rooms",
                                        value: rooms.length,
                                    },
                                    { label: "Available", value: available },
                                    { label: "Occupied", value: occupied },
                                ].map(s => (
                                    <div
                                        key={s.label}
                                        className="bg-card px-4 py-3"
                                    >
                                        <p className="text-[11px] text-slate-gray">
                                            {s.label}
                                        </p>
                                        <p className="mt-1 text-[24px] font-semibold tabular-nums text-foreground">
                                            {s.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Table */}
                            <DataTable
                                columns={columns}
                                data={rooms}
                                rowKey={r => r.id}
                                loading={roomsLoading}
                                empty="No rooms configured yet. Click Add room to get started."
                                searchPlaceholder="Search rooms…"
                                searchText={r =>
                                    [
                                        r.roomNumber,
                                        r.floor,
                                        r.wing,
                                        r.guestName,
                                        r.defaultWaiterName,
                                        r.status,
                                    ]
                                        .filter(Boolean)
                                        .join(" ")
                                }
                                showColumnToggle={false}
                                onRowClick={row =>
                                    router.push(
                                        `${basePath}/rooms/${row.id}` as never,
                                    )
                                }
                            />
                        </>
                    ) : (
                        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card text-center">
                            <BedDouble className="size-8 text-slate-gray/40" />
                            <p className="mt-3 text-[14px] font-semibold text-foreground">
                                Room service is off
                            </p>
                            <p className="mt-1 max-w-xs text-[13px] text-slate-gray">
                                Enable room service in Settings to configure
                                hotel rooms
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowSettings(true)}
                                className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[12px] font-medium hover:bg-secondary"
                            >
                                <Settings2 className="size-3.5" />
                                Open settings
                            </button>
                        </div>
                    )}
                </div>
            )}
        </DashboardFrame>
    );
}
