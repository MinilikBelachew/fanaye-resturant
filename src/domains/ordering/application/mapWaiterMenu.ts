import type { MenuItem } from "@/domains/catalog/domain/menu";
import type { ModifierGroup } from "@/domains/catalog/domain/modifiers";
import type { WaiterMenuItem } from "@/domains/ordering/domain/waiterMenu";
import {
    IMAGE_KEY_TO_URL,
    filePublicUrl,
    imageForDish,
} from "@/domains/catalog/application/menuImages";

export { imageForDish };

export function toCatalogMenuItem(item: WaiterMenuItem): MenuItem {
    const resolvedImage =
        filePublicUrl(item.imageUrl) ||
        (item.imageKey ? IMAGE_KEY_TO_URL[item.imageKey] : undefined) ||
        imageForDish(item.name);

    return {
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        category: item.categoryName,
        price: Number(item.price),
        stationId: item.station.id,
        expectedPreparationMinutes: item.expectedPrepMinutes ?? 0,
        available: !item.soldOut,
        image: resolvedImage,
        imageFileId: item.imageFileId ?? undefined,
        modifierGroups: item.modifierGroups.map(toModifierGroup),
    };
}

function toModifierGroup(
    group: WaiterMenuItem["modifierGroups"][number],
): ModifierGroup {
    const choice = group.minSelections >= 1 && group.maxSelections === 1;
    return {
        id: group.id,
        name: group.name,
        kind: choice ? "choice" : "extra",
        min: group.minSelections,
        max: group.maxSelections,
        options: group.options.map(option => ({
            id: option.id,
            name: option.name,
            ticketLabel: option.name,
            priceDelta: Number(option.priceDelta),
        })),
    };
}

export function lineTotal(
    unitPrice: string,
    quantity: number,
    modifiers: Array<{ priceDelta: string }>,
): number {
    const extras = modifiers.reduce(
        (sum, entry) => sum + Number(entry.priceDelta),
        0,
    );
    return (Number(unitPrice) + extras) * quantity;
}
