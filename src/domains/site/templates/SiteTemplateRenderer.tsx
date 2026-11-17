"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Coffee,
    Flame,
    Instagram,
    Mail,
    MapPin,
    Phone,
    Quote,
    Send,
    Sparkles,
    Star,
    UserCheck,
    Utensils,
} from "lucide-react";
import {
    useGetPublicApprovedFeedbackQuery,
    useSubmitWebsiteFeedbackMutation,
} from "@/context/services/feedbackApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { formatEtb } from "@/lib/money";
import type { SiteTemplateRenderProps } from "./restaurantTemplates";
import SiteMenuExplorer from "./SiteMenuExplorer";

function resolveMediaUrl(raw?: string | null): string {
    if (!raw) return "/images/dining_table_round.jpg";
    return filePublicUrl(raw) || raw;
}

function DishImageOrPlaceholder({
    imageUrl,
    alt,
    className = "h-full w-full object-cover",
    placeholderClassName = "bg-[#FFE6C8]/60 text-[#B27647]",
    iconClassName = "size-8 opacity-65",
}: {
    imageUrl?: string | null;
    alt: string;
    className?: string;
    placeholderClassName?: string;
    iconClassName?: string;
}) {
    const [failed, setFailed] = useState(false);
    const resolved = imageUrl ? filePublicUrl(imageUrl) || imageUrl : "";

    if (!resolved || failed) {
        return (
            <div
                className={`h-full w-full flex flex-col items-center justify-center ${placeholderClassName}`}
                aria-label={alt}
            >
                <Utensils className={iconClassName} />
            </div>
        );
    }

    return (
        <img
            src={resolved}
            alt={alt}
            className={className}
            onError={() => setFailed(true)}
        />
    );
}

function SocialLinks({
    profile,
    isDark = false,
}: {
    profile: SiteTemplateRenderProps["profile"];
    isDark?: boolean;
}) {
    const links = [
        { label: "Instagram", href: profile?.instagram },
        { label: "Facebook", href: profile?.facebook },
        { label: "TikTok", href: profile?.tiktok },
        { label: "Telegram", href: profile?.telegram },
    ].filter(l => Boolean(l.href && l.href.trim()));

    if (links.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {links.map(l => (
                <a
                    key={l.label}
                    href={l.href!}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isDark
                            ? "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                            : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                    }`}
                >
                    <Instagram className="size-3" />
                    <span>{l.label}</span>
                </a>
            ))}
        </div>
    );
}

function SharedContactFooter({
    tenantName,
    profile,
    accentColor,
    isDark = false,
    bgClass = "bg-stone-950 text-stone-100",
}: {
    tenantName: string;
    profile?: SiteTemplateRenderProps["profile"];
    accentColor: string;
    isDark?: boolean;
    bgClass?: string;
}) {
    const addressLine = [profile?.address, profile?.city]
        .filter(Boolean)
        .join(", ");

    return (
        <footer id="contact" className={bgClass}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">
                        {tenantName}
                    </h3>
                    <p
                        className={`mt-2 text-sm leading-relaxed ${
                            isDark ? "text-slate-400" : "opacity-75"
                        }`}
                    >
                        {profile?.tagline ||
                            "Crafted fresh daily. Visit us for dine-in or pickup."}
                    </p>
                    <SocialLinks profile={profile} isDark />
                </div>

                <div className="space-y-3 text-sm">
                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: accentColor }}
                    >
                        Visit & Hours
                    </p>
                    {addressLine ? (
                        <div className="flex items-start gap-2.5 opacity-90">
                            <MapPin className="size-4 shrink-0 mt-0.5" />
                            <span>{addressLine}</span>
                        </div>
                    ) : null}
                    {profile?.hours ? (
                        <div className="flex items-start gap-2.5 opacity-90">
                            <Clock className="size-4 shrink-0 mt-0.5" />
                            <span>{profile.hours}</span>
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3 text-sm">
                    <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: accentColor }}
                    >
                        Contact
                    </p>
                    {profile?.phone ? (
                        <a
                            href={`tel:${profile.phone}`}
                            className="flex items-center gap-2.5 opacity-90 hover:opacity-100"
                        >
                            <Phone className="size-4 shrink-0" />
                            <span>{profile.phone}</span>
                        </a>
                    ) : null}
                    {profile?.email ? (
                        <a
                            href={`mailto:${profile.email}`}
                            className="flex items-center gap-2.5 opacity-90 hover:opacity-100"
                        >
                            <Mail className="size-4 shrink-0" />
                            <span>{profile.email}</span>
                        </a>
                    ) : null}
                </div>
            </div>
            <div className="border-t border-white/10 py-5 text-center text-xs opacity-60">
                © {new Date().getFullYear()} {tenantName}. Powered by Restorch.
            </div>
        </footer>
    );
}

/* -------------------------------------------------------------------------- */
/* 1. MODERN BISTRO                                                           */
/* -------------------------------------------------------------------------- */
function ensureBrightAccent(hex?: string | null, fallback = "#f37d2f"): string {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex.trim())) return fallback;
    const clean = hex.trim().slice(1);
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.35 ? fallback : hex.trim();
}

function ModernBistroSite({
    slug,
    tenantName,
    config,
    profile,
    menuItems,
}: SiteTemplateRenderProps) {
    const orange = ensureBrightAccent(config.accentColor, "#f37d2f");
    const gold = "#bc914c";
    const heroRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: heroScroll } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const heroPlateY = useTransform(heroScroll, [0, 1], [0, 44]);
    const heroPlateRotate = useTransform(heroScroll, [0, 1], [0, 8]);

    // Build category tabs from live menuItems
    const categories = useMemo(() => {
        const map = new Map<string, typeof menuItems>();
        for (const item of menuItems) {
            const cat = item.categoryName || "Chef's Specials";
            const list = map.get(cat) ?? [];
            list.push(item);
            map.set(cat, list);
        }
        return Array.from(map.entries());
    }, [menuItems]);

    const [activeCatIdx, setActiveCatIdx] = useState(0);
    const [previewItemId, setPreviewItemId] = useState<string | null>(null);
    const [showFullMenu, setShowFullMenu] = useState(false);
    const safeCatIdx = Math.min(
        activeCatIdx,
        Math.max(0, categories.length - 1),
    );
    const activeCatItems = categories[safeCatIdx]?.[1] ?? menuItems.slice(0, 5);
    const previewItem =
        activeCatItems.find(i => i.id === previewItemId) ?? activeCatItems[0];
    const activeCatImage =
        (previewItem?.imageUrl
            ? resolveMediaUrl(previewItem.imageUrl)
            : null) ||
        (activeCatItems.find(i => i.imageUrl)?.imageUrl
            ? resolveMediaUrl(activeCatItems.find(i => i.imageUrl)?.imageUrl)
            : null) ||
        config.galleryImages[0] ||
        config.heroImageUrl;

    // Testimonials carousel
    const { data: approvedFeedback } = useGetPublicApprovedFeedbackQuery(
        { slug: slug ?? "" },
        { skip: !slug || config.sections.reviews === false },
    );
    const liveReviews = approvedFeedback?.reviews ?? [];
    const displayReviews =
        liveReviews.length > 0
            ? liveReviews.map(r => ({
                  id: r.id,
                  comment:
                      r.comment ||
                      "Wonderful dining experience and warm service.",
                  name: r.customerName || "Verified Guest",
                  role: "Dining Guest",
                  rating: r.rating || 5,
              }))
            : [
                  {
                      id: "fallback-1",
                      comment:
                          "Every dish arrived vibrant, balanced, and full of authentic flavor. Easily our favorite table in town.",
                      name: "Selamawit T.",
                      role: "Regular Guest",
                      rating: 5,
                  },
                  {
                      id: "fallback-2",
                      comment:
                          "Warm hospitality from the moment we walked in, and the chef's specials were unforgettable.",
                      name: "Dawit M.",
                      role: "Food Lover",
                      rating: 5,
                  },
                  {
                      id: "fallback-3",
                      comment:
                          "Beautiful atmosphere, fresh ingredients, and consistent quality every single visit.",
                      name: "Hanna G.",
                      role: "Weekend Diner",
                      rating: 5,
                  },
              ];

    const [reviewOffset, setReviewOffset] = useState(0);
    const visibleReviews = useMemo(() => {
        if (displayReviews.length <= 2) return displayReviews;
        return [
            displayReviews[reviewOffset % displayReviews.length],
            displayReviews[(reviewOffset + 1) % displayReviews.length],
        ];
    }, [displayReviews, reviewOffset]);

    // Split hero headline so the last 2 words get the signature Sofra orange highlight
    const headlineWords = config.heroHeadline.trim().split(/\s+/);
    const headlineLead =
        headlineWords.length > 2
            ? headlineWords.slice(0, -2).join(" ")
            : config.heroHeadline;
    const headlineHighlight =
        headlineWords.length > 2 ? headlineWords.slice(-2).join(" ") : "";

    const galleryPool = [
        config.heroImageUrl,
        ...(config.galleryImages ?? []),
        config.heroImageUrl,
        ...(config.galleryImages ?? []),
    ].slice(0, 5);

    const cc = config.customCopy ?? {};
    const whyChooseIcons = [Sparkles, Utensils, UserCheck];
    const whyChooseCards = (
        cc.highlights && cc.highlights.length > 0
            ? cc.highlights.slice(0, 3)
            : [
                  { title: "Fresh & Authentic Ingredients" },
                  { title: "Healthy & Flavorful Options" },
                  { title: "Perfect for Every Occasion" },
              ]
    ).map((h, i) => ({
        title: h.title,
        icon: whyChooseIcons[i % whyChooseIcons.length],
    }));

    const featureHighlights = [
        {
            title: "Signature Plates",
            desc: "Balanced recipes crafted daily with seasonal produce and house-made sauces.",
            img: config.galleryImages[0] || config.heroImageUrl,
        },
        {
            title: "Desserts & Sweet",
            desc: "Artisanal sweets and warm finishes prepared fresh in our pastry kitchen.",
            img: config.galleryImages[1] || config.heroImageUrl,
        },
        {
            title: "Chef's Specials",
            desc: "Rotating highlights inspired by local harvests and open-fire technique.",
            img: config.galleryImages[2] || config.heroImageUrl,
        },
    ];

    const orangeStats =
        cc.stats && cc.stats.length > 0
            ? cc.stats.slice(0, 4)
            : [
                  { num: "2K", label: "Our Daily Order" },
                  { num: "15+", label: "Specialist Chef" },
                  {
                      num: `${Math.max(menuItems.length, 20)}+`,
                      label: "Our Menu Dish",
                  },
                  { num: "100%", label: "Fresh Ingredients" },
              ];

    return (
        <div
            className="min-h-screen bg-[#131d1c] text-white overflow-x-clip"
            style={{ fontFamily: "'Jost', system-ui, sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Gilda+Display&family=Jost:wght@400;500;600;700&display=swap');
                .sofra-serif { font-family: 'Gilda Display', Georgia, serif; }
            `}</style>

            {/* 1. Sticky Dark Header (No Book a Table / Contact) */}
            <header
                className="sticky top-0 z-30 bg-[#131d1c]/95 backdrop-blur-md"
                style={{ borderBottom: "1px solid rgba(254, 243, 231, 0.3)" }}
            >
                <div className="mx-auto max-w-7xl px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
                    <a href="#top" className="flex items-center gap-2.5">
                        <Utensils
                            className="size-5"
                            style={{ color: orange }}
                        />
                        <span className="sofra-serif text-2xl tracking-tight text-white">
                            {tenantName}
                        </span>
                    </a>

                    <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold uppercase tracking-[0.08em] text-white/90">
                        <a
                            href="#top"
                            className="hover:text-[#f37d2f] transition-colors"
                        >
                            HOME
                        </a>
                        {config.sections.story ? (
                            <a
                                href="#about-section"
                                className="hover:text-[#f37d2f] transition-colors"
                            >
                                ABOUT US
                            </a>
                        ) : null}
                        <a
                            href="#why-choose"
                            className="hover:text-[#f37d2f] transition-colors"
                        >
                            WHY CHOOSE
                        </a>
                        {config.sections.reviews !== false ? (
                            <a
                                href="#reviews"
                                className="hover:text-[#f37d2f] transition-colors"
                            >
                                TESTIMONIALS
                            </a>
                        ) : null}
                    </nav>

                    <a
                        href="#menu-section"
                        className="px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                        style={{ backgroundColor: gold }}
                    >
                        VIEW MENU
                    </a>
                </div>
            </header>

            {/* 2. Hero Section (#131d1c dark forest green) */}
            {config.sections.hero ? (
                <section
                    id="top"
                    ref={heroRef}
                    className="bg-[#131d1c] text-white py-14 sm:py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.7,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="lg:col-span-6 space-y-6"
                        >
                            <p
                                className="text-sm font-medium uppercase tracking-[0.18em]"
                                style={{ color: orange }}
                            >
                                {config.badgeText}
                            </p>
                            <h1 className="sofra-serif text-5xl sm:text-6xl lg:text-[72px] font-normal leading-[1.08] tracking-[0.01em] text-white">
                                {headlineLead}{" "}
                                {headlineHighlight ? (
                                    <span style={{ color: orange }}>
                                        {headlineHighlight}
                                    </span>
                                ) : null}
                            </h1>
                            <p className="text-[18px] leading-[1.55] tracking-[0.02em] text-white/75 max-w-xl">
                                {profile?.tagline || config.heroSubheadline}
                            </p>
                            <div className="pt-2 flex flex-wrap items-center gap-4">
                                <a
                                    href="#menu-section"
                                    className="px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:brightness-110"
                                    style={{ backgroundColor: gold }}
                                >
                                    {config.ctaLabel || "VIEW MENU"}
                                </a>
                                <a
                                    href="#why-choose"
                                    className="px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white border border-white/25 hover:border-[#f37d2f] hover:text-[#f37d2f] transition-colors"
                                >
                                    WHY CHOOSE US
                                </a>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.85,
                                delay: 0.15,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="lg:col-span-6 flex justify-center relative"
                        >
                            <motion.div
                                style={{
                                    y: heroPlateY,
                                    rotate: heroPlateRotate,
                                }}
                                className="relative size-[300px] sm:size-[420px] lg:size-[480px] rounded-full overflow-hidden border border-white/15 shadow-2xl will-change-transform"
                            >
                                <img
                                    src={config.heroImageUrl}
                                    alt={tenantName}
                                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
            ) : null}

            {/* 3. About Section (#ffffff white bg + 2x2 stats) */}
            {config.sections.story ? (
                <section
                    id="about-section"
                    className="bg-white text-[#131d1c] py-16 sm:py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.65 }}
                            className="lg:col-span-6 space-y-6"
                        >
                            <p
                                className="text-[18px] font-medium tracking-[0.03em]"
                                style={{ color: orange }}
                            >
                                {cc.aboutEyebrow || "About"}
                            </p>
                            <h2 className="sofra-serif text-4xl sm:text-5xl lg:text-[64px] font-normal leading-[1.15] text-[#131d1c]">
                                {cc.aboutTitle ||
                                    "Every Celebration Remarkable"}
                            </h2>
                            <p className="text-[18px] leading-[1.55] text-[#131d1c]/75">
                                {profile?.story ||
                                    "Dining is more than just a meal—it is an experience of flavor, tradition, and hospitality. We blend authentic recipes, fresh ingredients, and modern presentation."}
                            </p>

                            {/* 2x2 Stats Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-stone-200">
                                {[
                                    { num: "110+", label: "Seasonal Delights" },
                                    { num: "120+", label: "Healthy Choices" },
                                    { num: "30+", label: "Years of Craft" },
                                    { num: "100+", label: "Guest Reviews" },
                                ].map((st, idx) => (
                                    <motion.div
                                        key={st.label}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.3 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: idx * 0.08,
                                        }}
                                    >
                                        <p className="sofra-serif text-4xl sm:text-[56px] leading-[1.1] text-[#131d1c]">
                                            {st.num}
                                        </p>
                                        <p className="text-[16px] text-[#131d1c]/70 mt-1">
                                            {st.label}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.7 }}
                            className="lg:col-span-6"
                        >
                            <div className="aspect-[4/5] w-full overflow-hidden bg-stone-100">
                                <img
                                    src={
                                        config.galleryImages[0] ||
                                        config.heroImageUrl
                                    }
                                    alt={tenantName}
                                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>
            ) : null}

            {/* 4. 3-Column Feature Cards (#ffffff white bg) */}
            {config.sections.spotlight ? (
                <section className="bg-white text-[#131d1c] pb-20 pt-4">
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                        {featureHighlights.map((feat, idx) => (
                            <motion.div
                                key={feat.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -6 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 0.55,
                                    delay: idx * 0.1,
                                }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="size-44 rounded-full overflow-hidden border border-stone-200 shadow-md mb-6">
                                    <img
                                        src={feat.img}
                                        alt={feat.title}
                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="sofra-serif text-[30px] leading-[1.3] text-[#131d1c]">
                                    {feat.title}
                                </h3>
                                <p className="mt-2.5 text-[16px] leading-[1.5] text-[#131d1c]/70 max-w-xs">
                                    {feat.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* 5. #why-choose Section (#fef3e7 warm cream bg) */}
            {config.sections.whyChoose !== false ? (
                <section
                    id="why-choose"
                    className="bg-[#fef3e7] text-[#131d1c] py-16 sm:py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-6 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 0.6 }}
                            >
                                <p
                                    className="text-[18px] font-medium tracking-[0.03em]"
                                    style={{ color: orange }}
                                >
                                    {cc.whyChooseEyebrow || "Why Choose Us?"}
                                </p>
                                <h2 className="sofra-serif text-4xl sm:text-5xl lg:text-[64px] font-normal leading-[1.15] text-[#131d1c] mt-2">
                                    {cc.whyChooseTitle ||
                                        `More Than Dining It's ${tenantName}`}
                                </h2>
                            </motion.div>

                            <div className="space-y-4 pt-2">
                                {whyChooseCards.map((card, idx) => {
                                    const Icon = card.icon;
                                    return (
                                        <motion.div
                                            key={card.title}
                                            initial={{ opacity: 0, x: -24 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            whileHover={{ x: 6 }}
                                            viewport={{
                                                once: true,
                                                amount: 0.2,
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                delay: idx * 0.1,
                                            }}
                                            className="flex items-center justify-between gap-4 bg-white px-7 py-6 shadow-xs transition-shadow hover:shadow-md"
                                        >
                                            <h4 className="sofra-serif text-xl sm:text-[24px] leading-[1.35] text-[#131d1c]">
                                                {card.title}
                                            </h4>
                                            <div
                                                className="flex size-[60px] shrink-0 items-center justify-center rounded-full"
                                                style={{
                                                    backgroundColor: `${orange}18`,
                                                    color: orange,
                                                }}
                                            >
                                                <Icon className="size-6" />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.7 }}
                            className="lg:col-span-6 relative"
                        >
                            <div className="aspect-[4/4.3] w-full overflow-hidden bg-stone-200">
                                <img
                                    src={
                                        config.galleryImages[1] ||
                                        config.heroImageUrl
                                    }
                                    alt="Why Choose Us"
                                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.25 }}
                                className="absolute bottom-6 left-6 bg-[#131d1c] text-white px-6 py-4 shadow-xl border border-white/15"
                            >
                                <p
                                    className="text-xs uppercase tracking-[0.18em]"
                                    style={{ color: orange }}
                                >
                                    Kitchen Craft
                                </p>
                                <p className="sofra-serif text-[30px] leading-tight mt-0.5">
                                    Fresh Daily
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
            ) : null}

            {/* 6. Interactive Catering / Restaurant Menus (#131d1c dark bg) */}
            {config.sections.menu ? (
                <section
                    id="menu-section"
                    className="bg-[#131d1c] text-white py-16 sm:py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.6 }}
                            className="text-center space-y-3"
                        >
                            <p
                                className="text-[18px] font-medium"
                                style={{ color: orange }}
                            >
                                {cc.menuEyebrow || "Explore Menu Option"}
                            </p>
                            <h2 className="sofra-serif text-4xl sm:text-5xl lg:text-[64px] leading-[1.15]">
                                {cc.menuTitle || "Signature Kitchen Menus"}
                            </h2>
                        </motion.div>

                        {/* Category Filter Tabs (sharp 1px borders) */}
                        {categories.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {categories.map(([catName], idx) => {
                                    const active = idx === safeCatIdx;
                                    return (
                                        <button
                                            key={catName}
                                            type="button"
                                            onClick={() => {
                                                setActiveCatIdx(idx);
                                                setPreviewItemId(null);
                                            }}
                                            className="px-6 py-2.5 text-[15px] font-medium transition-all cursor-pointer"
                                            style={{
                                                border: active
                                                    ? `1px solid ${orange}`
                                                    : "1px solid rgba(255,255,255,0.3)",
                                                color: active
                                                    ? orange
                                                    : "#ffffff",
                                            }}
                                        >
                                            {catName}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}

                        {/* 2-Column Menu Showcase */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                            <motion.div
                                key={activeCatImage}
                                initial={{ opacity: 0.65, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35 }}
                                className="lg:col-span-5 relative aspect-[4/5] w-full overflow-hidden bg-[#0b1514] border border-white/10"
                            >
                                <img
                                    src={activeCatImage}
                                    alt={previewItem?.name || "Menu highlight"}
                                    className="h-full w-full object-cover transition-transform duration-500"
                                />
                                {previewItem ? (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b1514]/95 via-[#0b1514]/65 to-transparent p-5 flex items-end justify-between gap-3">
                                        <div>
                                            <p
                                                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                                                style={{ color: orange }}
                                            >
                                                {previewItem.categoryName ||
                                                    "Featured Dish"}
                                            </p>
                                            <p className="sofra-serif text-2xl text-white mt-0.5">
                                                {previewItem.name}
                                            </p>
                                        </div>
                                        <span
                                            className="sofra-serif text-2xl shrink-0"
                                            style={{ color: orange }}
                                        >
                                            {formatEtb(
                                                Number(previewItem.price),
                                            )}
                                        </span>
                                    </div>
                                ) : null}
                            </motion.div>

                            <div className="lg:col-span-7 space-y-5">
                                {activeCatItems.slice(0, 6).map((item, idx) => {
                                    const isSelected =
                                        previewItem?.id === item.id;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{
                                                duration: 0.4,
                                                delay: idx * 0.05,
                                            }}
                                            onMouseEnter={() =>
                                                setPreviewItemId(item.id)
                                            }
                                            onClick={() =>
                                                setPreviewItemId(item.id)
                                            }
                                            className="pb-5 space-y-2 group cursor-pointer transition-all"
                                            style={{
                                                borderBottom:
                                                    "1px solid rgba(255, 255, 255, 0.18)",
                                                borderLeft: isSelected
                                                    ? `2px solid ${orange}`
                                                    : "2px solid transparent",
                                                paddingLeft: isSelected
                                                    ? "14px"
                                                    : "0px",
                                            }}
                                        >
                                            <div className="flex items-baseline justify-between gap-4">
                                                <h4
                                                    className="sofra-serif text-xl sm:text-[24px] transition-colors"
                                                    style={{
                                                        color: isSelected
                                                            ? orange
                                                            : "#ffffff",
                                                    }}
                                                >
                                                    {item.name}
                                                </h4>
                                                <span
                                                    className="sofra-serif text-2xl sm:text-[30px] shrink-0"
                                                    style={{ color: orange }}
                                                >
                                                    {formatEtb(
                                                        Number(item.price),
                                                    )}
                                                </span>
                                            </div>
                                            {item.description ? (
                                                <p className="text-[16px] leading-[1.5] text-white/70">
                                                    {item.description}
                                                </p>
                                            ) : null}
                                        </motion.div>
                                    );
                                })}

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowFullMenu(prev => !prev)
                                        }
                                        className="px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-all cursor-pointer hover:brightness-110"
                                        style={{ backgroundColor: gold }}
                                    >
                                        {showFullMenu
                                            ? "HIDE FULL MENU EXPLORER"
                                            : `BROWSE ALL ${menuItems.length} DISHES`}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {showFullMenu ? (
                            <div className="bg-white text-stone-900 p-4 sm:p-6">
                                <SiteMenuExplorer
                                    items={menuItems}
                                    accentColor={orange}
                                    variant="cards"
                                    layout={config.menuLayout ?? "cards"}
                                    title="Full Restaurant Menu"
                                    subtitle="Search and filter all live dishes."
                                />
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 7. 4-Column Orange Stats Banner (#131d1c bg + #f37d2f cards with inner white frame) */}
            {config.sections.stats !== false ? (
                <section className="bg-[#131d1c] text-white pb-16 sm:pb-24">
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {orangeStats.map((stat, idx) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{
                                    duration: 0.5,
                                    delay: idx * 0.08,
                                }}
                                className="p-3"
                                style={{ backgroundColor: orange }}
                            >
                                <div
                                    className="flex flex-col items-center justify-center text-center py-10 px-4"
                                    style={{
                                        border: "1px solid rgba(255, 255, 255, 0.5)",
                                    }}
                                >
                                    <h2 className="sofra-serif text-5xl sm:text-[64px] leading-none text-white">
                                        {stat.num}
                                    </h2>
                                    <h4 className="sofra-serif text-xl sm:text-[24px] text-white mt-3">
                                        {stat.label}
                                    </h4>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* 8. Opening Hours Section (#131d1c dark bg — No Event Booking / Contact) */}
            {config.sections.hours !== false && profile?.hours ? (
                <section className="bg-[#131d1c] text-white pb-20">
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.6 }}
                            className="lg:col-span-6 space-y-6"
                        >
                            <p
                                className="text-[18px] font-medium"
                                style={{ color: orange }}
                            >
                                Service Hours
                            </p>
                            <h2 className="sofra-serif text-4xl sm:text-5xl lg:text-[64px] leading-[1.15]">
                                Freshly Prepared Every Day
                            </h2>
                            <div className="bg-[#0b1514] p-8 space-y-5 border border-white/10">
                                <h3 className="sofra-serif text-[30px] text-white">
                                    Opening Hour
                                </h3>
                                <div className="space-y-3 text-[17px]">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                                        <span style={{ color: orange }}>
                                            Daily Service
                                        </span>
                                        <span className="font-semibold text-white">
                                            {profile.hours}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span style={{ color: orange }}>
                                            Kitchen Status
                                        </span>
                                        <span className="font-semibold text-white">
                                            Dine-In &amp; Takeout
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.7 }}
                            className="lg:col-span-6"
                        >
                            <div className="aspect-[4/4.2] w-full overflow-hidden bg-[#0b1514]">
                                <img
                                    src={
                                        config.galleryImages[2] ||
                                        config.heroImageUrl
                                    }
                                    alt="Dining hours"
                                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>
            ) : null}

            {/* 9. Testimonials Carousel (#ffffff bg + #0b1514 dark cards + #f37d2f arrows) */}
            {config.sections.reviews !== false ? (
                <section
                    id="reviews"
                    className="bg-white text-[#131d1c] py-16 sm:py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-12">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.6 }}
                            className="text-center space-y-2"
                        >
                            <p
                                className="text-[18px] font-medium"
                                style={{ color: orange }}
                            >
                                {cc.reviewsEyebrow || "Testimonial"}
                            </p>
                            <h2 className="sofra-serif text-4xl sm:text-5xl lg:text-[64px] leading-[1.15] text-[#131d1c]">
                                {cc.reviewsTitle ||
                                    "What Our Guests Are Saying"}
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {visibleReviews.map(rev => (
                                <motion.div
                                    key={rev.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="bg-[#0b1514] text-white p-8 sm:p-10 flex flex-col justify-between gap-8"
                                >
                                    <p className="text-[18px] leading-[1.6] text-white/90">
                                        &ldquo;{rev.comment}&rdquo;
                                    </p>
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <p
                                                className="sofra-serif text-[24px]"
                                                style={{ color: orange }}
                                            >
                                                {rev.name}
                                            </p>
                                            <p className="text-sm text-white/60">
                                                {rev.role}
                                            </p>
                                        </div>
                                        <Quote
                                            className="size-10 opacity-35 shrink-0"
                                            style={{ color: orange }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {displayReviews.length > 2 ? (
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setReviewOffset(
                                            prev =>
                                                (prev -
                                                    1 +
                                                    displayReviews.length) %
                                                displayReviews.length,
                                        )
                                    }
                                    aria-label="Previous testimonial"
                                    className="flex size-12 items-center justify-center text-white transition-transform hover:scale-105 cursor-pointer"
                                    style={{ backgroundColor: orange }}
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setReviewOffset(
                                            prev =>
                                                (prev + 1) %
                                                displayReviews.length,
                                        )
                                    }
                                    aria-label="Next testimonial"
                                    className="flex size-12 items-center justify-center text-white transition-transform hover:scale-105 cursor-pointer"
                                    style={{ backgroundColor: orange }}
                                >
                                    <ChevronRight className="size-5" />
                                </button>
                            </div>
                        ) : null}

                        {slug ? (
                            <div className="pt-4">
                                <InlineWebsiteReviewForm
                                    slug={slug}
                                    tenantName={tenantName}
                                    accent={orange}
                                    theme="sofra"
                                />
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 10. Full-Bleed 5-Column Food Gallery Strip */}
            {config.sections.gallery && galleryPool.length > 0 ? (
                <section id="gallery" className="bg-[#131d1c]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0">
                        {galleryPool.map((src, idx) => (
                            <div
                                key={`${src}-${idx}`}
                                className="group aspect-[3/4] overflow-hidden bg-[#0b1514]"
                            >
                                <img
                                    src={src}
                                    alt={`${tenantName} gallery ${idx + 1}`}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* 11. Minimal Sofra Dark Footer (No Book a Table / Contact) */}
            <footer className="bg-[#131d1c] text-white pt-16 pb-10">
                <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-10">
                    <div className="overflow-hidden text-center select-none">
                        <p
                            className="sofra-serif text-5xl sm:text-8xl lg:text-[130px] uppercase tracking-[0.06em] leading-none text-transparent"
                            style={{
                                WebkitTextStroke: `1.5px ${orange}`,
                            }}
                        >
                            {tenantName}
                        </p>
                    </div>
                    <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/65">
                        <span>
                            {new Date().getFullYear()} {tenantName}. All rights
                            reserved.
                        </span>
                        <span>Crafted for {tenantName}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function InlineWebsiteReviewForm({
    slug,
    tenantName,
    accent,
    theme = "steakhouse",
}: {
    slug?: string | null;
    tenantName: string;
    accent: string;
    theme?: "steakhouse" | "sofra";
}) {
    const safeAccent = ensureBrightAccent(accent, "#f37d2f");
    const isSofra = theme === "sofra";
    const [submitReview, { isLoading }] = useSubmitWebsiteFeedbackMutation();
    const [rating, setRating] = useState<number>(5);
    const [hovered, setHovered] = useState<number>(0);
    const [customerName, setCustomerName] = useState("");
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) {
            setError("Publish your website first to accept live reviews.");
            return;
        }
        setError("");
        try {
            await submitReview({
                slug,
                body: {
                    rating,
                    customerName: customerName.trim() || undefined,
                    comment: comment.trim() || undefined,
                },
            }).unwrap();
            setSubmitted(true);
            setCustomerName("");
            setComment("");
        } catch (err: any) {
            setError(
                err?.data?.message || "Could not submit review. Try again.",
            );
        }
    };

    return (
        <div
            className={
                isSofra
                    ? "bg-[#131d1c] text-white p-6 sm:p-10 border border-white/10"
                    : "rounded-3xl border border-[#362013]/15 bg-[#362013] text-[#EFE7DA] p-5 @sm:p-8"
            }
        >
            {submitted ? (
                <div className="py-6 text-center space-y-3">
                    <CheckCircle2
                        className="mx-auto size-10"
                        style={{ color: safeAccent }}
                    />
                    <h3
                        className={
                            isSofra
                                ? "sofra-serif text-2xl sm:text-3xl text-white"
                                : "text-xl font-black uppercase tracking-tight"
                        }
                    >
                        Thank You for Rating {tenantName}!
                    </h3>
                    <p className="text-xs text-white/75 max-w-sm mx-auto">
                        Your review has been received and will appear on the
                        website once approved by the owner.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className={
                            isSofra
                                ? "mt-2 border border-white/25 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 cursor-pointer"
                                : "mt-2 rounded-full border border-[#EFE7DA]/25 px-4 py-1.5 text-xs font-bold hover:bg-white/10"
                        }
                    >
                        Write Another Review
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p
                                className="text-xs font-semibold uppercase tracking-[0.2em]"
                                style={{ color: safeAccent }}
                            >
                                LEAVE A REVIEW
                            </p>
                            <h3
                                className={
                                    isSofra
                                        ? "sofra-serif text-2xl sm:text-3xl text-white mt-1"
                                        : "text-xl font-black uppercase tracking-tight"
                                }
                            >
                                {isSofra
                                    ? "Rate Your Experience"
                                    : "RATE YOUR EXPERIENCE"}
                            </h3>
                        </div>

                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => {
                                const active = star <= (hovered || rating);
                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHovered(star)}
                                        onMouseLeave={() => setHovered(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 transition hover:scale-110 cursor-pointer"
                                        aria-label={`Rate ${star} stars`}
                                    >
                                        <Star
                                            className={`size-6 ${
                                                active
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-white/25"
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <input
                            type="text"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Your name (optional)"
                            className={
                                isSofra
                                    ? "sm:col-span-4 border border-[#f37d2f]/40 bg-[#0b1514] px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none focus:border-[#f37d2f]"
                                    : "sm:col-span-4 rounded-xl border border-[#EFE7DA]/20 bg-[#23150E] px-3.5 py-2.5 text-xs text-[#EFE7DA] placeholder:text-[#EFE7DA]/45 outline-none focus:border-[#EFE7DA]/50"
                            }
                        />
                        <input
                            type="text"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Share what you loved about the food or service..."
                            className={
                                isSofra
                                    ? "sm:col-span-6 border border-[#f37d2f]/40 bg-[#0b1514] px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none focus:border-[#f37d2f]"
                                    : "sm:col-span-6 rounded-xl border border-[#EFE7DA]/20 bg-[#23150E] px-3.5 py-2.5 text-xs text-[#EFE7DA] placeholder:text-[#EFE7DA]/45 outline-none focus:border-[#EFE7DA]/50"
                            }
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={
                                isSofra
                                    ? "sm:col-span-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                                    : "sm:col-span-2 rounded-xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            }
                            style={{ backgroundColor: safeAccent }}
                        >
                            {isLoading ? "Sending..." : "Submit"}
                        </button>
                    </div>

                    {error ? (
                        <p className="text-xs text-rose-300">{error}</p>
                    ) : null}
                </form>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* 2. DARK STEAKHOUSE & LOUNGE (Roast & Aroma Cream Top + Framer Motion)      */
/* -------------------------------------------------------------------------- */
function DarkSteakhouseSite({
    slug,
    tenantName,
    config,
    profile,
    menuItems,
}: SiteTemplateRenderProps) {
    const accent = config.accentColor || "#9A6B43";
    const heroImg = resolveMediaUrl(config.heroImageUrl);
    const addressLine = [profile?.address, profile?.city]
        .filter(Boolean)
        .join(", ");
    const mapsHref = addressLine
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`
        : undefined;
    const gallery = (config.galleryImages ?? [])
        .slice(0, 3)
        .map(resolveMediaUrl);

    const { data: approvedFeedback } = useGetPublicApprovedFeedbackQuery(
        { slug: slug ?? "" },
        { skip: !slug || config.sections.reviews === false },
    );
    const approvedReviews = approvedFeedback?.reviews ?? [];
    const totalApproved = approvedFeedback?.totalCount ?? 0;
    const averageApproved = approvedFeedback?.averageRating ?? 0;

    return (
        <div className="@container min-h-screen bg-[#EFE7DA] text-[#362013] overflow-x-hidden">
            {/* Sticky Cream Top Nav (matching Roast & Aroma screenshot) */}
            <header className="sticky top-0 z-30 border-b border-[#362013]/10 bg-[#EFE7DA]/95 backdrop-blur-md">
                <div className="mx-auto max-w-6xl px-4 @sm:px-6 h-16 flex items-center justify-between gap-3">
                    <span className="truncate text-base @sm:text-xl font-black uppercase tracking-tight text-[#362013]">
                        {tenantName}
                    </span>

                    <nav className="hidden @md:flex items-center gap-7 text-[11px] font-bold uppercase tracking-[0.2em] text-[#362013]/75">
                        {config.sections.menu ? (
                            <a href="#menu" className="hover:text-[#362013]">
                                Menu
                            </a>
                        ) : null}
                        {config.sections.story ? (
                            <a href="#story" className="hover:text-[#362013]">
                                About
                            </a>
                        ) : null}
                        {config.sections.gallery ? (
                            <a href="#gallery" className="hover:text-[#362013]">
                                Gallery
                            </a>
                        ) : null}
                        {config.sections.contact ? (
                            <a href="#contact" className="hover:text-[#362013]">
                                Contact
                            </a>
                        ) : null}
                    </nav>

                    <a
                        href="#menu"
                        className="shrink-0 rounded-full bg-[#362013] px-4 @sm:px-5 py-2 @sm:py-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#EFE7DA] transition hover:opacity-90"
                    >
                        {config.ctaLabel}
                    </a>
                </div>
            </header>

            {/* Warm Cream Hero (Roast & Aroma style) */}
            {config.sections.hero ? (
                <section className="mx-auto max-w-6xl px-4 @sm:px-6 py-8 @sm:py-20 grid grid-cols-1 @lg:grid-cols-12 gap-8 @sm:gap-10 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="@lg:col-span-6 space-y-5 @sm:space-y-6"
                    >
                        <p
                            className="text-[11px] font-extrabold uppercase tracking-[0.25em]"
                            style={{ color: accent }}
                        >
                            {config.badgeText}
                        </p>
                        <h1 className="text-4xl @sm:text-6xl @lg:text-[68px] font-black uppercase tracking-tight leading-[0.96] text-[#362013] break-words">
                            {config.heroHeadline}
                        </h1>
                        <p className="text-sm @sm:text-lg text-[#362013]/80 leading-relaxed max-w-lg">
                            {profile?.tagline || config.heroSubheadline}
                        </p>
                        <div className="flex flex-col @sm:flex-row flex-wrap items-stretch @sm:items-center gap-3 pt-1">
                            <a
                                href="#menu"
                                className="rounded-full bg-[#362013] px-7 py-3.5 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-[#EFE7DA] transition hover:opacity-90"
                            >
                                {config.ctaLabel}
                            </a>
                            {profile?.phone ? (
                                <a
                                    href={`tel:${profile.phone}`}
                                    className="rounded-full border border-[#362013]/30 bg-white/50 px-6 py-3.5 text-center text-xs font-bold uppercase tracking-[0.15em] text-[#362013] hover:bg-white/80"
                                >
                                    Call · {profile.phone}
                                </a>
                            ) : null}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, rotate: -1 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="@lg:col-span-6"
                    >
                        <div className="relative overflow-hidden rounded-[24px] @sm:rounded-[28px] border border-[#362013]/15 bg-[#E3D6C3] aspect-[4/3]">
                            <img
                                src={heroImg}
                                alt={tenantName}
                                className="h-full w-full object-cover transition duration-700 hover:scale-105"
                            />
                            {profile?.hours ? (
                                <div className="absolute bottom-3 left-3 right-3 @sm:bottom-4 @sm:left-4 @sm:right-auto rounded-2xl border border-[#362013]/10 bg-[#EFE7DA]/95 backdrop-blur-md px-3.5 @sm:px-4 py-2 @sm:py-2.5 flex items-center gap-2.5">
                                    <Clock
                                        className="size-4 shrink-0"
                                        style={{ color: accent }}
                                    />
                                    <span className="text-xs font-bold text-[#362013] truncate">
                                        Open · {profile.hours}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                </section>
            ) : null}

            {/* Animated Espresso Marquee Ticker */}
            <div className="overflow-hidden py-3.5 bg-[#362013] text-[#EFE7DA]">
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        duration: 22,
                        ease: "linear",
                    }}
                    className="flex w-max items-center gap-8 whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                >
                    {[0, 1, 2, 3].map(i => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-8"
                        >
                            <span>{tenantName}</span>
                            <span style={{ color: accent }}>•</span>
                            <span>{config.badgeText}</span>
                            <span style={{ color: accent }}>•</span>
                            <span>{profile?.hours || "DINE-IN & TAKEOUT"}</span>
                            <span style={{ color: accent }}>•</span>
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* Live Restaurant Menu on Warm Ivory */}
            {config.sections.menu ? (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.55 }}
                    className="bg-[#FAF5EE] text-[#362013]"
                >
                    {config.sections.spotlight ? (
                        <div className="mx-auto max-w-6xl px-4 @sm:px-6 pt-12">
                            <div className="rounded-2xl border border-[#362013]/12 bg-[#EFE7DA]/70 p-5 @sm:p-6 flex flex-col @sm:flex-row @sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Flame
                                        className="size-5 shrink-0"
                                        style={{ color: accent }}
                                    />
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-wider text-[#362013]">
                                            {config.spotlightTitle}
                                        </h2>
                                        <p className="text-xs text-[#362013]/75">
                                            {config.spotlightNote}
                                        </p>
                                    </div>
                                </div>
                                {addressLine ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#362013] px-3.5 py-1.5 text-xs font-semibold text-[#EFE7DA] shrink-0">
                                        <MapPin
                                            className="size-3.5"
                                            style={{ color: accent }}
                                        />
                                        {addressLine}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <SiteMenuExplorer
                        items={menuItems}
                        accentColor={accent}
                        variant="cream"
                        layout={config.menuLayout ?? "cards"}
                        title="OUR MENU"
                        subtitle="Freshly prepared dishes & drinks, updated live from our kitchen."
                    />
                </motion.div>
            ) : null}

            {/* 4. OUR STORY (Arch Photo + 3-Stat Row like Roast & Aroma) & GALLERY */}
            {config.sections.story || config.sections.gallery ? (
                <section
                    id="story"
                    className="bg-[#EFE7DA] text-[#362013] py-14 @sm:py-24 border-t border-[#362013]/10"
                >
                    <div className="mx-auto max-w-6xl px-4 @sm:px-6 space-y-14">
                        {config.sections.story ? (
                            <div className="grid grid-cols-1 @lg:grid-cols-12 gap-8 @lg:gap-12 items-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55 }}
                                    className="@lg:col-span-5"
                                >
                                    <div className="overflow-hidden rounded-t-[140px] @sm:rounded-t-[200px] rounded-b-3xl border border-[#362013]/12 bg-[#E3D6C3] aspect-[4/5]">
                                        <img
                                            src={gallery[0] || heroImg}
                                            alt={`${tenantName} story`}
                                            className="h-full w-full object-cover transition duration-700 hover:scale-105"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.08 }}
                                    className="@lg:col-span-7 space-y-6"
                                >
                                    <div className="space-y-3">
                                        <p
                                            className="text-[11px] font-extrabold uppercase tracking-[0.25em]"
                                            style={{ color: accent }}
                                        >
                                            OUR STORY
                                        </p>
                                        <h2 className="text-4xl @sm:text-5xl @lg:text-[54px] font-black uppercase tracking-tight leading-[0.96] text-[#362013]">
                                            MORE THAN A RESTAURANT
                                        </h2>
                                    </div>

                                    <p className="text-sm @sm:text-base text-[#362013]/80 leading-relaxed max-w-xl">
                                        {profile?.story ||
                                            "From fresh morning prep to evening table service, we bring warm hospitality, honest local ingredients, and memorable flavors to every guest."}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Dine-In",
                                            "Takeout",
                                            "Group Tables",
                                        ].map(tag => (
                                            <span
                                                key={tag}
                                                className="rounded-full border border-[#362013]/20 bg-[#FAF5EE] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#362013]"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 @sm:gap-6 pt-6 border-t border-[#362013]/15">
                                        <div>
                                            <p className="text-2xl @sm:text-3xl font-black text-[#362013]">
                                                {menuItems.length > 0
                                                    ? `${menuItems.length}+`
                                                    : "FRESH"}
                                            </p>
                                            <p className="mt-1 text-[10px] @sm:text-[11px] font-bold uppercase tracking-widest text-[#362013]/65">
                                                Dishes &amp; Drinks
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl @sm:text-3xl font-black text-[#362013]">
                                                100%
                                            </p>
                                            <p className="mt-1 text-[10px] @sm:text-[11px] font-bold uppercase tracking-widest text-[#362013]/65">
                                                Made Fresh Daily
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl @sm:text-3xl font-black text-[#362013]">
                                                {totalApproved > 0
                                                    ? `${averageApproved.toFixed(1)}★`
                                                    : "DAILY"}
                                            </p>
                                            <p className="mt-1 text-[10px] @sm:text-[11px] font-bold uppercase tracking-widest text-[#362013]/65">
                                                {totalApproved > 0
                                                    ? "Guest Rating"
                                                    : "Open Service"}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ) : null}

                        {config.sections.gallery && gallery.length > 0 ? (
                            <div
                                id="gallery"
                                className="grid grid-cols-1 @sm:grid-cols-3 gap-4"
                            >
                                {gallery.map((src, idx) => (
                                    <motion.div
                                        key={`${src}-${idx}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{
                                            duration: 0.45,
                                            delay: idx * 0.08,
                                        }}
                                        className="overflow-hidden rounded-3xl border border-[#362013]/12 aspect-[4/3] bg-[#E3D6C3]"
                                    >
                                        <img
                                            src={src}
                                            alt={`${tenantName} ${idx + 1}`}
                                            className="h-full w-full object-cover transition duration-700 hover:scale-105"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* Approved Guest Ratings & Reviews + Inline Review Submission */}
            {config.sections.reviews !== false ? (
                <section className="bg-[#FAF5EE] text-[#362013] py-16 @sm:py-24 border-t border-[#362013]/10">
                    <div className="mx-auto max-w-6xl px-4 @sm:px-6 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col @md:flex-row @md:items-end justify-between gap-6"
                        >
                            <div>
                                <p
                                    className="text-[11px] font-extrabold uppercase tracking-[0.25em]"
                                    style={{ color: accent }}
                                >
                                    GUEST RATINGS &amp; REVIEWS
                                </p>
                                <h2 className="mt-2 text-4xl @sm:text-5xl font-black uppercase tracking-tight leading-[0.98] text-[#362013]">
                                    LOVED BY OUR GUESTS
                                </h2>
                            </div>

                            {totalApproved > 0 ? (
                                <div className="flex items-center gap-4 rounded-2xl border border-[#362013]/15 bg-[#EFE7DA] px-5 py-3.5">
                                    <span className="text-3xl font-black text-[#362013]">
                                        {averageApproved.toFixed(1)}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className={`size-4 ${
                                                        s <=
                                                        Math.round(
                                                            averageApproved,
                                                        )
                                                            ? "fill-amber-500 text-amber-500"
                                                            : "text-[#362013]/20"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-0.5 text-[11px] font-semibold text-[#362013]/70">
                                            Based on {totalApproved} verified{" "}
                                            {totalApproved === 1
                                                ? "review"
                                                : "reviews"}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>

                        {totalApproved > 0 ? (
                            <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 @sm:gap-5">
                                {approvedReviews.slice(0, 6).map((rev, idx) => (
                                    <motion.div
                                        key={rev.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.15 }}
                                        transition={{
                                            duration: 0.45,
                                            delay: idx * 0.07,
                                        }}
                                        className="rounded-3xl border border-[#362013]/12 bg-[#EFE7DA]/80 p-5 @sm:p-6 flex flex-col justify-between gap-5"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star
                                                            key={s}
                                                            className={`size-3.5 ${
                                                                s <= rev.rating
                                                                    ? "fill-amber-500 text-amber-500"
                                                                    : "text-stone-300"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <Quote
                                                    className="size-4 opacity-40"
                                                    style={{ color: accent }}
                                                />
                                            </div>
                                            {rev.comment ? (
                                                <p className="text-sm text-[#362013]/85 leading-relaxed">
                                                    “{rev.comment}”
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="pt-3 border-t border-[#362013]/10 flex items-center justify-between text-xs">
                                            <span className="font-bold text-[#362013]">
                                                {rev.customerName ||
                                                    "Verified Guest"}
                                            </span>
                                            <span className="text-[#362013]/55">
                                                {new Date(
                                                    rev.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : null}

                        <InlineWebsiteReviewForm
                            slug={slug}
                            tenantName={tenantName}
                            accent={accent}
                        />
                    </div>
                </section>
            ) : null}

            {/* 5. VISIT & DIRECT CONTACT (Warm Cream, NO Contact Form) */}
            {config.sections.contact ? (
                <section
                    id="contact"
                    className="bg-[#EFE7DA] text-[#362013] py-16 @sm:py-24 border-t border-[#362013]/10"
                >
                    <div className="mx-auto max-w-6xl px-4 @sm:px-6 grid grid-cols-1 @lg:grid-cols-12 gap-10 items-start">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.5 }}
                            className="@lg:col-span-5 space-y-5"
                        >
                            <p
                                className="text-[11px] font-extrabold uppercase tracking-[0.25em]"
                                style={{ color: accent }}
                            >
                                VISIT &amp; DIRECT CONTACT
                            </p>
                            <h2 className="text-4xl @sm:text-5xl font-black uppercase tracking-tight leading-[0.96] text-[#362013]">
                                COME DINE WITH US
                            </h2>
                            <p className="text-sm text-[#362013]/75 leading-relaxed">
                                {profile?.tagline ||
                                    "Reach out to our branch team directly by phone or email for table reservations, takeout, or group dining."}
                            </p>

                            <div className="space-y-3 pt-1">
                                {addressLine ? (
                                    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#362013]/12 bg-[#FAF5EE] p-4">
                                        <div className="flex items-start gap-3">
                                            <MapPin
                                                className="size-4 shrink-0 mt-0.5"
                                                style={{ color: accent }}
                                            />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#362013]/55">
                                                    Address
                                                </p>
                                                <p className="text-sm font-bold text-[#362013]">
                                                    {addressLine}
                                                </p>
                                            </div>
                                        </div>
                                        {mapsHref ? (
                                            <a
                                                href={mapsHref}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="shrink-0 rounded-full bg-[#362013] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#EFE7DA]"
                                            >
                                                Directions
                                            </a>
                                        ) : null}
                                    </div>
                                ) : null}

                                {profile?.hours ? (
                                    <div className="flex items-start gap-3 rounded-2xl border border-[#362013]/12 bg-[#FAF5EE] p-4">
                                        <Clock
                                            className="size-4 shrink-0 mt-0.5"
                                            style={{ color: accent }}
                                        />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#362013]/55">
                                                Opening Hours
                                            </p>
                                            <p className="text-sm font-bold text-[#362013]">
                                                {profile.hours}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <SocialLinks profile={profile} />
                        </motion.div>

                        <div className="@lg:col-span-7 grid grid-cols-1 @sm:grid-cols-3 gap-4">
                            {[
                                {
                                    key: "phone",
                                    label: "Phone",
                                    hint: "Tap to call",
                                    value: profile?.phone || "Not set yet",
                                    href: profile?.phone
                                        ? `tel:${profile.phone}`
                                        : undefined,
                                    Icon: Phone,
                                },
                                {
                                    key: "email",
                                    label: "Email",
                                    hint: "Direct email",
                                    value: profile?.email || "Not set yet",
                                    href: profile?.email
                                        ? `mailto:${profile.email}`
                                        : undefined,
                                    Icon: Mail,
                                },
                                {
                                    key: "manager",
                                    label: "Branch Manager",
                                    hint: "On duty",
                                    value:
                                        config.managerName || "Floor Manager",
                                    href: undefined,
                                    Icon: UserCheck,
                                },
                            ].map((card, idx) => {
                                const CardIcon = card.Icon;
                                const cardBody = (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{
                                            duration: 0.45,
                                            delay: idx * 0.08,
                                        }}
                                        whileHover={{ y: -4 }}
                                        className="h-full rounded-3xl border border-[#362013]/12 bg-[#362013] text-[#EFE7DA] p-5 @sm:p-6 flex flex-col justify-between gap-6 transition"
                                    >
                                        <div
                                            className="inline-flex size-11 items-center justify-center rounded-2xl"
                                            style={{
                                                backgroundColor: `${accent}26`,
                                                color: "#EFE7DA",
                                            }}
                                        >
                                            <CardIcon className="size-5" />
                                        </div>
                                        <div>
                                            <p
                                                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                                                style={{ color: accent }}
                                            >
                                                {card.label}
                                            </p>
                                            <p className="mt-1.5 text-sm font-bold text-[#EFE7DA] break-all">
                                                {card.value}
                                            </p>
                                            <p className="mt-1 text-[11px] text-[#EFE7DA]/60">
                                                {card.hint}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                                return card.href ? (
                                    <a key={card.key} href={card.href}>
                                        {cardBody}
                                    </a>
                                ) : (
                                    <div key={card.key}>{cardBody}</div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mx-auto max-w-6xl px-4 @sm:px-6 mt-14 pt-6 border-t border-[#362013]/15 flex flex-col @sm:flex-row items-center justify-between gap-2 text-xs text-[#362013]/60">
                        <span>
                            © {new Date().getFullYear()} {tenantName}
                        </span>
                        <span>Powered by Restorch</span>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* 3. COFFEE HOUSE & BAKERY (SUMAC EDITORIAL DESIGN)                          */
/* -------------------------------------------------------------------------- */
function SumacRevealWord({
    word,
    index,
    total,
    progress,
    accentWord,
}: {
    word: string;
    index: number;
    total: number;
    progress: ReturnType<typeof useScroll>["scrollYProgress"];
    accentWord?: boolean;
}) {
    const start = (index / total) * 0.72;
    const end = Math.min(1, start + 0.14);
    const opacity = useTransform(progress, [start, end], [0.16, 1]);
    return (
        <motion.span
            style={{ opacity, color: accentWord ? "#A67346" : "#14110F" }}
            className="inline-block mr-[0.26em]"
        >
            {word}
        </motion.span>
    );
}

function CoffeeHouseSite({
    slug,
    tenantName,
    config,
    profile,
    menuItems,
}: SiteTemplateRenderProps) {
    const sand = ensureBrightAccent(config.accentColor, "#D2AA7D");
    const terracotta = "#822822";

    const hearthRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: hearthProgress } = useScroll({
        target: hearthRef,
        offset: ["start 0.85", "end 0.55"],
    });

    const counterRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: counterProgress } = useScroll({
        target: counterRef,
        offset: ["start end", "center center"],
    });
    const counterMargin = useTransform(counterProgress, [0, 1], [48, 0]);
    const counterRadius = useTransform(counterProgress, [0, 1], [16, 0]);

    const roomRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: roomProgress } = useScroll({
        target: roomRef,
        offset: ["start end", "center center"],
    });
    const roomScale = useTransform(roomProgress, [0, 1], [1.14, 1]);

    const timelineRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: timelineProgress } = useScroll({
        target: timelineRef,
        offset: ["start start", "end end"],
    });
    const timelineX = useTransform(timelineProgress, [0, 1], ["0%", "-26%"]);

    const reviewsRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: reviewsProgress } = useScroll({
        target: reviewsRef,
        offset: ["start end", "end start"],
    });
    const reviewParallaxEven = useTransform(reviewsProgress, [0, 1], [36, -36]);
    const reviewParallaxOdd = useTransform(reviewsProgress, [0, 1], [-24, 24]);

    const cc = config.customCopy ?? {};

    const [hoveredDishIdx, setHoveredDishIdx] = useState<number | null>(null);
    const [showFullMenu, setShowFullMenu] = useState(false);

    const { data: approvedFeedback } = useGetPublicApprovedFeedbackQuery(
        { slug: slug ?? "" },
        { skip: !slug || config.sections.reviews === false },
    );
    const approvedReviews = approvedFeedback?.reviews ?? [];

    const signatureItems = menuItems.slice(0, 6);
    const marqueePairs =
        cc.marqueeItems && cc.marqueeItems.length > 0
            ? cc.marqueeItems.map((text, idx) => ({
                  bold: text,
                  italic: ["warm", "fresh", "slow", "handcrafted"][idx % 4],
              }))
            : [
                  { bold: "Single-origin pour-overs", italic: "warm" },
                  { bold: "Artisan croissants & sourdough", italic: "fresh" },
                  { bold: "Small-batch espresso", italic: "slow" },
                  { bold: "Morning bakes from 4:30 AM", italic: "handcrafted" },
              ];

    const storyText =
        profile?.story ||
        `${tenantName} is a coffee house and bakery built around one idea: everything tastes better fresh from the roaster and the oven.`;
    const storyWords = storyText.split(/\s+/);
    const highlightStartIdx = Math.max(0, storyWords.length - 7);

    const defaultTimelineStages = [
        {
            time: "6:30 AM",
            title: "First Crack & Oven",
            desc: "Laminated butter croissants and country sourdough pulled golden from the deck oven.",
        },
        {
            time: "9:00 AM",
            title: "Single-Origin Pour",
            desc: "Washed Ethiopian highland beans ground to order and brewed slow over glass.",
        },
        {
            time: "2:00 PM",
            title: "Afternoon Pastry",
            desc: "Cardamom buns, tartlets, and velvety flat whites for unhurried conversation.",
        },
        {
            time: "6:00 PM",
            title: "Evening Espresso",
            desc: "Rich dark-roast pulls, warm cakes, and a quiet corner as the lights dim.",
        },
    ];
    const timelineStages = (
        cc.timelineStages && cc.timelineStages.length > 0
            ? cc.timelineStages
            : defaultTimelineStages
    ).map((st, idx) => ({
        ...st,
        img:
            config.galleryImages[
                idx % Math.max(1, config.galleryImages.length)
            ] || config.heroImageUrl,
    }));

    const defaultCraftDeck = [
        {
            tag: "Small-batch roast",
            title: "Single-origin highland beans",
            desc: "Roasted in small batches for bright floral aromatics, cocoa sweetness, and zero bitterness.",
        },
        {
            tag: "Deck oven",
            title: "72-hour laminated pastry",
            desc: "Cultured butter folded into crisp, honeycombed layers and baked fresh before sunrise.",
        },
        {
            tag: "Pour-over bar",
            title: "Hand-poured filter coffee",
            desc: "Water temperature, grind size, and bloom timed to the second for clean clarity in every cup.",
        },
        {
            tag: "Sweet table",
            title: "Warm tarts & seasonal cakes",
            desc: "Roasted nuts, caramelized honey, and seasonal fruit folded into light, balanced bakes.",
        },
    ];
    const craftDeck = (
        cc.highlights && cc.highlights.length > 0
            ? cc.highlights
            : defaultCraftDeck
    ).map((c, idx) => ({
        tag: c.tag || "House Craft",
        eyebrow: [
            "ROASTERY · DAILY",
            "BAKERY · 4:30 AM",
            "BREW · PRECISION",
            "PASTRY · HOUSE-MADE",
        ][idx % 4],
        title: c.title,
        desc: c.desc,
        img:
            config.galleryImages[
                idx % Math.max(1, config.galleryImages.length)
            ] || config.heroImageUrl,
    }));

    const roasteryStats =
        cc.stats && cc.stats.length > 0
            ? cc.stats.slice(0, 3)
            : [
                  {
                      num: "100%",
                      label: "Single-origin highland beans roasted in-house",
                  },
                  {
                      num: "4:30",
                      label: "The deck ovens warm every morning before dawn",
                  },
                  {
                      num: `${Math.max(menuItems.length, 12)}`,
                      label: "Signature brews, pastries & seasonal plates",
                  },
              ];

    const reviewCards =
        approvedReviews.length > 0
            ? approvedReviews.slice(0, 5).map(r => ({
                  id: r.id,
                  quote:
                      r.comment ||
                      "Best morning coffee and flaky pastries in the neighborhood.",
                  source: (r.customerName || "VERIFIED GUEST").toUpperCase(),
              }))
            : [
                  {
                      id: "sumac-c-1",
                      quote: "The espresso has remarkable clarity and the croissants arrive still warm from the deck oven.",
                      source: "MORNING COFFEE JOURNAL",
                  },
                  {
                      id: "sumac-c-2",
                      quote: "A calm, architectural room filled with the aroma of roasted beans and browned butter.",
                      source: "CITY PLATE",
                  },
                  {
                      id: "sumac-c-3",
                      quote: "Every detail—from the pour-over timing to the sourdough crust—feels deeply intentional.",
                      source: "THE TABLE REVIEW",
                  },
                  {
                      id: "sumac-c-4",
                      quote: "Our favorite morning ritual in town. Unhurried hospitality and extraordinary pastries.",
                      source: "LOCAL ROAST GUIDE",
                  },
                  {
                      id: "sumac-c-5",
                      quote: "Rich single-origin brews paired with honest, handcrafted baking. Worth planning your morning around.",
                      source: "EAT LOCAL WEEKLY",
                  },
              ];

    const roomPhotos = [
        config.heroImageUrl,
        ...(config.galleryImages ?? []),
        config.heroImageUrl,
        ...(config.galleryImages ?? []),
        config.heroImageUrl,
        ...(config.galleryImages ?? []),
    ].slice(0, 9);

    return (
        <div
            className="min-h-screen bg-[#110E0C] text-[#F4EDE2] overflow-x-clip"
            style={{ fontFamily: "'Schibsted Grotesk', system-ui, sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=IBM+Plex+Mono:wght@400;500&family=Schibsted+Grotesk:wght@400;500;600&display=swap');
                .sumac-serif { font-family: 'Fraunces', Georgia, serif; }
                .sumac-mono { font-family: 'IBM Plex Mono', monospace; }
            `}</style>

            {/* 1. Sticky Obsidian Header */}
            <header className="sticky top-0 z-30 bg-[#110E0C]/92 backdrop-blur-md border-b border-[#F4EDE2]/10">
                <div className="mx-auto max-w-[1400px] px-5 sm:px-8 h-[72px] flex items-center justify-between gap-4">
                    <a href="#top" className="flex items-baseline gap-2.5">
                        <span className="sumac-serif text-xl font-bold uppercase tracking-[-0.02em] text-[#F4EDE2]">
                            {tenantName}
                        </span>
                        <span
                            className="hidden sm:inline sumac-serif italic text-sm"
                            style={{ color: sand }}
                        >
                            roasted &amp; baked
                        </span>
                    </a>

                    <nav className="hidden lg:flex items-center gap-7 text-[14px] text-[#F4EDE2]/85">
                        {config.sections.menu ? (
                            <a
                                href="#menu"
                                className="hover:text-[#D2AA7D] transition-colors"
                            >
                                Menu
                            </a>
                        ) : null}
                        <a
                            href="#craft"
                            className="hover:text-[#D2AA7D] transition-colors"
                        >
                            Craft
                        </a>
                        {config.sections.story ? (
                            <a
                                href="#story"
                                className="hover:text-[#D2AA7D] transition-colors"
                            >
                                About
                            </a>
                        ) : null}
                        {config.sections.gallery ? (
                            <a
                                href="#gallery"
                                className="hover:text-[#D2AA7D] transition-colors"
                            >
                                The Room
                            </a>
                        ) : null}
                        {config.sections.reviews !== false ? (
                            <a
                                href="#reviews"
                                className="hover:text-[#D2AA7D] transition-colors"
                            >
                                Reviews
                            </a>
                        ) : null}
                    </nav>

                    <div className="flex items-center gap-4">
                        <span className="hidden md:inline-flex items-center gap-2 sumac-mono text-[11px] uppercase tracking-[0.08em] text-[#F4EDE2]/80">
                            <span className="size-1.5 rounded-full bg-[#52C466]" />
                            Open · Fresh Brew
                        </span>
                        <a
                            href="#menu"
                            className="rounded-full px-5 py-2.5 text-[13px] font-medium text-[#110E0C] transition-transform hover:scale-[1.03]"
                            style={{ backgroundColor: sand }}
                        >
                            {config.ctaLabel || "See the menu"}
                        </a>
                    </div>
                </div>
            </header>

            {/* 2. Full-Bleed Dark Hero */}
            {config.sections.hero ? (
                <section
                    id="top"
                    className="relative min-h-[82vh] flex flex-col justify-between bg-[#110E0C] overflow-hidden"
                >
                    <img
                        src={config.heroImageUrl}
                        alt={tenantName}
                        className="absolute inset-0 h-full w-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#110E0C]/75 via-[#110E0C]/45 to-[#110E0C]" />

                    <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8 pt-8 pb-8 flex-1 flex flex-col justify-between gap-12">
                        {/* Top Metadata Row */}
                        <div className="flex flex-wrap items-start justify-between gap-4 sumac-mono text-[11px] uppercase tracking-[0.1em] text-[#F4EDE2]/75">
                            <div>
                                <p>(COFFEE HOUSE &amp; BAKERY)</p>
                                <p className="mt-0.5 text-[#F4EDE2]/95">
                                    {profile?.address ||
                                        "SMALL-BATCH ROASTERY & OVEN"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p>ROASTING DAILY</p>
                                <p className="mt-0.5 text-[#F4EDE2]/95">
                                    {profile?.hours || config.badgeText}
                                </p>
                            </div>
                        </div>

                        {/* Middle 2-Col Split */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                            <motion.p
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.65 }}
                                className="md:col-span-6 text-[16px] sm:text-[18px] leading-[1.5] text-[#F4EDE2]/90 max-w-md"
                            >
                                {profile?.tagline || config.heroSubheadline}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.65, delay: 0.1 }}
                                className="md:col-span-6 flex md:justify-end flex-wrap gap-3"
                            >
                                <a
                                    href="#menu"
                                    className="rounded-full px-6 py-3 text-[14px] font-medium text-[#110E0C] transition-transform hover:scale-[1.03]"
                                    style={{ backgroundColor: sand }}
                                >
                                    {config.ctaLabel || "See the menu"}
                                </a>
                                <a
                                    href="#story"
                                    className="rounded-full border border-[#F4EDE2]/35 px-6 py-3 text-[14px] font-medium text-[#F4EDE2] hover:border-[#F4EDE2] transition-colors"
                                >
                                    Our story
                                </a>
                            </motion.div>
                        </div>

                        {/* Giant Wordmark + Overlapping Italic */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.75 }}
                                className="relative"
                            >
                                <h1 className="sumac-serif text-[14vw] sm:text-[12vw] lg:text-[148px] font-bold uppercase leading-[0.88] tracking-[-0.03em] text-[#F4EDE2]">
                                    {tenantName}
                                </h1>
                                <p
                                    className="sumac-serif italic text-3xl sm:text-5xl lg:text-[68px] leading-none -mt-3 sm:-mt-6 ml-2 sm:ml-8"
                                    style={{ color: sand }}
                                >
                                    roasted &amp; baked daily.
                                </p>
                            </motion.div>

                            {/* Bottom Bar */}
                            <div className="pt-5 border-t border-[#F4EDE2]/15 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {galleryPoolOrFallback(
                                            config.galleryImages,
                                            config.heroImageUrl,
                                        )
                                            .slice(0, 4)
                                            .map((src, i) => (
                                                <img
                                                    key={`${src}-${i}`}
                                                    src={src}
                                                    alt=""
                                                    className="size-9 rounded-full object-cover border-2 border-[#110E0C]"
                                                />
                                            ))}
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-semibold text-[#F4EDE2]">
                                            4.9 ★
                                        </span>
                                        <span className="ml-2 text-[#9A9188]">
                                            Crafted fresh from sunrise
                                        </span>
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-3 rounded-full border border-[#F4EDE2]/20 bg-[#110E0C]/70 backdrop-blur-md pl-4 pr-1.5 py-1.5">
                                    <span className="size-1.5 rounded-full bg-[#52C466]" />
                                    <span className="sumac-mono text-[11px] uppercase tracking-[0.06em] text-[#F4EDE2]/90">
                                        {config.badgeText}
                                    </span>
                                    <a
                                        href="#menu"
                                        className="rounded-full px-3.5 py-1 text-xs font-medium text-[#110E0C]"
                                        style={{ backgroundColor: sand }}
                                    >
                                        Menu
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 3. Marquee Strip */}
            {config.sections.marquee !== false ? (
                <div className="bg-[#110E0C] border-y border-[#F4EDE2]/10 py-6 overflow-hidden select-none">
                    <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 28,
                        }}
                        className="flex w-max items-center gap-10 whitespace-nowrap"
                    >
                        {[...marqueePairs, ...marqueePairs].map((pair, i) => (
                            <div
                                key={`${pair.bold}-${i}`}
                                className="flex items-baseline gap-4"
                            >
                                <span className="sumac-serif text-xl sm:text-2xl font-semibold text-[#F4EDE2]">
                                    {pair.bold}
                                </span>
                                <span
                                    className="sumac-serif italic text-xl sm:text-2xl"
                                    style={{ color: sand }}
                                >
                                    {pair.italic}
                                </span>
                                <span className="text-[#F4EDE2]/25 px-2">
                                    ·
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            ) : null}

            {/* 4. Section (01) THE HEARTH / ROASTERY (#F3ECE1 Warm Cream + Word Reveal + 3 Stats) */}
            {config.sections.story ? (
                <section
                    id="story"
                    ref={hearthRef}
                    className="bg-[#F3ECE1] text-[#14110F] py-20 sm:py-32"
                >
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-16">
                        <div className="pb-4 border-b border-[#14110F]/12 flex items-center justify-between sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#6E655D]">
                            <span>
                                {cc.aboutEyebrow || "(01) THE ROASTERY"}
                            </span>
                            <span>ARTISAN ROAST &amp; BAKE</span>
                        </div>

                        <p className="sumac-serif text-3xl sm:text-5xl lg:text-[52px] font-medium leading-[1.18] tracking-[-0.015em] max-w-5xl">
                            {storyWords.map((word, idx) => (
                                <SumacRevealWord
                                    key={`${word}-${idx}`}
                                    word={word}
                                    index={idx}
                                    total={storyWords.length}
                                    progress={hearthProgress}
                                    accentWord={idx >= highlightStartIdx}
                                />
                            ))}
                        </p>

                        {config.sections.stats !== false ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#14110F]/12 pt-8 gap-8 md:gap-0">
                                {roasteryStats.map((stat, idx) => (
                                    <div
                                        key={stat.label}
                                        className={
                                            idx > 0
                                                ? "md:border-l md:border-[#14110F]/12 md:pl-8"
                                                : "md:pr-8"
                                        }
                                    >
                                        <p className="sumac-serif text-5xl sm:text-[56px] font-semibold leading-none text-[#14110F]">
                                            {stat.num}
                                        </p>
                                        <p className="mt-3 text-[15px] text-[#6E655D] max-w-xs">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 5. Section (02) THE MENU (#110E0C + Hover-to-Taste Floating Dish Photo) */}
            {config.sections.menu ? (
                <section
                    id="menu"
                    className="bg-[#110E0C] text-[#F4EDE2] py-20 sm:py-28 relative"
                >
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-12">
                        <div className="pb-4 border-b border-[#F4EDE2]/12 flex items-center justify-between sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#9A9188]">
                            <span>{cc.menuEyebrow || "(02) THE MENU"}</span>
                            <span>SIGNATURES · HOVER TO TASTE</span>
                        </div>

                        <h2 className="sumac-serif text-4xl sm:text-6xl lg:text-[68px] font-semibold leading-[1.05] tracking-[-0.02em]">
                            {cc.menuTitle || (
                                <>
                                    Six favorites we&apos;re{" "}
                                    <span style={{ color: sand }}>
                                        known for.
                                    </span>
                                </>
                            )}
                        </h2>

                        <div
                            className="relative divide-y divide-[#F4EDE2]/12 border-y border-[#F4EDE2]/12"
                            onMouseLeave={() => setHoveredDishIdx(null)}
                        >
                            {signatureItems.map((item, idx) => {
                                const isActive = hoveredDishIdx === idx;
                                const isDimmed =
                                    hoveredDishIdx !== null && !isActive;
                                const dishImg = item.imageUrl
                                    ? resolveMediaUrl(item.imageUrl)
                                    : config.galleryImages[
                                          idx %
                                              Math.max(
                                                  1,
                                                  config.galleryImages.length,
                                              )
                                      ] || config.heroImageUrl;
                                return (
                                    <div
                                        key={item.id}
                                        onMouseEnter={() =>
                                            setHoveredDishIdx(idx)
                                        }
                                        onClick={() =>
                                            setHoveredDishIdx(
                                                isActive ? null : idx,
                                            )
                                        }
                                        className="relative py-6 sm:py-7 grid grid-cols-12 gap-4 items-center cursor-pointer transition-opacity duration-300"
                                        style={{
                                            opacity: isDimmed ? 0.3 : 1,
                                        }}
                                    >
                                        <span className="col-span-2 sm:col-span-1 sumac-mono text-xs text-[#9A9188]">
                                            {String(idx + 1).padStart(2, "0")}
                                        </span>
                                        <h3 className="col-span-10 sm:col-span-5 sumac-serif text-2xl sm:text-[38px] font-semibold tracking-[-0.02em] text-[#F4EDE2]">
                                            {item.name}
                                        </h3>
                                        <p className="col-span-8 sm:col-span-4 text-sm sm:text-[15px] text-[#9A9188] line-clamp-2">
                                            {item.description ||
                                                item.categoryName ||
                                                "Prepared fresh to order."}
                                        </p>
                                        <span
                                            className="col-span-4 sm:col-span-2 text-right sumac-mono text-xs sm:text-sm"
                                            style={{ color: sand }}
                                        >
                                            {formatEtb(Number(item.price))}
                                        </span>

                                        {isActive ? (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    rotate: -8,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    rotate: -5,
                                                }}
                                                className="hidden lg:block pointer-events-none absolute right-[18%] -top-10 z-20 w-48 h-36 overflow-hidden rounded-md shadow-2xl border border-[#F4EDE2]/20"
                                            >
                                                <img
                                                    src={dishImg}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </motion.div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                            <p className="text-sm text-[#9A9188] max-w-md">
                                Every espresso can be poured with oat or almond
                                milk, and pastries are baked in small batches
                                throughout the morning.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowFullMenu(prev => !prev)}
                                className="rounded-full border border-[#F4EDE2]/30 px-6 py-2.5 text-[14px] font-medium text-[#F4EDE2] hover:border-[#D2AA7D] hover:text-[#D2AA7D] transition-colors cursor-pointer"
                            >
                                {showFullMenu
                                    ? "Hide full menu"
                                    : "The full menu"}
                            </button>
                        </div>

                        {showFullMenu ? (
                            <div className="rounded-2xl bg-[#F3ECE1] text-[#14110F] p-4 sm:p-6">
                                <SiteMenuExplorer
                                    items={menuItems}
                                    accentColor={sand}
                                    variant="editorial"
                                    layout={config.menuLayout ?? "editorial"}
                                    title="Full Cafe & Bakery Menu"
                                    subtitle="Live kitchen & barista offerings."
                                />
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 6. Section (03) A DAY AT TENANT (Scroll-Pinned Horizontal Timeline + Progress Bar) */}
            {config.sections.timeline !== false ? (
                <>
                    <section
                        ref={timelineRef}
                        className="bg-[#110E0C] text-[#F4EDE2] border-t border-[#F4EDE2]/10 lg:h-[185vh]"
                    >
                        <div className="lg:sticky lg:top-20 py-16 sm:py-24 overflow-hidden">
                            <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-10">
                                <div className="space-y-3">
                                    <p className="sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#9A9188]">
                                        {cc.timelineEyebrow ||
                                            `(03) A DAY AT ${tenantName.toUpperCase()}`}
                                    </p>
                                    <h2 className="sumac-serif text-4xl sm:text-6xl font-semibold tracking-[-0.02em]">
                                        {cc.timelineTitle ||
                                            "From the oven to the last espresso."}
                                    </h2>
                                </div>

                                {/* Desktop scroll-driven horizontal track */}
                                <motion.div
                                    style={{ x: timelineX }}
                                    className="hidden lg:flex gap-6 will-change-transform"
                                >
                                    {timelineStages.map(stage => (
                                        <div
                                            key={stage.title}
                                            className="w-[410px] shrink-0 space-y-3"
                                        >
                                            <div className="aspect-[16/10] w-full overflow-hidden bg-[#1b1613]">
                                                <img
                                                    src={stage.img}
                                                    alt={stage.title}
                                                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <p
                                                className="sumac-mono text-[11px] uppercase tracking-[0.08em]"
                                                style={{ color: sand }}
                                            >
                                                {stage.time}
                                            </p>
                                            <h3 className="sumac-serif text-2xl font-semibold text-[#F4EDE2]">
                                                {stage.title}
                                            </h3>
                                            <p className="text-sm text-[#9A9188] leading-relaxed">
                                                {stage.desc}
                                            </p>
                                        </div>
                                    ))}
                                </motion.div>

                                {/* Mobile/tablet responsive grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-5">
                                    {timelineStages.map((stage, idx) => (
                                        <motion.div
                                            key={stage.title}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{
                                                once: true,
                                                amount: 0.2,
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                delay: idx * 0.08,
                                            }}
                                            className="space-y-3"
                                        >
                                            <div className="aspect-[16/10] w-full overflow-hidden bg-[#1b1613]">
                                                <img
                                                    src={stage.img}
                                                    alt={stage.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <p
                                                className="sumac-mono text-[11px] uppercase tracking-[0.08em]"
                                                style={{ color: sand }}
                                            >
                                                {stage.time}
                                            </p>
                                            <h3 className="sumac-serif text-2xl font-semibold text-[#F4EDE2]">
                                                {stage.title}
                                            </h3>
                                            <p className="text-sm text-[#9A9188] leading-relaxed">
                                                {stage.desc}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Thin horizontal progress bar */}
                                <div className="hidden lg:block h-[2px] w-full bg-[#F4EDE2]/12 overflow-hidden">
                                    <motion.div
                                        style={{
                                            scaleX: timelineProgress,
                                            backgroundColor: sand,
                                        }}
                                        className="h-full w-full origin-left"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 7. Typographic Transition Banner (#F3ECE1) */}
                    <section className="bg-[#F3ECE1] text-[#14110F] py-20 sm:py-28">
                        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-2">
                            <motion.p
                                initial={{ opacity: 0, x: -24 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.65 }}
                                className="sumac-serif text-5xl sm:text-7xl lg:text-[96px] font-semibold leading-none tracking-[-0.02em] text-[#3A3530]"
                            >
                                {cc.transitionTop || "Roast first."}
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0, x: 24 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.65, delay: 0.1 }}
                                className="sumac-serif text-5xl sm:text-7xl lg:text-[96px] font-semibold leading-none tracking-[-0.02em] text-right text-[#A67346]"
                            >
                                {cc.transitionBottom || "Sweet later."}
                            </motion.p>
                        </div>
                    </section>
                </>
            ) : null}

            {/* 8. Section (04) FROM THE OVEN & BAR (4 Sticky Stacking Terracotta #822822 Cards) */}
            {config.sections.whyChoose !== false ? (
                <section
                    id="craft"
                    className="bg-[#110E0C] text-[#F4EDE2] py-20 sm:py-28"
                >
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-14">
                        <div className="pb-4 border-b border-[#F4EDE2]/12 flex items-center justify-between sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#9A9188]">
                            <span>
                                {cc.craftEyebrow || "(04) FROM THE OVEN & BAR"}
                            </span>
                            <span>SMALL-BATCH ROASTERY &amp; BAKERY</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                            <h2 className="lg:col-span-6 sumac-serif text-4xl sm:text-6xl font-semibold leading-[1.05] tracking-[-0.02em]">
                                {cc.craftTitle || "Four ways we craft."}
                            </h2>
                            <p className="lg:col-span-6 text-[16px] text-[#9A9188] max-w-lg leading-relaxed">
                                {config.spotlightNote}
                            </p>
                        </div>

                        <div className="space-y-8">
                            {craftDeck.map((card, idx) => (
                                <div
                                    key={card.title}
                                    className="sticky grid grid-cols-1 lg:grid-cols-2 overflow-hidden shadow-2xl border border-[#F4EDE2]/10"
                                    style={{
                                        top: `${88 + idx * 18}px`,
                                        backgroundColor: terracotta,
                                    }}
                                >
                                    <div className="p-8 sm:p-12 flex flex-col justify-between gap-8 min-h-[340px]">
                                        <p className="sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#F4EDE2]/80">
                                            {card.eyebrow}
                                        </p>
                                        <div className="space-y-4">
                                            <h3 className="sumac-serif text-3xl sm:text-5xl font-semibold text-[#F4EDE2] leading-[1.08]">
                                                {card.title}
                                            </h3>
                                            <p className="text-[16px] text-[#F4EDE2]/85 leading-relaxed max-w-md">
                                                {card.desc}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="inline-block rounded-full border border-[#F4EDE2]/35 px-4 py-1.5 text-xs font-medium text-[#F4EDE2]">
                                                {card.tag}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="aspect-[4/3] lg:aspect-auto w-full overflow-hidden bg-[#110E0C]">
                                        <img
                                            src={card.img}
                                            alt={card.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 9. Scroll-to-Expand Feature ("The espresso bar.") */}
            {config.sections.spotlight ? (
                <section
                    ref={counterRef}
                    className="bg-[#110E0C] text-[#F4EDE2] py-16 sm:py-24"
                >
                    <motion.div
                        style={{
                            marginLeft: counterMargin,
                            marginRight: counterMargin,
                            borderRadius: counterRadius,
                        }}
                        className="relative h-[420px] sm:h-[540px] overflow-hidden"
                    >
                        <img
                            src={config.galleryImages[0] || config.heroImageUrl}
                            alt="The espresso bar"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#110E0C]/85 via-[#110E0C]/35 to-transparent flex flex-col items-center justify-center text-center px-6">
                            <h2 className="sumac-serif text-4xl sm:text-6xl lg:text-[72px] font-semibold text-[#F4EDE2]">
                                {cc.counterTitle || "The espresso bar."}
                            </h2>
                            <p className="mt-3 text-base sm:text-lg text-[#F4EDE2]/85 max-w-lg">
                                {cc.counterSubtitle ||
                                    "Ten counter seats facing the roaster and pour-over bar, brewed right in front of you."}
                            </p>
                        </div>
                    </motion.div>
                </section>
            ) : null}

            {/* 10. Section (05) THE ROOM (Scroll Zoom-Out Gallery Mosaic) */}
            {config.sections.gallery ? (
                <section
                    id="gallery"
                    ref={roomRef}
                    className="bg-[#110E0C] text-[#F4EDE2] py-20 sm:py-28 overflow-hidden"
                >
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-10">
                        <div className="pb-4 border-b border-[#F4EDE2]/12 flex items-center justify-between sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#9A9188]">
                            <span>{cc.galleryEyebrow || "(05) THE ROOM"}</span>
                            <span>INSIDE {tenantName.toUpperCase()}</span>
                        </div>

                        <div className="relative">
                            <motion.div
                                style={{ scale: roomScale }}
                                className="grid grid-cols-2 sm:grid-cols-3 gap-4 will-change-transform"
                            >
                                {roomPhotos.map((src, idx) => (
                                    <div
                                        key={`${src}-${idx}`}
                                        className="aspect-[4/3] overflow-hidden rounded-[6px] bg-[#1b1613]"
                                    >
                                        <img
                                            src={src}
                                            alt={`${tenantName} room ${idx + 1}`}
                                            className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="bg-[#110E0C]/75 backdrop-blur-sm px-8 py-5 border border-[#F4EDE2]/15 text-center">
                                    <h3 className="sumac-serif text-3xl sm:text-5xl font-semibold text-[#F4EDE2]">
                                        {cc.galleryTitle ||
                                            "One oven. Warm mornings."}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 11. Terracotta Reviews Section (#822822 bg + Sticky Heading + Parallax Cream Cards) */}
            {config.sections.reviews !== false ? (
                <section
                    id="reviews"
                    ref={reviewsRef}
                    className="py-20 sm:py-32 text-[#F4EDE2]"
                    style={{ backgroundColor: terracotta }}
                >
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-16">
                        <div className="lg:sticky lg:top-28 z-0 text-center max-w-2xl mx-auto space-y-3">
                            <p className="sumac-mono text-[11px] uppercase tracking-[0.14em] text-[#F4EDE2]/80">
                                {cc.reviewsEyebrow || "GUEST NOTES"}
                            </p>
                            <h2 className="sumac-serif text-4xl sm:text-6xl font-semibold leading-[1.05]">
                                {cc.reviewsTitle ||
                                    "What the city says about us."}
                            </h2>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 pt-4">
                            {reviewCards.map((rc, idx) => {
                                const rot =
                                    idx % 3 === 0
                                        ? -2.5
                                        : idx % 3 === 1
                                          ? 2
                                          : -1;
                                const parallaxY =
                                    idx % 2 === 0
                                        ? reviewParallaxEven
                                        : reviewParallaxOdd;
                                return (
                                    <motion.div
                                        key={rc.id}
                                        style={{ y: parallaxY }}
                                        initial={{
                                            opacity: 0,
                                            rotate: rot,
                                        }}
                                        whileInView={{
                                            opacity: 1,
                                            rotate: rot,
                                        }}
                                        whileHover={{ y: -8, rotate: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: idx * 0.07,
                                        }}
                                        className="rounded-[4px] bg-[#F6F1EA] text-[#14110F] p-6 flex flex-col justify-between gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                                    >
                                        <p className="sumac-serif italic text-[19px] leading-[1.35]">
                                            &ldquo;{rc.quote}&rdquo;
                                        </p>
                                        <p
                                            className="sumac-mono text-[11px] uppercase tracking-[0.08em]"
                                            style={{ color: terracotta }}
                                        >
                                            {rc.source}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {slug ? (
                            <div className="max-w-4xl mx-auto">
                                <InlineWebsiteReviewForm
                                    slug={slug}
                                    tenantName={tenantName}
                                    accent={sand}
                                />
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 12. Section (06) VISIT & HOURS + Footer */}
            {config.sections.contact && config.sections.hours !== false ? (
                <section className="relative bg-[#110E0C] text-[#F4EDE2] py-20 sm:py-28 overflow-hidden">
                    <img
                        src={config.galleryImages[2] || config.heroImageUrl}
                        alt={tenantName}
                        className="absolute inset-0 h-full w-full object-cover opacity-25"
                    />
                    <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-6 space-y-5">
                            <p className="sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#9A9188]">
                                {cc.hoursEyebrow || "(06) TODAY"}
                            </p>
                            <h2 className="sumac-serif text-4xl sm:text-6xl font-semibold leading-[1.05]">
                                {cc.hoursTitle || "Pull up a chair by the bar."}
                            </h2>
                            <p className="text-[16px] text-[#F4EDE2]/80 max-w-md leading-relaxed">
                                {profile?.tagline ||
                                    "Fresh espresso, warm morning bakes, and unhurried hospitality."}
                            </p>
                            <a
                                href="#menu"
                                className="inline-block rounded-full px-6 py-3 text-[14px] font-medium text-[#110E0C]"
                                style={{ backgroundColor: sand }}
                            >
                                {config.ctaLabel || "See the menu"}
                            </a>
                        </div>

                        <div className="lg:col-span-6">
                            <div className="rounded-[4px] bg-[#110E0C]/80 backdrop-blur-md border border-[#F4EDE2]/14 p-8 space-y-5">
                                <p className="sumac-mono text-[11px] uppercase tracking-[0.12em] text-[#9A9188]">
                                    HOURS &amp; LOCATION
                                </p>
                                <div className="divide-y divide-[#F4EDE2]/12 text-sm">
                                    {profile?.hours ? (
                                        <div className="py-3 flex justify-between gap-4">
                                            <span className="text-[#9A9188]">
                                                Opening Hours
                                            </span>
                                            <span className="font-medium text-[#F4EDE2]">
                                                {profile.hours}
                                            </span>
                                        </div>
                                    ) : null}
                                    {profile?.address ? (
                                        <div className="py-3 flex justify-between gap-4">
                                            <span className="text-[#9A9188]">
                                                Address
                                            </span>
                                            <span className="font-medium text-[#F4EDE2] text-right">
                                                {profile.address}
                                            </span>
                                        </div>
                                    ) : null}
                                    {profile?.phone ? (
                                        <div className="py-3 flex justify-between gap-4">
                                            <span className="text-[#9A9188]">
                                                Phone
                                            </span>
                                            <a
                                                href={`tel:${profile.phone}`}
                                                className="font-medium hover:underline"
                                                style={{ color: sand }}
                                            >
                                                {profile.phone}
                                            </a>
                                        </div>
                                    ) : null}
                                    {profile?.email ? (
                                        <div className="py-3 flex justify-between gap-4">
                                            <span className="text-[#9A9188]">
                                                Email
                                            </span>
                                            <a
                                                href={`mailto:${profile.email}`}
                                                className="font-medium hover:underline"
                                                style={{ color: sand }}
                                            >
                                                {profile.email}
                                            </a>
                                        </div>
                                    ) : null}
                                </div>
                                <SocialLinks profile={profile} isDark />
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 13. Footer with Giant 4%-Opacity Watermark */}
            <footer className="bg-[#110E0C] text-[#F4EDE2] pt-14 pb-6 border-t border-[#F4EDE2]/10 overflow-hidden">
                <div className="mx-auto max-w-[1400px] px-5 sm:px-8 space-y-12">
                    <div className="flex flex-wrap items-center justify-between gap-4 sumac-mono text-[11px] uppercase tracking-[0.08em] text-[#9A9188]">
                        <span>
                            © {new Date().getFullYear()} {tenantName}
                        </span>
                        <span>
                            {profile?.hours || "FRESH ROAST & BAKE DAILY"}
                        </span>
                    </div>
                    <p
                        className="sumac-serif text-[16vw] font-bold uppercase leading-[0.8] tracking-[-0.03em] text-center select-none pointer-events-none"
                        style={{ color: "rgba(244, 237, 226, 0.04)" }}
                    >
                        {tenantName}
                    </p>
                </div>
            </footer>
        </div>
    );
}

function galleryPoolOrFallback(
    galleryImages: string[] | undefined,
    heroImageUrl: string,
): string[] {
    const list = (galleryImages ?? []).filter(Boolean);
    return list.length > 0 ? list : [heroImageUrl];
}

/* -------------------------------------------------------------------------- */
/* 4. FAST CASUAL & GRILL (FRESHBOX EDITORIAL DESIGN)                         */
/* -------------------------------------------------------------------------- */
function FastCasualSite({
    slug,
    tenantName,
    config,
    profile,
    menuItems,
}: SiteTemplateRenderProps) {
    const crimson = "#920711";
    const maroon = "#5F070D";
    const cream = "#FEF7E8";
    const gold = "#FFC226";
    const brown = "#482820";
    const mutedBrown = "#7F675C";
    const cc = config.customCopy ?? {};
    const heroRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: heroScroll } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const centerCardY = useTransform(heroScroll, [0, 1], [0, -28]);
    const sideCardY = useTransform(heroScroll, [0, 1], [0, 24]);

    const leafBtn =
        "inline-flex items-center gap-2 rounded-tl-[40px] rounded-br-[40px] rounded-tr-none rounded-bl-none transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer";

    // Build popular dish cards for the infinite marquee directly from live menuItems
    const popularDishCards = useMemo(() => {
        const list = menuItems.slice(0, 10).map(item => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
        }));
        if (list.length === 0) {
            return [
                { id: "d1", name: "Signature Burger", imageUrl: null },
                { id: "d2", name: "Grill Platter", imageUrl: null },
                { id: "d3", name: "Crispy Fries", imageUrl: null },
                { id: "d4", name: "Club Sandwich", imageUrl: null },
            ];
        }
        const padded = [...list];
        while (padded.length < 7) {
            padded.push(...list.slice(0, 7 - padded.length));
        }
        return padded;
    }, [menuItems]);

    const featuredDishes = menuItems.slice(0, 3);
    const [showFullMenu, setShowFullMenu] = useState(false);

    // Testimonials carousel
    const { data: approvedFeedback } = useGetPublicApprovedFeedbackQuery(
        { slug: slug ?? "" },
        { skip: !slug || config.sections.reviews === false },
    );
    const liveReviews = approvedFeedback?.reviews ?? [];
    const testimonials =
        liveReviews.length > 0
            ? liveReviews.map((r, i) => ({
                  id: r.id,
                  quote:
                      r.comment ||
                      "Bold flavors, fast service, and always piping hot.",
                  name: r.customerName || "Verified Guest",
                  role: "Dining Guest",
                  img:
                      config.galleryImages[
                          i % Math.max(1, config.galleryImages.length)
                      ] || config.heroImageUrl,
              }))
            : [
                  {
                      id: "fb-1",
                      quote: "The smash burgers and grilled platters arrive sizzling hot every single time. Easily our go-to spot.",
                      name: "James Carter",
                      role: "Food Blogger",
                      img: config.galleryImages[0] || config.heroImageUrl,
                  },
                  {
                      id: "fb-2",
                      quote: "Crispy sides, bold house sauces, and friendly counter service that never keeps you waiting.",
                      name: "Miriam K.",
                      role: "Regular Guest",
                      img: config.galleryImages[1] || config.heroImageUrl,
                  },
                  {
                      id: "fb-3",
                      quote: "Great portions, fresh ingredients, and unbeatable energy for lunch or late-night cravings.",
                      name: "Daniel T.",
                      role: "Local Foodie",
                      img: config.galleryImages[2] || config.heroImageUrl,
                  },
              ];

    const [activeReviewIdx, setActiveReviewIdx] = useState(0);
    const currentReview = testimonials[activeReviewIdx % testimonials.length];
    const nextReview =
        testimonials[(activeReviewIdx + 1) % testimonials.length];

    // FAQ accordion
    const faqs = [
        {
            q: "Are your dishes prepared fresh to order?",
            a: "Yes—every burger, grill plate, and side is cooked fresh on the flat-top or open grill the moment your order hits the kitchen.",
        },
        {
            q: "Do you offer dine-in, takeout, and group platters?",
            a: "We welcome dine-in guests all day, pack takeout orders for quick pickup, and prepare catering platters for offices and events.",
        },
        {
            q: "What are your opening hours?",
            a:
                profile?.hours ||
                "Open daily from morning through late evening.",
        },
        {
            q: "Can we customize spice levels or sauces?",
            a: "Of course. Let our counter or table team know your preferred spice level and house sauce pairing.",
        },
    ];
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const statsList =
        cc.stats && cc.stats.length > 0
            ? cc.stats.slice(0, 4)
            : [
                  { num: "8K+", label: "Dishes Served Monthly" },
                  {
                      num: `${Math.max(menuItems.length, 24)}+`,
                      label: "Signature Recipes",
                  },
                  { num: "80K+", label: "Happy Guests" },
                  { num: "100%", label: "Fresh Daily Prep" },
              ];

    const whyCards =
        cc.highlights && cc.highlights.length > 0
            ? cc.highlights.slice(0, 4)
            : [
                  {
                      title: "DELICIOUS FOOD",
                      desc: "Bold house seasonings and flame-kissed grill classics.",
                  },
                  {
                      title: "RELAXING AMBIENCE",
                      desc: "Warm, upbeat dining room built for friends and family.",
                  },
                  {
                      title: "FRIENDLY SERVICE",
                      desc: "Fast, attentive counter and table hospitality.",
                  },
                  {
                      title: "FRESH INGREDIENTS",
                      desc: "Crisp produce, fresh-ground beef, and daily buns.",
                  },
              ];

    const gallerySix = [
        config.heroImageUrl,
        ...(config.galleryImages ?? []),
        config.heroImageUrl,
        ...(config.galleryImages ?? []),
    ].slice(0, 6);

    return (
        <div
            className="min-h-screen bg-[#FEF7E8] text-[#482820] overflow-x-clip"
            style={{ fontFamily: "'Inter Display', 'Inter', sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap');
                .freshbox-display { font-family: 'Tanker', 'Anton', Impact, sans-serif; }
            `}</style>

            {/* 1. Floating Cream Header */}
            <div className="sticky top-0 z-30 bg-[#920711] px-3 sm:px-6">
                <header className="mx-auto max-w-7xl rounded-b-[28px] bg-[#FEF7E8] px-5 sm:px-8 h-18 flex items-center justify-between gap-4 shadow-md">
                    <a
                        href="#top"
                        className="freshbox-display text-2xl sm:text-3xl tracking-tight uppercase text-[#920711]"
                    >
                        {tenantName}
                    </a>

                    <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#482820]">
                        <a
                            href="#top"
                            className="underline underline-offset-4 decoration-2 decoration-[#920711]"
                        >
                            Home
                        </a>
                        {config.sections.menu ? (
                            <a
                                href="#menu"
                                className="hover:text-[#920711] transition-colors"
                            >
                                Menu
                            </a>
                        ) : null}
                        {config.sections.spotlight ? (
                            <a
                                href="#offers"
                                className="hover:text-[#920711] transition-colors"
                            >
                                Offers
                            </a>
                        ) : null}
                        {config.sections.story ? (
                            <a
                                href="#about"
                                className="hover:text-[#920711] transition-colors"
                            >
                                About
                            </a>
                        ) : null}
                        {config.sections.gallery ? (
                            <a
                                href="#gallery"
                                className="hover:text-[#920711] transition-colors"
                            >
                                Gallery
                            </a>
                        ) : null}
                    </nav>

                    <a
                        href="#menu"
                        className={`${leafBtn} px-6 py-2.5 text-xs font-semibold text-white`}
                        style={{ backgroundColor: maroon }}
                    >
                        <span>{config.ctaLabel || "Explore Menu"}</span>
                        <span>↗</span>
                    </a>
                </header>
            </div>

            {/* 2. Crimson Hero + Floating Garnishes + Parallax Cards + Bottom Cream Wave */}
            {config.sections.hero ? (
                <section
                    id="top"
                    ref={heroRef}
                    className="relative bg-[#920711] text-white pt-10 sm:pt-14 pb-20 sm:pb-28 overflow-hidden"
                >
                    {/* Floating Garnish Accents on Left & Right Flanks */}
                    <motion.div
                        animate={{ y: [0, -12, 0], rotate: [-8, 6, -8] }}
                        transition={{
                            repeat: Infinity,
                            duration: 4.5,
                            ease: "easeInOut",
                        }}
                        className="hidden lg:flex pointer-events-none absolute left-10 top-24 size-14 rounded-full bg-[#5F070D]/80 border border-white/15 items-center justify-center text-2xl shadow-lg"
                    >
                        🌶️
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 10, 0], rotate: [8, -6, 8] }}
                        transition={{
                            repeat: Infinity,
                            duration: 5.2,
                            ease: "easeInOut",
                        }}
                        className="hidden lg:flex pointer-events-none absolute right-12 top-28 size-14 rounded-full bg-[#5F070D]/80 border border-white/15 items-center justify-center text-2xl shadow-lg"
                    >
                        🍅
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -8, 0], rotate: [-4, 8, -4] }}
                        transition={{
                            repeat: Infinity,
                            duration: 4.0,
                            ease: "easeInOut",
                        }}
                        className="hidden lg:flex pointer-events-none absolute left-20 bottom-28 size-12 rounded-full bg-[#FFC226]/20 border border-[#FFC226]/30 items-center justify-center text-xl shadow-md"
                    >
                        🌿
                    </motion.div>

                    <div className="mx-auto max-w-6xl px-5 sm:px-8 text-center space-y-6">
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium tracking-wider text-white/90"
                        >
                            <span className="size-1.5 rounded-full bg-white" />
                            <span>{config.badgeText}</span>
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="freshbox-display text-5xl sm:text-7xl lg:text-[84px] uppercase leading-[1.04] tracking-[-0.02em] text-white max-w-4xl mx-auto"
                        >
                            {config.heroHeadline}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.1 }}
                            className="text-sm sm:text-base text-white/85 max-w-xl mx-auto"
                        >
                            {profile?.tagline || config.heroSubheadline}
                        </motion.p>

                        <div className="pt-1 flex justify-center">
                            <a
                                href="#menu"
                                className={`${leafBtn} px-8 py-3.5 text-sm font-semibold text-white shadow-lg`}
                                style={{ backgroundColor: maroon }}
                            >
                                <span>{config.ctaLabel || "Explore Menu"}</span>
                                <span>↗</span>
                            </a>
                        </div>

                        {/* 3-Card Hero Food Showcase with Scroll Parallax */}
                        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-5 items-end max-w-5xl mx-auto">
                            {[
                                config.galleryImages[0] || config.heroImageUrl,
                                config.heroImageUrl,
                                config.galleryImages[1] || config.heroImageUrl,
                            ].map((src, idx) => (
                                <motion.div
                                    key={`${src}-${idx}`}
                                    style={{
                                        y: idx === 1 ? centerCardY : sideCardY,
                                    }}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -8, scale: 1.03 }}
                                    transition={{
                                        duration: 0.55,
                                        delay: 0.12 + idx * 0.08,
                                    }}
                                    className={`overflow-hidden rounded-[22px] border-2 border-white/15 shadow-2xl will-change-transform ${
                                        idx === 1
                                            ? "aspect-[4/3] sm:scale-105 z-10"
                                            : "aspect-[4/3]"
                                    }`}
                                >
                                    <img
                                        src={src}
                                        alt={tenantName}
                                        className="h-full w-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Organic Wavy Bottom Divider */}
                    <div className="pointer-events-none absolute inset-x-0 -bottom-1 leading-none">
                        <svg
                            viewBox="0 0 1440 72"
                            className="w-full h-10 sm:h-16"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z"
                                fill={cream}
                            />
                        </svg>
                    </div>
                </section>
            ) : null}

            {/* 3. Popular Dishes Infinite Marquee (#FEF7E8) */}
            {config.sections.marquee !== false ? (
                <section className="bg-[#FEF7E8] py-14 sm:py-20 overflow-hidden">
                    <div className="mx-auto max-w-6xl px-5 sm:px-8 text-center space-y-2 mb-10">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#920711] uppercase tracking-wider">
                            <span className="size-1.5 rounded-full bg-[#920711]" />
                            Menu
                        </p>
                        <h2 className="freshbox-display text-4xl sm:text-5xl uppercase text-[#482820]">
                            EXPLORE OUR POPULAR DISHES
                        </h2>
                        <p className="text-sm text-[#7F675C] max-w-lg mx-auto">
                            Discover a variety of freshly prepared meals,
                            crafted to satisfy every craving with rich flavors
                            and quality ingredients.
                        </p>
                    </div>

                    <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 24,
                        }}
                        className="flex w-max gap-5 px-4"
                    >
                        {[...popularDishCards, ...popularDishCards].map(
                            (dish, idx) => (
                                <a
                                    key={`${dish.id}-${idx}`}
                                    href="#menu"
                                    className="w-44 sm:w-48 shrink-0 text-center space-y-2.5 group"
                                >
                                    <div className="aspect-square rounded-[20px] bg-[#FFE9B8] p-3 overflow-hidden shadow-2xs">
                                        <DishImageOrPlaceholder
                                            imageUrl={dish.imageUrl}
                                            alt={dish.name}
                                            className="h-full w-full rounded-[14px] object-cover group-hover:scale-105 transition-transform duration-300"
                                            placeholderClassName="rounded-[14px] bg-[#FFE9B8] text-[#920711]"
                                            iconClassName="size-10 opacity-50"
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-[#482820] truncate px-1">
                                        {dish.name}
                                    </p>
                                </a>
                            ),
                        )}
                    </motion.div>
                </section>
            ) : null}

            {/* 4. Special Offers Asymmetric Bento (#FEF7E8) */}
            {config.sections.spotlight ? (
                <section
                    id="offers"
                    className="bg-[#FEF7E8] py-12 sm:py-16 px-5 sm:px-8"
                >
                    <div className="mx-auto max-w-6xl space-y-10">
                        <div className="text-center space-y-2">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#920711] uppercase tracking-wider">
                                <span className="size-1.5 rounded-full bg-[#920711]" />
                                Special Offers
                            </p>
                            <h2 className="freshbox-display text-4xl sm:text-5xl uppercase text-[#482820]">
                                {config.spotlightTitle ||
                                    "DELICIOUS DEALS YOU CAN'T MISS"}
                            </h2>
                            <p className="text-sm text-[#7F675C] max-w-md mx-auto">
                                {config.spotlightNote}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Left 2 Stacked Cards */}
                            <div className="lg:col-span-6 space-y-5">
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="rounded-[20px] bg-[#FFAA00] text-[#482820] p-6 sm:p-7 grid grid-cols-12 gap-4 items-center"
                                >
                                    <div className="col-span-7 space-y-3">
                                        <span className="inline-block rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold uppercase text-[#482820]">
                                            Chef&apos;s Selection
                                        </span>
                                        <h3 className="freshbox-display text-2xl sm:text-3xl uppercase leading-[1.1]">
                                            FRESHLY PREPARED SERVED AT ITS BEST
                                        </h3>
                                        <a
                                            href="#menu"
                                            className={`${leafBtn} bg-white px-5 py-2 text-xs font-bold text-[#482820] shadow-xs`}
                                        >
                                            <span>View Menu</span>
                                            <span>🔥</span>
                                        </a>
                                    </div>
                                    <div className="col-span-5 aspect-square overflow-hidden rounded-[16px]">
                                        <img
                                            src={
                                                config.galleryImages[0] ||
                                                config.heroImageUrl
                                            }
                                            alt="Special 1"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="rounded-[20px] bg-[#920711] text-white p-6 sm:p-7 grid grid-cols-12 gap-4 items-center"
                                >
                                    <div className="col-span-7 space-y-3">
                                        <span className="inline-block rounded-full bg-[#FFAA00] px-3 py-1 text-[11px] font-bold uppercase text-[#482820]">
                                            Grill Special
                                        </span>
                                        <h3 className="freshbox-display text-2xl sm:text-3xl uppercase leading-[1.1]">
                                            FLAME-GRILLED BOLD &amp; FLAVORFUL
                                        </h3>
                                        <a
                                            href="#menu"
                                            className={`${leafBtn} bg-white px-5 py-2 text-xs font-bold text-[#482820] shadow-xs`}
                                        >
                                            <span>View Menu</span>
                                            <span>🔥</span>
                                        </a>
                                    </div>
                                    <div className="col-span-5 aspect-square overflow-hidden rounded-[16px]">
                                        <img
                                            src={
                                                config.galleryImages[1] ||
                                                config.heroImageUrl
                                            }
                                            alt="Special 2"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right Tall Emerald Green Card */}
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="lg:col-span-6 rounded-[20px] bg-[#0E5A3E] text-white p-7 sm:p-8 flex flex-col justify-between gap-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <span className="inline-block rounded-full bg-white text-[#0E5A3E] px-3 py-1 text-[11px] font-bold uppercase">
                                            House Favorite
                                        </span>
                                        <h3 className="freshbox-display text-3xl sm:text-4xl uppercase leading-[1.08]">
                                            SIGNATURE GRILL &amp; BURGERS
                                            <br />
                                            RICH. JUICY. SATISFYING.
                                        </h3>
                                    </div>
                                </div>

                                <div className="aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-white/15">
                                    <img
                                        src={
                                            config.galleryImages[2] ||
                                            config.heroImageUrl
                                        }
                                        alt="Signature Burgers"
                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex gap-2">
                                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#0E5A3E] -rotate-2">
                                            Made Fresh
                                        </span>
                                        <span className="rounded-full bg-[#FFAA00] px-3 py-1 text-[11px] font-bold text-[#482820] rotate-2">
                                            Hot Off Grill
                                        </span>
                                    </div>
                                    <a
                                        href="#menu"
                                        className={`${leafBtn} bg-white px-5 py-2.5 text-xs font-bold text-[#482820]`}
                                    >
                                        <span>View Menu</span>
                                        <span>🔥</span>
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 5. Our Menu (#920711 Crimson + 3-Col Maroon Cards) */}
            {config.sections.menu ? (
                <section
                    id="menu"
                    className="bg-[#920711] text-white py-16 sm:py-24 px-5 sm:px-8"
                >
                    <div className="mx-auto max-w-6xl space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-2 max-w-xl">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/85">
                                    <span className="size-1.5 rounded-full bg-white" />
                                    {cc.menuEyebrow || "Our Menu"}
                                </p>
                                <h2 className="freshbox-display text-4xl sm:text-5xl uppercase text-white">
                                    {cc.menuTitle ||
                                        "DISCOVER FLAVORS YOU'LL LOVE"}
                                </h2>
                                <p className="text-sm text-white/80">
                                    {cc.menuSubtitle ||
                                        "Freshly grilled, crispy, and served straight from our live kitchen."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFullMenu(prev => !prev)}
                                className={`${leafBtn} px-7 py-3 text-xs font-semibold text-white`}
                                style={{ backgroundColor: maroon }}
                            >
                                <span>
                                    {showFullMenu
                                        ? "Hide Full Menu"
                                        : `See All ${menuItems.length} Dishes`}
                                </span>
                                <span>↗</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {featuredDishes.map(item => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ y: -6 }}
                                    className="overflow-hidden rounded-[20px] bg-[#5F070D] flex flex-col shadow-xl"
                                >
                                    <div className="aspect-[4/3] w-full overflow-hidden bg-black/20">
                                        <DishImageOrPlaceholder
                                            imageUrl={item.imageUrl}
                                            alt={item.name}
                                            className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                                            placeholderClassName="bg-[#470509] text-[#FFC226]"
                                            iconClassName="size-10 opacity-55"
                                        />
                                    </div>
                                    <div className="p-6 space-y-2">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <h4 className="freshbox-display text-2xl uppercase text-white">
                                                {item.name}
                                            </h4>
                                            <span className="freshbox-display text-2xl text-[#FFC226] shrink-0">
                                                {formatEtb(Number(item.price))}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-white/75 line-clamp-2">
                                            {item.description ||
                                                item.categoryName ||
                                                "Prepared fresh to order."}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {showFullMenu ? (
                            <div className="rounded-[24px] bg-[#FEF7E8] text-[#482820] p-4 sm:p-6">
                                <SiteMenuExplorer
                                    items={menuItems}
                                    accentColor={crimson}
                                    variant="grid-bold"
                                    layout={config.menuLayout ?? "cards"}
                                    title="Full Grill Menu"
                                    subtitle="Freshly prepared to order."
                                />
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 6. About Us + Arch Portrait + 4 Stats + Kitchen Banner (#FEF7E8) */}
            {config.sections.story ? (
                <section
                    id="about"
                    className="bg-[#FEF7E8] py-16 sm:py-24 px-5 sm:px-8"
                >
                    <div className="mx-auto max-w-6xl space-y-16">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-5 flex justify-center">
                                <div className="relative w-full max-w-sm aspect-[4/5] rounded-t-full rounded-b-[20px] overflow-hidden border-4 border-[#920711] bg-[#920711] shadow-xl">
                                    <img
                                        src={
                                            config.galleryImages[0] ||
                                            config.heroImageUrl
                                        }
                                        alt={tenantName}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-7 space-y-5">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#920711]">
                                    <span className="size-1.5 rounded-full bg-[#920711]" />
                                    {cc.aboutEyebrow || "About Us"}
                                </p>
                                <h2 className="freshbox-display text-4xl sm:text-5xl uppercase leading-[1.08] text-[#482820]">
                                    {cc.aboutTitle ||
                                        "EXCEPTIONAL EXPERIENCE WITH PREMIUM QUALITY, RICH FLAVORS"}
                                </h2>
                                <p className="text-sm sm:text-base text-[#7F675C] leading-relaxed">
                                    {profile?.story ||
                                        "Fast service, bold flavors, and quality ingredients every single day."}
                                </p>
                                {profile?.hours ? (
                                    <div className="rounded-[16px] bg-[#FFE9B8]/60 px-5 py-3.5 text-sm text-[#482820]">
                                        <span className="font-bold uppercase text-xs tracking-wider text-[#920711] block">
                                            Opening Hours
                                        </span>
                                        <span className="font-semibold">
                                            {profile.hours}
                                        </span>
                                    </div>
                                ) : null}
                                <div className="pt-1">
                                    <a
                                        href="#menu"
                                        className={`${leafBtn} px-7 py-3 text-xs font-semibold text-white`}
                                        style={{ backgroundColor: maroon }}
                                    >
                                        <span>Explore Menu</span>
                                        <span>↗</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {config.sections.stats !== false ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-y border-[#482820]/15 py-10 text-center">
                                {statsList.map((st, idx) => (
                                    <motion.div
                                        key={st.label}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.45,
                                            delay: idx * 0.08,
                                        }}
                                    >
                                        <p className="freshbox-display text-4xl sm:text-5xl text-[#482820]">
                                            {st.num}
                                        </p>
                                        <p className="mt-1 text-xs sm:text-sm font-medium text-[#7F675C]">
                                            {st.label}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 7. Why Choose Us (#920711 Crimson + 4 #5F070D Maroon Cards) */}
            {config.sections.whyChoose !== false ? (
                <section className="bg-[#920711] text-white py-16 sm:py-24 px-5 sm:px-8">
                    <div className="mx-auto max-w-6xl space-y-12">
                        <div className="text-center space-y-2">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/85">
                                <span className="size-1.5 rounded-full bg-white" />
                                {cc.whyChooseEyebrow || "Why Choose Us"}
                            </p>
                            <h2 className="freshbox-display text-4xl sm:text-5xl uppercase text-white">
                                {cc.whyChooseTitle || "LOVED BY FOOD LOVERS"}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {whyCards.map((card, idx) => {
                                const Icons = [
                                    Flame,
                                    Sparkles,
                                    UserCheck,
                                    Utensils,
                                ];
                                const Icon = Icons[idx % Icons.length];
                                return (
                                    <motion.div
                                        key={card.title}
                                        whileHover={{ y: -6 }}
                                        className="rounded-[20px] bg-[#5F070D] p-7 text-center space-y-4 shadow-lg"
                                    >
                                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/20 text-[#FFC226]">
                                            <Icon className="size-6" />
                                        </div>
                                        <h4 className="freshbox-display text-2xl uppercase text-white">
                                            {card.title}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                                            {card.desc}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 8. Testimonials Carousel (#920711 + #F7941D Portrait Backdrop) */}
            {config.sections.reviews !== false ? (
                <section
                    id="reviews"
                    className="bg-[#920711] text-white py-16 sm:py-24 px-5 sm:px-8 border-t border-white/10"
                >
                    <div className="mx-auto max-w-6xl space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-4">
                                <div className="aspect-[4/5] rounded-[20px] bg-[#F7941D] p-3 overflow-hidden shadow-xl">
                                    <img
                                        src={currentReview.img}
                                        alt={currentReview.name}
                                        className="h-full w-full rounded-[14px] object-cover"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-5 space-y-4">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/85">
                                    <span className="size-1.5 rounded-full bg-white" />
                                    {cc.reviewsEyebrow || "Testimonials"}
                                </p>
                                <h2 className="freshbox-display text-4xl sm:text-5xl uppercase">
                                    {cc.reviewsTitle ||
                                        "WHAT OUR CUSTOMERS SAY"}
                                </h2>
                                <Quote className="size-8 text-[#FFC226]" />
                                <p className="text-base sm:text-lg text-white/90 leading-relaxed">
                                    &ldquo;{currentReview.quote}&rdquo;
                                </p>
                                <p className="text-sm font-bold text-[#FFC226]">
                                    {currentReview.name} ·{" "}
                                    <span className="font-normal text-white/70">
                                        {currentReview.role}
                                    </span>
                                </p>
                            </div>

                            <div className="lg:col-span-3 flex flex-col items-start lg:items-end gap-4">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveReviewIdx(
                                                prev =>
                                                    (prev -
                                                        1 +
                                                        testimonials.length) %
                                                    testimonials.length,
                                            )
                                        }
                                        className="flex size-11 items-center justify-center rounded-xl bg-white text-[#920711] hover:bg-[#FFC226] transition-colors cursor-pointer"
                                        aria-label="Previous review"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveReviewIdx(
                                                prev =>
                                                    (prev + 1) %
                                                    testimonials.length,
                                            )
                                        }
                                        className="flex size-11 items-center justify-center rounded-xl bg-white text-[#920711] hover:bg-[#FFC226] transition-colors cursor-pointer"
                                        aria-label="Next review"
                                    >
                                        <ChevronRight className="size-5" />
                                    </button>
                                </div>
                                <div className="hidden lg:block w-36 aspect-square rounded-[18px] bg-[#F7941D] p-2 overflow-hidden opacity-85">
                                    <img
                                        src={nextReview.img}
                                        alt={nextReview.name}
                                        className="h-full w-full rounded-[12px] object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        {slug ? (
                            <InlineWebsiteReviewForm
                                slug={slug}
                                tenantName={tenantName}
                                accent={gold}
                            />
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 9. FAQ Accordion + Asymmetric Bento Gallery (#FEF7E8) */}
            <section className="bg-[#FEF7E8] py-16 sm:py-24 px-5 sm:px-8 space-y-20">
                {/* FAQ */}
                <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-5 space-y-2">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#920711]">
                            <span className="size-1.5 rounded-full bg-[#920711]" />
                            FAQ
                        </p>
                        <h2 className="freshbox-display text-4xl sm:text-5xl uppercase text-[#482820]">
                            FREQUENTLY ASKED QUESTIONS
                        </h2>
                    </div>

                    <div className="lg:col-span-7 divide-y divide-[#482820]/25 border-b border-[#482820]/25">
                        {faqs.map((item, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div key={item.q} className="py-5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenFaq(isOpen ? null : idx)
                                        }
                                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                                    >
                                        <h4 className="freshbox-display text-xl sm:text-2xl uppercase text-[#482820]">
                                            {item.q}
                                        </h4>
                                        <span className="text-lg font-bold text-[#920711]">
                                            {isOpen ? "−" : "+"}
                                        </span>
                                    </button>
                                    {isOpen ? (
                                        <p className="mt-2.5 text-sm text-[#7F675C] leading-relaxed">
                                            {item.a}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bento Gallery */}
                {config.sections.gallery ? (
                    <div id="gallery" className="mx-auto max-w-6xl space-y-10">
                        <div className="text-center space-y-2">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#920711]">
                                <span className="size-1.5 rounded-full bg-[#920711]" />
                                {cc.galleryEyebrow || "Gallery"}
                            </p>
                            <h2 className="freshbox-display text-4xl sm:text-5xl uppercase text-[#482820]">
                                {cc.galleryTitle || "A FEAST FOR YOUR EYES"}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {gallerySix.map((src, idx) => (
                                <motion.div
                                    key={`${src}-${idx}`}
                                    whileHover={{ scale: 1.02 }}
                                    className={`overflow-hidden rounded-[20px] ${
                                        idx % 2 === 0
                                            ? "aspect-[4/5]"
                                            : "aspect-[4/3]"
                                    }`}
                                >
                                    <img
                                        src={src}
                                        alt={`${tenantName} gallery ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>

            {/* 10. Bottom Golden CTA Banner (#FFC226) + Wavy Crimson Footer (#920711) */}
            <section className="relative bg-[#FFC226] text-[#482820] pt-16 pb-24 px-5 sm:px-8 text-center overflow-hidden">
                <div className="mx-auto max-w-3xl space-y-5 relative z-10">
                    <h2 className="freshbox-display text-5xl sm:text-6xl uppercase text-[#920711] leading-[1.02]">
                        HUNGRY? WE&apos;RE READY
                        <br />
                        COME AND ENJOY
                    </h2>
                    <p className="text-sm sm:text-base font-medium text-[#482820]/85">
                        Freshly grilled burgers, platters, and bold house
                        flavors waiting for you at {tenantName}.
                    </p>
                    <a
                        href="#menu"
                        className={`${leafBtn} px-8 py-3.5 text-sm font-semibold text-white`}
                        style={{ backgroundColor: maroon }}
                    >
                        <span>View Menu</span>
                        <span>↗</span>
                    </a>
                </div>

                <div className="pointer-events-none absolute inset-x-0 -bottom-1 leading-none">
                    <svg
                        viewBox="0 0 1440 72"
                        className="w-full h-10 sm:h-16"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z"
                            fill={crimson}
                        />
                    </svg>
                </div>
            </section>

            {config.sections.contact ? (
                <footer className="bg-[#920711] text-white py-14 px-5 sm:px-8">
                    <div className="mx-auto max-w-6xl space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                            <div className="md:col-span-6 space-y-3">
                                <span className="freshbox-display text-4xl uppercase text-[#FFC226]">
                                    {tenantName}
                                </span>
                                {profile?.address ? (
                                    <p className="text-sm text-white/80">
                                        {profile.address}
                                    </p>
                                ) : null}
                                {profile?.phone ? (
                                    <p className="text-sm font-semibold text-white">
                                        {profile.phone}
                                    </p>
                                ) : null}
                            </div>
                            <div className="md:col-span-6 flex flex-col md:items-end gap-3">
                                <SocialLinks profile={profile} isDark />
                                {profile?.hours ? (
                                    <p className="text-xs text-white/75">
                                        {profile.hours}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-t border-white/20 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/75">
                            <span>
                                © {new Date().getFullYear()} {tenantName}. All
                                rights reserved.
                            </span>
                            <span>Crafted for {tenantName}</span>
                        </div>
                    </div>
                </footer>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* 5. TRADITIONAL & FAMILY KITCHEN                                            */
/* -------------------------------------------------------------------------- */
/* 5. TRADITIONAL & FAMILY KITCHEN (LUNA ROSSA EDITORIAL DESIGN)              */
/* -------------------------------------------------------------------------- */
function FamilyKitchenSite({
    slug,
    tenantName,
    config,
    profile,
    menuItems,
}: SiteTemplateRenderProps) {
    const caramel = "#B27647";
    const berry = "#8F213E";
    const cream = "#FFF6EE";
    const espresso = "#2F1908";
    const cc = config.customCopy ?? {};
    const lrHeroRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: lrHeroScroll } = useScroll({
        target: lrHeroRef,
        offset: ["start start", "end start"],
    });
    const lrHeroImgY = useTransform(lrHeroScroll, [0, 1], [0, 38]);

    const [selectedDish, setSelectedDish] = useState<
        (typeof menuItems)[number] | null
    >(null);
    const [showFullMenu, setShowFullMenu] = useState(false);

    // Scroll-linked Services Section
    const servicesRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: servicesScroll } = useScroll({
        target: servicesRef,
        offset: ["start center", "end center"],
    });
    const [activeServiceIdx, setActiveServiceIdx] = useState(0);

    const servicesList = useMemo(
        () =>
            cc.highlights && cc.highlights.length > 0
                ? cc.highlights.slice(0, 6).map((h, i) => ({
                      title: h.title,
                      img:
                          config.galleryImages[
                              i % Math.max(1, config.galleryImages.length)
                          ] || config.heroImageUrl,
                  }))
                : [
                      {
                          title: "FAMILY PLATTERS",
                          img: config.heroImageUrl,
                      },
                      {
                          title: "TRADITIONAL STEWS",
                          img: config.galleryImages[0] || config.heroImageUrl,
                      },
                      {
                          title: "FRESH BAKED BREAD",
                          img: config.galleryImages[1] || config.heroImageUrl,
                      },
                      {
                          title: "HOUSE SPICES",
                          img: config.galleryImages[2] || config.heroImageUrl,
                      },
                      {
                          title: "GROUP DINING",
                          img: config.heroImageUrl,
                      },
                      {
                          title: "CHEF'S SPECIALS",
                          img: config.galleryImages[0] || config.heroImageUrl,
                      },
                  ],
        [cc.highlights, config.galleryImages, config.heroImageUrl],
    );

    // Sync active service with scroll progress
    servicesScroll.on("change", latest => {
        const idx = Math.min(
            servicesList.length - 1,
            Math.max(0, Math.floor(latest * servicesList.length)),
        );
        if (idx !== activeServiceIdx) {
            setActiveServiceIdx(idx);
        }
    });

    // Testimonials
    const { data: approvedFeedback } = useGetPublicApprovedFeedbackQuery(
        { slug: slug ?? "" },
        { skip: !slug || config.sections.reviews === false },
    );
    const liveReviews = approvedFeedback?.reviews ?? [];
    const testimonials =
        liveReviews.length > 0
            ? liveReviews.map((r, i) => ({
                  id: r.id,
                  quote:
                      r.comment ||
                      "Generous family platters, warm spices, and unforgettable hospitality.",
                  name: r.customerName || "Verified Guest",
                  role: "Family Guest",
                  img:
                      config.galleryImages[
                          i % Math.max(1, config.galleryImages.length)
                      ] || config.heroImageUrl,
              }))
            : [
                  {
                      id: "lr-1",
                      quote: "Every platter feels like it was cooked at home with generations of care. The bread and slow-simmered dishes are unmatched.",
                      name: "Abebe B.",
                      role: "Regular Guest",
                      img: config.galleryImages[0] || config.heroImageUrl,
                  },
                  {
                      id: "lr-2",
                      quote: "We brought the whole family for Sunday dinner and every single plate arrived steaming, aromatic, and generous.",
                      name: "Rahel M.",
                      role: "Family Diner",
                      img: config.galleryImages[1] || config.heroImageUrl,
                  },
                  {
                      id: "lr-3",
                      quote: "Warm staff, rich traditional flavors, and a dining room that welcomes everyone like family.",
                      name: "Yonas T.",
                      role: "Weekend Guest",
                      img: config.galleryImages[2] || config.heroImageUrl,
                  },
              ];

    const [reviewPage, setReviewPage] = useState(0);
    const featuredDish = menuItems[0];
    const gridDishes = menuItems.slice(0, 8);
    const dailyListLeft = menuItems.slice(0, 5);
    const dailyListRight = menuItems.slice(5, 10);

    const aboutStats =
        cc.stats && cc.stats.length > 0
            ? cc.stats.slice(0, 3)
            : [
                  {
                      num: "10K+",
                      label: "HAPPY CUSTOMERS",
                      sub: "Cooked with care, loved by every family",
                  },
                  {
                      num: "99%",
                      label: "GUEST SATISFACTION",
                      sub: "Authentic flavors guests return for",
                  },
                  {
                      num: "500+",
                      label: "FIVE-STAR REVIEWS",
                      sub: "Rated five stars for warm hospitality",
                  },
              ];

    const processSteps = [
        {
            num: "01",
            eyebrow: "FRESH DISHES",
            title: "Cooked Daily Fresh",
            img: config.galleryImages[0] || config.heroImageUrl,
        },
        {
            num: "02",
            eyebrow: "ARTISAN CRAFT",
            title: "Pure Spice & Grain",
            img: config.galleryImages[1] || config.heroImageUrl,
        },
        {
            num: "03",
            eyebrow: "PURE TRADITION",
            title: "Simmered With Love",
            img: config.galleryImages[2] || config.heroImageUrl,
        },
        {
            num: "04",
            eyebrow: "SHARED TABLE",
            title: "Warm Family Joy",
            img: config.heroImageUrl,
        },
    ];

    return (
        <div
            className="min-h-screen bg-[#FFF6EE] text-[#3B3B3B] overflow-x-clip"
            style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Koulen&family=Poppins:wght@400;500;600;700;900&display=swap');
                .lunarossa-display { font-family: 'Koulen', Impact, sans-serif; }
            `}</style>

            {/* 1. Top Announcement Pill + Sticky Floating Caramel Navbar */}
            <div className="bg-[#FFF6EE] pt-3 px-4 sm:px-8 sticky top-0 z-30 pb-2">
                <div className="mx-auto max-w-[1360px] space-y-2.5">
                    <div className="flex justify-center">
                        <span className="rounded-full bg-white border border-[#F2E4D8] px-4 py-1 text-xs font-medium text-[#3B3B3B] shadow-2xs">
                            {config.badgeText}
                        </span>
                    </div>

                    <header
                        className="rounded-[12px] px-5 sm:px-7 h-16 flex items-center justify-between gap-4 text-white shadow-md"
                        style={{ backgroundColor: caramel }}
                    >
                        <a href="#top" className="flex items-center gap-2.5">
                            <Utensils className="size-5 text-white" />
                            <span className="lunarossa-display text-2xl tracking-wide uppercase text-white">
                                {tenantName}
                            </span>
                        </a>

                        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-white/95">
                            <a href="#top" className="hover:opacity-75">
                                HOME
                            </a>
                            {config.sections.story ? (
                                <a href="#about" className="hover:opacity-75">
                                    ABOUT
                                </a>
                            ) : null}
                            {config.sections.menu ? (
                                <a href="#menu" className="hover:opacity-75">
                                    MENU
                                </a>
                            ) : null}
                            {config.sections.gallery ? (
                                <a href="#gallery" className="hover:opacity-75">
                                    GALLERY
                                </a>
                            ) : null}
                            {config.sections.reviews !== false ? (
                                <a href="#reviews" className="hover:opacity-75">
                                    REVIEWS
                                </a>
                            ) : null}
                        </nav>

                        <a
                            href="#menu"
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-[#B27647] transition-colors"
                        >
                            <span>Menu</span>
                            <span>→</span>
                        </a>
                    </header>
                </div>
            </div>

            {/* 2. Stacked Koulen Hero + Golden Peach Corner Backdrop + Scroll Parallax */}
            {config.sections.hero ? (
                <section
                    id="top"
                    ref={lrHeroRef}
                    className="relative bg-[#FFF6EE] pt-6 pb-16 sm:pb-24 px-4 sm:px-8 overflow-hidden"
                >
                    <div
                        className="pointer-events-none absolute top-0 right-0 w-[52%] h-[92%] rounded-bl-[140px] opacity-65"
                        style={{
                            background:
                                "linear-gradient(135deg, #FFE6C8 0%, #FBC07A 100%)",
                        }}
                    />

                    <div className="relative z-10 mx-auto max-w-[1360px] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65 }}
                            className="lg:col-span-6 space-y-5"
                        >
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-baseline gap-3">
                                    <span
                                        className="lunarossa-display text-2xl sm:text-[28px] uppercase tracking-tight"
                                        style={{ color: caramel }}
                                    >
                                        ENDLESS
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#8F213E]">
                                        • {config.badgeText}
                                    </span>
                                </div>
                                <h1
                                    className="lunarossa-display text-6xl sm:text-8xl lg:text-[108px] uppercase leading-[0.84] tracking-[-2px]"
                                    style={{ color: caramel }}
                                >
                                    {config.heroHeadline}
                                </h1>
                                <p
                                    className="lunarossa-display text-2xl sm:text-[28px] uppercase tracking-tight pt-1"
                                    style={{ color: caramel }}
                                >
                                    TASTE THE JOY!
                                </p>
                            </div>

                            <p className="text-base text-[#3B3B3B] max-w-lg leading-[1.7]">
                                {profile?.tagline || config.heroSubheadline}
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <a
                                    href="#menu"
                                    className="inline-flex items-center gap-2 rounded-[10px] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-transform hover:scale-[1.03]"
                                    style={{ backgroundColor: berry }}
                                >
                                    <span>
                                        {config.ctaLabel || "VIEW MENU"}
                                    </span>
                                    <span>→</span>
                                </a>
                            </div>
                        </motion.div>

                        <motion.div
                            style={{ y: lrHeroImgY }}
                            initial={{ opacity: 0, scale: 0.94, y: 18 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.75, delay: 0.1 }}
                            className="lg:col-span-6 relative will-change-transform"
                        >
                            <div className="overflow-hidden rounded-[20px] border-4 border-white shadow-2xl aspect-[4/3]">
                                <img
                                    src={config.heroImageUrl}
                                    alt={tenantName}
                                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 3.5,
                                    ease: "easeInOut",
                                }}
                                className="hidden sm:flex absolute -bottom-4 -left-4 rounded-2xl bg-white border border-[#F2E4D8] px-4 py-3 shadow-lg items-center gap-2.5"
                            >
                                <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: berry }}
                                />
                                <span className="text-xs font-bold uppercase tracking-wider text-[#B27647]">
                                    100% Fresh Daily
                                </span>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
            ) : null}

            {/* 3. About / Story & Animated Stats Bar */}
            {config.sections.story ? (
                <section
                    id="about"
                    className="bg-[#FFF6EE] py-16 sm:py-24 px-4 sm:px-8"
                >
                    <div className="mx-auto max-w-[1360px] space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-6 space-y-4"
                            >
                                <h2
                                    className="lunarossa-display text-4xl sm:text-5xl lg:text-[60px] uppercase leading-[0.92] tracking-[-1px]"
                                    style={{ color: caramel }}
                                >
                                    {cc.aboutTitle ||
                                        "THE HEART BEHIND OUR KITCHEN"}
                                </h2>
                                <p className="text-base text-[#3B3B3B] leading-[1.7]">
                                    {profile?.story ||
                                        "Our family kitchen was created to share fresh, slow-cooked goodness made from traditional recipes and warm hospitality."}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.65 }}
                                className="lg:col-span-6 grid grid-cols-2 gap-4"
                            >
                                <div className="aspect-[4/5] overflow-hidden rounded-[12px] border border-[#F2E4D8]">
                                    <img
                                        src={
                                            config.galleryImages[0] ||
                                            config.heroImageUrl
                                        }
                                        alt={`${tenantName} story 1`}
                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                                <div className="aspect-[4/5] overflow-hidden rounded-[12px] border border-[#F2E4D8] mt-6">
                                    <img
                                        src={
                                            config.galleryImages[1] ||
                                            config.heroImageUrl
                                        }
                                        alt={`${tenantName} story 2`}
                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {config.sections.stats !== false ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 border border-[#EBD8C8] bg-[#FFFBF7]">
                                {aboutStats.map((st, idx) => (
                                    <motion.div
                                        key={st.label}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.5,
                                            delay: idx * 0.1,
                                        }}
                                        className={`p-8 text-center space-y-1.5 ${
                                            idx > 0
                                                ? "border-t md:border-t-0 md:border-l border-[#EBD8C8]"
                                                : ""
                                        }`}
                                    >
                                        <p
                                            className="lunarossa-display text-5xl sm:text-[60px] leading-none"
                                            style={{ color: caramel }}
                                        >
                                            {st.num}
                                        </p>
                                        <p className="text-sm font-bold uppercase tracking-wide text-[#3B3B3B]">
                                            {st.label}
                                        </p>
                                        {"sub" in st && st.sub ? (
                                            <p className="text-xs text-[#7A7A7A]">
                                                {String(st.sub)}
                                            </p>
                                        ) : null}
                                    </motion.div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 4. Signature Products Showcase + Floating Featured Card + 4x2 Grid */}
            {config.sections.menu ? (
                <section
                    id="menu"
                    className="bg-[#FFF6EE] py-16 sm:py-24 px-4 sm:px-8"
                >
                    <div className="mx-auto max-w-[1360px] space-y-10">
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <h2
                                className="lunarossa-display text-4xl sm:text-5xl lg:text-[60px] uppercase leading-[0.92] tracking-[-1px]"
                                style={{ color: caramel }}
                            >
                                {cc.menuTitle ||
                                    "OUR SIGNATURE DISHES CRAFTED WITH PASSION"}
                            </h2>
                        </div>

                        {/* Banner with Floating Featured Product Card */}
                        {featuredDish ? (
                            <div className="relative overflow-hidden rounded-[16px] border border-[#F2E4D8] min-h-[340px] sm:min-h-[420px]">
                                <img
                                    src={
                                        featuredDish.imageUrl
                                            ? resolveMediaUrl(
                                                  featuredDish.imageUrl,
                                              )
                                            : config.heroImageUrl
                                    }
                                    alt={featuredDish.name}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div className="relative z-10 p-5 sm:p-8 flex items-end min-h-[340px] sm:min-h-[420px]">
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="w-full max-w-xs rounded-[14px] bg-white p-5 shadow-2xl border border-[#F2E4D8] space-y-3 text-center"
                                    >
                                        <div className="mx-auto size-24 rounded-full overflow-hidden border-2 border-[#FFF6EE] shadow-sm">
                                            <DishImageOrPlaceholder
                                                imageUrl={featuredDish.imageUrl}
                                                alt={featuredDish.name}
                                                className="h-full w-full object-cover"
                                                placeholderClassName="bg-[#FFE6C8]/65 text-[#B27647]"
                                                iconClassName="size-7 opacity-65"
                                            />
                                        </div>
                                        <div className="flex justify-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className="size-3.5 fill-[#F5B918] text-[#F5B918]"
                                                />
                                            ))}
                                        </div>
                                        <h4 className="text-base font-black uppercase text-[#3B3B3B]">
                                            {featuredDish.name}
                                        </h4>
                                        <p
                                            className="text-lg font-bold"
                                            style={{ color: caramel }}
                                        >
                                            {formatEtb(
                                                Number(featuredDish.price),
                                            )}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedDish(featuredDish)
                                            }
                                            className="w-full rounded-[10px] py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] cursor-pointer"
                                            style={{ backgroundColor: berry }}
                                        >
                                            VIEW DETAILS →
                                        </button>
                                    </motion.div>
                                </div>
                            </div>
                        ) : null}

                        {/* 4-Column Product Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {gridDishes.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -5 }}
                                    viewport={{ once: true, amount: 0.15 }}
                                    transition={{
                                        duration: 0.45,
                                        delay: (idx % 4) * 0.06,
                                    }}
                                    className="rounded-[12px] border border-[#F2E4D8] bg-[#FFFBF7] p-5 flex flex-col items-center text-center justify-between gap-3 shadow-2xs hover:shadow-lg transition-shadow"
                                >
                                    <div className="size-28 rounded-full overflow-hidden border border-[#F2E4D8]">
                                        <DishImageOrPlaceholder
                                            imageUrl={item.imageUrl}
                                            alt={item.name}
                                            className="h-full w-full object-cover hover:scale-110 transition-transform duration-500"
                                            placeholderClassName="bg-[#FFE6C8]/65 text-[#B27647]"
                                            iconClassName="size-8 opacity-65"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className="size-3 fill-[#F5B918] text-[#F5B918]"
                                                />
                                            ))}
                                        </div>
                                        <h4 className="text-sm font-black uppercase text-[#3B3B3B]">
                                            {item.name}
                                        </h4>
                                        <p
                                            className="text-base font-bold"
                                            style={{ color: caramel }}
                                        >
                                            {formatEtb(Number(item.price))}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDish(item)}
                                        className="w-full rounded-[10px] py-2 text-xs font-semibold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] cursor-pointer"
                                        style={{ backgroundColor: berry }}
                                    >
                                        VIEW DETAILS →
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setShowFullMenu(p => !p)}
                                className="rounded-[10px] border border-[#B27647] px-7 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#B27647] hover:bg-[#B27647] hover:text-white transition-colors cursor-pointer"
                            >
                                {showFullMenu
                                    ? "HIDE FULL MENU"
                                    : `BROWSE ALL ${menuItems.length} DISHES →`}
                            </button>
                        </div>

                        {showFullMenu ? (
                            <div className="rounded-[16px] border border-[#F2E4D8] bg-white p-4 sm:p-6">
                                <SiteMenuExplorer
                                    items={menuItems}
                                    accentColor={berry}
                                    variant="cards"
                                    layout={config.menuLayout ?? "cards"}
                                    title="Full Kitchen Menu"
                                    subtitle="Traditional dishes & generous platters."
                                />
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 5. Our Process Checkerboard Timeline */}
            {config.sections.timeline !== false ? (
                <section className="bg-[#FFF6EE] py-16 sm:py-24 px-4 sm:px-8 border-t border-[#EBD8C8]">
                    <div className="mx-auto max-w-[1360px] space-y-12">
                        <div className="text-center max-w-2xl mx-auto">
                            <h2
                                className="lunarossa-display text-4xl sm:text-5xl lg:text-[60px] uppercase leading-[0.92] tracking-[-1px]"
                                style={{ color: caramel }}
                            >
                                {cc.timelineTitle ||
                                    "OUR PROCESS BEHIND EVERY PERFECT DISH"}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {processSteps.map((step, idx) => {
                                const imgFirst = idx < 2;
                                return (
                                    <motion.div
                                        key={step.num}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.5,
                                            delay: idx * 0.08,
                                        }}
                                        className="flex flex-col gap-5 border-r border-dashed border-[#B27647]/30 last:border-r-0 pr-0 sm:pr-4"
                                    >
                                        {imgFirst ? (
                                            <>
                                                <div className="aspect-[4/3] overflow-hidden rounded-[12px] border border-[#F2E4D8]">
                                                    <img
                                                        src={step.img}
                                                        alt={step.title}
                                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-[#8F213E]">
                                                        {step.eyebrow}
                                                    </p>
                                                    <h5
                                                        className="lunarossa-display text-[28px] uppercase leading-none"
                                                        style={{
                                                            color: caramel,
                                                        }}
                                                    >
                                                        {step.title}
                                                    </h5>
                                                    <p
                                                        className="lunarossa-display text-[48px] leading-none pt-1"
                                                        style={{
                                                            color: caramel,
                                                        }}
                                                    >
                                                        {step.num}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-1">
                                                    <p
                                                        className="lunarossa-display text-[48px] leading-none"
                                                        style={{
                                                            color: caramel,
                                                        }}
                                                    >
                                                        {step.num}
                                                    </p>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-[#8F213E]">
                                                        {step.eyebrow}
                                                    </p>
                                                    <h5
                                                        className="lunarossa-display text-[28px] uppercase leading-none"
                                                        style={{
                                                            color: caramel,
                                                        }}
                                                    >
                                                        {step.title}
                                                    </h5>
                                                </div>
                                                <div className="aspect-[4/3] overflow-hidden rounded-[12px] border border-[#F2E4D8]">
                                                    <img
                                                        src={step.img}
                                                        alt={step.title}
                                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 6. Sticky Scroll-Linked Services Section */}
            {config.sections.whyChoose !== false ? (
                <section
                    ref={servicesRef}
                    className="bg-[#FFF6EE] py-16 sm:py-24 px-4 sm:px-8 border-t border-[#EBD8C8]"
                >
                    <div className="mx-auto max-w-[1360px] space-y-10">
                        <h2
                            className="lunarossa-display text-4xl sm:text-5xl lg:text-[60px] uppercase leading-[0.92] tracking-[-1px]"
                            style={{ color: caramel }}
                        >
                            {cc.whyChooseTitle || "OUR KITCHEN SERVICES"}
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-[#EBD8C8] pt-8 gap-8">
                            <div className="lg:col-span-4 lg:sticky lg:top-28 self-start">
                                <motion.div
                                    key={servicesList[activeServiceIdx]?.img}
                                    initial={{ opacity: 0.6, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.35 }}
                                    className="aspect-square overflow-hidden rounded-[12px] border border-[#F2E4D8]"
                                >
                                    <img
                                        src={
                                            servicesList[activeServiceIdx]
                                                ?.img || config.heroImageUrl
                                        }
                                        alt={
                                            servicesList[activeServiceIdx]
                                                ?.title || tenantName
                                        }
                                        className="h-full w-full object-cover"
                                    />
                                </motion.div>
                            </div>

                            <div className="lg:col-span-3 lg:border-x border-[#EBD8C8] lg:px-6 lg:sticky lg:top-28 self-start">
                                <p className="text-xs font-bold uppercase tracking-widest text-[#8F213E]">
                                    {cc.whyChooseEyebrow || "DAILY CRAFT"}
                                </p>
                                <p className="mt-2 text-sm text-[#7A7A7A] leading-relaxed">
                                    Hover, click, or scroll to explore our
                                    kitchen craft.
                                </p>
                            </div>

                            <div className="lg:col-span-5 space-y-4">
                                {servicesList.map((srv, idx) => {
                                    const active = idx === activeServiceIdx;
                                    return (
                                        <button
                                            key={srv.title}
                                            type="button"
                                            onMouseEnter={() =>
                                                setActiveServiceIdx(idx)
                                            }
                                            onClick={() =>
                                                setActiveServiceIdx(idx)
                                            }
                                            className="block w-full text-left lunarossa-display text-3xl sm:text-[44px] uppercase leading-[0.95] tracking-[-1px] transition-opacity duration-300 cursor-pointer"
                                            style={{
                                                color: caramel,
                                                opacity: active ? 1 : 0.3,
                                            }}
                                        >
                                            {srv.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 7. Testimonials 3-Column Carousel */}
            {config.sections.reviews !== false ? (
                <section
                    id="reviews"
                    className="bg-[#FFF6EE] py-16 sm:py-24 px-4 sm:px-8 border-t border-[#EBD8C8]"
                >
                    <div className="mx-auto max-w-[1360px] space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {testimonials
                                .slice(reviewPage * 3, reviewPage * 3 + 3)
                                .map(t => (
                                    <motion.div
                                        key={t.id}
                                        whileHover={{ y: -4 }}
                                        className="rounded-[16px] border border-[#F2E4D8] bg-white p-5 space-y-5 flex flex-col justify-between shadow-2xs"
                                    >
                                        <div className="aspect-[16/10] overflow-hidden rounded-[12px]">
                                            <img
                                                src={t.img}
                                                alt={t.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <p
                                            className="text-sm font-medium leading-relaxed"
                                            style={{ color: caramel }}
                                        >
                                            &ldquo;{t.quote}&rdquo;
                                        </p>
                                        <div className="flex items-center gap-3 pt-2 border-t border-[#F2E4D8]">
                                            <div className="size-9 rounded-full bg-[#FFE6C8] flex items-center justify-center text-xs font-bold text-[#B27647]">
                                                {t.name.slice(0, 1)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase text-[#3B3B3B]">
                                                    {t.name}
                                                </p>
                                                <p className="text-[11px] text-[#7A7A7A]">
                                                    {t.role}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>

                        {slug ? (
                            <InlineWebsiteReviewForm
                                slug={slug}
                                tenantName={tenantName}
                                accent={berry}
                            />
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* 8. Daily Treats & Burgundy Rotating-Ring Cards */}
            {config.sections.spotlight ? (
                <section className="bg-[#FFF6EE] py-16 sm:py-24 px-4 sm:px-8 border-t border-[#EBD8C8]">
                    <div className="mx-auto max-w-[1360px] space-y-8">
                        <div className="text-center max-w-2xl mx-auto">
                            <h2
                                className="lunarossa-display text-4xl sm:text-5xl lg:text-[60px] uppercase leading-[0.92] tracking-[-1px]"
                                style={{ color: caramel }}
                            >
                                DELICIOUS FRESH TREATS WAITING TO BE ENJOYED
                            </h2>
                        </div>

                        {/* Row 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            <div className="lg:col-span-6 rounded-[16px] border border-[#F2E4D8] bg-[#FFFBF7] p-7 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-7 space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-[#B27647]">
                                        {config.spotlightTitle}
                                    </p>
                                    <h3
                                        className="lunarossa-display text-3xl sm:text-4xl uppercase leading-[0.95]"
                                        style={{ color: caramel }}
                                    >
                                        CRAFTING WARM MEMORIES EVERY DAY
                                    </h3>
                                    <a
                                        href="#menu"
                                        className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-xs font-semibold uppercase text-white"
                                        style={{ backgroundColor: berry }}
                                    >
                                        <span>VIEW ITEMS</span>
                                        <span>→</span>
                                    </a>
                                </div>
                                <div className="col-span-5 aspect-square overflow-hidden rounded-[12px]">
                                    <img
                                        src={
                                            config.galleryImages[0] ||
                                            config.heroImageUrl
                                        }
                                        alt={config.spotlightTitle}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>

                            <div
                                className="lg:col-span-6 relative overflow-hidden rounded-[16px] p-7 text-white flex flex-col justify-between min-h-[260px]"
                                style={{ backgroundColor: berry }}
                            >
                                <span className="pointer-events-none select-none lunarossa-display text-7xl sm:text-8xl uppercase text-[#7A1933] leading-none">
                                    KITCHEN
                                </span>
                                <div className="relative z-10 grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-7 space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                                            DAILY SPECIALS
                                        </p>
                                        <h3 className="lunarossa-display text-3xl sm:text-4xl uppercase leading-[0.95]">
                                            FRESHLY PREPARED, ALWAYS YOURS
                                        </h3>
                                    </div>
                                    <div className="col-span-5 aspect-[4/3] overflow-hidden rounded-[12px]">
                                        <img
                                            src={
                                                config.galleryImages[1] ||
                                                config.heroImageUrl
                                            }
                                            alt="Daily specials"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Rotating Circular Text Ring + 2 Menu Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div
                                className="rounded-[16px] p-7 text-white flex flex-col items-center justify-between text-center gap-6"
                                style={{ backgroundColor: berry }}
                            >
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                                        DAILY TABLE
                                    </p>
                                    <h3 className="lunarossa-display text-3xl uppercase mt-1">
                                        FRESH DELIGHTS, ALWAYS HERE
                                    </h3>
                                </div>

                                <div className="relative size-44 flex items-center justify-center">
                                    <motion.svg
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 18,
                                            ease: "linear",
                                        }}
                                        viewBox="0 0 180 180"
                                        className="absolute inset-0 size-full"
                                    >
                                        <defs>
                                            <path
                                                id="lr-ring-path"
                                                d="M 90, 90 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0"
                                            />
                                        </defs>
                                        <text
                                            fill="#FFFFFF"
                                            fontSize="11"
                                            fontWeight="600"
                                            letterSpacing="3"
                                        >
                                            <textPath href="#lr-ring-path">
                                                * SWEET MOMENTS START HERE *
                                                SWEET MOMENTS START HERE *
                                            </textPath>
                                        </text>
                                    </motion.svg>
                                    <div className="size-24 rounded-full overflow-hidden border-2 border-white/40">
                                        <img
                                            src={config.heroImageUrl}
                                            alt={tenantName}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            {[dailyListLeft, dailyListRight].map(
                                (list, colIdx) => (
                                    <div
                                        key={colIdx}
                                        className="rounded-[16px] border border-[#F2E4D8] bg-[#FFFBF7] p-6 space-y-4"
                                    >
                                        <h4
                                            className="lunarossa-display text-2xl uppercase"
                                            style={{ color: caramel }}
                                        >
                                            DAILY FAVORITES
                                        </h4>
                                        <div className="divide-y divide-[#F2E4D8]">
                                            {list.map(item => (
                                                <div
                                                    key={item.id}
                                                    onClick={() =>
                                                        setSelectedDish(item)
                                                    }
                                                    className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:opacity-80"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="size-9 rounded-full overflow-hidden shrink-0 border border-[#F2E4D8]">
                                                            <DishImageOrPlaceholder
                                                                imageUrl={
                                                                    item.imageUrl
                                                                }
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                                placeholderClassName="bg-[#FFE6C8]/65 text-[#B27647]"
                                                                iconClassName="size-4 opacity-65"
                                                            />
                                                        </div>
                                                        <span className="truncate text-xs font-bold uppercase text-[#3B3B3B]">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className="text-xs font-bold shrink-0"
                                                        style={{
                                                            color: caramel,
                                                        }}
                                                    >
                                                        {formatEtb(
                                                            Number(item.price),
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 9. Tilted 3-Card Collage + Diagonal Caramel Stripes + Rotating Scalloped Badge */}
            {config.sections.gallery ? (
                <section
                    id="gallery"
                    className="relative bg-[#FFF6EE] py-16 sm:py-24 px-4 sm:px-8 border-t border-[#EBD8C8] overflow-hidden"
                >
                    {/* Diagonal Caramel Stripes */}
                    <div
                        className="hidden md:block pointer-events-none absolute -top-6 left-10 h-28 w-5 -rotate-45 opacity-80"
                        style={{ backgroundColor: caramel }}
                    />
                    <div
                        className="hidden md:block pointer-events-none absolute -top-6 left-20 h-28 w-5 -rotate-45 opacity-55"
                        style={{ backgroundColor: caramel }}
                    />
                    <div
                        className="hidden md:block pointer-events-none absolute -top-6 right-10 h-28 w-5 rotate-45 opacity-80"
                        style={{ backgroundColor: caramel }}
                    />
                    <div
                        className="hidden md:block pointer-events-none absolute -top-6 right-20 h-28 w-5 rotate-45 opacity-55"
                        style={{ backgroundColor: caramel }}
                    />

                    <div className="relative z-10 mx-auto max-w-[1360px] space-y-12 text-center">
                        <h2
                            className="lunarossa-display text-4xl sm:text-5xl lg:text-[60px] uppercase leading-[0.92] tracking-[-1px] max-w-xl mx-auto"
                            style={{ color: caramel }}
                        >
                            {cc.galleryTitle ||
                                "TASTE FRESHNESS IN EVERY SINGLE BITE"}
                        </h2>

                        <div className="relative max-w-4xl mx-auto pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                            {[
                                config.galleryImages[0] || config.heroImageUrl,
                                config.heroImageUrl,
                                config.galleryImages[1] || config.heroImageUrl,
                            ].map((src, idx) => (
                                <motion.div
                                    key={`${src}-${idx}`}
                                    whileHover={{ scale: 1.04, rotate: 0 }}
                                    className={`overflow-hidden rounded-[16px] border-4 border-white shadow-xl aspect-[3/4] ${
                                        idx === 0
                                            ? "sm:-rotate-4"
                                            : idx === 2
                                              ? "sm:rotate-4"
                                              : "z-10"
                                    }`}
                                >
                                    <img
                                        src={src}
                                        alt={`${tenantName} collage ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </motion.div>
                            ))}

                            <a
                                href="#menu"
                                className="hidden sm:flex absolute -top-2 left-1/2 -translate-x-1/2 z-20 size-24 rounded-full items-center justify-center text-white shadow-xl"
                                style={{ backgroundColor: caramel }}
                            >
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 14,
                                        ease: "linear",
                                    }}
                                    className="text-[9px] font-bold uppercase tracking-widest text-center px-2"
                                >
                                    EXPLORE MENU •
                                </motion.span>
                            </a>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 10. Dark Espresso Footer (#2F1908) */}
            {config.sections.contact ? (
                <footer className="bg-[#2F1908] text-white pt-14 pb-8 px-4 sm:px-8">
                    <div className="mx-auto max-w-[1360px] space-y-10">
                        <div className="pb-6 border-b border-white/12 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Utensils className="size-5 text-white" />
                                <span className="lunarossa-display text-2xl uppercase">
                                    {tenantName}
                                </span>
                            </div>
                            <SocialLinks profile={profile} isDark />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                                    EXPLORE
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs uppercase font-medium">
                                    <a href="#top" className="hover:opacity-75">
                                        Home
                                    </a>
                                    <a
                                        href="#about"
                                        className="hover:opacity-75"
                                    >
                                        About
                                    </a>
                                    <a
                                        href="#menu"
                                        className="hover:opacity-75"
                                    >
                                        Menu
                                    </a>
                                    <a
                                        href="#gallery"
                                        className="hover:opacity-75"
                                    >
                                        Gallery
                                    </a>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                                    SIGNATURE DISHES
                                </p>
                                <div className="space-y-2">
                                    {menuItems.slice(0, 2).map(item => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2.5"
                                        >
                                            <div className="size-10 rounded-lg overflow-hidden shrink-0">
                                                <DishImageOrPlaceholder
                                                    imageUrl={item.imageUrl}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                    placeholderClassName="bg-[#4B2910] text-[#B27647]"
                                                    iconClassName="size-4 opacity-70"
                                                />
                                            </div>
                                            <span className="text-xs font-semibold uppercase">
                                                {item.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-white/80">
                                <p className="font-bold uppercase tracking-wider text-white/60">
                                    CONTACT
                                </p>
                                {profile?.phone ? <p>{profile.phone}</p> : null}
                                {profile?.email ? <p>{profile.email}</p> : null}
                                {profile?.address ? (
                                    <p>{profile.address}</p>
                                ) : null}
                                {profile?.hours ? <p>{profile.hours}</p> : null}
                            </div>
                        </div>

                        <div className="border-t border-white/12 pt-6 text-center text-xs text-white/60">
                            © {new Date().getFullYear()} {tenantName}. ALL
                            RIGHTS RESERVED.
                        </div>
                    </div>
                </footer>
            ) : null}

            {/* Luna Rossa Product Detail Modal (/products/round-bread style) */}
            {selectedDish ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setSelectedDish(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-3xl rounded-[20px] bg-[#FFF6EE] text-[#3B3B3B] p-6 sm:p-8 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center max-h-[90vh] overflow-y-auto"
                    >
                        <div className="md:col-span-5 aspect-square overflow-hidden rounded-[16px] border border-[#F2E4D8]">
                            <DishImageOrPlaceholder
                                imageUrl={selectedDish.imageUrl}
                                alt={selectedDish.name}
                                className="h-full w-full object-cover"
                                placeholderClassName="bg-[#FFE6C8]/65 text-[#B27647]"
                                iconClassName="size-14 opacity-60"
                            />
                        </div>
                        <div className="md:col-span-7 space-y-4">
                            <h3
                                className="lunarossa-display text-4xl sm:text-5xl uppercase leading-[0.9] tracking-[-1px]"
                                style={{ color: caramel }}
                            >
                                {selectedDish.name}
                            </h3>
                            <p className="text-sm text-[#3B3B3B] leading-relaxed">
                                {selectedDish.description ||
                                    "Prepared fresh in our family kitchen with traditional spices and seasonal ingredients."}
                            </p>
                            <p
                                className="text-2xl font-bold"
                                style={{ color: caramel }}
                            >
                                {formatEtb(Number(selectedDish.price))}
                            </p>
                            <div className="divide-y divide-[#EBD8C8] border-y border-[#EBD8C8] text-xs">
                                <div className="py-2 flex justify-between">
                                    <span className="font-semibold uppercase text-[#7A7A7A]">
                                        CATEGORY
                                    </span>
                                    <span className="font-bold uppercase">
                                        {selectedDish.categoryName ||
                                            "House Special"}
                                    </span>
                                </div>
                                <div className="py-2 flex justify-between">
                                    <span className="font-semibold uppercase text-[#7A7A7A]">
                                        PREPARATION
                                    </span>
                                    <span className="font-bold uppercase">
                                        Fresh to Order
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDish(null)}
                                className="rounded-[10px] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white cursor-pointer"
                                style={{ backgroundColor: berry }}
                            >
                                CLOSE DETAILS
                            </button>
                        </div>
                    </motion.div>
                </div>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* DISPATCHER                                                                 */
/* -------------------------------------------------------------------------- */
export default function SiteTemplateRenderer(props: SiteTemplateRenderProps) {
    switch (props.templateId) {
        case "dark-steakhouse":
            return <DarkSteakhouseSite {...props} />;
        case "coffee-house":
            return <CoffeeHouseSite {...props} />;
        case "fast-casual":
            return <FastCasualSite {...props} />;
        case "family-kitchen":
            return <FamilyKitchenSite {...props} />;
        case "modern-bistro":
        default:
            return <ModernBistroSite {...props} />;
    }
}
