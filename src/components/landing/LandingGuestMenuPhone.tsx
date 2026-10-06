"use client";

import { BellRing, Plus, Search, Sparkles, Wifi } from "lucide-react";
import { formatEtb } from "@/lib/money";

const HIGHLIGHTS = [
    {
        name: "pizza",
        price: 900,
        image: "/images/landing/hero_restaurant_system.jpg",
        hasPhoto: true,
    },
    {
        name: "Fried Rice",
        price: 250,
        image: "",
        hasPhoto: false,
    },
];

const DIETS = ["All", "Fasting", "Vegetarian", "Spicy"];

export default function LandingGuestMenuPhone() {
    return (
        <div className="relative h-[594px] w-[290px] shrink-0">
            <div className="absolute top-0 left-0 origin-top-left scale-[1.65]">
                <div className="relative mx-auto flex h-[360px] w-[176px] flex-col overflow-hidden rounded-[32px] border-[7px] border-slate-900 bg-slate-950 shadow-lg">
                    <div className="absolute top-1.5 left-1/2 z-50 flex h-3 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-black">
                        <div className="mr-1 size-1.5 rounded-full bg-slate-800" />
                        <div className="size-1.5 rounded-full bg-emerald-500" />
                    </div>

                    <div className="flex-1 overflow-hidden bg-slate-50 text-slate-900">
                        <div className="relative h-[86px] overflow-hidden bg-slate-800">
                            <img
                                src="/images/landing/hero_restaurant_system.jpg"
                                alt=""
                                className="h-full w-full object-cover brightness-75"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                            <div className="absolute top-5 left-2 right-2 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur-sm">
                                    <span className="size-1.5 rounded-full bg-emerald-400" />
                                    Table 1
                                </span>
                                <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-white">
                                    <BellRing className="size-2.5" />
                                </span>
                            </div>
                            <div className="absolute bottom-1.5 left-2 right-2 text-white">
                                <p className="text-[10px] font-bold leading-tight">
                                    Welcome to Our Dining Room
                                </p>
                                <p className="text-[7px] text-white/75 line-clamp-1">
                                    Scan to explore chef specials, drinks, and
                                    place your…
                                </p>
                            </div>
                        </div>

                        <div className="mx-1.5 mt-1.5 flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-1.5 py-1 text-[7px] font-medium text-amber-900">
                            <Wifi className="size-2.5 text-amber-600" />
                            WiFi: Fanaye_Guest
                        </div>

                        <div className="relative mx-1.5 mt-1.5">
                            <Search className="absolute top-1/2 left-1.5 size-2.5 -translate-y-1/2 text-slate-400" />
                            <div className="rounded-lg border border-slate-200 bg-white py-1 pr-1.5 pl-5 text-[7px] text-slate-400">
                                Search dishes, drinks, desserts…
                            </div>
                        </div>

                        <div className="mt-1.5 flex gap-1 overflow-hidden px-1.5">
                            {DIETS.map((tag, i) => (
                                <span
                                    key={tag}
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-medium ${
                                        i === 0
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-200/90 text-slate-600"
                                    }`}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-1.5 px-1.5">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-0.5 text-[8px] font-bold text-slate-900">
                                    <Sparkles className="size-2 text-amber-500" />
                                    Chef&apos;s Highlights
                                </span>
                                <span className="text-[7px] font-medium text-amber-600">
                                    Must Try
                                </span>
                            </div>
                            <div className="mt-1 flex gap-1.5">
                                {HIGHLIGHTS.map(item => (
                                    <div
                                        key={item.name}
                                        className="w-[72px] shrink-0 rounded-xl border border-slate-200/80 bg-white p-1"
                                    >
                                        <div className="relative h-10 overflow-hidden rounded-lg bg-slate-100">
                                            {item.hasPhoto ? (
                                                <img
                                                    src={item.image}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-[6px] text-slate-400">
                                                    No Photo
                                                </div>
                                            )}
                                            <span className="absolute top-0.5 left-0.5 rounded bg-amber-600 px-1 text-[6px] font-bold text-white">
                                                Special
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-[7px] font-semibold">
                                            {item.name}
                                        </p>
                                        <div className="mt-0.5 flex items-center justify-between">
                                            <span className="text-[7px] font-bold text-amber-600">
                                                {formatEtb(item.price)}
                                            </span>
                                            <span className="flex size-3.5 items-center justify-center rounded-full bg-slate-900 text-white">
                                                <Plus className="size-2" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-1.5 flex gap-1.5 overflow-hidden border-b border-slate-200 px-1.5 pb-1">
                            <span className="shrink-0 border-b-2 border-amber-600 pb-0.5 text-[7px] font-semibold text-amber-600">
                                All Menu
                            </span>
                            <span className="shrink-0 text-[7px] font-medium text-slate-500">
                                Kitchen Station
                            </span>
                            <span className="shrink-0 text-[7px] font-medium text-slate-500">
                                Main Course
                            </span>
                        </div>

                        <div className="px-1.5 pt-1.5">
                            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-1.5">
                                <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                    <img
                                        src="/images/landing/hero_restaurant_system.jpg"
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[8px] font-bold">
                                        pizza
                                    </p>
                                    <p className="text-[6.5px] text-slate-500">
                                        test description
                                    </p>
                                    <p className="text-[8px] font-bold text-amber-600">
                                        {formatEtb(900)}
                                    </p>
                                </div>
                                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white">
                                    <Plus className="size-2.5" />
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute right-2 bottom-3 left-2 z-40">
                        <div className="flex items-center justify-between rounded-xl bg-slate-900 px-2 py-1.5 text-white">
                            <span className="flex items-center gap-1 text-[8px] font-semibold">
                                <span className="flex size-3.5 items-center justify-center rounded-full bg-amber-500 text-[7px] font-bold text-slate-950">
                                    2
                                </span>
                                View Cart
                            </span>
                            <span className="text-[8px] font-bold text-amber-400">
                                {formatEtb(470)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
