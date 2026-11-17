import type {
    PublicMenuItem,
    SiteTheme,
    TenantProfile,
} from "@/context/services/siteApi";

export type WebsiteTemplateId =
    | "modern-bistro"
    | "dark-steakhouse"
    | "coffee-house"
    | "fast-casual"
    | "family-kitchen";

export interface SectionVisibility {
    hero: boolean;
    spotlight: boolean;
    menu: boolean;
    story: boolean;
    gallery: boolean;
    reviews?: boolean;
    contact: boolean;
    marquee?: boolean;
    whyChoose?: boolean;
    stats?: boolean;
    timeline?: boolean;
    hours?: boolean;
}

export interface TemplateCustomCopy {
    aboutEyebrow?: string;
    aboutTitle?: string;
    whyChooseEyebrow?: string;
    whyChooseTitle?: string;
    whyChooseSubtitle?: string;
    menuEyebrow?: string;
    menuTitle?: string;
    menuSubtitle?: string;
    timelineEyebrow?: string;
    timelineTitle?: string;
    transitionTop?: string;
    transitionBottom?: string;
    craftEyebrow?: string;
    craftTitle?: string;
    counterTitle?: string;
    counterSubtitle?: string;
    galleryEyebrow?: string;
    galleryTitle?: string;
    reviewsEyebrow?: string;
    reviewsTitle?: string;
    hoursEyebrow?: string;
    hoursTitle?: string;
    marqueeItems?: string[];
    stats?: Array<{ num: string; label: string }>;
    highlights?: Array<{ title: string; desc: string; tag?: string }>;
    timelineStages?: Array<{ time: string; title: string; desc: string }>;
}

export type MenuLayoutMode = "cards" | "editorial" | "grouped" | "showcase";

export interface PerTemplateConfig {
    accentColor: string;
    heroImageUrl: string;
    heroHeadline: string;
    heroSubheadline: string;
    badgeText: string;
    ctaLabel: string;
    spotlightTitle: string;
    spotlightNote: string;
    managerName?: string;
    menuLayout?: MenuLayoutMode;
    galleryImages: string[];
    sections: SectionVisibility;
    customCopy?: TemplateCustomCopy;
}

export interface WebsiteTemplateMeta {
    id: WebsiteTemplateId;
    name: string;
    tagline: string;
    vibe: string;
    category: string;
    defaultTheme: Partial<SiteTheme>;
    accentPresets: string[];
    defaultConfig: PerTemplateConfig;
}

export const DEFAULT_SECTIONS: SectionVisibility = {
    hero: true,
    spotlight: true,
    menu: true,
    story: true,
    gallery: true,
    reviews: true,
    contact: true,
    marquee: true,
    whyChoose: true,
    stats: true,
    timeline: true,
    hours: true,
};

const IMG = {
    bistroHero:
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1600&auto=format&fit=crop",
    bistro1:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop",
    bistro2:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop",
    bistro3:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop",
    steakHero:
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
    steak1: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1000&auto=format&fit=crop",
    steak2: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop",
    coffeeHero:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop",
    coffee1:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop",
    coffee2:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop",
    grillHero:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1600&auto=format&fit=crop",
    grill1: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop",
    grill2: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop",
    familyHero:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    family1:
        "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1000&auto=format&fit=crop",
    family2:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop",
};

export const WEBSITE_TEMPLATES: WebsiteTemplateMeta[] = [
    {
        id: "modern-bistro",
        name: "Modern Bistro",
        tagline: "Crisp editorial layout with split hero & photo menu",
        vibe: "Bright, contemporary, balanced",
        category: "Casual Dining",
        accentPresets: ["#f37d2f", "#bc914c", "#0f766e", "#be123c"],
        defaultTheme: {
            primaryColor: "#131d1c",
            accentColor: "#f37d2f",
            backgroundColor: "#131d1c",
            textColor: "#ffffff",
            fontDisplay: "Gilda Display, Georgia, serif",
            fontBody: "Jost, system-ui, sans-serif",
        },
        defaultConfig: {
            accentColor: "#f37d2f",
            heroImageUrl: IMG.bistroHero,
            heroHeadline: "Savor Every Moment with Every Bite.",
            heroSubheadline:
                "Warm hospitality, vibrant local ingredients, and a kitchen built around open-fire flavor.",
            badgeText: "NOW OPEN · DINE IN & TAKEOUT",
            ctaLabel: "VIEW MENU",
            spotlightTitle: "Chef's Table Highlight",
            spotlightNote:
                "Every dish is prepared to order with fresh market produce and house-made sauces.",
            galleryImages: [IMG.bistro1, IMG.bistro2, IMG.bistro3],
            sections: { ...DEFAULT_SECTIONS },
            customCopy: {
                aboutEyebrow: "About",
                aboutTitle: "Every Celebration Remarkable",
                whyChooseEyebrow: "Why Choose Us?",
                whyChooseTitle: "More Than Dining It's Our Kitchen",
                menuEyebrow: "Explore Menu Option",
                menuTitle: "Signature Kitchen Menus",
                reviewsEyebrow: "Testimonial",
                reviewsTitle: "What Our Guests Are Saying",
                stats: [
                    { num: "2K", label: "Our Daily Order" },
                    { num: "15+", label: "Specialist Chef" },
                    { num: "25+", label: "Our Menu Dish" },
                    { num: "100%", label: "Fresh Ingredients" },
                ],
                highlights: [
                    { title: "Fresh & Authentic Ingredients", desc: "" },
                    { title: "Healthy & Flavorful Options", desc: "" },
                    { title: "Perfect for Every Occasion", desc: "" },
                ],
            },
        },
    },
    {
        id: "dark-steakhouse",
        name: "Dark Steakhouse & Lounge",
        tagline:
            "Warm espresso-dark luxury with bold typography & direct contact",
        vibe: "Bold, atmospheric, upscale",
        category: "Steakhouse & Lounge",
        accentPresets: ["#C88A4B", "#d97706", "#e11d48", "#10b981"],
        defaultTheme: {
            primaryColor: "#362013",
            accentColor: "#9A6B43",
            backgroundColor: "#EFE7DA",
            textColor: "#362013",
            fontDisplay: "Anton, Impact, sans-serif",
            fontBody: "Montserrat, Inter, system-ui, sans-serif",
        },
        defaultConfig: {
            accentColor: "#9A6B43",
            heroImageUrl: "/images/dining_table_round.jpg",
            heroHeadline: "FIRE, PRIME CUTS & LATE-NIGHT CRAFT.",
            heroSubheadline:
                "An intimate dining room built for slow evenings, wood-fired steaks, and signature pours.",
            badgeText: "EVENING SERVICE · DINNER & LOUNGE",
            ctaLabel: "Explore Menu",
            spotlightTitle: "Signature Table Service",
            spotlightNote:
                "Wood-fired cuts, house drinks, and warm evening hospitality served nightly.",
            managerName: "",
            galleryImages: [
                "/images/dining_table_round.jpg",
                "/images/dining_table_rect.jpg",
                "/images/dining_table_3d.jpg",
            ],
            sections: { ...DEFAULT_SECTIONS },
        },
    },
    {
        id: "coffee-house",
        name: "Coffee House & Bakery",
        tagline: "Warm linen & espresso palette with minimalist menu board",
        vibe: "Cozy, artisan, morning-first",
        category: "Cafe & Bakery",
        accentPresets: ["#D2AA7D", "#822822", "#A67346", "#92400e"],
        defaultTheme: {
            primaryColor: "#110E0C",
            accentColor: "#D2AA7D",
            backgroundColor: "#110E0C",
            textColor: "#F4EDE2",
            fontDisplay: "Fraunces, Georgia, serif",
            fontBody: "Schibsted Grotesk, Inter, system-ui, sans-serif",
        },
        defaultConfig: {
            accentColor: "#D2AA7D",
            heroImageUrl: IMG.coffeeHero,
            heroHeadline: "Single-origin roasts & warm morning bakes.",
            heroSubheadline:
                "Small-batch Ethiopian beans, flaky pastries out of the oven, and a quiet corner to stay awhile.",
            badgeText: "FRESH ROASTS DAILY",
            ctaLabel: "See Cafe Menu",
            spotlightTitle: "Today's Brew & Bake",
            spotlightNote:
                "Pour-overs, espresso classics, and warm pastries served from early morning.",
            galleryImages: [IMG.coffee1, IMG.coffee2, IMG.bistro2],
            sections: { ...DEFAULT_SECTIONS },
            customCopy: {
                aboutEyebrow: "(01) THE ROASTERY",
                menuEyebrow: "(02) THE MENU",
                menuTitle: "Six favorites we're known for.",
                timelineEyebrow: "(03) A DAY AT OUR ROASTERY",
                timelineTitle: "From the oven to the last espresso.",
                transitionTop: "Roast first.",
                transitionBottom: "Sweet later.",
                craftEyebrow: "(04) FROM THE OVEN & BAR",
                craftTitle: "Four ways we craft.",
                counterTitle: "The espresso bar.",
                counterSubtitle:
                    "Ten counter seats facing the roaster and pour-over bar, brewed right in front of you.",
                galleryEyebrow: "(05) THE ROOM",
                galleryTitle: "One oven. Warm mornings.",
                reviewsEyebrow: "GUEST NOTES",
                reviewsTitle: "What the city says about us.",
                hoursEyebrow: "(06) TODAY",
                hoursTitle: "Pull up a chair by the bar.",
                marqueeItems: [
                    "Single-origin pour-overs",
                    "Artisan croissants & sourdough",
                    "Small-batch espresso",
                    "Morning bakes from 4:30 AM",
                ],
                stats: [
                    {
                        num: "100%",
                        label: "Single-origin highland beans roasted in-house",
                    },
                    {
                        num: "4:30",
                        label: "The deck ovens warm every morning before dawn",
                    },
                    {
                        num: "18+",
                        label: "Signature brews, pastries & seasonal plates",
                    },
                ],
                highlights: [
                    {
                        title: "Single-origin highland beans",
                        desc: "Roasted in small batches for bright floral aromatics, cocoa sweetness, and zero bitterness.",
                        tag: "Small-batch roast",
                    },
                    {
                        title: "72-hour laminated pastry",
                        desc: "Cultured butter folded into crisp, honeycombed layers and baked fresh before sunrise.",
                        tag: "Deck oven",
                    },
                    {
                        title: "Hand-poured filter coffee",
                        desc: "Water temperature, grind size, and bloom timed to the second for clean clarity in every cup.",
                        tag: "Pour-over bar",
                    },
                    {
                        title: "Warm tarts & seasonal cakes",
                        desc: "Roasted nuts, caramelized honey, and seasonal fruit folded into light, balanced bakes.",
                        tag: "Sweet table",
                    },
                ],
            },
        },
    },
    {
        id: "fast-casual",
        name: "Fast Casual & Grill",
        tagline: "High-contrast street food energy with photo-first grid",
        vibe: "Energetic, punchy, quick-scan",
        category: "Burgers & Grill",
        accentPresets: ["#920711", "#FFC226", "#5F070D", "#0E5A3E"],
        defaultTheme: {
            primaryColor: "#920711",
            accentColor: "#920711",
            backgroundColor: "#FEF7E8",
            textColor: "#482820",
            fontDisplay: "Anton, Impact, sans-serif",
            fontBody: "Inter, system-ui, sans-serif",
        },
        defaultConfig: {
            accentColor: "#920711",
            heroImageUrl: IMG.grillHero,
            heroHeadline: "CRAFTED FOR CRAVINGS, SERVED WITH PERFECTION",
            heroSubheadline:
                "Smashed burgers, crispy sides, and bold house sauces made fresh when you order.",
            badgeText: "Fresh • Fast • Flavorful",
            ctaLabel: "Explore Menu",
            spotlightTitle: "DELICIOUS DEALS YOU CAN'T MISS",
            spotlightNote:
                "Crowd-favorite combos and signature grill specials served all day.",
            galleryImages: [IMG.grill1, IMG.grill2, IMG.bistro1],
            sections: { ...DEFAULT_SECTIONS },
            customCopy: {
                aboutEyebrow: "About Us",
                aboutTitle:
                    "EXCEPTIONAL EXPERIENCE WITH PREMIUM QUALITY, RICH FLAVORS",
                whyChooseEyebrow: "Why Choose Us",
                whyChooseTitle: "LOVED BY FOOD LOVERS",
                menuEyebrow: "Our Menu",
                menuTitle: "DISCOVER FLAVORS YOU'LL LOVE",
                menuSubtitle:
                    "Freshly grilled, crispy, and served straight from our live kitchen.",
                galleryEyebrow: "Gallery",
                galleryTitle: "A FEAST FOR YOUR EYES",
                reviewsEyebrow: "Testimonials",
                reviewsTitle: "WHAT OUR CUSTOMERS SAY",
                stats: [
                    { num: "8K+", label: "Dishes Served Monthly" },
                    { num: "24+", label: "Signature Recipes" },
                    { num: "80K+", label: "Happy Guests" },
                    { num: "100%", label: "Fresh Daily Prep" },
                ],
                highlights: [
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
                ],
            },
        },
    },
    {
        id: "family-kitchen",
        name: "Traditional & Family Kitchen",
        tagline: "Warm earth-tone hospitality built around shared platters",
        vibe: "Welcoming, cultural, generous",
        category: "Family & Heritage",
        accentPresets: ["#B27647", "#8F213E", "#2F1908", "#b45309"],
        defaultTheme: {
            primaryColor: "#B27647",
            accentColor: "#B27647",
            backgroundColor: "#FFF6EE",
            textColor: "#3B3B3B",
            fontDisplay: "Koulen, Impact, sans-serif",
            fontBody: "Poppins, system-ui, sans-serif",
        },
        defaultConfig: {
            accentColor: "#B27647",
            heroImageUrl: IMG.familyHero,
            heroHeadline: "BAKING HAPPINESS FOR EVERY HEART",
            heroSubheadline:
                "Authentic spices, slow-simmered stews, and generous platters made for gathering.",
            badgeText: "FAMILY HOSPITALITY · FRESH DAILY",
            ctaLabel: "VIEW MENU",
            spotlightTitle: "FROM OUR FAMILY TABLE",
            spotlightNote:
                "Prepared with traditional spice blends and fresh daily ingredients for groups and families.",
            galleryImages: [IMG.family1, IMG.family2, IMG.bistro1],
            sections: { ...DEFAULT_SECTIONS },
            customCopy: {
                aboutTitle: "THE HEART BEHIND OUR KITCHEN",
                menuTitle: "OUR SIGNATURE DISHES CRAFTED WITH PASSION",
                timelineTitle: "OUR PROCESS BEHIND EVERY PERFECT DISH",
                whyChooseEyebrow: "DAILY CRAFT",
                whyChooseTitle: "OUR KITCHEN SERVICES",
                galleryTitle: "TASTE FRESHNESS IN EVERY SINGLE BITE",
                stats: [
                    { num: "10K+", label: "HAPPY CUSTOMERS" },
                    { num: "99%", label: "GUEST SATISFACTION" },
                    { num: "500+", label: "FIVE-STAR REVIEWS" },
                ],
                highlights: [
                    { title: "FAMILY PLATTERS", desc: "" },
                    { title: "TRADITIONAL STEWS", desc: "" },
                    { title: "FRESH BAKED BREAD", desc: "" },
                    { title: "HOUSE SPICES", desc: "" },
                    { title: "GROUP DINING", desc: "" },
                    { title: "CHEF'S SPECIALS", desc: "" },
                ],
            },
        },
    },
];

const LEGACY_TEMPLATE_MAP: Record<string, WebsiteTemplateId> = {
    "foodly-modern": "modern-bistro",
    "harbor-bistro": "modern-bistro",
    "ember-kitchen": "dark-steakhouse",
    "garden-table": "family-kitchen",
    "coffee-house": "coffee-house",
    "urban-plate": "fast-casual",
};

export function normalizeTemplateId(raw?: unknown): WebsiteTemplateId {
    if (typeof raw === "string") {
        if (WEBSITE_TEMPLATES.some(t => t.id === raw)) {
            return raw as WebsiteTemplateId;
        }
        if (raw in LEGACY_TEMPLATE_MAP) {
            return LEGACY_TEMPLATE_MAP[raw];
        }
    }
    return "modern-bistro";
}

export function getTemplate(id?: unknown): WebsiteTemplateMeta {
    const normalized = normalizeTemplateId(id);
    return (
        WEBSITE_TEMPLATES.find(t => t.id === normalized) ?? WEBSITE_TEMPLATES[0]
    );
}

export function resolveTemplateConfig(
    templateId: WebsiteTemplateId,
    draftOrPublished?: Record<string, unknown> | null,
    theme?: Partial<SiteTheme> | null,
): PerTemplateConfig {
    const tpl = getTemplate(templateId);
    const allConfigs = (draftOrPublished?.templateConfigs ?? {}) as Partial<
        Record<string, Partial<PerTemplateConfig>>
    >;
    const saved = allConfigs[templateId] ?? {};

    const legacyHero =
        typeof draftOrPublished?.heroImageUrl === "string" &&
        draftOrPublished.heroImageUrl.trim()
            ? draftOrPublished.heroImageUrl
            : undefined;
    const legacySections = (draftOrPublished?.sections ?? undefined) as
        | Partial<SectionVisibility>
        | undefined;

    return {
        ...tpl.defaultConfig,
        ...saved,
        accentColor:
            saved.accentColor ||
            theme?.accentColor ||
            tpl.defaultConfig.accentColor,
        heroImageUrl:
            saved.heroImageUrl || legacyHero || tpl.defaultConfig.heroImageUrl,
        galleryImages:
            Array.isArray(saved.galleryImages) && saved.galleryImages.length > 0
                ? saved.galleryImages
                : tpl.defaultConfig.galleryImages,
        sections: {
            ...tpl.defaultConfig.sections,
            ...(legacySections ?? {}),
            ...(saved.sections ?? {}),
        },
        customCopy: {
            ...(tpl.defaultConfig.customCopy ?? {}),
            ...(saved.customCopy ?? {}),
        },
    };
}

export function buildSiteDataPayload(params: {
    templateId: WebsiteTemplateId;
    config: PerTemplateConfig;
    existingData?: Record<string, unknown> | null;
}): Record<string, unknown> {
    const prevConfigs = (params.existingData?.templateConfigs ?? {}) as Record<
        string,
        PerTemplateConfig
    >;
    return {
        templateId: params.templateId,
        sections: params.config.sections,
        heroImageUrl: params.config.heroImageUrl,
        templateConfigs: {
            ...prevConfigs,
            [params.templateId]: params.config,
        },
    };
}

export interface SiteTemplateRenderProps {
    templateId: WebsiteTemplateId;
    slug?: string | null;
    tenantName: string;
    config: PerTemplateConfig;
    profile?: TenantProfile | null;
    menuItems: PublicMenuItem[];
    logoUrl?: string | null;
}
