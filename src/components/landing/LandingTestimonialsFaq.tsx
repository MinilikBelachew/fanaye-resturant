"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
    Plus,
    Minus,
    Quote,
    Star,
    MessageCircleQuestion,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./LandingMotion";
import { useListPublicTestimonialsQuery } from "@/context/services/testimonialsApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? "")
        .join("");
}

export default function LandingTestimonialsFaq() {
    const t = useTranslations("faq");
    const locale = useLocale();
    const isAm = locale === "am";
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [showAllTestimonials, setShowAllTestimonials] = useState(false);
    const { data: testimonialsData } = useListPublicTestimonialsQuery();

    const testimonials = testimonialsData?.items ?? [];
    const visibleTestimonials = showAllTestimonials
        ? testimonials
        : testimonials.slice(0, 4);
    const remainingCount = Math.max(0, testimonials.length - 4);

    const items = t.raw("items") as Array<{
        q: string;
        a: string;
    }>;

    return (
        <section className="relative py-20 md:py-28 border-t border-border/50 bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Live Super-Admin Managed Testimonials (max 4 initially, expandable) */}
                {testimonials.length > 0 ? (
                    <div id="testimonials" className="mb-24 scroll-mt-24">
                        <ScrollReveal className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                                <Star className="size-3 fill-current" />
                                <span>
                                    {isAm
                                        ? "በሆቴልና ሬስቶራንት መሪዎች የታመነ"
                                        : "Trusted by Hospitality Leaders"}
                                </span>
                            </div>
                            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                                {isAm ? "በሥራ ላይ የተረጋገጠ " : "Proven on the "}
                                <span className="font-serif italic font-normal text-orange-600 dark:text-orange-500">
                                    {isAm
                                        ? "የአገልግሎት ብቃት።"
                                        : "busiest dining floors."}
                                </span>
                            </h2>
                        </ScrollReveal>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
                            {visibleTestimonials.map(item => {
                                const photoSrc = item.photoUrl
                                    ? filePublicUrl(item.photoUrl)
                                    : null;

                                return (
                                    <article
                                        key={item.id}
                                        className="group flex flex-col justify-between rounded-3xl border border-border/75 dark:border-white/10 bg-card/85 dark:bg-white/[0.025] p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-3">
                                                <Quote className="size-6 text-orange-500/40" />
                                                <div className="flex items-center gap-0.5 text-orange-500">
                                                    {Array.from({
                                                        length: Math.max(
                                                            1,
                                                            Math.min(
                                                                5,
                                                                item.rating ||
                                                                    5,
                                                            ),
                                                        ),
                                                    }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className="size-3.5 fill-current"
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="mt-4 text-sm sm:text-[15px] text-foreground/90 leading-relaxed">
                                                &ldquo;{item.quote}&rdquo;
                                            </p>
                                        </div>

                                        <div className="mt-6 flex items-center gap-3.5 pt-4 border-t border-border/60">
                                            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-500/25 bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400">
                                                {photoSrc ? (
                                                    <img
                                                        src={photoSrc}
                                                        alt={item.authorName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    getInitials(item.authorName)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="truncate font-bold text-foreground text-sm">
                                                    {item.authorName}
                                                </h4>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {item.authorRole} ·{" "}
                                                    <span className="font-semibold text-foreground/85">
                                                        {item.restaurantName}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {testimonials.length > 4 ? (
                            <div className="mt-7 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAllTestimonials(prev => !prev)
                                    }
                                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400"
                                >
                                    <span>
                                        {showAllTestimonials
                                            ? isAm
                                                ? "ያነሰ አሳይ"
                                                : "Show Less"
                                            : isAm
                                              ? `ተጨማሪ አሳይ (+${remainingCount})`
                                              : `Show More (+${remainingCount})`}
                                    </span>
                                    {showAllTestimonials ? (
                                        <ChevronUp className="size-3.5" />
                                    ) : (
                                        <ChevronDown className="size-3.5" />
                                    )}
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {/* FAQ Section with Smooth In-View Appear Effect */}
                <div id="faq" className="scroll-mt-24">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55 }}
                        className="text-center max-w-2xl mx-auto"
                    >
                        <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                            {isAm ? "ተደጋግመው " : "Frequently "}
                            <span className="font-serif italic font-normal text-orange-600 dark:text-orange-500">
                                {isAm ? "የሚጠየቁ ጥያቄዎች" : "Asked Questions"}
                            </span>
                        </h3>
                        <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {isAm
                                ? "Restorchን በአዳራሽ፣ በኩሽና፣ በስቶር እና በቅርንጫፎች ስለመጠቀም ማወቅ የሚፈልጉት ሁሉ።"
                                : "Everything you need to know about running Restorch across your floor, kitchen, store, and branches."}
                        </p>
                    </motion.div>

                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {/* Left Branded Card with Rich Smoke/Silk Background */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="lg:col-span-4 group relative overflow-hidden rounded-3xl border border-white/20 p-7 sm:p-8 text-white flex flex-col items-center justify-between text-center shadow-[0_20px_50px_rgba(234,88,12,0.25)] min-h-[420px]"
                        >
                            {/* Background Image with Gentle Soft Blur and Warm Overlays */}
                            <Image
                                src="/images/landing/faq-bg.jpg"
                                alt="Restorch FAQ background"
                                fill
                                sizes="(max-width: 1024px) 100vw, 33vw"
                                priority={false}
                                className="object-cover object-center pointer-events-none scale-105 blur-[5px] transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                            {/* Gradient overlays to guarantee crisp text legibility while letting the glowing orange satin wave shine through */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/65"
                            />
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#c2410c]/30 via-transparent to-black/15 mix-blend-multiply"
                            />
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-orange-500/25 blur-3xl"
                            />

                            <div className="relative z-10 flex flex-col items-center mt-2">
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 shadow-inner">
                                    <MessageCircleQuestion className="size-8 text-white" />
                                </div>

                                <h4 className="mt-6 text-2xl font-bold tracking-tight leading-snug drop-shadow-sm">
                                    {isAm
                                        ? "ተጨማሪ ጥያቄዎች አሉዎት?"
                                        : "Do you have more questions?"}
                                </h4>
                                <p className="mt-3 text-xs sm:text-sm text-white/90 leading-relaxed max-w-xs drop-shadow-xs">
                                    {isAm
                                        ? "ስለ አዘገጃጀት፣ መሳሪያዎች እና የሬስቶራንት አሰራር ቡድናችን ሊረዳዎት ዝግጁ ነው።"
                                        : "Have more questions? Our team is here to help with setup, hardware, and custom restaurant workflows."}
                                </p>
                            </div>

                            <a
                                href="mailto:hello@restorch.com"
                                className="relative z-10 mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-zinc-900 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-white/95"
                            >
                                {isAm ? "ኢሜይል ይላኩ" : "Direct Mail"}
                            </a>
                        </motion.div>

                        {/* Right Accordion List with Smooth Animated Height/Opacity Transitions */}
                        <div className="lg:col-span-8 flex flex-col justify-center space-y-3">
                            {items.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 14 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.1 }}
                                        transition={{
                                            duration: 0.45,
                                            delay: 0.12 + idx * 0.06,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        className={cn(
                                            "overflow-hidden rounded-2xl border transition-all duration-300",
                                            isOpen
                                                ? "border-border/90 bg-secondary/40 dark:bg-white/[0.035]"
                                                : "border-border/60 bg-secondary/25 dark:bg-white/[0.015] hover:border-border/90 hover:bg-secondary/40",
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenFaq(isOpen ? null : idx)
                                            }
                                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer group"
                                        >
                                            <span
                                                className={cn(
                                                    "text-sm sm:text-[15px] font-semibold transition-colors duration-200",
                                                    isOpen
                                                        ? "text-foreground"
                                                        : "text-foreground/90 group-hover:text-foreground",
                                                )}
                                            >
                                                {faq.q}
                                            </span>
                                            <motion.span
                                                animate={{
                                                    rotate: isOpen ? 180 : 0,
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: [0.16, 1, 0.3, 1],
                                                }}
                                                className={cn(
                                                    "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
                                                    isOpen
                                                        ? "bg-secondary text-foreground"
                                                        : "bg-secondary/60 text-muted-foreground group-hover:text-foreground",
                                                )}
                                            >
                                                {isOpen ? (
                                                    <Minus className="size-3.5" />
                                                ) : (
                                                    <Plus className="size-3.5" />
                                                )}
                                            </motion.span>
                                        </button>

                                        {/* Smooth Collapse & Expand Transition */}
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    key="content"
                                                    initial={{
                                                        height: 0,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        height: "auto",
                                                        opacity: 1,
                                                        transition: {
                                                            height: {
                                                                duration: 0.35,
                                                                ease: [
                                                                    0.16, 1,
                                                                    0.3, 1,
                                                                ],
                                                            },
                                                            opacity: {
                                                                duration: 0.25,
                                                                delay: 0.05,
                                                                ease: "easeOut",
                                                            },
                                                        },
                                                    }}
                                                    exit={{
                                                        height: 0,
                                                        opacity: 0,
                                                        transition: {
                                                            height: {
                                                                duration: 0.28,
                                                                ease: [
                                                                    0.16, 1,
                                                                    0.3, 1,
                                                                ],
                                                            },
                                                            opacity: {
                                                                duration: 0.18,
                                                                ease: "easeIn",
                                                            },
                                                        },
                                                    }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-4 pt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 dark:border-white/5">
                                                        {faq.a}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
