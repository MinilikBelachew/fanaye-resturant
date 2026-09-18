import type { Data } from "@puckeditor/core";
import type { SiteTheme } from "@/context/services/siteApi";

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
    harbor: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format&fit=crop",
    harborFood:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
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
        name: "Harbor Bistro",
        tagline: "Coastal fine dining",
        vibe: "Editorial serif, navy & seafoam — classic restaurant landing",
        previewImage: IMG.harbor,
        accent: "#0e7490",
        theme: {
            primaryColor: "#0e7490",
            accentColor: "#0f172a",
            backgroundColor: "#f8fafc",
            textColor: "#0f172a",
            backgroundType: "solid",
            fontDisplay: "Fraunces, serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "ember-kitchen",
        name: "Ember Kitchen",
        tagline: "Night dining drama",
        vibe: "Dark surfaces, amber highlights — steakhouse energy",
        previewImage: IMG.ember,
        accent: "#f59e0b",
        theme: {
            primaryColor: "#f59e0b",
            accentColor: "#111827",
            backgroundColor: "#0b1120",
            textColor: "#f8fafc",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(180deg, #020617 0%, #1e293b 100%)",
            fontDisplay: "Playfair Display, serif",
            fontBody: "Inter, sans-serif",
            borderRadius: "md",
        },
    },
    {
        id: "garden-table",
        name: "Garden Table",
        tagline: "Fresh & botanical",
        vibe: "Light greens, airy type — farm-to-table feel",
        previewImage: IMG.garden,
        accent: "#059669",
        theme: {
            primaryColor: "#059669",
            accentColor: "#064e3b",
            backgroundColor: "#f0fdf4",
            textColor: "#052e16",
            backgroundType: "gradient",
            backgroundGradient:
                "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 55%, #bbf7d0 100%)",
            fontDisplay: "Playfair Display, serif",
            fontBody: "Plus Jakarta Sans, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "coffee-house",
        name: "Coffee House",
        tagline: "Warm café ritual",
        vibe: "Espresso browns & soft cream — specialty coffee sites",
        previewImage: IMG.coffee,
        accent: "#92400e",
        theme: {
            primaryColor: "#92400e",
            accentColor: "#1c1917",
            backgroundColor: "#faf7f2",
            textColor: "#1c1917",
            backgroundType: "solid",
            fontDisplay: "Fraunces, serif",
            fontBody: "DM Sans, sans-serif",
            borderRadius: "xl",
        },
    },
    {
        id: "urban-plate",
        name: "Urban Plate",
        tagline: "Bold modern menu",
        vibe: "High contrast, sharp type — fast-casual city restaurants",
        previewImage: IMG.urban,
        accent: "#e85d04",
        theme: {
            primaryColor: "#e85d04",
            accentColor: "#09090b",
            backgroundColor: "#ffffff",
            textColor: "#09090b",
            backgroundType: "solid",
            fontDisplay: "Inter, sans-serif",
            fontBody: "Inter, sans-serif",
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

export function buildTemplateDraft(
    templateId: WebsiteTemplateId,
    tenantName: string,
): Data {
    const year = new Date().getFullYear();
    const name = tenantName || "Restaurant";

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
            instagram: "",
            facebook: "",
            tiktok: "",
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
                            showPhone: true,
                            linksLabel: "Menu,About,Gallery,Hours,Contact",
                            navAlign: "split",
                            size: "md",
                            sticky: true,
                        },
                    },
                    {
                        type: "Hero",
                        props: {
                            id: uid("hero"),
                            layout: "overlay",
                            headline: name,
                            subheadline:
                                "Seasonal plates, ocean-bright flavors, and a table worth lingering at.",
                            ctaLabel: "Explore menu",
                            ctaHref: "#menu",
                            secondaryCtaLabel: "Reserve a table",
                            secondaryCtaHref: "#contact",
                            imageUrl: IMG.harbor,
                            size: "lg",
                            overlay: "medium",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: uid("features"),
                            title: "Why guests return",
                            subtitle: "Hospitality, craft, and consistency",
                            items: "Chef-led kitchen|Seasonal menus changed with the catch and market.\nWarm service|Hosts who remember regulars and rituals.\nPrivate rooms|Quiet corners for celebrations and teams.",
                            columns: "3",
                            size: "md",
                        },
                    },
                    {
                        type: "Menu",
                        props: {
                            id: uid("menu"),
                            title: "From the kitchen",
                            subtitle: "Live menu from your catalog",
                            categoryFilter: "all",
                            layout: "cards",
                            columns: "3",
                            showImages: true,
                            imageSize: "md",
                            size: "md",
                        },
                    },
                    {
                        type: "About",
                        props: {
                            id: uid("about"),
                            layout: "imageRight",
                            title: "Our story",
                            body: `${name} began with a simple idea: serve honest food in a room that feels like home by the water. Every plate is prepared to order — never rushed, never anonymous.`,
                            imageUrl: IMG.harborFood,
                            stats: "Years|8\nSignature dishes|40+\nCovers nightly|120",
                            size: "md",
                        },
                    },
                    {
                        type: "Gallery",
                        props: {
                            id: uid("gallery"),
                            title: "The room",
                            imageUrls: galleryUrls(
                                IMG.gallery1,
                                IMG.harbor,
                                IMG.gallery2,
                                IMG.harborFood,
                            ),
                            columns: "4",
                            size: "md",
                        },
                    },
                    amenitiesBlock(
                        "Planning your visit",
                        "Reservations|Call or walk in — we hold a few tables nightly.\nParking|Street and nearby lot after 6pm.\nPrivate dining|Ask about the back room for 8–14 guests.",
                    ),
                    {
                        type: "Testimonials",
                        props: {
                            id: uid("testimonials"),
                            title: "Guests say",
                            items: `A perfect evening — service and flavor in balance.|Marta\nWe celebrate every milestone here.|Daniel\nFresh, bright, and unforgettable.|Sara`,
                            size: "md",
                        },
                    },
                    hoursBlock(
                        "Hours",
                        "Mon–Thu|11:00 – 22:00\nFri–Sat|11:00 – 23:30\nSun|12:00 – 21:00",
                    ),
                    contactBlock("Find us"),
                    {
                        type: "CtaBanner",
                        props: {
                            id: uid("cta"),
                            title: "Ready for tonight?",
                            body: "Walk in or call ahead — we keep a few tables for last-minute cravings.",
                            ctaLabel: "Call us",
                            ctaHref: "#contact",
                            size: "md",
                        },
                    },
                    commonFooter,
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

        case "garden-table":
            return {
                root: { props: { title: name } },
                content: [
                    {
                        type: "Header",
                        props: {
                            id: uid("header"),
                            showPhone: true,
                            linksLabel: "Menu,About,Features,Hours,Contact",
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
                            headline: name,
                            subheadline:
                                "Garden-bright cooking — herbs, fire-roasted vegetables, and slow Sundays.",
                            ctaLabel: "See the menu",
                            ctaHref: "#menu",
                            secondaryCtaLabel: "Our story",
                            secondaryCtaHref: "#about",
                            imageUrl: IMG.garden,
                            size: "lg",
                            overlay: "light",
                        },
                    },
                    {
                        type: "Features",
                        props: {
                            id: uid("features"),
                            title: "From plot to plate",
                            subtitle: "What makes lunch feel lighter",
                            items: "Seasonal produce|We cook what the market brings that morning.\nOpen kitchen|Watch salads and grills come together.\nPatio seating|Shade, breeze, and long brunches.",
                            columns: "3",
                            size: "md",
                        },
                    },
                    {
                        type: "Menu",
                        props: {
                            id: uid("menu"),
                            title: "Today’s garden",
                            subtitle: "Synced with your menu items",
                            categoryFilter: "all",
                            layout: "cards",
                            columns: "3",
                            showImages: true,
                            imageSize: "md",
                            size: "md",
                        },
                    },
                    {
                        type: "About",
                        props: {
                            id: uid("about"),
                            layout: "imageRight",
                            title: "Grown with care",
                            body: `${name} is a neighborhood table for people who want food that feels alive — crisp greens, bright sauces, and desserts that still taste like fruit.`,
                            imageUrl: IMG.gardenSalad,
                            stats: "Vegetarian|60%\nBrunch|Weekends\nPatio|Yes",
                            size: "md",
                        },
                    },
                    {
                        type: "Gallery",
                        props: {
                            id: uid("gallery"),
                            title: "Moments",
                            imageUrls: galleryUrls(
                                IMG.garden,
                                IMG.gardenSalad,
                                IMG.gallery4,
                                IMG.gallery1,
                            ),
                            columns: "4",
                            size: "md",
                        },
                    },
                    amenitiesBlock(
                        "Guest comforts",
                        "Outdoor seating|Shaded patio when the weather cooperates.\nKid friendly|High chairs and a shorter menu for little guests.\nDietary needs|Vegetarian, fasting, and gluten-aware options marked on the board.",
                    ),
                    hoursBlock(
                        "Open hours",
                        "Tue–Fri|10:00 – 21:00\nSat–Sun|09:00 – 22:00\nMonday|Closed",
                    ),
                    contactBlock("Visit the garden"),
                    commonFooter,
                ],
            } as Data;

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
