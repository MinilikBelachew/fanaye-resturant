"use client";

import { useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Box,
    CheckCircle2,
    Clock,
    MapPin,
    Navigation,
    PackageCheck,
    Phone,
    RotateCw,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import {
    useGetMyDriverTransfersQuery,
    useMarkDriverArrivedMutation,
    useStartDriverTripMutation,
    type InventoryTransfer,
} from "@/context/services/inventoryApi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function DriverPortalBoard() {
    const staff = useAppSelector(selectCurrentStaff);
    const { data, isLoading, isFetching, refetch } =
        useGetMyDriverTransfersQuery(undefined, {
            pollingInterval: 12000,
        });

    const [startTrip, { isLoading: isStarting }] = useStartDriverTripMutation();
    const [markArrived, { isLoading: isArriving }] =
        useMarkDriverArrivedMutation();

    const [activeTab, setActiveTab] = useState<"active" | "completed">(
        "active",
    );
    const [arrivalNotes, setArrivalNotes] = useState<Record<string, string>>(
        {},
    );
    const [confirmingArrivalId, setConfirmingArrivalId] = useState<
        string | null
    >(null);

    const driverInfo = data?.data?.driver;
    const pendingTransfers = data?.data?.pendingPickup ?? [];
    const inTransitTransfers = data?.data?.inTransit ?? [];
    const completedTransfers = data?.data?.completed ?? [];

    const totalActiveCount =
        pendingTransfers.length + inTransitTransfers.length;

    async function handleStartTrip(transfer: InventoryTransfer) {
        try {
            await startTrip({ id: transfer.id }).unwrap();
            toast.success(
                "Trip Started",
                `Delivery to ${transfer.toLocation?.name || "destination"} is now In-Transit.`,
            );
        } catch (err) {
            toast.fromUnknown(err, "Could not start trip. Please try again.");
        }
    }

    async function handleConfirmArrival(transferId: string) {
        try {
            const notes = arrivalNotes[transferId]?.trim() || undefined;
            await markArrived({ id: transferId, notes }).unwrap();
            setConfirmingArrivalId(null);
            setArrivalNotes(prev => {
                const next = { ...prev };
                delete next[transferId];
                return next;
            });
            toast.success(
                "Arrival Recorded",
                "Destination branch has been notified of your delivery.",
            );
        } catch (err) {
            toast.fromUnknown(err, "Failed to record arrival.");
        }
    }

    return (
        <div className="space-y-5">
            {/* Driver Profile Header Card */}
            <div className="relative overflow-hidden rounded-2xl border border-hairline bg-card p-4.5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Truck className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[17px] font-bold text-foreground">
                                    {driverInfo?.name ||
                                        staff?.name ||
                                        "Driver"}
                                </h1>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Fleet
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[12px] text-slate-gray">
                                {driverInfo?.licencePlate ? (
                                    <span className="font-mono font-semibold uppercase text-foreground">
                                        {driverInfo.licencePlate}
                                    </span>
                                ) : null}
                                {driverInfo?.vehicleDesc ? (
                                    <span>{driverInfo.vehicleDesc}</span>
                                ) : null}
                                {driverInfo?.phone ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Phone className="size-3" />
                                        {driverInfo.phone}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isFetching}
                        onClick={() => void refetch()}
                        className="h-8 gap-1.5 rounded-xl text-[12px] cursor-pointer"
                    >
                        <RotateCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin",
                            )}
                        />
                        <span>{isFetching ? "Syncing..." : "Sync"}</span>
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex rounded-xl border border-hairline bg-muted/40 p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab("active")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-all cursor-pointer",
                        activeTab === "active"
                            ? "bg-card text-foreground shadow-xs"
                            : "text-slate-gray hover:text-foreground",
                    )}
                >
                    <Navigation className="size-4" />
                    <span>Active Deliveries</span>
                    {totalActiveCount > 0 ? (
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                            {totalActiveCount}
                        </span>
                    ) : null}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("completed")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-all cursor-pointer",
                        activeTab === "completed"
                            ? "bg-card text-foreground shadow-xs"
                            : "text-slate-gray hover:text-foreground",
                    )}
                >
                    <PackageCheck className="size-4" />
                    <span>Completed</span>
                    {completedTransfers.length > 0 ? (
                        <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-semibold text-slate-gray">
                            {completedTransfers.length}
                        </span>
                    ) : null}
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card py-16 text-center">
                    <RotateCw className="size-8 animate-spin text-primary" />
                    <p className="mt-3 text-[14px] font-medium text-foreground">
                        Loading your assigned transit runs...
                    </p>
                </div>
            ) : activeTab === "active" ? (
                <div className="space-y-6">
                    {/* 1. IN TRANSIT TRIPS (Top Priority) */}
                    {inTransitTransfers.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-foreground">
                                    <span className="flex size-2 rounded-full bg-cyan-500 animate-ping" />
                                    <span>
                                        In-Transit Trips (
                                        {inTransitTransfers.length})
                                    </span>
                                </h2>
                                <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
                                    On the road
                                </span>
                            </div>

                            <div className="space-y-3">
                                {inTransitTransfers.map(transfer => {
                                    const isConfirming =
                                        confirmingArrivalId === transfer.id;
                                    return (
                                        <div
                                            key={transfer.id}
                                            className="overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-card shadow-sm"
                                        >
                                            <div className="border-b border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5 flex items-center justify-between">
                                                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-cyan-700 dark:text-cyan-300">
                                                    <Navigation className="size-3.5" />
                                                    TRIP IN TRANSIT
                                                </span>
                                                <span className="text-[11px] text-slate-gray font-mono">
                                                    #{transfer.id.slice(0, 8)}
                                                </span>
                                            </div>

                                            <div className="p-4 space-y-4">
                                                {/* Origin to Destination Route */}
                                                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-gray">
                                                            From (Origin)
                                                        </span>
                                                        <p className="font-semibold text-foreground text-[14px] truncate">
                                                            {transfer
                                                                .fromLocation
                                                                ?.name ||
                                                                "Warehouse"}
                                                        </p>
                                                    </div>
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
                                                        <ArrowRight className="size-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 text-right">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-gray">
                                                            To (Destination)
                                                        </span>
                                                        <p className="font-semibold text-foreground text-[14px] truncate">
                                                            {transfer.toLocation
                                                                ?.name ||
                                                                "Branch"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Cargo Manifest Lines */}
                                                <div>
                                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
                                                        Cargo Manifest (
                                                        {transfer.lines
                                                            ?.length || 0}{" "}
                                                        items)
                                                    </span>
                                                    <div className="mt-1.5 divide-y divide-hairline rounded-xl border border-hairline bg-card/60">
                                                        {transfer.lines?.map(
                                                            line => (
                                                                <div
                                                                    key={
                                                                        line.id
                                                                    }
                                                                    className="flex items-center justify-between px-3 py-2 text-[13px]"
                                                                >
                                                                    <span className="font-medium text-foreground truncate pr-2">
                                                                        {line
                                                                            .ingredient
                                                                            ?.name ||
                                                                            "Item"}
                                                                    </span>
                                                                    <span className="shrink-0 font-mono font-bold text-foreground">
                                                                        {
                                                                            line.quantitySent
                                                                        }{" "}
                                                                        <span className="text-[11px] font-normal text-slate-gray">
                                                                            {line
                                                                                .ingredient
                                                                                ?.unit ||
                                                                                ""}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                {transfer.note ? (
                                                    <p className="rounded-lg bg-muted/30 px-3 py-2 text-[12px] text-slate-gray italic">
                                                        Note: {transfer.note}
                                                    </p>
                                                ) : null}

                                                {/* Action Buttons */}
                                                {!isConfirming ? (
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            setConfirmingArrivalId(
                                                                transfer.id,
                                                            )
                                                        }
                                                        className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-[14px] shadow-sm cursor-pointer"
                                                    >
                                                        <MapPin className="size-4 mr-2" />
                                                        Mark Arrived at
                                                        Destination
                                                    </Button>
                                                ) : (
                                                    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3.5 space-y-3">
                                                        <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-200">
                                                            <CheckCircle2 className="size-4 shrink-0" />
                                                            <span className="text-[13px] font-bold">
                                                                Confirm Arrival
                                                                at{" "}
                                                                {
                                                                    transfer
                                                                        .toLocation
                                                                        ?.name
                                                                }
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Arrival note (optional, e.g. Back dock)"
                                                            value={
                                                                arrivalNotes[
                                                                    transfer.id
                                                                ] || ""
                                                            }
                                                            onChange={e =>
                                                                setArrivalNotes(
                                                                    prev => ({
                                                                        ...prev,
                                                                        [transfer.id]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            className="w-full h-9 rounded-lg border border-hairline bg-card px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                disabled={
                                                                    isArriving
                                                                }
                                                                onClick={() =>
                                                                    void handleConfirmArrival(
                                                                        transfer.id,
                                                                    )
                                                                }
                                                                className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold cursor-pointer"
                                                            >
                                                                {isArriving
                                                                    ? "Saving..."
                                                                    : "Confirm Arrival"}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setConfirmingArrivalId(
                                                                        null,
                                                                    )
                                                                }
                                                                className="h-9 rounded-lg text-[13px] cursor-pointer"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    {/* 2. PENDING PICKUPS */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-foreground">
                                <Box className="size-4 text-amber-500" />
                                <span>
                                    Pending Pickups ({pendingTransfers.length})
                                </span>
                            </h2>
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                Awaiting your acceptance
                            </span>
                        </div>

                        {pendingTransfers.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-hairline bg-card/60 p-6 text-center">
                                <p className="text-[13px] text-slate-gray">
                                    No pending pickup transfers currently
                                    assigned to your vehicle.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingTransfers.map(transfer => (
                                    <div
                                        key={transfer.id}
                                        className="rounded-2xl border border-hairline bg-card p-4 shadow-xs space-y-3.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                                <Clock className="size-3" />
                                                New Assignment — Accept to Start
                                            </span>
                                            <span className="text-[11px] text-slate-gray font-mono">
                                                #{transfer.id.slice(0, 8)}
                                            </span>
                                        </div>

                                        {/* Route details */}
                                        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3">
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-gray">
                                                    Pickup At
                                                </span>
                                                <p className="font-semibold text-foreground text-[14px] truncate">
                                                    {transfer.fromLocation
                                                        ?.name || "Warehouse"}
                                                </p>
                                            </div>
                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-slate-gray">
                                                <ArrowRight className="size-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1 text-right">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-gray">
                                                    Deliver To
                                                </span>
                                                <p className="font-semibold text-foreground text-[14px] truncate">
                                                    {transfer.toLocation
                                                        ?.name || "Branch"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Cargo items summary */}
                                        <div className="rounded-xl border border-hairline bg-card/50 p-2.5">
                                            <div className="text-[12px] text-slate-gray flex items-center justify-between mb-1">
                                                <span className="font-medium">
                                                    Cargo list
                                                </span>
                                                <span>
                                                    {transfer.lines?.length ||
                                                        0}{" "}
                                                    product(s)
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {transfer.lines?.map(l => (
                                                    <span
                                                        key={l.id}
                                                        className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground"
                                                    >
                                                        {l.ingredient?.name} (
                                                        {l.quantitySent}{" "}
                                                        {l.ingredient?.unit})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            disabled={isStarting}
                                            onClick={() =>
                                                void handleStartTrip(transfer)
                                            }
                                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-[14px] shadow-xs cursor-pointer"
                                        >
                                            <Truck className="size-4 mr-2" />
                                            {isStarting
                                                ? "Starting..."
                                                : "Accept & Start Trip"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* All caught up banner */}
                    {totalActiveCount === 0 ? (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-2">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                                <ShieldCheck className="size-6" />
                            </div>
                            <h3 className="text-[16px] font-bold text-foreground">
                                All Caught Up!
                            </h3>
                            <p className="mx-auto max-w-sm text-[13px] text-slate-gray">
                                You have no active runs. When a central
                                warehouse or branch dispatches stock to your
                                vehicle, it will appear here instantly.
                            </p>
                        </div>
                    ) : null}
                </div>
            ) : (
                /* Completed Deliveries Tab */
                <div className="space-y-3">
                    <h2 className="text-[14px] font-bold tracking-tight text-foreground">
                        Recent Delivered Transfers ({completedTransfers.length})
                    </h2>

                    {completedTransfers.length === 0 ? (
                        <div className="rounded-2xl border border-hairline bg-card p-8 text-center text-[13px] text-slate-gray">
                            No completed trips recorded yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {completedTransfers.map(t => (
                                <div
                                    key={t.id}
                                    className="rounded-2xl border border-hairline bg-card p-4 shadow-xs space-y-2.5 opacity-90"
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                t.status === "ARRIVED"
                                                    ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                                                    : "bg-emerald-500/10 text-emerald-600"
                                            }`}
                                        >
                                            <CheckCircle2 className="size-3" />
                                            {t.status === "ARRIVED"
                                                ? "Arrived (Pending Branch Acceptance)"
                                                : "Delivered & Received"}
                                        </span>
                                        <span className="text-[11px] text-slate-gray font-mono">
                                            #{t.id.slice(0, 8)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px] font-medium text-foreground">
                                        <span>{t.fromLocation?.name}</span>
                                        <ArrowRight className="size-3 text-slate-gray" />
                                        <span>{t.toLocation?.name}</span>
                                    </div>

                                    <p className="text-[11px] text-slate-gray">
                                        {t.lines?.length || 0} item(s) delivered
                                        {t.receivedAt
                                            ? ` • Received ${new Date(t.receivedAt).toLocaleDateString()}`
                                            : ""}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
