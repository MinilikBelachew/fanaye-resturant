"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Zap, UtensilsCrossed } from "lucide-react";

export default function LandingMarquee() {
    const t = useTranslations("marquee");

    const venues = [
        {
            name: "Nova Bistro & Lounge",
            type: "Fine Dining",
            city: "Addis Ababa",
        },
        {
            name: "The Grand Piazza",
            type: "Full Service",
            city: "Bole Medhanealem",
        },
        {
            name: "Skyline Grill & Bar",
            type: "High-Volume Lounge",
            city: "Kazanchis",
        },
        {
            name: "Bella Cucina Italiana",
            type: "Casual Trattoria",
            city: "Old Airport",
        },
        { name: "Buna & Co. Roastery", type: "Specialty Café", city: "Sarbet" },
        { name: "Lakehouse Lounge", type: "Resort & Dining", city: "Bishoftu" },
    ];

    return (
        <section className="relative py-8 border-y border-border/60 bg-secondary/20 overflow-hidden">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Stats Summary Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/40 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-muted-foreground">
                            {t("liveStream")}
                        </span>
                        <span className="font-bold text-foreground font-mono">
                            {t("monthlyOrders")}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5">
                            <Zap className="size-3 text-foreground" />
                            <span>{t("activeKds")}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{t("attributedCustody")}</span>
                        </span>
                    </div>
                </div>

                {/* Brand Venue Marquee */}
                <div className="mt-6 flex items-center justify-between gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {venues.map((v, i) => (
                        <div
                            key={i}
                            className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3.5 py-2 backdrop-blur-sm"
                        >
                            <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                                <UtensilsCrossed className="size-3.5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-foreground leading-tight">
                                    {v.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground">
                                    {v.type} • {v.city}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
