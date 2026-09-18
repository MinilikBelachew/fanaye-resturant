import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Restaurant OS",
        short_name: "Restaurant OS",
        description:
            "Live restaurant operations — floor, kitchen, cashier, and menu management.",
        start_url: "/en",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#18181B",
        theme_color: "#E85D04",
        categories: ["business", "food", "productivity"],
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
