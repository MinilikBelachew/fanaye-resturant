import type { Data } from "@puckeditor/core";
import type { SiteTheme, TenantProfile } from "@/context/services/siteApi";

export type WebsiteTemplateId =
    | "harbor-bistro"
    | "ember-kitchen"
    | "garden-table"
    | "coffee-house"
    | "urban-plate";

export interface WebsiteTemplate {
    id: WebsiteTemplateId;
    name: string;
    tagline: string;
    vibe: string;
    previewImage: string;
    accent: string;
    theme: Partial<SiteTheme>;
}

const IMG = {
    harbor: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1600&auto=format&fit=crop",
    harborHero:
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1600&auto=format&fit=crop",
    harborFood:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    harborChef:
        "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=1200&auto=format&fit=crop",
    harborBowls:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
    harborPlate:
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    harborWine:
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    harborDining:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
    ember: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop",
    emberPlate:
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    garden: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1600&auto=format&fit=crop",
    gardenSalad:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
    coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop",
    coffeeCup:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop",
    urban: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1600&auto=format&fit=crop",
    urbanDish:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop",
    gallery1:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=900&auto=format&fit=crop",
    gallery2:
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=900&auto=format&fit=crop",
    gallery3:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=900&auto=format&fit=crop",
    gallery4:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=900&auto=format&fit=crop",
};

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
    {
        id: "harbor-bistro",
        name: "Fine Dining",
        tagline: "Modern food house — clean & bright",
        vibe: "White space, warm orange, split hero, cuisine cards & popular dishes — TasteHouse energy",
        previewImage: IMG.harborFood,
        accent: "#ff6a00",
        theme: {
            primaryColor: "#ff6a00",
            accentColor: "#171717",
            backgroundColor: "#fdfcf9",
            textColor: "#171717",
            backgroundType: "solid",
            fontDisplay: "Outfit, system-ui, sans-serif",
            fontBody: "DM Sans, system-ui, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "ember-kitchen",
        name: "Ember After Dark",
        tagline: "Night dining drama",
        vibe: "Ink surfaces, amber firelight, cinematic overlays — steakhouse heat",
        previewImage: IMG.ember,
        accent: "#f59e0b",
        theme: {
            primaryColor: "#f59e0b",
            accentColor: "#f8fafc",
            backgroundColor: "#020617",
            textColor: "#f8fafc",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(180deg, #020617 0%, #0f172a 55%, #1e293b 100%)",
            fontDisplay: "Playfair Display, serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "md",
        },
    },
    {
        id: "garden-table",
        name: "Garden Quiet",
        tagline: "Soft cards & fresh plates",
        vibe: "Cream canvas, coral accents, no rigid header — pebble cards that stand alone",
        previewImage: IMG.gardenSalad,
        accent: "#e85d04",
        theme: {
            primaryColor: "#e85d04",
            accentColor: "#171717",
            backgroundColor: "#f7f3ee",
            textColor: "#171717",
            backgroundType: "solid",
            fontDisplay: "Outfit, system-ui, sans-serif",
            fontBody: "DM Sans, system-ui, sans-serif",
            borderRadius: "full",
        },
    },
    {
        id: "coffee-house",
        name: "Roastery Warm",
        tagline: "Specialty café ritual",
        vibe: "Cream paper, espresso type, bakery gallery — slow-morning energy",
        previewImage: IMG.coffee,
        accent: "#92400e",
        theme: {
            primaryColor: "#92400e",
            accentColor: "#1c1917",
            backgroundColor: "#faf7f2",
            textColor: "#1c1917",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(160deg, #faf7f2 0%, #f5f0e6 50%, #efe6d6 100%)",
            fontDisplay: "Fraunces, serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "urban-plate",
        name: "City Mono",
        tagline: "Bold fast-casual",
        vibe: "High contrast, sharp type, list menus — lunch-rush clarity",
        previewImage: IMG.urban,
        accent: "#e85d04",
        theme: {
            primaryColor: "#e85d04",
            accentColor: "#09090b",
            backgroundColor: "#ffffff",
            textColor: "#09090b",
            backgroundType: "solid",
            fontDisplay: "Instrument Sans, sans-serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "none",
        },
    },
];

function uid(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function galleryUrls(...urls: string[]) {
    return urls.join("\n");
}

function amenitiesBlock(
    title: string,
    items: string,
    subtitle = "What to expect when you visit",
) {
    return {
        type: "Features" as const,
        props: {
            id: uid("amenities"),
            title,
            subtitle,
            items,
            columns: "3",
            size: "md",
        },
    };
}

function hoursBlock(title: string, rows: string) {
    return {
        type: "Hours" as const,
        props: {
            id: uid("hours"),
            title,
            rows,
            size: "md",
        },
    };
}

function contactBlock(title: string) {
    return {
        type: "Contact" as const,
        props: {
            id: uid("contact"),
            title,
            showHours: true,
            showMapLink: true,
            size: "md",
        },
    };
}

export function buildScratchDraft(tenantName: string): Data {
    return {
        root: { props: { title: tenantName } },
        content: [
            {
                type: "Header",
                props: {
                    id: uid("header"),
                    showPhone: true,
                    linksLabel: "Menu,Contact",
                    navAlign: "split",
                    size: "md",
                    sticky: true,
                },
            },
            {
                type: "Hero",
                props: {
                    id: uid("hero"),
                    layout: "split",
                    headline: tenantName,
                    subheadline: "Tell your story. Add your menu. Publish.",
                    ctaLabel: "View menu",
                    ctaHref: "#menu",
                    secondaryCtaLabel: "Contact",
                    secondaryCtaHref: "#contact",
                    imageUrl: "",
                    size: "md",
                    overlay: "light",
                },
            },
            {
                type: "Footer",
                props: {
                    id: uid("footer"),
                    layout: "brandLinks",
                    note: `© ${new Date().getFullYear()} ${tenantName}`,
                    links: "Menu|#menu\nContact|#contact",
                    columns: "2",
                    size: "md",
                    showSocial: false,
                    instagram: "",
                    facebook: "",
                    tiktok: "",
                },
            },
        ],
    } as Data;
}

export type TemplateDraftProfile = Pick<
    TenantProfile,
    | "tagline"
    | "story"
    | "hours"
    | "phone"
    | "address"
    | "city"
    | "instagram"
    | "facebook"
    | "tiktok"
>;

export function buildTemplateDraft(
    templateId: WebsiteTemplateId,
    tenantName: string,
    profile?: TemplateDraftProfile | null,
): Data {
    const year = new Date().getFullYear();
    const name = tenantName || "Restaurant";
    const tagline = profile?.tagline?.trim() || "Good food, good mood.";
    const story =
        profile?.story?.trim() ||
        `Discover ${name} — fresh plates, warm hospitality, and offers worth sharing. Order at the table or reserve ahead.`;
    const hoursRows =
        profile?.hours?.trim() ||
        "Tue – Thu|18:00 – 22:00\nFri – Sat|17:30 – 23:00\nSun|12:30 – 16:00\nMon|Closed";
    const placeLine = [profile?.address, profile?.city]
        .filter(Boolean)
        .join(", ");

    const commonFooter = {
        type: "Footer" as const,
        props: {
            id: uid("footer"),
            layout: "brandLinks",
            note: `© ${year} ${name}. All rights reserved.`,
            links: "Menu|#menu\nAbout|#about\nHours|#hours\nContact|#contact",
            columns: "3",
            size: "md",
            showSocial: true,
            instagram: profile?.instagram || "",
            facebook: profile?.facebook || "",
            tiktok: profile?.tiktok || "",
        },
    };

    switch (templateId) {
        case "harbor-bistro":
            return {
                root: { props: { title: name } },
                content: [
                    {
                        type: "Header",
                        props: {
                            id: uid("header"),
                            showPhone: Boolean(profile?.phone?.trim()),
                            linksLabel:
                                "Menu,Categories,Offers,Reservations,Contact",
                            navAlign: "split",
                            ctaLabel: "Order now",
                            ctaHref: "#menu",
                            size: "md",
                            sticky: true,
                        },
                    },
                    {
                        type: "Hero",
                        props: {
                            id: uid("hero"),
                            layout: "imageRight",
                            headline: "Delicious food, served fresh.",
                            subheadline: `${tagline} ${story}`,
                            ctaLabel: "Order now",
                            ctaHref: "#menu",
                            secondaryCtaLabel: "Explore menu",
                            secondaryCtaHref: "#menu",
                            imageUrl: IMG.harborFood,
                            size: "lg",
                            overlay: "soft",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: uid("perks"),
                            title: "",
                            subtitle: "",
                            items: "Fresh daily|Ingredients prepped every morning\nFast table service|From order to plate without the wait\nSecure payment|Cash, bank transfer & Telebirr\nAlways here|Friendly floor support when you need it",
                            columns: "4",
                            size: "sm",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: uid("cuisines"),
                            title: "Explore by cuisine",
                            subtitle: "Browse the kitchen by mood",
                            items: "Grill & fire|Charred plates & house sauces\nPasta & bowls|Comfort classics, done clean\nSpice route|Warm spices & bold sides\nStreet favorites|Crispy, shareable, fast\nSweet finish|Cakes, gelato & bakery",
                            columns: "3",
                            size: "md",
                        },
                    },
                    {
                        type: "Menu",
                        props: {
                            id: uid("menu"),
                            title: "Popular dishes",
                            subtitle: "Guest favorites from today’s kitchen",
                            categoryFilter: "all",
                            layout: "cards",
                            columns: "4",
                            showImages: true,
                            imageSize: "md",
                            size: "md",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: "offers",
                            title: "Today’s offers",
                            subtitle: "Worth claiming before you sit",
                            items: "First visit welcome|Ask your waiter for the house welcome plate when you open a new table.\nFamily table special|Shareable combos for groups — perfect for weekends and celebrations.",
                            columns: "2",
                            size: "md",
                        },
                    },
                    {
                        type: "About",
                        props: {
                            id: uid("about"),
                            layout: "imageLeft",
                            title: `About ${name}`,
                            body: story,
                            imageUrl: IMG.harborDining,
                            stats: placeLine
                                ? `Location|${placeLine}\nService|Dine-in & table QR order\nReservations|Recommended`
                                : "Service|Dine-in & table QR order\nReservations|Recommended\nGuests|Families & date nights",
                            size: "md",
                        },
                    },
                    hoursBlock("Hours", hoursRows),
                    contactBlock(
                        placeLine ? `Visit ${name}` : "Reservations & contact",
                    ),
                    {
                        type: "CtaBanner",
                        props: {
                            id: uid("cta"),
                            title: "Hungry? Start with the menu.",
                            body: "Scan your table QR to order, or reserve a spot and walk in ready.",
                            ctaLabel: "View menu",
                            ctaHref: "#menu",
                            size: "md",
                        },
                    },
                    {
                        type: "Footer",
                        props: {
                            id: uid("footer"),
                            layout: "brandLinks",
                            note: `© ${year} ${name}${placeLine ? ` · ${placeLine}` : ""}.`,
                            links: "Menu|#menu\nOffers|#offers\nHours|#hours\nContact|#contact",
                            columns: "3",
                            size: "md",
                            showSocial: true,
                            instagram: profile?.instagram || "",
                            facebook: profile?.facebook || "",
                            tiktok: profile?.tiktok || "",
                        },
                    },
                ],
            } as Data;

        case "ember-kitchen":
            return {
                root: { props: { title: name } },
                content: [
                    {
                        type: "Header",
                        props: {
                            id: uid("header"),
                            showPhone: true,
                            linksLabel: "Menu,About,Gallery,Contact",
                            navAlign: "center",
                            size: "md",
                            sticky: true,
                        },
                    },
                    {
                        type: "Hero",
                        props: {
                            id: uid("hero"),
                            layout: "overlay",
                            headline: `${name}`,
                            subheadline:
                                "Fire, slow cuts, and candlelight. Dinner that starts after dark.",
                            ctaLabel: "Tonight’s menu",
                            ctaHref: "#menu",
                            secondaryCtaLabel: "Book a night",
                            secondaryCtaHref: "#contact",
                            imageUrl: IMG.ember,
                            size: "lg",
                            overlay: "heavy",
                        },
                    },
                    {
                        type: "Carousel",
                        props: {
                            id: uid("carousel"),
                            title: "On the pass",
                            imageUrls: galleryUrls(
                                IMG.emberPlate,
                                IMG.gallery3,
                                IMG.ember,
                            ),
                            captions: "Ember grill\nChef’s cut\nLate service",
                            variant: "full",
                            height: "md",
                            interval: "5",
                            showArrows: true,
                            showDots: true,
                            size: "md",
                        },
                    },
                    {
                        type: "Menu",
                        props: {
                            id: uid("menu"),
                            title: "Fire & plate",
                            subtitle: "Pulled live from your menu catalog",
                            categoryFilter: "all",
                            layout: "list",
                            columns: "2",
                            showImages: true,
                            imageSize: "sm",
                            size: "md",
                        },
                    },
                    {
                        type: "About",
                        props: {
                            id: uid("about"),
                            layout: "imageLeft",
                            title: "Crafted over flame",
                            body: `At ${name}, the grill is the heart of the house. We source carefully, sear boldly, and plate with restraint — so every bite lands.`,
                            imageUrl: IMG.emberPlate,
                            stats: "Grill hours|6pm–late\nCuts|Prime\nBar|Full",
                            size: "md",
                        },
                    },
                    {
                        type: "Testimonials",
                        props: {
                            id: uid("testimonials"),
                            title: "Word of mouth",
                            items: `Best night out this year.|Yonas\nThe dry-aged cut was perfect.|Helen\nDark, loud, delicious.|Alex`,
                            size: "md",
                        },
                    },
                    amenitiesBlock(
                        "House details",
                        "Reservations|Recommended on weekends — message us for booths.\nDress code|Smart casual. Jackets welcome, sneakers fine.\nBar & lounge|Full bar opens with the kitchen.",
                    ),
                    hoursBlock(
                        "Evening hours",
                        "Tue–Thu|17:00 – 23:00\nFri–Sat|17:00 – 00:30\nSun|17:00 – 22:00\nMonday|Closed",
                    ),
                    {
                        type: "CtaBanner",
                        props: {
                            id: uid("cta"),
                            title: "Request a table",
                            body: "Evenings fill fast on weekends — message us for a booth or bar seat.",
                            ctaLabel: "Contact",
                            ctaHref: "#contact",
                            size: "md",
                        },
                    },
                    contactBlock("Arrive after dusk"),
                    commonFooter,
                ],
            } as Data;

        case "garden-table": {
            const gardenTagline =
                profile?.tagline?.trim() ||
                "Fresh & delicious food for every taste.";
            const gardenStory =
                profile?.story?.trim() ||
                `${name} cooks what the market brings — crisp greens, fire-roasted vegetables, and desserts that still taste like fruit.`;
            return {
                root: { props: { title: name } },
                content: [
                    // No top Header — cards stand alone like the pebble layout.
                    {
                        type: "Hero",
                        props: {
                            id: uid("hero"),
                            layout: "imageRight",
                            headline: gardenTagline.toUpperCase(),
                            subheadline: gardenStory,
                            ctaLabel: "Order now",
                            ctaHref: "#menu",
                            secondaryCtaLabel: "View menu",
                            secondaryCtaHref: "#menu",
                            imageUrl: IMG.harborFood,
                            size: "lg",
                            overlay: "soft",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: uid("pill"),
                            title: "",
                            subtitle: "",
                            layout: "pillBar",
                            items: "Breakfast|Light starts & warm bread\nLunch|Bowls, salads, grill plates\nDinner|Shared tables after dark\nDrinks|Fresh juices & soft sips",
                            columns: "4",
                            size: "sm",
                        },
                    },
                    {
                        type: "Arrangement",
                        props: {
                            id: uid("arrangement"),
                            title: "",
                            imageUrls: galleryUrls(
                                IMG.gardenSalad,
                                IMG.harborPlate,
                                IMG.garden,
                                IMG.gallery1,
                            ),
                            warmTitle: "Taste the season",
                            warmBody:
                                "Bright plates and soft lighting for unhurried meals.",
                            warmCtaLabel: "See menu",
                            warmCtaHref: "#menu",
                            darkTitle: "Reserve tonight",
                            darkBody: placeLine
                                ? `Find us at ${placeLine}. Ask for a patio table or a quiet corner.`
                                : "Ask for a patio table or a quiet corner inside.",
                            darkCtaLabel: "Contact",
                            darkCtaHref: "#contact",
                            size: "md",
                        },
                    },
                    {
                        type: "Menu",
                        props: {
                            id: uid("menu"),
                            title: "From the menu",
                            subtitle: "Live sample dishes from your kitchen",
                            categoryFilter: "all",
                            layout: "cards",
                            columns: "3",
                            showImages: true,
                            imageSize: "md",
                            size: "md",
                        },
                    },
                    hoursBlock("Hours", hoursRows),
                    contactBlock(placeLine ? `Visit ${name}` : "Visit us"),
                    {
                        type: "Footer",
                        props: {
                            id: uid("footer"),
                            layout: "brandLinks",
                            note: `© ${year} ${name}${placeLine ? ` · ${placeLine}` : ""}.`,
                            links: "Menu|#menu\nHours|#hours\nContact|#contact",
                            columns: "3",
                            size: "md",
                            showSocial: true,
                            instagram: profile?.instagram || "",
                            facebook: profile?.facebook || "",
                            tiktok: profile?.tiktok || "",
                        },
                    },
                ],
            } as Data;
        }

        case "coffee-house":
            return {
                root: { props: { title: name } },
                content: [
                    {
                        type: "Header",
                        props: {
                            id: uid("header"),
                            showPhone: true,
                            linksLabel: "Menu,About,Gallery,Contact",
                            navAlign: "split",
                            size: "sm",
                            sticky: true,
                        },
                    },
                    {
                        type: "Hero",
                        props: {
                            id: uid("hero"),
                            layout: "split",
                            headline: name,
                            subheadline:
                                "Roast, brew, gather. Specialty coffee and bakery for slow mornings.",
                            ctaLabel: "Order from menu",
                            ctaHref: "#menu",
                            secondaryCtaLabel: "Find us",
                            secondaryCtaHref: "#contact",
                            imageUrl: IMG.coffee,
                            size: "lg",
                            overlay: "light",
                        },
                    },
                    {
                        type: "Menu",
                        props: {
                            id: uid("menu"),
                            title: "Brew & bite",
                            subtitle: "Your live coffee and food catalog",
                            categoryFilter: "all",
                            layout: "cards",
                            columns: "3",
                            showImages: true,
                            imageSize: "md",
                            size: "md",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: uid("features"),
                            title: "The ritual",
                            subtitle: "",
                            items: "Single-origin|Transparent sourcing and careful roasting.\nHouse bakery|Pastries baked before the doors open.\nWi‑Fi & work|Quiet corners for meetings and study.",
                            columns: "3",
                            size: "md",
                        },
                    },
                    {
                        type: "About",
                        props: {
                            id: uid("about"),
                            layout: "imageLeft",
                            title: "Our house",
                            body: `${name} is built around the Ethiopian coffee ceremony spirit — hospitality first, then a perfect cup.`,
                            imageUrl: IMG.coffeeCup,
                            stats: "Roasts weekly|3\nSeats|48\nPastries|Daily",
                            size: "md",
                        },
                    },
                    {
                        type: "Gallery",
                        props: {
                            id: uid("gallery"),
                            title: "Inside",
                            imageUrls: galleryUrls(
                                IMG.coffee,
                                IMG.coffeeCup,
                                IMG.gallery2,
                                IMG.gallery1,
                            ),
                            columns: "4",
                            size: "md",
                        },
                    },
                    amenitiesBlock(
                        "Café extras",
                        "Wi‑Fi|Fast and free for guests who stay to work.\nRetail beans|Take home the roast of the week.\nTakeaway|Cups and pastry boxes ready at the counter.",
                    ),
                    {
                        type: "CtaBanner",
                        props: {
                            id: uid("cta"),
                            title: "Grab a cup today",
                            body: "Dine in or take away — beans and brew to go.",
                            ctaLabel: "See hours",
                            ctaHref: "#hours",
                            size: "md",
                        },
                    },
                    hoursBlock(
                        "Café hours",
                        "Mon–Fri|07:00 – 20:00\nSat–Sun|08:00 – 21:00",
                    ),
                    contactBlock("Come through"),
                    commonFooter,
                ],
            } as Data;

        case "urban-plate":
            return {
                root: { props: { title: name } },
                content: [
                    {
                        type: "Header",
                        props: {
                            id: uid("header"),
                            showPhone: true,
                            linksLabel: "Menu,Features,About,Contact",
                            navAlign: "split",
                            size: "sm",
                            sticky: true,
                        },
                    },
                    {
                        type: "Hero",
                        props: {
                            id: uid("hero"),
                            layout: "split",
                            headline: name.toUpperCase(),
                            subheadline:
                                "Fast flavor. Sharp design. City plates that don’t waste your time.",
                            ctaLabel: "Menu",
                            ctaHref: "#menu",
                            secondaryCtaLabel: "Call",
                            secondaryCtaHref: "#contact",
                            imageUrl: IMG.urban,
                            size: "lg",
                            overlay: "light",
                        },
                    },
                    {
                        type: "Menu",
                        props: {
                            id: uid("menu"),
                            title: "Menu",
                            subtitle: "Live from your menu — always current",
                            categoryFilter: "all",
                            layout: "list",
                            columns: "2",
                            showImages: true,
                            imageSize: "sm",
                            size: "md",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: uid("features"),
                            title: "Built for speed",
                            subtitle: "",
                            items: "Quick service|From order to table without the wait.\nQR friendly|Guests can browse while they sit.\nTakeaway ready|Packaging that travels.",
                            columns: "3",
                            size: "md",
                        },
                    },
                    {
                        type: "About",
                        props: {
                            id: uid("about"),
                            layout: "imageRight",
                            title: "City kitchen",
                            body: `${name} keeps the menu tight and the energy high — bold flavors for lunch rushes and late nights alike.`,
                            imageUrl: IMG.urbanDish,
                            stats: "Avg wait|12 min\nSignature|Bowls\nDelivery|Partners",
                            size: "md",
                        },
                    },
                    {
                        type: "Testimonials",
                        props: {
                            id: uid("testimonials"),
                            title: "Locals",
                            items: `Lunch here every Thursday.|Kidist\nClean flavors, zero fluff.|Ben\nThe spicy bowl hits.|Nati`,
                            size: "md",
                        },
                    },
                    amenitiesBlock(
                        "Quick info",
                        "Takeaway|Packaging ready for office and commute.\nQR menu|Scan at the table once you’re seated.\nAllergen notes|Ask staff — we flag common allergens on request.",
                    ),
                    hoursBlock(
                        "Service hours",
                        "Mon–Thu|10:00 – 22:00\nFri–Sat|10:00 – 23:00\nSun|11:00 – 21:00",
                    ),
                    {
                        type: "CtaBanner",
                        props: {
                            id: uid("cta"),
                            title: "Order now",
                            body: "Walk in, take away, or scan the QR when you sit.",
                            ctaLabel: "View menu",
                            ctaHref: "#menu",
                            size: "md",
                        },
                    },
                    contactBlock("Location"),
                    commonFooter,
                ],
            } as Data;
    }
}

export function getTemplate(id: WebsiteTemplateId) {
    return WEBSITE_TEMPLATES.find(t => t.id === id)!;
}

export function looksLikeStarterDraft(data: Data | null | undefined): boolean {
    if (!data?.content || !Array.isArray(data.content)) return true;
    if (data.content.length === 0) return true;
    if (data.content.length > 8) return false;
    const types = data.content.map(block => block.type);
    const starter = ["Header", "Hero", "Menu", "About", "Contact", "Footer"];
    return starter.every(t => types.includes(t)) && types.length <= 7;
}
