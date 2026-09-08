import { DISH_IMAGES } from "@/lib/media";
import type { MenuItem } from "@/domains/catalog/domain/menu";
import type { ModifierGroup } from "@/domains/catalog/domain/modifiers";
import type { WaiterMenuItem } from "@/domains/ordering/domain/waiterMenu";

export function imageForDish(name: string): string | undefined {
    const value = name.toLowerCase();
    if (value.includes("burger")) return DISH_IMAGES.burger;
    if (value.includes("pizza")) return DISH_IMAGES.pizza;
    if (value.includes("pasta") || value.includes("spaghetti")) {
        return DISH_IMAGES.pasta;
    }
    if (value.includes("salad")) return DISH_IMAGES.salad;
    if (value.includes("macchiato")) return DISH_IMAGES.macchiato;
    if (value.includes("latte")) return DISH_IMAGES.latte;
    if (value.includes("tiramisu")) return DISH_IMAGES.tiramisu;
    if (value.includes("cake")) return DISH_IMAGES.cheesecake;
    if (value.includes("cola")) return DISH_IMAGES.cola;
    if (value.includes("sprite")) return DISH_IMAGES.sprite;
    return undefined;
}

export function toCatalogMenuItem(item: WaiterMenuItem): MenuItem {
    return {
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        category: item.categoryName,
        price: Number(item.price),
        stationId: item.station.id,
        expectedPreparationMinutes: item.expectedPrepMinutes ?? 0,
        available: !item.soldOut,
        image: imageForDish(item.name),
        modifierGroups: item.modifierGroups.map(toModifierGroup),
    };
}

function toModifierGroup(group: WaiterMenuItem["modifierGroups"][number]): ModifierGroup {
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
