"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
    ArrowRight,
    Play,
    Zap,
    Star,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";

export default function LandingHero() {
    const t = useTranslations("hero");
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });

    const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Scrub video currentTime based on scroll position
        const unsubscribe = scrollYProgress.on("change", latest => {
            if (video.duration && !isNaN(video.duration)) {
                video.currentTime = (latest * video.duration) % video.duration;
            }
        });

        return () => unsubscribe();
    }, [scrollYProgress]);

    return (
        <section
            ref={sectionRef}
            className="relative overflow-hidden pt-24 sm:pt-28 pb-12 lg:pb-20 min-h-[90vh] flex flex-col justify-center"
        >
            {/* Background Video Layer (High Visibility & Crisp Presentation) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    style={{ y: videoY }}
                    className="absolute inset-0 size-full object-cover opacity-95 dark:opacity-80 scale-105 transition-opacity duration-300 filter brightness-100 dark:brightness-95 contrast-[1.03]"
                    src="/images/ok_remove_the_hand.mp4"
                />

                {/* Minimal soft gradient overlay - preserves maximum video visibility while keeping text readable */}
                <div className="absolute inset-0 bg-gradient-to-r from-background/75 via-background/25 to-transparent dark:from-background/85 dark:via-background/35 dark:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/90" />

                {/* Subtle warm ambient accent */}
                <div className="absolute top-1/3 right-1/4 -translate-y-1/2 size-[450px] rounded-full bg-orange-500/10 blur-[120px]" />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* LEFT COLUMN: Headline, Paragraph, CTAs, Reviews Stack */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="lg:col-span-6 space-y-6 text-left"
                    >
                        {/* Top Subtle Pill */}
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-background/80 px-3 py-1 text-[11px] font-medium text-orange-600 dark:text-orange-400 backdrop-blur-md">
                            <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="uppercase tracking-wider font-semibold text-[10px]">
                                {t("badge")}
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-extrabold tracking-tight text-foreground leading-[1.14]">
                            {t("headlinePrefix")}{" "}
                            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500 bg-clip-text text-transparent dark:from-orange-400 dark:via-amber-300 dark:to-rose-400 block sm:inline">
                                {t("headlineHighlight")}
                            </span>
                        </h1>

                        {/* Subtitle with soft background card feel for maximum readability */}
                        <p className="text-xs sm:text-sm md:text-base text-foreground/90 leading-relaxed max-w-lg font-medium">
                            {t("description")}
                        </p>

                        {/* Dual Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:opacity-95 px-6 py-3 text-xs sm:text-sm font-bold text-white transition-transform active:scale-[0.98]"
                            >
                                <Zap className="size-3.5 fill-current" />
                                <span>{t("launchDemo")}</span>
                                <ArrowRight className="size-3.5" />
                            </Link>

                            <a
                                href="#stations"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-background/85 px-5 py-3 text-xs sm:text-sm font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-secondary"
                            >
                                <Play className="size-3 text-orange-500 fill-orange-500" />
                                <span>{t("exploreStations")}</span>
                            </a>
                        </div>

                        {/* Reviews & Social Proof Strip */}
                        <div className="pt-4 border-t border-border/50 space-y-2">
                            <span className="text-[11px] font-medium text-foreground/80 uppercase tracking-wider block">
                                {t("reviews")}
                            </span>
                            <div className="flex items-center gap-3">
                                {/* Overlapping Avatars */}
                                <div className="flex -space-x-2 overflow-hidden">
                                    <div className="inline-flex size-8 items-center justify-center rounded-full border-2 border-background bg-orange-500 text-[10px] font-bold text-white">
                                        M
                                    </div>
                                    <div className="inline-flex size-8 items-center justify-center rounded-full border-2 border-background bg-amber-500 text-[10px] font-bold text-white">
                                        A
                                    </div>
                                    <div className="inline-flex size-8 items-center justify-center rounded-full border-2 border-background bg-blue-500 text-[10px] font-bold text-white">
                                        S
                                    </div>
                                    <div className="inline-flex size-8 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-semibold text-foreground font-mono">
                                        350+
                                    </div>
                                </div>

                                {/* Star Rating & Benchmark */}
                                <div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="size-3.5 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-foreground/80 font-medium mt-0.5">
                                        {t("ratingText")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Large Circular Visual Centerpiece with the FIRST IMAGE */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="lg:col-span-6 flex items-center justify-center relative"
                    >
                        {/* Decorative Outer Aura Ring */}
                        <div className="absolute size-[320px] sm:size-[400px] lg:size-[440px] rounded-full border border-orange-500/30 bg-orange-500/10 animate-pulse pointer-events-none" />

                        {/* Main Circular Image Centerpiece (First Image) */}
                        <div className="relative size-[300px] sm:size-[380px] lg:size-[420px] rounded-full overflow-hidden border-2 border-border/80 bg-card p-1.5 transition-transform duration-500 hover:scale-[1.02]">
                            <div className="relative size-full rounded-full overflow-hidden">
                                <Image
                                    src="/images/landing/hero_restaurant_system.jpg"
                                    alt="Fanaye Restaurant Live Operations"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Floating Telemetry Badge 1: Hot Line Ready (Top-Right) */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="absolute -top-2 right-2 sm:right-6 flex items-center gap-2 rounded-full border border-border/80 bg-background/90 backdrop-blur-md px-3.5 py-1.5 text-xs text-foreground shadow-none"
                        >
                            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="font-mono text-[11px] font-semibold">
                                {t("tableReadyBadge")}
                            </span>
                        </motion.div>

                        {/* Floating Telemetry Badge 2: TinaVerify Confirmed (Bottom-Left) */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="absolute -bottom-2 left-2 sm:left-6 flex items-center gap-2 rounded-full border border-orange-500/30 bg-background/90 backdrop-blur-md px-3.5 py-1.5 text-xs text-foreground"
                        >
                            <ShieldCheck className="size-3.5 text-emerald-500" />
                            <span className="font-mono text-[11px]">
                                {t("tinaVerifyBadge")}
                            </span>
                        </motion.div>

                        {/* Floating Accent Sparkle (Right) */}
                        <div className="absolute top-1/2 -right-3 size-9 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Sparkles className="size-4" />
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
