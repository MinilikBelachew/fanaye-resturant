"use client";

import React, { use, useMemo, useState } from "react";
import {
    BellRing,
    Check,
    CheckCircle2,
    ChevronLeft,
    Clock,
    ExternalLink,
    Flame,
    Info,
    Leaf,
    Loader2,
    Minus,
    Plus,
    QrCode,
    Search,
    Send,
    ShoppingBag,
    Sparkles,
    Utensils,
    Wifi,
    X,
} from "lucide-react";
import {
    useGetPublicTableMenuQuery,
    useSubmitGuestOrderMutation,
    useSubmitServiceRequestMutation,
    PublicMenuItem,
    PublicModifierOption,
} from "@/context/services/qrMenuApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";

interface CartItem {
    cartId: string;
    item: PublicMenuItem;
    quantity: number;
    comment?: string;
    selectedOptions: PublicModifierOption[];
    totalPrice: number;
}

export default function GuestTableOrderingPage({
    params,
}: {
    params: Promise<{ slug: string; tableId: string }>;
}) {
    const { slug, tableId } = use(params);

    const { data, isLoading, error, refetch } = useGetPublicTableMenuQuery(
        { slug, tableId },
        { pollingInterval: 8000 },
    );

    const [submitOrder, { isLoading: isSubmittingOrder }] =
        useSubmitGuestOrderMutation();
    const [submitService, { isLoading: isSubmittingService }] =
        useSubmitServiceRequestMutation();

    // Search & Filters
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [selectedDiet, setSelectedDiet] = useState<string>("ALL");

    // Modals & Drawers
    const [customizingItem, setCustomizingItem] =
        useState<PublicMenuItem | null>(null);
    const [customizingQuantity, setCustomizingQuantity] = useState(1);
    const [customizingComment, setCustomizingComment] = useState("");
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [wifiModalOpen, setWifiModalOpen] = useState(false);
    const [customerCount, setCustomerCount] = useState(2);
    const [orderNotes, setOrderNotes] = useState("");

    // Local Cart State
    const [cart, setCart] = useState<CartItem[]>([]);

    const tenant = data?.tenant;
    const table = data?.table;
    const config = data?.config;
    const categories = data?.categories || [];
    const items = data?.items || [];
    const featured = data?.featuredItems || [];
    const activeSession = data?.activeSession;

    // Filtered menu items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory =
                activeCategory === "all" || item.categoryId === activeCategory;
            const matchesSearch =
                !search.trim() ||
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                (item.description &&
                    item.description
                        .toLowerCase()
                        .includes(search.toLowerCase()));

            let matchesDiet = true;
            if (selectedDiet === "FASTING") {
                matchesDiet =
                    item.badge === "FASTING" ||
                    item.name.toLowerCase().includes("fasting") ||
                    item.name.toLowerCase().includes("tsom") ||
                    item.name.toLowerCase().includes("shiro");
            } else if (selectedDiet === "VEGETARIAN") {
                matchesDiet =
                    item.badge === "VEGETARIAN" ||
                    item.name.toLowerCase().includes("salad") ||
                    item.name.toLowerCase().includes("veg");
            } else if (selectedDiet === "SPICY") {
                matchesDiet =
                    item.badge === "SPICY" ||
                    item.name.toLowerCase().includes("tibs") ||
                    item.name.toLowerCase().includes("spicy");
            } else if (selectedDiet === "CHEF_PICK") {
                matchesDiet = item.badge === "CHEF_PICK";
            }

            return matchesCategory && matchesSearch && matchesDiet;
        });
    }, [items, activeCategory, search, selectedDiet]);

    function handleItemClick(item: PublicMenuItem) {
        if (!config?.allowGuestOrders) return;
        setCustomizingItem(item);
        setCustomizingQuantity(1);
        setCustomizingComment("");

        const initialSelected: string[] = [];
        for (const group of item.modifierGroups) {
            if (group.required && group.options.length > 0) {
                initialSelected.push(group.options[0].id);
            }
        }
        setSelectedOptionIds(initialSelected);
    }

    function toggleModifierOption(
        groupId: string,
        optionId: string,
        maxSelections: number,
    ) {
        setSelectedOptionIds(prev => {
            const isSelected = prev.includes(optionId);
            if (isSelected) {
                return prev.filter(id => id !== optionId);
            }
            if (maxSelections === 1) {
                const groupOptionIds =
                    customizingItem?.modifierGroups
                        .find(g => g.id === groupId)
                        ?.options.map(o => o.id) || [];
                const filtered = prev.filter(
                    id => !groupOptionIds.includes(id),
                );
                return [...filtered, optionId];
            }
            return [...prev, optionId];
        });
    }

    const currentCustomizingPrice = useMemo(() => {
        if (!customizingItem) return 0;
        let base = Number(customizingItem.price) || 0;
        for (const group of customizingItem.modifierGroups) {
            for (const opt of group.options) {
                if (selectedOptionIds.includes(opt.id)) {
                    base += Number(opt.priceDelta) || 0;
                }
            }
        }
        return base * customizingQuantity;
    }, [customizingItem, selectedOptionIds, customizingQuantity]);

    function addToCart() {
        if (!customizingItem) return;

        const options: PublicModifierOption[] = [];
        for (const group of customizingItem.modifierGroups) {
            for (const opt of group.options) {
                if (selectedOptionIds.includes(opt.id)) {
                    options.push(opt);
                }
            }
        }

        const newItem: CartItem = {
            cartId: `${customizingItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            item: customizingItem,
            quantity: customizingQuantity,
            comment: customizingComment.trim() || undefined,
            selectedOptions: options,
            totalPrice: currentCustomizingPrice,
        };

        setCart(prev => [...prev, newItem]);
        setCustomizingItem(null);
        toast.success(
            `Added to cart`,
            `${customizingItem.name} (x${customizingQuantity})`,
        );
    }

    function removeFromCart(cartId: string) {
        setCart(prev => prev.filter(i => i.cartId !== cartId));
    }

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, i) => sum + i.totalPrice, 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((sum, i) => sum + i.quantity, 0);
    }, [cart]);

    async function handleSendOrder() {
        if (cart.length === 0) return;

        try {
            const payload = {
                items: cart.map(line => ({
                    menuItemId: line.item.id,
                    quantity: line.quantity,
                    comment: line.comment,
                    modifiers: line.selectedOptions.map(o => ({
                        modifierOptionId: o.id,
                    })),
                })),
                customerCount,
                notes: orderNotes.trim() || undefined,
            };

            const res = await submitOrder({
                slug,
                tableId,
                body: payload,
            }).unwrap();
            setCart([]);
            setCartOpen(false);
            toast.success(
                "Order sent to the kitchen!",
                `Estimated preparation time: ~${res.estimatedWaitMinutes} minutes`,
            );
            void refetch();
        } catch (err: any) {
            toast.error(
                err?.data?.message ||
                    "Failed to submit order. Please alert your waiter.",
            );
        }
    }

    async function handleServiceCall(
        type:
            | "CALL_WAITER"
            | "REQUEST_WATER"
            | "REQUEST_BILL"
            | "EXTRA_NAPKINS",
        paymentMethod?: "CASH" | "TELEBIRR",
    ) {
        try {
            await submitService({
                slug,
                tableId,
                body: { type, paymentMethod },
            }).unwrap();
            setServiceModalOpen(false);
            toast.success(
                type === "REQUEST_BILL"
                    ? "Bill requested"
                    : "Service alert sent",
                "Your waiter has been notified and is coming right over.",
            );
        } catch {
            toast.error(
                "Could not reach service desk. Please wave to your waiter.",
            );
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-white">
                <div className="relative flex size-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500">
                    <Loader2 className="size-8 animate-spin" />
                </div>
                <h2 className="text-base font-bold">
                    Connecting to Dining Floor…
                </h2>
                <p className="text-xs text-slate-400">
                    Loading digital table menu & kitchen status
                </p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center text-slate-800">
                <div className="flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Info className="size-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Table Not Found</h1>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm">
                        This QR code may have expired or is not configured for
                        dining service. Please request a printed menu from your
                        waiter.
                    </p>
                </div>
                <Button
                    onClick={() => void refetch()}
                    variant="outline"
                    className="text-xs"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-svh bg-slate-100/70 pb-32 text-slate-900 selection:bg-amber-500/30">
            {/* Central Responsive Shell: Bound on Tablet & Desktop */}
            <div className="mx-auto w-full max-w-4xl lg:max-w-5xl sm:px-4 sm:pt-4 md:pt-6">
                {/* Top Cover Banner */}
                <header className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden bg-slate-900 sm:rounded-3xl sm:shadow-lg sm:border sm:border-slate-200/50">
                    {config?.coverImageUrl ? (
                        <img
                            src={config.coverImageUrl}
                            alt="Restaurant Cover"
                            className="h-full w-full object-cover brightness-[0.65]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-amber-700 via-rose-700 to-slate-900 text-white">
                            <Sparkles className="size-12 animate-pulse" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    {/* Top Navbar */}
                    <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between z-10">
                        {/* Table Badge */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/15">
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{table?.displayName}</span>
                            {table?.locationName ? (
                                <span className="text-white/70">
                                    · {table.locationName}
                                </span>
                            ) : null}
                        </div>

                        {/* Wi-Fi & Bell Actions */}
                        <div className="flex items-center gap-2">
                            {config?.wifiSsid ? (
                                <button
                                    onClick={() => setWifiModalOpen(true)}
                                    className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                                    title="View Guest Wi-Fi"
                                >
                                    <Wifi className="size-4" />
                                </button>
                            ) : null}

                            <button
                                onClick={() => setServiceModalOpen(true)}
                                className="flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md active:scale-95 transition-all"
                            >
                                <BellRing className="size-3.5" />
                                <span>Service</span>
                            </button>
                        </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="size-3.5" />
                            <span>{tenant?.name}</span>
                        </div>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight drop-shadow-sm">
                            {config?.welcomeMessage || "Dine-In Menu"}
                        </h1>
                        <p className="mt-0.5 text-xs sm:text-sm text-white/80 line-clamp-1 max-w-xl">
                            {config?.subtitle ||
                                "Tap any dish to customize & order directly from your table"}
                        </p>
                    </div>
                </header>

                {/* Active Table Order Status (if existing orders) */}
                {activeSession && activeSession.items.length > 0 ? (
                    <section className="mx-4 sm:mx-0 mt-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold">
                                <Clock className="size-4 text-amber-600 animate-spin" />
                                <span>
                                    Table {table?.displayNumber || ""} Active
                                    Order
                                </span>
                            </div>
                            <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                                {activeSession.status}
                            </span>
                        </div>
                        <div className="mt-2.5 space-y-1 text-[11px] text-slate-700">
                            {activeSession.items.slice(0, 3).map(line => (
                                <div
                                    key={line.id}
                                    className="flex items-center justify-between"
                                >
                                    <span>
                                        {line.quantity}x {line.name}
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        {line.state.replace(/_/g, " ")}
                                    </span>
                                </div>
                            ))}
                            {activeSession.items.length > 3 ? (
                                <p className="text-[10px] text-slate-500 pt-0.5">
                                    + {activeSession.items.length - 3} more
                                    item(s) in kitchen
                                </p>
                            ) : null}
                        </div>
                    </section>
                ) : null}

                {/* Search Input */}
                <div className="px-4 sm:px-0 pt-3.5">
                    <div className="relative flex items-center">
                        <Search className="pointer-events-none absolute left-3.5 size-4 text-slate-400" />
                        <Input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search tibs, buna, pasta, cocktails…"
                            className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pr-4 pl-10 text-xs sm:text-sm shadow-xs placeholder:text-slate-400 focus-visible:ring-amber-500"
                        />
                        {search ? (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Dietary Filter Pills */}
                <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pt-3 pb-1 scrollbar-none">
                    {[
                        { id: "ALL", label: "All Items" },
                        { id: "FASTING", label: "ፆም Fasting" },
                        { id: "VEGETARIAN", label: "🥗 Vegetarian" },
                        { id: "SPICY", label: "🌶️ Spicy" },
                        { id: "CHEF_PICK", label: "⭐ Chef's Picks" },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedDiet(filter.id)}
                            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                selectedDiet === filter.id
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Featured / Chef's Highlights */}
                {featured.length > 0 && !search && selectedDiet === "ALL" ? (
                    <section className="mt-5 px-4 sm:px-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-amber-500" />
                                Chef&apos;s Recommendations
                            </h2>
                            <span className="text-[11px] font-semibold text-amber-600">
                                Must Try
                            </span>
                        </div>

                        <div className="mt-2.5 flex gap-3.5 overflow-x-auto pb-2 scrollbar-none">
                            {featured.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className="flex-shrink-0 w-44 sm:w-48 cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs transition-all hover:shadow-md hover:border-amber-400/60 active:scale-95"
                                >
                                    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-100">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xl text-slate-300">
                                                🍽️
                                            </div>
                                        )}
                                        <span className="absolute top-1.5 left-1.5 rounded-md bg-amber-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                            Special
                                        </span>
                                    </div>
                                    <h3 className="mt-2 text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {item.name}
                                    </h3>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-bold text-amber-600">
                                            {formatEtb(Number(item.price))}
                                        </span>
                                        {config?.allowGuestOrders ? (
                                            <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs hover:bg-amber-600 transition-colors">
                                                <Plus className="size-3.5" />
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* Sticky Category Tabs */}
                <div className="sticky top-2 z-20 mt-4 mx-4 sm:mx-0 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-md shadow-xs scrollbar-none">
                    <button
                        onClick={() => setActiveCategory("all")}
                        className={`flex-shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                            activeCategory === "all"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        All ({items.length})
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex-shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                                activeCategory === cat.id
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {cat.name} ({cat.itemsCount})
                        </button>
                    ))}
                </div>

                {/* Menu Item Cards: Responsive 2-Column Grid on Tablet & Big Screens! */}
                <main className="mt-4 px-4 sm:px-0">
                    {filteredItems.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white py-12 px-6 text-center shadow-xs">
                            <div className="text-3xl">🍲</div>
                            <h3 className="mt-2 text-sm font-bold text-slate-800">
                                No dishes found
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Try adjusting your search terms or dietary
                                filters.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className="flex cursor-pointer items-center gap-3.5 rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:shadow-md hover:border-amber-400/60 active:scale-[0.99] group"
                                >
                                    <div className="relative size-20 sm:size-24 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
                                                🍲
                                            </div>
                                        )}
                                        {item.badge ? (
                                            <span className="absolute top-1.5 left-1.5 rounded-md bg-slate-900/85 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-xs">
                                                {item.badge}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                                                {item.name}
                                            </h3>
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                            {item.description ||
                                                "Crafted fresh with premium ingredients"}
                                        </p>
                                        <div className="mt-2.5 flex items-center justify-between">
                                            <span className="text-sm sm:text-base font-extrabold text-slate-900">
                                                {formatEtb(Number(item.price))}
                                            </span>
                                            {config?.allowGuestOrders ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-500/20 group-hover:bg-amber-100 transition-colors">
                                                    <Plus className="size-3.5" />
                                                    Add
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Floating Bottom Cart Bar */}
            {cart.length > 0 ? (
                <div className="fixed bottom-5 left-4 right-4 z-40 max-w-md md:max-w-lg mx-auto">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="flex w-full items-center justify-between rounded-full bg-slate-950 px-6 py-4 text-white shadow-2xl ring-1 ring-white/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950">
                                {cartItemCount}
                            </span>
                            <span className="text-sm font-bold">
                                Review Order
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-base font-extrabold text-amber-400">
                                {formatEtb(cartTotal)}
                            </span>
                            <ShoppingBag className="size-5 text-white/80" />
                        </div>
                    </button>
                </div>
            ) : null}

            {/* Item Customization & Modifier Modal */}
            {customizingItem ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
                    <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-[32px] sm:rounded-[32px] bg-white p-6 shadow-2xl overflow-y-auto">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    {customizingItem.name}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {customizingItem.description ||
                                        "Customize your order"}
                                </p>
                            </div>
                            <button
                                onClick={() => setCustomizingItem(null)}
                                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Modifier Groups */}
                        <div className="mt-4 space-y-4 divide-y divide-slate-100">
                            {customizingItem.modifierGroups.map(group => (
                                <div key={group.id} className="pt-3 first:pt-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-900">
                                            {group.name}
                                        </h4>
                                        <span className="text-[10px] font-semibold text-slate-400">
                                            {group.required
                                                ? "Required"
                                                : `Optional (Max ${group.maxSelections})`}
                                        </span>
                                    </div>

                                    <div className="mt-2 space-y-1.5">
                                        {group.options.map(option => {
                                            const isSelected =
                                                selectedOptionIds.includes(
                                                    option.id,
                                                );
                                            return (
                                                <div
                                                    key={option.id}
                                                    onClick={() =>
                                                        toggleModifierOption(
                                                            group.id,
                                                            option.id,
                                                            group.maxSelections,
                                                        )
                                                    }
                                                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition-colors ${
                                                        isSelected
                                                            ? "border-amber-500 bg-amber-500/10 text-amber-950 font-semibold"
                                                            : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`flex size-4 items-center justify-center rounded-full border ${
                                                                isSelected
                                                                    ? "border-amber-600 bg-amber-600 text-white"
                                                                    : "border-slate-300"
                                                            }`}
                                                        >
                                                            {isSelected ? (
                                                                <Check className="size-2.5 stroke-[3]" />
                                                            ) : null}
                                                        </span>
                                                        <span>
                                                            {option.name}
                                                        </span>
                                                    </div>
                                                    {Number(option.priceDelta) >
                                                    0 ? (
                                                        <span className="text-[11px] font-bold text-amber-600">
                                                            +
                                                            {formatEtb(
                                                                Number(
                                                                    option.priceDelta,
                                                                ),
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">
                                                            Free
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Special Instructions */}
                            <div className="pt-3">
                                <label className="text-xs font-bold text-slate-900">
                                    Special Instructions
                                </label>
                                <Input
                                    value={customizingComment}
                                    onChange={e =>
                                        setCustomizingComment(e.target.value)
                                    }
                                    placeholder="e.g. Mitmita on the side, extra ice, no onions…"
                                    className="mt-1.5 text-xs"
                                />
                            </div>

                            {/* Quantity Selector */}
                            <div className="pt-4 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                    Quantity
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            setCustomizingQuantity(q =>
                                                Math.max(1, q - 1),
                                            )
                                        }
                                        className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                                    >
                                        <Minus className="size-3.5" />
                                    </button>
                                    <span className="w-5 text-center text-sm font-black text-slate-900">
                                        {customizingQuantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setCustomizingQuantity(q => q + 1)
                                        }
                                        className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                                    >
                                        <Plus className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="mt-6">
                            <Button
                                onClick={addToCart}
                                className="w-full gap-2 rounded-2xl bg-amber-600 py-6 text-sm font-bold text-white hover:bg-amber-700 shadow-md"
                            >
                                <span>Add to Order</span>
                                <span>·</span>
                                <span>
                                    {formatEtb(currentCustomizingPrice)}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Cart Review Drawer / Modal */}
            {cartOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
                    <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-[32px] sm:rounded-[32px] bg-white p-6 shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <ShoppingBag className="size-5 text-amber-600" />
                                    Your Table Order
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {table?.displayName} · Ready to send to the
                                    kitchen
                                </p>
                            </div>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">
                                Your cart is empty.
                            </div>
                        ) : (
                            <div className="mt-3 space-y-3 divide-y divide-slate-100">
                                {cart.map(line => (
                                    <div
                                        key={line.cartId}
                                        className="pt-3 first:pt-0 flex items-start justify-between gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900">
                                                {line.quantity}x{" "}
                                                {line.item.name}
                                            </h4>
                                            {line.selectedOptions.length > 0 ? (
                                                <p className="text-[11px] text-slate-500">
                                                    {line.selectedOptions
                                                        .map(o => o.name)
                                                        .join(", ")}
                                                </p>
                                            ) : null}
                                            {line.comment ? (
                                                <p className="text-[10px] italic text-amber-700">
                                                    Note: &ldquo;{line.comment}
                                                    &rdquo;
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs font-bold text-slate-900">
                                                {formatEtb(line.totalPrice)}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    removeFromCart(line.cartId)
                                                }
                                                className="text-slate-400 hover:text-rose-600"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Diners Count & General Note */}
                                <div className="pt-3 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">
                                            Guests at table:
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 4, 6, 8].map(count => (
                                                <button
                                                    key={count}
                                                    onClick={() =>
                                                        setCustomerCount(count)
                                                    }
                                                    className={`size-6 rounded-full text-[11px] font-bold ${
                                                        customerCount === count
                                                            ? "bg-slate-900 text-white"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {count}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">
                                            Table Note (Optional)
                                        </label>
                                        <Input
                                            value={orderNotes}
                                            onChange={e =>
                                                setOrderNotes(e.target.value)
                                            }
                                            placeholder="e.g. Please bring drinks first, extra glasses…"
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Total & Submit Button */}
                                <div className="pt-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm font-black text-slate-900">
                                        <span>Order Total</span>
                                        <span className="text-amber-600 text-base">
                                            {formatEtb(cartTotal)}
                                        </span>
                                    </div>

                                    <Button
                                        onClick={handleSendOrder}
                                        disabled={isSubmittingOrder}
                                        className="w-full gap-2 rounded-2xl bg-slate-900 py-6 text-sm font-bold text-white hover:bg-slate-800 shadow-xl"
                                    >
                                        {isSubmittingOrder ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Send className="size-4 text-amber-400" />
                                        )}
                                        <span>Send Order to Kitchen</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Service Bell Modal */}
            {serviceModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <BellRing className="size-4 text-amber-600" />
                                    Call Waiter & Service
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Need assistance? We will alert your
                                    table&apos;s waiter instantly.
                                </p>
                            </div>
                            <button
                                onClick={() => setServiceModalOpen(false)}
                                className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-2">
                            <button
                                disabled={isSubmittingService}
                                onClick={() => handleServiceCall("CALL_WAITER")}
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left text-xs font-bold text-slate-900 hover:bg-slate-50 active:scale-98 transition-transform"
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className="text-base">🙋</span>
                                    <span>Call Waiter to Table</span>
                                </span>
                                <Check className="size-4 text-slate-400" />
                            </button>

                            <button
                                disabled={isSubmittingService}
                                onClick={() =>
                                    handleServiceCall("REQUEST_WATER")
                                }
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left text-xs font-bold text-slate-900 hover:bg-slate-50 active:scale-98 transition-transform"
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className="text-base">💧</span>
                                    <span>Bring Cold Water & Napkins</span>
                                </span>
                                <Check className="size-4 text-slate-400" />
                            </button>

                            <button
                                disabled={isSubmittingService}
                                onClick={() =>
                                    handleServiceCall(
                                        "REQUEST_BILL",
                                        "TELEBIRR",
                                    )
                                }
                                className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-500/10 p-3.5 text-left text-xs font-bold text-amber-950 hover:bg-amber-500/20 active:scale-98 transition-transform"
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className="text-base">📱</span>
                                    <span>Request Bill · Pay Telebirr</span>
                                </span>
                                <Check className="size-4 text-amber-600" />
                            </button>

                            <button
                                disabled={isSubmittingService}
                                onClick={() =>
                                    handleServiceCall("REQUEST_BILL", "CASH")
                                }
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left text-xs font-bold text-slate-900 hover:bg-slate-50 active:scale-98 transition-transform"
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className="text-base">💵</span>
                                    <span>Request Bill · Pay Cash</span>
                                </span>
                                <Check className="size-4 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Guest Wi-Fi Modal */}
            {wifiModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600">
                            <Wifi className="size-6" />
                        </div>
                        <h3 className="mt-3 text-base font-black text-slate-900">
                            Guest Wi-Fi
                        </h3>
                        <div className="mt-4 rounded-2xl bg-slate-100 p-3.5 text-xs text-slate-800 space-y-1.5">
                            <div>
                                <span className="text-slate-400 block text-[10px]">
                                    Network Name
                                </span>
                                <span className="font-bold text-sm text-slate-900">
                                    {config?.wifiSsid}
                                </span>
                            </div>
                            {config?.wifiPassword ? (
                                <div className="pt-1 border-t border-slate-200">
                                    <span className="text-slate-400 block text-[10px]">
                                        Password
                                    </span>
                                    <code className="font-mono font-bold text-amber-700 text-sm">
                                        {config.wifiPassword}
                                    </code>
                                </div>
                            ) : (
                                <span className="text-[11px] text-emerald-600 font-semibold">
                                    No password required
                                </span>
                            )}
                        </div>
                        <Button
                            onClick={() => setWifiModalOpen(false)}
                            className="mt-4 w-full rounded-xl bg-slate-900 text-xs font-bold text-white"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
