"use client";

import {
    Clock,
    Edit3,
    Loader2,
    Plus,
    ToggleLeft,
    ToggleRight,
    UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { PrepDurationBucketsChart } from "@/components/custom/organisms/Charts";
import { useAppDispatch } from "@/context/hooks";
import { openAddStation, openEditStation } from "@/context/slices/stationSlice";
import {
    useGetStationsQuery,
    useUpdateStationMutation,
} from "@/context/services/stationsApi";
import AddEditStationSheet from "@/domains/fulfillment/ui/AddEditStationSheet";
import { toast } from "@/lib/toast";

export default function ManagerStationsPage() {
    const dispatch = useAppDispatch();
    const {
        data: stations = [],
        isLoading,
        isError,
        refetch,
    } = useGetStationsQuery();
    const [updateStation] = useUpdateStationMutation();

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
                !currentEnabled ? "Station enabled" : "Station disabled",
                name,
            );
        } catch {
            toast.error(
                "Failed to update status",
                "Could not toggle station status.",
            );
        }
    };

    return (
        <DashboardFrame>
            {/* Header with Title & Add Station Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="House"
                    title="Stations"
                    description="Configure preparation queues, cooking delays, and order routing."
                />
                <button
                    type="button"
                    onClick={() => dispatch(openAddStation())}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] hover:bg-primary-deep"
                >
                    <Plus className="size-4 stroke-[2.5]" />
                    <span>Add Station</span>
                </button>
            </div>

            {/* Preparation Duration Chart */}
            <PrepDurationBucketsChart />

            {/* Loading State */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card py-16">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="mt-3 text-[14px] text-slate-gray">
                        Loading preparation stations...
                    </p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
                    <p className="text-[14px] font-medium text-destructive">
                        Failed to load stations from server.
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 rounded-full bg-destructive px-4 py-1.5 text-[12px] font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-slate-gray">
                        <UtensilsCrossed className="size-7" />
                    </div>
                    <h3 className="mt-4 text-[16px] font-semibold text-foreground">
                        No preparation stations yet
                    </h3>
                    <p className="mt-1 max-w-sm text-[13px] text-slate-gray">
                        Create preparation stations (e.g. Kitchen, Barista,
                        Grill) to start routing orders to food prep screens.
                    </p>
                    <button
                        type="button"
                        onClick={() => dispatch(openAddStation())}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary-deep"
                    >
                        <Plus className="size-4" />
                        <span>Create First Station</span>
                    </button>
                </div>
            ) : (
                /* Stations Cards Grid */
                <div className="grid gap-4 md:grid-cols-2">
                    {stations.map(station => {
                        const isEnabled =
                            station.enabled ?? station.status === "ACTIVE";
                        const avgMin =
                            station.avgPrepMin ??
                            station.defaultDelayThresholdMinutes ??
                            10;
                        const ticketCount = station.ticketCount ?? 0;

                        return (
                            <article
                                key={station.id}
                                className="flex flex-col justify-between rounded-[16px] border border-hairline bg-card p-5 transition-all hover:border-slate-300"
                            >
                                <div>
                                    {/* Top Row: Color + Name + Category + Status */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="size-3 rounded-full shrink-0"
                                                style={{
                                                    backgroundColor:
                                                        station.color ||
                                                        "#e85d04",
                                                }}
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-[17px] font-semibold text-foreground">
                                                        {station.name}
                                                    </h2>
                                                    {station.category ? (
                                                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-slate-gray">
                                                            {station.category}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {station.code ? (
                                                    <p className="text-[11px] text-muted-foreground">
                                                        code: {station.code}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        {/* Enable Status Badge & Quick Toggle */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggle(
                                                        station.id,
                                                        isEnabled,
                                                        station.name,
                                                    )
                                                }
                                                className="text-slate-gray hover:text-foreground transition-colors"
                                                title={
                                                    isEnabled
                                                        ? "Disable station"
                                                        : "Enable station"
                                                }
                                            >
                                                {isEnabled ? (
                                                    <ToggleRight className="size-6 text-primary" />
                                                ) : (
                                                    <ToggleLeft className="size-6 text-zinc-300" />
                                                )}
                                            </button>
                                            <Badge
                                                variant={
                                                    isEnabled
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {isEnabled ? "Enabled" : "Off"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {station.description ? (
                                        <p className="mt-2.5 text-[13px] leading-relaxed text-slate-gray">
                                            {station.description}
                                        </p>
                                    ) : null}
                                </div>

                                {/* Bottom Row: Metrics & Edit Action */}
                                <div className="mt-5 flex items-center justify-between border-t border-hairline pt-3.5 text-[12px] text-slate-gray">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                            <span>
                                                {ticketCount} active tickets
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="size-3.5 text-slate-gray" />
                                            <span>target {avgMin} min</span>
                                        </div>
                                    </div>

                                    {/* Edit Button */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dispatch(openEditStation(station))
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-ivory px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors"
                                    >
                                        <Edit3 className="size-3 text-slate-gray" />
                                        <span>Edit</span>
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Station Slide-over Sheet */}
            <AddEditStationSheet />
        </DashboardFrame>
    );
}
