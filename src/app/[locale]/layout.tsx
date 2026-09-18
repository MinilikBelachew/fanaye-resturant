import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import PwaInstallBanner from "@/components/pwa/PwaInstallBanner";
import PwaRegister from "@/components/pwa/PwaRegister";
import "@/styles/globals.css";

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
    applicationName: "Restaurant OS",
    title: {
        default: "Restaurant Management",
        template: "%s · Restaurant OS",
    },
    description: "Live real-time operations for modern high-volume restaurants",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Restaurant OS",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
                url: "/media/logos/logo_07_golden_cloche.svg",
                type: "image/svg+xml",
            },
        ],
        shortcut: "/icons/icon-192.png",
        apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#E85D04" },
        { media: "(prefers-color-scheme: dark)", color: "#18181B" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
};

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);
    return (
        <html
            lang={locale}
            className={locale === "am" ? "font-ethiopic" : "font-sans"}
            suppressHydrationWarning
        >
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem("fanaye.theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`,
                    }}
                />
                <meta name="mobile-web-app-capable" content="yes" />
                <link
                    rel="apple-touch-icon"
                    href="/icons/apple-touch-icon.png"
                />
            </head>
            <body className="min-h-svh antialiased" suppressHydrationWarning>
                <NextIntlClientProvider>
                    <Providers>
                        {children}
                        <PwaRegister />
                        <PwaInstallBanner />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
