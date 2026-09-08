"use client";

import { useState } from "react";
import { useAppSelector } from "@/context/hooks";
import {
    useStartTableSessionMutation,
    useWaiterTablesQuery,
} from "@/context/services/floorApi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";
import FloorLocationSections from "@/domains/floor/ui/FloorLocationSections";
import FloorTableCard from "@/domains/floor/ui/FloorTableCard";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function WaiterTablesBoard({
    hideIntro = false,
}: {
    hideIntro?: boolean;
}) {
    const staff = useAppSelector(selectCurrentStaff);
    const clockedIn = Boolean(
        useAppSelector(state => state.identity.session?.shiftSessionId),
    );
    const { data, isLoading, isError } = useWaiterTablesQuery("all");
    const [startSession] = useStartTableSessionMutation();
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const router = useRouter();

    const tables = data?.data ?? [];
    const locations = data?.locations ?? [];
    const mine = tables.filter(table => table.mine);
    const readyCount = mine.reduce((sum, table) => sum + table.readyItemCount, 0);
    const cookingCount = mine.reduce(
        (sum, table) => sum + table.cookingItemCount,
        0,
    );

    async function openTable(tableId: string, occupied: boolean) {
        setError("");
        if (!occupied) {
            if (!clockedIn) {
                setError("Clock in before taking a table.");
                return;
            }
            setBusyId(tableId);
            try {
                await startSession({ tableId }).unwrap();
            } catch (err) {
                setError(floorActionError(err));
                setBusyId(null);
                return;
            }
            setBusyId(null);
        }
        router.push(`/waiter/tables/${tableId}`);
    }

    return (
        <div>
            {hideIntro ? null : (
                <>
                    <div className="mb-5">
                        <h1 className="text-[24px] font-semibold md:text-[32px]">
                            Floor
                        </h1>
                        <p className="mt-1 text-[14px] text-slate-gray">
                            Your tables at {staff?.name ? "this branch" : "Fanaye"}.
                            One party per table.
                        </p>
                    </div>
                    <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                        <SummaryTile
                            label="My tables"
                            value={String(mine.length)}
                        />
                        <SummaryTile
                            label="Ready to serve"
                            value={String(readyCount)}
                            accent
                        />
                        <SummaryTile
                            label="Still cooking"
                            value={String(cookingCount)}
                        />
                        <SummaryTile
                            label="Shift sales"
                            value={formatEtb(0)}
                        />
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3 text-[12px] text-slate-gray">
                        <Legend swatch="bg-card border-hairline" label="Free" />
                        <Legend swatch="bg-accent border-primary/45" label="Mine" />
                        <Legend swatch="bg-card border-primary/30" label="Other waiter" />
                    </div>
                </>
            )}

            {!clockedIn ? (
                <p className="mb-4 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                    Clock in on Shift before you take a table.
                </p>
            ) : null}
            {error ? (
                <p className="mb-4 text-[13px] text-red-600">{error}</p>
            ) : null}
            {isLoading ? (
                <p className="text-slate-gray">Loading floor…</p>
            ) : isError ? (
                <p className="text-red-600">Could not load tables.</p>
            ) : (
                <FloorLocationSections
                    tables={tables}
                    locations={locations}
                    renderTable={table => {
                        const free = !table.tableSessionId;
                        const badge = free
                            ? { label: "Free", tone: "free" as const }
                            : table.mine
                              ? { label: "Mine", tone: "mine" as const }
                              : {
                                    label: "Other waiter",
                                    tone: "other" as const,
                                };
                        const footerLeft = free
                            ? "No guests"
                            : table.readyItemCount > 0
                              ? `${table.readyItemCount} ready`
                              : table.sessionStatus === "BILL_REQUESTED"
                                ? "Bill requested"
                                : table.cookingItemCount > 0
                                  ? `${table.cookingItemCount} cooking`
                                  : table.mine
                                    ? "No order yet"
                                    : "Taken";

                        return (
                            <FloorTableCard
                                key={table.tableId}
                                tableNumber={tableNumber(table)}
                                location={table.locationName}
                                badge={badge}
                                waiter={free ? null : table.waiterName}
                                footerLeft={footerLeft}
                                footerAction={
                                    busyId === table.tableId
                                        ? "Opening…"
                                        : free
                                          ? "Take table →"
                                          : table.mine
                                            ? "View →"
                                            : "View →"
                                }
                                onClick={() => {
                                    void openTable(table.tableId, !free);
                                }}
                            />
                        );
                    }}
                />
            )}
        </div>
    );
}

function floorActionError(error: unknown) {
    if (error && typeof error === "object" && "data" in error) {
        const data = (
            error as {
                data?: { code?: string; errors?: { table?: string; shift?: string } };
            }
        ).data;
        if (data?.code === "TABLE_NOT_ASSIGNED") {
            return "This table is assigned to another waiter.";
        }
        if (data?.code === "TABLE_NOT_AVAILABLE" || data?.errors?.table === "TABLE_NOT_AVAILABLE") {
            return "That table is already taken.";
        }
        if (data?.errors?.table === "TABLE_NOT_ASSIGNED") {
            return "This table is assigned to another waiter.";
        }
        if (data?.code === "SHIFT_REQUIRED" || data?.errors?.shift) {
            return "Clock in before taking a table.";
        }
    }
    return "Could not open that table.";
}

function SummaryTile({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="rounded-[12px] border border-hairline bg-card px-3.5 py-3">
            <p className="text-[11px] font-medium tracking-wide text-slate-gray">
                {label}
            </p>
            <p
                className={cn(
                    "mt-1.5 truncate text-[18px] font-semibold leading-none tracking-tight",
                    accent ? "text-brand" : "text-foreground",
                )}
            >
                {value}
            </p>
        </div>
    );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-3 rounded-full border", swatch)} />
            {label}
        </span>
    );
}
