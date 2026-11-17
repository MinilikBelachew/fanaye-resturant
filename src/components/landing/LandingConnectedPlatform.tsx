"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
    UtensilsCrossed,
    ChefHat,
    Truck,
    Package,
    Users,
    Megaphone,
    Cpu,
    Wallet,
} from "lucide-react";

interface PlatformModule {
    id: string;
    title: string;
    titleAm: string;
    subtitle: string;
    subtitleAm: string;
    shortDesc: string;
    shortDescAm: string;
    angleDeg: number;
    icon: React.ComponentType<{ className?: string }>;
}

const MODULES: PlatformModule[] = [
    {
        id: "front-of-house",
        title: "Front of House",
        titleAm: "የአዳራሽ አገልግሎት",
        subtitle: "Tables · POS · QR",
        subtitleAm: "ጠረጴዛዎች · POS · QR",
        shortDesc:
            "Live floor maps, waiter POS, and QR ordering. Synced to the kitchen the instant a guest orders.",
        shortDescAm:
            "ቀጥታ የጠረጴዛ ካርታ፣ የአስተናጋጅ POS እና የQR ማዘዣ። ትዕዛዝ በተሰጠበት ቅጽበት ወደ ኩሽና ይደርሳል።",
        angleDeg: -65,
        icon: UtensilsCrossed,
    },
    {
        id: "kitchen",
        title: "Kitchen",
        titleAm: "ኩሽና (KDS)",
        subtitle: "KDS · Routing",
        subtitleAm: "KDS · ስርጭት",
        shortDesc:
            "Automatic station routing, prep timers, and pass control. Zero paper tickets or shouting.",
        shortDescAm:
            "ቀጥታ የምድብ ስርጭት፣ የዝግጅት ሰዓት ቆጣሪ እና የማውጫ ቁጥጥር። ያለ ወረቀት እና ያለ ጩኸት።",
        angleDeg: -20,
        icon: ChefHat,
    },
    {
        id: "delivery-hotel",
        title: "Delivery & Hotel",
        titleAm: "ዴሊቨሪ እና ሆቴል",
        subtitle: "Dispatch · Rooms",
        subtitleAm: "ዴሊቨሪ · ክፍሎች",
        shortDesc:
            "Driver dispatch and hotel room folios in one flow. Real-time status from pass to doorstep.",
        shortDescAm:
            "የአሽከርካሪ ስርጭት እና የሆቴል ክፍል ሂሳብ በአንድ መስመር። ከኩሽና እስከ ደጃፍ ቀጥታ ክትትል።",
        angleDeg: 22,
        icon: Truck,
    },
    {
        id: "inventory",
        title: "Inventory",
        titleAm: "ክምችት እና ስቶር",
        subtitle: "Recipes · Stock",
        subtitleAm: "ረሲፒ · ክምችት",
        shortDesc:
            "Recipe-level stock deduction as dishes sell. Low-stock alerts before key items run out.",
        shortDescAm:
            "ምግቦች ሲሸጡ ግብዓቶች በረሲፒ መጠን በራስ-ሰር ይቀነሳሉ። እቃዎች ሳያልቁ ማስጠንቀቂያ ይሰጣል።",
        angleDeg: 67,
        icon: Package,
    },
    {
        id: "people-finance",
        title: "People & Finance",
        titleAm: "ሰራተኞች እና ፋይናንስ",
        subtitle: "HR · Payroll",
        subtitleAm: "HR · ደመወዝ",
        shortDesc:
            "Shifts, attendance, tips, and payroll alongside branch P&L and expense approvals.",
        shortDescAm: "ፈረቃ፣ አቴንዳንስ፣ ቲፕ እና ደመወዝ ከቅርንጫፍ ትርፍና ኪሳራ እና ወጪ ማጽደቅ ጋር።",
        angleDeg: 113,
        icon: Users,
    },
    {
        id: "marketing",
        title: "Marketing",
        titleAm: "ማርኬቲንግ",
        subtitle: "Website · Print",
        subtitleAm: "ድረ-ገጽ · ህትመት",
        shortDesc:
            "Branded ordering site, print-ready QR tents, and promos that bring guests back directly.",
        shortDescAm:
            "የራስዎ የማዘዣ ድረ-ገጽ፣ ለህትመት ዝግጁ የሆኑ QR ካርዶች እና ደንበኛ የሚመልሱ ማስተዋወቂያዎች።",
        angleDeg: 158,
        icon: Megaphone,
    },
    {
        id: "ai-insights",
        title: "AI & Insights",
        titleAm: "AI እና ትንታኔ",
        subtitle: "Advisor · Menu",
        subtitleAm: "አማካሪ · ሜኑ",
        shortDesc:
            "Margin advisor, dish profitability, and demand forecasting. Chosen for decisions, not noise.",
        shortDescAm:
            "የትርፍ ህዳግ አማካሪ፣ የምግብ ትርፋማነት እና የፍላጎት ትንበያ። ለትክክለኛ ውሳኔ የተዘጋጀ።",
        angleDeg: 202,
        icon: Cpu,
    },
    {
        id: "payments-cash",
        title: "Payments & Cash",
        titleAm: "ክፍያ እና ካሼር",
        subtitle: "Billing · Z-Report",
        subtitleAm: "ሂሳብ · Z-Report",
        shortDesc:
            "Split bills, mobile money, and shift Z-Reports. Every birr reconciled at close.",
        shortDescAm:
            "የተከፋፈለ ሂሳብ፣ ቴሌብር/ባንክ እና የፈረቃ Z-Report። እያንዳንዱ ብር በመዝጊያ ይመሳከራል።",
        angleDeg: 247,
        icon: Wallet,
    },
];

// SVG coordinate space (640 x 560)
const CX = 320;
const CY = 280;
const ORBIT_R = 206;
const HUB_EDGE_R = 70;
const CARD_STOP_R = 152;

function polar(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
        x: CX + Math.cos(rad) * radius,
        y: CY + Math.sin(rad) * radius,
    };
}

export default function LandingConnectedPlatform() {
    const isAm = useLocale() === "am";
    const [activeIndex, setActiveIndex] = useState(0);
    const [beamProgress, setBeamProgress] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const targetProgressRef = useRef(1);
    const currentProgressRef = useRef(1);

    useEffect(() => {
        let rafId = 0;
        let isDisposed = false;

        const tick = () => {
            if (isDisposed) return;
            const diff = targetProgressRef.current - currentProgressRef.current;
            if (Math.abs(diff) > 0.002) {
                currentProgressRef.current += diff * 0.12;
                setBeamProgress(currentProgressRef.current);
            }
            rafId = window.requestAnimationFrame(tick);
        };

        rafId = window.requestAnimationFrame(tick);
        return () => {
            isDisposed = true;
            window.cancelAnimationFrame(rafId);
        };
    }, []);

    useEffect(() => {
        if (isPaused) return;
        const timer = window.setInterval(() => {
            setActiveIndex(prev => (prev + 1) % MODULES.length);
            currentProgressRef.current = 0.05;
            targetProgressRef.current = 1;
        }, 2800);
        return () => window.clearInterval(timer);
    }, [isPaused]);

    const selectModule = (idx: number) => {
        setActiveIndex(idx);
        currentProgressRef.current = 0.05;
        targetProgressRef.current = 1;
    };

    // Straight glowing arrow from center hub edge outward to the active card
    const angle = MODULES[activeIndex].angleDeg;
    const startPt = polar(angle, HUB_EDGE_R);
    const curRadius = HUB_EDGE_R + (CARD_STOP_R - HUB_EDGE_R) * beamProgress;
    const endPt = polar(angle, curRadius);
    const rad = (angle * Math.PI) / 180;
    const headLen = 11;
    const headAngle = 0.45;
    const ax1 = endPt.x - headLen * Math.cos(rad - headAngle);
    const ay1 = endPt.y - headLen * Math.sin(rad - headAngle);
    const ax2 = endPt.x - headLen * Math.cos(rad + headAngle);
    const ay2 = endPt.y - headLen * Math.sin(rad + headAngle);

    return (
        <section
            id="connected-platform"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative border-t border-border/60 bg-background text-foreground py-16 lg:py-24"
        >
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                    {/* LEFT COLUMN: Single active module explanation with larger title & text */}
                    <div className="lg:col-span-5 flex flex-col">
                        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
                            {isAm
                                ? "አንድ የተቀናጀ መድረክ። "
                                : "One connected platform. "}
                            <span className="font-serif italic font-normal text-orange-600 dark:text-orange-500">
                                {isAm
                                    ? "ሁሉም ስክሪኖች በአንድነት።"
                                    : "Every screen in sync."}
                            </span>
                        </h2>

                        <div
                            key={MODULES[activeIndex].id}
                            className="mt-10 border-t border-border/60 pt-8 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                                    {String(activeIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">
                                    {isAm
                                        ? MODULES[activeIndex].subtitleAm
                                        : MODULES[activeIndex].subtitle}
                                </span>
                            </div>

                            <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
                                {isAm
                                    ? MODULES[activeIndex].titleAm
                                    : MODULES[activeIndex].title}
                            </h3>

                            <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted-foreground">
                                {isAm
                                    ? MODULES[activeIndex].shortDescAm
                                    : MODULES[activeIndex].shortDesc}
                            </p>
                        </div>

                        <div className="mt-8 flex items-center gap-2">
                            {MODULES.map((m, idx) => {
                                const isActive = idx === activeIndex;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectModule(idx)}
                                        aria-label={m.title}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            isActive
                                                ? "w-8 bg-orange-500"
                                                : idx < activeIndex
                                                  ? "w-3 bg-orange-500/40 hover:bg-orange-500/70"
                                                  : "w-3 bg-border hover:bg-muted-foreground/50"
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Radial Hub & Spoke Diagram */}
                    <div className="lg:col-span-7 relative">
                        <div className="hidden md:block relative mx-auto w-full max-w-[640px] aspect-[640/560]">
                            <svg
                                viewBox="0 0 640 560"
                                className="absolute inset-0 h-full w-full pointer-events-none"
                                aria-hidden="true"
                            >
                                <defs>
                                    <radialGradient
                                        id="restorch-hub-glow"
                                        cx="50%"
                                        cy="50%"
                                        r="50%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="rgba(249,115,22,0.2)"
                                        />
                                        <stop
                                            offset="70%"
                                            stopColor="rgba(249,115,22,0.04)"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="rgba(249,115,22,0)"
                                        />
                                    </radialGradient>
                                    <filter
                                        id="beam-glow"
                                        x="-40%"
                                        y="-40%"
                                        width="180%"
                                        height="180%"
                                    >
                                        <feGaussianBlur
                                            stdDeviation="3.5"
                                            result="blur"
                                        />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Ambient center glow */}
                                <circle
                                    cx={CX}
                                    cy={CY}
                                    r={145}
                                    fill="url(#restorch-hub-glow)"
                                />

                                {/* Concentric orbit rings */}
                                <circle
                                    cx={CX}
                                    cy={CY}
                                    r={118}
                                    fill="none"
                                    className="stroke-orange-500/15 dark:stroke-orange-400/15"
                                    strokeWidth="1"
                                />
                                <circle
                                    cx={CX}
                                    cy={CY}
                                    r={182}
                                    fill="none"
                                    className="stroke-orange-500/20 dark:stroke-orange-400/20"
                                    strokeWidth="1"
                                />

                                {/* Subtle dashed spokes */}
                                {MODULES.map((m, idx) => {
                                    const p1 = polar(m.angleDeg, HUB_EDGE_R);
                                    const p2 = polar(m.angleDeg, ORBIT_R - 36);
                                    const isAct = idx === activeIndex;
                                    return (
                                        <line
                                            key={m.id}
                                            x1={p1.x}
                                            y1={p1.y}
                                            x2={p2.x}
                                            y2={p2.y}
                                            strokeDasharray="3 5"
                                            strokeWidth="1"
                                            className={
                                                isAct
                                                    ? "stroke-orange-500/35"
                                                    : "stroke-border/60 dark:stroke-white/10"
                                            }
                                        />
                                    );
                                })}

                                {/* Straight glowing arrow from center hub to active card */}
                                <line
                                    x1={startPt.x}
                                    y1={startPt.y}
                                    x2={endPt.x}
                                    y2={endPt.y}
                                    stroke="#f97316"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    filter="url(#beam-glow)"
                                />
                                <polygon
                                    points={`${endPt.x},${endPt.y} ${ax1},${ay1} ${ax2},${ay2}`}
                                    fill="#f97316"
                                    filter="url(#beam-glow)"
                                />
                            </svg>

                            {/* Center Restorch Core Hub */}
                            <div
                                style={{
                                    left: `${(CX / 640) * 100}%`,
                                    top: `${(CY / 560) * 100}%`,
                                }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-orange-500/25 bg-card dark:bg-[#0E131D] shadow-[0_0_40px_rgba(249,115,22,0.16)]"
                            >
                                <img
                                    src="/images/branding/restorch-mark-square.png"
                                    alt="Restorch"
                                    className="h-10 w-10 object-contain"
                                />
                                <span className="mt-1 text-sm font-bold tracking-tight">
                                    Restorch
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {isAm ? "ቀጥታ ስርዓት" : "Real-time core"}
                                </span>
                            </div>

                            {/* 8 Radial Module Cards */}
                            {MODULES.map((m, idx) => {
                                const pos = polar(m.angleDeg, ORBIT_R);
                                const isActive = idx === activeIndex;
                                const Icon = m.icon;

                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectModule(idx)}
                                        style={{
                                            left: `${(pos.x / 640) * 100}%`,
                                            top: `${(pos.y / 560) * 100}%`,
                                        }}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-500 ease-out w-[166px] ${
                                            isActive
                                                ? "z-20 scale-105 border-orange-500/80 bg-card dark:bg-[#131A29] shadow-[0_10px_30px_rgba(249,115,22,0.22)] ring-2 ring-orange-500/20"
                                                : "z-10 border-border/80 bg-card/90 dark:bg-[#0E131D]/90 hover:border-orange-500/40 opacity-75 hover:opacity-100"
                                        }`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
                                                isActive
                                                    ? "border-orange-500/40 bg-orange-500 text-white"
                                                    : "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold leading-tight">
                                                {isAm ? m.titleAm : m.title}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                                                {isAm
                                                    ? m.subtitleAm
                                                    : m.subtitle}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile / Small Tablet Grid */}
                        <div className="grid grid-cols-2 gap-3 md:hidden">
                            {MODULES.map((m, idx) => {
                                const isActive = idx === activeIndex;
                                const Icon = m.icon;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectModule(idx)}
                                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-300 ${
                                            isActive
                                                ? "border-orange-500 bg-card shadow-md ring-1 ring-orange-500/20"
                                                : "border-border/80 bg-card/70"
                                        }`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                isActive
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold">
                                                {isAm ? m.titleAm : m.title}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {isAm
                                                    ? m.subtitleAm
                                                    : m.subtitle}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
