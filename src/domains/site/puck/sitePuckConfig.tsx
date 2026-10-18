"use client";

import { createContext, useContext } from "react";
import type { Config } from "@puckeditor/core";
import type { PublicMenuItem, SiteTheme } from "@/context/services/siteApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { DISH_IMAGES } from "@/lib/media";
import {
    GalleryUploadField,
    ImageUploadField,
} from "@/domains/site/puck/ImageUploadField";
import { SiteCarousel } from "@/domains/site/puck/SiteCarousel";
import {
    TYPOGRAPHY_DEFAULTS,
    bodyStyle,
    titleStyle,
    typographyFields,
    type SectionTypography,
} from "@/domains/site/puck/siteTypography";

type WithTypography = SectionTypography;

export type SiteSectionProps = {
    Header: {
        showPhone: boolean;
        linksLabel: string;
        navAlign: string;
        ctaLabel: string;
        ctaHref: string;
        size: string;
        sticky: boolean;
    } & WithTypography;
    Hero: {
        headline: string;
        subheadline: string;
        ctaLabel: string;
        ctaHref: string;
        secondaryCtaLabel: string;
        secondaryCtaHref: string;
        imageUrl: string;
        layout: string;
        size: string;
        overlay: string;
    } & WithTypography;
    Menu: {
        title: string;
        subtitle: string;
        categoryFilter: string;
        layout: string;
        showImages: boolean;
        imageSize: string;
        columns: string;
        size: string;
    } & WithTypography;
    About: {
        title: string;
        body: string;
        imageUrl: string;
        layout: string;
        stats: string;
        size: string;
    } & WithTypography;
    Gallery: {
        title: string;
        imageUrls: string;
        columns: string;
        size: string;
    } & WithTypography;
    Arrangement: {
        title: string;
        imageUrls: string;
        warmTitle: string;
        warmBody: string;
        warmCtaLabel: string;
        warmCtaHref: string;
        darkTitle: string;
        darkBody: string;
        darkCtaLabel: string;
        darkCtaHref: string;
        size: string;
    } & WithTypography;
    Carousel: {
        title: string;
        imageUrls: string;
        captions: string;
        variant: string;
        height: string;
        interval: string;
        showArrows: boolean;
        showDots: boolean;
        size: string;
    } & WithTypography;
    Features: {
        title: string;
        subtitle: string;
        items: string;
        columns: string;
        layout: string;
        size: string;
    } & WithTypography;
    Testimonials: {
        title: string;
        items: string;
        size: string;
    } & WithTypography;
    CtaBanner: {
        title: string;
        body: string;
        ctaLabel: string;
        ctaHref: string;
        size: string;
    } & WithTypography;
    Hours: {
        title: string;
        rows: string;
        size: string;
    } & WithTypography;
    Contact: {
        title: string;
        showHours: boolean;
        showMapLink: boolean;
        size: string;
    } & WithTypography;
    Footer: {
        note: string;
        links: string;
        columns: string;
        layout: string;
        size: string;
        showSocial: boolean;
        instagram: string;
        facebook: string;
        tiktok: string;
    } & WithTypography;
};

export interface SiteRenderContextValue {
    theme: SiteTheme;
    tenantName: string;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    address?: string | null;
    hours?: string | null;
    tagline?: string | null;
    story?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    telegram?: string | null;
    menuItems: PublicMenuItem[];
}

export const SiteRenderContext = createContext<SiteRenderContextValue>({
    theme: {
        primaryColor: "#e85d04",
        accentColor: "#0f172a",
        backgroundColor: "#fffaf5",
        textColor: "#0f172a",
    },
    tenantName: "Restaurant",
    menuItems: [],
});

let latestSiteRender: SiteRenderContextValue = {
    theme: {
        primaryColor: "#e85d04",
        accentColor: "#0f172a",
        backgroundColor: "#fffaf5",
        textColor: "#0f172a",
    },
    tenantName: "Restaurant",
    menuItems: [],
};

/** Keep a sync snapshot for Puck `render` callbacks (not React components). */
export function bindSiteRender(value: SiteRenderContextValue) {
    latestSiteRender = value;
}

export function useSiteRender() {
    return useContext(SiteRenderContext);
}

function getSiteRender() {
    return latestSiteRender;
}

function formatEtb(amount: number, currency = "ETB") {
    return `${currency} ${amount.toLocaleString("en-ET", {
        maximumFractionDigits: 0,
    })}`;
}

function resolveImage(path?: string | null) {
    if (!path) return "";
    if (
        path.startsWith("http://") ||
        path.startsWith("https://") ||
        path.startsWith("/") ||
        path.startsWith("blob:") ||
        path.startsWith("data:")
    ) {
        return filePublicUrl(path) || path;
    }
    const keyed = (DISH_IMAGES as Record<string, string>)[path];
    return keyed || filePublicUrl(path) || path;
}

const SIZE_OPTIONS = [
    { label: "Compact", value: "sm" },
    { label: "Comfortable", value: "md" },
    { label: "Spacious", value: "lg" },
    { label: "Extra large", value: "xl" },
];

function sectionPadding(size: string) {
    switch (size) {
        case "sm":
            return "px-6 py-8";
        case "lg":
            return "px-6 py-20";
        case "xl":
            return "px-6 py-28";
        default:
            return "px-6 py-14";
    }
}

function headerPadding(size: string) {
    switch (size) {
        case "sm":
            return "px-6 py-2.5";
        case "lg":
            return "px-6 py-5";
        case "xl":
            return "px-6 py-7";
        default:
            return "px-6 py-4";
    }
}

function heroMinHeight(size: string) {
    switch (size) {
        case "sm":
            return "min-h-[42vh]";
        case "lg":
            return "min-h-[78vh]";
        case "xl":
            return "min-h-[90vh]";
        default:
            return "min-h-[62vh]";
    }
}

function menuImageClass(size: string) {
    switch (size) {
        case "sm":
            return "size-14";
        case "lg":
            return "size-24";
        default:
            return "size-20";
    }
}

function parseLines(raw: string) {
    return String(raw || "")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);
}

function parseLinks(raw: string) {
    return parseLines(raw).map(line => {
        const [label, href] = line.split("|").map(s => s.trim());
        return {
            label: label || href,
            href: href || `#${(label || "").toLowerCase()}`,
        };
    });
}

function parseNavLabels(raw: string) {
    return String(raw || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(label => ({
            label,
            href: `#${label.toLowerCase().replace(/\s+/g, "")}`,
        }));
}

function parsePipeRows(raw: string, parts = 2) {
    return parseLines(raw).map(line => {
        const cols = line.split("|").map(s => s.trim());
        while (cols.length < parts) cols.push("");
        return cols;
    });
}

function cleanQuote(raw: string) {
    return String(raw || "")
        .replace(/^[\s"'“”‘’]+/, "")
        .replace(/[\s"'“”‘’]+$/, "")
        .trim();
}

function hexLuminance(hex: string): number {
    const raw = hex.replace("#", "").trim();
    const full =
        raw.length === 3
            ? raw
                  .split("")
                  .map(c => c + c)
                  .join("")
            : raw;
    if (full.length !== 6) return 0.5;
    const r = Number.parseInt(full.slice(0, 2), 16) / 255;
    const g = Number.parseInt(full.slice(2, 4), 16) / 255;
    const b = Number.parseInt(full.slice(4, 6), 16) / 255;
    const lin = (c: number) =>
        c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function isLightColor(hex?: string | null) {
    if (!hex) return false;
    try {
        return hexLuminance(hex) > 0.62;
    } catch {
        return false;
    }
}

/** CTA surfaces that stay readable on both light and dark restaurant themes. */
function pickCtaSurface(theme: {
    primaryColor?: string;
    accentColor?: string;
}) {
    const primary = theme.primaryColor || "#e85d04";
    const accent = theme.accentColor || "#0f172a";
    let bg = primary;
    if (isLightColor(primary)) {
        bg = isLightColor(accent) ? "#0f172a" : accent;
    }
    const text = isLightColor(bg) ? "#0f172a" : "#ffffff";
    const buttonBg = text === "#ffffff" ? "#ffffff" : "#0f172a";
    return { bg, text, buttonBg, buttonText: bg };
}

function softPanelBorder(theme: {
    backgroundColor?: string;
    textColor?: string;
}) {
    const sample = theme.backgroundColor || theme.textColor || "#ffffff";
    return isLightColor(sample)
        ? "rgba(15, 23, 42, 0.10)"
        : "rgba(248, 250, 252, 0.16)";
}

const FINE_DINING_SAMPLE_ITEMS: PublicMenuItem[] = [
    {
        id: "sample-fd-1",
        name: "Wild Morel & Sunchoke Velouté",
        description:
            "Foraged chanterelles, black winter truffle essence, toasted brioche crisp",
        price: 850,
        currencyCode: "ETB",
        categoryId: "prelude",
        categoryName: "First Course",
        soldOut: false,
    },
    {
        id: "sample-fd-2",
        name: "Heirloom Beet & Goat Curd Tartare",
        description:
            "Pickled mustard pearls, candied walnut crumble, herb garden sorrel",
        price: 720,
        currencyCode: "ETB",
        categoryId: "prelude",
        categoryName: "First Course",
        soldOut: false,
    },
    {
        id: "sample-fd-3",
        name: "Pan-Roasted Line-Caught Seabass",
        description:
            "Caramelized fennel purée, golden saffron emulsion, sea asparagus",
        price: 1450,
        currencyCode: "ETB",
        categoryId: "main",
        categoryName: "Principal Selection",
        soldOut: false,
    },
    {
        id: "sample-fd-4",
        name: "Slow-Braised Prime Short Rib",
        description:
            "Smoked bone marrow reduction, pomme mousseline, charred baby leek",
        price: 2100,
        currencyCode: "ETB",
        categoryId: "main",
        categoryName: "Principal Selection",
        soldOut: false,
    },
    {
        id: "sample-fd-5",
        name: "Dark Valrhona Chocolate Crémeux",
        description:
            "Single-origin espresso gelato, smoked salt caramel, cocoa nib tuile",
        price: 680,
        currencyCode: "ETB",
        categoryId: "dessert",
        categoryName: "Dessert & Infusions",
        soldOut: false,
    },
];

function groupMenuItems(items: PublicMenuItem[], categoryFilter: string) {
    const filter = String(categoryFilter || "all")
        .trim()
        .toLowerCase();
    const filtered =
        filter === "all"
            ? items
            : items.filter(item => item.categoryName.toLowerCase() === filter);
    const groups = new Map<string, PublicMenuItem[]>();
    for (const item of filtered) {
        const key = item.categoryName || "Menu";
        const list = groups.get(key) || [];
        list.push(item);
        groups.set(key, list);
    }
    return groups;
}

function MenuItemPrice({
    item,
    color,
}: {
    item: PublicMenuItem;
    color: string;
}) {
    return (
        <p className="shrink-0 text-sm font-normal" style={{ color }}>
            {formatEtb(item.price, item.currencyCode)}
        </p>
    );
}

export const sitePuckConfig = {
    components: {
        Header: {
            label: "Header",
            fields: {
                ...typographyFields(),
                showPhone: {
                    type: "radio",
                    options: [
                        { label: "Show phone", value: true },
                        { label: "Hide phone", value: false },
                    ],
                },
                linksLabel: {
                    type: "text",
                    label: "Nav links (comma separated)",
                },
                navAlign: {
                    type: "select",
                    label: "Nav position",
                    options: [
                        {
                            label: "Split (logo left, links right)",
                            value: "split",
                        },
                        {
                            label: "Logo · center links · CTA",
                            value: "brandCenter",
                        },
                        { label: "Left", value: "left" },
                        { label: "Center", value: "center" },
                        { label: "Right", value: "right" },
                    ],
                },
                ctaLabel: {
                    type: "text",
                    label: "Header CTA (e.g. Book a table)",
                },
                ctaHref: {
                    type: "text",
                    label: "Header CTA link",
                },
                size: {
                    type: "select",
                    label: "Header size",
                    options: SIZE_OPTIONS,
                },
                sticky: {
                    type: "radio",
                    options: [
                        { label: "Sticky", value: true },
                        { label: "Normal", value: false },
                    ],
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                titleSize: "md",
                showPhone: true,
                linksLabel: "Menu,About,Contact",
                navAlign: "split",
                ctaLabel: "",
                ctaHref: "#contact",
                size: "md",
                sticky: true,
            },
            render: props => {
                const {
                    showPhone,
                    linksLabel,
                    navAlign,
                    ctaLabel,
                    ctaHref,
                    size,
                    sticky,
                } = props;
                const ctx = getSiteRender();
                const links = parseNavLabels(linksLabel);
                const align = navAlign || "split";
                const logo = (
                    <div className="flex items-center gap-3">
                        {ctx.theme.logoUrl ? (
                            <img
                                src={resolveImage(ctx.theme.logoUrl)}
                                alt={ctx.tenantName}
                                className="h-10 w-10 rounded-full border border-black/10 object-cover"
                            />
                        ) : (
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-normal text-white"
                                style={{ background: ctx.theme.primaryColor }}
                            >
                                {ctx.tenantName.slice(0, 1)}
                            </div>
                        )}
                        <span
                            className="font-normal tracking-tight"
                            style={titleStyle(props)}
                        >
                            {ctx.tenantName}
                        </span>
                    </div>
                );
                const navLinks = (
                    <nav
                        className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-normal uppercase tracking-[0.2em]"
                        style={bodyStyle(props)}
                    >
                        {links.map(link => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="opacity-70 transition-opacity hover:opacity-100"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                );
                const headerCta = ctaLabel ? (
                    <a
                        href={ctaHref || "#contact"}
                        className="inline-flex rounded-full border px-4 py-2 text-[11px] font-normal uppercase tracking-[0.18em] transition-colors hover:opacity-85"
                        style={{
                            borderColor: ctx.theme.primaryColor,
                            color: ctx.theme.textColor,
                            background: "transparent",
                        }}
                    >
                        {ctaLabel}
                    </a>
                ) : showPhone && ctx.phone ? (
                    <a
                        href={`tel:${ctx.phone}`}
                        className="rounded-full px-3 py-1.5 text-xs font-normal uppercase tracking-[0.14em] text-white"
                        style={{ background: ctx.theme.primaryColor }}
                    >
                        {ctx.phone}
                    </a>
                ) : (
                    <span className="w-24" />
                );

                return (
                    <header
                        className={`${headerPadding(size)} ${
                            sticky ? "sticky top-0 z-20 backdrop-blur-md" : ""
                        }`}
                        style={{
                            background: `${ctx.theme.backgroundColor}f2`,
                            borderBottom: "1px solid rgba(0,0,0,.05)",
                        }}
                    >
                        {align === "brandCenter" ? (
                            <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4">
                                <div className="justify-self-start">{logo}</div>
                                <div className="hidden justify-self-center md:block">
                                    {navLinks}
                                </div>
                                <div className="justify-self-end">
                                    {headerCta}
                                </div>
                                <div className="col-span-3 md:hidden">
                                    {navLinks}
                                </div>
                            </div>
                        ) : align === "split" ? (
                            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                                {logo}
                                <div className="flex items-center gap-4">
                                    {navLinks}
                                    {ctaLabel ? headerCta : null}
                                    {!ctaLabel && showPhone && ctx.phone ? (
                                        <a
                                            href={`tel:${ctx.phone}`}
                                            className="rounded-full px-3 py-1.5 text-sm text-white"
                                            style={{
                                                background:
                                                    ctx.theme.primaryColor,
                                            }}
                                        >
                                            {ctx.phone}
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`mx-auto flex max-w-6xl flex-col gap-3 ${
                                    align === "center"
                                        ? "items-center text-center"
                                        : align === "right"
                                          ? "items-end text-right"
                                          : "items-start"
                                }`}
                            >
                                {logo}
                                {navLinks}
                                {ctaLabel ? headerCta : null}
                            </div>
                        )}
                    </header>
                );
            },
        },
        Hero: {
            label: "Hero",
            fields: {
                ...typographyFields(),
                layout: {
                    type: "select",
                    label: "Arrangement",
                    options: [
                        {
                            label: "Full-bleed image + overlay text",
                            value: "overlay",
                        },
                        {
                            label: "Framed photo + centered title",
                            value: "framed",
                        },
                        { label: "Image left, text right", value: "imageLeft" },
                        {
                            label: "Text left, image right",
                            value: "imageRight",
                        },
                        { label: "Image top, text below", value: "imageTop" },
                        { label: "Text only (no image)", value: "textOnly" },
                    ],
                },
                headline: { type: "text" },
                subheadline: { type: "textarea" },
                ctaLabel: { type: "text", label: "Primary CTA" },
                ctaHref: { type: "text", label: "Primary CTA link" },
                secondaryCtaLabel: { type: "text", label: "Secondary CTA" },
                secondaryCtaHref: { type: "text", label: "Secondary CTA link" },
                imageUrl: {
                    type: "custom",
                    label: "Hero image",
                    render: ({ value, onChange }) => (
                        <ImageUploadField
                            value={String(value || "")}
                            onChange={onChange}
                            label="Hero image"
                        />
                    ),
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
                overlay: {
                    type: "select",
                    label: "Overlay (full-bleed only)",
                    options: [
                        { label: "Soft", value: "soft" },
                        { label: "Medium", value: "medium" },
                        { label: "Strong", value: "strong" },
                    ],
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                titleSize: "2xl",
                bodySize: "lg",
                layout: "overlay",
                headline: "Welcome",
                subheadline: "Fresh plates and warm hospitality.",
                ctaLabel: "View menu",
                ctaHref: "#menu",
                secondaryCtaLabel: "Reserve",
                secondaryCtaHref: "#contact",
                imageUrl: "",
                size: "md",
                overlay: "medium",
            },
            render: props => {
                const ctx = getSiteRender();
                const layout = props.layout || "overlay";
                const bg = resolveImage(props.imageUrl);
                const opacity =
                    props.overlay === "soft"
                        ? 0.2
                        : props.overlay === "strong"
                          ? 0.65
                          : 0.4;

                const softFull = ctx.theme.borderRadius === "full";
                const ctas = (
                    <div className="mt-6 flex flex-wrap gap-3">
                        {props.ctaLabel ? (
                            <a
                                href={props.ctaHref || "#menu"}
                                className={
                                    softFull
                                        ? "inline-flex rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                                        : "inline-flex rounded-full px-6 py-2.5 text-xs font-normal uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                                }
                                style={{
                                    background: softFull
                                        ? ctx.theme.accentColor || "#171717"
                                        : ctx.theme.primaryColor,
                                }}
                            >
                                {props.ctaLabel}
                            </a>
                        ) : null}
                        {props.secondaryCtaLabel ? (
                            <a
                                href={props.secondaryCtaHref || "#contact"}
                                className={
                                    softFull
                                        ? "inline-flex rounded-full border border-neutral-900/15 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-90"
                                        : "inline-flex rounded-full border border-current/25 px-6 py-2.5 text-xs font-normal uppercase tracking-[0.18em] transition-opacity hover:opacity-90"
                                }
                            >
                                {props.secondaryCtaLabel}
                            </a>
                        ) : null}
                    </div>
                );

                const copy = (
                    <div className="max-w-xl">
                        <h1
                            className="font-normal tracking-tight"
                            style={titleStyle(props)}
                        >
                            {props.headline}
                        </h1>
                        <p className="mt-3 opacity-85" style={bodyStyle(props)}>
                            {props.subheadline}
                        </p>
                        {ctas}
                    </div>
                );

                if (layout === "overlay") {
                    return (
                        <section
                            className={`relative flex items-end overflow-hidden ${heroMinHeight(props.size)} ${sectionPadding(props.size)}`}
                            style={{
                                background: bg
                                    ? `linear-gradient(180deg, rgba(0,0,0,${opacity * 0.5}), rgba(0,0,0,${opacity})), url(${bg}) center/cover`
                                    : `linear-gradient(135deg, ${ctx.theme.primaryColor}, ${ctx.theme.accentColor})`,
                                color: "#fff",
                            }}
                        >
                            <div className="relative z-10 mx-auto w-full max-w-6xl">
                                {copy}
                            </div>
                        </section>
                    );
                }

                if (layout === "framed") {
                    return (
                        <section
                            className="px-4 pb-6 pt-2 sm:px-6 lg:px-8"
                            style={{ background: ctx.theme.backgroundColor }}
                        >
                            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-black/10 sm:rounded-3xl">
                                <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
                                    {bg ? (
                                        <img
                                            src={bg}
                                            alt=""
                                            className="absolute inset-0 size-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${ctx.theme.primaryColor}, ${ctx.theme.accentColor})`,
                                            }}
                                        />
                                    )}
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background: `linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,${0.4 + opacity * 0.35}) 100%)`,
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                                        <span className="mb-3 text-[10px] font-normal uppercase tracking-[0.25em] opacity-80 sm:text-[11px]">
                                            Cuisine & Hospitality
                                        </span>
                                        <h1
                                            className="max-w-4xl text-3xl font-normal leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl"
                                            style={{
                                                ...titleStyle(props),
                                                color: "#fff",
                                                fontFamily:
                                                    "var(--site-font-display)",
                                                fontWeight: 400,
                                            }}
                                        >
                                            {props.headline}
                                        </h1>
                                        {props.subheadline ? (
                                            <p
                                                className="mt-4 max-w-xl text-sm font-normal opacity-90 sm:text-base"
                                                style={{
                                                    ...bodyStyle(props),
                                                    color: "#fff",
                                                    fontWeight: 400,
                                                }}
                                            >
                                                {props.subheadline}
                                            </p>
                                        ) : null}
                                        {(props.ctaLabel ||
                                            props.secondaryCtaLabel) && (
                                            <div className="mt-7 flex flex-wrap justify-center gap-3">
                                                {props.ctaLabel ? (
                                                    <a
                                                        href={
                                                            props.ctaHref ||
                                                            "#menu"
                                                        }
                                                        className="inline-flex rounded-full px-6 py-2.5 text-xs font-normal uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                                                        style={{
                                                            background:
                                                                ctx.theme
                                                                    .primaryColor,
                                                        }}
                                                    >
                                                        {props.ctaLabel}
                                                    </a>
                                                ) : null}
                                                {props.secondaryCtaLabel ? (
                                                    <a
                                                        href={
                                                            props.secondaryCtaHref ||
                                                            "#contact"
                                                        }
                                                        className="inline-flex rounded-full border border-white/70 px-6 py-2.5 text-xs font-normal uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                                                    >
                                                        {
                                                            props.secondaryCtaLabel
                                                        }
                                                    </a>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    );
                }

                if (layout === "textOnly") {
                    return (
                        <section
                            className={`${sectionPadding(props.size)} ${heroMinHeight("sm")}`}
                            style={{
                                background: `linear-gradient(135deg, ${ctx.theme.primaryColor}14, transparent)`,
                            }}
                        >
                            <div className="mx-auto flex max-w-6xl items-center">
                                {copy}
                            </div>
                        </section>
                    );
                }

                if (layout === "imageTop") {
                    return (
                        <section className={sectionPadding(props.size)}>
                            <div className="mx-auto max-w-6xl space-y-6">
                                {bg ? (
                                    <img
                                        src={bg}
                                        alt=""
                                        className="aspect-[21/9] w-full rounded-3xl object-cover"
                                    />
                                ) : null}
                                {copy}
                            </div>
                        </section>
                    );
                }

                const imageFirst = layout === "imageLeft";
                const radius =
                    ctx.theme.borderRadius === "none"
                        ? "rounded-none"
                        : ctx.theme.borderRadius === "full"
                          ? "rounded-[2.5rem] sm:rounded-[3rem]"
                          : "rounded-3xl";
                return (
                    <section
                        className={`relative overflow-hidden ${sectionPadding(props.size)}`}
                        style={{
                            background: `radial-gradient(ellipse 70% 80% at 85% 40%, ${ctx.theme.primaryColor}22 0%, transparent 55%), ${ctx.theme.backgroundColor}`,
                        }}
                    >
                        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
                            <div className={imageFirst ? "order-2" : "order-1"}>
                                {copy}
                            </div>
                            <div
                                className={`relative ${imageFirst ? "order-1" : "order-2"}`}
                            >
                                {bg ? (
                                    <div
                                        className={`relative overflow-hidden ${radius} shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]`}
                                    >
                                        <img
                                            src={bg}
                                            alt=""
                                            className="aspect-[4/5] w-full object-cover sm:aspect-[5/4]"
                                        />
                                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-neutral-900">
                                                    {ctx.tenantName}
                                                </p>
                                                <p className="truncate text-[11px] text-neutral-500">
                                                    {ctx.tagline ||
                                                        "House favorite"}
                                                </p>
                                            </div>
                                            <span
                                                className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white"
                                                style={{
                                                    background:
                                                        ctx.theme.primaryColor,
                                                }}
                                            >
                                                Featured
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`flex aspect-[5/4] items-center justify-center text-sm text-white ${radius}`}
                                        style={{
                                            background: ctx.theme.primaryColor,
                                        }}
                                    >
                                        Upload a hero image
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                );
            },
        },
        Menu: {
            label: "Menu",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                subtitle: { type: "text" },
                categoryFilter: {
                    type: "text",
                    label: 'Category filter ("all" or category name)',
                },
                layout: {
                    type: "select",
                    label: "Menu arrangement",
                    options: [
                        {
                            label: "Editorial tasting courses",
                            value: "editorial",
                        },
                        { label: "Image cards grid", value: "cards" },
                        { label: "Classic list", value: "list" },
                        { label: "Featured + grid", value: "featured" },
                        { label: "Compact chips", value: "compact" },
                        { label: "Magazine (2-col story)", value: "magazine" },
                    ],
                },
                columns: {
                    type: "select",
                    label: "Grid columns",
                    options: [
                        { label: "2", value: "2" },
                        { label: "3", value: "3" },
                        { label: "4", value: "4" },
                    ],
                },
                showImages: {
                    type: "radio",
                    options: [
                        { label: "Show images", value: true },
                        { label: "Hide images", value: false },
                    ],
                },
                imageSize: {
                    type: "select",
                    label: "List image size",
                    options: [
                        { label: "Small", value: "sm" },
                        { label: "Medium", value: "md" },
                        { label: "Large", value: "lg" },
                    ],
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Our menu",
                subtitle: "From the kitchen",
                categoryFilter: "all",
                layout: "cards",
                columns: "3",
                showImages: true,
                imageSize: "md",
                size: "md",
            },
            render: ({
                title,
                subtitle,
                categoryFilter,
                layout,
                columns,
                showImages,
                imageSize,
                size,
            }) => {
                const ctx = getSiteRender();
                const rawItems =
                    ctx.menuItems && ctx.menuItems.length > 0
                        ? ctx.menuItems
                        : FINE_DINING_SAMPLE_ITEMS;
                const groups = groupMenuItems(rawItems, categoryFilter);
                const allItems = [...groups.values()].flat();
                const gridCols =
                    columns === "2"
                        ? "sm:grid-cols-2"
                        : columns === "4"
                          ? "sm:grid-cols-2 lg:grid-cols-4"
                          : "sm:grid-cols-2 lg:grid-cols-3";

                return (
                    <section id="menu" className={sectionPadding(size)}>
                        <div className="mx-auto max-w-6xl">
                            <h2
                                className="text-3xl font-normal tracking-tight"
                                style={{
                                    fontFamily: "var(--site-font-display)",
                                }}
                            >
                                {title}
                            </h2>
                            {subtitle ? (
                                <p className="mt-2 text-sm opacity-70">
                                    {subtitle}
                                </p>
                            ) : null}

                            {layout === "editorial" && (
                                <div className="mt-12 space-y-16">
                                    {[...groups.entries()].map(
                                        ([category, rows], catIndex) => (
                                            <div
                                                key={category}
                                                className="border-t border-black/10 pt-8"
                                            >
                                                <div className="mb-8 flex flex-col items-center text-center">
                                                    <p className="text-[11px] font-normal uppercase tracking-[0.25em] opacity-50">
                                                        {`Course ${String(catIndex + 1).padStart(2, "0")}`}
                                                    </p>
                                                    <h3
                                                        className="mt-2 text-2xl font-normal tracking-tight"
                                                        style={{
                                                            fontFamily:
                                                                "var(--site-font-display)",
                                                        }}
                                                    >
                                                        {category}
                                                    </h3>
                                                </div>
                                                <div className="mx-auto max-w-3xl divide-y divide-black/10">
                                                    {rows.map(item => (
                                                        <div
                                                            key={item.id}
                                                            className="py-6 transition-colors"
                                                        >
                                                            <div className="flex items-baseline justify-between gap-6">
                                                                <h4
                                                                    className="text-lg font-normal tracking-tight sm:text-xl"
                                                                    style={{
                                                                        fontFamily:
                                                                            "var(--site-font-display)",
                                                                    }}
                                                                >
                                                                    {item.name}
                                                                </h4>
                                                                <div className="h-px flex-1 border-b border-dotted border-black/20" />
                                                                <span className="shrink-0 text-sm font-normal tracking-wider opacity-80">
                                                                    {formatEtb(
                                                                        item.price,
                                                                        item.currencyCode,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {item.description ? (
                                                                <p className="mt-2 text-sm font-normal italic leading-relaxed opacity-70">
                                                                    {
                                                                        item.description
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                    <div className="border-t border-black/10 pt-8 text-center">
                                        <p className="text-xs font-normal italic tracking-wide opacity-60">
                                            Optional Sommelier Wine Pairing
                                            available · Tasting progression
                                            takes approximately 2.5 hours
                                        </p>
                                    </div>
                                </div>
                            )}

                            {layout === "featured" && allItems[0] ? (
                                <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                                    <article className="overflow-hidden rounded-2xl border border-black/10">
                                        {showImages &&
                                        resolveImage(allItems[0].imageUrl) ? (
                                            <img
                                                src={resolveImage(
                                                    allItems[0].imageUrl,
                                                )}
                                                alt={allItems[0].name}
                                                className="aspect-[16/10] w-full object-cover"
                                            />
                                        ) : null}
                                        <div className="p-5">
                                            <p className="text-xs font-normal uppercase tracking-[0.18em] opacity-50">
                                                Featured
                                            </p>
                                            <div className="mt-2 flex items-start justify-between gap-3">
                                                <h3 className="text-xl font-normal">
                                                    {allItems[0].name}
                                                </h3>
                                                <MenuItemPrice
                                                    item={allItems[0]}
                                                    color={
                                                        ctx.theme.primaryColor
                                                    }
                                                />
                                            </div>
                                            {allItems[0].description ? (
                                                <p className="mt-2 text-sm font-normal opacity-70">
                                                    {allItems[0].description}
                                                </p>
                                            ) : null}
                                        </div>
                                    </article>
                                    <ul className="space-y-3">
                                        {allItems.slice(1, 6).map(item => (
                                            <li
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 px-4 py-3"
                                            >
                                                <span className="font-normal">
                                                    {item.name}
                                                </span>
                                                <MenuItemPrice
                                                    item={item}
                                                    color={
                                                        ctx.theme.primaryColor
                                                    }
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {layout === "compact" ? (
                                <div className="mt-8 flex flex-wrap gap-2">
                                    {allItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-sm"
                                        >
                                            <span className="font-normal">
                                                {item.name}
                                            </span>
                                            <span
                                                className="font-normal"
                                                style={{
                                                    color: ctx.theme
                                                        .primaryColor,
                                                }}
                                            >
                                                {formatEtb(
                                                    item.price,
                                                    item.currencyCode,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {layout === "magazine" ? (
                                <div className="mt-8 grid gap-6 md:grid-cols-2">
                                    {allItems.map(item => {
                                        const img = showImages
                                            ? resolveImage(item.imageUrl)
                                            : "";
                                        return (
                                            <article
                                                key={item.id}
                                                className="grid gap-4 sm:grid-cols-[140px_1fr]"
                                            >
                                                {img ? (
                                                    <img
                                                        src={img}
                                                        alt={item.name}
                                                        className="aspect-square w-full rounded-2xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="aspect-square rounded-2xl bg-black/5" />
                                                )}
                                                <div>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="font-normal">
                                                            {item.name}
                                                        </h3>
                                                        <MenuItemPrice
                                                            item={item}
                                                            color={
                                                                ctx.theme
                                                                    .primaryColor
                                                            }
                                                        />
                                                    </div>
                                                    {item.description ? (
                                                        <p className="mt-2 text-sm font-normal opacity-70">
                                                            {item.description}
                                                        </p>
                                                    ) : null}
                                                    <p className="mt-2 text-xs font-normal uppercase tracking-[0.16em] opacity-50">
                                                        {item.categoryName}
                                                    </p>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : null}

                            {(layout === "cards" || layout === "list") && (
                                <div className="mt-8 space-y-10">
                                    {[...groups.entries()].map(
                                        ([category, rows]) => (
                                            <div key={category}>
                                                <h3 className="mb-4 text-xs font-normal uppercase tracking-[0.2em] opacity-60">
                                                    {category}
                                                </h3>
                                                {layout === "cards" ? (
                                                    <ul
                                                        className={`grid gap-4 ${gridCols}`}
                                                    >
                                                        {rows.map(item => {
                                                            const img =
                                                                showImages
                                                                    ? resolveImage(
                                                                          item.imageUrl,
                                                                      )
                                                                    : "";
                                                            return (
                                                                <li
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="overflow-hidden rounded-2xl border border-black/10 bg-white/40"
                                                                >
                                                                    {img ? (
                                                                        <img
                                                                            src={
                                                                                img
                                                                            }
                                                                            alt={
                                                                                item.name
                                                                            }
                                                                            className="aspect-[4/3] w-full object-cover"
                                                                        />
                                                                    ) : null}
                                                                    <div className="p-4">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <p className="font-normal">
                                                                                {
                                                                                    item.name
                                                                                }
                                                                            </p>
                                                                            <MenuItemPrice
                                                                                item={
                                                                                    item
                                                                                }
                                                                                color={
                                                                                    ctx
                                                                                        .theme
                                                                                        .primaryColor
                                                                                }
                                                                            />
                                                                        </div>
                                                                        {item.description ? (
                                                                            <p className="mt-1 text-sm font-normal opacity-65">
                                                                                {
                                                                                    item.description
                                                                                }
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <ul className="space-y-3">
                                                        {rows.map(item => {
                                                            const img =
                                                                showImages
                                                                    ? resolveImage(
                                                                          item.imageUrl,
                                                                      )
                                                                    : "";
                                                            return (
                                                                <li
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="flex items-start gap-4 border-b border-black/10 pb-3"
                                                                >
                                                                    {img ? (
                                                                        <img
                                                                            src={
                                                                                img
                                                                            }
                                                                            alt={
                                                                                item.name
                                                                            }
                                                                            className={`${menuImageClass(imageSize)} shrink-0 rounded-xl object-cover`}
                                                                        />
                                                                    ) : null}
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <p className="font-normal">
                                                                                {
                                                                                    item.name
                                                                                }
                                                                            </p>
                                                                            <MenuItemPrice
                                                                                item={
                                                                                    item
                                                                                }
                                                                                color={
                                                                                    ctx
                                                                                        .theme
                                                                                        .primaryColor
                                                                                }
                                                                            />
                                                                        </div>
                                                                        {item.description ? (
                                                                            <p className="mt-1 text-sm font-normal opacity-65">
                                                                                {
                                                                                    item.description
                                                                                }
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}

                            {groups.size === 0 ? (
                                <p className="mt-8 text-sm opacity-60">
                                    Menu items will appear here after you add
                                    them in the catalog.
                                </p>
                            ) : null}
                        </div>
                    </section>
                );
            },
        },
        About: {
            label: "About",
            fields: {
                ...typographyFields(),
                layout: {
                    type: "select",
                    label: "About arrangement",
                    options: [
                        { label: "Text only", value: "text" },
                        { label: "Image left + text", value: "imageLeft" },
                        { label: "Text left + image", value: "imageRight" },
                        { label: "Text + stats row", value: "stats" },
                    ],
                },
                title: { type: "text" },
                body: { type: "textarea" },
                imageUrl: {
                    type: "custom",
                    render: ({ value, onChange }) => (
                        <ImageUploadField
                            value={String(value || "")}
                            onChange={onChange}
                            label="About image"
                        />
                    ),
                },
                stats: {
                    type: "textarea",
                    label: "Stats (one per line: Label|Value)",
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                layout: "imageRight",
                title: "Our story",
                body: "A place for gathering.",
                imageUrl: "",
                stats: "Years|12\nDishes|80+\nGuests daily|300",
                size: "md",
            },
            render: ({ layout, title, body, imageUrl, stats, size }) => {
                const img = resolveImage(imageUrl);
                const rows = parsePipeRows(stats, 2);
                const copy = (
                    <div>
                        <h2
                            className="text-3xl font-normal tracking-tight"
                            style={{ fontFamily: "var(--site-font-display)" }}
                        >
                            {title}
                        </h2>
                        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed opacity-80">
                            {body}
                        </p>
                        {layout === "stats" && rows.length > 0 ? (
                            <div className="mt-8 grid grid-cols-3 gap-4">
                                {rows.map(([label, value]) => (
                                    <div key={`${label}-${value}`}>
                                        <p className="text-2xl font-normal">
                                            {value}
                                        </p>
                                        <p className="text-xs font-normal uppercase tracking-[0.16em] opacity-55">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                );

                if (layout === "text" || layout === "stats" || !img) {
                    return (
                        <section id="about" className={sectionPadding(size)}>
                            <div className="mx-auto max-w-3xl">{copy}</div>
                        </section>
                    );
                }

                const imageFirst = layout === "imageLeft";
                return (
                    <section id="about" className={sectionPadding(size)}>
                        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
                            <div className={imageFirst ? "order-2" : "order-1"}>
                                {copy}
                            </div>
                            <div className={imageFirst ? "order-1" : "order-2"}>
                                <img
                                    src={img}
                                    alt=""
                                    className="aspect-[4/5] w-full rounded-2xl border border-black/10 object-cover"
                                />
                            </div>
                        </div>
                    </section>
                );
            },
        },
        Gallery: {
            label: "Gallery",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                imageUrls: {
                    type: "custom",
                    render: ({ value, onChange }) => (
                        <GalleryUploadField
                            value={String(value || "")}
                            onChange={onChange}
                        />
                    ),
                },
                columns: {
                    type: "select",
                    label: "Columns",
                    options: [
                        { label: "2", value: "2" },
                        { label: "3", value: "3" },
                        { label: "4", value: "4" },
                    ],
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Gallery",
                imageUrls: "",
                columns: "3",
                size: "md",
            },
            render: ({ title, imageUrls, columns, size }) => {
                const urls = parseLines(imageUrls).map(resolveImage);
                const cols =
                    columns === "2"
                        ? "sm:grid-cols-2"
                        : columns === "4"
                          ? "sm:grid-cols-2 lg:grid-cols-4"
                          : "sm:grid-cols-3";
                return (
                    <section className={sectionPadding(size)}>
                        <div className="mx-auto max-w-6xl">
                            <h2
                                className="text-3xl font-normal tracking-tight"
                                style={{
                                    fontFamily: "var(--site-font-display)",
                                }}
                            >
                                {title}
                            </h2>
                            <div className={`mt-6 grid gap-3 ${cols}`}>
                                {urls.map(url => (
                                    <img
                                        key={url}
                                        src={url}
                                        alt=""
                                        className="aspect-[4/3] w-full rounded-2xl border border-black/10 object-cover"
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                );
            },
        },
        Arrangement: {
            label: "Arrangement (pebble cards)",
            fields: {
                ...typographyFields(),
                title: { type: "text", label: "Optional title" },
                imageUrls: {
                    type: "custom",
                    label: "Images (use 3–4)",
                    render: ({ value, onChange }) => (
                        <GalleryUploadField
                            value={String(value || "")}
                            onChange={onChange}
                        />
                    ),
                },
                warmTitle: { type: "text", label: "Warm card title" },
                warmBody: { type: "textarea", label: "Warm card body" },
                warmCtaLabel: { type: "text", label: "Warm CTA" },
                warmCtaHref: { type: "text", label: "Warm CTA link" },
                darkTitle: { type: "text", label: "Dark card title" },
                darkBody: { type: "textarea", label: "Dark card body" },
                darkCtaLabel: { type: "text", label: "Dark CTA" },
                darkCtaHref: { type: "text", label: "Dark CTA link" },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "",
                imageUrls: "",
                warmTitle: "Taste the season",
                warmBody:
                    "Bright plates and soft lighting for unhurried meals.",
                warmCtaLabel: "See menu",
                warmCtaHref: "#menu",
                darkTitle: "Reserve tonight",
                darkBody: "Ask for a patio table or a quiet corner inside.",
                darkCtaLabel: "Contact",
                darkCtaHref: "#contact",
                size: "md",
            },
            render: ({
                title,
                imageUrls,
                warmTitle,
                warmBody,
                warmCtaLabel,
                warmCtaHref,
                darkTitle,
                darkBody,
                darkCtaLabel,
                darkCtaHref,
                size,
            }) => {
                const ctx = getSiteRender();
                const urls = parseLines(imageUrls)
                    .map(resolveImage)
                    .filter(Boolean);
                const fallbacks = Object.values(DISH_IMAGES);
                const [a, b, c, d] = [
                    urls[0] || fallbacks[0],
                    urls[1] || fallbacks[1],
                    urls[2] || fallbacks[2],
                    urls[3] || fallbacks[3],
                ];
                const pebble = "rounded-[2rem] sm:rounded-[2.5rem]";
                return (
                    <section className={sectionPadding(size)}>
                        <div className="mx-auto max-w-6xl">
                            {title?.trim() ? (
                                <h2
                                    className="mb-8 text-3xl font-semibold tracking-tight"
                                    style={{
                                        fontFamily: "var(--site-font-display)",
                                    }}
                                >
                                    {title}
                                </h2>
                            ) : null}
                            <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
                                <div
                                    className={`relative min-h-[280px] overflow-hidden lg:col-span-5 lg:row-span-2 ${pebble}`}
                                >
                                    <img
                                        src={a}
                                        alt=""
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                </div>
                                <div
                                    className={`relative min-h-[160px] overflow-hidden lg:col-span-3 ${pebble}`}
                                >
                                    <img
                                        src={b}
                                        alt=""
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                </div>
                                <div
                                    className={`flex flex-col justify-between p-6 lg:col-span-4 ${pebble}`}
                                    style={{
                                        background: `${ctx.theme.primaryColor}22`,
                                    }}
                                >
                                    <div>
                                        <h3
                                            className="text-xl font-semibold tracking-tight"
                                            style={{
                                                fontFamily:
                                                    "var(--site-font-display)",
                                            }}
                                        >
                                            {warmTitle}
                                        </h3>
                                        <p className="mt-2 text-sm opacity-70">
                                            {warmBody}
                                        </p>
                                    </div>
                                    {warmCtaLabel ? (
                                        <a
                                            href={warmCtaHref || "#menu"}
                                            className="mt-5 inline-flex w-fit rounded-full bg-neutral-900 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white"
                                        >
                                            {warmCtaLabel}
                                        </a>
                                    ) : null}
                                </div>
                                <div
                                    className={`flex flex-col justify-between p-6 text-white lg:col-span-4 ${pebble}`}
                                    style={{
                                        background: `linear-gradient(135deg, #171717 0%, ${ctx.theme.primaryColor} 140%)`,
                                    }}
                                >
                                    <div>
                                        <h3
                                            className="text-xl font-semibold tracking-tight"
                                            style={{
                                                fontFamily:
                                                    "var(--site-font-display)",
                                            }}
                                        >
                                            {darkTitle}
                                        </h3>
                                        <p className="mt-2 text-sm opacity-80">
                                            {darkBody}
                                        </p>
                                    </div>
                                    {darkCtaLabel ? (
                                        <a
                                            href={darkCtaHref || "#contact"}
                                            className="mt-5 inline-flex w-fit rounded-full px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white"
                                            style={{
                                                background:
                                                    ctx.theme.primaryColor,
                                            }}
                                        >
                                            {darkCtaLabel}
                                        </a>
                                    ) : null}
                                </div>
                                <div
                                    className={`relative min-h-[160px] overflow-hidden lg:col-span-3 ${pebble}`}
                                >
                                    <img
                                        src={c}
                                        alt=""
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                    {d ? (
                                        <img
                                            src={d}
                                            alt=""
                                            className="absolute bottom-3 right-3 size-16 rounded-2xl border-2 border-white object-cover shadow-md sm:size-20"
                                        />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </section>
                );
            },
        },
        Carousel: {
            label: "Carousel",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                variant: {
                    type: "select",
                    label: "Carousel UI",
                    options: [
                        { label: "Fade crossfade", value: "fade" },
                        { label: "Horizontal slide", value: "slide" },
                        { label: "Peek cards (scroll)", value: "cards" },
                        { label: "Filmstrip + thumbs", value: "filmstrip" },
                        { label: "Caption overlay card", value: "captions" },
                        { label: "Coverflow 3-up", value: "coverflow" },
                    ],
                },
                imageUrls: {
                    type: "custom",
                    render: ({ value, onChange }) => (
                        <GalleryUploadField
                            value={String(value || "")}
                            onChange={onChange}
                        />
                    ),
                },
                captions: {
                    type: "textarea",
                    label: "Captions (one per line, same order as images)",
                },
                height: {
                    type: "select",
                    label: "Height",
                    options: [
                        { label: "Short", value: "sm" },
                        { label: "Medium", value: "md" },
                        { label: "Tall", value: "lg" },
                    ],
                },
                interval: {
                    type: "select",
                    label: "Autoplay speed",
                    options: [
                        { label: "Off (manual)", value: "0" },
                        { label: "3s", value: "3000" },
                        { label: "4.5s", value: "4500" },
                        { label: "6s", value: "6000" },
                    ],
                },
                showArrows: {
                    type: "radio",
                    options: [
                        { label: "Show arrows", value: true },
                        { label: "Hide arrows", value: false },
                    ],
                },
                showDots: {
                    type: "radio",
                    options: [
                        { label: "Show dots", value: true },
                        { label: "Hide dots", value: false },
                    ],
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Moments",
                variant: "slide",
                imageUrls: "",
                captions: "",
                height: "md",
                interval: "4500",
                showArrows: true,
                showDots: true,
                size: "md",
            },
            render: props => {
                const {
                    title,
                    imageUrls,
                    captions,
                    variant,
                    height,
                    interval,
                    showArrows,
                    showDots,
                    size,
                } = props;
                const ctx = getSiteRender();
                const urls = parseLines(imageUrls).map(resolveImage);
                const captionList = parseLines(captions);
                const heightClass =
                    height === "sm"
                        ? "h-[280px]"
                        : height === "lg"
                          ? "h-[560px]"
                          : "h-[420px]";
                const intervalMs =
                    interval === "0" ? 999999999 : Number(interval) || 4500;
                return (
                    <section className={sectionPadding(size)}>
                        <div className="mx-auto max-w-6xl">
                            {title ? (
                                <h2
                                    className="mb-6 font-normal tracking-tight"
                                    style={titleStyle(props)}
                                >
                                    {title}
                                </h2>
                            ) : null}
                            <SiteCarousel
                                images={urls}
                                captions={captionList}
                                variant={
                                    (variant as
                                        | "fade"
                                        | "slide"
                                        | "cards"
                                        | "filmstrip"
                                        | "captions"
                                        | "coverflow") || "slide"
                                }
                                heightClass={heightClass}
                                intervalMs={intervalMs}
                                showArrows={showArrows !== false}
                                showDots={showDots !== false}
                                accentColor={ctx.theme.primaryColor}
                            />
                        </div>
                    </section>
                );
            },
        },
        Features: {
            label: "Features",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                subtitle: { type: "text" },
                items: {
                    type: "textarea",
                    label: "Features (one per line: Title|Description)",
                },
                layout: {
                    type: "select",
                    label: "Layout",
                    options: [
                        { label: "Cards grid", value: "cards" },
                        {
                            label: "Pill bar (standalone strip)",
                            value: "pillBar",
                        },
                    ],
                },
                columns: {
                    type: "select",
                    options: [
                        { label: "2", value: "2" },
                        { label: "3", value: "3" },
                        { label: "4", value: "4" },
                    ],
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Why guests return",
                subtitle: "Hospitality, flavor, and pace.",
                items: "Fresh daily|Ingredients sourced every morning\nFast service|From table to kitchen in minutes\nVerified pay|Secure transfer payment proof",
                layout: "cards",
                columns: "3",
                size: "md",
            },
            render: props => {
                const {
                    title,
                    subtitle,
                    items,
                    columns,
                    layout = "cards",
                    size,
                } = props;
                const sectionId =
                    "id" in props && typeof props.id === "string"
                        ? props.id
                        : undefined;
                const ctx = getSiteRender();
                const rows = parsePipeRows(items, 2);
                const border = softPanelBorder(ctx.theme);
                const cols =
                    columns === "2"
                        ? "sm:grid-cols-2"
                        : columns === "4"
                          ? "sm:grid-cols-2 lg:grid-cols-4"
                          : "sm:grid-cols-3";
                const pastel = [
                    "rgba(220, 252, 231, 0.85)",
                    "rgba(254, 243, 199, 0.9)",
                    "rgba(255, 237, 213, 0.95)",
                    "rgba(252, 231, 243, 0.9)",
                    "rgba(237, 233, 254, 0.9)",
                ];
                const rounded =
                    ctx.theme.borderRadius === "none"
                        ? "rounded-xl"
                        : ctx.theme.borderRadius === "full"
                          ? "rounded-[2rem]"
                          : "rounded-2xl";
                const isPerkStrip = columns === "4" && !title?.trim();

                if (layout === "pillBar") {
                    const thumbs = Object.values(DISH_IMAGES);
                    return (
                        <section
                            id={sectionId}
                            className={sectionPadding(size)}
                        >
                            <div className="mx-auto max-w-6xl">
                                <div
                                    className="flex flex-col gap-4 rounded-full px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-6"
                                    style={{
                                        background: `linear-gradient(90deg, #171717 0%, ${ctx.theme.primaryColor} 100%)`,
                                    }}
                                >
                                    {rows
                                        .slice(0, 4)
                                        .map(([heading, desc], i) => (
                                            <div
                                                key={`${heading}-${desc}`}
                                                className="flex min-w-0 flex-1 items-center gap-3 text-white"
                                            >
                                                <img
                                                    src={
                                                        thumbs[
                                                            i % thumbs.length
                                                        ]
                                                    }
                                                    alt=""
                                                    className="size-11 shrink-0 rounded-full object-cover ring-2 ring-white/30"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {heading}
                                                    </p>
                                                    <p className="truncate text-[11px] opacity-75">
                                                        {desc}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </section>
                    );
                }

                return (
                    <section id={sectionId} className={sectionPadding(size)}>
                        <div className="mx-auto max-w-6xl">
                            {title?.trim() ? (
                                <h2
                                    className="text-3xl font-normal tracking-tight"
                                    style={{
                                        fontFamily: "var(--site-font-display)",
                                    }}
                                >
                                    {title}
                                </h2>
                            ) : null}
                            {subtitle ? (
                                <p className="mt-2 text-sm opacity-70">
                                    {subtitle}
                                </p>
                            ) : null}
                            <div
                                className={`grid gap-4 ${cols} ${title?.trim() ? "mt-8" : ""}`}
                            >
                                {rows.map(([heading, desc], index) => (
                                    <div
                                        key={`${heading}-${desc}`}
                                        className={`${rounded} p-5 ${isPerkStrip ? "border border-black/5 bg-white shadow-sm" : ""}`}
                                        style={
                                            isPerkStrip
                                                ? undefined
                                                : {
                                                      border: `1px solid ${border}`,
                                                      background: isLightColor(
                                                          ctx.theme
                                                              .backgroundColor,
                                                      )
                                                          ? pastel[
                                                                index %
                                                                    pastel.length
                                                            ]
                                                          : "rgba(255,255,255,0.06)",
                                                  }
                                        }
                                    >
                                        {!isPerkStrip ? (
                                            <div
                                                className="mb-3 flex size-10 items-center justify-center rounded-full text-sm font-medium text-white"
                                                style={{
                                                    background:
                                                        ctx.theme.primaryColor,
                                                }}
                                            >
                                                {heading.slice(0, 1)}
                                            </div>
                                        ) : (
                                            <div
                                                className="mb-3 h-1.5 w-10 rounded-full"
                                                style={{
                                                    background:
                                                        ctx.theme.primaryColor,
                                                }}
                                            />
                                        )}
                                        <h3 className="font-medium">
                                            {heading}
                                        </h3>
                                        <p className="mt-2 text-sm opacity-70">
                                            {desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            },
        },
        Testimonials: {
            label: "Testimonials",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                items: {
                    type: "textarea",
                    label: "Quotes (one per line: Quote|Name)",
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Guest love",
                items: "Best tibs in Bole.|Hiwot\nPerfect for family dinners.|Dawit\nService feels personal every time.|Sara",
                size: "md",
            },
            render: ({ title, items, size }) => {
                const ctx = getSiteRender();
                const rows = parsePipeRows(items, 2);
                const border = softPanelBorder(ctx.theme);
                return (
                    <section className={sectionPadding(size)}>
                        <div className="mx-auto max-w-6xl">
                            <h2
                                className="text-3xl font-normal tracking-tight"
                                style={{
                                    fontFamily: "var(--site-font-display)",
                                }}
                            >
                                {title}
                            </h2>
                            <div className="mt-8 grid gap-4 md:grid-cols-3">
                                {rows.map(([quote, name]) => (
                                    <blockquote
                                        key={`${quote}-${name}`}
                                        className="rounded-2xl p-5"
                                        style={{
                                            border: `1px solid ${border}`,
                                            background: isLightColor(
                                                ctx.theme.backgroundColor,
                                            )
                                                ? "rgba(15,23,42,0.03)"
                                                : "rgba(255,255,255,0.06)",
                                        }}
                                    >
                                        <p className="text-sm font-normal italic leading-relaxed opacity-85">
                                            “{cleanQuote(quote)}”
                                        </p>
                                        <footer className="mt-4 text-xs font-normal uppercase tracking-[0.16em] opacity-55">
                                            {name}
                                        </footer>
                                    </blockquote>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            },
        },
        CtaBanner: {
            label: "CTA Banner",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                body: { type: "textarea" },
                ctaLabel: { type: "text" },
                ctaHref: { type: "text" },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Ready tonight?",
                body: "Walk in or call ahead — we keep tables moving.",
                ctaLabel: "Call us",
                ctaHref: "tel:",
                size: "md",
            },
            render: ({ title, body, ctaLabel, ctaHref, size }) => {
                const ctx = getSiteRender();
                const href =
                    ctaHref === "tel:" && ctx.phone
                        ? `tel:${ctx.phone}`
                        : ctaHref || "#contact";
                const surface = pickCtaSurface(ctx.theme);
                return (
                    <section className={sectionPadding(size)}>
                        <div
                            className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl border border-black/10 px-8 py-10 md:flex-row md:items-center"
                            style={{
                                background: surface.bg,
                                color: surface.text,
                            }}
                        >
                            <div>
                                <h2
                                    className="text-3xl font-normal tracking-tight"
                                    style={{
                                        fontFamily: "var(--site-font-display)",
                                        color: surface.text,
                                    }}
                                >
                                    {title}
                                </h2>
                                <p
                                    className="mt-2 max-w-xl text-sm font-normal opacity-90"
                                    style={{ color: surface.text }}
                                >
                                    {body}
                                </p>
                            </div>
                            {ctaLabel ? (
                                <a
                                    href={href}
                                    className="inline-flex rounded-full px-6 py-2.5 text-xs font-normal uppercase tracking-[0.18em] transition-opacity hover:opacity-90"
                                    style={{
                                        background: surface.buttonBg,
                                        color: surface.buttonText,
                                    }}
                                >
                                    {ctaLabel}
                                </a>
                            ) : null}
                        </div>
                    </section>
                );
            },
        },
        Hours: {
            label: "Hours",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                rows: {
                    type: "textarea",
                    label: "Hours (one per line: Day|Time)",
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Opening hours",
                rows: "Mon–Thu|10:00 – 22:00\nFri–Sat|10:00 – 00:00\nSun|11:00 – 21:00",
                size: "md",
            },
            render: ({ title, rows, size }) => {
                const parsed = parsePipeRows(rows, 2);
                return (
                    <section id="hours" className={sectionPadding(size)}>
                        <div className="mx-auto max-w-3xl">
                            <h2
                                className="text-3xl font-normal tracking-tight"
                                style={{
                                    fontFamily: "var(--site-font-display)",
                                }}
                            >
                                {title}
                            </h2>
                            <dl className="mt-6 divide-y divide-black/10">
                                {parsed.map(([day, time]) => (
                                    <div
                                        key={`${day}-${time}`}
                                        className="flex items-center justify-between gap-4 py-3 text-sm"
                                    >
                                        <dt className="font-normal">{day}</dt>
                                        <dd className="opacity-70">{time}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>
                );
            },
        },
        Contact: {
            label: "Contact",
            fields: {
                ...typographyFields(),
                title: { type: "text" },
                showHours: {
                    type: "radio",
                    options: [
                        { label: "Show hours", value: true },
                        { label: "Hide hours", value: false },
                    ],
                },
                showMapLink: {
                    type: "radio",
                    options: [
                        { label: "Show map link", value: true },
                        { label: "Hide map link", value: false },
                    ],
                },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                title: "Visit us",
                showHours: true,
                showMapLink: true,
                size: "md",
            },
            render: ({ title, showHours, showMapLink, size }) => {
                const ctx = getSiteRender();
                const mapQuery = encodeURIComponent(
                    [ctx.address, ctx.city].filter(Boolean).join(", "),
                );
                return (
                    <section id="contact" className={sectionPadding(size)}>
                        <div className="mx-auto max-w-3xl">
                            <h2
                                className="text-3xl font-normal tracking-tight"
                                style={{
                                    fontFamily: "var(--site-font-display)",
                                }}
                            >
                                {title}
                            </h2>
                            <dl className="mt-6 space-y-3 text-sm">
                                {ctx.address ? (
                                    <div>
                                        <dt className="opacity-55">Address</dt>
                                        <dd className="font-normal">
                                            {ctx.address}
                                            {ctx.city ? `, ${ctx.city}` : ""}
                                        </dd>
                                    </div>
                                ) : null}
                                {ctx.phone ? (
                                    <div>
                                        <dt className="opacity-55">Phone</dt>
                                        <dd className="font-normal">
                                            {ctx.phone}
                                        </dd>
                                    </div>
                                ) : null}
                                {ctx.email ? (
                                    <div>
                                        <dt className="opacity-55">Email</dt>
                                        <dd className="font-normal">
                                            {ctx.email}
                                        </dd>
                                    </div>
                                ) : null}
                                {showHours && ctx.hours ? (
                                    <div>
                                        <dt className="opacity-55">Hours</dt>
                                        <dd className="font-normal">
                                            {ctx.hours}
                                        </dd>
                                    </div>
                                ) : null}
                            </dl>
                            {showMapLink && mapQuery ? (
                                <a
                                    href={`https://maps.google.com/?q=${mapQuery}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-6 inline-flex rounded-full px-5 py-2 text-xs font-normal uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
                                    style={{
                                        background: ctx.theme.primaryColor,
                                    }}
                                >
                                    Open in Maps
                                </a>
                            ) : null}
                        </div>
                    </section>
                );
            },
        },
        Footer: {
            label: "Footer",
            fields: {
                ...typographyFields(),
                layout: {
                    type: "select",
                    label: "Footer layout",
                    options: [
                        { label: "Brand + links", value: "brandLinks" },
                        { label: "Centered", value: "centered" },
                        { label: "Multi-column dense", value: "dense" },
                    ],
                },
                note: { type: "text", label: "Copyright / note" },
                links: {
                    type: "textarea",
                    label: "Footer links (one per line: Label|url)",
                },
                columns: {
                    type: "select",
                    label: "Link columns",
                    options: [
                        { label: "1", value: "1" },
                        { label: "2", value: "2" },
                        { label: "3", value: "3" },
                        { label: "4", value: "4" },
                    ],
                },
                showSocial: {
                    type: "radio",
                    options: [
                        { label: "Show social", value: true },
                        { label: "Hide social", value: false },
                    ],
                },
                instagram: { type: "text", label: "Instagram URL" },
                facebook: { type: "text", label: "Facebook URL" },
                tiktok: { type: "text", label: "TikTok URL" },
                size: {
                    type: "select",
                    label: "Section size",
                    options: SIZE_OPTIONS,
                },
            },
            defaultProps: {
                ...TYPOGRAPHY_DEFAULTS,
                layout: "brandLinks",
                note: "Powered by Restaurant OS",
                links: "Menu|#menu\nAbout|#about\nHours|#hours\nContact|#contact\nReservations|tel:",
                columns: "2",
                showSocial: true,
                instagram: "",
                facebook: "",
                tiktok: "",
                size: "md",
            },
            render: ({
                layout,
                note,
                links,
                columns,
                showSocial,
                instagram,
                facebook,
                tiktok,
                size,
            }) => {
                const ctx = getSiteRender();
                const parsed = parseLinks(links).map(link => ({
                    ...link,
                    href:
                        link.href === "tel:" && ctx.phone
                            ? `tel:${ctx.phone}`
                            : link.href,
                }));
                const grid =
                    columns === "4"
                        ? "sm:grid-cols-2 lg:grid-cols-4"
                        : columns === "3"
                          ? "sm:grid-cols-3"
                          : columns === "1"
                            ? "grid-cols-1"
                            : "sm:grid-cols-2";
                const social = [
                    {
                        label: "Instagram",
                        href: instagram || ctx.instagram || "",
                    },
                    { label: "Facebook", href: facebook || ctx.facebook || "" },
                    { label: "TikTok", href: tiktok || ctx.tiktok || "" },
                    { label: "Telegram", href: ctx.telegram || "" },
                ].filter((s): s is { label: string; href: string } =>
                    Boolean(s.href),
                );

                if (layout === "centered") {
                    return (
                        <footer
                            id="footer"
                            className={`border-t border-black/10 ${sectionPadding(size)} text-center text-sm`}
                        >
                            <p
                                className="text-lg font-normal"
                                style={{
                                    fontFamily: "var(--site-font-display)",
                                }}
                            >
                                {ctx.tenantName}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-4">
                                {parsed.map(link => (
                                    <a
                                        key={`${link.label}-${link.href}`}
                                        href={link.href}
                                        className="opacity-75 hover:opacity-100"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                            {showSocial && social.length > 0 ? (
                                <div className="mt-4 flex flex-wrap justify-center gap-3">
                                    {social.map(item => (
                                        <a
                                            key={item.label}
                                            href={item.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-normal hover:opacity-80"
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                            ) : null}
                            <p className="mt-6 opacity-60">{note}</p>
                        </footer>
                    );
                }

                return (
                    <footer
                        id="footer"
                        className={`border-t border-black/10 ${sectionPadding(size)} text-sm`}
                    >
                        <div
                            className={`mx-auto grid max-w-6xl gap-8 ${
                                layout === "dense"
                                    ? "md:grid-cols-[1fr_2fr]"
                                    : "md:grid-cols-[1.2fr_1fr]"
                            }`}
                        >
                            <div>
                                <p
                                    className="text-lg font-normal"
                                    style={{
                                        fontFamily: "var(--site-font-display)",
                                    }}
                                >
                                    {ctx.tenantName}
                                </p>
                                <p className="mt-2 opacity-70">{note}</p>
                                {showSocial && social.length > 0 ? (
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {social.map(item => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-normal hover:opacity-80"
                                            >
                                                {item.label}
                                            </a>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <div className={`grid gap-2 ${grid}`}>
                                {parsed.map(link => (
                                    <a
                                        key={`${link.label}-${link.href}`}
                                        href={link.href}
                                        className="opacity-75 hover:opacity-100"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </footer>
                );
            },
        },
    },
} as Config<SiteSectionProps>;
