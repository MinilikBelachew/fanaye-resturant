import type { Metadata } from "next";
import { Inter, Noto_Sans_Ethiopic } from "next/font/google";
import Providers from "./providers";
import "@/styles/globals.css";

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-roobert",
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
    subsets: ["ethiopic"],
    variable: "--font-ethiopic",
});

export const metadata: Metadata = {
    title: "Fanaye Restaurant Management OS",
    description:
        "The live real-time operating system for modern high-volume restaurants",
    icons: {
        icon: "/media/logos/logo_07_golden_cloche.svg",
        shortcut: "/media/logos/logo_07_golden_cloche.svg",
        apple: "/media/logos/logo_07_golden_cloche.svg",
    },
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
            className={`${inter.variable} ${notoSansEthiopic.variable}`}
            suppressHydrationWarning
        >
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem("fanaye.theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`,
                    }}
                />
            </head>
            <body
                className={`${inter.className} ${locale === "am" ? notoSansEthiopic.className : ""}`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider>
                    <Providers>{children}</Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
