import { DISH_IMAGES } from "@/lib/media";
import { API_BASE_URL } from "@/context/env";

export const IMAGE_KEY_TO_URL: Record<string, string> = {
    burger: DISH_IMAGES.burger,
    pizza: DISH_IMAGES.pizza,
    pasta: DISH_IMAGES.pasta,
    salad: DISH_IMAGES.salad,
    macchiato: DISH_IMAGES.macchiato,
    latte: DISH_IMAGES.latte,
    cheesecake: DISH_IMAGES.cheesecake,
    tiramisu: DISH_IMAGES.tiramisu,
    cola: DISH_IMAGES.cola,
    sprite: DISH_IMAGES.sprite,
};

export function filePublicUrl(
    path: string | null | undefined,
): string | undefined {
    if (!path) return undefined;
    if (
        path.startsWith("http://") ||
        path.startsWith("https://") ||
        path.startsWith("blob:") ||
        path.startsWith("data:")
    ) {
        return path;
    }
    const origin = API_BASE_URL.replace(/\/backend\/v1\/?$/, "");
    const normalized = path.replace(/\\/g, "/");
    return `${origin}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

export function imageForDish(name: string): string | undefined {
    const value = name.toLowerCase().trim();
    if (
        value.includes("burger") ||
        value.includes("sandwich") ||
        value.includes("sub")
    ) {
        return DISH_IMAGES.burger;
    }
    if (
        value.includes("pizza") ||
        value.includes("piza") ||
        value.includes("piz") ||
        value.includes("calzone")
    ) {
        return DISH_IMAGES.pizza;
    }
    if (
        value.includes("pasta") ||
        value.includes("spaghetti") ||
        value.includes("penne") ||
        value.includes("macaroni") ||
        value.includes("fettuccine") ||
        value.includes("lasagna")
    ) {
        return DISH_IMAGES.pasta;
    }
    if (
        value.includes("salad") ||
        value.includes("green") ||
        value.includes("caesar")
    ) {
        return DISH_IMAGES.salad;
    }
    if (value.includes("macchiato")) {
        return DISH_IMAGES.macchiato;
    }
    if (
        value.includes("latte") ||
        value.includes("coffee") ||
        value.includes("cappuccino") ||
        value.includes("espresso") ||
        value.includes("americano") ||
        value.includes("mocha") ||
        value.includes("tea")
    ) {
        return DISH_IMAGES.latte;
    }
    if (value.includes("tiramisu")) {
        return DISH_IMAGES.tiramisu;
    }
    if (
        value.includes("cake") ||
        value.includes("cheesecake") ||
        value.includes("pastry") ||
        value.includes("dessert") ||
        value.includes("pie") ||
        value.includes("cookie") ||
        value.includes("brownie")
    ) {
        return DISH_IMAGES.cheesecake;
    }
    if (
        value.includes("cola") ||
        value.includes("coke") ||
        value.includes("pepsi")
    ) {
        return DISH_IMAGES.cola;
    }
    if (
        value.includes("sprite") ||
        value.includes("fanta") ||
        value.includes("soda") ||
        value.includes("juice") ||
        value.includes("water") ||
        value.includes("drink") ||
        value.includes("beverage")
    ) {
        return DISH_IMAGES.sprite;
    }
    return undefined;
}
