"use client";

import {
    Bell,
    CircleDot,
    Flame,
    LayoutGrid,
    Wallet,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
    selectCurrentStaff,
    selectWaiterFloorSummary,
} from "@/domains/ordering/application/selectors";
import { Link } from "@/i18n/navigation";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

function MetricCard({
    label,
    value,
    hint,
    icon: Icon,
    accent = false,
}: {
    label: string;
    value: string;
    hint: string;
    icon: typeof Bell;
    accent?: boolean;
}) {
    return (
        <div className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-slate-gray">
                    {label}
                </p>
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-slate-gray">
                    <Icon className="size-4" />
                </span>
            </div>
            <p
                className={cn(
                    "mt-3 text-[28px] leading-none font-semibold tracking-tight",
                    accent ? "text-brand" : "text-foreground",
                )}
            >
                {value}
            </p>
            <p className="mt-2 text-[12px] text-slate-gray">{hint}</p>
        </div>
    );
}

export default function WaiterShiftPage() {
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
    const cashOnHand = useAppSelector(state =>
        staff
            ? state.ops.payments
                  .filter(
                      payment =>
                          payment.waiterId === staff.id &&
                          payment.method === "cash" &&
                          payment.status !== "rejected",
                  )
                  .reduce((sum, payment) => sum + payment.amount, 0)
            : 0,
    );
    const tablesOpen = summary.openTables > 0;

    return (
        <section className="mx-auto w-full max-w-3xl space-y-6">
            <PageHeader
                eyebrow="Shift"
                title="On the floor"
                description={`${staff?.name ?? "Waiter"} is currently on floor duty. Monitor your active shift schedule, table load, and collections.`}
            />

            {/* Waiter Profile & Assigned Shift Card */}
            <div className="flex flex-col gap-4 rounded-[20px] border border-hairline bg-card p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                        <span className="relative flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[18px]">
                            {staff?.name?.charAt(0) ?? "W"}
                            <span className="absolute top-1 right-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-card" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-[17px] font-semibold text-foreground">
                                    {staff?.name}
                                </p>
                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                    Waiter
                                </span>
                            </div>
                            <p className="text-[13px] text-slate-gray">
                                {staff?.phone || "+251 91 567 8901"} · Fanaye Floor
                            </p>
                        </div>
                    </div>

                    <Badge variant={tablesOpen ? "warning" : "success"}>
                        {tablesOpen
                            ? `${summary.openTables} tables active`
                            : "Ready to clock out"}
                    </Badge>
                </div>

                {/* Shift Schedule Details Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-hairline pt-3.5 text-[13px]">
                    <div className="flex items-center gap-2">
                        <span className="text-base">
                            {staff?.shiftSchedule === "evening"
                                ? "🌙"
                                : staff?.shiftSchedule === "full_day"
                                  ? "⚡"
                                  : "🌅"}
                        </span>
                        <div>
                            <p className="font-semibold text-foreground capitalize">
                                {staff?.shiftSchedule?.replace("_", " ") || "Morning"} Shift
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                {staff?.shiftHours || "07:00 AM – 03:00 PM"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-base">📅</span>
                        <div>
                            <p className="font-semibold text-foreground">Working Days</p>
                            <p className="text-[12px] text-slate-gray">
                                {staff?.workingDays?.join(", ") || "Mon, Tue, Wed, Thu, Fri, Sat"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-base">🍽️</span>
                        <div>
                            <p className="font-semibold text-foreground">Assigned Section</p>
                            <p className="text-[12px] text-slate-gray">
                                {staff?.assignedTableIds && staff.assignedTableIds.length > 0
                                    ? staff.assignedTableIds.map(t => `T-${t.replace("table-", "")}`).join(", ")
                                    : "All Floor Tables"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                    label="Open tables"
                    value={String(summary.openTables)}
                    hint="Your active covers"
                    icon={LayoutGrid}
                />
                <MetricCard
                    label="Sales"
                    value={formatEtb(summary.sales)}
                    hint="Open tickets, not closed"
                    icon={Wallet}
                    accent
                />
                <MetricCard
                    label="Ready"
                    value={String(summary.readyCount)}
                    hint="Waiting to serve"
                    icon={Bell}
                />
                <MetricCard
                    label="Cooking"
                    value={String(summary.cookingCount)}
                    hint="Still at a station"
                    icon={Flame}
                />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <Link
                    href="/waiter/tables"
                    className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle transition-colors hover:bg-secondary/50"
                >
                    <p className="text-[13px] font-medium text-slate-gray">
                        Floor
                    </p>
                    <p className="mt-1 text-[16px] font-semibold">
                        Open tables
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        Seat, order, and request the bill from your floor map.
                    </p>
                </Link>
                <Link
                    href="/waiter/notifications"
                    className="rounded-[20px] border border-hairline bg-card p-5 shadow-subtle transition-colors hover:bg-secondary/50"
                >
                    <p className="text-[13px] font-medium text-slate-gray">
                        Service
                    </p>
                    <p className="mt-1 text-[16px] font-semibold">
                        Ready tickets
                    </p>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        {summary.readyCount > 0
                            ? `${summary.readyCount} dish${summary.readyCount === 1 ? "" : "es"} ready to run.`
                            : "Nothing waiting to be served."}
                    </p>
                </Link>
            </div>

            <div className="flex items-start gap-3 rounded-[20px] border border-hairline bg-card p-5 shadow-subtle">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Wallet className="size-4" />
                </span>
                <div>
                    <p className="text-[15px] font-semibold">Cash on you</p>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {formatEtb(cashOnHand)} collected in cash this shift.
                        It stays with you until you drop it to the cashier.
                        You cannot clock out while a table is still open.
                    </p>
                </div>
            </div>
        </section>
    );
}
