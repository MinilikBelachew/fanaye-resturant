"use client";

import {
    WifiOff,
    ShieldCheck,
    Languages,
    TrendingUp,
    Building2,
    TabletSmartphone,
    Printer,
    Tv,
    QrCode,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./LandingMotion";

export default function LandingBentoFeatures() {
    return (
        <section
            id="features"
            className="relative py-20 md:py-28 border-t border-border/50 bg-background text-foreground"
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                        <Sparkles className="size-3" />
                        <span>Local Advantage</span>
                    </div>
                    <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
                        Built for Real-World{" "}
                        <span className="text-orange-600 dark:text-orange-500">
                            Ethiopian Hospitality
                        </span>
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Generic foreign POS tools break when Wi-Fi drops, miss
                        local mobile transfers, and lock you into expensive
                        terminals. Restorch is built for how you actually
                        operate.
                    </p>
                </ScrollReveal>

                {/* Bento Grid */}
                <StaggerContainer className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {/* BENTO 1 (7 cols): Offline-Resilient Service */}
                    <StaggerItem className="lg:col-span-7 group flex flex-col justify-between rounded-3xl border border-border/80 bg-card/80 dark:bg-white/[0.025] p-6 sm:p-7 transition-all duration-300 hover:border-orange-500/40">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                    <WifiOff className="size-5" />
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    OFFLINE QUEUE READY
                                </span>
                            </div>

                            <h3 className="mt-5 text-xl sm:text-2xl font-bold tracking-tight">
                                Keep serving even when Wi-Fi drops
                            </h3>
                            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                                Orders, table updates, and kitchen routing keep
                                running locally during connection cuts — and
                                sync automatically the second internet returns.
                            </p>
                        </div>

                        {/* Mini Offline Sync Visual */}
                        <div className="mt-6 rounded-2xl border border-border/70 bg-background/80 dark:bg-[#0D111A] p-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                                <span className="text-muted-foreground">
                                    Local Cache:{" "}
                                    <strong className="text-foreground">
                                        14 tickets queued
                                    </strong>
                                </span>
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <CheckCircle2 className="size-3.5" />
                                    Zero lost orders
                                </span>
                            </div>
                            <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-orange-500 to-emerald-500" />
                            </div>
                        </div>
                    </StaggerItem>

                    {/* BENTO 2 (5 cols): Telebirr, CBE & Cash Reconciliation */}
                    <StaggerItem className="lg:col-span-5 group flex flex-col justify-between rounded-3xl border border-border/80 bg-card/80 dark:bg-white/[0.025] p-6 sm:p-7 transition-all duration-300 hover:border-orange-500/40">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <span className="rounded-full border border-border bg-secondary/70 px-3 py-1 text-[10px] font-mono font-semibold text-muted-foreground">
                                    ZERO LEAKAGE
                                </span>
                            </div>

                            <h3 className="mt-5 text-xl font-bold tracking-tight">
                                Telebirr, CBE &amp; Cash verified
                            </h3>
                            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Log mobile transfer references alongside cash
                                drops and blind shift counts — stopping fake
                                screenshot losses at the desk.
                            </p>
                        </div>

                        <div className="mt-6 space-y-2">
                            {[
                                {
                                    channel: "Telebirr",
                                    ref: "TXN-89421",
                                    amount: "2,450 ETB",
                                },
                                {
                                    channel: "CBE Transfer",
                                    ref: "FT-26109",
                                    amount: "4,800 ETB",
                                },
                            ].map(tx => (
                                <div
                                    key={tx.ref}
                                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 dark:bg-[#0D111A] px-3 py-2 text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                        <span className="font-semibold">
                                            {tx.channel}
                                        </span>
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                            {tx.ref}
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold">
                                        {tx.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </StaggerItem>

                    {/* BENTO 3 (4 cols): Amharic & English Everywhere */}
                    <StaggerItem className="lg:col-span-4 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/80 dark:bg-white/[0.025] p-6 transition-all duration-300 hover:border-orange-500/40">
                        <div>
                            <div className="flex size-10 items-center justify-center rounded-2xl border border-border bg-secondary/70 text-foreground">
                                <Languages className="size-5" />
                            </div>
                            <h3 className="mt-4 text-lg font-bold tracking-tight">
                                Amharic &amp; English everywhere
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Switch seamlessly between English and አማርኛ
                                across guest QR menus, waiter POS, and kitchen
                                tickets.
                            </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between rounded-xl border border-border/70 bg-background/80 dark:bg-[#0D111A] px-3.5 py-2.5 text-xs">
                            <span className="font-semibold">
                                Special Kitfo · ልዩ ክትፎ
                            </span>
                            <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-orange-600 dark:text-orange-400">
                                EN / አማ
                            </span>
                        </div>
                    </StaggerItem>

                    {/* BENTO 4 (4 cols): Live Gebeya Margin Alerts */}
                    <StaggerItem className="lg:col-span-4 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/80 dark:bg-white/[0.025] p-6 transition-all duration-300 hover:border-orange-500/40">
                        <div>
                            <div className="flex size-10 items-center justify-center rounded-2xl border border-border bg-secondary/70 text-foreground">
                                <TrendingUp className="size-5" />
                            </div>
                            <h3 className="mt-4 text-lg font-bold tracking-tight">
                                Live Gebeya margin alerts
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Track daily local market ingredient prices and
                                see immediately when rising costs squeeze a
                                dish&apos;s profit margin.
                            </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between rounded-xl border border-border/70 bg-background/80 dark:bg-[#0D111A] px-3.5 py-2.5 text-xs">
                            <span className="text-muted-foreground">
                                Red Onion · Merkato
                            </span>
                            <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                                +12.4% alert
                            </span>
                        </div>
                    </StaggerItem>

                    {/* BENTO 5 (4 cols): Multi-Branch & Hotel Room Folios */}
                    <StaggerItem className="lg:col-span-4 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/80 dark:bg-white/[0.025] p-6 transition-all duration-300 hover:border-orange-500/40">
                        <div>
                            <div className="flex size-10 items-center justify-center rounded-2xl border border-border bg-secondary/70 text-foreground">
                                <Building2 className="size-5" />
                            </div>
                            <h3 className="mt-4 text-lg font-bold tracking-tight">
                                Multi-branch &amp; hotel folios
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Run multiple outlets from one owner login and
                                post restaurant orders straight to hotel room
                                bills.
                            </p>
                        </div>

                        <div className="mt-5 flex items-center gap-2 text-[11px] font-mono">
                            <span className="rounded-lg border border-border/70 bg-background/80 dark:bg-[#0D111A] px-2.5 py-1.5 font-semibold">
                                Bole Main
                            </span>
                            <span className="rounded-lg border border-border/70 bg-background/80 dark:bg-[#0D111A] px-2.5 py-1.5 font-semibold">
                                Room 304 Folio
                            </span>
                        </div>
                    </StaggerItem>

                    {/* BENTO 6 (12 cols): Zero Hardware Lock-In */}
                    <StaggerItem className="lg:col-span-12 rounded-3xl border border-border/80 bg-card/80 dark:bg-white/[0.025] p-6 sm:p-7">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="max-w-xl">
                                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                                    Hardware Freedom
                                </span>
                                <h3 className="mt-1.5 text-xl font-bold tracking-tight">
                                    Runs on the devices you already own
                                </h3>
                                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    No proprietary POS boxes or locked-in
                                    tablets. Open Restorch on any Android
                                    tablet, waiter phone, kitchen smart TV, or
                                    standard 80mm thermal printer.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                                {[
                                    {
                                        icon: TabletSmartphone,
                                        label: "Phones & Tablets",
                                    },
                                    { icon: Tv, label: "Kitchen TV / KDS" },
                                    {
                                        icon: Printer,
                                        label: "80mm Thermal",
                                    },
                                    { icon: QrCode, label: "Table QR Tents" },
                                ].map(hw => {
                                    const HwIcon = hw.icon;
                                    return (
                                        <div
                                            key={hw.label}
                                            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/70 bg-background/80 dark:bg-[#0D111A] px-4 py-3 text-center"
                                        >
                                            <HwIcon className="size-4 text-orange-500" />
                                            <span className="text-[11px] font-semibold">
                                                {hw.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </section>
    );
}
