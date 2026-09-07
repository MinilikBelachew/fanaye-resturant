"use client";

import { Clock, Edit3, Plus, Printer, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { PrepDurationBucketsChart } from "@/components/custom/organisms/Charts";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import {
    openAddStation,
    openEditStation,
    toggleStationEnabled,
} from "@/context/slices/stationSlice";
import AddEditStationSheet from "@/domains/fulfillment/ui/AddEditStationSheet";
import { STATION_THROUGHPUT } from "@/domains/reporting/infrastructure/demoMetrics";
import { cn } from "@/lib/utils";

export default function ManagerStationsPage() {
    const dispatch = useAppDispatch();
    const stations = useAppSelector(state => state.station.stations);

    return (
        <DashboardFrame>
            {/* Header with Title & Add Station Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    eyebrow="House"
                    title="Stations"
                    description="Configure preparation queues, ticket printers, and order routing."
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

            {/* Stations Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {stations.map(station => {
                    const stats = STATION_THROUGHPUT.find(
                        row =>
                            row.station.toLowerCase() ===
                            station.name.toLowerCase(),
                    );
                    const ticketCount =
                        station.ticketCount ?? stats?.tickets ?? 0;
                    const avgMin = station.avgPrepMin ?? stats?.avgMin ?? 5;

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
                                                    station.color || "#e85d04",
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
                                        </div>
                                    </div>

                                    {/* Enable Status Badge & Quick Toggle */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                dispatch(
                                                    toggleStationEnabled(
                                                        station.id,
                                                    ),
                                                )
                                            }
                                            className="text-slate-gray hover:text-foreground transition-colors"
                                            title={
                                                station.enabled
                                                    ? "Disable station"
                                                    : "Enable station"
                                            }
                                        >
                                            {station.enabled ? (
                                                <ToggleRight className="size-6 text-primary" />
                                            ) : (
                                                <ToggleLeft className="size-6 text-zinc-300" />
                                            )}
                                        </button>
                                        <Badge
                                            variant={
                                                station.enabled
                                                    ? "success"
                                                    : "secondary"
                                            }
                                        >
                                            {station.enabled
                                                ? "Enabled"
                                                : "Off"}
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
                                        <span>{ticketCount} tickets</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="size-3.5 text-slate-gray" />
                                        <span>avg {avgMin} min</span>
                                    </div>
                                    {station.printerIp ? (
                                        <div className="hidden sm:flex items-center gap-1 text-slate-gray">
                                            <Printer className="size-3.5" />
                                            <span>{station.printerIp}</span>
                                        </div>
                                    ) : null}
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

            {/* Add / Edit Station Slide-over Sheet */}
            <AddEditStationSheet />
        </DashboardFrame>
    );
}
