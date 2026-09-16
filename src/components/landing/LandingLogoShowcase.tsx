"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingLogoShowcase() {
    const [selectedLogo, setSelectedLogo] = useState<number>(0);

    const systemLogos = [
        {
            id: 1,
            num: "01",
            name: "Unified Timeline (One Table, One Timeline)",
            file: "/media/logos/system_logo_1_unified_timeline.svg",
            coreSystemPillar: "Continuous Table Timeline & Zero Lost Tickets",
            description:
                "Symbolizes the core mantra: 'One table, one live timeline'. An orbital sync ring with 4 checkpoint station nodes (Floor, Kitchen, Barista, Cashier) circling a living hearth flame.",
            systemRole: "Primary SaaS Architecture",
            accent: "Amber / Emerald / Sky",
        },
        {
            id: 2,
            num: "02",
            name: "4-Station Neural Dispatcher",
            file: "/media/logos/system_logo_2_station_dispatch.svg",
            coreSystemPillar: "Sub-Second Automatic Item Splitting",
            description:
                "4-quadrant dispatch cross representing Kitchen KDS, Barista Bar, Pastry/Cakes, and Soft Drinks converging on a sub-millisecond cloud routing core.",
            systemRole: "Fulfillment & KDS Engine",
            accent: "Flame / Amber / Purple / Emerald",
        },
        {
            id: 3,
            num: "03",
            name: "TinaVerify™ Financial Shield",
            file: "/media/logos/system_logo_3_tinaverify_custody.svg",
            coreSystemPillar: "Zero Transfer Fraud & Shift Cash Drops",
            description:
                "Cryptographic biometric vault shield framing the culinary flame with a verified bank transfer checkmark, reflecting 100% attributable waiter custody.",
            systemRole: "Financial Security & Custody",
            accent: "Emerald / Gold / Crimson",
        },
        {
            id: 4,
            num: "04",
            name: "Fanaye Heritage Lantern & Beacon",
            file: "/media/logos/system_logo_4_fanaye_beacon.svg",
            coreSystemPillar: "Amharic Fanaye ('My Light / Lantern')",
            description:
                "Modernized Ethiopian-inspired lantern housing a glowing live pulse beacon in the center, guiding front-of-house and back-of-house staff seamlessly.",
            systemRole: "Brand Essence & Hospitality",
            accent: "Warm Gold / Sunset Amber",
        },
        {
            id: 5,
            num: "05",
            name: "Kinetic Flow (Waiter-to-Pass Velocity)",
            file: "/media/logos/system_logo_5_kinetic_flow.svg",
            coreSystemPillar: "Ultra-Fast Tableside to Kitchen Speed",
            description:
                "Aerodynamic forward-leaning 'F' monogram constructed from three live telemetry flow chevrons with real-time station broadcast pulse dots.",
            systemRole: "Speed & Real-time WebSockets",
            accent: "Flame Orange / Pink / Neon Cyan",
        },
    ];

    const current = systemLogos[selectedLogo];

    return (
        <section
            id="logos"
            className="relative py-12 md:py-16 border-t border-border/60 bg-secondary/20"
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                        <Sparkles className="size-3" />
                        <span>System Architecture Logos (5 Concepts)</span>
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Logos That Describe the{" "}
                        <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                            Fanaye Operating System
                        </span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        Each of these 5 custom vector logos directly represents
                        a core architectural pillar of Fanaye: the Unified
                        Timeline, Station Dispatch, TinaVerify Custody, Fanaye
                        Beacon, or Kinetic Flow.
                    </p>
                </div>

                {/* Selected Logo Featured Deep Dive Card */}
                <div className="mt-8 rounded-2xl border border-orange-500/50 bg-gradient-to-r from-orange-500/10 via-card/90 to-card/90 p-5 sm:p-7 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-3 flex justify-center">
                            <div className="relative size-28 rounded-2xl border border-border bg-background p-3 flex items-center justify-center">
                                <Image
                                    src={current.file}
                                    alt={current.name}
                                    fill
                                    className="object-contain p-3"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-9 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                                    SYSTEM LOGO {current.num}
                                </span>
                                <span className="rounded-full bg-secondary px-2 py-0.2 text-[10px] font-semibold text-muted-foreground">
                                    {current.systemRole}
                                </span>
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-semibold text-emerald-600">
                                    Selected for Review
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-foreground">
                                {current.name}
                            </h3>

                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {current.description}
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                                <div>
                                    <span className="text-[10px] text-muted-foreground block">
                                        System Pillar
                                    </span>
                                    <span className="font-bold text-foreground">
                                        {current.coreSystemPillar}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block">
                                        Palette
                                    </span>
                                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                                        {current.accent}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5 System Logo Cards Selection Bar */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {systemLogos.map((opt, idx) => {
                        const isSelected = selectedLogo === idx;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedLogo(idx)}
                                className={cn(
                                    "flex flex-col items-center justify-between rounded-xl border p-3 backdrop-blur-md transition-all cursor-pointer text-center",
                                    isSelected
                                        ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/40"
                                        : "border-border/70 bg-card/70 hover:border-orange-500/40 hover:bg-secondary/60",
                                )}
                            >
                                <div className="flex w-full items-center justify-between text-[10px] font-mono text-muted-foreground">
                                    <span>{opt.num}</span>
                                    {isSelected && (
                                        <Check className="size-3 text-orange-500" />
                                    )}
                                </div>

                                <div className="relative size-16 my-2 transition-transform hover:scale-105">
                                    <Image
                                        src={opt.file}
                                        alt={opt.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>

                                <div className="w-full">
                                    <p className="text-xs font-bold text-foreground line-clamp-1">
                                        {opt.name.split(" ")[0]}{" "}
                                        {opt.name.split(" ")[1]}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                        {opt.systemRole}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
