"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export default function PageHeader({
    eyebrow,
    title,
    description,
    action,
    compact = false,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
    compact?: boolean;
}) {
    const tHeaders = useTranslations("pageHeaders");
    const tNav = useTranslations("appNav");

    // Translate eyebrow if available
    let localizedEyebrow = eyebrow;
    if (eyebrow) {
        const ebKey = `eyebrow_${eyebrow.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        if (tHeaders.has(ebKey)) {
            localizedEyebrow = tHeaders(ebKey);
        } else {
            const navKey = eyebrow.toLowerCase();
            if (tNav.has(navKey)) {
                localizedEyebrow = tNav(navKey);
            }
        }
    }

    // Translate title if available
    let localizedTitle = title;
    const titleKey = `title_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    if (tHeaders.has(titleKey)) {
        localizedTitle = tHeaders(titleKey);
    } else {
        const navKey = title.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (tNav.has(navKey)) {
            localizedTitle = tNav(navKey);
        }
    }

    // Translate description if available
    let localizedDesc = description;
    if (description) {
        const descKey = `desc_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        if (tHeaders.has(descKey)) {
            localizedDesc = tHeaders(descKey);
        }
    }

    return (
        <div
            className={
                compact
                    ? "mb-4 flex flex-wrap items-end justify-between gap-3"
                    : "mb-6 flex flex-wrap items-end justify-between gap-4"
            }
        >
            <div>
                {localizedEyebrow ? (
                    <p
                        className={
                            compact
                                ? "mb-0.5 text-[11px] font-medium tracking-[0.08em] text-steel-gray uppercase"
                                : "mb-1 text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase"
                        }
                    >
                        {localizedEyebrow}
                    </p>
                ) : null}
                <h1
                    className={
                        compact
                            ? "text-[18px] leading-tight font-medium tracking-tight"
                            : "text-[28px] leading-[1.2] font-medium tracking-tight"
                    }
                >
                    {localizedTitle}
                </h1>
                {localizedDesc ? (
                    <p
                        className={
                            compact
                                ? "mt-0.5 max-w-2xl text-[12px] text-slate-gray"
                                : "mt-1 max-w-2xl text-[14px] text-slate-gray"
                        }
                    >
                        {localizedDesc}
                    </p>
                ) : null}
            </div>
            {action}
        </div>
    );
}
