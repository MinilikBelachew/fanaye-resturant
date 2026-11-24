"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "framer-motion";
import {
    LayoutGrid,
    Smartphone,
    QrCode,
    Tv,
    Boxes,
    TrendingUp,
    CheckCircle2,
    Sparkles,
    ArrowRight,
} from "lucide-react";

interface FeatureItem {
    id: string;
    num: string;
    tag: string;
    tagAm: string;
    title: string;
    titleAm: string;
    subtitle: string;
    subtitleAm: string;
    desc: string;
    descAm: string;
    highlight: string;
    highlightAm: string;
    image: string;
    icon: React.ComponentType<{ className?: string }>;
}

const FEATURES: FeatureItem[] = [
    {
        id: "table-floor-management",
        num: "01",
        tag: "FLOOR & SEATING INTELLIGENCE",
        tagAm: "የአዳራሽ እና ጠረጴዛ አስተዳደር",
        title: "Table & Floor Management",
        titleAm: "የአዳራሽ እና የጠረጴዛ አስተዳደር",
        subtitle:
            "Multi-zone floor plans with live table status and VIP rules.",
        subtitleAm: "የተከፋፈሉ ዞኖች፣ የቀጥታ ጠረጴዛ ሁኔታ እና የVIP ልዩ ዋጋዎች።",
        desc: "Configure custom zones (Indoor, Patio, Terrace, VIP Lounge, Bar) with live seating states, shift-based waiter station assignments, and dedicated VIP lounge surcharge rules.",
        descAm: "ዞኖችን (ዋና አዳራሽ፣ በረንዳ፣ ቴራስ፣ VIP ላውንጅ፣ ባር) ይቆጣጠሩ፤ የጠረጴዛዎችን ሁኔታ በቀጥታ ይመልከቱ እና የVIP ልዩ ተመኖችን ያስተዳድሩ።",
        highlight: "5 Dynamic Zones · Real-Time Table Monitoring",
        highlightAm: "5 ዞኖች · የቀጥታ የጠረጴዛ ሁኔታ ክትትል",
        image: "/images/landing/features/table-floor-management.jpg",
        icon: LayoutGrid,
    },
    {
        id: "waiter-pos",
        num: "02",
        tag: "HANDHELD TABLE-SIDE POS",
        tagAm: "የአስተናጋጅ ስልክ POS",
        title: "Ordering & Waiter POS",
        titleAm: "የትዕዛዝ እና የአስተናጋጅ POS",
        subtitle:
            "Fast table-side ordering with seat modifiers and approval workflows.",
        subtitleAm: "በስልክ ፈጣን ትዕዛዝ ማዘዣ፣ ማስተካከያዎች እና የኃላፊ ማጽደቂያ።",
        desc: "Quick category browsing, item search, and seat-specific ordering with cooking preferences. Manager approval workflows protect against unauthorized item cancellations.",
        descAm: "በምድብ በቀላሉ ይፈልጉ፣ የመቀመጫ ትዕዛዞችን ያከናውኑ እና የደንበኛ ምርጫዎችን ይመዝግቡ። ያልተፈቀዱ የስረዛ ጥያቄዎች በኃላፊ ፈቃድ ብቻ ይከናወናሉ።",
        highlight: "Instant Push Alerts · Zero Walk-Around Delay",
        highlightAm: "ፈጣን የስልክ ጥሪ · ፈጣን የአዳራሽ አገልግሎት",
        image: "/images/landing/features/waiter-pos.jpg",
        icon: Smartphone,
    },
    {
        id: "qr-self-ordering",
        num: "03",
        tag: "CONTACTLESS DINE-IN",
        tagAm: "የጠረጴዛ QR ዲጂታል ማዘዣ",
        title: "QR Menu & Self-Ordering",
        titleAm: "የQR ሜኑ እና ቀጥታ ማዘዣ",
        subtitle:
            "Interactive table QR menu with built-in dashboard phone simulator.",
        subtitleAm: "በስልክ የሚቃኝ ዲጂታል ሜኑ እና የቀጥታ ማዘዣ ስርዓት።",
        desc: "Guests scan table QR codes to browse mobile-optimized menus and place dine-in orders directly to the POS/kitchen. Includes printable QR code builder.",
        descAm: "እንግዶች የጠረጴዛውን QR በስልካቸው በመቃኘት ምግቦችን በቀጥታ ወደ ኩሽና ማዘዝ ይችላሉ። ለህትመት ዝግጁ የሆነ የQR ንድፍ ማውጫ ያካትታል።",
        highlight: "Print-Ready QR Builder · Live Phone Preview",
        highlightAm: "ለህትመት ዝግጁ QR · የቀጥታ የስልክ ቅድመ-ዕይታ",
        image: "/images/landing/features/qr-self-ordering.jpg",
        icon: QrCode,
    },
    {
        id: "kitchen-kds",
        num: "04",
        tag: "STATION KDS ROUTING",
        tagAm: "የኩሽና ስርጭት (KDS)",
        title: "Kitchen KDS & Routing",
        titleAm: "የኩሽና KDS እና የምድብ ስርጭት",
        subtitle:
            "Automatic station routing with 4-stage pipeline and burn logging.",
        subtitleAm: "ትዕዛዝ በምድብ መከፋፈል፣ ባለ 4-ደረጃ ሂደት እና የብክነት መመዝገቢያ።",
        desc: "Orders automatically split to Grill, Barista, Cakes, and Drinks screens. Features a 4-stage pipeline (Pending → Prep → Ready → Dispatched) and exception alerts.",
        descAm: "ትዕዛዞች በቀጥታ ወደ ጥብስ፣ ባሪስታ፣ ኬክ እና መጠጥ ስክሪን ይከፋፈላሉ። የቀጥታ የማብሰያ ሰዓት ቆጣሪ እና የጉዳት/ብክነት ማስጠንቀቂያ አለው።",
        highlight: "Pending → Prep → Ready → Dispatched in < 8 min",
        highlightAm: "ዝግጅት → ዝግጁ → ማውጫ በ < 8 ደቂቃ",
        image: "/images/landing/features/kitchen-kds.jpg",
        icon: Tv,
    },
    {
        id: "inventory-costing",
        num: "05",
        tag: "RECIPE BOM & STOCK AUDIT",
        tagAm: "የስቶር ክምችት እና የረሲፒ ወጪ",
        title: "Inventory & Recipe Costing",
        titleAm: "የስቶር ክምችት እና የረሲፒ ወጪ",
        subtitle:
            "BOM recipe stock deduction, fresh prep batches, and yield testing.",
        subtitleAm: "በምግብ ረሲፒ ትክክለኛ የግብዓት ቅነሳ፣ የብክነት እና ክምችት ቁጥጥር።",
        desc: "Dedicated store manager portal with multi-unit conversions (kg to g, liters to ml), automatic FIFO stock deduction, intermediate prep batches, and physical stock count audits.",
        descAm: "የተሟላ የስቶር አስተዳደር፣ በግራም ትክክለኛ የረሲፒ ቅነሳ (ስጋ፣ ሽንኩርት፣ ዘይት)፣ የፈረቃ ቅበላ እና የአነስተኛ ክምችት ፈጣን ማስጠንቀቂያ።",
        highlight: "Gram-Accurate FIFO · Automated Store Low-Stock Alert",
        highlightAm: "በግራም ትክክለኛ ቅነሳ · የአነስተኛ ክምችት ማስጠንቀቂያ",
        image: "/images/landing/features/inventory-store-stock.jpg",
        icon: Boxes,
    },
    {
        id: "menu-engineering",
        num: "06",
        tag: "PROFIT & POPULARITY MATRIX",
        tagAm: "የሜኑ ትርፋማነት ትንታኔ (BCG)",
        title: "Menu Engineering (BCG Matrix)",
        titleAm: "የሜኑ ትርፋማነት ትንታኔ",
        subtitle:
            "Classifies dishes into Stars, Plowhorses, Puzzles, and Dogs.",
        subtitleAm: "ምግቦችን በትርፍ እና ተወዳጅነት በመመደብ የዋጋ ማስተካከያ ምክር።",
        desc: "Analyze every dish's profitability and volume. Identifies top money-makers (Stars), high-volume margin killers (Plowhorses), and provides actionable pricing recommendations.",
        descAm: "የእያንዳንዱን ምግብ ትርፍ እና ተወዳጅነት በራስ-ሰር ይተነትናል። አትራፊ ምግቦችን (Stars) እና ትርፍ የማይሰጡትን በመለየት ትክክለኛ የዋጋ ማስተካከያ ይሰጣል።",
        highlight: "Stars · Plowhorses · Puzzles · Dogs Optimization",
        highlightAm: "ኮከብ ምግቦች · የዋጋ ማስተካከያ ትንታኔ",
        image: "/images/landing/features/menu-engineering-matrix.jpg",
        icon: TrendingUp,
    },
];

export default function LandingBentoFeatures() {
    const params = useParams();
    const isAm = params?.locale === "am";
    const [activeIndex, setActiveIndex] = useState(0);
    const [indicatorY, setIndicatorY] = useState(24);

    const sectionRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Calculate mouse indicator Y position aligned with active tab
    const updateIndicator = () => {
        const el = tabRefs.current[activeIndex];
        if (el) {
            setIndicatorY(el.offsetTop + 18);
        }
    };

    useEffect(() => {
        updateIndicator();
        const timer = setTimeout(updateIndicator, 60);
        window.addEventListener("resize", updateIndicator);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateIndicator);
        };
    }, [activeIndex]);

    // Track scroll progression through the pinned section
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    // Map scroll position directly to the active feature with smooth thresholding
    useMotionValueEvent(scrollYProgress, "change", latest => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) {
            const activeScrollRange = 0.9;
            const normalized = Math.min(
                1,
                Math.max(0, latest / activeScrollRange),
            );
            const newIndex = Math.min(
                FEATURES.length - 1,
                Math.floor(normalized * FEATURES.length),
            );
            setActiveIndex(newIndex);
        }
    });

    const selectFeature = (idx: number) => {
        setActiveIndex(idx);
        if (
            sectionRef.current &&
            typeof window !== "undefined" &&
            window.innerWidth >= 1024
        ) {
            const rect = sectionRef.current.getBoundingClientRect();
            const totalScrollable =
                sectionRef.current.scrollHeight - window.innerHeight;
            const targetProgress = (idx / (FEATURES.length - 1)) * 0.9;
            const targetY =
                window.scrollY + rect.top + targetProgress * totalScrollable;
            window.scrollTo({ top: targetY, behavior: "smooth" });
        }
    };

    const activeItem = FEATURES[activeIndex];

    return (
        <section
            ref={sectionRef}
            id="features"
            className="relative scroll-mt-20 lg:scroll-mt-24 border-t border-border/60 bg-background text-foreground lg:h-[340vh] pb-12 lg:pb-20"
        >
            {/* Sticky viewport container (Pins while user scrolls through all 6 features) */}
            <div className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] flex flex-col justify-center py-6 lg:py-2">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="max-w-2xl text-left">
                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                            <Sparkles className="size-3 text-orange-500" />
                            <span>
                                {isAm ? "የአገር ውስጥ ብልጫ" : "Local Advantage"}
                            </span>
                        </div>

                        <h2 className="mt-1.5 text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight leading-[1.12]">
                            {isAm
                                ? "የሚያስፈልግዎ ሁሉ በአንድ ቦታ።"
                                : "Everything you need."}
                            <br />
                            <span className="font-serif italic font-normal text-orange-600 dark:text-orange-500">
                                {isAm
                                    ? "ለኢትዮጵያ መስተንግዶ የተዘጋጀ።"
                                    : "Built for real-world hospitality."}
                            </span>
                        </h2>

                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-1 sm:line-clamp-2">
                            {isAm
                                ? "የውጭ ሀገር POS ሲስተሞች ኢንተርኔት ሲጠፋ ይቆማሉ፣ የቴሌብር/ባንክ ክፍያን አያመሳክሩም፣ እና ውድ ተርሚናሎችን ያስገድዳሉ። Restorch በትክክለኛው አሰራርዎ ላይ ተመስርቶ የተሰራ ነው።"
                                : "Generic foreign POS tools break when Wi-Fi drops, miss local mobile transfers, and lock you into expensive terminals. Restorch is built for how you actually operate."}
                        </p>
                    </div>

                    {/* Teftef-Style Split Layout */}
                    <div className="mt-4 lg:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
                        {/* LEFT COLUMN: Timeline Track + Accordion Feature Tabs */}
                        <div className="lg:col-span-5 relative flex gap-3 sm:gap-3.5 items-start">
                            {/* Vertical Timeline Track Line */}
                            <div className="relative w-5 shrink-0 self-stretch my-0.5 select-none">
                                {/* Full height thin gray track */}
                                <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-[2px] bg-slate-200 dark:bg-slate-700/60 rounded-full" />

                                {/* Top orange line reaching down to mouse indicator */}
                                <motion.div
                                    animate={{
                                        height: Math.max(0, indicatorY),
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 340,
                                        damping: 32,
                                    }}
                                    className="absolute top-2 left-1/2 -translate-x-1/2 w-[2px] bg-orange-500 rounded-full"
                                />

                                {/* Mouse-Like Pill Indicator */}
                                <motion.div
                                    animate={{
                                        top: indicatorY,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 340,
                                        damping: 32,
                                    }}
                                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-[18px] h-[28px] rounded-full border-2 border-orange-500 bg-white dark:bg-[#0E131E] shadow-[0_0_12px_rgba(249,115,22,0.25)]"
                                >
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-3.5 bg-orange-500 pointer-events-none" />

                                    {/* Inner Scroll Wheel Pill */}
                                    <motion.span
                                        animate={{
                                            y: [-1.5, 1.5, -1.5],
                                        }}
                                        transition={{
                                            duration: 1.8,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className="w-[2.5px] h-[6px] rounded-full bg-orange-400"
                                    />
                                </motion.div>
                            </div>

                            {/* Stack of Feature Tabs */}
                            <div className="flex-1 space-y-1.5">
                                {FEATURES.map((item, idx) => {
                                    const isActive = idx === activeIndex;
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.id}
                                            ref={el => {
                                                tabRefs.current[idx] = el;
                                            }}
                                            onClick={() => selectFeature(idx)}
                                            className={`group rounded-xl transition-all duration-300 cursor-pointer ${
                                                isActive
                                                    ? "border-2 border-orange-500 bg-white dark:bg-[#121826] p-3 shadow-sm"
                                                    : "border border-border/70 bg-card/50 hover:bg-card hover:border-orange-500/40 py-2 px-3"
                                            }`}
                                        >
                                            {/* Tab Header Row */}
                                            <div className="flex items-center justify-between gap-2.5">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                                                            isActive
                                                                ? "bg-orange-500 text-white"
                                                                : "bg-secondary text-muted-foreground group-hover:text-foreground"
                                                        }`}
                                                    >
                                                        <Icon className="size-3.5 stroke-[2]" />
                                                    </div>
                                                    <h3
                                                        className={`truncate text-[13px] sm:text-sm font-bold tracking-tight transition-colors ${
                                                            isActive
                                                                ? "text-foreground"
                                                                : "text-muted-foreground group-hover:text-foreground"
                                                        }`}
                                                    >
                                                        {isAm
                                                            ? item.titleAm
                                                            : item.title}
                                                    </h3>
                                                </div>

                                                {/* Number Badge */}
                                                <span
                                                    className={`font-mono text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                                                        isActive
                                                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold"
                                                            : "text-muted-foreground/60"
                                                    }`}
                                                >
                                                    {item.num}
                                                </span>
                                            </div>

                                            {/* Expanded Description when active */}
                                            {isActive && (
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        height: 0,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        height: "auto",
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        height: 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.22,
                                                    }}
                                                    className="mt-1.5 pt-1.5 border-t border-border/60 text-xs text-muted-foreground leading-relaxed"
                                                >
                                                    <p className="line-clamp-2">
                                                        {isAm
                                                            ? item.descAm
                                                            : item.desc}
                                                    </p>
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                                                        <CheckCircle2 className="size-3 shrink-0" />
                                                        <span className="truncate">
                                                            {isAm
                                                                ? item.highlightAm
                                                                : item.highlight}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Synced High-Impact Showcase Card */}
                        <div className="lg:col-span-7">
                            <div className="relative rounded-3xl border border-border/80 dark:border-white/10 overflow-hidden bg-card dark:bg-[#0E131E] h-[360px] sm:h-[390px] lg:h-[415px] flex flex-col justify-end p-5 sm:p-7 lg:p-8">
                                {/* Crossfading Background Image with subtle zoom */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeItem.id}
                                        initial={{ opacity: 0, scale: 1.03 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.45 }}
                                        className="absolute inset-0 z-0"
                                    >
                                        <Image
                                            src={activeItem.image}
                                            alt={activeItem.title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 60vw"
                                            className="object-cover object-center"
                                            priority
                                        />
                                        {/* Multi-tier gradient overlay for maximum readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Foreground Content Card overlay at bottom */}
                                <div className="relative z-10 text-white max-w-xl">
                                    {/* Category Pill Tag */}
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-white">
                                        <span>
                                            {isAm
                                                ? activeItem.tagAm
                                                : activeItem.tag}
                                        </span>
                                    </div>

                                    {/* Title & Subtitle */}
                                    <h3 className="mt-2 text-xl sm:text-2xl lg:text-[25px] font-bold tracking-tight text-white leading-tight">
                                        {isAm
                                            ? activeItem.titleAm
                                            : activeItem.title}
                                    </h3>

                                    <p className="mt-1 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium line-clamp-2">
                                        {isAm
                                            ? activeItem.subtitleAm
                                            : activeItem.subtitle}
                                    </p>

                                    {/* Live Operational Metric Highlight Chip */}
                                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-md text-xs font-mono font-semibold text-white">
                                        <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                                        <span>
                                            {isAm
                                                ? activeItem.highlightAm
                                                : activeItem.highlight}
                                        </span>
                                    </div>

                                    {/* Action link */}
                                    <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-white/15">
                                        <span className="text-[11px] font-mono text-slate-300 uppercase tracking-widest">
                                            RESTORCH OS · {activeItem.num} / 06
                                        </span>
                                        <a
                                            href="#contact"
                                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                                        >
                                            <span>
                                                {isAm
                                                    ? "ስርዓቱን ይሞክሩ"
                                                    : "Explore Feature"}
                                            </span>
                                            <ArrowRight className="size-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
