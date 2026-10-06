"use client";

import {
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
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

const POLL_MS = 5000;

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

    const handleDelete = async (id: string, name: string) => {
        if (confirmDeleteId !== id) {
            setConfirmDeleteId(id);
            return;
        }
        try {
            const res = await deleteStation(id).unwrap();
            toast.success(t("toastDeletedTitle"), res.message || name);
            setConfirmDeleteId(null);
        } catch {
            toast.error(t("toastDeleteErrorTitle"), t("toastDeleteErrorBody"));
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
                    description={t("pageDesc")}
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
                        {isError ? t("offline") : t("live")}
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
                        {t("addStation")}
                    </Button>
                </div>
            </div>

            {!isLoading && !isError && stations.length > 0 ? (
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
                    {[
                        {
                            label: t("online"),
                            value: enabledCount,
                            tone: "text-emerald-700 dark:text-emerald-400",
                        },
                        {
                            label: t("offline"),
                            value: offlineCount,
                            tone: "text-slate-gray",
                        },
                        {
                            label: t("openTickets"),
                            value: openTickets,
                            tone: "text-brand",
                        },
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className="bg-card px-4 py-3 sm:px-5"
                        >
                            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-gray">
                                {stat.label}
                            </p>
                            <p
                                className={cn(
                                    "mt-1 text-[22px] font-medium tabular-nums tracking-tight",
                                    stat.tone,
                                )}
                            >
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            ) : null}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card py-14">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="mt-2 text-[12px] text-slate-gray">
                        {t("loading")}
                    </p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-10 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("loadError")}
                    </p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-3 rounded-full bg-destructive px-3 py-1.5 text-[12px] font-normal text-destructive-foreground"
                    >
                        {t("tryAgain")}
                    </button>
                </div>
            ) : stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-slate-gray">
                        <UtensilsCrossed className="size-5" />
                    </div>
                    <h3 className="mt-3 text-[14px] font-medium text-foreground">
                        {t("emptyTitle")}
                    </h3>
                    <p className="mt-1 max-w-sm text-[12px] text-slate-gray">
                        {t("emptyDesc")}
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => dispatch(openAddStation())}
                        className="mt-4 h-8 gap-1.5 rounded-full text-[12px] font-normal"
                    >
                        <Plus className="size-3.5" />
                        {t("createFirst")}
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
                        const ticketsToday = station.ticketsToday ?? 0;
                        const owners = station.ownerNames ?? [];

                        return (
                            <article
                                key={station.id}
                                className={cn(
                                    "group relative flex flex-col rounded-2xl border bg-card transition-colors",
                                    isEnabled
                                        ? "border-hairline hover:border-foreground/15"
                                        : "border-dashed border-hairline opacity-90",
                                )}
                            >
                                <Link
                                    href={`/manager/stations/${station.id}`}
                                    className="flex flex-1 flex-col p-4 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="truncate text-[15px] font-medium tracking-tight text-foreground">
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
                                                        ? t("online")
                                                        : t("offline")}
                                                </Badge>
                                            </div>
                                            {station.code ? (
                                                <p className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                                                    {station.code}
                                                </p>
                                            ) : null}
                                        </div>
                                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-slate-gray opacity-0 transition-opacity group-hover:opacity-100" />
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-gray">
                                        <span className="inline-flex items-center gap-1.5">
                                            <UserRound className="size-3.5" />
                                            {owners.length > 0
                                                ? owners.join(", ")
                                                : t("noOwner")}
                                        </span>
                                        <span className="text-hairline">·</span>
                                        <span>
                                            {t("ticketsTodayCount", {
                                                count: ticketsToday,
                                            })}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline pt-3 text-[11px] text-slate-gray">
                                        <span className="inline-flex items-center gap-1.5 text-foreground">
                                            <span
                                                className={cn(
                                                    "size-1.5 rounded-full",
                                                    ticketCount > 0
                                                        ? "bg-emerald-500"
                                                        : "bg-zinc-300",
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
                                            <Clock className="size-3" />
                                            {t("min", { count: avgMin })}
                                        </span>
                                    </div>
                                </Link>

                                <div className="flex items-center justify-between gap-2 border-t border-hairline px-4 py-2.5">
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
                                                ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                                                : "bg-secondary text-slate-gray hover:bg-secondary/80",
                                        )}
                                    >
                                        {isEnabled ? (
                                            <Power className="size-3.5" />
                                        ) : (
                                            <PowerOff className="size-3.5" />
                                        )}
                                        {isEnabled ? t("on") : t("off")}
                                    </button>

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
                                                ? t("confirmDelete")
                                                : tCommon("delete")}
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
