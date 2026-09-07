import type { StationId } from "@/domains/fulfillment/domain/station";
import type { ModifierGroup } from "@/domains/catalog/domain/modifiers";
import { DISH_IMAGES } from "@/lib/media";

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    stationId: StationId;
    expectedPreparationMinutes: number;
    available: boolean;
    image?: string;
    modifierGroups: ModifierGroup[];
}

const PIZZA_HOLD: ModifierGroup = {
    id: "pizza-hold",
    name: "Hold",
    kind: "included",
    min: 0,
    max: 3,
    options: [
        {
            id: "tomato",
            name: "Tomato",
            ticketLabel: "No tomato",
            priceDelta: 0,
        },
        {
            id: "peppers",
            name: "Peppers",
            ticketLabel: "No peppers",
            priceDelta: 0,
        },
        {
            id: "mozzarella",
            name: "Mozzarella",
            ticketLabel: "No mozzarella",
            priceDelta: 0,
        },
    ],
};

const PIZZA_ADD: ModifierGroup = {
    id: "pizza-add",
    name: "Add",
    kind: "extra",
    min: 0,
    max: 3,
    options: [
        {
            id: "extra-cheese",
            name: "Extra cheese",
            ticketLabel: "Extra cheese",
            priceDelta: 40,
        },
        {
            id: "chili",
            name: "Chili",
            ticketLabel: "Chili",
            priceDelta: 0,
        },
        {
            id: "olives",
            name: "Olives",
            ticketLabel: "Olives",
            priceDelta: 25,
        },
    ],
};

const BURGER_HOLD: ModifierGroup = {
    id: "burger-hold",
    name: "Hold",
    kind: "included",
    min: 0,
    max: 3,
    options: [
        {
            id: "tomato",
            name: "Tomato",
            ticketLabel: "No tomato",
            priceDelta: 0,
        },
        {
            id: "onion",
            name: "Onion",
            ticketLabel: "No onion",
            priceDelta: 0,
        },
        {
            id: "pickle",
            name: "Pickle",
            ticketLabel: "No pickle",
            priceDelta: 0,
        },
    ],
};

const BURGER_ADD: ModifierGroup = {
    id: "burger-add",
    name: "Add",
    kind: "extra",
    min: 0,
    max: 2,
    options: [
        {
            id: "extra-cheese",
            name: "Extra cheese",
            ticketLabel: "Extra cheese",
            priceDelta: 30,
        },
        {
            id: "extra-patty",
            name: "Extra patty",
            ticketLabel: "Extra patty",
            priceDelta: 80,
        },
    ],
};

const PASTA_HOLD: ModifierGroup = {
    id: "pasta-hold",
    name: "Hold",
    kind: "included",
    min: 0,
    max: 2,
    options: [
        {
            id: "tomato",
            name: "Tomato",
            ticketLabel: "No tomato",
            priceDelta: 0,
        },
        {
            id: "broccoli",
            name: "Broccoli",
            ticketLabel: "No broccoli",
            priceDelta: 0,
        },
    ],
};

const SALAD_HOLD: ModifierGroup = {
    id: "salad-hold",
    name: "Hold",
    kind: "included",
    min: 0,
    max: 2,
    options: [
        {
            id: "tomato",
            name: "Tomato",
            ticketLabel: "No tomato",
            priceDelta: 0,
        },
        {
            id: "onion",
            name: "Onion",
            ticketLabel: "No onion",
            priceDelta: 0,
        },
    ],
};

const MILK_CHOICE: ModifierGroup = {
    id: "drink-milk",
    name: "Milk",
    kind: "choice",
    min: 0,
    max: 1,
    options: [
        {
            id: "regular",
            name: "Regular",
            ticketLabel: "Regular milk",
            priceDelta: 0,
        },
        {
            id: "oat",
            name: "Oat",
            ticketLabel: "Oat milk",
            priceDelta: 20,
        },
        {
            id: "almond",
            name: "Almond",
            ticketLabel: "Almond milk",
            priceDelta: 20,
        },
    ],
};

const SUGAR_CHOICE: ModifierGroup = {
    id: "drink-sugar",
    name: "Sugar",
    kind: "choice",
    min: 0,
    max: 1,
    options: [
        {
            id: "none",
            name: "None",
            ticketLabel: "No sugar",
            priceDelta: 0,
        },
        {
            id: "normal",
            name: "Normal",
            ticketLabel: "Normal sugar",
            priceDelta: 0,
        },
        {
            id: "extra",
            name: "Extra",
            ticketLabel: "Extra sugar",
            priceDelta: 0,
        },
    ],
};

export function unitPriceFor(
    item: MenuItem,
    modifiers: { priceDelta: number }[],
): number {
    return (
        item.price +
        modifiers.reduce((sum, entry) => sum + entry.priceDelta, 0)
    );
}

export const DEMO_MENU: MenuItem[] = [
    {
        id: "menu-burger",
        name: "Cheeseburger",
        description: "Double patty, cheddar, house sauce",
        category: "Kitchen",
        price: 280,
        stationId: "station-kitchen",
        expectedPreparationMinutes: 12,
        available: true,
        image: DISH_IMAGES.burger,
        modifierGroups: [BURGER_HOLD, BURGER_ADD],
    },
    {
        id: "menu-pizza",
        name: "Fire pizza",
        description: "Mozzarella, peppers, wood-fired crust",
        category: "Kitchen",
        price: 320,
        stationId: "station-kitchen",
        expectedPreparationMinutes: 14,
        available: true,
        image: DISH_IMAGES.pizza,
        modifierGroups: [PIZZA_HOLD, PIZZA_ADD],
    },
    {
        id: "menu-pasta",
        name: "Spaghetti pomodoro",
        description: "Tomato, broccoli, parmesan",
        category: "Kitchen",
        price: 240,
        stationId: "station-kitchen",
        expectedPreparationMinutes: 11,
        available: true,
        image: DISH_IMAGES.pasta,
        modifierGroups: [PASTA_HOLD],
    },
    {
        id: "menu-salad",
        name: "Garden Salad",
        description: "Greens, tomato, lemon dressing",
        category: "Kitchen",
        price: 160,
        stationId: "station-kitchen",
        expectedPreparationMinutes: 8,
        available: true,
        image: DISH_IMAGES.salad,
        modifierGroups: [SALAD_HOLD],
    },
    {
        id: "menu-macchiato",
        name: "Macchiato",
        description: "Double shot, steamed milk",
        category: "Barista",
        price: 90,
        stationId: "station-barista",
        expectedPreparationMinutes: 5,
        available: true,
        image: DISH_IMAGES.macchiato,
        modifierGroups: [MILK_CHOICE, SUGAR_CHOICE],
    },
    {
        id: "menu-latte",
        name: "Latte",
        description: "Espresso with steamed milk",
        category: "Barista",
        price: 110,
        stationId: "station-barista",
        expectedPreparationMinutes: 5,
        available: true,
        image: DISH_IMAGES.latte,
        modifierGroups: [MILK_CHOICE, SUGAR_CHOICE],
    },
    {
        id: "menu-cake",
        name: "Cheesecake",
        description: "New York style slice",
        category: "Cakes",
        price: 150,
        stationId: "station-cakes",
        expectedPreparationMinutes: 4,
        available: true,
        image: DISH_IMAGES.cheesecake,
        modifierGroups: [],
    },
    {
        id: "menu-tiramisu",
        name: "Tiramisu",
        description: "Coffee-soaked sponge",
        category: "Cakes",
        price: 170,
        stationId: "station-cakes",
        expectedPreparationMinutes: 4,
        available: true,
        image: DISH_IMAGES.tiramisu,
        modifierGroups: [],
    },
    {
        id: "menu-cola",
        name: "Cola",
        description: "Chilled bottle",
        category: "Soft Drinks",
        price: 45,
        stationId: "station-soft-drinks",
        expectedPreparationMinutes: 2,
        available: true,
        image: DISH_IMAGES.cola,
        modifierGroups: [],
    },
    {
        id: "menu-sprite",
        name: "Sprite",
        description: "Chilled bottle",
        category: "Soft Drinks",
        price: 45,
        stationId: "station-soft-drinks",
        expectedPreparationMinutes: 2,
        available: true,
        image: DISH_IMAGES.sprite,
        modifierGroups: [],
    },
];
