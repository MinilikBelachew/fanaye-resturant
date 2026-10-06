"use client";

import { GoldenClocheLogo } from "@/components/common/GoldenClocheLogo";
import { QrCodeSvg } from "@/components/common/QrCodeSvg";
import {
    adminMenuItemToCatalog,
    filePublicUrl,
} from "@/domains/catalog/application/mapAdminMenu";
import type { AdminMenuItem } from "@/domains/catalog/domain/menuApi";
import { formatEtb } from "@/lib/money";
import { Coffee, Heart, Leaf, Star, UtensilsCrossed } from "lucide-react";

export type PrintMenuTemplateId = "classic" | "aurora" | "breakfast";

export type PrintMenuCategory = {
    name: string;
    items: AdminMenuItem[];
};

export type PrintMenuTemplateProps = {
    title: string;
    subtitle: string;
    showLogo: boolean;
    logoUrl: string | null;
    categories: PrintMenuCategory[];
    showImages: boolean;
    showDescriptions: boolean;
    showQrCode: boolean;
    qrUrl: string;
    qrHeadline: string;
    qrSubtext: string;
    tableLabel?: string | null;
    footerNote: string;
};

function LogoMark({
    showLogo,
    logoUrl,
    size = 56,
    className = "",
}: {
    showLogo: boolean;
    logoUrl: string | null;
    size?: number;
    className?: string;
}) {
    if (!showLogo) return null;
    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden ${className}`}
            style={{ width: size, height: size }}
        >
            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt="Logo"
                    className="size-full object-contain"
                    crossOrigin="anonymous"
                />
            ) : (
                <GoldenClocheLogo className="size-full" size={size} />
            )}
        </div>
    );
}

function itemImage(item: AdminMenuItem) {
    const mapped = adminMenuItemToCatalog(item);
    return (
        mapped.image || filePublicUrl(item.imageUrl) || item.imageUrl || null
    );
}

function AuroraCategoryBlock({
    category,
    ink,
    gold,
    useStars,
    maxItems = 6,
}: {
    category: PrintMenuCategory;
    ink: string;
    gold: string;
    useStars?: boolean;
    maxItems?: number;
}) {
    const items = category.items.slice(0, maxItems);
    return (
        <section style={{ minWidth: 0, breakInside: "avoid" }}>
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 999,
                    padding: "5px 16px",
                    backgroundColor: ink,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                }}
            >
                {useStars ? (
                    <Star className="size-3" style={{ color: gold }} />
                ) : (
                    <Coffee className="size-3" style={{ color: gold }} />
                )}
                {category.name}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {items.map(item => (
                    <li key={item.id} style={{ marginBottom: 3 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 6,
                                fontSize: 11,
                                color: "#3D2914",
                            }}
                        >
                            {useStars || item.badge ? (
                                <Star
                                    className="size-3"
                                    style={{ color: gold, flexShrink: 0 }}
                                />
                            ) : (
                                <Coffee
                                    className="size-3"
                                    style={{
                                        color: `${ink}66`,
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            <span
                                style={{
                                    fontWeight: 600,
                                    maxWidth: "55%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.name}
                            </span>
                            <span
                                style={{
                                    flex: 1,
                                    borderBottom: `1px dotted ${ink}55`,
                                    margin: "0 4px 2px",
                                    minWidth: 12,
                                }}
                            />
                            <span
                                style={{
                                    fontWeight: 700,
                                    fontVariantNumeric: "tabular-nums",
                                    fontSize: 10,
                                    flexShrink: 0,
                                }}
                            >
                                {formatEtb(Number(item.price)).replace(
                                    /^ETB\s?/,
                                    "",
                                )}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** Café-style layout matching Aurora reference — stable A4 two-column sheet. */
export function AuroraMenuSheet({
    title,
    subtitle,
    showLogo,
    logoUrl,
    categories,
    showImages,
    showQrCode,
    qrUrl,
    tableLabel,
}: PrintMenuTemplateProps) {
    const ink = "#1B4332";
    const gold = "#C4A35A";
    const cream = "#F4EFE4";

    // Keep content short so one A4 page never overflows.
    const capped = categories.slice(0, 4).map(cat => ({
        ...cat,
        items: cat.items.slice(0, 4),
    }));

    const leftCategories =
        capped.length <= 1
            ? capped
            : capped.slice(0, Math.ceil(capped.length / 2));
    const rightCategories =
        capped.length <= 1 ? [] : capped.slice(Math.ceil(capped.length / 2));

    const photos = capped
        .flatMap(c => c.items)
        .map(itemImage)
        .filter((url): url is string => Boolean(url));
    const heroPhoto = showImages ? (photos[0] ?? null) : null;
    const sidePhoto = showImages ? (photos[1] ?? null) : null;

    const brandLine =
        title.trim().split(/\s+/).slice(0, 2).join(" ") || "Restaurant";

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
                backgroundColor: cream,
                color: "#3D2914",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
        >
            {/* Header */}
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 8,
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 8,
                            fontWeight: 600,
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: `${ink}99`,
                        }}
                    >
                        Brewed to perfection
                    </p>
                    <div style={{ position: "relative", marginTop: 2 }}>
                        <h1
                            style={{
                                margin: 0,
                                fontFamily: "ui-serif, Georgia, serif",
                                fontSize: 42,
                                lineHeight: 0.88,
                                fontWeight: 900,
                                color: ink,
                            }}
                        >
                            MENU
                        </h1>
                        <span
                            style={{
                                position: "absolute",
                                left: 36,
                                bottom: -6,
                                fontFamily: "ui-serif, Georgia, serif",
                                fontSize: 24,
                                fontStyle: "italic",
                                color: gold,
                                lineHeight: 1,
                            }}
                        >
                            List
                        </span>
                    </div>
                    <p
                        style={{
                            margin: "16px 0 0",
                            fontSize: 10,
                            fontWeight: 500,
                            color: "#3D2914cc",
                        }}
                    >
                        {subtitle || "Good Coffee, Great Vibes."}
                    </p>
                </div>

                <div
                    style={{
                        width: 96,
                        flexShrink: 0,
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            margin: "0 auto",
                            borderRadius: "999px",
                            border: `3px solid ${ink}`,
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}
                    >
                        <LogoMark
                            showLogo={showLogo}
                            logoUrl={logoUrl}
                            size={42}
                        />
                    </div>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: ink,
                        }}
                    >
                        {brandLine}
                    </p>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 8,
                            fontWeight: 600,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: `${ink}99`,
                        }}
                    >
                        · House ·
                    </p>
                </div>
            </header>

            {/* Stable 2-column body — inline grid avoids preview scale bugs */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: 18,
                    rowGap: 0,
                    alignItems: "start",
                    flex: 1,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        minWidth: 0,
                    }}
                >
                    {leftCategories.map(cat => (
                        <AuroraCategoryBlock
                            key={cat.name}
                            category={cat}
                            ink={ink}
                            gold={gold}
                            maxItems={4}
                        />
                    ))}
                    {sidePhoto ? (
                        <div
                            style={{
                                width: "100%",
                                height: 96,
                                borderRadius: 16,
                                overflow: "hidden",
                                background: "#e7e0d4",
                                marginTop: 2,
                            }}
                        >
                            <img
                                src={sidePhoto}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </div>
                    ) : null}
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        minWidth: 0,
                    }}
                >
                    {heroPhoto ? (
                        <div style={{ position: "relative", width: "100%" }}>
                            <div
                                style={{
                                    width: "100%",
                                    height: 132,
                                    borderRadius: 22,
                                    overflow: "hidden",
                                    background: "#e7e0d4",
                                }}
                            >
                                <img
                                    src={heroPhoto}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    left: -4,
                                    top: 28,
                                    width: 68,
                                    height: 68,
                                    borderRadius: 999,
                                    backgroundColor: ink,
                                    color: "#fff",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    fontFamily: "ui-serif, Georgia, serif",
                                    fontSize: 9,
                                    fontStyle: "italic",
                                    lineHeight: 1.15,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                            >
                                Made with
                                <br />
                                Quality
                                <Heart
                                    className="size-3"
                                    style={{ color: gold, marginTop: 2 }}
                                />
                            </div>
                        </div>
                    ) : null}

                    {rightCategories.map(cat => (
                        <AuroraCategoryBlock
                            key={cat.name}
                            category={cat}
                            ink={ink}
                            gold={gold}
                            useStars
                            maxItems={4}
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    marginTop: 10,
                    borderRadius: "16px 16px 0 0",
                    backgroundColor: ink,
                    color: "#fff",
                    padding: "8px 12px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                                border: `1px solid ${gold}88`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Coffee
                                className="size-4"
                                style={{ color: gold }}
                            />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    fontWeight: 900,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Love our coffee? Order now!
                            </p>
                            <p
                                style={{
                                    margin: "2px 0 0",
                                    fontSize: 9,
                                    opacity: 0.8,
                                }}
                            >
                                {tableLabel
                                    ? `Seated at ${tableLabel}`
                                    : subtitle ||
                                      "Scan to order from your table"}
                            </p>
                        </div>
                    </div>
                    {showQrCode ? (
                        <div
                            style={{
                                flexShrink: 0,
                                background: "#fff",
                                borderRadius: 12,
                                padding: 6,
                                boxShadow: `0 0 0 2px ${gold}`,
                                textAlign: "center",
                            }}
                        >
                            <QrCodeSvg
                                value={qrUrl}
                                size={54}
                                fgColor="#1B4332"
                            />
                            <div
                                style={{
                                    marginTop: 2,
                                    fontSize: 7,
                                    fontWeight: 900,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: ink,
                                }}
                            >
                                Scan to order
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderRadius: "0 0 16px 16px",
                    backgroundColor: cream,
                    color: ink,
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                }}
            >
                <Leaf className="size-2.5" />
                Good coffee
                <Leaf className="size-2.5" />
                Good people
                <Leaf className="size-2.5" />
                Good times
            </div>
        </div>
    );
}

function PlateCategoryBlock({
    category,
    ink,
    maxItems = 5,
}: {
    category: PrintMenuCategory;
    ink: string;
    maxItems?: number;
}) {
    const items = category.items.slice(0, maxItems);
    return (
        <section style={{ minWidth: 0, marginBottom: 14 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                }}
            >
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        border: `1px solid ${ink}66`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <UtensilsCrossed
                        style={{ width: 11, height: 11, color: ink }}
                    />
                </div>
                <h3
                    style={{
                        margin: 0,
                        fontFamily: "ui-serif, Georgia, serif",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: ink,
                    }}
                >
                    {category.name}
                </h3>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {items.map(item => (
                    <li key={item.id} style={{ marginBottom: 5 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 6,
                                fontSize: 11,
                                color: ink,
                            }}
                        >
                            <span
                                style={{
                                    fontWeight: 600,
                                    maxWidth: "58%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.name}
                            </span>
                            <span
                                style={{
                                    flex: 1,
                                    borderBottom: `1px dotted ${ink}44`,
                                    marginBottom: 2,
                                    minWidth: 10,
                                }}
                            />
                            <span
                                style={{
                                    fontWeight: 700,
                                    fontVariantNumeric: "tabular-nums",
                                    fontSize: 11,
                                    flexShrink: 0,
                                }}
                            >
                                {formatEtb(Number(item.price)).replace(
                                    /^ETB\s?/,
                                    "",
                                )}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** Elegant single-page “Tell & Plate” style bakery / dining menu. */
export function BreakfastMenuSheet({
    title,
    subtitle,
    showLogo,
    logoUrl,
    categories,
    showImages,
    showQrCode,
    qrUrl,
    tableLabel,
}: PrintMenuTemplateProps) {
    const cream = "#F2EFE9";
    const ink = "#2C241B";
    const muted = "#8A8178";

    const capped = categories.slice(0, 5).map(cat => ({
        ...cat,
        items: cat.items.slice(0, 5),
    }));
    const leftCats =
        capped.length <= 1
            ? capped
            : capped.slice(0, Math.ceil((capped.length * 3) / 5));
    const rightCats =
        capped.length <= 1
            ? []
            : capped.slice(Math.ceil((capped.length * 3) / 5));

    const photos = capped
        .flatMap(c => c.items)
        .map(itemImage)
        .filter((u): u is string => Boolean(u));
    const topPhoto = showImages ? (photos[0] ?? null) : null;
    const bottomPhoto = showImages ? (photos[1] ?? photos[0] ?? null) : null;

    const brand = title.trim() || "Restaurant";
    const year = new Date().getFullYear();

    return (
        <div
            style={{
                position: "relative",
                height: "100%",
                minHeight: "100%",
                boxSizing: "border-box",
                backgroundColor: cream,
                color: ink,
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                border: `1px solid ${ink}`,
                outline: `1px solid ${ink}`,
                outlineOffset: 3,
                padding: 14,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <header style={{ textAlign: "center", marginBottom: 10 }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        margin: "0 auto 6px",
                        borderRadius: 999,
                        border: `1px solid ${ink}55`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        background: "#fff",
                    }}
                >
                    <LogoMark showLogo={showLogo} logoUrl={logoUrl} size={28} />
                </div>
                <p
                    style={{
                        margin: 0,
                        fontFamily: "ui-serif, Georgia, serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                    }}
                >
                    {brand}
                </p>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 4,
                    }}
                >
                    <span style={{ width: 28, height: 1, background: muted }} />
                    <span
                        style={{
                            fontSize: 8,
                            letterSpacing: "0.2em",
                            color: muted,
                        }}
                    >
                        EST. {year}
                    </span>
                    <span style={{ width: 28, height: 1, background: muted }} />
                </div>
                <h1
                    style={{
                        margin: "10px 0 0",
                        fontFamily: "ui-serif, Georgia, serif",
                        fontSize: 36,
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        lineHeight: 1,
                    }}
                >
                    MENU
                </h1>
                <Leaf
                    style={{
                        width: 14,
                        height: 14,
                        margin: "6px auto 0",
                        color: muted,
                        display: "block",
                    }}
                />
                <p
                    style={{
                        margin: "4px 0 0",
                        fontSize: 9,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: muted,
                    }}
                >
                    {subtitle || "Good food. Good mood."}
                </p>
            </header>

            {/* Body: lists + floating photos */}
            <div
                style={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    display: "grid",
                    gridTemplateColumns: "1.15fr 0.85fr",
                    columnGap: 18,
                }}
            >
                <div style={{ minWidth: 0, zIndex: 1 }}>
                    {leftCats.map(cat => (
                        <PlateCategoryBlock
                            key={cat.name}
                            category={cat}
                            ink={ink}
                            maxItems={5}
                        />
                    ))}
                </div>

                <div
                    style={{
                        position: "relative",
                        minWidth: 0,
                        zIndex: 1,
                    }}
                >
                    {topPhoto ? (
                        <div
                            style={{
                                width: "100%",
                                height: 150,
                                marginBottom: 10,
                                borderRadius:
                                    "50% 42% 48% 52% / 48% 52% 46% 54%",
                                overflow: "hidden",
                                background: "#e8e2d8",
                            }}
                        >
                            <img
                                src={topPhoto}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </div>
                    ) : null}

                    {rightCats.map(cat => (
                        <PlateCategoryBlock
                            key={cat.name}
                            category={cat}
                            ink={ink}
                            maxItems={5}
                        />
                    ))}

                    {bottomPhoto ? (
                        <div style={{ marginTop: 8, position: "relative" }}>
                            <p
                                style={{
                                    margin: "0 0 4px",
                                    fontFamily: "ui-serif, Georgia, serif",
                                    fontStyle: "italic",
                                    fontSize: 13,
                                    color: ink,
                                    textAlign: "center",
                                }}
                            >
                                Made with love
                                <Heart
                                    style={{
                                        width: 10,
                                        height: 10,
                                        display: "inline",
                                        marginLeft: 4,
                                        color: ink,
                                    }}
                                />
                            </p>
                            <div
                                style={{
                                    width: "92%",
                                    height: 120,
                                    margin: "0 auto",
                                    borderRadius:
                                        "46% 54% 48% 52% / 52% 46% 54% 48%",
                                    overflow: "hidden",
                                    background: "#e8e2d8",
                                }}
                            >
                                <img
                                    src={bottomPhoto}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <footer
                style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: `1px solid ${ink}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: muted,
                    }}
                >
                    <Heart
                        style={{
                            width: 10,
                            height: 10,
                            display: "inline",
                            marginRight: 4,
                        }}
                    />
                    {tableLabel
                        ? `Thank you · ${tableLabel}`
                        : "Thank you for choosing us!"}
                </p>
                {showQrCode ? (
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 8,
                            padding: 3,
                            border: `1px solid ${ink}22`,
                        }}
                    >
                        <QrCodeSvg value={qrUrl} size={42} fgColor="#2C241B" />
                    </div>
                ) : null}
            </footer>
        </div>
    );
}

export const PRINT_MENU_TEMPLATES: Array<{
    id: PrintMenuTemplateId;
    label: string;
    description: string;
    swatch: string;
}> = [
    {
        id: "classic",
        label: "Classic",
        description: "Two-column dining menu",
        swatch: "linear-gradient(135deg,#fff,#fef3c7)",
    },
];
