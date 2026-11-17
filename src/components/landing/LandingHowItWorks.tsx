"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
    Smartphone,
    ChefHat,
    PackageCheck,
    FileSpreadsheet,
    BarChart3,
    Clock,
    AlertTriangle,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
    num: string;
    title: string;
    titleAm: string;
    description: string;
    descriptionAm: string;
    tag: string;
    tagAm: string;
    icon: React.ComponentType<{ className?: string }>;
}

const STEPS: TimelineStep[] = [
    {
        num: "01",
        title: "Floor & QR Ordering",
        titleAm: "የአዳራሽ እና QR ማዘዣ",
        description:
            "Guests scan a table QR or waiters tap modifiers on handheld POS. Orders fire to the floor in under 20 seconds.",
        descriptionAm:
            "እንግዶች የጠረጴዛ QR ይቃኛሉ ወይም አስተናጋጆች በስልክ POS ያዛሉ። ትዕዛዞች ከ20 ሰከንድ ባነሰ ጊዜ ወደ ኩሽና ይደርሳሉ።",
        tag: "Waiter POS · Table QR",
        tagAm: "የአስተናጋጅ POS · የጠረጴዛ QR",
        icon: Smartphone,
    },
    {
        num: "02",
        title: "Kitchen & Bar Routing",
        titleAm: "የኩሽና እና ባር ስርጭት",
        description:
            "Every ticket splits automatically to Grill, Injera, Bar, and Pastry KDS screens with live prep timers.",
        descriptionAm:
            "እያንዳንዱ ትዕዛዝ በራስ-ሰር ወደ ጥብስ፣ እንጀራ፣ ባር እና ዳቦ ቤት KDS ስክሪኖች ከቀጥታ ሰዓት ቆጣሪ ጋር ይከፋፈላል።",
        tag: "Multi-Station KDS",
        tagAm: "ባለብዙ ምድብ KDS",
        icon: ChefHat,
    },
    {
        num: "03",
        title: "Recipe & Store Sync",
        titleAm: "ረሲፒ እና ስቶር ቅንጅት",
        description:
            "Raw ingredients deduct from store inventory the moment a dish is fired, triggering low-stock alerts early.",
        descriptionAm:
            "ምግብ እንደታዘዘ ጥሬ እቃዎች ከስቶር ክምችት በራስ-ሰር ይቀነሳሉ፣ እጥረት ከመፈጠሩ በፊት ማስጠንቀቂያ ይሰጣል።",
        tag: "Automatic Inventory",
        tagAm: "ራስ-ሰር ክምችት",
        icon: PackageCheck,
    },
    {
        num: "04",
        title: "Checkout & Z-Report",
        titleAm: "ክፍያ እና Z-Report",
        description:
            "Split bills, verify Telebirr, CBE, and cash, and close the shift drawer with zero end-of-day variance.",
        descriptionAm:
            "ሂሳብ ይክፈሉ፣ ቴሌብር፣ ሲቢኢ እና ጥሬ ገንዘብ ያረጋግጡ፣ ፈረቃውን ያለ ምንም ልዩነት ይዝጉ።",
        tag: "Telebirr · CBE · Cash",
        tagAm: "ቴሌብር · CBE · ጥሬ ገንዘብ",
        icon: FileSpreadsheet,
    },
    {
        num: "05",
        title: "Owner Live Insights",
        titleAm: "ለባለቤት ቀጥታ ትንታኔ",
        description:
            "Track net revenue, dish margins against live Gebeya prices, and multi-branch performance from anywhere.",
        descriptionAm:
            "የተጣራ ገቢን፣ የምግብ ትርፍን ከቀጥታ የገበያ ዋጋ ጋር እና የቅርንጫፎችን አፈጻጸም ከየትኛውም ቦታ ይከታተሉ።",
        tag: "Real-Time Control",
        tagAm: "የቀጥታ ቁጥጥር",
        icon: BarChart3,
    },
];

function MiniStepWidget({
    index,
    isActive,
    isReached,
}: {
    index: number;
    isActive: boolean;
    isReached: boolean;
}) {
    const shellClass = cn(
        "w-full max-w-[270px] rounded-2xl border p-3.5 text-left transition-all duration-300",
        isActive
            ? "border-orange-500/45 bg-card dark:bg-[#101521] shadow-[0_8px_28px_rgba(249,115,22,0.12)]"
            : isReached
              ? "border-border/80 bg-card/80 dark:bg-white/[0.03]"
              : "border-border/50 bg-secondary/30 opacity-65",
    );

    if (index === 0) {
        return (
            <div className={shellClass}>
                <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Table 04 · Floor
                    </span>
                    <span className="text-orange-600 dark:text-orange-400">
                        Dawit B.
                    </span>
                </div>
                <div className="mt-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between rounded-lg bg-secondary/60 dark:bg-white/[0.04] px-2.5 py-1.5">
                        <span className="font-medium">1× Special Kitfo</span>
                        <span className="font-mono text-muted-foreground">
                            980
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-secondary/60 dark:bg-white/[0.04] px-2.5 py-1.5">
                        <span className="font-medium">3× Jebena Buna</span>
                        <span className="font-mono text-muted-foreground">
                            270
                        </span>
                    </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-orange-500 px-2.5 py-1.5 text-[10px] font-semibold text-white">
                    <span>1,250 ETB</span>
                    <span>Fire Order →</span>
                </div>
            </div>
        );
    }

    if (index === 1) {
        return (
            <div className={shellClass}>
                <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                        GRILL KDS · #1042
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Clock className="size-2.5" />
                        04:18
                    </span>
                </div>
                <div className="mt-2.5 space-y-1 text-[11px] font-medium">
                    <p>• 1× Special Kitfo (Medium)</p>
                    <p>• 2× Tibs Firfir (Spicy)</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-muted-foreground">Preparing</span>
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                        Bump ✓
                    </span>
                </div>
            </div>
        );
    }

    if (index === 2) {
        return (
            <div className={shellClass}>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        Store Auto-Sync
                    </span>
                    <span>Shift #14</span>
                </div>
                <div className="mt-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                        <span>White Teff Flour</span>
                        <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                            -3.2 kg
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1">
                            Red Onion
                            <AlertTriangle className="size-3 text-amber-500" />
                        </span>
                        <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                            4.2 kg left
                        </span>
                    </div>
                </div>
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-orange-500" />
                </div>
            </div>
        );
    }

    if (index === 3) {
        return (
            <div className={shellClass}>
                <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-semibold text-foreground">
                        Shift Z-Report
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShieldCheck className="size-3" />0 Variance
                    </span>
                </div>
                <div className="mt-2.5 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Telebirr + CBE</span>
                        <span className="font-mono font-semibold text-foreground">
                            32,650 ETB
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Cash Drawer</span>
                        <span className="font-mono font-semibold text-foreground">
                            9,850 ETB
                        </span>
                    </div>
                </div>
                <div className="mt-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                    <span>Net Total</span>
                    <span>42,500 ETB</span>
                </div>
            </div>
        );
    }

    return (
        <div className={shellClass}>
            <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-semibold text-foreground">
                    Owner Pulse · Today
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +18.4%
                </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold font-mono">
                    42,500 ETB
                </span>
                <span className="text-[10px] text-muted-foreground">
                    Food Cost 29.4%
                </span>
            </div>
            <div className="mt-2.5 flex items-end gap-1.5 h-8">
                {[38, 52, 46, 68, 60, 84, 95].map((h, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex-1 rounded-sm transition-all",
                            i >= 5
                                ? "bg-orange-500"
                                : "bg-orange-500/25 dark:bg-orange-500/30",
                        )}
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function LandingHowItWorks() {
    const isAm = useLocale() === "am";
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const el = timelineRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const startY = vh * 0.72;
            const total = Math.max(rect.height, 1);
            const raw = (startY - rect.top) / total;
            setProgress(Math.max(0, Math.min(1, raw)));
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    const activeIndex = Math.min(
        STEPS.length - 1,
        Math.floor(progress * STEPS.length),
    );

    return (
        <section
            id="how-it-works"
            className="relative py-20 md:py-28 border-t border-border/50 bg-background text-foreground"
        >
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                {/* Centered Header */}
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <span className="text-orange-600 dark:text-orange-400">
                            {isAm ? "05 ደረጃዎች" : "05 STAGES"}
                        </span>
                        <span>•</span>
                        <span>{isAm ? "ሂደት" : "PROCESS"}</span>
                    </div>
                    <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
                        {isAm ? "Restorch እንዴት ይሰራል" : "How Restorch Works"}
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {isAm
                            ? "ከመጀመሪያው ትዕዛዝ እስከ መጨረሻው Z-Report ድረስ የተጨናነቀ የስራ ሰዓትን ወደ ተረጋጋና የተመዘነ አፈጻጸም የሚቀይር የተቀናጀ ሂደት።"
                            : "A synchronized operational flow built to turn busy service rushes into calm, measurable execution — from first order to final Z-Report."}
                    </p>
                </div>

                {/* Desktop: Alternating Left/Right Timeline with Scroll-Filling Central Bar */}
                <div ref={timelineRef} className="relative mt-16">
                    {/* Central Spine Track (Desktop) */}
                    <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 bg-border/60 rounded-full overflow-visible">
                        <div
                            className="w-full rounded-full bg-gradient-to-b from-orange-500 via-amber-500 to-orange-400 transition-[height] duration-150 ease-out"
                            style={{ height: `${progress * 100}%` }}
                        />
                        <div
                            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 size-3.5 rounded-full bg-orange-500 ring-4 ring-orange-500/20 shadow-[0_0_16px_rgba(249,115,22,0.65)] transition-[top] duration-150 ease-out"
                            style={{ top: `${progress * 100}%` }}
                        />
                    </div>

                    {/* Mobile Spine Track (Left-aligned) */}
                    <div className="md:hidden absolute left-5 top-6 bottom-6 w-[2px] bg-border/60 rounded-full">
                        <div
                            className="w-full rounded-full bg-gradient-to-b from-orange-500 via-amber-500 to-orange-400 transition-[height] duration-150 ease-out"
                            style={{ height: `${progress * 100}%` }}
                        />
                    </div>

                    <div className="space-y-8 md:space-y-12">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const stepThreshold = idx / STEPS.length;
                            const isReached = progress >= stepThreshold - 0.04;
                            const isActive = idx === activeIndex;
                            const isEven = idx % 2 === 1;

                            return (
                                <div key={step.num} className="relative">
                                    {/* Desktop alternating row */}
                                    <div className="hidden md:grid grid-cols-[1fr_48px_1fr] items-center gap-4 px-2 py-2">
                                        {/* Left side */}
                                        {isEven ? (
                                            <div className="text-right pr-6">
                                                <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400 mb-1">
                                                    <span>
                                                        {isAm
                                                            ? step.tagAm
                                                            : step.tag}
                                                    </span>
                                                </div>
                                                <h3
                                                    className={cn(
                                                        "text-xl font-bold tracking-tight transition-colors",
                                                        isReached
                                                            ? "text-foreground"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {isAm
                                                        ? step.titleAm
                                                        : step.title}
                                                </h3>
                                                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-sm ml-auto">
                                                    {isAm
                                                        ? step.descriptionAm
                                                        : step.description}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-4 pr-6">
                                                <MiniStepWidget
                                                    index={idx}
                                                    isActive={isActive}
                                                    isReached={isReached}
                                                />
                                                <span
                                                    className={cn(
                                                        "font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full border shrink-0",
                                                        isActive
                                                            ? "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                                            : "border-border/60 text-muted-foreground",
                                                    )}
                                                >
                                                    {step.num}
                                                </span>
                                            </div>
                                        )}

                                        {/* Center Spine Node */}
                                        <div className="flex items-center justify-center">
                                            <div
                                                className={cn(
                                                    "size-3.5 rounded-full border-2 transition-all duration-300 z-10",
                                                    isActive
                                                        ? "scale-125 border-orange-500 bg-background ring-4 ring-orange-500/20"
                                                        : isReached
                                                          ? "border-orange-500 bg-orange-500"
                                                          : "border-border bg-background",
                                                )}
                                            />
                                        </div>

                                        {/* Right side */}
                                        {isEven ? (
                                            <div className="flex items-center justify-start gap-4 pl-6">
                                                <span
                                                    className={cn(
                                                        "font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full border shrink-0",
                                                        isActive
                                                            ? "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                                            : "border-border/60 text-muted-foreground",
                                                    )}
                                                >
                                                    {step.num}
                                                </span>
                                                <MiniStepWidget
                                                    index={idx}
                                                    isActive={isActive}
                                                    isReached={isReached}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-left pl-6">
                                                <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400 mb-1">
                                                    <span>
                                                        {isAm
                                                            ? step.tagAm
                                                            : step.tag}
                                                    </span>
                                                </div>
                                                <h3
                                                    className={cn(
                                                        "text-xl font-bold tracking-tight transition-colors",
                                                        isReached
                                                            ? "text-foreground"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {isAm
                                                        ? step.titleAm
                                                        : step.title}
                                                </h3>
                                                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-sm">
                                                    {isAm
                                                        ? step.descriptionAm
                                                        : step.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile left-aligned timeline row */}
                                    <div className="md:hidden relative flex items-start gap-4 pl-12">
                                        <div
                                            className={cn(
                                                "absolute left-5 top-2 -translate-x-1/2 flex size-7 items-center justify-center rounded-full border-2 transition-all duration-300 z-10",
                                                isActive
                                                    ? "border-orange-500 bg-orange-500 text-white ring-4 ring-orange-500/20"
                                                    : isReached
                                                      ? "border-orange-500 bg-background text-orange-500"
                                                      : "border-border bg-background text-muted-foreground",
                                            )}
                                        >
                                            <Icon className="size-3.5" />
                                        </div>

                                        <div className="w-full space-y-3">
                                            <div>
                                                <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-semibold">
                                                    {step.num} ·{" "}
                                                    {isAm
                                                        ? step.tagAm
                                                        : step.tag}
                                                </span>
                                                <h3 className="mt-0.5 text-base font-bold tracking-tight">
                                                    {isAm
                                                        ? step.titleAm
                                                        : step.title}
                                                </h3>
                                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                                    {isAm
                                                        ? step.descriptionAm
                                                        : step.description}
                                                </p>
                                            </div>
                                            <MiniStepWidget
                                                index={idx}
                                                isActive={isActive}
                                                isReached={isReached}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
