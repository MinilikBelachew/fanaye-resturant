"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";

export default function LandingFinalCta() {
    const isAm = useLocale() === "am";

    return (
        <section className="relative py-12 md:py-16 bg-background text-foreground">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#c2410c] via-[#ea580c] to-[#f97316] px-7 py-10 sm:px-12 sm:py-12 text-white shadow-[0_20px_50px_rgba(234,88,12,0.22)]">
                    {/* Subtle decorative circles like the reference */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-12 -left-10 size-40 rounded-full bg-white/10"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-14 -right-8 size-48 rounded-full bg-white/10"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-4 right-24 size-20 rounded-full bg-white/10"
                    />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        {/* Left Content */}
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#c2410c] shadow-xs">
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                <span>
                                    {isAm ? "በ1 ቀን ይጀምሩ" : "Live in 1 Day"}
                                </span>
                            </span>

                            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
                                {isAm
                                    ? "እያንዳንዱን ፈረቃ በቅንጅት "
                                    : "Ready to run every shift "}
                                <span className="font-serif italic font-normal text-white/95">
                                    {isAm ? "ለማስኬድ ዝግጁ ነዎት?" : "in sync?"}
                                </span>
                            </h2>

                            <p className="mt-2.5 text-xs sm:text-sm text-white/85 leading-relaxed max-w-lg">
                                {isAm
                                    ? "የአዳራሽ POS፣ የኩሽና KDS፣ የስቶር ክምችት እና የቴሌብር/ጥሬ ገንዘብ Z-Report በአንድ ስርዓት ያቀናጁ።"
                                    : "Bring your floor POS, kitchen KDS, store inventory, and Telebirr & cash Z-Reports into one calm system."}
                            </p>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href="/sign-in"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-[#c2410c] shadow-sm transition-all duration-200 hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>{isAm ? "ይጀምሩ" : "Get Started"}</span>
                                    <ArrowRight className="size-4 stroke-[2.25]" />
                                </Link>

                                <a
                                    href="mailto:hello@restorch.com?subject=Restorch%20Demo%20Request"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/10 px-6 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                                >
                                    <Calendar className="size-4" />
                                    <span>
                                        {isAm ? "ማሳያ ይጠይቁ" : "Book a Demo"}
                                    </span>
                                </a>
                            </div>

                            <p className="text-[11px] text-white/80 font-medium">
                                {isAm
                                    ? "ለሬስቶራንቶች · ላውንጆች · ሆቴሎች · ካፌዎች የተዘጋጀ"
                                    : "Built for Restaurants · Lounges · Hotels · Cafés"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
