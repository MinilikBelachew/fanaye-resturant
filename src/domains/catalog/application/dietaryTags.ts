/** Normalize a restaurant dietary tag for storage on MenuItem.badge. */
export function normalizeDietaryTag(raw: string): string {
    return raw.trim().replace(/\s+/g, " ").slice(0, 40);
}

/** Human-readable label for a stored tag code or custom label. */
export function formatDietaryTagLabel(tag: string): string {
    const known: Record<string, string> = {
        FASTING: "ፆም Fasting",
        VEGETARIAN: "Vegetarian",
        SPICY: "Spicy",
        CHEF_PICK: "Chef's Pick",
    };
    if (known[tag]) return known[tag];
    return tag.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}
