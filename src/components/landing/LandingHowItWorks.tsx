"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Smartphone,
    ChefHat,
    PackageCheck,
    FileSpreadsheet,
    BarChart3,
    ArrowUpRight,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepItem {
    num: string;
    numChar: string;
    title: string;
    titleAm: string;
    description: string;
    descriptionAm: string;
    tag: string;
    tagAm: string;
    metric: string;
    metricAm: string;
    icon: React.ComponentType<{ className?: string }>;
    pos: "bottom" | "top";
}

const STEPS: StepItem[] = [
    {
        num: "01",
        numChar: "1",
        title: "Floor & QR Ordering",
        titleAm: "የአዳራሽ እና QR ማዘዣ",
        description:
            "Guests scan a table QR or waiters tap modifiers on handheld mobile POS. Tickets fire to the floor in under 20 seconds.",
        descriptionAm:
            "እንግዶች የጠረጴዛ QR ይቃኛሉ ወይም አስተናጋጆች በስልክ POS ያዛሉ። ትዕዛዞች ከ20 ሰከንድ ባነሰ ጊዜ ወደ ኩሽና ይደርሳሉ።",
        tag: "Handheld POS · Table QR",
        tagAm: "የአስተናጋጅ POS · የጠረጴዛ QR",
        metric: "< 20s Fire Time",
        metricAm: "< 20 ሰከንድ መድረሻ",
        icon: Smartphone,
        pos: "bottom",
    },
    {
        num: "02",
        numChar: "2",
        title: "Kitchen & Bar Routing",
        titleAm: "የኩሽና እና ባር ስርጭት",
        description:
            "Tickets split automatically to Grill, Injera, Bar, and Pastry KDS screens with live prep timers. Zero shouting.",
        descriptionAm:
            "ትዕዛዞች በራስ-ሰር ወደ ጥብስ፣ እንጀራ፣ ባር እና ዳቦ ቤት KDS ስክሪኖች ከቀጥታ ሰዓት ቆጣሪ ጋር ይከፋፈላሉ። ያለ ወረቀትና ጩኸት።",
        tag: "Multi-Station KDS",
        tagAm: "ባለብዙ ምድብ KDS",
        metric: "0 Lost Tickets",
        metricAm: "0 የጠፉ ትዕዛዞች",
        icon: ChefHat,
        pos: "top",
    },
    {
        num: "03",
        numChar: "3",
        title: "Recipe & Store Sync",
        titleAm: "ረሲፒ እና ስቶር ቅንጅት",
        description:
            "Raw ingredients deduct from store inventory the instant a dish is fired, triggering low-stock alerts early.",
        descriptionAm:
            "ምግብ እንደታዘዘ ጥሬ እቃዎች ከስቶር ክምችት በረሲፒ መጠን በራስ-ሰር ይቀነሳሉ፣ እጥረት ከመፈጠሩ በፊት ያስጠነቅቃል።",
        tag: "Automatic Depletion",
        tagAm: "ቀጥታ የክምችት ቅነሳ",
        metric: "Gram-Level Accuracy",
        metricAm: "የግራም ትክክለኛነት",
        icon: PackageCheck,
        pos: "bottom",
    },
    {
        num: "04",
        numChar: "4",
        title: "Checkout & Z-Report",
        titleAm: "ክፍያ እና Z-Report",
        description:
            "Split checks, verify Telebirr & CBE transfer reference codes, and close the drawer with zero end-of-day variance.",
        descriptionAm:
            "ሂሳብ በጥሬ ገንዘብ፣ በቴሌብር እና በሲቢኢ ይክፈሉ፣ ፈረቃውን ያለ ምንም ልዩነት በዜሮ ልዩነት ይዝጉ።",
        tag: "Telebirr · CBE · Cash",
        tagAm: "ቴሌብር · CBE · ጥሬ ገንዘብ",
        metric: "0.00 ETB Variance",
        metricAm: "0.00 ብር ልዩነት",
        icon: FileSpreadsheet,
        pos: "top",
    },
    {
        num: "05",
        numChar: "5",
        title: "Owner Live Insights",
        titleAm: "ለባለቤት ቀጥታ ትንታኔ",
        description:
            "Track net revenue, dish profitability against live Gebeya market commodity prices, and multi-branch metrics.",
        descriptionAm:
            "የተጣራ ገቢን፣ የምግብ ትርፍን ከቀጥታ የገበያ ዋጋ ጋር እና የቅርንጫፎችን አፈጻጸም ከየትኛውም ቦታ ሆነው ይቆጣጠሩ።",
        tag: "Executive Cockpit",
        tagAm: "የስራ አመራር ዳሽቦርድ",
        metric: "Live Gebeya Index",
        metricAm: "የቀጥታ ገበያ ኢንዴክስ",
        icon: BarChart3,
        pos: "bottom",
    },
];

// Clean Continuous Double-Wave Paths:
// Main Solid Orange Line (Top)
const ORANGE_LINE_PATH =
    "M 30,300 C 75,300 95,385 120,385 C 200,385 280,185 360,185 C 440,185 520,385 600,385 C 680,385 760,185 840,185 C 920,185 1000,385 1080,385 C 1125,385 1150,320 1180,320";

// Parallel Solid Thin Gray Line (runs right below the orange line, exactly like the reference image)
const GRAY_LINE_PATH =
    "M 30,318 C 75,318 95,403 120,403 C 200,403 280,203 360,203 C 440,203 520,403 600,403 C 680,403 760,203 840,203 C 920,203 1000,403 1080,403 C 1125,403 1150,338 1180,338";

export default function LandingHowItWorks() {
    const params = useParams();
    const isAm = params?.locale === "am";

    return (
        <section
            id="how-it-works"
            className="relative py-20 md:py-28 border-t border-border/50 bg-background text-foreground overflow-hidden"
        >
            {/* Subtle atmospheric ambient glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden select-none"
            >
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-r from-orange-500/[0.03] via-amber-500/[0.04] to-orange-500/[0.02] blur-[140px] rounded-full" />
                <div className="absolute bottom-10 left-10 size-[300px] rounded-full bg-orange-600/[0.02] blur-[100px]" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400"
                    >
                        <Sparkles className="size-3" />
                        <span>{isAm ? "05 የተናበቡ ደረጃዎች" : "05 STAGES"}</span>
                        <span>•</span>
                        <span>{isAm ? "የስራ ሂደት" : "PROCESS ROADMAP"}</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: 0.08 }}
                        className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-foreground"
                    >
                        {isAm ? "Restorch እንዴት " : "How Restorch "}
                        <span className="font-serif italic font-normal text-orange-600 dark:text-orange-500">
                            {isAm ? "ይሰራል" : "Works."}
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: 0.12 }}
                        className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed"
                    >
                        {isAm
                            ? "ከአዳራሽ ማዘዣ እስከ ፈረቃ መዝጊያ Z-Report ድረስ የሬስቶራንትዎን ስራ የሚያስተሳስር ወጥ የሆነ የተቀናጀ ሂደት።"
                            : "A synchronized operational roadmap connecting your dining floor, kitchen, inventory, and shift drawer into a single fluid stream."}
                    </motion.p>
                </div>

                {/* DESKTOP PANORAMIC DOUBLE-LINE ROADMAP (lg and above) */}
                <div className="hidden lg:block relative mt-16 mb-6">
                    <div className="relative w-full h-[580px]">
                        <svg
                            viewBox="0 0 1200 580"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible"
                        >
                            {/* 1. Thin Solid Gray Parallel Line (runs right below the orange line) */}
                            <motion.path
                                d={GRAY_LINE_PATH}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="text-border dark:text-white/20"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 1.3,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            />

                            {/* 2. Solid Orange Primary Line (Clean single solid line, no gradient, no glow) */}
                            <motion.path
                                d={ORANGE_LINE_PATH}
                                stroke="#ea580c"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 1.2,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            />
                        </svg>

                        {/* 5 STAGE CARDS & BADGES: In-view automatic entrance (no scroll-scrub wait) */}
                        <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
                            {STEPS.map((step, idx) => {
                                const Icon = step.icon;
                                const isTop = step.pos === "top";

                                return (
                                    <div
                                        key={step.num}
                                        className="relative h-full flex flex-col items-center justify-start px-2"
                                    >
                                        {/* TOP CARD (Steps 02 & 04): Sits cleanly from y=8 to y=150 (ABOVE the 185px peak badge) */}
                                        {isTop && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    y: -20,
                                                    scale: 0.95,
                                                }}
                                                whileInView={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                viewport={{
                                                    once: true,
                                                    amount: 0.2,
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    delay: 0.15 + idx * 0.1,
                                                    ease: [0.16, 1, 0.3, 1],
                                                }}
                                                className="pointer-events-auto absolute top-2 w-[220px] rounded-2xl border border-border/80 dark:border-white/10 bg-card/95 dark:bg-[#0D121F]/95 p-3.5 sm:p-4 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md text-left z-10 transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5"
                                            >
                                                {/* Ghost Watermark Number inside card */}
                                                <span className="font-mono text-4xl font-black text-foreground/[0.06] dark:text-white/[0.08] select-none absolute top-2 right-3 pointer-events-none">
                                                    {step.numChar}
                                                </span>

                                                <span className="block font-mono text-[10px] uppercase tracking-wider font-semibold text-orange-600 dark:text-orange-400">
                                                    {isAm
                                                        ? step.tagAm
                                                        : step.tag}
                                                </span>

                                                <h3 className="mt-1 text-sm font-bold tracking-tight text-foreground line-clamp-1">
                                                    {isAm
                                                        ? step.titleAm
                                                        : step.title}
                                                </h3>

                                                <p className="mt-1 text-[11px] text-muted-foreground dark:text-slate-400 leading-relaxed line-clamp-2">
                                                    {isAm
                                                        ? step.descriptionAm
                                                        : step.description}
                                                </p>

                                                <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-border/70 dark:border-white/10 bg-secondary/60 dark:bg-white/[0.04] px-2 py-0.5 text-[9px] font-mono font-semibold text-foreground/80 dark:text-slate-300">
                                                    <span>
                                                        {isAm
                                                            ? step.metricAm
                                                            : step.metric}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* PEAK / VALLEY BADGE ANCHORED EXACTLY ON THE LINE */}
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            whileInView={{
                                                scale: 1,
                                                opacity: 1,
                                            }}
                                            viewport={{
                                                once: true,
                                                amount: 0.2,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 280,
                                                damping: 18,
                                                delay: 0.2 + idx * 0.1,
                                            }}
                                            style={{
                                                top: isTop ? "185px" : "385px",
                                            }}
                                            className="pointer-events-auto absolute -translate-y-1/2 group cursor-pointer z-30"
                                        >
                                            {/* Glowing aura on hover */}
                                            <div className="absolute -inset-2 rounded-2xl bg-orange-500/25 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            {/* Center Node Diamond / Rounded Square */}
                                            <div className="relative flex size-13 sm:size-14 items-center justify-center rounded-2xl border-2 border-orange-500/50 dark:border-orange-500/60 bg-card dark:bg-[#101626] shadow-[0_6px_20px_rgba(234,88,12,0.18)] dark:shadow-[0_0_24px_rgba(249,115,22,0.25)] transition-all duration-300 group-hover:scale-110 group-hover:border-orange-500">
                                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                                    <Icon className="size-5" />
                                                </div>
                                                {/* Mini Step Number Pill */}
                                                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-background text-[9px] font-mono font-bold shadow-xs">
                                                    {step.numChar}
                                                </span>
                                            </div>
                                        </motion.div>

                                        {/* BOTTOM CARD (Steps 01, 03 & 05): Sits cleanly from y=425 to y=570 (BELOW the 385px valley badge) */}
                                        {!isTop && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    y: 20,
                                                    scale: 0.95,
                                                }}
                                                whileInView={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                viewport={{
                                                    once: true,
                                                    amount: 0.2,
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    delay: 0.15 + idx * 0.1,
                                                    ease: [0.16, 1, 0.3, 1],
                                                }}
                                                className="pointer-events-auto absolute top-[425px] w-[220px] rounded-2xl border border-border/80 dark:border-white/10 bg-card/95 dark:bg-[#0D121F]/95 p-3.5 sm:p-4 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md text-left z-10 transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5"
                                            >
                                                {/* Ghost Watermark Number inside card */}
                                                <span className="font-mono text-4xl font-black text-foreground/[0.06] dark:text-white/[0.08] select-none absolute top-2 right-3 pointer-events-none">
                                                    {step.numChar}
                                                </span>

                                                <span className="block font-mono text-[10px] uppercase tracking-wider font-semibold text-orange-600 dark:text-orange-400">
                                                    {isAm
                                                        ? step.tagAm
                                                        : step.tag}
                                                </span>

                                                <h3 className="mt-1 text-sm font-bold tracking-tight text-foreground line-clamp-1">
                                                    {isAm
                                                        ? step.titleAm
                                                        : step.title}
                                                </h3>

                                                <p className="mt-1 text-[11px] text-muted-foreground dark:text-slate-400 leading-relaxed line-clamp-2">
                                                    {isAm
                                                        ? step.descriptionAm
                                                        : step.description}
                                                </p>

                                                <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-border/70 dark:border-white/10 bg-secondary/60 dark:bg-white/[0.04] px-2 py-0.5 text-[9px] font-mono font-semibold text-foreground/80 dark:text-slate-300">
                                                    <span>
                                                        {isAm
                                                            ? step.metricAm
                                                            : step.metric}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* MOBILE / TABLET ROADMAP (< lg screens): Instant In-view Entrance */}
                <div className="lg:hidden relative mt-14 space-y-7 pl-6 sm:pl-8">
                    {/* Vertical connecting line */}
                    <div className="absolute left-[29px] sm:left-[37px] top-6 bottom-6 w-[3px] bg-border/40 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: "100%" }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                duration: 1.2,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="w-full bg-gradient-to-b from-orange-500 via-amber-500 to-orange-600 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                        />
                    </div>

                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;

                        return (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, x: -16 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.1 + idx * 0.08,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                className="relative flex items-start gap-4 sm:gap-6"
                            >
                                {/* Node Badge */}
                                <div className="relative z-10 shrink-0 flex size-12 sm:size-14 items-center justify-center rounded-2xl border-2 border-orange-500/50 dark:border-orange-500/60 bg-card dark:bg-[#101626] shadow-md dark:shadow-[0_0_20px_rgba(249,115,22,0.25)]">
                                    <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                        <Icon className="size-4 sm:size-5" />
                                    </div>
                                    <span className="absolute -top-1.5 -right-1.5 flex size-4 sm:size-5 items-center justify-center rounded-full bg-foreground text-background text-[9px] sm:text-[10px] font-mono font-bold">
                                        {step.numChar}
                                    </span>
                                </div>

                                {/* Content Card */}
                                <div className="relative flex-1 rounded-2xl border border-border/70 dark:border-white/10 bg-card/90 dark:bg-[#0D121F]/90 p-4 sm:p-5 backdrop-blur-md shadow-xs overflow-hidden">
                                    {/* Watermark Number */}
                                    <span className="font-mono text-5xl sm:text-6xl font-black text-foreground/[0.05] dark:text-white/[0.07] select-none absolute -bottom-3 right-3 pointer-events-none">
                                        {step.numChar}
                                    </span>

                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center justify-between gap-1">
                                            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-orange-600 dark:text-orange-400">
                                                {isAm ? step.tagAm : step.tag}
                                            </span>
                                            <span className="rounded-full bg-secondary/80 dark:bg-white/[0.06] border border-border/80 dark:border-white/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-foreground dark:text-slate-300">
                                                {isAm
                                                    ? step.metricAm
                                                    : step.metric}
                                            </span>
                                        </div>

                                        <h3 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-foreground">
                                            {isAm ? step.titleAm : step.title}
                                        </h3>

                                        <p className="mt-1.5 text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
                                            {isAm
                                                ? step.descriptionAm
                                                : step.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom Trust Action Pill */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-border/80 dark:border-white/10 bg-card/70 dark:bg-white/[0.03] px-6 py-2.5 backdrop-blur-md text-xs">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium text-foreground dark:text-slate-200">
                            {isAm
                                ? "እያንዳንዱ ደረጃ በሰከንዶች ውስጥ በሙሉ ቅርንጫፎች ይናበባል።"
                                : "Every station syncs in sub-second speed across all floor & kitchen devices."}
                        </span>
                        <a
                            href="/sign-in"
                            className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 hover:underline ml-1"
                        >
                            <span>{isAm ? "አሁኑኑ ይጀምሩ" : "Experience It"}</span>
                            <ArrowUpRight className="size-3.5" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
