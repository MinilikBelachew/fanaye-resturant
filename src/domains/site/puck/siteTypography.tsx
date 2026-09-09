"use client";

import { useEffect } from "react";

/** Curated fonts for restaurant sites (loaded via Google Fonts). */
export const SITE_FONT_OPTIONS = [
    { label: "Theme default", value: "theme" },
    { label: "Fraunces (display)", value: "Fraunces, Georgia, serif" },
    { label: "Playfair Display", value: "Playfair Display, Georgia, serif" },
    { label: "Cormorant", value: "Cormorant Garamond, Georgia, serif" },
    { label: "Libre Baskerville", value: "Libre Baskerville, Georgia, serif" },
    { label: "DM Sans", value: "DM Sans, system-ui, sans-serif" },
    { label: "Outfit", value: "Outfit, system-ui, sans-serif" },
    { label: "Space Grotesk", value: "Space Grotesk, system-ui, sans-serif" },
    { label: "Manrope", value: "Manrope, system-ui, sans-serif" },
    { label: "Source Sans 3", value: "Source Sans 3, system-ui, sans-serif" },
] as const;

export const TITLE_SIZE_OPTIONS = [
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
    { label: "XL", value: "xl" },
    { label: "2XL", value: "2xl" },
];

export const BODY_SIZE_OPTIONS = [
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
];

export type SectionTypography = {
    titleFont?: string;
    titleSize?: string;
    titleColor?: string;
    bodyFont?: string;
    bodySize?: string;
    bodyColor?: string;
};

export const TYPOGRAPHY_DEFAULTS: Required<SectionTypography> = {
    titleFont: "theme",
    titleSize: "lg",
    titleColor: "",
    bodyFont: "theme",
    bodySize: "md",
    bodyColor: "",
};

export function typographyFields() {
    return {
        titleFont: {
            type: "select" as const,
            label: "Title font",
            options: [...SITE_FONT_OPTIONS],
        },
        titleSize: {
            type: "select" as const,
            label: "Title size",
            options: TITLE_SIZE_OPTIONS,
        },
        titleColor: {
            type: "custom" as const,
            label: "Title color",
            render: ({
                value,
                onChange,
            }: {
                value?: string;
                onChange: (v: string) => void;
            }) => (
                <ColorField
                    label="Title color"
                    value={String(value || "")}
                    onChange={onChange}
                    placeholder="Theme default"
                />
            ),
        },
        bodyFont: {
            type: "select" as const,
            label: "Body font",
            options: [...SITE_FONT_OPTIONS],
        },
        bodySize: {
            type: "select" as const,
            label: "Body size",
            options: BODY_SIZE_OPTIONS,
        },
        bodyColor: {
            type: "custom" as const,
            label: "Body color",
            render: ({
                value,
                onChange,
            }: {
                value?: string;
                onChange: (v: string) => void;
            }) => (
                <ColorField
                    label="Body color"
                    value={String(value || "")}
                    onChange={onChange}
                    placeholder="Theme default"
                />
            ),
        },
    };
}

function ColorField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const swatch = value || "#0f172a";
    return (
        <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-slate-600">{label}</p>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(swatch) ? swatch : "#0f172a"}
                    onChange={e => onChange(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-black/10 bg-white p-0.5"
                />
                <input
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    className="h-9 flex-1 rounded-md border border-black/10 px-2 text-[12px]"
                />
                {value ? (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="rounded-md border border-black/10 px-2 py-1.5 text-[11px]"
                    >
                        Reset
                    </button>
                ) : null}
            </div>
        </div>
    );
}

function resolveFont(value: string | undefined, fallbackVar: string) {
    if (!value || value === "theme") return `var(${fallbackVar})`;
    return value;
}

export function titleStyle(typo: SectionTypography): React.CSSProperties {
    const size = typo.titleSize || "lg";
    const fontSize =
        size === "sm"
            ? "1.5rem"
            : size === "md"
              ? "1.875rem"
              : size === "xl"
                ? "2.75rem"
                : size === "2xl"
                  ? "3.25rem"
                  : "2.25rem";
    return {
        fontFamily: resolveFont(typo.titleFont, "--site-font-display"),
        fontSize,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        ...(typo.titleColor ? { color: typo.titleColor } : {}),
    };
}

export function bodyStyle(typo: SectionTypography): React.CSSProperties {
    const size = typo.bodySize || "md";
    const fontSize =
        size === "sm" ? "0.875rem" : size === "lg" ? "1.125rem" : "1rem";
    return {
        fontFamily: resolveFont(typo.bodyFont, "--site-font-body"),
        fontSize,
        lineHeight: 1.6,
        ...(typo.bodyColor ? { color: typo.bodyColor } : {}),
    };
}

const GOOGLE_FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Libre+Baskerville:wght@400;700&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap";

/** Loads curated Google fonts once for the site editor / public page. */
export function SiteFontLoader() {
    useEffect(() => {
        const id = "fanaye-site-fonts";
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = GOOGLE_FONTS_HREF;
        document.head.appendChild(link);
    }, []);
    return null;
}
