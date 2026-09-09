import { DISH_IMAGES } from "@/lib/media";
import { API_BASE_URL } from "@/context/env";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import type { ModifierGroup } from "@/domains/catalog/domain/modifiers";
import type { AdminMenuItem } from "@/domains/catalog/domain/menuApi";
import { IMAGE_KEY_TO_URL, filePublicUrl, imageForDish } from "./menuImages";

export { IMAGE_KEY_TO_URL, filePublicUrl, imageForDish };

export function urlToImageKey(url: string): string | undefined {
    const entry = Object.entries(IMAGE_KEY_TO_URL).find(
        ([, value]) => value === url,
    );
    return entry?.[0];
}

export function adminMenuItemToCatalog(
    item: AdminMenuItem,
    preferredImage?: string,
): MenuItem {
    return {
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        category: item.categoryName,
        price: Number(item.price),
        stationId: item.preparationStationId,
        expectedPreparationMinutes: item.expectedPrepMinutes ?? 0,
        available: item.available,
        image:
            preferredImage ||
            filePublicUrl(item.imageUrl) ||
            (item.imageKey ? IMAGE_KEY_TO_URL[item.imageKey] : undefined) ||
            imageForDish(item.name),
        imageFileId: item.imageFileId ?? undefined,
        modifierGroups: item.modifierGroups.map(group => ({
            id: group.id,
            name: group.name,
            kind: group.kind,
            min: group.minSelections,
            max: group.maxSelections,
            options: group.options.map(option => ({
                id: option.id,
                name: option.name,
                ticketLabel: option.name,
                priceDelta: Number(option.priceDelta),
            })),
        })),
        version: item.version,
    };
}

export function catalogModifiersToApi(groups: ModifierGroup[]) {
    return groups.map(group => ({
        name: group.name,
        kind: group.kind,
        options: group.options.map(option => ({
            name:
                group.kind === "included" && option.ticketLabel
                    ? option.ticketLabel
                    : option.name,
            priceDelta: Number(option.priceDelta || 0).toFixed(2),
        })),
    }));
}
