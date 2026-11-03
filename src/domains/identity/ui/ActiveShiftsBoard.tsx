"use client";

import React, { useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Banknote,
    Clock,
    DollarSign,
    Filter,
    LogOut,
    RefreshCw,
    Search,
    ShieldAlert,
    Table2,
    UserCheck,
    UserRound,
    Users,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {
    useManagerActiveSessionsQuery,
    type ActiveShiftSummary,
} from "@/context/services/shiftsApi";
import { ManagerForceClockOutModal } from "@/domains/floor/ui/ManagerForceClockOutModal";
import { formatEtb } from "@/lib/money";

type FilterTab = "ALL" | "EXPIRED" | "WAITERS" | "CASHIER" | "KITCHEN";

interface ActiveShiftsBoardProps {
    basePath?: string;
}

export default function ActiveShiftsBoard({
    basePath = "/manager/staff",
}: ActiveShiftsBoardProps) {
    const {
        data: sessions,
        isLoading,
        isFetching,
        refetch,
    } = useManagerActiveSessionsQuery(undefined, {
        pollingInterval: 10000,
        refetchOnFocus: true,
    });

    const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSession, setSelectedSession] =
        useState<ActiveShiftSummary | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activeList = useMemo(() => sessions ?? [], [sessions]);

    // KPI summaries
    const expiredList = useMemo(
        () => activeList.filter(s => s.isExpired),
        [activeList],
    );

    const waitersList = useMemo(
        () =>
            activeList.filter(
                s => (s.roleCode || "").toUpperCase() === "WAITER",
            ),
        [activeList],
    );

    const cashiersList = useMemo(
        () =>
            activeList.filter(
                s =>
                    (s.roleCode || "").toUpperCase() === "CASHIER" ||
                    s.hasCashierDrawer,
            ),
        [activeList],
    );

    const kitchenList = useMemo(
        () =>
            activeList.filter(s => {
                const role = (s.roleCode || "").toUpperCase();
                return (
                    role !== "WAITER" &&
                    role !== "CASHIER" &&
                    !s.hasCashierDrawer
                );
            }),
        [activeList],
    );

    // Total cashier expected cash
    const totalCashierDrawerCash = useMemo(() => {
        return cashiersList.reduce(
            (sum, c) => sum + parseFloat(c.drawerExpectedCash || "0"),
            0,
        );
    }, [cashiersList]);

    // Total open tables across waiters
    const totalOpenTables = useMemo(() => {
        return waitersList.reduce(
            (sum, w) => sum + (w.openTablesCount || 0),
            0,
        );
    }, [waitersList]);

    // Filtered list by tab and search
    const filteredList = useMemo(() => {
        return activeList.filter(s => {
            // Tab filter
            if (activeTab === "EXPIRED" && !s.isExpired) return false;
            if (
                activeTab === "WAITERS" &&
                (s.roleCode || "").toUpperCase() !== "WAITER"
            )
                return false;
            if (
                activeTab === "CASHIER" &&
                (s.roleCode || "").toUpperCase() !== "CASHIER" &&
                !s.hasCashierDrawer
            )
                return false;
            if (activeTab === "KITCHEN") {
                const role = (s.roleCode || "").toUpperCase();
                if (
                    role === "WAITER" ||
                    role === "CASHIER" ||
                    s.hasCashierDrawer
                )
                    return false;
            }

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const name = (s.staffName || "").toLowerCase();
                const role = (s.roleName || s.roleCode || "").toLowerCase();
                return name.includes(q) || role.includes(q);
            }

            return true;
        });
    }, [activeList, activeTab, searchQuery]);

    // Candidates for table reassignment
    const candidateWaiters = useMemo(() => {
        return waitersList.map(w => ({
            staffMembershipId: w.staffMembershipId,
            name: w.staffName,
            roleName: w.roleName || w.roleCode,
        }));
    }, [waitersList]);

    function handleOpenForceClockOut(session: ActiveShiftSummary) {
        setSelectedSession(session);
        setIsModalOpen(true);
    }

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4">
                {/* Back to HR */}
                <Link
                    href={basePath}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-gray hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="size-3.5" />
                    Back to HR Directory
                </Link>

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <PageHeader
                        compact
                        eyebrow="HR & Shift Operations"
                        title="Active Staff Shifts"
                        description="Real-time shift custody, tables, and cashier register drawers across all working staff."
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="gap-1.5 self-start sm:self-auto text-xs font-semibold"
                    >
                        <RefreshCw
                            className={`size-3.5 ${isFetching ? "animate-spin text-brand" : ""}`}
                        />
                        Refresh Live
                    </Button>
                </div>

                {/* Expired Shifts Action Banner */}
                {expiredList.length > 0 ? (
                    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 text-amber-950 dark:text-amber-200 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2.5">
                            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <p className="text-sm font-bold">
                                    {expiredList.length} Unclosed Expired Shift
                                    {expiredList.length > 1 ? "s" : ""} Detected
                                </p>
                                <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
                                    Scheduled shift duration ended. Reconcile
                                    cashier register drawers or reassign dining
                                    tables to clear stations for tomorrow.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
                            {expiredList.map(exp => (
                                <Button
                                    key={exp.shiftSessionId}
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-500/40 bg-white/90 dark:bg-slate-900 text-xs font-semibold hover:bg-amber-50 shadow-xs"
                                    onClick={() => handleOpenForceClockOut(exp)}
                                >
                                    <LogOut className="mr-1.5 size-3.5 text-amber-600" />
                                    Resolve {exp.staffName} (
                                    {exp.hasCashierDrawer ||
                                    exp.roleCode === "CASHIER"
                                        ? "Cashier Drawer"
                                        : exp.openTablesCount > 0
                                          ? `${exp.openTablesCount} Tables`
                                          : exp.roleName || "Staff"}
                                    )
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Top KPI Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-slate-gray">
                            <p className="text-[11px] font-semibold uppercase tracking-wider">
                                Total Clocked In
                            </p>
                            <Users className="size-4 text-brand" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                            {activeList.length}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-gray">
                            Staff actively on duty
                        </p>
                    </div>

                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-slate-gray">
                            <p className="text-[11px] font-semibold uppercase tracking-wider">
                                Expired Shifts
                            </p>
                            <ShieldAlert
                                className={`size-4 ${expiredList.length > 0 ? "text-amber-500" : "text-emerald-500"}`}
                            />
                        </div>
                        <p
                            className={`mt-2 text-2xl font-bold ${
                                expiredList.length > 0
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-foreground"
                            }`}
                        >
                            {expiredList.length}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-gray">
                            {expiredList.length > 0
                                ? "Action needed before close"
                                : "All shifts within schedule"}
                        </p>
                    </div>

                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-slate-gray">
                            <p className="text-[11px] font-semibold uppercase tracking-wider">
                                Waiters & Tables
                            </p>
                            <Table2 className="size-4 text-emerald-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                            {waitersList.length} Waiters
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-gray">
                            {totalOpenTables} dining tables active
                        </p>
                    </div>

                    <div className="rounded-[18px] border border-hairline bg-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between text-slate-gray">
                            <p className="text-[11px] font-semibold uppercase tracking-wider">
                                Cashier Drawers
                            </p>
                            <Banknote className="size-4 text-emerald-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                            {formatEtb(totalCashierDrawerCash)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-gray">
                            {cashiersList.length} open register drawers
                        </p>
                    </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-1 rounded-[14px] border border-hairline bg-secondary/30 p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("ALL")}
                            className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "ALL"
                                    ? "bg-white dark:bg-card text-foreground shadow-xs"
                                    : "text-slate-gray hover:text-foreground"
                            }`}
                        >
                            All Staff ({activeList.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("EXPIRED")}
                            className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "EXPIRED"
                                    ? "bg-white dark:bg-card text-amber-600 dark:text-amber-400 shadow-xs"
                                    : "text-slate-gray hover:text-foreground"
                            }`}
                        >
                            Expired ({expiredList.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("WAITERS")}
                            className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "WAITERS"
                                    ? "bg-white dark:bg-card text-foreground shadow-xs"
                                    : "text-slate-gray hover:text-foreground"
                            }`}
                        >
                            Waiters ({waitersList.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("CASHIER")}
                            className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "CASHIER"
                                    ? "bg-white dark:bg-card text-foreground shadow-xs"
                                    : "text-slate-gray hover:text-foreground"
                            }`}
                        >
                            Cashiers ({cashiersList.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("KITCHEN")}
                            className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all ${
                                activeTab === "KITCHEN"
                                    ? "bg-white dark:bg-card text-foreground shadow-xs"
                                    : "text-slate-gray hover:text-foreground"
                            }`}
                        >
                            Kitchen & Others ({kitchenList.length})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-gray" />
                        <Input
                            placeholder="Search by name or role..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-9 pl-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Active Shifts Table */}
                <div className="overflow-hidden rounded-[20px] border border-hairline bg-card shadow-subtle">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[880px] text-left text-[13px]">
                            <thead className="border-b border-hairline bg-secondary/40 text-[11px] font-semibold tracking-wider text-slate-gray uppercase">
                                <tr>
                                    <th className="px-5 py-3">Staff Member</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Clock-In Time</th>
                                    <th className="px-5 py-3">Shift Status</th>
                                    <th className="px-5 py-3">
                                        Live Custody & Responsibility
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-10 text-center text-slate-gray"
                                        >
                                            Loading active shifts...
                                        </td>
                                    </tr>
                                ) : filteredList.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-10 text-center text-slate-gray"
                                        >
                                            No working staff found in this
                                            filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredList.map(session => {
                                        const isCashierRole =
                                            session.roleCode === "CASHIER" ||
                                            session.hasCashierDrawer;
                                        const isWaiterRole =
                                            session.roleCode === "WAITER";

                                        return (
                                            <tr
                                                key={session.shiftSessionId}
                                                className="hover:bg-secondary/20 transition-colors"
                                            >
                                                {/* Staff Info */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                                                            {session.staffName
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {
                                                                    session.staffName
                                                                }
                                                            </p>
                                                            <p className="text-[11px] text-slate-gray">
                                                                ID:{" "}
                                                                {session.staffMembershipId.slice(
                                                                    0,
                                                                    8,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="px-5 py-3.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[11px] font-semibold ${
                                                            isCashierRole
                                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                                : isWaiterRole
                                                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                                                  : "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        }`}
                                                    >
                                                        {session.roleName ||
                                                            session.roleCode ||
                                                            "Staff"}
                                                    </Badge>
                                                </td>

                                                {/* Clock-In */}
                                                <td className="px-5 py-3.5">
                                                    <div className="space-y-0.5">
                                                        <p className="font-medium text-foreground">
                                                            {new Date(
                                                                session.clockInAt,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                        </p>
                                                        {session.scheduledEndAt ? (
                                                            <p className="text-[11px] text-slate-gray">
                                                                End:{" "}
                                                                {new Date(
                                                                    session.scheduledEndAt,
                                                                ).toLocaleTimeString(
                                                                    [],
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                )}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </td>

                                                {/* Shift Status */}
                                                <td className="px-5 py-3.5">
                                                    {session.isExpired ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                            <AlertTriangle className="size-3" />
                                                            Expired Window
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                            <Clock className="size-3" />
                                                            On Duty
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Custody / Responsibility */}
                                                <td className="px-5 py-3.5">
                                                    {isCashierRole ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                                <Banknote className="size-3.5" />
                                                                <span>
                                                                    Drawer:{" "}
                                                                    {formatEtb(
                                                                        parseFloat(
                                                                            session.drawerExpectedCash ||
                                                                                "0",
                                                                        ),
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {session.drawerOpeningFloat ? (
                                                                <p className="text-[11px] text-slate-gray">
                                                                    Float:{" "}
                                                                    {formatEtb(
                                                                        parseFloat(
                                                                            session.drawerOpeningFloat,
                                                                        ),
                                                                    )}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ) : isWaiterRole ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                                                <Table2 className="size-3.5 text-slate-gray" />
                                                                <span>
                                                                    {
                                                                        session.openTablesCount
                                                                    }{" "}
                                                                    active
                                                                    tables
                                                                </span>
                                                            </div>
                                                            {parseFloat(
                                                                session.undroppedCash ||
                                                                    "0",
                                                            ) > 0 ? (
                                                                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                                    Undropped:{" "}
                                                                    {formatEtb(
                                                                        parseFloat(
                                                                            session.undroppedCash,
                                                                        ),
                                                                    )}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-gray">
                                                            General Station Duty
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={`text-xs font-semibold ${
                                                            session.isExpired
                                                                ? "border-amber-500/40 bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 dark:text-amber-300"
                                                                : "border-hairline text-slate-gray hover:text-foreground"
                                                        }`}
                                                        onClick={() =>
                                                            handleOpenForceClockOut(
                                                                session,
                                                            )
                                                        }
                                                    >
                                                        <LogOut className="mr-1.5 size-3" />
                                                        {isCashierRole
                                                            ? "Reconcile Drawer"
                                                            : "Force Clock-Out"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Manager Force Clock Out & Cashier Reconciliation Modal */}
            <ManagerForceClockOutModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                session={selectedSession}
                candidates={candidateWaiters}
                onSuccess={() => refetch()}
            />
        </DashboardFrame>
    );
}
