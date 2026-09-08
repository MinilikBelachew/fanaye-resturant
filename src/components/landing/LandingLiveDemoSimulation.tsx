"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Smartphone,
    ChefHat,
    Coffee,
    ShieldCheck,
    Receipt,
    CheckCircle2,
    Clock,
    RefreshCw,
    Bell,
    Check,
    Sparkles,
    Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type StationKey = "waiter" | "kitchen" | "barista" | "tinaverify" | "cashier";

export default function LandingLiveDemoSimulation() {
    const [activeStation, setActiveStation] = useState<StationKey>("kitchen");
    const [kitchenItems, setKitchenItems] = useState([
        { id: 1, name: "Truffle Tagliatelle & Parmigiano", qty: 2, mod: "Extra Truffle • Gluten-Free", status: "preparing", time: "3m 40s", urgent: false, img: "/media/pasta.jpg" },
        { id: 2, name: "Signature Wagyu Burger", qty: 1, mod: "Brioche Bun • Caramelized Onions", status: "ready", time: "1m 15s", urgent: false, img: "/media/burger.jpg" },
        { id: 3, name: "Artisanal Wood-Fired Pizza", qty: 2, mod: "Fresh Mozzarella • Basil", status: "preparing", time: "6m 20s", urgent: true, img: "/media/pizza.jpg" },
    ]);
    const [isSimulating, setIsSimulating] = useState(false);
    const t = useTranslations("stations");

    const stations = [
        {
            id: "waiter" as StationKey,
            label: t("waiterTab"),
            icon: Smartphone,
            tag: "Table Floor",
            desc: "Fast item dispatch & table timeline",
        },
        {
            id: "kitchen" as StationKey,
            label: t("kitchenTab"),
            icon: ChefHat,
            tag: "Hot Line",
            desc: "Urgency timers & touch item bumping",
        },
        {
            id: "barista" as StationKey,
            label: t("baristaTab"),
            icon: Coffee,
            tag: "Drink Bar",
            desc: "Modifiers & synchronized beverage queue",
        },
        {
            id: "tinaverify" as StationKey,
            label: t("tinaVerifyTab"),
            icon: ShieldCheck,
            tag: "Anti-Fraud",
            desc: "Instant bank transfer verification",
        },
        {
            id: "cashier" as StationKey,
            label: t("cashierTab"),
            icon: Receipt,
            tag: "Custody Hub",
            desc: "Open checks & recorded cash drops",
        },
    ];

    const handleBumpItem = (id: number) => {
        setKitchenItems(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                          ...item,
                          status: item.status === "ready" ? "preparing" : "ready",
                      }
                    : item,
            ),
        );
    };

    const handleRunSimulation = () => {
        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
        }, 1000);
    };

    return (
        <section id="stations" className="relative py-12 md:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                        <Sparkles className="size-3" />
                        <span>{t("badge")}</span>
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("titlePrefix")}{" "}
                        <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                            {t("titleHighlight")}
                        </span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        {t("description")}
                    </p>
                </div>

                {/* Station Selection Tabs */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    {stations.map(station => {
                        const Icon = station.icon;
                        const isActive = activeStation === station.id;
                        return (
                            <button
                                key={station.id}
                                type="button"
                                onClick={() => setActiveStation(station.id)}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer border",
                                    isActive
                                        ? "border-orange-500/60 bg-orange-500/10 text-foreground"
                                        : "border-border/70 bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground",
                                )}
                            >
                                <Icon className={cn("size-3.5", isActive ? "text-orange-500" : "text-muted-foreground")} />
                                <span>{station.label}</span>
                                <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] text-muted-foreground">
                                    {station.tag}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Interactive Station Mockup Window */}
                <div className="mt-6 rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl overflow-hidden">
                    {/* Futuristic OS Window Header Bar */}
                    <div className="flex items-center justify-between border-b border-border/60 bg-secondary/30 px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-rose-500/80" />
                                <span className="size-2 rounded-full bg-amber-500/80" />
                                <span className="size-2 rounded-full bg-emerald-500/80" />
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                fanaye.live://station/
                                <span className="text-foreground font-semibold">
                                    {activeStation}
                                </span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRunSimulation}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                                <RefreshCw
                                    className={cn(
                                        "size-3 text-orange-500",
                                        isSimulating && "animate-spin",
                                    )}
                                />
                                <span>{t("simulateBtn")}</span>
                            </button>
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                {t("realtimeSync")}
                            </span>
                        </div>
                    </div>

                    {/* Window Content Container */}
                    <div className="p-4 sm:p-5 min-h-[380px] flex flex-col justify-between">
                        {/* 1. WAITER POS VIEW */}
                        {activeStation === "waiter" && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 font-bold text-sm border border-orange-500/20">
                                            T-08
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-foreground text-sm">
                                                    Table 08 • VIP Patio
                                                </h3>
                                                <span className="rounded-full bg-blue-500/10 px-2 py-0.2 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                                    4 Guests
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Waiter: Alex M. • Session: #TS-9482
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-foreground">
                                        Auto-Routing: 3 Stations
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-border/70 bg-background/50 p-3 space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1.5 border-b border-border/40">
                                            <span>Kitchen Dispatch</span>
                                            <span className="text-orange-500 font-mono">2 items</span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-foreground">Truffle Pasta</p>
                                                    <p className="text-[10px] text-muted-foreground">Extra Parmigiano</p>
                                                </div>
                                                <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] text-amber-600">Cooking (3m)</span>
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-foreground">Wagyu Burger</p>
                                                    <p className="text-[10px] text-muted-foreground">Brioche Bun</p>
                                                </div>
                                                <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] text-emerald-600">Ready</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-background/50 p-3 space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1.5 border-b border-border/40">
                                            <span>Barista & Drinks</span>
                                            <span className="text-orange-500 font-mono">2 items</span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-foreground">Oat Flat White</p>
                                                    <p className="text-[10px] text-muted-foreground">Extra Shot</p>
                                                </div>
                                                <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] text-emerald-600">Ready</span>
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-foreground">Berry Macchiato</p>
                                                    <p className="text-[10px] text-muted-foreground">Cold Foam</p>
                                                </div>
                                                <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] text-emerald-600">Ready</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-background/50 p-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1.5 border-b border-border/40">
                                                <span>Check & Settlement</span>
                                                <span className="text-emerald-500 font-mono">Ready</span>
                                            </div>
                                            <div className="mt-2 space-y-1 text-[11px]">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Subtotal</span>
                                                    <span className="font-mono text-foreground">$124.50</span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Service Charge (10%)</span>
                                                    <span className="font-mono text-foreground">$12.45</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold text-foreground pt-1 border-t border-border/40">
                                                    <span>Total Check</span>
                                                    <span className="font-mono text-orange-600 dark:text-orange-400">$136.95</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveStation("tinaverify")}
                                            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95"
                                        >
                                            <ShieldCheck className="size-3.5" />
                                            <span>Collect with TinaVerify™</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. KITCHEN KDS VIEW */}
                        {activeStation === "kitchen" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <ChefHat className="size-4 text-orange-600" />
                                        <h3 className="font-bold text-foreground text-xs sm:text-sm">
                                            Kitchen Display System (KDS) — Hot Line
                                        </h3>
                                    </div>
                                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                        <Clock className="size-3" /> Average Prep: 7.5m
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {kitchenItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "flex flex-col justify-between rounded-xl border p-3 transition-colors",
                                                item.status === "ready"
                                                    ? "border-emerald-500/40 bg-emerald-500/5"
                                                    : item.urgent
                                                    ? "border-rose-500/40 bg-rose-500/5"
                                                    : "border-border/80 bg-background/60",
                                            )}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between text-[11px] font-medium">
                                                    <span className={cn(
                                                        "rounded px-1.5 py-0.2 font-mono text-[10px]",
                                                        item.urgent ? "bg-rose-500 text-white" : "bg-secondary text-foreground"
                                                    )}>
                                                        QTY {item.qty}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
                                                        <Clock className="size-2.5" /> {item.time}
                                                    </span>
                                                </div>

                                                <div className="mt-2.5 flex items-center gap-2.5">
                                                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border">
                                                        <Image
                                                            src={item.img}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground text-xs leading-snug">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                                                            {item.mod}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleBumpItem(item.id)}
                                                className={cn(
                                                    "mt-3 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                                                    item.status === "ready"
                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                        : "bg-secondary hover:bg-primary hover:text-white text-foreground border border-border",
                                                )}
                                            >
                                                {item.status === "ready" ? (
                                                    <>
                                                        <Check className="size-3.5" />
                                                        <span>Ready at Hotpass</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Bell className="size-3.5" />
                                                        <span>Mark Item Ready</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. BARISTA VIEW */}
                        {activeStation === "barista" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <Coffee className="size-4 text-amber-600" />
                                        <h3 className="font-bold text-foreground text-xs sm:text-sm">
                                            Barista & Specialty Beverage Dispatch
                                        </h3>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600">
                                        Queue: 1.8 min/drink
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                                <span className="font-bold text-emerald-600">T-08 • #1042</span>
                                                <span>0:45s ago</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border">
                                                    <Image src="/media/latte.jpg" alt="Latte" fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-foreground">Double Oat Flat White</h4>
                                                    <p className="text-[10px] text-muted-foreground">Oat Milk • Extra Shot</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-emerald-600 pt-2 border-t border-emerald-500/20">
                                            <span className="flex items-center gap-1"><CheckCircle2 className="size-3" /> Dispatched</span>
                                            <span className="text-muted-foreground">Waiter Alerted</span>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border/80 bg-background/50 p-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                                <span className="font-bold text-foreground">T-14 • #1045</span>
                                                <span>2:10s ago</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border">
                                                    <Image src="/media/macchiato.jpg" alt="Macchiato" fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-foreground">Caramel Macchiato</h4>
                                                    <p className="text-[10px] text-muted-foreground">Vanilla • Cold Foam</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-3 w-full rounded-lg bg-secondary hover:bg-emerald-600 hover:text-white py-1.5 text-[11px] font-semibold text-foreground transition"
                                        >
                                            Mark Drink Ready
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-border/80 bg-background/50 p-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                                <span className="font-bold text-foreground">T-03 • #1046</span>
                                                <span>Just now</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border">
                                                    <Image src="/media/cheesecake.jpg" alt="Pastry" fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-foreground">Pistachio Cheesecake</h4>
                                                    <p className="text-[10px] text-muted-foreground">Bakery Counter</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-3 w-full rounded-lg bg-secondary hover:bg-emerald-600 hover:text-white py-1.5 text-[11px] font-semibold text-foreground transition"
                                        >
                                            Mark Ready
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. TINAVERIFY */}
                        {activeStation === "tinaverify" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-orange-600" />
                                        <h3 className="font-bold text-foreground text-xs sm:text-sm">
                                            TinaVerify™ AI Bank Transfer Validator
                                        </h3>
                                    </div>
                                    <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                                        Anti-Fraud Active
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-mono text-muted-foreground">TRANSFER SLIP #FT2409</span>
                                            <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                                <CheckCircle2 className="size-3" /> Telebirr / CBE Confirmed
                                            </span>
                                        </div>

                                        <div className="rounded-lg border border-border bg-secondary/30 p-2.5 space-y-1.5 font-mono text-[11px]">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tx Reference ID:</span>
                                                <span className="font-bold text-foreground">FT24090889218</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Sender:</span>
                                                <span className="text-foreground">SOLOMON B.</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Amount Paid:</span>
                                                <span className="font-bold text-emerald-600 font-mono">$136.95</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleRunSimulation}
                                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition"
                                        >
                                            <RefreshCw className={cn("size-3", isSimulating && "animate-spin")} />
                                            <span>Re-Validate Transfer Reference</span>
                                        </button>
                                    </div>

                                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-border">
                                        <Image
                                            src="/images/landing/tinaverify_audit.jpg"
                                            alt="TinaVerify AI settlement console"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end p-3">
                                            <p className="text-[11px] font-mono text-white font-medium">
                                                ✓ Cryptographic Bank Reference Locked
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. CASHIER VIEW */}
                        {activeStation === "cashier" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="size-4 text-orange-600" />
                                        <h3 className="font-bold text-foreground text-xs sm:text-sm">
                                            Cashier Financial Control Desk & Shift Close
                                        </h3>
                                    </div>
                                    <span className="rounded-lg bg-secondary px-2.5 py-0.5 text-[10px] font-mono text-foreground">
                                        Shift A • Martha K.
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div className="rounded-xl border border-border/80 bg-background/50 p-3">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Open Table Checks
                                        </span>
                                        <div className="mt-1.5 flex items-baseline gap-1.5">
                                            <span className="text-xl font-bold text-foreground font-mono">14 Checks</span>
                                        </div>
                                        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Table 02</span>
                                                <span className="font-mono text-foreground">$82.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Table 08</span>
                                                <span className="font-mono text-emerald-600">$136.95 (Settled)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border/80 bg-background/50 p-3">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Recorded Cash Drops
                                        </span>
                                        <div className="mt-1.5 flex items-baseline gap-1.5">
                                            <span className="text-xl font-bold text-emerald-600 font-mono">$940.00</span>
                                        </div>
                                        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Drop #12 (Alex M.)</span>
                                                <span className="font-mono text-foreground">$320.00 ✓</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Drop #13 (Sara T.)</span>
                                                <span className="font-mono text-foreground">$620.00 ✓</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                                Operational Close
                                            </span>
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                Instant shift audit balancing cash drops, TinaVerify slips & Register custody.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-2 w-full rounded-lg bg-orange-600 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition"
                                        >
                                            Generate Shift Close Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive Timeline Bar */}
                        <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Flame className="size-3.5 text-orange-500" />
                                <span>Timeline:</span>
                                <span className="font-medium text-foreground">
                                    Table Claimed ➔ Sub-second Routing ➔ Ready Cue ➔ TinaVerify ➔ Settled
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {stations.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setActiveStation(s.id)}
                                        className={cn(
                                            "size-2 rounded-full transition-all cursor-pointer",
                                            activeStation === s.id
                                                ? "w-5 bg-orange-500"
                                                : "bg-muted-foreground/30 hover:bg-muted-foreground/60",
                                        )}
                                        aria-label={`Go to ${s.label}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
