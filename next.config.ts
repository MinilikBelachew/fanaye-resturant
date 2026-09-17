import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    output: "standalone",
    devIndicators: false,

    productionBrowserSourceMaps: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },
    headers: async () => [
        {
            source: "/sw.js",
            headers: [
                {
                    key: "Cache-Control",
                    value: "public, max-age=0, must-revalidate",
                },
                {
                    key: "Service-Worker-Allowed",
                    value: "/",
                },
            ],
        },
        {
            source: "/manifest.webmanifest",
            headers: [
                {
                    key: "Cache-Control",
                    value: "public, max-age=0, must-revalidate",
                },
            ],
        },
    ],
};

export default withNextIntl(nextConfig);
