"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    Armchair,
    ArrowRight,
    BellRing,
    ChefHat,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import {
    useStartTableSessionMutation,
    useWaiterTablesQuery,
} from "@/context/services/floorApi";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Link, useRouter } from "@/i18n/navigation";
import FloorLocationSections from "@/domains/floor/ui/FloorLocationSections";
import FloorTableCard from "@/domains/floor/ui/FloorTableCard";
import { tableNumber } from "@/domains/floor/application/groupFloor";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { FloorGridSkeleton } from "@/components/custom/molecules/Skeletons";

type TableFilter = "all" | "mine" | "free" | "ready";

export default function WaiterTablesBoard({
    hideIntro = false,
}: {
    hideIntro?: boolean;
}) {
    const tWaiter = useTranslations("waiter");
    const staff = useAppSelector(selectCurrentStaff);
    const clockedIn = Boolean(
        useAppSelector(state => state.identity.session?.shiftSessionId),
    );
    const { data, isLoading, isError } = useWaiterTablesQuery("all");
    const [startSession] = useStartTableSessionMutation();
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<TableFilter>("all");
    const router = useRouter();

    const tables = useMemo(() => data?.data ?? [], [data?.data]);
    const locations = useMemo(() => data?.locations ?? [], [data?.locations]);

    const mine = useMemo(() => tables.filter(table => table.mine), [tables]);
    const freeTables = useMemo(
        () => tables.filter(table => !table.tableSessionId),
        [tables],
    );
    const readyTables = useMemo(
        () => tables.filter(table => table.readyItemCount > 0),
        [tables],
    );

    const readyCount = mine.reduce(
        (sum, table) => sum + table.readyItemCount,
        0,
    );
    const cookingCount = mine.reduce(
        (sum, table) => sum + table.cookingItemCount,
        0,
    );

    // Filter tables based on active tab
    const visibleTables = useMemo(() => {
        if (filter === "mine") return mine;
        if (filter === "free") return freeTables;
        if (filter === "ready") return readyTables;
        return tables;
    }, [filter, tables, mine, freeTables, readyTables]);

    async function openTable(tableId: string, occupied: boolean) {
        setError("");
        if (!occupied) {
            if (!clockedIn) {
                const message = "Clock in before taking a table.";
                setError(message);
                toast.error(message);
                return;
            }
            setBusyId(tableId);
            try {
                await startSession({ tableId }).unwrap();
                toast.success("Table opened");
            } catch (err) {
                const message = floorActionError(err);
                setError(message);
                toast.error(message);
                setBusyId(null);
                return;
            }
            setBusyId(null);
        }
        router.push(`/waiter/tables/${tableId}`);
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-150">
            {hideIntro ? null : (
                <>
                    {/* Header */}
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-[20px] font-semibold tracking-tight text-foreground md:text-[22px]">
                                {tWaiter("floorOverview")}
                            </h1>
                            <p className="mt-0.5 text-[14px] text-slate-gray">
                                Real-time table status at{" "}
                                <strong className="font-semibold text-foreground">
                                    {staff?.name
                                        ? "this branch"
                                        : "your restaurant"}
                                </strong>
                                .
                            </p>
                        </div>
                        {staff?.name ? (
                            <div className="mt-2 flex items-center gap-2 sm:mt-0">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-xs">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    <span>
                                        {tWaiter("server")}: {staff.name}
                                    </span>
                                </span>
                            </div>
                        ) : null}
                    </div>

                    {/* METRIC TILES (International POS Dashboard) */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <MetricTile
                            icon={<Armchair className="size-5 text-brand" />}
                            label={tWaiter("myTables")}
                            value={String(mine.length)}
                            hint={`${tables.length} total on floor`}
                            tone="brand"
                        />
                        <MetricTile
                            icon={
                                <BellRing className="size-5 text-emerald-500" />
                            }
                            label={tWaiter("readyToServe")}
                            value={String(readyCount)}
                            hint={
                                readyCount > 0 ? "Items waiting!" : "All served"
                            }
                            tone={readyCount > 0 ? "ready" : "default"}
                            highlight={readyCount > 0}
                        />
                        <MetricTile
                            icon={<ChefHat className="size-5 text-amber-500" />}
                            label={tWaiter("stillCooking")}
                            value={String(cookingCount)}
                            hint="In kitchen stations"
                            tone="amber"
                        />
                        <MetricTile
                            icon={
                                <TrendingUp className="size-5 text-sky-500" />
                            }
                            label={tWaiter("shiftSales")}
                            value={formatEtb(0)}
                            hint="Current shift"
                            tone="default"
                        />
                    </div>

                    {/* INTERACTIVE FILTER TABS */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
                        <FilterButton
                            label={tWaiter("allTables")}
                            count={tables.length}
                            active={filter === "all"}
                            onClick={() => setFilter("all")}
                        />
                        <FilterButton
                            label={tWaiter("myTables")}
                            count={mine.length}
                            active={filter === "mine"}
                            onClick={() => setFilter("mine")}
                            dotColor="bg-brand"
                        />
                        <FilterButton
                            label={tWaiter("vacant")}
                            count={freeTables.length}
                            active={filter === "free"}
                            onClick={() => setFilter("free")}
                            dotColor="bg-emerald-500"
                        />
                        {readyTables.length > 0 ? (
                            <FilterButton
                                label={tWaiter("readyToServe")}
                                count={readyTables.length}
                                active={filter === "ready"}
                                onClick={() => setFilter("ready")}
                                dotColor="bg-emerald-500"
                                pulse
                            />
                        ) : null}
                    </div>
                </>
            )}

            {/* Clock-in Warning Alert Banner */}
            {!clockedIn ? (
                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            <AlertCircle className="size-5" />
                        </div>
                        <div>
                            <p className="text-[14px] font-bold">
                                {tWaiter("notClockedIn")}
                            </p>
                            <p className="text-[12.5px] opacity-80">
                                {tWaiter("clockInPrompt")}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/waiter/shifts"
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
                    >
                        <span>{tWaiter("clockIn")}</span>
                        <ArrowRight className="size-3" />
                    </Link>
                </div>
            ) : null}

            {error ? (
                <div className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-3 text-[13px] font-medium text-destructive">
                    {error}
                </div>
            ) : null}

            {isLoading ? (
                <FloorGridSkeleton />
            ) : isError ? (
                <div className="rounded-[16px] border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
                    <p className="font-semibold">
                        Could not load restaurant tables.
                    </p>
                </div>
            ) : visibleTables.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-slate-gray">
                    <Sparkles className="size-8 opacity-40 text-brand" />
                    <p className="text-[15px] font-semibold text-foreground">
                        No tables in this view
                    </p>
                    <p className="text-[13px]">
                        Switch filter tabs to see other tables on the floor.
                    </p>
                </div>
            ) : (
                <FloorLocationSections
                    tables={visibleTables}
                    locations={locations}
                    renderTable={table => {
                        const free = !table.tableSessionId;
                        const badge = free
                            ? {
                                  label: tWaiter("vacant"),
                                  tone: "free" as const,
                              }
                            : table.mine
                              ? {
                                    label: tWaiter("myTables"),
                                    tone: "mine" as const,
                                }
                              : {
                                    label: tWaiter("server"),
                                    tone: "other" as const,
                                };
                        const footerLeft = free
                            ? "Available"
                            : table.readyItemCount > 0
                              ? `${table.readyItemCount} ready`
                              : table.sessionStatus === "BILL_REQUESTED"
                                ? "Bill requested"
                                : table.cookingItemCount > 0
                                  ? `${table.cookingItemCount} cooking`
                                  : table.mine
                                    ? "In service"
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
                                            ? "Manage →"
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

function MetricTile({
    icon,
    label,
    value,
    hint,
    tone = "default",
    highlight = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    hint: string;
    tone?: "default" | "brand" | "amber" | "ready";
    highlight?: boolean;
}) {
    return (
        <div
            className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-[18px] border bg-card p-4 transition-all duration-150 hover:shadow-subtle",
                highlight
                    ? "border-emerald-500/40 bg-emerald-500/[0.04] ring-1 ring-emerald-500/20"
                    : "border-hairline",
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-medium text-slate-gray">
                    {label}
                </span>
                <div className="flex size-7 items-center justify-center rounded-full bg-secondary/70">
                    {icon}
                </div>
            </div>
            <div className="mt-2.5">
                <p
                    className={cn(
                        "text-[18px] font-semibold leading-none",
                        tone === "brand"
                            ? "text-brand"
                            : tone === "ready"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : tone === "amber"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground",
                    )}
                >
                    {value}
                </p>
                <p className="mt-1 text-[11.5px] font-medium text-slate-gray">
                    {hint}
                </p>
            </div>
        </div>
    );
}

function FilterButton({
    label,
    count,
    active,
    onClick,
    dotColor,
    pulse = false,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
    dotColor?: string;
    pulse?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-150",
                active
                    ? "bg-foreground text-background shadow-xs"
                    : "border border-hairline bg-card text-slate-gray hover:bg-secondary hover:text-foreground",
            )}
        >
            {dotColor ? (
                <span
                    className={cn(
                        "size-2 rounded-full",
                        dotColor,
                        pulse && "animate-ping",
                    )}
                />
            ) : null}
            <span>{label}</span>
            <span
                className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10.5px] font-bold",
                    active
                        ? "bg-background/20 text-background"
                        : "bg-secondary text-slate-gray",
                )}
            >
                {count}
            </span>
        </button>
    );
}

function floorActionError(error: unknown) {
    if (error && typeof error === "object" && "data" in error) {
        const data = (
            error as {
                data?: {
                    code?: string;
                    errors?: { table?: string; shift?: string };
                };
            }
        ).data;
        if (data?.code === "TABLE_NOT_ASSIGNED") {
            return "This table is assigned to another waiter.";
        }
        if (
            data?.code === "TABLE_NOT_AVAILABLE" ||
            data?.errors?.table === "TABLE_NOT_AVAILABLE"
        ) {
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
