"use client";

import { useMemo, useState } from "react";
import {
    Clock,
    CookingPot,
    Edit3,
    Eye,
    LayoutGrid,
    Plus,
    Search,
    Table as TableIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { toggleItemAvailability } from "@/context/slices/menuSlice";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import AddMenuItemSheet from "@/domains/catalog/ui/AddMenuItemSheet";
import MenuItemDetailSheet from "@/domains/catalog/ui/MenuItemDetailSheet";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

const STATION_FILTERS = [
    { id: "all", label: "All Items" },
    { id: "station-kitchen", label: "Kitchen" },
    { id: "station-barista", label: "Barista" },
    { id: "station-cakes", label: "Cakes" },
    { id: "station-soft-drinks", label: "Soft Drinks" },
] as const;

export default function ManagerMenuPage() {
    const dispatch = useAppDispatch();
    const menuItems = useAppSelector(state => state.menu.items);

    // View mode: 'grid' or 'table'
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    // Modal / Drawer states
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStation, setSelectedStation] = useState<string>("all");

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesStation =
                selectedStation === "all" || item.stationId === selectedStation;
            const matchesQuery =
                !searchQuery.trim() ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStation && matchesQuery;
        });
    }, [menuItems, selectedStation, searchQuery]);

    const activeCount = menuItems.filter(i => i.available).length;
    const soldOutCount = menuItems.length - activeCount;

    // Keep detail item updated if Redux state changes (e.g. toggled 86 or edited)
    const currentDetailItem = useMemo(() => {
        if (!detailItem) return null;
        return menuItems.find(i => i.id === detailItem.id) ?? detailItem;
    }, [menuItems, detailItem]);

    function handleOpenAdd() {
        setEditingItem(null);
        setSheetOpen(true);
    }

    function handleOpenEdit(item: MenuItem) {
        setDetailItem(null);
        setEditingItem(item);
        setSheetOpen(true);
    }

    function handleOpenDetail(item: MenuItem) {
        setDetailItem(item);
    }

    // DataTable columns definition
    const tableColumns: DataTableColumn<MenuItem>[] = useMemo(
        () => [
            {
                id: "dish",
                header: "Dish & Description",
                sortValue: row => row.name,
                cell: row => (
                    <div className="flex items-center gap-3">
                        {row.image ? (
                            <div className="size-10 shrink-0 overflow-hidden rounded-[8px] border border-hairline bg-secondary">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={row.image}
                                    alt={row.name}
                                    className="size-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-hairline bg-secondary text-[11px] font-medium text-slate-gray">
                                {row.category.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <button
                                type="button"
                                onClick={() => handleOpenDetail(row)}
                                className="text-left font-semibold text-foreground hover:text-brand hover:underline"
                            >
                                {row.name}
                            </button>
                            <p className="line-clamp-1 text-[12px] text-slate-gray">
                                {row.description}
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                id: "station",
                header: "Station",
                sortValue: row => row.category,
                cell: row => (
                    <Badge variant="secondary" className="font-normal capitalize text-[11px]">
                        {row.category}
                    </Badge>
                ),
            },
            {
                id: "price",
                header: "Price",
                sortValue: row => row.price,
                cell: row => (
                    <span className="font-semibold text-foreground">
                        {formatEtb(row.price)}
                    </span>
                ),
            },
            {
                id: "prepTime",
                header: "Prep time",
                sortValue: row => row.expectedPreparationMinutes,
                cell: row => (
                    <div className="flex items-center gap-1 text-[12px] text-slate-gray">
                        <Clock className="size-3.5" />
                        <span>~{row.expectedPreparationMinutes}m</span>
                    </div>
                ),
            },
            {
                id: "modifiers",
                header: "Options",
                cell: row => (
                    <span className="text-[12px] text-slate-gray">
                        {row.modifierGroups.length > 0
                            ? row.modifierGroups.map(g => g.name).join(", ")
                            : "Standard"}
                    </span>
                ),
            },
            {
                id: "status",
                header: "Status",
                sortValue: row => (row.available ? 1 : 0),
                cell: row => (
                    <button
                        type="button"
                        onClick={() => dispatch(toggleItemAvailability(row.id))}
                        className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                            row.available
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 hover:bg-red-100",
                        )}
                        title="Click to toggle availability"
                    >
                        {row.available ? "Active" : "86'd (Sold out)"}
                    </button>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: row => (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => handleOpenDetail(row)}
                            className="flex size-7 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray hover:bg-secondary hover:text-foreground"
                            title="View details"
                        >
                            <Eye className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOpenEdit(row)}
                            className="flex size-7 items-center justify-center rounded-full border border-hairline bg-card text-slate-gray hover:bg-secondary hover:text-foreground"
                            title="Edit dish"
                        >
                            <Edit3 className="size-3.5" />
                        </button>
                    </div>
                ),
            },
        ],
        [dispatch],
    );

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="House"
                title="Menu"
                description="Routing is by preparation station, not by a hardcoded food category."
                action={
                    <Button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-deep"
                    >
                        <Plus className="size-4" />
                        Add menu item
                    </Button>
                }
            />

            {/* Filter, Search, and View Mode Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Station Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1 rounded-[48px] border border-hairline bg-surface-ivory p-1">
                    {STATION_FILTERS.map(filter => {
                        const isSelected = selectedStation === filter.id;
                        const count =
                            filter.id === "all"
                                ? menuItems.length
                                : menuItems.filter(
                                      item => item.stationId === filter.id,
                                  ).length;

                        return (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() => setSelectedStation(filter.id)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                                    isSelected
                                        ? "bg-white text-foreground border border-hairline"
                                        : "text-slate-gray hover:text-foreground",
                                )}
                            >
                                <span>{filter.label}</span>
                                <span
                                    className={cn(
                                        "rounded-full px-1.5 py-0.2 text-[10px]",
                                        isSelected
                                            ? "bg-accent text-accent-foreground font-semibold"
                                            : "bg-secondary text-slate-gray",
                                    )}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Right controls: Search, Availability badge, and Grid/Table View toggle */}
                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:w-56">
                        <Search className="absolute inset-y-0 left-3 my-auto size-3.5 text-slate-gray" />
                        <Input
                            placeholder="Search dishes & drinks…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-9 rounded-full border-hairline bg-white pl-8.5 text-[13px]"
                        />
                    </div>

                    <Badge variant="secondary" className="hidden sm:inline-flex text-[11px]">
                        {activeCount} active · {soldOutCount} 86'd
                    </Badge>

                    {/* View mode toggle (Grid vs Table) */}
                    <div className="flex items-center rounded-full border border-hairline bg-surface-ivory p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "flex size-8 items-center justify-center rounded-full transition-colors",
                                viewMode === "grid"
                                    ? "bg-white text-foreground border border-hairline"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                            title="Grid card view"
                        >
                            <LayoutGrid className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "flex size-8 items-center justify-center rounded-full transition-colors",
                                viewMode === "table"
                                    ? "bg-white text-foreground border border-hairline"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                            title="Table list view"
                        >
                            <TableIcon className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Render: Table View vs Grid Card View */}
            {viewMode === "table" ? (
                <div className="mt-4">
                    <DataTable
                        columns={tableColumns}
                        data={filteredItems}
                        rowKey={item => item.id}
                        searchPlaceholder={null}
                        showColumnToggle={true}
                        empty={
                            <div className="py-12 text-center text-slate-gray">
                                No menu items found.
                            </div>
                        }
                    />
                </div>
            ) : (
                /* Grid Cards View */
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredItems.map(item => (
                        <article
                            key={item.id}
                            className={cn(
                                "group relative min-h-[360px] overflow-hidden rounded-[20px] border border-hairline bg-secondary",
                                !item.available && "opacity-70 grayscale",
                            )}
                        >
                            {item.image ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-secondary" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                            <div className="relative flex min-h-[360px] flex-col justify-between p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                                        {item.category}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            dispatch(
                                                toggleItemAvailability(
                                                    item.id,
                                                ),
                                            );
                                        }}
                                        title={
                                            item.available
                                                ? "Click to 86 item"
                                                : "Click to mark available"
                                        }
                                        className={cn(
                                            "rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md transition-colors",
                                            item.available
                                                ? "bg-white/90 text-emerald-800 hover:bg-white"
                                                : "bg-red-600/95 text-white hover:bg-red-700",
                                        )}
                                    >
                                        {item.available ? "Active" : "86'd"}
                                    </button>
                                </div>

                                <div
                                    className="cursor-pointer text-white"
                                    onClick={() => handleOpenDetail(item)}
                                >
                                    <h2 className="text-[22px] leading-tight font-semibold">
                                        {item.name}
                                    </h2>
                                    <p className="mt-1.5 line-clamp-2 text-[13px] text-white/75">
                                        {item.description}
                                    </p>
                                    {item.modifierGroups.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {item.modifierGroups.map(group => (
                                                <span
                                                    key={group.id}
                                                    className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                                                >
                                                    {group.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <p className="text-[16px] font-semibold">
                                            {formatEtb(item.price)}
                                        </p>
                                        <div className="flex items-center gap-1 text-[12px] text-white/70">
                                            <Clock className="size-3.5" />
                                            <span>
                                                ~
                                                {
                                                    item.expectedPreparationMinutes
                                                }
                                                m
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleOpenDetail(item);
                                            }}
                                            className="flex items-center gap-1 text-[12px] font-medium text-white/80 hover:text-white"
                                        >
                                            <Eye className="size-3.5" />
                                            Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleOpenEdit(item);
                                            }}
                                            className="flex items-center gap-1 text-[12px] font-medium text-white hover:underline"
                                        >
                                            <Edit3 className="size-3.5" />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}

                    {filteredItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-[16px] border border-dashed border-hairline bg-surface-ivory py-16 text-center">
                            <CookingPot className="size-10 text-slate-gray/60" />
                            <h3 className="mt-3 text-[16px] font-semibold text-foreground">
                                No menu items found
                            </h3>
                            <p className="mt-1 text-[13px] text-slate-gray">
                                {searchQuery
                                    ? `No dishes match "${searchQuery}".`
                                    : "No items listed for this station."}
                            </p>
                            <Button
                                variant="outline"
                                onClick={handleOpenAdd}
                                className="mt-4 rounded-full"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Add new dish
                            </Button>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Add / Edit Menu Item Form Sheet */}
            <AddMenuItemSheet
                isOpen={sheetOpen}
                initialItem={editingItem}
                onClose={() => {
                    setSheetOpen(false);
                    setEditingItem(null);
                }}
            />

            {/* Dish Detail Sheet */}
            <MenuItemDetailSheet
                item={currentDetailItem}
                isOpen={Boolean(detailItem)}
                onClose={() => setDetailItem(null)}
                onEdit={handleOpenEdit}
            />
        </DashboardFrame>
    );
}
