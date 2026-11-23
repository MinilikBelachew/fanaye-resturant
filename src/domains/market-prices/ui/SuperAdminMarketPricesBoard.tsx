"use client";

import { useState, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
    formatCalendarDateTime,
    useCalendarMode,
} from "@/hooks/useCalendarMode";
import { useUploadMenuImageMutation } from "@/context/services/menuApi";
import {
    useBulkUpsertMarketPricesMutation,
    useCreateMarketCategoryMutation,
    useCreateMarketItemMutation,
    useCreateMarketReporterMutation,
    useCreateMarketUnitMutation,
    useCreateMarketplaceMutation,
    useGetMyMarketCapabilitiesQuery,
    useListAdminMarketItemsQuery,
    useListAdminMarketMetadataQuery,
    useListMarketReportersQuery,
    useListPublicMarketHistoryQuery,
    useUpdateMarketCategoryMutation,
    useUpdateMarketItemMutation,
    useUpdateMarketReporterStatusMutation,
    useUpdateMarketUnitMutation,
    useUpdateMarketplaceMutation,
    useUpsertMarketPriceMutation,
    type MarketItem,
} from "@/context/services/marketPricesApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { toast } from "@/lib/toast";
import {
    Calendar,
    Camera,
    Check,
    History,
    Layers,
    MapPin,
    Pencil,
    Plus,
    Save,
    Search,
    ShoppingBasket,
    Store,
    Tag,
    Trash2,
    TrendingUp,
    Upload,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { TrendBadge, formatEtb } from "./MarketPriceWidgets";

type AdminTab = "prices" | "history" | "items" | "taxonomy" | "reporters";
type DatePreset = "today" | "yesterday" | "7d" | "30d" | "all" | "custom";

function formatYmd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getPresetDates(preset: DatePreset): { from?: string; to?: string } {
    const now = new Date();
    const today = formatYmd(now);
    if (preset === "today") return { from: today, to: today };
    if (preset === "yesterday") {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        const ymd = formatYmd(y);
        return { from: ymd, to: ymd };
    }
    if (preset === "7d") {
        const d = new Date(now);
        d.setDate(now.getDate() - 6);
        return { from: formatYmd(d), to: today };
    }
    if (preset === "30d") {
        const d = new Date(now);
        d.setDate(now.getDate() - 29);
        return { from: formatYmd(d), to: today };
    }
    return {};
}

export default function SuperAdminMarketPricesBoard() {
    const locale = useLocale();
    const t = useTranslations("marketPrices");
    const { calendarMode } = useCalendarMode();
    const [tab, setTab] = useState<AdminTab>("prices");
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("ALL");
    const [priceMarketplaceId, setPriceMarketplaceId] = useState("ALL");

    // History date filter state
    const [datePreset, setDatePreset] = useState<DatePreset>("7d");
    const [customDateFrom, setCustomDateFrom] = useState(() =>
        formatYmd(new Date()),
    );
    const [customDateTo, setCustomDateTo] = useState(() =>
        formatYmd(new Date()),
    );
    const [historyItemId, setHistoryItemId] = useState("ALL");
    const [historyMarketplaceId, setHistoryMarketplaceId] = useState("ALL");

    // Inline price drafts: key = `${itemId}:${marketplaceId}` -> string
    const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);

    // Item add/edit sheet
    const [itemSheetOpen, setItemSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
    const [itemName, setItemName] = useState("");
    const [itemCatId, setItemCatId] = useState("");
    const [itemUnitId, setItemUnitId] = useState("");
    const [itemPhotoUrl, setItemPhotoUrl] = useState("");
    const [itemDesc, setItemDesc] = useState("");
    const [itemFeatured, setItemFeatured] = useState(true);
    const [itemActive, setItemActive] = useState(true);

    // Reporter sheet
    const [reporterSheetOpen, setReporterSheetOpen] = useState(false);
    const [repName, setRepName] = useState("");
    const [repPhone, setRepPhone] = useState("");
    const [repEmail, setRepEmail] = useState("");
    const [repPassword, setRepPassword] = useState("");

    // Taxonomy quick-add forms
    const [newMarketName, setNewMarketName] = useState("");
    const [newMarketArea, setNewMarketArea] = useState("");
    const [newCatName, setNewCatName] = useState("");
    const [newUnitCode, setNewUnitCode] = useState("");
    const [newUnitLabel, setNewUnitLabel] = useState("");

    const {
        data: caps,
        isLoading: isLoadingCaps,
        isError: isCapsError,
        refetch: refetchCaps,
    } = useGetMyMarketCapabilitiesQuery();
    const { data: meta } = useListAdminMarketMetadataQuery({
        includeInactive: true,
    });
    const { data: itemsData, isLoading: isLoadingItems } =
        useListAdminMarketItemsQuery({
            limit: 100,
            search: search.trim() || undefined,
            categoryId: categoryId === "ALL" ? undefined : categoryId,
            includeInactive: true,
        });
    const { data: reporters } = useListMarketReportersQuery(undefined, {
        skip: !caps?.isSuperAdmin,
    });

    const activeDateRange =
        datePreset === "custom"
            ? { from: customDateFrom, to: customDateTo }
            : getPresetDates(datePreset);

    const { data: historyData, isLoading: isLoadingHistory } =
        useListPublicMarketHistoryQuery(
            {
                dateFrom: activeDateRange.from,
                dateTo: activeDateRange.to,
                itemId: historyItemId === "ALL" ? undefined : historyItemId,
                marketplaceId:
                    historyMarketplaceId === "ALL"
                        ? undefined
                        : historyMarketplaceId,
                limit: 200,
            },
            { skip: tab !== "history" },
        );

    const [upsertPrice] = useUpsertMarketPriceMutation();
    const [bulkUpsertPrices, { isLoading: isBulkSaving }] =
        useBulkUpsertMarketPricesMutation();
    const [createItem, { isLoading: isCreatingItem }] =
        useCreateMarketItemMutation();
    const [updateItem, { isLoading: isUpdatingItem }] =
        useUpdateMarketItemMutation();
    const [uploadPhoto, { isLoading: isUploadingPhoto }] =
        useUploadMenuImageMutation();

    const [createMarketplace] = useCreateMarketplaceMutation();
    const [updateMarketplace] = useUpdateMarketplaceMutation();
    const [createCategory] = useCreateMarketCategoryMutation();
    const [updateCategory] = useUpdateMarketCategoryMutation();
    const [createUnit] = useCreateMarketUnitMutation();
    const [updateUnit] = useUpdateMarketUnitMutation();

    const [createReporter, { isLoading: isCreatingReporter }] =
        useCreateMarketReporterMutation();
    const [updateReporterStatus] = useUpdateMarketReporterStatusMutation();

    const categories = meta?.categories ?? [];
    const units = meta?.units ?? [];
    const marketplaces = meta?.marketplaces ?? [];
    const activeMarketplaces = marketplaces.filter(m => m.isActive);
    const items = itemsData?.items ?? [];

    const handleSaveInlinePrice = async (
        itemId: string,
        marketplaceId: string,
        fallbackPrice?: number,
    ) => {
        const key = `${itemId}:${marketplaceId}`;
        const raw =
            priceDrafts[key] ?? (fallbackPrice ? String(fallbackPrice) : "");
        const numeric = Number(raw);
        if (!raw || Number.isNaN(numeric) || numeric <= 0) {
            toast.error(t("invalidPrice"));
            return;
        }

        setSavingKey(key);
        try {
            await upsertPrice({
                itemId,
                marketplaceId,
                price: numeric,
            }).unwrap();
            setPriceDrafts(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
            toast.success(t("priceUpdated"));
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to update price.";
            toast.error(msg);
        } finally {
            setSavingKey(null);
        }
    };

    const visibleMarketplaces =
        priceMarketplaceId === "ALL"
            ? activeMarketplaces
            : activeMarketplaces.filter(m => m.id === priceMarketplaceId);

    const activeItems = items.filter(i => i.isActive);

    const dirtyEntries: Array<{
        key: string;
        itemId: string;
        marketplaceId: string;
        price: number;
    }> = [];

    for (const item of activeItems) {
        const priceByMarket = new Map(
            item.marketPrices.map(mp => [mp.marketplaceId, mp.price]),
        );
        for (const mp of activeMarketplaces) {
            const key = `${item.id}:${mp.id}`;
            const draft = priceDrafts[key];
            if (draft === undefined || draft === "") continue;
            const numeric = Number(draft);
            if (Number.isNaN(numeric) || numeric <= 0) continue;
            const existing = priceByMarket.get(mp.id);
            if (existing !== numeric) {
                dirtyEntries.push({
                    key,
                    itemId: item.id,
                    marketplaceId: mp.id,
                    price: numeric,
                });
            }
        }
    }

    const handleSaveAllChanged = async () => {
        if (dirtyEntries.length === 0) return;
        try {
            await bulkUpsertPrices({
                entries: dirtyEntries.map(e => ({
                    itemId: e.itemId,
                    marketplaceId: e.marketplaceId,
                    price: e.price,
                })),
            }).unwrap();
            setPriceDrafts({});
            toast.success(
                `Saved ${dirtyEntries.length} market ${dirtyEntries.length === 1 ? "price" : "prices"}.`,
            );
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to save prices.";
            toast.error(msg);
        }
    };

    const openAddItem = () => {
        setEditingItem(null);
        setItemName("");
        setItemCatId(
            categories.find(c => c.isActive)?.id ?? categories[0]?.id ?? "",
        );
        setItemUnitId(units.find(u => u.isActive)?.id ?? units[0]?.id ?? "");
        setItemPhotoUrl("");
        setItemDesc("");
        setItemFeatured(true);
        setItemActive(true);
        setItemSheetOpen(true);
    };

    const openEditItem = (item: MarketItem) => {
        setEditingItem(item);
        setItemName(item.name);
        setItemCatId(item.categoryId);
        setItemUnitId(item.unitId);
        setItemPhotoUrl(item.photoUrl ?? "");
        setItemDesc(item.description ?? "");
        setItemFeatured(item.isFeaturedOnLanding);
        setItemActive(item.isActive);
        setItemSheetOpen(true);
    };

    const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await uploadPhoto(file).unwrap();
            setItemPhotoUrl(res.file.path);
            toast.success("Photo uploaded.");
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to upload photo.";
            toast.error(msg);
        } finally {
            e.target.value = "";
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateItem({
                    id: editingItem.id,
                    name: itemName.trim(),
                    categoryId: itemCatId,
                    unitId: itemUnitId,
                    photoUrl: itemPhotoUrl.trim() || undefined,
                    description: itemDesc.trim() || undefined,
                    isFeaturedOnLanding: itemFeatured,
                    isActive: itemActive,
                }).unwrap();
                toast.success("Item updated.");
            } else {
                await createItem({
                    name: itemName.trim(),
                    categoryId: itemCatId,
                    unitId: itemUnitId,
                    photoUrl: itemPhotoUrl.trim() || undefined,
                    description: itemDesc.trim() || undefined,
                    isFeaturedOnLanding: itemFeatured,
                }).unwrap();
                toast.success("Item added.");
            }
            setItemSheetOpen(false);
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to save item.";
            toast.error(msg);
        }
    };

    const handleAddMarketplace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMarketName.trim()) return;
        try {
            await createMarketplace({
                name: newMarketName.trim(),
                area: newMarketArea.trim() || undefined,
            }).unwrap();
            setNewMarketName("");
            setNewMarketArea("");
            toast.success("Marketplace added.");
        } catch (err: unknown) {
            toast.error(
                (err as { data?: { message?: string } })?.data?.message ??
                    "Failed to add marketplace.",
            );
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await createCategory({ name: newCatName.trim() }).unwrap();
            setNewCatName("");
            toast.success("Category added.");
        } catch (err: unknown) {
            toast.error(
                (err as { data?: { message?: string } })?.data?.message ??
                    "Failed to add category.",
            );
        }
    };

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnitCode.trim() || !newUnitLabel.trim()) return;
        try {
            await createUnit({
                code: newUnitCode.trim(),
                label: newUnitLabel.trim(),
            }).unwrap();
            setNewUnitCode("");
            setNewUnitLabel("");
            toast.success("Unit added.");
        } catch (err: unknown) {
            toast.error(
                (err as { data?: { message?: string } })?.data?.message ??
                    "Failed to add unit.",
            );
        }
    };

    const handleCreateReporter = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createReporter({
                displayName: repName.trim(),
                phone: repPhone.trim(),
                email: repEmail.trim() || undefined,
                password: repPassword.trim(),
            }).unwrap();
            toast.success("Market Reporter account created.");
            setReporterSheetOpen(false);
            setRepName("");
            setRepPhone("");
            setRepEmail("");
            setRepPassword("");
        } catch (err: unknown) {
            toast.error(
                (err as { data?: { message?: string } })?.data?.message ??
                    "Failed to create reporter.",
            );
        }
    };

    if (isLoadingCaps) {
        return (
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        );
    }

    if (isCapsError || !caps) {
        return (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm">
                <p className="font-semibold text-foreground">
                    Unable to load Market Prices permissions from the backend.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    If you just added the Market Prices module, restart your
                    backend server (`fanaye-resturant-backend`) so the new
                    `/market-prices/*` routes are active, then click Retry.
                </p>
                <button
                    type="button"
                    onClick={() => refetchCaps()}
                    className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Top Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setTab("prices")}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            tab === "prices"
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                    >
                        <TrendingUp className="h-4 w-4" />
                        Update Prices
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab("history")}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            tab === "history"
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                    >
                        <History className="h-4 w-4" />
                        Price History
                    </button>

                    {caps?.canManageItems ? (
                        <button
                            type="button"
                            onClick={() => setTab("items")}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                tab === "items"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground hover:bg-muted"
                            }`}
                        >
                            <ShoppingBasket className="h-4 w-4" />
                            Items ({items.length})
                        </button>
                    ) : null}

                    {caps?.canManageLocations ? (
                        <button
                            type="button"
                            onClick={() => setTab("taxonomy")}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                tab === "taxonomy"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground hover:bg-muted"
                            }`}
                        >
                            <Layers className="h-4 w-4" />
                            Markets, Categories & Units
                        </button>
                    ) : null}

                    {caps?.isSuperAdmin ? (
                        <button
                            type="button"
                            onClick={() => setTab("reporters")}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                tab === "reporters"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground hover:bg-muted"
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            Reporters ({reporters?.length ?? 0})
                        </button>
                    ) : null}
                </div>

                {tab === "items" && caps?.canManageItems ? (
                    <button
                        type="button"
                        onClick={openAddItem}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Item
                    </button>
                ) : null}

                {tab === "reporters" && caps?.isSuperAdmin ? (
                    <button
                        type="button"
                        onClick={() => setReporterSheetOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add Reporter
                    </button>
                ) : null}
            </div>

            {/* Search, Category & Market Filter for Prices / Items */}
            {(tab === "prices" || tab === "items") && (
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full rounded-xl border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {tab === "prices" ? (
                            <select
                                value={priceMarketplaceId}
                                onChange={e =>
                                    setPriceMarketplaceId(e.target.value)
                                }
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            >
                                <option value="ALL">
                                    All Markets ({activeMarketplaces.length})
                                </option>
                                {activeMarketplaces.map(mp => (
                                    <option key={mp.id} value={mp.id}>
                                        {mp.name}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                    </div>

                    {tab === "prices" && caps?.canUpdatePrices ? (
                        <button
                            type="button"
                            disabled={dirtyEntries.length === 0 || isBulkSaving}
                            onClick={handleSaveAllChanged}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:opacity-90 disabled:opacity-40"
                        >
                            <Save className="h-4 w-4" />
                            <span>
                                {isBulkSaving
                                    ? "Saving..."
                                    : dirtyEntries.length > 0
                                      ? `Save All Changed (${dirtyEntries.length})`
                                      : "All Prices Saved"}
                            </span>
                        </button>
                    ) : null}
                </div>
            )}

            {/* TAB 1: LIVE PRICES (Fast Matrix + Bulk Save) */}
            {tab === "prices" ? (
                !caps?.canUpdatePrices ? (
                    <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                        Price updates are currently disabled for your role.
                    </div>
                ) : isLoadingItems ? (
                    <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
                ) : activeItems.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                        No active market items found.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                            <span>
                                Edit any prices below and click{" "}
                                <strong className="text-foreground">
                                    Save All Changed
                                </strong>{" "}
                                (or press{" "}
                                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                                    Enter
                                </kbd>{" "}
                                on a single field).
                            </span>
                            <span className="font-mono">
                                {activeItems.length} items ·{" "}
                                {visibleMarketplaces.length} markets
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-muted/95 px-4 py-3 backdrop-blur-sm min-w-[210px]">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            Avg / Trend
                                        </th>
                                        {visibleMarketplaces.map(mp => (
                                            <th
                                                key={mp.id}
                                                className="px-3 py-3 min-w-[155px] whitespace-nowrap"
                                            >
                                                <span className="inline-flex items-center gap-1 text-foreground">
                                                    <MapPin className="h-3 w-3 text-primary" />
                                                    {mp.name}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {activeItems.map(item => {
                                        const priceByMarket = new Map(
                                            item.marketPrices.map(mp => [
                                                mp.marketplaceId,
                                                mp,
                                            ]),
                                        );
                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-muted/20 transition-colors"
                                            >
                                                <td className="sticky left-0 z-10 bg-card px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        {item.photoUrl ? (
                                                            <img
                                                                src={
                                                                    filePublicUrl(
                                                                        item.photoUrl,
                                                                    ) ??
                                                                    item.photoUrl
                                                                }
                                                                alt={item.name}
                                                                className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-primary-soft text-primary">
                                                                <ShoppingBasket className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-foreground text-xs sm:text-sm">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                per{" "}
                                                                {item.unit.code}{" "}
                                                                ·{" "}
                                                                {
                                                                    item
                                                                        .category
                                                                        .name
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
                                                            {formatEtb(
                                                                item.averagePrice,
                                                            )}
                                                        </span>
                                                        <TrendBadge
                                                            changePercent={
                                                                item.changePercent
                                                            }
                                                        />
                                                    </div>
                                                </td>

                                                {visibleMarketplaces.map(mp => {
                                                    const existing =
                                                        priceByMarket.get(
                                                            mp.id,
                                                        );
                                                    const key = `${item.id}:${mp.id}`;
                                                    const draftVal =
                                                        priceDrafts[key] ??
                                                        (existing
                                                            ? String(
                                                                  existing.price,
                                                              )
                                                            : "");
                                                    const isDirty =
                                                        priceDrafts[key] !==
                                                            undefined &&
                                                        priceDrafts[key] !==
                                                            "" &&
                                                        Number(
                                                            priceDrafts[key],
                                                        ) !== existing?.price;
                                                    const isSavingThis =
                                                        savingKey === key;

                                                    return (
                                                        <td
                                                            key={mp.id}
                                                            className="px-3 py-2.5"
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={
                                                                        draftVal
                                                                    }
                                                                    onKeyDown={e => {
                                                                        if (
                                                                            e.key ===
                                                                            "Enter"
                                                                        ) {
                                                                            e.preventDefault();
                                                                            handleSaveInlinePrice(
                                                                                item.id,
                                                                                mp.id,
                                                                                existing?.price,
                                                                            );
                                                                        }
                                                                    }}
                                                                    onChange={e =>
                                                                        setPriceDrafts(
                                                                            prev => ({
                                                                                ...prev,
                                                                                [key]: e
                                                                                    .target
                                                                                    .value,
                                                                            }),
                                                                        )
                                                                    }
                                                                    placeholder="ETB"
                                                                    className={`w-24 rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-mono font-medium outline-none transition ${
                                                                        isDirty
                                                                            ? "border-orange-500 bg-orange-500/5 text-foreground ring-1 ring-orange-500/20"
                                                                            : "border-border bg-background text-foreground focus:border-primary"
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        isSavingThis
                                                                    }
                                                                    onClick={() =>
                                                                        handleSaveInlinePrice(
                                                                            item.id,
                                                                            mp.id,
                                                                            existing?.price,
                                                                        )
                                                                    }
                                                                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                                                        isDirty
                                                                            ? "bg-primary text-primary-foreground hover:opacity-90"
                                                                            : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                                    }`}
                                                                    title="Save this price"
                                                                >
                                                                    {isSavingThis ? (
                                                                        "..."
                                                                    ) : (
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                            {existing ? (
                                                                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                    <span>
                                                                        {formatCalendarDateTime(
                                                                            existing.updatedAt,
                                                                            locale,
                                                                            calendarMode,
                                                                            false,
                                                                        )}
                                                                    </span>
                                                                    {existing.changePercent !==
                                                                    null ? (
                                                                        <span
                                                                            className={
                                                                                existing.changePercent >
                                                                                0
                                                                                    ? "text-rose-600 dark:text-rose-400"
                                                                                    : existing.changePercent <
                                                                                        0
                                                                                      ? "text-emerald-600 dark:text-emerald-400"
                                                                                      : ""
                                                                            }
                                                                        >
                                                                            {existing.changePercent >
                                                                            0
                                                                                ? "+"
                                                                                : ""}
                                                                            {existing.changePercent.toFixed(
                                                                                1,
                                                                            )}
                                                                            %
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            ) : null}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : null}

            {/* TAB: PRICE HISTORY & DATE FILTER */}
            {tab === "history" ? (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Date Range:
                                </span>
                                {(
                                    [
                                        { id: "today", label: "Today" },
                                        { id: "yesterday", label: "Yesterday" },
                                        { id: "7d", label: "Last 7 Days" },
                                        { id: "30d", label: "Last 30 Days" },
                                        { id: "all", label: "All Time" },
                                        { id: "custom", label: "Custom" },
                                    ] as const
                                ).map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setDatePreset(p.id)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                            datePreset === p.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {datePreset === "custom" ? (
                                <>
                                    <div>
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={customDateFrom}
                                            onChange={e =>
                                                setCustomDateFrom(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={customDateTo}
                                            onChange={e =>
                                                setCustomDateTo(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                </>
                            ) : null}

                            <div>
                                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                    Filter by Item
                                </label>
                                <select
                                    value={historyItemId}
                                    onChange={e =>
                                        setHistoryItemId(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
                                >
                                    <option value="ALL">All Items</option>
                                    {items.map(i => (
                                        <option key={i.id} value={i.id}>
                                            {i.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                    Filter by Market
                                </label>
                                <select
                                    value={historyMarketplaceId}
                                    onChange={e =>
                                        setHistoryMarketplaceId(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
                                >
                                    <option value="ALL">All Markets</option>
                                    {marketplaces.map(mp => (
                                        <option key={mp.id} value={mp.id}>
                                            {mp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary Strip */}
                    {historyData?.summary ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-border bg-card p-3.5">
                                <div className="text-[11px] uppercase text-muted-foreground">
                                    Records
                                </div>
                                <div className="mt-1 font-mono text-lg font-bold text-foreground">
                                    {historyData.summary.count}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border bg-card p-3.5">
                                <div className="text-[11px] uppercase text-muted-foreground">
                                    Period Avg
                                </div>
                                <div className="mt-1 font-mono text-lg font-bold text-foreground">
                                    {formatEtb(historyData.summary.avgPrice)}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border bg-card p-3.5">
                                <div className="text-[11px] uppercase text-muted-foreground">
                                    Lowest
                                </div>
                                <div className="mt-1 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatEtb(historyData.summary.minPrice)}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border bg-card p-3.5">
                                <div className="text-[11px] uppercase text-muted-foreground">
                                    Highest
                                </div>
                                <div className="mt-1 font-mono text-lg font-bold text-rose-600 dark:text-rose-400">
                                    {formatEtb(historyData.summary.maxPrice)}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* History Table */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        {isLoadingHistory ? (
                            <div className="h-48 animate-pulse bg-card" />
                        ) : (historyData?.entries?.length ?? 0) === 0 ? (
                            <div className="p-10 text-center text-sm text-muted-foreground">
                                No recorded price updates for the selected date
                                range.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">
                                                Date &amp; Time
                                            </th>
                                            <th className="px-4 py-3">Item</th>
                                            <th className="px-4 py-3">
                                                Market
                                            </th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">
                                                Recorded By
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {historyData?.entries.map(entry => (
                                            <tr
                                                key={entry.id}
                                                className="hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                                                    {formatCalendarDateTime(
                                                        entry.recordedAt,
                                                        locale,
                                                        calendarMode,
                                                        true,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="font-semibold text-foreground text-xs sm:text-sm">
                                                        {entry.itemName}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {entry.categoryName} ·
                                                        per {entry.unitCode}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                                                    {entry.marketplaceName}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono font-bold text-foreground">
                                                    {formatEtb(entry.price)}
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                                    {entry.recordedByName ??
                                                        "System"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* TAB 2: ITEMS CATALOG */}
            {tab === "items" && caps?.canManageItems ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3">
                                        Category & Unit
                                    </th>
                                    <th className="px-4 py-3">Avg Price</th>
                                    <th className="px-4 py-3">Landing</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map(item => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {item.photoUrl ? (
                                                    <img
                                                        src={
                                                            filePublicUrl(
                                                                item.photoUrl,
                                                            ) ?? item.photoUrl
                                                        }
                                                        alt={item.name}
                                                        className="h-10 w-10 rounded-xl border border-border object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-primary-soft text-primary">
                                                        <ShoppingBasket className="h-4 w-4" />
                                                    </div>
                                                )}
                                                <div className="font-medium text-foreground">
                                                    {item.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            <div>{item.category.name}</div>
                                            <div>per {item.unit.label}</div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-foreground">
                                            {formatEtb(item.averagePrice)}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {item.isFeaturedOnLanding ? (
                                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-600">
                                                    Featured
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Standard
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {item.isActive ? (
                                                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-medium text-primary">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditItem(item)
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                                            >
                                                <Pencil className="h-3 w-3" />
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {/* TAB 3: TAXONOMY (MARKETPLACES, CATEGORIES, UNITS) */}
            {tab === "taxonomy" && caps?.canManageLocations ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Marketplaces */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <Store className="h-4 w-4 text-primary" />
                            Marketplaces (Gebeya)
                        </h3>
                        <form
                            onSubmit={handleAddMarketplace}
                            className="mt-3 space-y-2"
                        >
                            <input
                                type="text"
                                required
                                value={newMarketName}
                                onChange={e => setNewMarketName(e.target.value)}
                                placeholder="e.g. Atikilt Tera"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMarketArea}
                                    onChange={e =>
                                        setNewMarketArea(e.target.value)
                                    }
                                    placeholder="Area (optional)"
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                        <div className="mt-4 space-y-2">
                            {marketplaces.map(mp => (
                                <div
                                    key={mp.id}
                                    className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                >
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            {mp.name}
                                        </div>
                                        {mp.area ? (
                                            <div className="text-muted-foreground">
                                                {mp.area}
                                            </div>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateMarketplace({
                                                id: mp.id,
                                                isActive: !mp.isActive,
                                            })
                                        }
                                        className={`rounded-full px-2.5 py-0.5 font-medium ${
                                            mp.isActive
                                                ? "bg-emerald-500/10 text-emerald-600"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {mp.isActive ? "Active" : "Hidden"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <Tag className="h-4 w-4 text-primary" />
                            Categories
                        </h3>
                        <form
                            onSubmit={handleAddCategory}
                            className="mt-3 flex gap-2"
                        >
                            <input
                                type="text"
                                required
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                placeholder="e.g. Bakery & Yeast"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            />
                            <button
                                type="submit"
                                className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                                Add
                            </button>
                        </form>
                        <div className="mt-4 space-y-2">
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                >
                                    <span className="font-semibold text-foreground">
                                        {cat.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateCategory({
                                                id: cat.id,
                                                isActive: !cat.isActive,
                                            })
                                        }
                                        className={`rounded-full px-2.5 py-0.5 font-medium ${
                                            cat.isActive
                                                ? "bg-emerald-500/10 text-emerald-600"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {cat.isActive ? "Active" : "Hidden"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Units */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <Layers className="h-4 w-4 text-primary" />
                            Units
                        </h3>
                        <form
                            onSubmit={handleAddUnit}
                            className="mt-3 space-y-2"
                        >
                            <input
                                type="text"
                                required
                                value={newUnitCode}
                                onChange={e => setNewUnitCode(e.target.value)}
                                placeholder="Short code (e.g. kg, quintal)"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    value={newUnitLabel}
                                    onChange={e =>
                                        setNewUnitLabel(e.target.value)
                                    }
                                    placeholder="Label (e.g. Quintal (100 kg))"
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                        <div className="mt-4 space-y-2">
                            {units.map(u => (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                >
                                    <div>
                                        <span className="font-semibold text-foreground">
                                            {u.code}
                                        </span>{" "}
                                        <span className="text-muted-foreground">
                                            — {u.label}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateUnit({
                                                id: u.id,
                                                isActive: !u.isActive,
                                            })
                                        }
                                        className={`rounded-full px-2.5 py-0.5 font-medium ${
                                            u.isActive
                                                ? "bg-emerald-500/10 text-emerald-600"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {u.isActive ? "Active" : "Hidden"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* TAB 4: REPORTERS (SUPER ADMIN ONLY) */}
            {tab === "reporters" && caps?.isSuperAdmin ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Reporter</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">
                                        Access
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {!reporters || reporters.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No Market Reporters created yet.
                                        </td>
                                    </tr>
                                ) : (
                                    reporters.map(rep => (
                                        <tr
                                            key={rep.id}
                                            className="hover:bg-muted/20"
                                        >
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {rep.displayName}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-foreground">
                                                {rep.phone ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {rep.email ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 font-medium ${
                                                        rep.status === "ACTIVE"
                                                            ? "bg-emerald-500/10 text-emerald-600"
                                                            : "bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    {rep.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateReporterStatus({
                                                            id: rep.id,
                                                            status:
                                                                rep.status ===
                                                                "ACTIVE"
                                                                    ? "DISABLED"
                                                                    : "ACTIVE",
                                                        })
                                                    }
                                                    className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                                                >
                                                    {rep.status === "ACTIVE"
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {/* Add / Edit Item Sheet */}
            {itemSheetOpen ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setItemSheetOpen(false)}
                    />
                    <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-lg font-semibold text-foreground">
                                {editingItem
                                    ? "Edit Market Item"
                                    : "Add Market Item"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setItemSheetOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveItem}
                            className="flex flex-1 flex-col overflow-y-auto px-6 py-5"
                        >
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                                        Item Photo (Optional)
                                    </label>
                                    {itemPhotoUrl ? (
                                        <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-border bg-muted">
                                            <img
                                                src={
                                                    filePublicUrl(
                                                        itemPhotoUrl,
                                                    ) ?? itemPhotoUrl
                                                }
                                                alt="Item preview"
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-x-3 bottom-3 flex justify-end gap-2">
                                                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                                                    <Upload className="h-3.5 w-3.5" />
                                                    <span>Change</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={
                                                            isUploadingPhoto
                                                        }
                                                        onChange={
                                                            handlePhotoChange
                                                        }
                                                        className="hidden"
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setItemPhotoUrl("")
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-xl bg-rose-600/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center hover:border-primary/50">
                                            <Camera className="h-5 w-5 text-primary" />
                                            <span className="text-xs font-medium text-foreground">
                                                {isUploadingPhoto
                                                    ? "Uploading..."
                                                    : "Click to upload item photo"}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={isUploadingPhoto}
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={itemName}
                                        onChange={e =>
                                            setItemName(e.target.value)
                                        }
                                        placeholder="e.g. Red Onion"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Category *
                                        </label>
                                        <select
                                            required
                                            value={itemCatId}
                                            onChange={e =>
                                                setItemCatId(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        >
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Unit *
                                        </label>
                                        <select
                                            required
                                            value={itemUnitId}
                                            onChange={e =>
                                                setItemUnitId(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        >
                                            {units.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={itemDesc}
                                        onChange={e =>
                                            setItemDesc(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-4 pt-1">
                                    <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                                        <input
                                            type="checkbox"
                                            checked={itemFeatured}
                                            onChange={e =>
                                                setItemFeatured(
                                                    e.target.checked,
                                                )
                                            }
                                            className="h-4 w-4 rounded border-border"
                                        />
                                        Featured on Landing Page
                                    </label>
                                    {editingItem ? (
                                        <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={itemActive}
                                                onChange={e =>
                                                    setItemActive(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border"
                                            />
                                            Active
                                        </label>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={() => setItemSheetOpen(false)}
                                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingItem || isUpdatingItem}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                    {isCreatingItem || isUpdatingItem
                                        ? "Saving..."
                                        : "Save Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {/* Add Market Reporter Sheet */}
            {reporterSheetOpen ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setReporterSheetOpen(false)}
                    />
                    <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    Add Market Reporter
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Creates a restricted account for posting
                                    market prices.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReporterSheetOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateReporter}
                            className="flex flex-1 flex-col justify-between px-6 py-5"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={repName}
                                        onChange={e =>
                                            setRepName(e.target.value)
                                        }
                                        placeholder="e.g. Dawit Tadesse"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={repPhone}
                                        onChange={e =>
                                            setRepPhone(e.target.value)
                                        }
                                        placeholder="+2519..."
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={repEmail}
                                        onChange={e =>
                                            setRepEmail(e.target.value)
                                        }
                                        placeholder="reporter@domain.com"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Initial Password *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        minLength={4}
                                        value={repPassword}
                                        onChange={e =>
                                            setRepPassword(e.target.value)
                                        }
                                        placeholder="Minimum 4 characters"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={() => setReporterSheetOpen(false)}
                                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingReporter}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                    {isCreatingReporter
                                        ? "Creating..."
                                        : "Create Reporter"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
