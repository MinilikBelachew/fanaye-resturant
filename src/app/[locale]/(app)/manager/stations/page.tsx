"use client";

import {
    Clock,
    Edit3,
    Loader2,
    Plus,
    Power,
    PowerOff,
    Radio,
    RefreshCw,
    Trash2,
    UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useAppDispatch } from "@/context/hooks";
import { openAddStation, openEditStation } from "@/context/slices/stationSlice";
import {
    useDeleteStationMutation,
    useGetStationsQuery,
    useUpdateStationMutation,
} from "@/context/services/stationsApi";
import AddEditStationSheet from "@/domains/fulfillment/ui/AddEditStationSheet";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

const POLL_MS = 5000;

export default function ManagerStationsPage() {
    const dispatch = useAppDispatch();
    const {
        data: stations = [],
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetStationsQuery(undefined, { pollingInterval: POLL_MS });
    const [updateStation, { isLoading: isToggling }] =
        useUpdateStationMutation();
    const [deleteStation, { isLoading: isDeleting }] =
        useDeleteStationMutation();
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const enabledCount = stations.filter(
        s => s.enabled ?? s.status === "ACTIVE",
    ).length;
    const offlineCount = stations.length - enabledCount;
    const openTickets = stations.reduce(
        (sum, s) => sum + (s.ticketCount ?? 0),
        0,
    );

    const handleToggle = async (
        id: string,
        currentEnabled: boolean,
        name: string,
    ) => {
        try {
            await updateStation({
                id,
                enabled: !currentEnabled,
            }).unwrap();
            toast.success(
                !currentEnabled ? "Station online" : "Station offline",
                !currentEnabled
                    ? `${name} items are back on waiter & QR menus.`
                    : `${name} items are hidden from waiter & QR menus.`,
            );
        } catch {
            toast.error(
                "Failed to update status",
                "Could not toggle station status.",
            );
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirmDeleteId !== id) {
            setConfirmDeleteId(id);
            return;
        }
        try {
            const res = await deleteStation(id).unwrap();
            toast.success("Station deleted", res.message || name);
            setConfirmDeleteId(null);
        } catch {
            toast.error(
                "Delete failed",
                "Could not delete this station. Try turning it offline instead.",
            );
            setConfirmDeleteId(null);
        }
    };

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="House"
                    title="Stations"
                    description="Turn prep stations on or off. Offline stations hide dishes and pause new tickets."
                />
                <div className="flex flex-wrap items-center gap-2 self-start">
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate-gray",
                            isFetching && "opacity-80",
                        )}
                    >
                        <Radio
                            className={cn(
                                "size-3",
                                isError ? "text-red-500" : "text-emerald-500",
                            )}
                        />
                        {isError ? "Offline" : "Live"}
                        {isFetching ? (
                            <RefreshCw className="size-3 animate-spin" />
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => dispatch(openAddStation())}
                        className="h-8 gap-1.5 rounded-full text-[12px] font-normal"
                    >
                        <Plus className="size-3.5" />
                        Add station
                    </Button>
                </div>
            </div>

            {!isLoading && !isError && stations.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[14px] border border-hairline bg-card px-3.5 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-gray">
                            Online
                        </p>
                        <p className="mt-0.5 text-[18px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                            {enabledCount}
                        </p>
                    </div>
                    <div className="rounded-[14px] border border-hairline bg-card px-3.5 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-gray">
                            Offline
                        </p>
                        <p className="mt-0.5 text-[18px] font-medium tabular-nums text-slate-gray">
                            {offlineCount}
                        </p>
                    </div>
                    <div className="rounded-[14px] border border-hairline bg-card px-3.5 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-gray">
                            Open tickets
                        </p>
                        <p className="mt-0.5 text-[18px] font-medium tabular-nums text-brand">
                            {openTickets}
                        </p>
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-[14px] border border-hairline bg-card py-14">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="mt-2 text-[12px] text-slate-gray">
                        Loading stations…
                    </p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center rounded-[14px] border border-destructive/20 bg-destructive/5 py-10 text-center">
                    <p className="text-[13px] text-destructive">
                        Failed to load stations.
                    </p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-3 rounded-full bg-destructive px-3 py-1.5 text-[12px] font-normal text-destructive-foreground"
                    >
                        Try again
                    </button>
                </div>
            ) : stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-hairline bg-card py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-slate-gray">
                        <UtensilsCrossed className="size-5" />
                    </div>
                    <h3 className="mt-3 text-[14px] font-medium text-foreground">
                        No preparation stations yet
                    </h3>
                    <p className="mt-1 max-w-sm text-[12px] text-slate-gray">
                        Create Kitchen, Barista, or Grill stations to route
                        tickets.
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => dispatch(openAddStation())}
                        className="mt-4 h-8 gap-1.5 rounded-full text-[12px] font-normal"
                    >
                        <Plus className="size-3.5" />
                        Create first station
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {stations.map(station => {
                        const isEnabled =
                            station.enabled ?? station.status === "ACTIVE";
                        const avgMin =
                            station.avgPrepMin ??
                            station.defaultDelayThresholdMinutes ??
                            10;
                        const ticketCount = station.ticketCount ?? 0;
                        const menuItemCount = station.menuItemCount ?? 0;

                        return (
                            <article
                                key={station.id}
                                className={cn(
                                    "flex flex-col justify-between rounded-[14px] border bg-card p-4",
                                    isEnabled
                                        ? "border-hairline"
                                        : "border-dashed border-hairline opacity-85",
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-[14px] font-medium tracking-tight text-foreground">
                                                {station.name}
                                            </h2>
                                            <Badge
                                                variant={
                                                    isEnabled
                                                        ? "success"
                                                        : "secondary"
                                                }
                                                className="rounded-full px-2 py-0 text-[10px] font-normal"
                                            >
                                                {isEnabled
                                                    ? "Online"
                                                    : "Offline"}
                                            </Badge>
                                        </div>
                                        {station.code ? (
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                {station.code}
                                            </p>
                                        ) : null}
                                        <p className="mt-1.5 text-[12px] text-slate-gray">
                                            {isEnabled
                                                ? "Accepting tickets · dishes on menus"
                                                : "Hidden from menus · new tickets blocked"}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isToggling}
                                        onClick={() =>
                                            void handleToggle(
                                                station.id,
                                                isEnabled,
                                                station.name,
                                            )
                                        }
                                        className={cn(
                                            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-normal transition-colors",
                                            isEnabled
                                                ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15"
                                                : "bg-secondary text-slate-gray hover:bg-secondary/80",
                                        )}
                                    >
                                        {isEnabled ? (
                                            <Power className="size-3.5" />
                                        ) : (
                                            <PowerOff className="size-3.5" />
                                        )}
                                        {isEnabled ? "On" : "Off"}
                                    </button>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-[11px] text-slate-gray">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="inline-flex items-center gap-1.5 text-foreground">
                                            <span
                                                className={cn(
                                                    "size-1.5 rounded-full",
                                                    ticketCount > 0
                                                        ? "bg-emerald-500"
                                                        : "bg-zinc-300",
                                                )}
                                            />
                                            {ticketCount} ticket
                                            {ticketCount === 1 ? "" : "s"}
                                        </span>
                                        <span>
                                            {menuItemCount} item
                                            {menuItemCount === 1 ? "" : "s"}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {avgMin} min
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() =>
                                                void handleDelete(
                                                    station.id,
                                                    station.name,
                                                )
                                            }
                                            onBlur={() => {
                                                if (
                                                    confirmDeleteId ===
                                                    station.id
                                                ) {
                                                    setTimeout(
                                                        () =>
                                                            setConfirmDeleteId(
                                                                null,
                                                            ),
                                                        200,
                                                    );
                                                }
                                            }}
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-normal",
                                                confirmDeleteId === station.id
                                                    ? "bg-destructive text-destructive-foreground"
                                                    : "border border-hairline text-destructive hover:bg-destructive/10",
                                            )}
                                        >
                                            <Trash2 className="size-3" />
                                            {confirmDeleteId === station.id
                                                ? "Confirm"
                                                : "Delete"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                dispatch(
                                                    openEditStation(station),
                                                )
                                            }
                                            className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[11px] font-normal text-foreground hover:bg-secondary"
                                        >
                                            <Edit3 className="size-3 text-slate-gray" />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <AddEditStationSheet />
        </DashboardFrame>
    );
}
