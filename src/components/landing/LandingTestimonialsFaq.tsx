"use client";

import { useState } from "react";
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
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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

                {/* FAQ Section */}
                <div id="faq" className="scroll-mt-24">
                    <div className="text-center max-w-2xl mx-auto">
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
                    </div>

                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {/* Left Branded Gradient Card */}
                        <div className="lg:col-span-4 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#c2410c] via-[#ea580c] to-[#f59e0b] p-7 sm:p-8 text-white flex flex-col items-center justify-between text-center shadow-[0_18px_45px_rgba(234,88,12,0.22)]">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-white/15 blur-2xl"
                            />

                            <div className="relative z-10 flex flex-col items-center mt-2">
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25">
                                    <MessageCircleQuestion className="size-8 text-white" />
                                </div>

                                <h4 className="mt-6 text-2xl font-bold tracking-tight leading-snug">
                                    {isAm
                                        ? "ተጨማሪ ጥያቄዎች አሉዎት?"
                                        : "Do you have more questions?"}
                                </h4>
                                <p className="mt-3 text-xs sm:text-sm text-white/85 leading-relaxed max-w-xs">
                                    {isAm
                                        ? "ስለ አዘገጃጀት፣ መሳሪያዎች እና የሬስቶራንት አሰራር ቡድናችን ሊረዳዎት ዝግጁ ነው።"
                                        : "Have more questions? Our team is here to help with setup, hardware, and custom restaurant workflows."}
                                </p>
                            </div>

                            <a
                                href="mailto:hello@restorch.com"
                                className="relative z-10 mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-900 shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:bg-white/95"
                            >
                                {isAm ? "ኢሜይል ይላኩ" : "Direct Mail"}
                            </a>
                        </div>

                        {/* Right Accordion List */}
                        <div className="lg:col-span-8 flex flex-col justify-center space-y-3">
                            {items.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "rounded-2xl border transition-all duration-200",
                                            isOpen
                                                ? "border-orange-500/30 bg-orange-500/[0.07] dark:bg-orange-500/[0.10]"
                                                : "border-border/70 bg-secondary/45 dark:bg-white/[0.03] hover:border-orange-500/30",
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenFaq(isOpen ? null : idx)
                                            }
                                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                                        >
                                            <span className="text-sm sm:text-[15px] font-semibold text-foreground">
                                                {faq.q}
                                            </span>
                                            <span
                                                className={cn(
                                                    "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
                                                    isOpen
                                                        ? "text-orange-600 dark:text-orange-400"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {isOpen ? (
                                                    <Minus className="size-4" />
                                                ) : (
                                                    <Plus className="size-4" />
                                                )}
                                            </span>
                                        </button>

                                        {isOpen ? (
                                            <div className="px-5 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                {faq.a}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
