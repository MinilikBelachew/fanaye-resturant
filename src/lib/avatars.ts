/**
 * Deterministic Notion-style animated character avatar resolver.
 * Uses the clean, minimalist "notionists" collection by Zoish via Dicebear,
 * giving restaurant staff modern, clean, illustrated Notion-style avatars.
 */

export type AnimatedAvatarStyle =
    | "notionists"
    | "notionists-neutral"
    | "adventurer"
    | "lorelei"
    | "micah"
    | "bottts"
    | "big-smile"
    | "avataaars";

export function getStaffAvatarUrl(
    name?: string | null,
    photoUrl?: string | null,
    style: AnimatedAvatarStyle = "notionists",
): string {
    // If an explicit non-stock uploaded photo exists, respect it
    if (
        photoUrl &&
        photoUrl.trim().length > 0 &&
        !photoUrl.includes("unsplash.com")
    ) {
        return photoUrl;
    }

    const cleanSeed = (name || "staff").trim() || "staff";
    const seed = encodeURIComponent(cleanSeed);

    // Clean Notion-style illustrated avatar with modern soft pastel background palette
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,e2e8f0,f8fafc`;
}

export function getStaffDicebearUrl(
    name?: string | null,
    style: AnimatedAvatarStyle = "notionists",
): string {
    return getStaffAvatarUrl(name, null, style);
}
