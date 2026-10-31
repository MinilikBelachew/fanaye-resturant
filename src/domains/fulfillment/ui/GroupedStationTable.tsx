"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    ChevronDown,
    ChevronRight,
    Clock,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Search,
    Boxes,
    ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { stationOrderPath } from "@/domains/identity/application/homePath";
import type { StationRole } from "@/domains/identity/domain/role";
import type { StationTicket } from "@/domains/fulfillment/domain/stationTicket";
import { parseServingGroup } from "@/domains/fulfillment/application/servingGroup";
import { imageForDish } from "@/domains/catalog/application/menuImages";
import StationStatusSelect from "@/domains/fulfillment/ui/StationStatusSelect";
import StationTicketActions from "@/domains/fulfillment/ui/StationTicketActions";
import type { TableGroupData } from "@/domains/fulfillment/ui/TableOrderCard";
import IssueMaterialsModal from "@/domains/outside-orders/ui/IssueMaterialsModal";
import { cn } from "@/lib/utils";

function MaterialsButton({
    ticket,
}: {
    ticket: StationTicket;
}) {
    const [showModal, setShowModal] = useState(false);

    if (!ticket.outsideOrderId) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-amber-400/60 bg-amber-50 px-2 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200"
            >
                <Boxes className="size-3" />
                Materials
            </button>
            {showModal && (
                <IssueMaterialsModal
                    outsideOrderId={ticket.outsideOrderId}
                    destinationName={ticket.tableDisplayName}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {}}
                />
            )}
        </>
    );
}

function TableGroupRow({
    group,
    role,
    workflowMode,
    isExpanded,
    onToggle,
}: {
    group: TableGroupData;
    role: StationRole;
    workflowMode?: string | null;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const readyCount = group.allTickets.filter(t => t.state === "READY").length;
    const totalCount = group.allTickets.length;
    const allAreReady = group.allTickets.every(t => t.state === "READY");
    const elapsedMinutes = Math.max(1, Math.round(group.maxElapsedSeconds / 60));

    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border bg-card transition-all",
                allAreReady
                    ? "border-l-4 border-l-emerald-500 border-hairline"
                    : group.isDelayed
                      ? "border-l-4 border-l-destructive border-hairline"
                      : group.hasFresh
                        ? "border-l-4 border-l-brand border-hairline"
                        : "border-hairline",
            )}
        >
            {/* Table Parent Header Bar */}
            <div
                onClick={onToggle}
                className={cn(
                    "flex flex-wrap items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none transition-colors",
                    isExpanded
                        ? "bg-secondary/40 border-b border-hairline/60"
                        : "hover:bg-secondary/20",
                )}
            >
                {/* Left: Chevron, Table Name, Badges, Server */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-lg border border-hairline bg-background text-slate-gray transition-colors hover:text-foreground shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="size-4" />
                        ) : (
                            <ChevronRight className="size-4" />
                        )}
                    </button>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[15px] font-black tracking-tight text-foreground uppercase">
                                {group.tableDisplayName}
                            </h3>
                            {group.hasFresh && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                                    <Sparkles className="size-2.5" />
                                    New
                                </span>
                            )}
                            {group.isDelayed && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-2 py-0.5 text-[10px] font-bold">
                                    <AlertCircle className="size-2.5" />
                                    Delayed
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-gray">
                            Server:{" "}
                            <strong className="text-foreground font-semibold">
                                {group.waiterName}
                            </strong>{" "}
                            · {totalCount} {totalCount === 1 ? "dish" : "dishes"}
                        </p>
                    </div>
                </div>

                {/* Right: Progress Pill & Timer */}
                <div className="flex items-center gap-2.5">
                    <span
                        className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
                            allAreReady
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : readyCount > 0
                                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                  : "bg-secondary text-slate-gray border border-hairline",
                        )}
                    >
                        {readyCount} / {totalCount} Ready
                    </span>

                    <div className="flex items-center gap-1 rounded-full bg-background border border-hairline px-2.5 py-0.5 font-mono text-[11px] font-bold text-foreground shrink-0 shadow-2xs">
                        <Clock className="size-3 text-slate-gray" />
                        <span>{elapsedMinutes}m</span>
                    </div>
                </div>
            </div>

            {/* Child Rows (Sub-Table) */}
            {isExpanded && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12.5px]">
                        <thead>
                            <tr className="border-b border-hairline/60 bg-secondary/15 text-[11px] font-medium uppercase tracking-wider text-slate-gray">
                                <th className="px-4 py-2">Item</th>
                                <th className="px-3 py-2">Plating / Serving</th>
                                <th className="px-3 py-2 text-center">Qty</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline/40 bg-card">
                            {group.allTickets.map(ticket => {
                                const parsed = parseServingGroup(ticket.specialInstruction);
                                const isReady = ticket.state === "READY";
                                const isCooking = ticket.state === "IN_PREPARATION";
                                const isTray1 = parsed.rawTray?.toLowerCase().includes("1") || parsed.rawTray?.toLowerCase().includes("shared");
                                const isTray2 = parsed.rawTray?.toLowerCase().includes("2");
                                const isTray3 = parsed.rawTray?.toLowerCase().includes("3");
                                const modifiersText = ticket.modifiers.map(m => m.name).join(" · ");
                                const dishImage = imageForDish(ticket.itemName);

                                return (
                                    <tr
                                        key={ticket.orderItemId}
                                        className={cn(
                                            "transition-colors hover:bg-secondary/25",
                                            isReady
                                                ? "border-l-4 border-l-emerald-500"
                                                : isCooking
                                                  ? "border-l-4 border-l-amber-500"
                                                  : ticket.delayed
                                                    ? "border-l-4 border-l-destructive"
                                                    : "",
                                        )}
                                    >
                                        {/* Dish Item */}
                                        <td className="px-4 py-2.5 min-w-[200px]">
                                            <div className="flex items-center gap-2.5">
                                                {dishImage ? (
                                                    <div className="size-8 rounded-full overflow-hidden border border-hairline shrink-0 bg-muted/40 shadow-2xs">
                                                        <img
                                                            src={dishImage}
                                                            alt={ticket.itemName}
                                                            className="size-full object-cover"
                                                            onError={e => {
                                                                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                                                            }}
                                                        />
                                                    </div>
                                                ) : null}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Link
                                                            href={stationOrderPath(role, ticket.orderItemId)}
                                                            className="text-[15px] sm:text-[16px] font-bold text-foreground hover:text-brand hover:underline inline-flex items-center gap-1 transition-colors"
                                                        >
                                                            {ticket.itemName}
                                                            <ExternalLink className="size-2.5 opacity-40" />
                                                        </Link>
                                                        {isReady && (
                                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary border border-hairline text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 text-[9.5px] font-semibold tracking-wide">
                                                                <CheckCircle2 className="size-2 text-emerald-600" />
                                                                Ready
                                                            </span>
                                                        )}
                                                    </div>
                                                    {modifiersText ? (
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            {modifiersText}
                                                        </p>
                                                    ) : null}
                                                    {parsed.cleanInstruction ? (
                                                        <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                                                            📝 Note: {parsed.cleanInstruction}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Plating Badge */}
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            {isTray1 ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-secondary border border-hairline text-foreground px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider">
                                                    🍱 Tray 1 (Shared)
                                                </span>
                                            ) : isTray2 ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-secondary border border-hairline text-foreground px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider">
                                                    🍱 Tray 2
                                                </span>
                                            ) : isTray3 ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-secondary border border-hairline text-foreground px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider">
                                                    🍱 Tray 3
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-secondary/50 text-muted-foreground border border-hairline px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                                                    🍽️ Separate Plate
                                                </span>
                                            )}
                                        </td>

                                        {/* Qty */}
                                        <td className="px-3 py-2.5 text-center font-mono font-bold text-foreground">
                                            {ticket.quantity}
                                        </td>

                                        {/* Status Select */}
                                        <td className="px-3 py-2.5">
                                            <div className="w-[145px]">
                                                <StationStatusSelect
                                                    ticket={ticket}
                                                    workflowMode={workflowMode}
                                                />
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5">
                                                <StationTicketActions
                                                    ticket={ticket}
                                                    compact
                                                    workflowMode={workflowMode}
                                                />
                                                <MaterialsButton ticket={ticket} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function GroupedStationTable({
    tableGroups,
    role,
    workflowMode,
    emptyLabel,
}: {
    tableGroups: TableGroupData[];
    role: StationRole;
    workflowMode?: string | null;
    emptyLabel: string;
}) {
    const [search, setSearch] = useState("");
    const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});

    function toggleGroup(key: string) {
        setCollapsedKeys(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return tableGroups;
        const q = search.trim().toLowerCase();
        return tableGroups.filter(group => {
            const matchTable = group.tableDisplayName.toLowerCase().includes(q);
            const matchWaiter = group.waiterName.toLowerCase().includes(q);
            const matchDish = group.allTickets.some(
                t =>
                    t.itemName.toLowerCase().includes(q) ||
                    t.specialInstruction?.toLowerCase().includes(q) ||
                    t.modifiers.some(m => m.name.toLowerCase().includes(q)),
            );
            return matchTable || matchWaiter || matchDish;
        });
    }, [tableGroups, search]);

    if (tableGroups.length === 0) {
        return (
            <div className="rounded-[16px] border border-hairline bg-card p-10 text-center text-slate-gray">
                {emptyLabel}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Table Search Filter Bar */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-gray" />
                    <Input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search table, server, or dish..."
                        className="pl-9 h-9 text-[12.5px] rounded-xl bg-card border-hairline"
                    />
                </div>
                <div className="text-[12px] text-slate-gray">
                    Showing <strong className="text-foreground">{filteredGroups.length}</strong> active tables
                </div>
            </div>

            {/* List of Grouped Table Accordions */}
            {filteredGroups.length === 0 ? (
                <div className="rounded-xl border border-hairline bg-card p-8 text-center text-slate-gray text-[13px]">
                    No tables match "{search}"
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filteredGroups.map(group => (
                        <TableGroupRow
                            key={group.key}
                            group={group}
                            role={role}
                            workflowMode={workflowMode}
                            isExpanded={!collapsedKeys[group.key]}
                            onToggle={() => toggleGroup(group.key)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

