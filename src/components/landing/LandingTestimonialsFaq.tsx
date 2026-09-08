"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    ChevronDown,
    Quote,
    Star,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./LandingMotion";

export default function LandingTestimonialsFaq() {
    const t = useTranslations("faq");
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const testimonials = t.raw("testimonials") as Array<{
        quote: string;
        author: string;
        role: string;
        venue: string;
        avatar: string;
    }>;

    const items = t.raw("items") as Array<{
        q: string;
        a: string;
    }>;

    return (
        <section id="faq" className="relative py-12 md:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Testimonials Header */}
                <ScrollReveal className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                        <Star className="size-3 fill-current" />
                        <span>{t("reviewsBadge")}</span>
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("reviewsTitlePrefix")}
                        <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                            {t("reviewsTitleHighlight")}
                        </span>
                    </h2>
                </ScrollReveal>

                {/* Testimonial Cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonials.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card/80 p-5 sm:p-6 backdrop-blur-xl"
                        >
                            <Quote className="size-6 text-orange-500/30 mb-2" />
                            <p className="text-xs sm:text-sm text-foreground leading-relaxed italic">
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <div className="mt-4 flex items-center gap-2.5 pt-3 border-t border-border/50">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-xs">
                                    {item.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-xs">
                                        {item.author}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        {item.role} • <span className="text-orange-600 dark:text-orange-400 font-medium">{item.venue}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-14 max-w-3xl mx-auto">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                            <HelpCircle className="size-3" />
                            <span>{t("faqBadge")}</span>
                        </div>
                        <h3 className="mt-2 text-xl sm:text-2xl font-bold text-foreground">
                            {t("faqTitle")}
                        </h3>
                    </div>

                    <div className="space-y-2.5">
                        {items.map((faq, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-border/80 bg-card/80 overflow-hidden backdrop-blur-md"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                                        className="flex w-full items-center justify-between p-4 text-left font-bold text-foreground text-xs sm:text-sm hover:bg-secondary/40 transition cursor-pointer"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown
                                            className={cn(
                                                "size-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-3",
                                                isOpen && "rotate-180 text-orange-500",
                                            )}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2.5">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
