"use client";

import {
    AlertTriangle,
    ChevronRight,
    Clock,
    Edit3,
    Loader2,
    Plus,
    Power,
    PowerOff,
    Radio,
    RefreshCw,
    Trash2,
    UserRound,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { RestorchLoader } from "@/components/common/RestorchLoader";
import { useAppDispatch } from "@/context/hooks";
import { openAddStation, openEditStation } from "@/context/slices/stationSlice";
import {
    useDeleteStationMutation,
    useGetStationsQuery,
    useUpdateStationMutation,
} from "@/context/services/stationsApi";
import AddEditStationSheet from "@/domains/fulfillment/ui/AddEditStationSheet";
import { Link, usePathname } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { PreparationStation } from "@/domains/fulfillment/domain/station";

const POLL_MS = 5000;

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({
    station,
    isDeleting,
    onConfirm,
    onCancel,
}: {
    station: PreparationStation;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={onCancel}
                aria-label="Close"
            />
            {/* dialog */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-hairline bg-card p-6 shadow-xl">
                {/* close */}
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full text-slate-gray hover:bg-secondary"
                >
                    <X className="size-4" />
                </button>

                {/* icon */}
                <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10">
                    <AlertTriangle className="size-5 text-destructive" />
                </div>

                <h2 className="mt-4 text-[16px] font-semibold text-foreground">
                    Delete station?
                </h2>
                <p className="mt-1.5 text-[13px] text-slate-gray">
                    <span className="font-medium text-foreground">
                        {station.name}
                    </span>{" "}
                    will be permanently removed. Menu items linked to it will
                    lose their station assignment.
                </p>

                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 h-10 rounded-xl border border-hairline text-[13px] font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-destructive text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Trash2 className="size-4" />
                        )}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManagerStationsPage() {
    const t = useTranslations("managerStations");
    const tCommon = useTranslations("common");
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

    // The station staged for deletion — opens the modal
    const pathname = usePathname();
    // Derive base path so owner links to /owner/stations/[id]
    const basePath = pathname.startsWith("/owner/")
        ? "/owner/stations"
        : "/manager/stations";
    // The station staged for deletion — opens the modal
    const [pendingDelete, setPendingDelete] =
        useState<PreparationStation | null>(null);

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
            await updateStation({ id, enabled: !currentEnabled }).unwrap();
            toast.success(
                !currentEnabled
                    ? t("toastOnlineTitle")
                    : t("toastOfflineTitle"),
                !currentEnabled
                    ? t("toastOnlineBody", { name })
                    : t("toastOfflineBody", { name }),
            );
        } catch {
            toast.error(t("toastToggleErrorTitle"), t("toastToggleErrorBody"));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDelete) return;
        try {
            const res = await deleteStation(pendingDelete.id).unwrap();
            toast.success(
                t("toastDeletedTitle"),
                res.message || pendingDelete.name,
            );
            setPendingDelete(null);
            // Stay on the stations page — list refreshes via tag invalidation
        } catch {
            toast.error(t("toastDeleteErrorTitle"), t("toastDeleteErrorBody"));
            setPendingDelete(null);
        }
    };

    return (
        <DashboardFrame>
            {/* Delete modal */}
            {pendingDelete ? (
                <DeleteModal
                    station={pendingDelete}
                    isDeleting={isDeleting}
                    onConfirm={() => void handleDeleteConfirm()}
                    onCancel={() => setPendingDelete(null)}
                />
            ) : null}

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="House"
                    title="Stations"
                    description={t("pageDesc")}
                />
                <div className="flex flex-wrap items-center gap-2 self-start">
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate-gray",
                            isFetching && "opacity-70",
                        )}
                    >
                        <Radio
                            className={cn(
                                "size-3",
                                isError ? "text-red-500" : "text-emerald-500",
                            )}
                        />
                        {isError ? t("offline") : t("live")}
                        {isFetching ? (
                            <RefreshCw className="size-3 animate-spin" />
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStation())}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background hover:bg-foreground/90"
                    >
                        <Plus className="size-3.5" />
                        {t("addStation")}
                    </button>
                </div>
            </div>

            {/* KPI strip */}
            {!isLoading && !isError && stations.length > 0 ? (
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
                    {[
                        {
                            label: t("online"),
                            value: enabledCount,
                        },
                        {
                            label: t("offline"),
                            value: offlineCount,
                        },
                        {
                            label: t("openTickets"),
                            value: openTickets,
                        },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card px-5 py-3.5">
                            <p className="text-[11px] text-slate-gray">
                                {stat.label}
                            </p>
                            <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-tight text-foreground">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* States */}
            {isLoading ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-hairline bg-card">
                    <RestorchLoader size="md" label={t("loading")} />
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("loadError")}
                    </p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-3 rounded-xl bg-destructive px-4 py-1.5 text-[12px] font-medium text-destructive-foreground"
                    >
                        {t("tryAgain")}
                    </button>
                </div>
            ) : stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card py-16 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                        <UtensilsCrossed className="size-5 text-slate-gray" />
                    </div>
                    <h3 className="mt-4 text-[15px] font-semibold text-foreground">
                        {t("emptyTitle")}
                    </h3>
                    <p className="mt-1 max-w-xs text-[13px] text-slate-gray">
                        {t("emptyDesc")}
                    </p>
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStation())}
                        className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background"
                    >
                        <Plus className="size-3.5" />
                        {t("createFirst")}
                    </button>
                </div>
            ) : (
                /* Station grid */
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
                        const ticketsToday = station.ticketsToday ?? 0;
                        const owners = station.ownerNames ?? [];

                        return (
                            <article
                                key={station.id}
                                className={cn(
                                    "group flex flex-col rounded-2xl border bg-card transition-colors",
                                    isEnabled
                                        ? "border-hairline hover:border-foreground/20"
                                        : "border-dashed border-hairline opacity-80",
                                )}
                            >
                                {/* Clickable body → detail page */}
                                <Link
                                    href={`${basePath}/${station.id}`}
                                    className="flex flex-1 flex-col p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                                                    {station.name}
                                                </h2>
                                                <span
                                                    className={cn(
                                                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                                        isEnabled
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                            : "bg-secondary text-slate-gray",
                                                    )}
                                                >
                                                    {isEnabled
                                                        ? t("online")
                                                        : t("offline")}
                                                </span>
                                            </div>
                                            {station.code ? (
                                                <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-slate-gray">
                                                    {station.code}
                                                </p>
                                            ) : null}
                                        </div>
                                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-slate-gray opacity-0 transition-opacity group-hover:opacity-60" />
                                    </div>

                                    {/* Owner + today */}
                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-gray">
                                        <span className="inline-flex items-center gap-1.5">
                                            <UserRound className="size-3.5" />
                                            {owners.length > 0
                                                ? owners.join(", ")
                                                : t("noOwner")}
                                        </span>
                                        <span>·</span>
                                        <span>
                                            {t("ticketsTodayCount", {
                                                count: ticketsToday,
                                            })}
                                        </span>
                                    </div>

                                    {/* Stats row */}
                                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline pt-3.5 text-[12px] text-slate-gray">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span
                                                className={cn(
                                                    "size-1.5 rounded-full",
                                                    ticketCount > 0
                                                        ? "bg-brand"
                                                        : "bg-slate-gray/30",
                                                )}
                                            />
                                            {ticketCount === 1
                                                ? t("ticketOne", {
                                                      count: ticketCount,
                                                  })
                                                : t("ticketMany", {
                                                      count: ticketCount,
                                                  })}
                                        </span>
                                        <span>
                                            {menuItemCount === 1
                                                ? t("itemOne", {
                                                      count: menuItemCount,
                                                  })
                                                : t("itemMany", {
                                                      count: menuItemCount,
                                                  })}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="size-3.5" />
                                            {t("min", { count: avgMin })}
                                        </span>
                                    </div>
                                </Link>

                                {/* Action footer */}
                                <div className="flex items-center justify-between gap-2 border-t border-hairline px-4 py-3">
                                    {/* Toggle */}
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
                                            "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors",
                                            isEnabled
                                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                : "bg-secondary text-slate-gray hover:bg-secondary/80",
                                        )}
                                    >
                                        {isToggling ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : isEnabled ? (
                                            <Power className="size-3.5" />
                                        ) : (
                                            <PowerOff className="size-3.5" />
                                        )}
                                        {isEnabled ? t("on") : t("off")}
                                    </button>

                                    {/* Delete + Edit */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPendingDelete(station)
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium text-destructive hover:bg-destructive/8 transition-colors"
                                        >
                                            <Trash2 className="size-3.5" />
                                            {tCommon("delete")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                dispatch(
                                                    openEditStation(station),
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors"
                                        >
                                            <Edit3 className="size-3.5 text-slate-gray" />
                                            {tCommon("edit")}
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
