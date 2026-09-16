"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export default function PageHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
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
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                {localizedEyebrow ? (
                    <p className="mb-1 text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                        {localizedEyebrow}
                    </p>
                ) : null}
                <h1 className="text-[32px] leading-[1.2] font-semibold tracking-tight">
                    {localizedTitle}
                </h1>
                {localizedDesc ? (
                    <p className="mt-1 max-w-2xl text-[15px] text-slate-gray">
                        {localizedDesc}
                    </p>
                ) : null}
            </div>
            {action}
        </div>
    );
}
