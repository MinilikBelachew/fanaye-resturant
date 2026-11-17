"use client";

import { useMemo, useState } from "react";
import { Search, UtensilsCrossed } from "lucide-react";
import type { PublicMenuItem } from "@/context/services/siteApi";
import {
    filePublicUrl,
    imageForDish,
} from "@/domains/catalog/application/mapAdminMenu";

import type { MenuLayoutMode } from "./restaurantTemplates";

export type MenuExplorerVariant =
    | "cards"
    | "cream"
    | "dark"
    | "editorial"
    | "grid-bold";

export default function SiteMenuExplorer({
    items,
    accentColor,
    variant = "cards",
    layout,
    title = "Our Menu",
    subtitle,
}: {
    items: PublicMenuItem[];
    accentColor: string;
    variant?: MenuExplorerVariant;
    layout?: MenuLayoutMode;
    title?: string;
    subtitle?: string;
}) {
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [query, setQuery] = useState("");

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const item of items) {
            if (item.categoryName) set.add(item.categoryName);
        }
        return ["All", ...Array.from(set)];
    }, [items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter(item => {
            if (
                activeCategory !== "All" &&
                item.categoryName !== activeCategory
            ) {
                return false;
            }
            if (q) {
                const matchName = item.name.toLowerCase().includes(q);
                const matchDesc = (item.description || "")
                    .toLowerCase()
                    .includes(q);
                return matchName || matchDesc;
            }
            return true;
        });
    }, [items, activeCategory, query]);

    const isDark = variant === "dark";
    const isCream = variant === "cream";
    const effectiveLayout: MenuLayoutMode =
        layout ?? (variant === "editorial" ? "editorial" : "cards");
    const isEditorial = effectiveLayout === "editorial";
    const isGrouped = effectiveLayout === "grouped";
    const isShowcase = effectiveLayout === "showcase";

    const groupedByCategory = useMemo(() => {
        const map = new Map<string, PublicMenuItem[]>();
        for (const item of filtered) {
            const cat = item.categoryName || "Menu";
            const arr = map.get(cat) ?? [];
            arr.push(item);
            map.set(cat, arr);
        }
        return Array.from(map.entries());
    }, [filtered]);

    return (
        <section
            id="menu"
            className="@container mx-auto max-w-6xl px-4 @sm:px-6 py-10 @sm:py-20"
        >
            <div className="flex flex-col @sm:flex-row @sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p
                        className="text-xs font-bold uppercase tracking-[0.2em]"
                        style={{ color: accentColor }}
                    >
                        Menu
                    </p>
                    <h2
                        className={`mt-1.5 text-2xl @sm:text-4xl font-bold tracking-tight ${
                            isDark ? "text-white" : "text-stone-900"
                        }`}
                    >
                        {title}
                    </h2>
                    {subtitle ? (
                        <p
                            className={`mt-2 text-sm max-w-xl ${
                                isDark ? "text-slate-400" : "text-stone-600"
                            }`}
                        >
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {/* Search */}
                <div className="relative w-full @sm:w-64">
                    <Search
                        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 ${
                            isDark ? "text-slate-400" : "text-stone-400"
                        }`}
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search dishes..."
                        className={`w-full rounded-full border pl-9 pr-4 py-2 text-sm outline-none transition ${
                            isDark
                                ? "border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:border-white/40"
                                : isCream
                                  ? "border-[#362013]/15 bg-[#EFE7DA]/75 text-[#362013] placeholder:text-[#362013]/45 focus:border-[#362013]/40"
                                  : "border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:border-stone-400"
                        }`}
                    />
                </div>
            </div>

            {/* Category Pills */}
            {categories.length > 1 ? (
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map(cat => {
                        const active = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                    active
                                        ? isCream
                                            ? "text-white"
                                            : "text-white shadow-sm"
                                        : isDark
                                          ? "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                                          : isCream
                                            ? "border border-[#362013]/15 bg-[#EFE7DA]/75 text-[#362013] hover:bg-[#E7DAC7]"
                                            : "border border-stone-200 bg-white/80 text-stone-700 hover:bg-stone-100"
                                }`}
                                style={
                                    active
                                        ? { backgroundColor: accentColor }
                                        : undefined
                                }
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            ) : null}

            {/* Empty state */}
            {filtered.length === 0 ? (
                <div
                    className={`rounded-2xl border p-10 text-center ${
                        isDark
                            ? "border-white/10 bg-white/5 text-slate-400"
                            : "border-stone-200 bg-white/70 text-stone-500"
                    }`}
                >
                    <UtensilsCrossed className="mx-auto size-7 opacity-40 mb-2" />
                    <p className="text-sm font-medium">
                        {items.length === 0
                            ? "Menu items added in your POS will appear here automatically."
                            : "No dishes match your filter."}
                    </p>
                </div>
            ) : isGrouped ? (
                /* Grouped by Category (Printed Restaurant Menu style) */
                <div className="space-y-10">
                    {groupedByCategory.map(([catName, catItems]) => (
                        <div key={catName} className="space-y-4">
                            <div
                                className={`flex items-baseline justify-between border-b pb-2 ${
                                    isDark
                                        ? "border-white/15"
                                        : isCream
                                          ? "border-[#362013]/20"
                                          : "border-stone-200"
                                }`}
                            >
                                <h3
                                    className={`text-xl font-black uppercase tracking-tight ${
                                        isDark
                                            ? "text-white"
                                            : isCream
                                              ? "text-[#362013]"
                                              : "text-stone-900"
                                    }`}
                                >
                                    {catName}
                                </h3>
                                <span
                                    className="text-xs font-bold uppercase tracking-widest"
                                    style={{ color: accentColor }}
                                >
                                    {catItems.length}{" "}
                                    {catItems.length === 1 ? "item" : "items"}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                                {catItems.map(item => {
                                    const imgSrc =
                                        filePublicUrl(item.imageUrl) ||
                                        item.imageUrl ||
                                        imageForDish(item.name);
                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-4 rounded-2xl border p-3.5 ${
                                                isDark
                                                    ? "border-white/10 bg-white/[0.04]"
                                                    : isCream
                                                      ? "border-[#362013]/12 bg-[#EFE7DA]/70"
                                                      : "border-stone-200 bg-white"
                                            }`}
                                        >
                                            {imgSrc ? (
                                                <img
                                                    src={imgSrc}
                                                    alt={item.name}
                                                    className="size-16 rounded-xl object-cover shrink-0"
                                                />
                                            ) : null}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <h4
                                                        className={`text-sm font-bold truncate ${
                                                            isDark
                                                                ? "text-white"
                                                                : isCream
                                                                  ? "text-[#362013]"
                                                                  : "text-stone-900"
                                                        }`}
                                                    >
                                                        {item.name}
                                                    </h4>
                                                    <span
                                                        className="text-xs font-extrabold shrink-0"
                                                        style={{
                                                            color: accentColor,
                                                        }}
                                                    >
                                                        {item.price.toLocaleString()}{" "}
                                                        {item.currencyCode}
                                                    </span>
                                                </div>
                                                {item.description ? (
                                                    <p
                                                        className={`mt-1 text-xs line-clamp-2 ${
                                                            isDark
                                                                ? "text-slate-400"
                                                                : "text-[#362013]/70"
                                                        }`}
                                                    >
                                                        {item.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : isShowcase ? (
                /* Showcase: Top 2 Featured Split Cards + Compact 2-Column List */
                <div className="space-y-8">
                    <div className="grid grid-cols-1 @md:grid-cols-2 gap-5">
                        {filtered.slice(0, 2).map(item => {
                            const imgSrc =
                                filePublicUrl(item.imageUrl) ||
                                item.imageUrl ||
                                imageForDish(item.name);
                            return (
                                <div
                                    key={item.id}
                                    className={`grid grid-cols-1 @sm:grid-cols-12 overflow-hidden rounded-3xl border ${
                                        isDark
                                            ? "border-white/15 bg-white/[0.05]"
                                            : isCream
                                              ? "border-[#362013]/15 bg-[#EFE7DA]"
                                              : "border-stone-200 bg-white"
                                    }`}
                                >
                                    {imgSrc ? (
                                        <div className="@sm:col-span-5 h-44 @sm:h-full bg-[#E3D6C3]">
                                            <img
                                                src={imgSrc}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : null}
                                    <div className="@sm:col-span-7 p-5 flex flex-col justify-between gap-3">
                                        <div>
                                            <span
                                                className="text-[10px] font-extrabold uppercase tracking-widest"
                                                style={{ color: accentColor }}
                                            >
                                                Chef Highlight ·{" "}
                                                {item.categoryName}
                                            </span>
                                            <h4
                                                className={`mt-1 text-lg font-black uppercase tracking-tight ${
                                                    isDark
                                                        ? "text-white"
                                                        : isCream
                                                          ? "text-[#362013]"
                                                          : "text-stone-900"
                                                }`}
                                            >
                                                {item.name}
                                            </h4>
                                            {item.description ? (
                                                <p className="mt-1.5 text-xs opacity-75 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            ) : null}
                                        </div>
                                        <span
                                            className="self-start rounded-full px-3 py-1 text-xs font-bold text-white"
                                            style={{
                                                backgroundColor: accentColor,
                                            }}
                                        >
                                            {item.price.toLocaleString()}{" "}
                                            {item.currencyCode}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length > 2 ? (
                        <div className="grid grid-cols-1 @md:grid-cols-2 gap-x-10 gap-y-4 pt-2">
                            {filtered.slice(2).map(item => (
                                <div
                                    key={item.id}
                                    className={`flex items-baseline justify-between gap-4 border-b pb-3 ${
                                        isDark
                                            ? "border-white/10"
                                            : isCream
                                              ? "border-[#362013]/15"
                                              : "border-stone-200"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold truncate">
                                            {item.name}
                                        </h4>
                                        {item.description ? (
                                            <p className="text-xs opacity-70 truncate">
                                                {item.description}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span
                                        className="text-sm font-bold shrink-0"
                                        style={{ color: accentColor }}
                                    >
                                        {item.price.toLocaleString()}{" "}
                                        {item.currencyCode}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : isEditorial ? (
                /* Editorial 2-column list (Coffee House & Fine Bistro) */
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-x-10 gap-y-5">
                    {filtered.map(item => {
                        const imgSrc =
                            filePublicUrl(item.imageUrl) ||
                            item.imageUrl ||
                            imageForDish(item.name);
                        return (
                            <div
                                key={item.id}
                                className="flex items-start gap-4 border-b border-stone-200/80 pb-4"
                            >
                                {imgSrc ? (
                                    <img
                                        src={imgSrc}
                                        alt={item.name}
                                        className="size-16 rounded-xl object-cover shrink-0 border border-stone-200"
                                    />
                                ) : null}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <h3 className="text-base font-semibold text-stone-900 truncate">
                                            {item.name}
                                        </h3>
                                        <span
                                            className="text-sm font-bold shrink-0"
                                            style={{ color: accentColor }}
                                        >
                                            {item.price.toLocaleString()}{" "}
                                            {item.currencyCode}
                                        </span>
                                    </div>
                                    {item.description ? (
                                        <p className="mt-1 text-xs text-stone-600 line-clamp-2">
                                            {item.description}
                                        </p>
                                    ) : null}
                                    {item.soldOut ? (
                                        <span className="mt-1.5 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                            Sold Out
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Photo Cards Grid (Modern Bistro, Dark Steakhouse, Fast Casual) */
                <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 @sm:gap-5">
                    {filtered.map(item => {
                        const imgSrc =
                            filePublicUrl(item.imageUrl) ||
                            item.imageUrl ||
                            imageForDish(item.name);
                        return (
                            <div
                                key={item.id}
                                className={`group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 ${
                                    isDark
                                        ? "border-white/10 bg-white/[0.04] hover:border-white/25"
                                        : isCream
                                          ? "border-[#362013]/15 bg-[#EFE7DA]/75 hover:bg-[#EFE7DA]"
                                          : "border-stone-200 bg-white shadow-xs hover:shadow-md"
                                }`}
                            >
                                {imgSrc ? (
                                    <div className="relative h-44 w-full overflow-hidden bg-[#E3D6C3]">
                                        <img
                                            src={imgSrc}
                                            alt={item.name}
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                        {item.soldOut ? (
                                            <span className="absolute top-3 right-3 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                                Sold Out
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider"
                                                style={{ color: accentColor }}
                                            >
                                                {item.categoryName}
                                            </span>
                                            <h3
                                                className={`text-base font-bold leading-snug ${
                                                    isDark
                                                        ? "text-white"
                                                        : "text-stone-900"
                                                }`}
                                            >
                                                {item.name}
                                            </h3>
                                        </div>
                                        <span
                                            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                                            style={{
                                                backgroundColor: accentColor,
                                            }}
                                        >
                                            {item.price.toLocaleString()}{" "}
                                            {item.currencyCode}
                                        </span>
                                    </div>
                                    {item.description ? (
                                        <p
                                            className={`mt-2 text-xs leading-relaxed line-clamp-2 ${
                                                isDark
                                                    ? "text-slate-400"
                                                    : "text-stone-600"
                                            }`}
                                        >
                                            {item.description}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
