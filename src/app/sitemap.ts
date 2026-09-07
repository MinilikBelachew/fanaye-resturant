import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://fanaye-restaurant.com",
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
    ];
}
