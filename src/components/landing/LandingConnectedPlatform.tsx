"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChefHat,
    Truck,
    Package,
    Users,
    Megaphone,
    Cpu,
    Wallet,
    Sparkles,
    Check,
    TrendingUp,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";

interface BulletPoint {
    en: string;
    am: string;
}

interface PlatformModule {
    id: string;
    title: string;
    titleAm: string;
    subtitle: string;
    subtitleAm: string;
    shortDesc: string;
    shortDescAm: string;
    bullets: BulletPoint[];
    cta: string;
    ctaAm: string;
    metricValue: string;
    metricLabel: string;
    metricLabelAm: string;
    // Hub coordinates in 640 x 480 canvas
    x: number;
    y: number;
    icon: React.ComponentType<{ className?: string }>;
}

const MODULES: PlatformModule[] = [
    {
        id: "payments-cash",
        title: "Payments & CRM",
        titleAm: "ክፍያ እና CRM",
        subtitle: "Track · Grow · Engage",
        subtitleAm: "ሂሳብ · እድገት · ደንበኛ",
        shortDesc:
            "Split checks, verified Telebirr & CBE reference checks, and shift Z-Reports with zero drawer variance.",
        shortDescAm:
            "የተከፋፈለ ሂሳብ፣ ቴሌብር/ባንክ እና የፈረቃ Z-Report። እያንዳንዱ ብር በመዝጊያ ይመሳከራል።",
        bullets: [
            { en: "Instant QR & mobile money", am: "ፈጣን QR እና የሞባይል ክፍያ" },
            { en: "Verified Telebirr/CBE receipts", am: "የቴሌብር እና ባንክ ማመሳከሪያ" },
            { en: "End-of-day drawer Z-Report", am: "የቀን መዝጊያ የካሽ ሪፖርት" },
            { en: "Guest loyalty profiles", am: "የደንበኛ ታማኝነት መገለጫ" },
        ],
        cta: "View Payments",
        ctaAm: "የክፍያ ስርዓቱን ይመልከቱ",
        metricValue: "100%",
        metricLabel: "Drawer Match",
        metricLabelAm: "ትክክለኛ ሂሳብ",
        x: 320,
        y: 55,
        icon: Wallet,
    },
    {
        id: "kitchen",
        title: "Kitchen",
        titleAm: "ኩሽና",
        subtitle: "Prep · Cook",
        subtitleAm: "ዝግጅት · ማብሰል",
        shortDesc:
            "Station-by-station KDS routing with live prep timers, color-coded urgency, and pass bump control.",
        shortDescAm:
            "ቀጥታ የምድብ ስርጭት፣ የዝግጅት ሰዓት ቆጣሪ እና የማውጫ ቁጥጥር። ያለ ወረቀት እና ያለ ጩኸት።",
        bullets: [
            {
                en: "Split tickets to Grill, Bar & Pastry",
                am: "ትዕዛዝ በምድብ መከፋፈል",
            },
            { en: "Live cooking timer countdowns", am: "የቀጥታ ምግብ ማብሰያ ሰዓት" },
            { en: "Zero lost paper tickets", am: "የጠፋ ወረቀት ትዕዛዝ የለም" },
            { en: "Pass bump & waiter alert", am: "ምግብ ሲደርስ ለአስተናጋጅ ጥሪ" },
        ],
        cta: "See Kitchen KDS",
        ctaAm: "ኩሽና KDS ይመልከቱ",
        metricValue: "< 8 min",
        metricLabel: "Prep Speed",
        metricLabelAm: "ፈጣን ዝግጅት",
        x: 485,
        y: 132,
        icon: ChefHat,
    },
    {
        id: "delivery-fleet",
        title: "Delivery & Fleet",
        titleAm: "ዴሊቨሪ እና ስምሪት",
        subtitle: "Dispatch · Track",
        subtitleAm: "ስምሪት · ክትትል",
        shortDesc:
            "Driver dispatch and hotel room folios in one unified flow. Real-time status from kitchen pass to doorstep.",
        shortDescAm:
            "የአሽከርካሪ ስርጭት እና የሆቴል ክፍል ሂሳብ በአንድ መስመር። ከኩሽና እስከ ደጃፍ ቀጥታ ክትትል።",
        bullets: [
            { en: "One-tap rider dispatch", am: "በአንድ ንክኪ አሽከርካሪ መመደብ" },
            { en: "Live GPS courier tracking", am: "የቀጥታ ካርታ ክትትል" },
            { en: "Hotel room billing sync", am: "ከሆቴል ክፍል ሂሳብ ጋር ማመሳሰል" },
            { en: "Automated customer SMS", am: "ለደንበኛ የሁኔታ መልዕክት" },
        ],
        cta: "Track Delivery",
        ctaAm: "ዴሊቨሪውን ይከታተሉ",
        metricValue: "24 min",
        metricLabel: "Avg Delivery",
        metricLabelAm: "አማካይ ዴሊቨሪ",
        x: 520,
        y: 310,
        icon: Truck,
    },
    {
        id: "inventory",
        title: "Inventory",
        titleAm: "ክምችት",
        subtitle: "Stock · Forecast",
        subtitleAm: "ክምችት · ትንበያ",
        shortDesc:
            "Recipe-level stock deduction as dishes sell. Low-stock alerts and automatic reorder triggers.",
        shortDescAm:
            "ምግቦች ሲሸጡ ግብዓቶች በረሲፒ መጠን በራስ-ሰር ይቀነሳሉ። እቃዎች ሳያልቁ ማስጠንቀቂያ ይሰጣል።",
        bullets: [
            { en: "Gram-accurate recipe deduction", am: "በግራም ትክክለኛ የረሲፒ ቅነሳ" },
            {
                en: "Automated store low-stock alerts",
                am: "የአነስተኛ ክምችት ማስጠንቀቂያ",
            },
            { en: "Supplier purchase orders", am: "የአቅራቢዎች የግዢ ትዕዛዝ" },
            { en: "Food waste tracking log", am: "የብክነት እና ኪሳራ ክትትል" },
        ],
        cta: "Explore Inventory",
        ctaAm: "ክምችቱን ይመልከቱ",
        metricValue: "-28%",
        metricLabel: "Waste Saved",
        metricLabelAm: "የቀነሰ ብክነት",
        x: 412,
        y: 445,
        icon: Package,
    },
    {
        id: "people-finance",
        title: "People & HR",
        titleAm: "ሰራተኞች እና HR",
        subtitle: "Hire · Manage",
        subtitleAm: "ቅጥር · አስተዳደር",
        shortDesc:
            "Staff shifts, attendance, tips, and payroll alongside branch P&L, expense vouchers, and permissions.",
        shortDescAm: "ፈረቃ፣ አቴንዳንስ፣ ቲፕ እና ደመወዝ ከቅርንጫፍ ትርፍና ኪሳራ እና ወጪ ማጽደቅ ጋር።",
        bullets: [
            { en: "Shift scheduling & swap logs", am: "የፈረቃ መርሃ-ግብር እና ቅያሬ" },
            { en: "Biometric/PIN clock-in", am: "የጣት አሻራ ወይም PIN መግቢያ" },
            { en: "Automated tip distribution", am: "ፍትሃዊ የቲፕ ክፍፍል" },
            { en: "Daily branch profit & loss", am: "የዕለት ትርፍና ኪሳራ ሪፖርት" },
        ],
        cta: "Manage Team",
        ctaAm: "ሰራተኞችን ያስተዳድሩ",
        metricValue: "99.4%",
        metricLabel: "Payroll Accuracy",
        metricLabelAm: "ትክክለኛ ደመወዝ",
        x: 228,
        y: 445,
        icon: Users,
    },
    {
        id: "marketing",
        title: "Marketing",
        titleAm: "ማርኬቲንግ",
        subtitle: "Reach · Retain",
        subtitleAm: "ድረስ · ያቆዩ",
        shortDesc:
            "Branded direct ordering website, print-ready table QR tents, and loyalty promos that bring guests back.",
        shortDescAm:
            "የራስዎ የማዘዣ ድረ-ገጽ፣ ለህትመት ዝግጁ የሆኑ QR ካርዶች እና ደንበኛ የሚመልሱ ማስተዋወቂያዎች።",
        bullets: [
            { en: "Direct zero-commission ordering", am: "ያለ ኮሚሽን ቀጥታ ማዘዣ" },
            {
                en: "Table QR print-ready exporter",
                am: "ለህትመት ዝግጁ የሆነ የጠረጴዛ QR",
            },
            { en: "SMS & WhatsApp promos", am: "የSMS እና ዋትስአፕ ማስተዋወቂያ" },
            { en: "Loyalty points & cashbacks", am: "የደንበኛ ነጥብ እና ቅናሾች" },
        ],
        cta: "Launch Campaigns",
        ctaAm: "ዘመቻዎችን ይጀምሩ",
        metricValue: "+45%",
        metricLabel: "Repeat Guests",
        metricLabelAm: "ተመላሽ ደንበኞች",
        x: 120,
        y: 310,
        icon: Megaphone,
    },
    {
        id: "ai-insights",
        title: "AI & Insights",
        titleAm: "AI & Insights",
        subtitle: "Smarter Decisions",
        subtitleAm: "ብልህ ውሳኔዎች",
        shortDesc:
            "Get real-time analytics, sales forecasting, and actionable insights to grow your business.",
        shortDescAm: "የቀጥታ ሽያጭ ትንበያ፣ የትርፍ ህዳግ እና ንግድዎን ለማሳደግ ተግባራዊ ምክሮች።",
        bullets: [
            { en: "Sales & performance analytics", am: "የሽያጭ እና አፈጻጸም ትንታኔ" },
            { en: "Demand forecasting", am: "የትዕዛዝ ፍላጎት ትንበያ" },
            { en: "Profitability reports", am: "የምግብ ትርፋማነት ሪፖርት" },
            { en: "Smart recommendations", am: "ብልህ የአሰራር ምክሮች" },
        ],
        cta: "Explore Insights",
        ctaAm: "ትንታኔውን ይመልከቱ",
        metricValue: "+32%",
        metricLabel: "Sales Growth",
        metricLabelAm: "የሽያጭ እድገት",
        x: 155,
        y: 132,
        icon: Cpu,
    },
];

// Center disc coordinates in 640 x 520 space
const CX = 320;
const CY = 260;

export default function LandingConnectedPlatform() {
    const params = useParams();
    const isAm = params?.locale === "am";
    const [activeIndex, setActiveIndex] = useState(5); // Defaults to Marketing (like reference)
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;
        const timer = window.setInterval(() => {
            setActiveIndex(prev => (prev + 1) % MODULES.length);
        }, 5500);
        return () => window.clearInterval(timer);
    }, [isPaused]);

    const selectModule = (idx: number) => {
        setActiveIndex(idx);
    };

    const nextModule = () => {
        setActiveIndex(prev => (prev + 1) % MODULES.length);
    };

    const prevModule = () => {
        setActiveIndex(prev => (prev - 1 + MODULES.length) % MODULES.length);
    };

    const activeMod = MODULES[activeIndex];
    const ActiveIcon = activeMod.icon;

    return (
        <section
            id="connected-platform"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative scroll-mt-24 lg:scroll-mt-28 border-t border-border/60 bg-background text-foreground py-16 lg:py-24 overflow-hidden"
        >
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                    {/* LEFT COLUMN: Header + Detailed Active Module Card + Pagination */}
                    <div className="lg:col-span-5 flex flex-col">
                        {/* Top Pill Tag */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 w-fit">
                            <Sparkles className="size-3.5 text-orange-500" />
                            <span>
                                {isAm
                                    ? "ብልህ የምግብ ቤት መድረክ"
                                    : "Smart Restaurant Platform"}
                            </span>
                        </div>

                        {/* Title & Subtitle */}
                        <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
                            {isAm
                                ? "አንድ የተቀናጀ መድረክ።"
                                : "One connected platform."}
                            <br />
                            <span className="font-serif italic font-normal text-orange-600 dark:text-orange-500">
                                {isAm
                                    ? "ምግብ ቤትዎን በብልሃት ይምሩ።"
                                    : "Run your restaurant smarter."}
                            </span>
                        </h2>

                        <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
                            {isAm
                                ? "ትዕዛዝ፣ ኩሽና እና ዴሊቨሪን በቀጥታ በRestorch ያስተዳድሩ — ሁሉም በአንድ ጠንካራ መድረክ።"
                                : "Manage orders, kitchen, and delivery in real-time with Restorch — all in one powerful platform."}
                        </p>

                        {/* Active Module Detailed Card */}
                        <div className="mt-6 rounded-3xl border border-border/80 dark:border-white/10 bg-white/95 dark:bg-[#111827]/95 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 min-h-[380px] flex flex-col justify-between">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeMod.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{
                                        duration: 0.28,
                                        ease: "easeOut",
                                    }}
                                    className="flex flex-col flex-1 justify-between"
                                >
                                    <div>
                                        {/* Card Header: Icon + Title + Active Tag */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                                                    <ActiveIcon className="size-5.5 stroke-[2.2]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                                                        {isAm
                                                            ? activeMod.titleAm
                                                            : activeMod.title}
                                                    </h3>
                                                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                                        {isAm
                                                            ? activeMod.subtitleAm
                                                            : activeMod.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                                <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                <span>
                                                    {isAm ? "ንቁ" : "Active"}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                                            {isAm
                                                ? activeMod.shortDescAm
                                                : activeMod.shortDesc}
                                        </p>

                                        {/* Bullets List & Mini Chart Mockup Graphic */}
                                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                                            {/* 4 Checkmark Bullets */}
                                            <ul className="sm:col-span-7 space-y-2">
                                                {activeMod.bullets.map(
                                                    (b, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground"
                                                        >
                                                            <div className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                                                                <Check className="size-3 stroke-[3]" />
                                                            </div>
                                                            <span>
                                                                {isAm
                                                                    ? b.am
                                                                    : b.en}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>

                                            {/* Mini Chart Card Mockup */}
                                            <div className="sm:col-span-5 relative rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 dark:from-[#1b2234] dark:to-[#141b29] p-3.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                        {isAm
                                                            ? activeMod.metricLabelAm
                                                            : activeMod.metricLabel}
                                                    </span>
                                                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        <TrendingUp className="size-3" />
                                                        {activeMod.metricValue}
                                                    </span>
                                                </div>
                                                {/* Mini SVG line sparkline & donut */}
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <svg
                                                        viewBox="0 0 100 40"
                                                        className="h-9 w-20 overflow-visible text-orange-500"
                                                    >
                                                        <path
                                                            d="M5,35 Q25,32 45,20 T85,8 L95,6"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                        />
                                                        <circle
                                                            cx="95"
                                                            cy="6"
                                                            r="3"
                                                            fill="#f97316"
                                                        />
                                                    </svg>
                                                    <div className="relative size-8 shrink-0">
                                                        <svg
                                                            viewBox="0 0 36 36"
                                                            className="size-8 -rotate-90"
                                                        >
                                                            <circle
                                                                cx="18"
                                                                cy="18"
                                                                r="14"
                                                                fill="none"
                                                                stroke="#e2e8f0"
                                                                strokeWidth="4"
                                                                className="dark:stroke-slate-700"
                                                            />
                                                            <circle
                                                                cx="18"
                                                                cy="18"
                                                                r="14"
                                                                fill="none"
                                                                stroke="#f97316"
                                                                strokeWidth="4"
                                                                strokeDasharray="65 100"
                                                                strokeLinecap="round"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Action Button */}
                                    <div className="mt-5 pt-4 border-t border-border/60">
                                        <a
                                            href="#contact"
                                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <span>
                                                {isAm
                                                    ? activeMod.ctaAm
                                                    : activeMod.cta}
                                            </span>
                                            <ArrowRight className="size-4" />
                                        </a>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Pagination Indicators & Controls */}
                        <div className="mt-6 flex items-center justify-between">
                            {/* Pill Dots */}
                            <div className="flex items-center gap-2">
                                {MODULES.map((m, idx) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectModule(idx)}
                                        aria-label={m.title}
                                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                            idx === activeIndex
                                                ? "w-7 bg-orange-500"
                                                : "w-2 bg-border hover:bg-muted-foreground/40"
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Prev / Next Circular Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={prevModule}
                                    aria-label="Previous module"
                                    className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-card hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextModule}
                                    aria-label="Next module"
                                    className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-card hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Pixel-Perfect Radial Diagram Matching Reference Image with Live Animations */}
                    <div className="lg:col-span-7 flex items-center justify-center">
                        <div className="relative w-full max-w-[640px] aspect-[640/520] select-none">
                            {/* SVG Dotted Orbit Ring & Radial Spoke Lines */}
                            <svg
                                viewBox="0 0 640 520"
                                className="absolute inset-0 h-full w-full pointer-events-none overflow-visible"
                            >
                                {/* Animated Dotted Circular Orbit Ring passing through satellite centers */}
                                <motion.circle
                                    cx={CX}
                                    cy={CY}
                                    r={205}
                                    fill="none"
                                    stroke="#fed7aa"
                                    strokeWidth="1.2"
                                    strokeDasharray="4 6"
                                    className="dark:stroke-orange-950/40"
                                    animate={{ strokeDashoffset: [0, -30] }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                />

                                {/* Inactive Spokes */}
                                {MODULES.map((m, idx) => {
                                    if (idx === activeIndex) return null;
                                    return (
                                        <line
                                            key={m.id}
                                            x1={CX}
                                            y1={CY}
                                            x2={m.x}
                                            y2={m.y}
                                            stroke="#ffedd5"
                                            strokeWidth="1.2"
                                            className="dark:stroke-orange-950/30"
                                        />
                                    );
                                })}

                                {/* Active Vibrant Orange Spoke Line (Smooth Spring Line to selected pill) */}
                                <motion.line
                                    x1={CX}
                                    y1={CY}
                                    animate={{
                                        x2: activeMod.x,
                                        y2: activeMod.y,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 28,
                                    }}
                                    stroke="#ea580c"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />

                                {/* Outer Soft Glow Halo traveling along active spoke */}
                                <motion.circle
                                    key={`halo-${activeMod.id}`}
                                    animate={{
                                        cx: [CX, activeMod.x],
                                        cy: [CY, activeMod.y],
                                        opacity: [0, 0.45, 0],
                                    }}
                                    transition={{
                                        duration: 3.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    r="7"
                                    fill="#f97316"
                                />

                                {/* Glowing Pulse Bead traveling along active spoke (Calm, Elegant Pace) */}
                                <motion.circle
                                    key={`dot-${activeMod.id}`}
                                    animate={{
                                        cx: [CX, activeMod.x],
                                        cy: [CY, activeMod.y],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 3.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    r="3.8"
                                    fill="#ea580c"
                                />
                            </svg>

                            {/* Center Restorch Hub with Breathing Ripple and Floating Glow */}
                            <div
                                style={{
                                    left: `${(CX / 640) * 100}%`,
                                    top: `${(CY / 520) * 100}%`,
                                }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 pointer-events-none select-none"
                            >
                                {/* Continuous Circular Water Ripple Waves (Fluid swell, crest, and soft shore dissolve) */}
                                {[0, 1.3, 2.6].map((delay, idx) => (
                                    <motion.div
                                        key={idx}
                                        animate={{
                                            scale: [0.92, 1.65],
                                            opacity: [0, 0.6, 0.3, 0],
                                        }}
                                        transition={{
                                            duration: 3.9,
                                            delay: delay,
                                            repeat: Infinity,
                                            ease: [0.22, 1, 0.36, 1],
                                            times: [0, 0.25, 0.65, 1],
                                        }}
                                        className="absolute size-38 sm:size-44 rounded-full border border-orange-500/50 dark:border-orange-400/40 bg-gradient-to-r from-orange-500/[0.05] via-amber-500/[0.06] to-orange-500/[0.03] shadow-[0_0_16px_rgba(249,115,22,0.22)] pointer-events-none"
                                    />
                                ))}

                                {/* Outer Translucent Warm Ring with Subtle Breathing */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.03, 1],
                                        opacity: [0.92, 1, 0.92],
                                    }}
                                    transition={{
                                        duration: 3.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="size-38 sm:size-44 rounded-full border border-orange-200/60 dark:border-orange-900/40 bg-[#FFF5ED] dark:bg-[#2A180E] flex items-center justify-center"
                                >
                                    {/* Inner White Core Disc */}
                                    <div className="size-28 sm:size-32 rounded-full bg-white dark:bg-[#121826] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center p-2">
                                        {/* Orange Badge with Bold "R" */}
                                        <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-b from-[#f97316] to-[#ea580c] flex items-center justify-center text-white font-black text-base sm:text-lg shadow-xs leading-none">
                                            R
                                        </div>
                                        <span className="mt-1.5 font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                                            Restorch
                                        </span>
                                        <span className="text-[8px] sm:text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1 leading-none">
                                            {isAm
                                                ? "ቀጥታ ስርዓት"
                                                : "REAL-TIME CORE"}
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* 7 Cleanly Arranged Satellite Capsule Pills with Micro-Interactions */}
                            {MODULES.map((m, idx) => {
                                const isActive = idx === activeIndex;
                                const Icon = m.icon;

                                return (
                                    <motion.button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectModule(idx)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.96 }}
                                        animate={{
                                            scale: isActive ? 1.06 : 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 350,
                                            damping: 25,
                                        }}
                                        style={{
                                            left: `${(m.x / 640) * 100}%`,
                                            top: `${(m.y / 520) * 100}%`,
                                        }}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 sm:gap-3 rounded-full transition-colors duration-300 ease-out cursor-pointer z-30 select-none ${
                                            isActive
                                                ? "px-4 py-2 sm:px-4.5 sm:py-2.5 bg-gradient-to-r from-[#d9480f] to-[#ea580c] text-white shadow-[0_8px_24px_rgba(217,72,15,0.38)]"
                                                : "px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-[#121826] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:border-orange-500/40"
                                        }`}
                                    >
                                        {/* Circular Icon Container */}
                                        <div
                                            className={`flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                                                isActive
                                                    ? "bg-black/15 text-white"
                                                    : "bg-[#FFF5ED] dark:bg-orange-950/40 text-[#ea580c]"
                                            }`}
                                        >
                                            <Icon className="size-3.5 sm:size-4 stroke-[2]" />
                                        </div>

                                        {/* Pill Text */}
                                        <span
                                            className={`text-xs sm:text-[13px] tracking-tight whitespace-nowrap ${
                                                isActive
                                                    ? "font-bold text-white"
                                                    : "font-semibold"
                                            }`}
                                        >
                                            {isAm ? m.titleAm : m.title}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
