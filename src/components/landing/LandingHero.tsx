"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Play } from "lucide-react";
import RestorchGlassHeroMark from "./RestorchGlassHeroMark";

export default function LandingHero() {
    const t = useTranslations("hero");
    const isAm = useLocale() === "am";

    return (
        <section
            id="home"
            className="relative min-h-[90vh] flex flex-col justify-between pt-28 sm:pt-36 pb-16 lg:pb-20 overflow-hidden bg-background scroll-mt-24"
        >
            {/* Subtle ambient backdrop adapting to light & dark modes */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
                <div className="absolute -top-24 right-1/6 size-[540px] rounded-full bg-orange-500/[0.025] dark:bg-orange-500/[0.04] blur-[140px]" />
                <div className="absolute bottom-0 left-10 size-[380px] rounded-full bg-foreground/[0.03] blur-[110px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_40%,#000_65%,transparent_100%)]" />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
                    {/* Left Editorial Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-6 space-y-6 text-left"
                    >
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 backdrop-blur-md shadow-xs">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500/60" />
                                <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
                            </span>
                            <span className="font-mono tracking-widest uppercase text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                                {t("badge")}
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-bold tracking-tight text-foreground leading-[1.06]">
                            {t("headlinePrefix")}{" "}
                            <span className="block mt-1 font-serif italic font-normal text-orange-600 dark:text-orange-400">
                                {t("headlineHighlight")}
                            </span>
                        </h1>

                        <p className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg font-normal">
                            {t("description")}
                        </p>

                        <div className="flex flex-wrap items-center gap-5 pt-2">
                            <Link
                                href="/sign-in"
                                style={{
                                    paddingLeft: "2rem",
                                    paddingRight: "2rem",
                                    paddingTop: "0.9rem",
                                    paddingBottom: "0.9rem",
                                }}
                                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground text-background text-sm font-semibold shadow-sm transition-all duration-200 hover:bg-foreground/90 active:scale-[0.98]"
                            >
                                <span>{t("getStarted")}</span>
                                <ArrowRight className="size-4 stroke-[2.25]" />
                            </Link>

                            <a
                                href="#stations"
                                className="inline-flex items-center gap-2 font-mono text-xs sm:text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <span className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-foreground">
                                    <Play className="size-2.5 fill-current ml-0.5" />
                                </span>
                                <span>{t("watchWalkthrough")}</span>
                            </a>
                        </div>
                    </motion.div>

                    {/* Right 3D Glass Restorch R Monogram */}
                    <div className="lg:col-span-6 flex items-center justify-center">
                        <RestorchGlassHeroMark />
                    </div>
                </div>

                {/* Bottom Trust Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.7,
                        delay: 0.25,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="mt-14 lg:mt-20 border-t border-border/70 pt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs sm:text-[13px]"
                >
                    <span className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                        {isAm ? "ለመስተንግዶ የተዘጋጀ" : "Built for hospitality"}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground/90 font-medium">
                        <span className="inline-flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-orange-500" />
                            {t("zeroConfig")}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-orange-500" />
                            {t("fiscalCustody")}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-orange-500" />
                            {t("subSecondSync")}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-orange-500" />
                            {t("stat1Num")} {t("stat1Label")}
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
