"use client";

import { use } from "react";
import { Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { Loader2 } from "lucide-react";
import { useGetPublicSiteQuery } from "@/context/services/siteApi";
import {
    SiteRenderContext,
    bindSiteRender,
    sitePuckConfig,
} from "@/domains/site/puck/sitePuckConfig";

export default function PublicRestaurantSitePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const { data, isLoading, error } = useGetPublicSiteQuery(slug);

    if (isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center gap-2 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Loading restaurant site…
            </div>
        );
    }

    if (error || !data?.data) {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-2 px-6 text-center">
                <h1 className="text-2xl font-semibold">Site not found</h1>
                <p className="text-sm text-slate-600">
                    This restaurant has not published a public website yet.
                </p>
            </div>
        );
    }

    const site = data.data;

    const bgStyle = (() => {
        if (
            site.theme.backgroundType === "gradient" &&
            site.theme.backgroundGradient
        ) {
            return site.theme.backgroundGradient;
        }
        if (
            site.theme.backgroundType === "image" &&
            site.theme.backgroundImageUrl
        ) {
            const opacity = site.theme.backgroundOverlayOpacity ?? 0.85;
            const isDark =
                site.theme.textColor === "#f8fafc" ||
                site.theme.textColor === "#ffffff";
            const overlay = isDark
                ? `rgba(15, 23, 42, ${opacity})`
                : `rgba(255, 255, 255, ${opacity})`;
            return `linear-gradient(${overlay}, ${overlay}), url("${site.theme.backgroundImageUrl}") center/cover fixed no-repeat`;
        }
        return site.theme.backgroundColor || "#fffaf5";
    })();

    const renderContext = {
        theme: site.theme,
        tenantName: site.tenantName,
        phone: site.phone,
        email: site.email,
        city: site.city,
        address: site.address,
        hours: site.hours,
        menuItems: site.menuItems,
    };
    bindSiteRender(renderContext);

    return (
        <SiteRenderContext.Provider value={renderContext}>
            <main
                style={
                    {
                        "--site-font-display":
                            site.theme.fontDisplay || "Georgia, serif",
                        "--site-font-body":
                            site.theme.fontBody || "system-ui, sans-serif",
                        color: site.theme.textColor,
                        background: bgStyle,
                        fontFamily: "var(--site-font-body)",
                        minHeight: "100svh",
                    } as React.CSSProperties
                }
            >
                <Render config={sitePuckConfig} data={site.data as Data} />
            </main>
        </SiteRenderContext.Provider>
    );
}
