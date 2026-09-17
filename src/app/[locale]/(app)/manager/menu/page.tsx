"use client";

import { useMemo, useState } from "react";
import {
    Clock,
    CookingPot,
    Edit3,
    Eye,
    LayoutGrid,
    Plus,
    QrCode,
    ScanLine,
    Search,
    Table as TableIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    useAdminMenuItemsQuery,
    useAdminMenuMetaQuery,
    useClearMenuItemSoldOutMutation,
    useMarkMenuItemSoldOutMutation,
} from "@/context/services/menuApi";
import { adminMenuItemToCatalog } from "@/domains/catalog/application/mapAdminMenu";
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
import CreateModifierGroupSheet from "@/domains/catalog/ui/CreateModifierGroupSheet";
import MenuItemDetailSheet from "@/domains/catalog/ui/MenuItemDetailSheet";
import MenuScanSheet from "@/domains/catalog/ui/MenuScanSheet";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MenuCatalogSkeleton } from "@/components/custom/molecules/Skeletons";

export default function ManagerMenuPage() {
    const { data: metaData } = useAdminMenuMetaQuery();
    const { data, isLoading, isError } = useAdminMenuItemsQuery(undefined, {
        pollingInterval: 15000,
    });
    const [markSoldOut] = useMarkMenuItemSoldOutMutation();
    const [clearSoldOut] = useClearMenuItemSoldOutMutation();

    const stations = metaData?.data.stations ?? [];
    const menuItems = useMemo(
        () => (data?.data ?? []).map(item => adminMenuItemToCatalog(item)),
        [data],
    );

    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [modifierSheetOpen, setModifierSheetOpen] = useState(false);
    const [scanSheetOpen, setScanSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStation, setSelectedStation] = useState<string>("all");

    const stationFilters = useMemo(
        () => [
            { id: "all", label: "All Items" },
            ...stations.map(station => ({
                id: station.id,
                label: station.name,
            })),
        ],
        [stations],
    );

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

    async function handleToggleAvailability(item: MenuItem) {
        if (item.available) {
            await markSoldOut({ id: item.id });
        } else {
            await clearSoldOut({ id: item.id });
        }
    }

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
                            <p className="truncate text-[12px] text-slate-gray">
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
                cell: row => <Badge variant="outline">{row.category}</Badge>,
            },
            {
                id: "price",
                header: "Price",
                sortValue: row => row.price,
                cell: row => (
                    <span className="font-medium">{formatEtb(row.price)}</span>
                ),
            },
            {
                id: "prep",
                header: "Prep",
                sortValue: row => row.expectedPreparationMinutes,
                cell: row => (
                    <span className="text-slate-gray">
                        ~{row.expectedPreparationMinutes}m
                    </span>
                ),
            },
            {
                id: "status",
                header: "Floor",
                sortValue: row => (row.available ? 1 : 0),
                cell: row => (
                    <button
                        type="button"
                        onClick={() => {
                            void handleToggleAvailability(row);
                        }}
                    >
                        <Badge variant={row.available ? "success" : "warning"}>
                            {row.available ? "Active" : "86 / Sold out"}
                        </Badge>
                    </button>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: row => (
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetail(row)}
                        >
                            <Eye className="size-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(row)}
                        >
                            <Edit3 className="size-3.5" />
                        </Button>
                    </div>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="House"
                title="Menu"
                description="Add dishes, route them to stations, and 86 items when stock runs out."
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/manager/qr-menu">
                            <Button
                                variant="outline"
                                className="gap-2 border-amber-500/40 text-amber-800 bg-amber-50/50 hover:bg-amber-100/50"
                            >
                                <QrCode className="size-4 text-amber-600" />
                                QR Menu Builder
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="gap-2 border-brand/30"
                            onClick={() => setScanSheetOpen(true)}
                        >
                            <ScanLine className="size-4 text-brand" />
                            Scan menu photo
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setModifierSheetOpen(true)}
                        >
                            <Plus className="size-4" />
                            Add modifier group
                        </Button>
                        <Button onClick={handleOpenAdd}>
                            <Plus className="size-4" />
                            Add menu item
                        </Button>
                    </div>
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-gray" />
                    <Input
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                        placeholder="Search dishes & drinks…"
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {stationFilters.map(filter => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => setSelectedStation(filter.id)}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-[13px]",
                                selectedStation === filter.id
                                    ? "border-brand bg-brand/10 text-brand"
                                    : "border-hairline text-slate-gray",
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-2 text-[13px] text-slate-gray">
                    <span>{activeCount} active</span>
                    <span>·</span>
                    <span>{soldOutCount} sold out</span>
                    <button
                        type="button"
                        onClick={() =>
                            setViewMode(viewMode === "grid" ? "table" : "grid")
                        }
                        className="ml-2 rounded-full border border-hairline p-2"
                        aria-label="Toggle view"
                    >
                        {viewMode === "grid" ? (
                            <TableIcon className="size-4" />
                        ) : (
                            <LayoutGrid className="size-4" />
                        )}
                    </button>
                </div>
            </div>

            {isLoading ? <MenuCatalogSkeleton /> : null}
            {isError ? (
                <p className="text-red-600">
                    Could not load menu from the server. Sign in as manager and
                    confirm the API is running.
                </p>
            ) : null}

            {!isLoading && !isError && viewMode === "table" ? (
                <DataTable
                    columns={tableColumns}
                    data={filteredItems}
                    rowKey={row => row.id}
                />
            ) : null}

            {!isLoading && !isError && viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredItems.map(item => (
                        <article
                            key={item.id}
                            className="group overflow-hidden rounded-[16px] border border-hairline bg-card shadow-subtle"
                        >
                            <div className="relative aspect-[4/3] bg-secondary">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center text-slate-gray">
                                        <CookingPot className="size-10 opacity-40" />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 text-white">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <Badge
                                            variant={
                                                item.available
                                                    ? "success"
                                                    : "warning"
                                            }
                                            className="cursor-pointer"
                                            onClick={() => {
                                                void handleToggleAvailability(
                                                    item,
                                                );
                                            }}
                                        >
                                            {item.available
                                                ? "Active"
                                                : "86 / Sold out"}
                                        </Badge>
                                        <span className="text-[12px] text-white/70">
                                            {item.category}
                                        </span>
                                    </div>
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
            ) : null}

            <AddMenuItemSheet
                isOpen={sheetOpen}
                initialItem={editingItem}
                onClose={() => {
                    setSheetOpen(false);
                    setEditingItem(null);
                }}
            />

            <CreateModifierGroupSheet
                isOpen={modifierSheetOpen}
                onClose={() => setModifierSheetOpen(false)}
            />

            <MenuScanSheet
                isOpen={scanSheetOpen}
                onClose={() => setScanSheetOpen(false)}
            />

            <MenuItemDetailSheet
                item={currentDetailItem}
                isOpen={Boolean(currentDetailItem)}
                onClose={() => setDetailItem(null)}
                onEdit={item => {
                    setDetailItem(null);
                    handleOpenEdit(item);
                }}
                onToggleAvailability={item => {
                    void handleToggleAvailability(item);
                }}
            />
        </DashboardFrame>
    );
}
