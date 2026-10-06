"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
    ArrowUpRight,
    CheckCircle2,
    Play,
    ShieldCheck,
    Zap,
} from "lucide-react";
import LandingGuestMenuPhone from "./LandingGuestMenuPhone";

export default function LandingHero() {
    const t = useTranslations("hero");

    return (
        <section className="relative min-h-[92vh] flex flex-col justify-center pt-28 sm:pt-36 pb-16 lg:pb-24 overflow-hidden bg-background">
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute -top-24 right-1/4 size-[480px] rounded-full bg-foreground/[0.04] blur-[120px]" />
                <div className="absolute bottom-0 left-10 size-[360px] rounded-full bg-foreground/[0.03] blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-3 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-7 space-y-5 text-left"
                    >
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-md">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40" />
                                <span className="relative inline-flex size-2 rounded-full bg-foreground" />
                            </span>
                            <span className="tracking-wide uppercase text-[10px] font-medium">
                                {t("badge")}
                            </span>
                        </div>

                        <h1 className="text-[32px] sm:text-[40px] lg:text-[44px] font-semibold tracking-tight text-foreground leading-[1.16]">
                            {t("headlinePrefix")}{" "}
                            <span className="block text-muted-foreground font-medium">
                                {t("headlineHighlight")}
                            </span>
                        </h1>

                        <p className="text-[15px] sm:text-base text-muted-foreground leading-relaxed max-w-lg font-normal">
                            {t("description")}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-1">
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:bg-foreground/90 active:scale-[0.98]"
                            >
                                <span>{t("getStarted")}</span>
                                <ArrowUpRight className="size-4 stroke-[2.5]" />
                            </Link>

                            <a
                                href="#stations"
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground px-4 py-2.5 text-[13px] font-medium transition-all"
                            >
                                <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-foreground">
                                    <Play className="size-2.5 fill-current ml-0.5" />
                                </span>
                                <span>{t("watchWalkthrough")}</span>
                            </a>
                        </div>

                        <div className="pt-6 border-t border-border/60 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-foreground" />
                                <span className="font-medium text-foreground">
                                    {t("zeroConfig")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-foreground" />
                                <span className="font-medium text-foreground">
                                    {t("fiscalCustody")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="size-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">
                                    {t("subSecondSync")}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.15,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        className="lg:col-span-5 flex justify-center lg:justify-start lg:-ml-6"
                    >
                        <LandingGuestMenuPhone />
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.7,
                        delay: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 lg:mt-20"
                >
                    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/40">
                        <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                            {t("stat1Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat1Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat1Desc")}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/40">
                        <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                            {t("stat2Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat2Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat2Desc")}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/40">
                        <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                            {t("stat3Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat3Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat3Desc")}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/40">
                        <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                            {t("stat4Num")}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                            {t("stat4Label")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {t("stat4Desc")}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
