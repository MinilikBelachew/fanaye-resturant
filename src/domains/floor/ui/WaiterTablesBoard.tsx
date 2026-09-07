"use client";

import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { startTableSession } from "@/context/slices/opsSlice";
import { DEMO_STAFF } from "@/domains/identity/infrastructure/demoStaff";
import {
    selectCurrentStaff,
    selectWaiterFloorSummary,
} from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";
import FloorTableCard from "@/domains/floor/ui/FloorTableCard";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function WaiterTablesBoard({
    hideIntro = false,
}: {
    hideIntro?: boolean;
}) {
    const tables = useAppSelector(state => state.ops.tables);
    const sessions = useAppSelector(state => state.ops.sessions);
    const items = useAppSelector(state => state.ops.items);
    const staff = useAppSelector(selectCurrentStaff);
    const summary = useAppSelector(state =>
        staff
            ? selectWaiterFloorSummary(state, staff.id)
            : {
                  openTables: 0,
                  readyCount: 0,
                  cookingCount: 0,
                  sales: 0,
              },
    );
    const dispatch = useAppDispatch();
    const router = useRouter();

    return (
        <div>
            {hideIntro ? null : (
                <>
                    <div className="mb-5">
                        <h1 className="text-[24px] font-semibold md:text-[32px]">
                            Floor
                        </h1>
                        <p className="mt-1 text-[14px] text-slate-gray">
                            Your tables, running total, and items waiting to
                            be served.
                        </p>
                    </div>
                    <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                        <SummaryTile
                            label="My tables"
                            value={String(summary.openTables)}
                        />
                        <SummaryTile
                            label="Ready to serve"
                            value={String(summary.readyCount)}
                            accent
                        />
                        <SummaryTile
                            label="Still cooking"
                            value={String(summary.cookingCount)}
                        />
                        <SummaryTile
                            label="Shift sales"
                            value={formatEtb(summary.sales)}
                        />
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3 text-[12px] text-slate-gray">
                        <Legend swatch="bg-card border-hairline" label="Free" />
                        <Legend swatch="bg-accent border-primary/45" label="Mine" />
                        <Legend swatch="bg-card border-primary/30" label="Other waiter" />
                    </div>
                </>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tables.map(table => {
                    const session = sessions.find(
                        entry =>
                            entry.id === table.currentSessionId &&
                            entry.status !== "paid" &&
                            entry.status !== "closed",
                    );
                    const mine = session?.waiterId === staff?.id;
                    const other = session
                        ? DEMO_STAFF.find(
                              person => person.id === session.waiterId,
                          )
                        : null;
                    const sessionItems = session
                        ? items.filter(
                              item =>
                                  item.sessionId === session.id &&
                                  item.status !== "draft",
                          )
                        : [];
                    const ready = sessionItems.filter(
                        item => item.status === "ready",
                    ).length;
                    const cooking = sessionItems.filter(
                        item =>
                            item.status === "queued" ||
                            item.status === "acknowledged" ||
                            item.status === "in_preparation",
                    ).length;
                    const hasOrder = sessionItems.length > 0;
                    const free = !session;
                    const badge = free
                        ? { label: "Free", tone: "free" as const }
                        : mine
                          ? { label: "Mine", tone: "mine" as const }
                          : {
                                label: "Other waiter",
                                tone: "other" as const,
                            };
                    const footerLeft = ready > 0
                        ? `${ready} ready`
                        : table.status === "payment_pending"
                          ? "Awaiting cashier"
                          : table.status === "bill_requested"
                            ? "Bill requested"
                            : cooking > 0
                              ? `${cooking} cooking`
                              : hasOrder
                                ? "Taken"
                                : free
                                  ? "No guests"
                                  : mine
                                    ? "No order yet"
                                    : "Taken";

                    return (
                        <FloorTableCard
                            key={table.id}
                            tableNumber={table.number}
                            badge={badge}
                            waiter={
                                free
                                    ? null
                                    : mine
                                      ? (staff?.name ?? "You")
                                      : (other?.name ?? "Taken")
                            }
                            footerLeft={footerLeft}
                            footerAction={
                                free
                                    ? "Take table →"
                                    : mine && !hasOrder
                                      ? "Add order →"
                                      : "View →"
                            }
                            onClick={() => {
                                if (!staff) return;
                                if (!session) {
                                    dispatch(
                                        startTableSession({
                                            tableId: table.id,
                                            waiterId: staff.id,
                                            guestCount: table.seats,
                                        }),
                                    );
                                }
                                router.push(`/waiter/tables/${table.id}`);
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
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
            <span
                className={cn("size-3 rounded-full border", swatch)}
            />
            {label}
        </span>
    );
}
