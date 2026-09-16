"use client";

import React, { useState } from "react";
import {
    BellRing,
    Flame,
    Leaf,
    Plus,
    Search,
    Sparkles,
    Wifi,
} from "lucide-react";
import { QrMenuConfig } from "@/context/services/qrMenuApi";
import { MenuItem } from "@/domains/catalog/domain/menu";
import { formatEtb } from "@/lib/money";

interface LivePhoneSimulatorProps {
    config: QrMenuConfig;
    menuItems: MenuItem[];
    tableName?: string;
    restaurantName?: string;
}

export const LivePhoneSimulator: React.FC<LivePhoneSimulatorProps> = ({
    config,
    menuItems,
    tableName = "Table 4 · Rooftop Terrace",
    restaurantName = "Fanaye Lounge & Grill",
}) => {
    const [activeTab, setActiveTab] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [selectedDiet, setSelectedDiet] = useState<string>("ALL");

    const featured = menuItems.filter(i =>
        (config.featuredItemIds ?? []).includes(i.id),
    );
    const displayFeatured =
        featured.length > 0 ? featured : menuItems.slice(0, 3);

    const categories = Array.from(
        new Set(menuItems.map(i => i.category || "Main Menu")),
    );

    const filteredItems = menuItems.filter(item => {
        const matchesCategory =
            activeTab === "all" || item.category === activeTab;
        const matchesSearch =
            !search ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description &&
                item.description.toLowerCase().includes(search.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="relative mx-auto flex h-[720px] w-[340px] flex-col overflow-hidden rounded-[44px] border-[10px] border-slate-900 bg-slate-950 shadow-2xl ring-1 ring-slate-900/10">
            {/* Top Notch / Dynamic Island */}
            <div className="absolute top-2 left-1/2 z-50 flex h-4 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-black">
                <div className="size-2.5 rounded-full bg-slate-900/80 mr-2" />
                <div className="size-2 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>

            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 scrollbar-none">
                {/* Cover Hero Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                    {config.coverImageUrl ? (
                        <img
                            src={config.coverImageUrl}
                            alt="Restaurant banner"
                            className="h-full w-full object-cover brightness-75"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-amber-600 to-rose-600 text-white">
                            <Sparkles className="size-8 animate-pulse" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Table Badge & Service Bell */}
                    <div className="absolute top-8 left-4 right-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                            <span className="size-2 rounded-full bg-emerald-400" />
                            {tableName}
                        </span>
                        <button className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                            <BellRing className="size-4" />
                        </button>
                    </div>

                    {/* Restaurant Title & Subtitle */}
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h2 className="text-base font-bold leading-tight drop-shadow-sm">
                            {config.welcomeMessage || restaurantName}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-white/80 line-clamp-1">
                            {config.subtitle ||
                                "Dine-in menu & mobile ordering"}
                        </p>
                    </div>
                </div>

                {/* Wi-Fi Info Banner */}
                {config.wifiSsid ? (
                    <div className="mx-3 mt-2.5 flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 text-[11px] text-amber-900">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Wifi className="size-3.5 text-amber-600" />
                            WiFi:{" "}
                            <span className="font-bold">{config.wifiSsid}</span>
                        </span>
                        {config.wifiPassword ? (
                            <span className="text-[10px] text-amber-700">
                                Pass:{" "}
                                <code className="font-mono">
                                    {config.wifiPassword}
                                </code>
                            </span>
                        ) : null}
                    </div>
                ) : null}

                {/* Search Input */}
                <div className="px-3 pt-3">
                    <div className="relative flex items-center">
                        <Search className="absolute left-2.5 size-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search dishes, drinks, desserts…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                </div>

                {/* Dietary Filters */}
                <div className="flex gap-1.5 overflow-x-auto px-3 pt-2.5 scrollbar-none text-[11px]">
                    {["ALL", "FASTING", "VEGETARIAN", "SPICY"].map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedDiet(tag)}
                            className={`flex-shrink-0 rounded-full px-2.5 py-1 font-medium transition-colors ${
                                selectedDiet === tag
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-200/80 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {tag === "ALL" && "All"}
                            {tag === "FASTING" && "ፆም Fasting"}
                            {tag === "VEGETARIAN" && "🥗 Vegetarian"}
                            {tag === "SPICY" && "🌶️ Spicy"}
                        </button>
                    ))}
                </div>

                {/* Chef's Recommendations Carousel */}
                {displayFeatured.length > 0 ? (
                    <div className="mt-3 px-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[12px] font-bold tracking-tight text-slate-900 flex items-center gap-1">
                                <Sparkles className="size-3 text-amber-500" />
                                Chef&apos;s Highlights
                            </h3>
                            <span className="text-[10px] font-medium text-amber-600">
                                Must Try
                            </span>
                        </div>

                        <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                            {displayFeatured.map(item => (
                                <div
                                    key={item.id}
                                    className="flex-shrink-0 w-36 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs"
                                >
                                    <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-100">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                                                No Photo
                                            </div>
                                        )}
                                        <span className="absolute top-1 left-1 rounded-md bg-amber-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                            Special
                                        </span>
                                    </div>
                                    <h4 className="mt-1.5 text-[11px] font-semibold text-slate-900 truncate">
                                        {item.name}
                                    </h4>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-amber-600">
                                            {formatEtb(Number(item.price))}
                                        </span>
                                        <button className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-white">
                                            <Plus className="size-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Category Tabs */}
                <div className="sticky top-0 z-30 mt-3 flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50/95 px-3 py-2 backdrop-blur-md scrollbar-none">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`flex-shrink-0 text-[11px] font-semibold pb-1 transition-colors ${
                            activeTab === "all"
                                ? "border-b-2 border-amber-600 text-amber-600"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        All Menu
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`flex-shrink-0 text-[11px] font-semibold pb-1 transition-colors ${
                                activeTab === cat
                                    ? "border-b-2 border-amber-600 text-amber-600"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Menu Items List */}
                <div className="p-3 space-y-2.5 pb-20">
                    {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-[12px] text-slate-400">
                            No menu items match your search.
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs transition-shadow hover:shadow-sm"
                            >
                                <div className="relative size-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-400">
                                            🍽️
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <h4 className="text-[12px] font-bold text-slate-900 truncate">
                                            {item.name}
                                        </h4>
                                        {item.name
                                            .toLowerCase()
                                            .includes("spicy") ||
                                        item.name
                                            .toLowerCase()
                                            .includes("tibs") ? (
                                            <Flame className="size-3 text-rose-500 flex-shrink-0" />
                                        ) : null}
                                        {item.name
                                            .toLowerCase()
                                            .includes("salad") ||
                                        item.name
                                            .toLowerCase()
                                            .includes("veg") ? (
                                            <Leaf className="size-3 text-emerald-500 flex-shrink-0" />
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-1">
                                        {item.description ||
                                            "Freshly prepared to order"}
                                    </p>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-900">
                                            {formatEtb(Number(item.price))}
                                        </span>
                                        <button className="flex size-5 items-center justify-center rounded-full bg-amber-600 text-white shadow-xs">
                                            <Plus className="size-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Floating Bottom Cart Bar */}
            <div className="absolute bottom-3 left-3 right-3 z-40">
                <button className="flex w-full items-center justify-between rounded-2xl bg-slate-900 px-4 py-2.5 text-white shadow-lg transition-transform active:scale-95">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                            2
                        </span>
                        <span>View Cart</span>
                    </div>
                    <span className="text-xs font-bold text-amber-400">
                        {formatEtb(470)}
                    </span>
                </button>
            </div>

            {/* Home Indicator Bar */}
            <div className="absolute bottom-1 left-1/2 z-50 h-1 w-28 -translate-x-1/2 rounded-full bg-slate-400/40" />
        </div>
    );
};
