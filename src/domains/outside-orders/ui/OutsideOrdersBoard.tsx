"use client";

import { useMemo, useState } from "react";
import {
    Boxes,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Coffee,
    Filter,
    Loader2,
    MapPin,
    Package,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Store,
    User,
    Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useListOutsideOrdersQuery,
    type OutsideOrderSummary,
    type DestinationType,
} from "@/context/services/outsideOrdersApi";
import NewOutsideOrderModal from "./NewOutsideOrderModal";
import OutsideOrderDetailModal from "./OutsideOrderDetailModal";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

type TabFilter = "all" | "active" | "materials_out" | "closed";

function destinationIcon(type: DestinationType | string) {
    switch (type) {
        case "BUILDING":
            return Building2;
        case "CAFE":
            return Coffee;
        case "KIOSK":
            return Store;
        default:
            return MapPin;
    }
}

export default function OutsideOrdersBoard({
    title = "Outside Delivery Orders",
    subtitle = "Track off-premises deliveries and returnable materials",
}: {
    title?: string;
    subtitle?: string;
}) {
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<TabFilter>("active");
    const [page, setPage] = useState(1);
    const ORDERS_PER_PAGE = 9;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const {
        data: listRes,
        isLoading,
        refetch,
        isFetching,
    } = useListOutsideOrdersQuery();
    const orders = useMemo(() => listRes?.data ?? [], [listRes?.data]);

    // KPI stats
    const stats = useMemo(() => {
        let active = 0;
        let materialsOut = 0;
        let pendingAudit = 0;
        let closed = 0;

        for (const o of orders) {
            if (o.status === "CLOSED") {
                closed++;
            } else {
                active++;
            }
            if (o.requiresMaterialReturn && !o.materialsSummary.allReturned) {
                const issued = Number(o.materialsSummary.totalIssued) || 0;
                const returned = Number(o.materialsSummary.totalReturned) || 0;
                materialsOut += Math.max(0, issued - returned);
            }
            if (o.materialsSummary.hasDispute) {
                pendingAudit++;
            }
        }

        return { active, materialsOut, pendingAudit, closed };
    }, [orders]);

    // Filtering
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            // Tab filter
            if (tab === "active" && o.status === "CLOSED") return false;
            if (tab === "closed" && o.status !== "CLOSED") return false;
            if (tab === "materials_out") {
                if (!o.requiresMaterialReturn || o.materialsSummary.allReturned)
                    return false;
            }

            // Search filter
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                o.destinationName.toLowerCase().includes(q) ||
                (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                (o.customerPhone && o.customerPhone.includes(q)) ||
                o.waiter.name.toLowerCase().includes(q)
            );
        });
    }, [orders, tab, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredOrders.length / ORDERS_PER_PAGE),
    );
    const paginatedOrders = useMemo(() => {
        const start = (page - 1) * ORDERS_PER_PAGE;
        return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
    }, [filteredOrders, page]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="h-9 gap-2"
                    >
                        <RefreshCw
                            className={cn(
                                "size-4",
                                isFetching && "animate-spin",
                            )}
                        />
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                        className="h-9 gap-2"
                    >
                        <Plus className="size-4" />
                        New Order
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-card p-4 transition-colors hover:border-sky-500/40">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                            <Building2 className="size-5 text-sky-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">
                                {stats.active}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Active
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-4 transition-colors hover:border-amber-500/40">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Boxes className="size-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">
                                {stats.materialsOut}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Materials Out
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-4 transition-colors hover:border-rose-500/40">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <ShieldAlert className="size-5 text-rose-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">
                                {stats.pendingAudit}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Disputes
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-4 transition-colors hover:border-emerald-500/40">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="size-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">
                                {stats.closed}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Completed
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                    <button
                        type="button"
                        onClick={() => setTab("active")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            tab === "active"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                    >
                        Active{" "}
                        <span className="ml-1.5 text-xs opacity-75">
                            ({stats.active})
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("materials_out")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            tab === "materials_out"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                    >
                        Materials Out
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("all")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            tab === "all"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                    >
                        All{" "}
                        <span className="ml-1.5 text-xs opacity-75">
                            ({orders.length})
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("closed")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            tab === "closed"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                    >
                        Closed{" "}
                        <span className="ml-1.5 text-xs opacity-75">
                            ({stats.closed})
                        </span>
                    </button>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search destination, customer, waiter..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-10"
                    />
                </div>
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div className="rounded-xl border bg-card p-16 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Loading orders...
                    </p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card p-16 text-center">
                    <Building2 className="size-12 mx-auto mb-4 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">
                        No orders found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {search
                            ? "Try a different search"
                            : "Create your first outside order to get started"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedOrders.map(order => {
                        const Icon = destinationIcon(order.destinationType);
                        const isClosed = order.status === "CLOSED";
                        const matSummary = order.materialsSummary;

                        return (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                className={cn(
                                    "group rounded-xl border bg-card p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/40",
                                    isClosed && "opacity-60",
                                )}
                            >
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="size-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <Icon className="size-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-foreground truncate">
                                                    {order.destinationName}
                                                </h4>
                                                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                                    {order.destinationType
                                                        .toLowerCase()
                                                        .replace("_", " ")}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide shrink-0",
                                                order.status === "OPEN"
                                                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                                                    : order.status === "CLOSED"
                                                      ? "bg-muted text-muted-foreground"
                                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                                            )}
                                        >
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Note */}
                                    {order.destinationNote && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                            "{order.destinationNote}"
                                        </p>
                                    )}

                                    {/* Details */}
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <User className="size-3.5 shrink-0" />
                                            <span className="truncate">
                                                {order.waiter.name}
                                            </span>
                                        </div>
                                        {order.customerName && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    For: {order.customerName}
                                                </span>
                                            </div>
                                        )}
                                        {order.itemsCount > 0 && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Utensils className="size-3.5 shrink-0" />
                                                <span>
                                                    {order.itemsCount}{" "}
                                                    {order.itemsCount === 1
                                                        ? "dish"
                                                        : "dishes"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Materials & Bill Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        {order.requiresMaterialReturn ? (
                                            (Number(matSummary.totalIssued) ||
                                                0) === 0 ? (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <Boxes className="size-3.5" />
                                                    No materials
                                                </span>
                                            ) : matSummary.allReturned ? (
                                                <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                                                    <CheckCircle2 className="size-3.5" />
                                                    Returned
                                                </span>
                                            ) : matSummary.hasDispute ? (
                                                <span className="text-xs text-rose-500 flex items-center gap-1.5 font-medium">
                                                    <ShieldAlert className="size-3.5" />
                                                    Dispute
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-600 flex items-center gap-1.5 font-medium">
                                                    <Boxes className="size-3.5" />
                                                    {Math.max(
                                                        0,
                                                        (Number(
                                                            matSummary.totalIssued,
                                                        ) || 0) -
                                                            (Number(
                                                                matSummary.totalReturned,
                                                            ) || 0),
                                                    )}{" "}
                                                    out
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Disposable
                                            </span>
                                        )}

                                        {order.bill ? (
                                            <span className="text-sm font-semibold text-foreground">
                                                {formatEtb(
                                                    Number(
                                                        order.bill.totalAmount,
                                                    ),
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Unbilled
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs">
                    <span className="text-muted-foreground">
                        Showing {(page - 1) * ORDERS_PER_PAGE + 1}–
                        {Math.min(
                            page * ORDERS_PER_PAGE,
                            filteredOrders.length,
                        )}{" "}
                        of {filteredOrders.length} outside orders
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="h-8 px-2.5 text-xs gap-1"
                        >
                            <ChevronLeft className="size-3.5" />
                            Previous
                        </Button>
                        <span className="px-2 font-medium">
                            {page} / {totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage(p => Math.min(totalPages, p + 1))
                            }
                            className="h-8 px-2.5 text-xs gap-1"
                        >
                            Next
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* New Outside Order Modal */}
            {isCreateOpen && (
                <NewOutsideOrderModal
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={newId => {
                        setSelectedOrderId(newId);
                        void refetch();
                    }}
                />
            )}

            {/* Outside Order Detail Modal */}
            {selectedOrderId && (
                <OutsideOrderDetailModal
                    outsideOrderId={selectedOrderId}
                    onClose={() => {
                        setSelectedOrderId(null);
                        void refetch();
                    }}
                />
            )}
        </div>
    );
}
