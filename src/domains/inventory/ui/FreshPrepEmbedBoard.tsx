"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    Check,
    ChefHat,
    ChevronDown,
    ExternalLink,
    Filter,
    History,
    Info,
    Leaf,
    Minus,
    Moon,
    PenLine,
    Plus,
    RefreshCw,
    Search,
    ShoppingBag,
    Snowflake,
    Sun,
    Trash2,
    Truck,
    Utensils,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useTheme } from "@/components/theme/ThemeProvider";

import {
    AvocadoCartoon,
    BeefCartoon,
    BurgerCartoon,
    ButterPotCartoon,
    CabbageCartoon,
    CarrotCartoon,
    CheeseCartoon,
    ChickenBreastCartoon,
    ChiliPepperCartoon,
    CookingOilCartoon,
    CubesCutCartoon,
    CucumberCartoon,
    EggsCartoon,
    EthiopianTibsCartoon,
    FishCartoon,
    GarlicCartoon,
    GingerCartoon,
    GreenPepperCartoon,
    HerbsCartoon,
    JulienneCutCartoon,
    LemonCartoon,
    MeatCartoon,
    MincedCutCartoon,
    OrangeCartoon,
    PotatoesCartoon,
    ReadyToCookCartoon,
    RedOnionCartoon,
    SauceJarCartoon,
    SlicesCutCartoon,
    SpicesCartoon,
    SteaksCutCartoon,
    StripsCutCartoon,
    TomatoCartoon,
    WholeCutCartoon,
} from "./freshPrepCartoons";

const CLAUDE_ARTIFACT_URL = "https://claude.ai/artifact/WNRn5QzTZ52uGoxvxjBXcH";

export interface PrepCutStyle {
    id: string;
    name: string;
    spec: string;
    description: string;
    surchargePerKg: number;
    cartoonType:
        | "steaks"
        | "cubes"
        | "strips"
        | "minced"
        | "julienne"
        | "slices"
        | "whole";
}

export interface PrepTrimmingOption {
    id: string;
    name: string;
    surchargePerKg: number;
    yieldPercent: number;
    note?: string;
}

export interface StorefrontProduct {
    id: string;
    name: string;
    amName: string;
    category:
        | "Vegetables"
        | "Fruits"
        | "Herbs and Aromatics"
        | "Potatoes and Root Vegetables"
        | "Meat and Poultry"
        | "Fish and Seafood"
        | "Spices and Seasonings"
        | "Ready-to-Cook Packs"
        | "Burger and Sandwich Ingredients"
        | "Ethiopian Cuisine Packs"
        | "Sauces and Condiments"
        | "Other Kitchen Ingredients";
    categoryTag: string;
    basePricePerKg: number;
    description: string;
    cutsSummary: string;
    isPopular?: boolean;
    isOrderedBefore?: boolean;
    isRawMeat?: boolean;
    renderCartoon: () => React.ReactNode;
    trimmings?: PrepTrimmingOption[];
    cutStyles: PrepCutStyle[];
}

export interface CartLineItem {
    id: string;
    productId: string;
    productName: string;
    productAmName: string;
    weightGrams: number;
    quantityPcs?: number;
    portionUnit?: string;
    unitPrice?: number;
    fatType?: string;
    heatLevel?: string;
    packagingType?: string;
    prepPackingCost?: number;
    trimmingName?: string;
    cutName: string;
    pricePerKg: number;
    lineTotal: number;
    renderCartoon: () => React.ReactNode;
}

export interface CompletedOrder {
    id: string;
    createdAt: string;
    deliveryShift: string;
    destinationStation: string;
    items: CartLineItem[];
    totalAmount: number;
    status: string;
    isSample?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS (Comprehensive catalog covering all 12 categories)
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS: StorefrontProduct[] = [
    // ── 1. VEGETABLES ──
    {
        id: "red-onion",
        name: "Red onion",
        amName: "ቀይ ሽንኩርት",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 90,
        description:
            "The base of almost every wot and tibs. Local red onion, sorted by size.",
        cutsSummary: "Peel · Dice · Slice · Strips · 11 cuts",
        isPopular: true,
        isOrderedBefore: true,
        renderCartoon: () => <RedOnionCartoon className="size-28" />,
        cutStyles: [
            {
                id: "fine-dice",
                name: "Fine Dice",
                spec: "4 mm",
                description: "Uniform dice for wot sauce base and dressings.",
                surchargePerKg: 10,
                cartoonType: "cubes",
            },
            {
                id: "med-dice",
                name: "Medium Dice",
                spec: "10 mm",
                description: "Even cubes for stews and sauteing.",
                surchargePerKg: 8,
                cartoonType: "cubes",
            },
            {
                id: "strips",
                name: "Strips / Slices",
                spec: "about 1 × 5 cm",
                description: "Thin crescent slices for tibs and salads.",
                surchargePerKg: 6,
                cartoonType: "strips",
            },
            {
                id: "whole-peeled",
                name: "Whole Peeled",
                spec: "Root trimmed",
                description: "100% skinless whole bulbs.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "tomato",
        name: "Tomato",
        amName: "ቲማቲም",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 80,
        description:
            "Firm, ripe salad and cooking tomatoes. Ripeness chosen for your use.",
        cutsSummary: "Peel · Dice · Slice · 10 cuts",
        isPopular: true,
        renderCartoon: () => <TomatoCartoon className="size-28" />,
        cutStyles: [
            {
                id: "burger-slices",
                name: "Burger / Salad Slices",
                spec: "5 mm",
                description: "Thick round slices for burgers and fresh salads.",
                surchargePerKg: 8,
                cartoonType: "slices",
            },
            {
                id: "diced",
                name: "Diced",
                spec: "10 mm",
                description: "Firm dice for salsa, sils, and sauces.",
                surchargePerKg: 6,
                cartoonType: "cubes",
            },
            {
                id: "crush-puree",
                name: "Crushed Puree",
                spec: "De-seeded",
                description: "Smooth sauce base ready for stews.",
                surchargePerKg: 8,
                cartoonType: "minced",
            },
        ],
    },
    {
        id: "green-pepper",
        name: "Green pepper",
        amName: "ቃሪያ",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 120,
        description: "Green bell-type pepper for tibs, salads and pizza.",
        cutsSummary: "Peel · Dice · Slice · Strips · 8 cuts",
        isPopular: true,
        isOrderedBefore: true,
        renderCartoon: () => <GreenPepperCartoon className="size-28" />,
        cutStyles: [
            {
                id: "rings",
                name: "Sliced Rings",
                spec: "4 mm",
                description: "Circular slices for tibs toppings and salads.",
                surchargePerKg: 8,
                cartoonType: "slices",
            },
            {
                id: "minced-karia",
                name: "Seedless Mince",
                spec: "2 mm",
                description: "Fine minced pepper for kitfo and sauces.",
                surchargePerKg: 10,
                cartoonType: "minced",
            },
            {
                id: "strips",
                name: "Fajita Strips",
                spec: "about 1 × 5 cm",
                description: "Long crisp strips for sauteing.",
                surchargePerKg: 8,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "carrot",
        name: "Carrot",
        amName: "ካሮት",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 70,
        description: "Sweet, crunchy carrots for stews, salads and juices.",
        cutsSummary: "Peel · Dice · Slice · Strips · 10 cuts",
        isPopular: true,
        renderCartoon: () => <CarrotCartoon className="size-28" />,
        cutStyles: [
            {
                id: "julienne",
                name: "Julienne Matchsticks",
                spec: "2 × 2 mm",
                description: "Crisp thin matchsticks for stir fry and slaw.",
                surchargePerKg: 10,
                cartoonType: "strips",
            },
            {
                id: "coins",
                name: "Coin Slices",
                spec: "5 mm",
                description: "Circular coins for vegetable stews.",
                surchargePerKg: 6,
                cartoonType: "slices",
            },
            {
                id: "diced",
                name: "Small Dice",
                spec: "6 mm",
                description: "Precision dice for rice and soups.",
                surchargePerKg: 8,
                cartoonType: "cubes",
            },
        ],
    },
    {
        id: "cabbage",
        name: "Green Cabbage",
        amName: "ጥቅል ጎመን",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 55,
        description:
            "Fresh tightly head highland cabbage, washed and core-trimmed.",
        cutsSummary: "Shred · Wedges · Rough cut",
        isPopular: true,
        renderCartoon: () => <CabbageCartoon className="size-28" />,
        cutStyles: [
            {
                id: "shredded",
                name: "Fine Shredded",
                spec: "3 mm",
                description: "Fine coleslaw and saute shred.",
                surchargePerKg: 6,
                cartoonType: "strips",
            },
            {
                id: "stew-wedges",
                name: "Stew Wedges",
                spec: "Quarter head",
                description: "Hearty wedges for Ethiopian tikil gomen.",
                surchargePerKg: 4,
                cartoonType: "slices",
            },
            {
                id: "whole-cored",
                name: "Whole Cored",
                spec: "Core removed",
                description: "Trimmed outer leaves and core extracted.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "cucumber",
        name: "Fresh Cucumber",
        amName: "ኪያር",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 85,
        description:
            "Crisp, hydrated field cucumbers for fresh kitchen salads and garnishes.",
        cutsSummary: "Slices · Sticks · Diced",
        isPopular: true,
        renderCartoon: () => <CucumberCartoon className="size-28" />,
        cutStyles: [
            {
                id: "thin-wheels",
                name: "Thin Salad Wheels",
                spec: "2 mm",
                description: "Uniform slices for table salads and burgers.",
                surchargePerKg: 6,
                cartoonType: "slices",
            },
            {
                id: "batons",
                name: "Snack Batons",
                spec: "1 × 6 cm",
                description: "Crisp cucumber spears for dipping platters.",
                surchargePerKg: 8,
                cartoonType: "strips",
            },
            {
                id: "diced",
                name: "Salad Dice",
                spec: "8 mm",
                description: "Cubes for Greek and Mediterranean salad bowls.",
                surchargePerKg: 6,
                cartoonType: "cubes",
            },
        ],
    },
    {
        id: "lettuce",
        name: "Romaine Lettuce",
        amName: "ሰላጣ",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 60,
        description:
            "Crisp leafy salad greens, ozone-sanitized and spin-dried.",
        cutsSummary: "Chopped · Whole leaf · Shredded",
        renderCartoon: () => <HerbsCartoon className="size-28" />,
        cutStyles: [
            {
                id: "chopped",
                name: "Bite-size Chopped",
                spec: "2 × 2 cm",
                description: "Ready to toss table salad cuts.",
                surchargePerKg: 6,
                cartoonType: "slices",
            },
            {
                id: "burger-leaves",
                name: "Burger Whole Leaves",
                spec: "Trimmed stem",
                description: "Selected flat leaves for sandwich layering.",
                surchargePerKg: 8,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "beetroot",
        name: "Red Beetroot",
        amName: "ቀይ ስር",
        category: "Vegetables",
        categoryTag: "VEGETABLES",
        basePricePerKg: 65,
        description:
            "Deep red highland beets, soil-scrubbed and peeled ready to cook.",
        cutsSummary: "Peeled · Julienne · Coins",
        renderCartoon: () => <RedOnionCartoon className="size-28" />,
        cutStyles: [
            {
                id: "julienne",
                name: "Beet Julienne",
                spec: "3 mm matchstick",
                description: "Slaw and salad matchsticks.",
                surchargePerKg: 8,
                cartoonType: "strips",
            },
            {
                id: "coins",
                name: "Steamed Coins",
                spec: "6 mm slices",
                description: "Standard rounds for key sir wot.",
                surchargePerKg: 6,
                cartoonType: "slices",
            },
            {
                id: "whole-peeled",
                name: "Whole Peeled",
                spec: "Root trimmed",
                description: "Ready for roasting and pickling.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },

    // ── 2. FRUITS ──
    {
        id: "avocado",
        name: "Avocado",
        amName: "አቮካዶ",
        category: "Fruits",
        categoryTag: "FRUITS",
        basePricePerKg: 110,
        description:
            "Ripened to your delivery day for layered spris juice and salads.",
        cutsSummary: "Peel · Dice · Slice · Mince · 5 cuts",
        isPopular: true,
        renderCartoon: () => <AvocadoCartoon className="size-28" />,
        cutStyles: [
            {
                id: "halved-pitted",
                name: "Halved & Pitted",
                spec: "Peeled",
                description: "Clean avocado halves ready to slice.",
                surchargePerKg: 8,
                cartoonType: "whole",
            },
            {
                id: "cubes",
                name: "Diced Cubes",
                spec: "15 mm",
                description: "Firm cubes for salad bowls and spris.",
                surchargePerKg: 12,
                cartoonType: "cubes",
            },
            {
                id: "slices",
                name: "Crescent Slices",
                spec: "5 mm",
                description: "Smooth slices for toast and platters.",
                surchargePerKg: 10,
                cartoonType: "slices",
            },
        ],
    },
    {
        id: "mango",
        name: "Mango",
        amName: "ማንጎ",
        category: "Fruits",
        categoryTag: "FRUITS",
        basePricePerKg: 110,
        description: "Ripe mangoes for juice bars and desserts.",
        cutsSummary: "Peel · Dice · Slice · 5 cuts",
        isPopular: true,
        renderCartoon: () => <OrangeCartoon className="size-28" />,
        cutStyles: [
            {
                id: "cubes",
                name: "Mango Cubes",
                spec: "15 mm",
                description: "Fresh fruit cubes for spris and fruit bowls.",
                surchargePerKg: 10,
                cartoonType: "cubes",
            },
            {
                id: "cheeks",
                name: "Peeled Cheeks",
                spec: "Pitted",
                description: "Smooth mango fillets ready to blend.",
                surchargePerKg: 6,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "lemon",
        name: "Fresh Lemon",
        amName: "ሎሚ",
        category: "Fruits",
        categoryTag: "FRUITS",
        basePricePerKg: 85,
        description: "Juicy local lemons, washed, sanitized and sorted.",
        cutsSummary: "Wedges · Slices · Whole · 3 cuts",
        isPopular: true,
        renderCartoon: () => <LemonCartoon className="size-28" />,
        cutStyles: [
            {
                id: "wedges",
                name: "Lemon Wedges",
                spec: "6 per lemon",
                description: "Bar and seafood garnish wedges.",
                surchargePerKg: 8,
                cartoonType: "slices",
            },
            {
                id: "slices",
                name: "Thin Slices",
                spec: "3 mm",
                description: "Clean wheels for beverages and fish.",
                surchargePerKg: 10,
                cartoonType: "slices",
            },
        ],
    },
    {
        id: "orange",
        name: "Valencia Oranges",
        amName: "ብርቱካን",
        category: "Fruits",
        categoryTag: "FRUITS",
        basePricePerKg: 120,
        description:
            "Juicy sweet oranges for breakfast juice stations and fruit cuts.",
        cutsSummary: "Halves · Slices · Whole",
        isPopular: true,
        renderCartoon: () => <OrangeCartoon className="size-28" />,
        cutStyles: [
            {
                id: "juicing-halves",
                name: "Juicing Halves",
                spec: "Halved",
                description: "Ready for electric citrus press.",
                surchargePerKg: 4,
                cartoonType: "slices",
            },
            {
                id: "smile-wedges",
                name: "Smile Wedges",
                spec: "8 wedges",
                description: "Fruit platters and buffet setup.",
                surchargePerKg: 8,
                cartoonType: "slices",
            },
        ],
    },
    {
        id: "papaya",
        name: "Sweet Papaya",
        amName: "ፓፓያ",
        category: "Fruits",
        categoryTag: "FRUITS",
        basePricePerKg: 95,
        description:
            "Golden sweet papaya, seeded and peeled for fresh juice bars.",
        cutsSummary: "Seeded · Chunks · Halves",
        renderCartoon: () => <OrangeCartoon className="size-28" />,
        cutStyles: [
            {
                id: "cubes",
                name: "Smoothie Chunks",
                spec: "25 mm",
                description: "Ready to blend for spris.",
                surchargePerKg: 8,
                cartoonType: "cubes",
            },
            {
                id: "boat-halves",
                name: "Peeled Halves",
                spec: "De-seeded",
                description: "Breakfast fruit boats.",
                surchargePerKg: 6,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "banana",
        name: "Fresh Bananas",
        amName: "ሙዝ",
        category: "Fruits",
        categoryTag: "FRUITS",
        basePricePerKg: 80,
        description: "Selected Cavendish bananas from southern Ethiopia.",
        cutsSummary: "Peeled slices · Bunches",
        renderCartoon: () => <LemonCartoon className="size-28" />,
        cutStyles: [
            {
                id: "slices",
                name: "Fruit Slices",
                spec: "6 mm",
                description: "Dessert and pancake topping.",
                surchargePerKg: 6,
                cartoonType: "slices",
            },
            {
                id: "whole-bunch",
                name: "Fresh Bunch",
                spec: "Standard hand",
                description: "Clean sorted fruit hands.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },

    // ── 3. HERBS AND AROMATICS ──
    {
        id: "garlic",
        name: "Peeled Garlic",
        amName: "የተላጠ ነጭ ሽንኩርት",
        category: "Herbs and Aromatics",
        categoryTag: "HERBS AND AROMATICS",
        basePricePerKg: 195,
        description:
            "Fresh peeled garlic cloves, root-trimmed and ready to saute.",
        cutsSummary: "Cloves · Mince · Paste · 3 cuts",
        isPopular: true,
        renderCartoon: () => <GarlicCartoon className="size-28" />,
        cutStyles: [
            {
                id: "whole-cloves",
                name: "Whole Cloves",
                spec: "Clean peeled",
                description: "Skinless whole garlic cloves.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "minced",
                name: "Fine Minced",
                spec: "2 mm",
                description: "Fine mince for dressings and stews.",
                surchargePerKg: 12,
                cartoonType: "minced",
            },
            {
                id: "paste",
                name: "Puree Paste",
                spec: "Smooth",
                description: "Garlic puree blend with zero additives.",
                surchargePerKg: 15,
                cartoonType: "minced",
            },
        ],
    },
    {
        id: "ginger",
        name: "Fresh Ginger Root",
        amName: "ዝንጅብል",
        category: "Herbs and Aromatics",
        categoryTag: "HERBS AND AROMATICS",
        basePricePerKg: 140,
        description:
            "Fresh ginger from Wolaita, skin scrubbed and ready for prep.",
        cutsSummary: "Peeled mince · Sliced · Paste",
        isPopular: true,
        renderCartoon: () => <GingerCartoon className="size-28" />,
        cutStyles: [
            {
                id: "minced",
                name: "Fine Minced Ginger",
                spec: "1 mm",
                description: "Key component for Ethiopian wot bases.",
                surchargePerKg: 15,
                cartoonType: "minced",
            },
            {
                id: "slices",
                name: "Coin Slices",
                spec: "2 mm",
                description: "Infusion slices for teas and broths.",
                surchargePerKg: 10,
                cartoonType: "slices",
            },
            {
                id: "paste",
                name: "Garlic-Ginger Blend",
                spec: "50/50 mix",
                description: "Traditional Ethiopian cooking paste.",
                surchargePerKg: 18,
                cartoonType: "minced",
            },
        ],
    },
    {
        id: "rosemary",
        name: "Fresh Rosemary Sprigs",
        amName: "ሮዝመሪ (የጥብስ ቅጠል)",
        category: "Herbs and Aromatics",
        categoryTag: "HERBS AND AROMATICS",
        basePricePerKg: 150,
        description:
            "Fragrant fresh rosemary essential for authentic Ethiopian tibs.",
        cutsSummary: "Whole sprigs · De-stemmed leaves",
        isPopular: true,
        renderCartoon: () => <HerbsCartoon className="size-28" />,
        cutStyles: [
            {
                id: "sprigs",
                name: "Whole Sprigs",
                spec: "10 cm sprigs",
                description: "Sizzling pan garnish for tibs and roasts.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "de-stemmed",
                name: "De-stemmed Needles",
                spec: "Leaves only",
                description: "Pre-plucked needles for marinades.",
                surchargePerKg: 20,
                cartoonType: "minced",
            },
        ],
    },
    {
        id: "parsley-cilantro",
        name: "Parsley & Cilantro Bunch",
        amName: "ፐርስሊና ድንብላል",
        category: "Herbs and Aromatics",
        categoryTag: "HERBS AND AROMATICS",
        basePricePerKg: 110,
        description:
            "Crisp Italian flat parsley and fresh cilantro, ozone-washed.",
        cutsSummary: "Fine chop · Clean sprigs",
        renderCartoon: () => <HerbsCartoon className="size-28" />,
        cutStyles: [
            {
                id: "fine-chop",
                name: "Kitchen Fine Chop",
                spec: "Herb mince",
                description: "Zero stems, ready for finishing plates.",
                surchargePerKg: 15,
                cartoonType: "minced",
            },
            {
                id: "whole-bunches",
                name: "Tied Bunches",
                spec: "Washed & spun",
                description: "Tied bunches for stock pots.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "fresh-basil",
        name: "Sweet Italian Basil",
        amName: "ባሲል",
        category: "Herbs and Aromatics",
        categoryTag: "HERBS AND AROMATICS",
        basePricePerKg: 160,
        description:
            "Aromatic sweet basil for pasta, pizzas, and fresh pestos.",
        cutsSummary: "Chiffonade · Whole leaves",
        renderCartoon: () => <HerbsCartoon className="size-28" />,
        cutStyles: [
            {
                id: "whole-leaves",
                name: "Picked Whole Leaves",
                spec: "Stem-free",
                description: "Pizza garnish and Caprese salad.",
                surchargePerKg: 12,
                cartoonType: "whole",
            },
            {
                id: "chiffonade",
                name: "Chiffonade Ribbons",
                spec: "3 mm ribbons",
                description: "Pasta and soup finishing ribbons.",
                surchargePerKg: 18,
                cartoonType: "strips",
            },
        ],
    },

    // ── 4. POTATOES AND ROOT VEGETABLES ──
    {
        id: "potato",
        name: "Potatoes",
        amName: "ድንች",
        category: "Potatoes and Root Vegetables",
        categoryTag: "ROOT VEGETABLES",
        basePricePerKg: 65,
        description:
            "Peeled highland potatoes, packed in cold water to prevent browning.",
        cutsSummary: "Fry cut · Cubes · Whole · 4 cuts",
        isPopular: true,
        isOrderedBefore: true,
        renderCartoon: () => <PotatoesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "french-fry",
                name: "French Fry Cut",
                spec: "9 mm",
                description: "Standard cut fry batons ready for the fryer.",
                surchargePerKg: 8,
                cartoonType: "strips",
            },
            {
                id: "cubes",
                name: "Stew Cubes",
                spec: "20 mm",
                description: "Hearty potato chunks for dinich wot stews.",
                surchargePerKg: 6,
                cartoonType: "cubes",
            },
            {
                id: "whole-peeled",
                name: "Whole Peeled",
                spec: "In water",
                description: "Peeled whole potatoes in clean water tubs.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "sweet-potato",
        name: "Sweet Potatoes",
        amName: "ስኳር ድንች",
        category: "Potatoes and Root Vegetables",
        categoryTag: "ROOT VEGETABLES",
        basePricePerKg: 75,
        description:
            "Orange-fleshed sweet potatoes, rich in vitamins and natural sweetness.",
        cutsSummary: "Fry cut · Cubes · Whole peeled",
        isPopular: true,
        renderCartoon: () => <PotatoesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "sweet-fries",
                name: "Sweet Potato Fry Cut",
                spec: "10 mm",
                description: "Crisp fry batons for gourmet burger menus.",
                surchargePerKg: 10,
                cartoonType: "strips",
            },
            {
                id: "roast-cubes",
                name: "Roast Cubes",
                spec: "25 mm",
                description: "Oven roast root vegetables.",
                surchargePerKg: 8,
                cartoonType: "cubes",
            },
        ],
    },
    {
        id: "white-radish",
        name: "White Radish (Daikon)",
        amName: "ሙሊ",
        category: "Potatoes and Root Vegetables",
        categoryTag: "ROOT VEGETABLES",
        basePricePerKg: 90,
        description:
            "Crisp white radishes for pickling, salads, and Asian broth bases.",
        cutsSummary: "Julienne · Coins · Grated",
        renderCartoon: () => <CarrotCartoon className="size-28" />,
        cutStyles: [
            {
                id: "julienne",
                name: "Matchstick Julienne",
                spec: "2 mm",
                description: "Pickled garnish for sandwiches.",
                surchargePerKg: 10,
                cartoonType: "strips",
            },
            {
                id: "coins",
                name: "Thin Radish Rounds",
                spec: "2 mm",
                description: "Salad crunch garnish.",
                surchargePerKg: 8,
                cartoonType: "slices",
            },
        ],
    },
    {
        id: "cassava-root",
        name: "Cassava / Tapioca",
        amName: "ካሳቫ",
        category: "Potatoes and Root Vegetables",
        categoryTag: "ROOT VEGETABLES",
        basePricePerKg: 85,
        description:
            "Clean peeled cassava chunks, vacuum-sealed ready for boiling or frying.",
        cutsSummary: "Fritter batons · Boiled chunks",
        renderCartoon: () => <PotatoesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "batons",
                name: "Yucca Fry Batons",
                spec: "15 mm",
                description: "Deep-fry yucca fries.",
                surchargePerKg: 10,
                cartoonType: "strips",
            },
            {
                id: "stew-chunks",
                name: "Stew Chunks",
                spec: "30 mm",
                description: "Hearty starchy broth chunks.",
                surchargePerKg: 6,
                cartoonType: "cubes",
            },
        ],
    },

    // ── 5. MEAT AND POULTRY ──
    {
        id: "beef",
        name: "Beef",
        amName: "የበሬ ስጋ",
        category: "Meat and Poultry",
        categoryTag: "MEAT",
        basePricePerKg: 950,
        description:
            "Fresh local beef from licensed abattoirs. Trimmed and cut to your recipe.",
        cutsSummary: "Trim · Dice · Strips · Mince · 4 cuts",
        isPopular: true,
        isOrderedBefore: true,
        isRawMeat: true,
        renderCartoon: () => <MeatCartoon className="size-28" />,
        trimmings: [
            {
                id: "as-butchered",
                name: "As butchered",
                surchargePerKg: 0,
                yieldPercent: 100,
            },
            {
                id: "trim-fat",
                name: "Trim excess visible fat",
                surchargePerKg: 25,
                yieldPercent: 90,
            },
            {
                id: "custom-trim",
                name: "Custom trimming instructions",
                surchargePerKg: 30,
                yieldPercent: 88,
                note: "Describe it in Special instructions.",
            },
        ],
        cutStyles: [
            {
                id: "steaks",
                name: "Steaks / portions",
                spec: "150–250 g each",
                description: "Cut into even portions by weight.",
                surchargePerKg: 35,
                cartoonType: "steaks",
            },
            {
                id: "cubes",
                name: "Cubes",
                spec: "20–25 mm",
                description: "Even cubes for tibs, stews and skewers.",
                surchargePerKg: 40,
                cartoonType: "cubes",
            },
            {
                id: "strips",
                name: "Strips",
                spec: "about 1 × 5 cm",
                description: "Thin strips for tibs, stir-fry and fajitas.",
                surchargePerKg: 45,
                cartoonType: "strips",
            },
            {
                id: "minced",
                name: "Minced",
                spec: "Ground beef",
                description: "Uniform ground meat for kitfo and sauces.",
                surchargePerKg: 30,
                cartoonType: "minced",
            },
        ],
    },
    {
        id: "chicken-breast",
        name: "Chicken breast",
        amName: "የዶሮ ስጋ",
        category: "Meat and Poultry",
        categoryTag: "MEAT",
        basePricePerKg: 900,
        description:
            "Boneless breast fillets for grills, sandwiches and salads.",
        cutsSummary: "Trim · Dice · Strips · Mince · 5 cuts",
        isPopular: true,
        isRawMeat: true,
        renderCartoon: () => <ChickenBreastCartoon className="size-28" />,
        trimmings: [
            {
                id: "as-butchered",
                name: "As butchered",
                surchargePerKg: 0,
                yieldPercent: 100,
            },
            {
                id: "clean-trim",
                name: "Clean trimmed fillet",
                surchargePerKg: 20,
                yieldPercent: 92,
            },
        ],
        cutStyles: [
            {
                id: "fillets",
                name: "Butterfly Fillets",
                spec: "150 g",
                description: "Even thickness for quick grilling.",
                surchargePerKg: 25,
                cartoonType: "steaks",
            },
            {
                id: "cubes",
                name: "Chicken Cubes",
                spec: "20 mm",
                description: "Juicy breast cubes for skewers and stir-fry.",
                surchargePerKg: 35,
                cartoonType: "cubes",
            },
            {
                id: "strips",
                name: "Tender Strips",
                spec: "1 × 5 cm",
                description: "Breaded strips or fajitas.",
                surchargePerKg: 35,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "kitfo-minced-beef",
        name: "Kitfo Special Minced Beef",
        amName: "የክትፎ ስጋ",
        category: "Meat and Poultry",
        categoryTag: "MEAT",
        basePricePerKg: 1050,
        description:
            "Ultra-lean topside beef, strictly zero connective tissue, ready for Ethiopian kitfo.",
        cutsSummary: "Hand minced · Fine grind",
        isPopular: true,
        isRawMeat: true,
        renderCartoon: () => <MeatCartoon className="size-28" />,
        cutStyles: [
            {
                id: "hand-mince",
                name: "Traditional Hand Mince",
                spec: "Hand knife chop",
                description: "Authentic texture for kitfo gourmets.",
                surchargePerKg: 50,
                cartoonType: "minced",
            },
            {
                id: "fine-grind",
                name: "Double Ground",
                spec: "3 mm plate",
                description: "Velvety texture for lebleb and kitfo rolls.",
                surchargePerKg: 35,
                cartoonType: "minced",
            },
        ],
    },
    {
        id: "beef-ribeye-tibs",
        name: "Prime Beef Tibs Meat",
        amName: "የጥብስ ስጋ",
        category: "Meat and Poultry",
        categoryTag: "MEAT",
        basePricePerKg: 1100,
        description:
            "Tender aged ribeye & sirloin cuts, perfectly portioned for sizzling pan tibs.",
        cutsSummary: "Tibs cubes · Tender strips",
        isPopular: true,
        isRawMeat: true,
        renderCartoon: () => <MeatCartoon className="size-28" />,
        cutStyles: [
            {
                id: "tibs-cubes",
                name: "Prime Tibs Cubes",
                spec: "20 mm",
                description: "Even sizzle for Awaze and Derek Tibs.",
                surchargePerKg: 40,
                cartoonType: "cubes",
            },
            {
                id: "tibs-strips",
                name: "Sauté Strips",
                spec: "1 × 5 cm",
                description: "Fast-cooking tenderloin strips.",
                surchargePerKg: 45,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "lamb-chops",
        name: "Fresh Lamb Chops",
        amName: "የበግ ጎድን",
        category: "Meat and Poultry",
        categoryTag: "MEAT",
        basePricePerKg: 980,
        description: "Local tender highland lamb chops, rib-cut and portioned.",
        cutsSummary: "Rib chops · Stew cut",
        isRawMeat: true,
        renderCartoon: () => <MeatCartoon className="size-28" />,
        cutStyles: [
            {
                id: "rib-portions",
                name: "Single Rib Chops",
                spec: "Portioned",
                description: "French trimmed rib chops for grill stations.",
                surchargePerKg: 35,
                cartoonType: "steaks",
            },
            {
                id: "stew-pieces",
                name: "Bone-in Stew Cuts",
                spec: "35 mm",
                description: "Rich lamb cuts for Alicha and Kikil broths.",
                surchargePerKg: 20,
                cartoonType: "cubes",
            },
        ],
    },

    // ── 6. FISH AND SEAFOOD ──
    {
        id: "nile-perch",
        name: "Nile Perch Fillet",
        amName: "የናይል ፐርች አሳ",
        category: "Fish and Seafood",
        categoryTag: "SEAFOOD",
        basePricePerKg: 680,
        description:
            "Fresh Lake Tana Nile perch, white firm flesh, pin-bone free.",
        cutsSummary: "Skinless fillet · Portions · Cubes",
        isPopular: true,
        renderCartoon: () => <FishCartoon className="size-28" />,
        cutStyles: [
            {
                id: "fillet-portions",
                name: "Grill Portions",
                spec: "180 g each",
                description: "Uniform fillets for lunch and dinner mains.",
                surchargePerKg: 25,
                cartoonType: "steaks",
            },
            {
                id: "fish-cubes",
                name: "Fish Tibs Cubes",
                spec: "25 mm",
                description: "Firm cubes for spicy Ethiopian fish tibs.",
                surchargePerKg: 30,
                cartoonType: "cubes",
            },
            {
                id: "fish-fingers",
                name: "Breaded Fish Fingers",
                spec: "2 × 8 cm",
                description: "Strips ready for batter and fry station.",
                surchargePerKg: 30,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "tilapia-fillet",
        name: "Fresh Lake Tilapia Fillet",
        amName: "የቆረሶ አሳ",
        category: "Fish and Seafood",
        categoryTag: "SEAFOOD",
        basePricePerKg: 520,
        description:
            "Sweet mild tilapia from Rift Valley lakes, cleaned and butterfly cut.",
        cutsSummary: "Butterfly fillet · Whole scaled",
        isPopular: true,
        renderCartoon: () => <FishCartoon className="size-28" />,
        cutStyles: [
            {
                id: "butterfly-fillet",
                name: "Butterfly Fillet",
                spec: "Skin-on boneless",
                description: "Pan-sear and grill ready with zero bones.",
                surchargePerKg: 20,
                cartoonType: "steaks",
            },
            {
                id: "fish-goujons",
                name: "Crispy Strips",
                spec: "1.5 × 6 cm",
                description: "Fish tacos and sandwich strips.",
                surchargePerKg: 25,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "cleaned-fish",
        name: "Whole Cleaned Fish",
        amName: "የተጸዳ ሙሉ አሳ",
        category: "Fish and Seafood",
        categoryTag: "SEAFOOD",
        basePricePerKg: 480,
        description:
            "Whole lake fish, scaled, gutted and gill-trimmed with diagonal fry scores.",
        cutsSummary: "Scaled & scored · Head-on",
        renderCartoon: () => <FishCartoon className="size-28" />,
        cutStyles: [
            {
                id: "scored-whole",
                name: "Deep-Fry Scored",
                spec: "Cross hatch scored",
                description: "Seasoning penetrates deep into whole fish.",
                surchargePerKg: 15,
                cartoonType: "whole",
            },
            {
                id: "steaks",
                name: "Fish Bone-in Steaks",
                spec: "25 mm rounds",
                description: "Cross-cut steaks for fish wot stews.",
                surchargePerKg: 20,
                cartoonType: "slices",
            },
        ],
    },

    // ── 7. SPICES AND SEASONINGS ──
    {
        id: "berbere-blend",
        name: "Debrezeit Pure Berbere Blend",
        amName: "ንፁህ የደብረዘይት በርበሬ",
        category: "Spices and Seasonings",
        categoryTag: "SPICES",
        basePricePerKg: 380,
        description:
            "Authentic sun-dried sun-ground red chili blend with korarima, ginger, and garlic.",
        cutsSummary: "Fine stone ground powder",
        isPopular: true,
        isOrderedBefore: true,
        renderCartoon: () => <SpicesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "fine-powder",
                name: "Silk Ground Powder",
                spec: "Fine mesh",
                description:
                    "Dissolves cleanly into rich wot bases without grit.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "coarse-blend",
                name: "Rub & Marinade Grind",
                spec: "Medium ground",
                description: "Ideal for meat rubs and BBQ crusts.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "mitmita-spice",
        name: "Spicy Wollo Mitmita",
        amName: "የወሎ ሚጥሚጣ",
        category: "Spices and Seasonings",
        categoryTag: "SPICES",
        basePricePerKg: 450,
        description:
            "Fiery bird's eye chili spice with roasted cloves, cardamom, and sea salt.",
        cutsSummary: "Extra-fine fiery powder",
        isPopular: true,
        renderCartoon: () => <ChiliPepperCartoon className="size-28" />,
        cutStyles: [
            {
                id: "fine-mitmita",
                name: "Table Seasoning Grind",
                spec: "Fine powder",
                description: "Classic kitfo and dulet dipping spice.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "mekelesha-spice",
        name: "Royal Mekelesha Spice Mix",
        amName: "መከለሻ ቅመም",
        category: "Spices and Seasonings",
        categoryTag: "SPICES",
        basePricePerKg: 420,
        description:
            "Aromatic 7-spice finishing blend added during the final 5 minutes of stewing.",
        cutsSummary: "Micro-ground aromatic blend",
        renderCartoon: () => <SpicesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "finishing-powder",
                name: "Finishing Powder",
                spec: "Aromatic blend",
                description:
                    "Adds unforgettable fragrance to Doro Wot and Sega Wot.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "turmeric-erd",
        name: "Ground Turmeric / Pure Erd",
        amName: "ንፁህ እርድ",
        category: "Spices and Seasonings",
        categoryTag: "SPICES",
        basePricePerKg: 260,
        description:
            "Vibrant golden Ethiopian turmeric for alicha wots, rice, and marinades.",
        cutsSummary: "Stone-ground yellow powder",
        renderCartoon: () => <SpicesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "golden-powder",
                name: "Pure Yellow Powder",
                spec: "100% natural",
                description: "Intense natural color and earthy warmth.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "black-pepper",
        name: "Ground Black Pepper",
        amName: "ቁንዶ በርበሬ",
        category: "Spices and Seasonings",
        categoryTag: "SPICES",
        basePricePerKg: 550,
        description:
            "Freshly cracked premium black peppercorns with intense pungency.",
        cutsSummary: "Coarse crack · Table fine",
        renderCartoon: () => <SpicesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "coarse-crack",
                name: "Butcher's Coarse Crack",
                spec: "16 mesh",
                description: "Steak and grill pepper crust.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "table-fine",
                name: "Fine Table Grind",
                spec: "Fine grind",
                description: "Standard kitchen seasoning.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "korarima-spice",
        name: "Ground Korarima (Cardamom)",
        amName: "የተፈጨ ኮረሪማ",
        category: "Spices and Seasonings",
        categoryTag: "SPICES",
        basePricePerKg: 680,
        description:
            "Smoked false cardamom seeds, essential for high-end Ethiopian cuisine.",
        cutsSummary: "Single-origin aromatic grind",
        renderCartoon: () => <SpicesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "seed-grind",
                name: "Pure Seed Grind",
                spec: "De-podded",
                description: "Deep herbal warmth for kitfo and sauces.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },

    // ── 8. READY-TO-COOK PACKS ──
    {
        id: "stir-fry-pack",
        name: "Fresh Stir-Fry Veggie Medley",
        amName: "የአትክልት ቅልቅል (ለስትር ፍራይ)",
        category: "Ready-to-Cook Packs",
        categoryTag: "PREP PACKS",
        basePricePerKg: 180,
        description:
            "Pre-washed, sliced carrots, green peppers, zucchini, red onions and cabbage.",
        cutsSummary: "Ready to toss into high heat wok",
        isPopular: true,
        renderCartoon: () => <ReadyToCookCartoon className="size-28" />,
        cutStyles: [
            {
                id: "wok-cut",
                name: "Wok Ready Cut",
                spec: "Bite size",
                description: "Cooks evenly in under 4 minutes.",
                surchargePerKg: 0,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "soup-base-kit",
        name: "Soup & Stew Mirepoix Base",
        amName: "የሾርባ ቅድመ-ዝግጅት ኪት",
        category: "Ready-to-Cook Packs",
        categoryTag: "PREP PACKS",
        basePricePerKg: 160,
        description:
            "Proportionate dice of red onion, carrot, celery, and garlic ready for stockpot.",
        cutsSummary: "Precision 6mm diced base",
        renderCartoon: () => <ReadyToCookCartoon className="size-28" />,
        cutStyles: [
            {
                id: "fine-dice",
                name: "Chef Mirepoix Dice",
                spec: "6 mm dice",
                description: "Sweats down quickly for rich broth bases.",
                surchargePerKg: 0,
                cartoonType: "cubes",
            },
        ],
    },
    {
        id: "fajita-sliced-mix",
        name: "Fajita Pepper & Onion Mix",
        amName: "የፋሂታ አትክልት ዝግጅት",
        category: "Ready-to-Cook Packs",
        categoryTag: "PREP PACKS",
        basePricePerKg: 210,
        description:
            "Vibrant long strips of red onions, green peppers, and sweet chili peppers.",
        cutsSummary: "Uniform 1cm x 6cm strips",
        isPopular: true,
        renderCartoon: () => <ReadyToCookCartoon className="size-28" />,
        cutStyles: [
            {
                id: "skillet-strips",
                name: "Cast Iron Strips",
                spec: "1 × 6 cm",
                description: "Caramelizes on contact with hot griddles.",
                surchargePerKg: 0,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "french-fries-bucket",
        name: "Pre-Cut French Fries Bucket",
        amName: "የተቆረጠ ድንች በውሃ (ለቺፕስ)",
        category: "Ready-to-Cook Packs",
        categoryTag: "PREP PACKS",
        basePricePerKg: 140,
        description:
            "Highland potatoes cut into 9mm fries, washed free of excess starch in chilled tubs.",
        cutsSummary: "Zero prep, straight to fryer",
        isPopular: true,
        isOrderedBefore: true,
        renderCartoon: () => <ReadyToCookCartoon className="size-28" />,
        cutStyles: [
            {
                id: "regular-9mm",
                name: "Standard 9mm Cut",
                spec: "9 mm batons",
                description: "Crisp outside, fluffy potato inside.",
                surchargePerKg: 0,
                cartoonType: "strips",
            },
            {
                id: "steak-cut",
                name: "Steakhouse Fat Cut",
                spec: "14 mm batons",
                description: "Heavy fries for steak platters.",
                surchargePerKg: 0,
                cartoonType: "strips",
            },
        ],
    },
    {
        id: "salad-toss-kit",
        name: "Mediterranean Salad Toss Kit",
        amName: "የሰላጣ ዝግጅት ኪት",
        category: "Ready-to-Cook Packs",
        categoryTag: "PREP PACKS",
        basePricePerKg: 190,
        description:
            "Chopped romaine, sliced cucumbers, cherry tomatoes, and diced red onions.",
        cutsSummary: "Washed & spin-dried, toss & serve",
        renderCartoon: () => <ReadyToCookCartoon className="size-28" />,
        cutStyles: [
            {
                id: "fresh-toss",
                name: "Ready Toss Cut",
                spec: "Spin dried",
                description: "Includes house vinaigrette packet.",
                surchargePerKg: 0,
                cartoonType: "slices",
            },
        ],
    },
    {
        id: "roasted-roots-pack",
        name: "Oven Roast Root Veggie Medley",
        amName: "ለምድጃ የተዘጋጀ ድንችና ካሮት",
        category: "Ready-to-Cook Packs",
        categoryTag: "PREP PACKS",
        basePricePerKg: 170,
        description:
            "Tumbled potato cubes, sweet potato chunks, carrots, and rosemary sprigs.",
        cutsSummary: "Chunky 25mm cuts, rosemary seasoned",
        renderCartoon: () => <ReadyToCookCartoon className="size-28" />,
        cutStyles: [
            {
                id: "roast-cut",
                name: "Roast Tray Cuts",
                spec: "25 mm chunks",
                description: "Toss with olive oil and bake 30 mins.",
                surchargePerKg: 0,
                cartoonType: "cubes",
            },
        ],
    },

    // ── 9. BURGER AND SANDWICH INGREDIENTS ──
    {
        id: "brioche-buns",
        name: "Bakery Brioche Burger Buns",
        amName: "የበርገር ዳቦ (ብሪዮሽ)",
        category: "Burger and Sandwich Ingredients",
        categoryTag: "BURGER INGREDIENTS",
        basePricePerKg: 65,
        description:
            "Fresh buttery glazed brioche buns, pre-sliced and toasted with golden tops.",
        cutsSummary: "Pre-sliced halves",
        isPopular: true,
        renderCartoon: () => <BurgerCartoon className="size-28" />,
        cutStyles: [
            {
                id: "sliced-bun",
                name: "Pre-sliced Buns",
                spec: "Pack of 4 buns",
                description: "Hinged or split ready for the toaster.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "burger-patty-mix",
        name: "Seasoned Beef Burger Patties",
        amName: "የበርገር ስጋ ቅልቅል",
        category: "Burger and Sandwich Ingredients",
        categoryTag: "BURGER INGREDIENTS",
        basePricePerKg: 890,
        description:
            "80/20 beef-to-fat blend with salt, black pepper, and garlic. Pressed to burger rings.",
        cutsSummary: "Portioned smash patties",
        isPopular: true,
        isRawMeat: true,
        renderCartoon: () => <BurgerCartoon className="size-28" />,
        cutStyles: [
            {
                id: "150g-patty",
                name: "150g Standard Patty",
                spec: "150 g round",
                description: "Classic burger thickness for flat-top grill.",
                surchargePerKg: 20,
                cartoonType: "steaks",
            },
            {
                id: "100g-smash",
                name: "100g Smash Ball",
                spec: "100 g ball",
                description: "Craggy crispy edges on high heat smash grills.",
                surchargePerKg: 15,
                cartoonType: "cubes",
            },
        ],
    },
    {
        id: "cheddar-cheese-pack",
        name: "Gourmet Cheddar Cheese Slices",
        amName: "የቼዳር ቺዝ ቁራጭ",
        category: "Burger and Sandwich Ingredients",
        categoryTag: "BURGER INGREDIENTS",
        basePricePerKg: 720,
        description:
            "Real aged yellow cheddar, pre-sliced with parchment separation.",
        cutsSummary: "Uniform 25g melt slices",
        isPopular: true,
        renderCartoon: () => <CheeseCartoon className="size-28" />,
        cutStyles: [
            {
                id: "sliced-stack",
                name: "Burger Melt Slices",
                spec: "25 g per slice",
                description: "Fast melting over hot burger patties.",
                surchargePerKg: 0,
                cartoonType: "slices",
            },
        ],
    },
    {
        id: "pickled-cucumbers",
        name: "Crinkle Cut Pickled Gherkins",
        amName: "አቸቶ ኪያር (ፒክልስ)",
        category: "Burger and Sandwich Ingredients",
        categoryTag: "BURGER INGREDIENTS",
        basePricePerKg: 240,
        description:
            "Tangy dill cucumber pickle chips with crinkle edges, drained and ready.",
        cutsSummary: "Crinkle sliced chips",
        renderCartoon: () => <CucumberCartoon className="size-28" />,
        cutStyles: [
            {
                id: "crinkle-chips",
                name: "Crinkle Cut Chips",
                spec: "4 mm chips",
                description: "Crisp acidity cuts through rich meat.",
                surchargePerKg: 0,
                cartoonType: "slices",
            },
        ],
    },
    {
        id: "caramelized-onions",
        name: "Slow Caramelized Onion Jam",
        amName: "የበሰለ ቀይ ሽንኩርት (ጃም)",
        category: "Burger and Sandwich Ingredients",
        categoryTag: "BURGER INGREDIENTS",
        basePricePerKg: 320,
        description:
            "Slow-cooked red onions reduced with brown sugar and balsamic vinegar.",
        cutsSummary: "Ready burger & steak spread",
        renderCartoon: () => <RedOnionCartoon className="size-28" />,
        cutStyles: [
            {
                id: "onion-spread",
                name: "Burger Spread Ready",
                spec: "Rich reduction",
                description: "Spoon directly onto warm burger buns.",
                surchargePerKg: 0,
                cartoonType: "minced",
            },
        ],
    },

    // ── 10. ETHIOPIAN CUISINE PACKS ──
    {
        id: "awaze-tibs-pack",
        name: "Awaze Tibs All-in-One Prep Kit",
        amName: "የአዋዜ ጥብስ ዝግጅት ኪት",
        category: "Ethiopian Cuisine Packs",
        categoryTag: "ETHIOPIAN PACKS",
        basePricePerKg: 780,
        description:
            "Pre-cut tender beef cubes, authentic spicy Awaze paste, sliced onions, and karia rings.",
        cutsSummary: "Tibs cubes + sauce + aromatics",
        isPopular: true,
        renderCartoon: () => <EthiopianTibsCartoon className="size-28" />,
        cutStyles: [
            {
                id: "full-kit",
                name: "Complete Tibs Kit",
                spec: "Serves 4 orders",
                description: "Zero chopping needed, straight to hot pan.",
                surchargePerKg: 0,
                cartoonType: "cubes",
            },
        ],
    },
    {
        id: "shiro-starter-pack",
        name: "Shiro Wot Gourmet Starter Kit",
        amName: "የሽሮ ወጥ ዝግጅት ኪት",
        category: "Ethiopian Cuisine Packs",
        categoryTag: "ETHIOPIAN PACKS",
        basePricePerKg: 340,
        description:
            "Spiced sun-ground Shiro powder, fine-diced red onions, minced garlic and niter kibbeh.",
        cutsSummary: "Traditional slow-simmer kit",
        isPopular: true,
        renderCartoon: () => <SpicesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "shiro-pack",
                name: "Standard Shiro Pack",
                spec: "Complete kit",
                description:
                    "Boils into velvety clay-pot shiro wot in 15 mins.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "doro-wot-pack",
        name: "Doro Wot Heritage Prep Kit",
        amName: "የዶሮ ወጥ ዝግጅት ኪት",
        category: "Ethiopian Cuisine Packs",
        categoryTag: "ETHIOPIAN PACKS",
        basePricePerKg: 920,
        description:
            "Pre-steamed onion puree, Debrezeit berbere paste, cleaned skinless chicken portions.",
        cutsSummary: "Saves 4 hours of onion crying & simmering",
        isPopular: true,
        renderCartoon: () => <ChickenBreastCartoon className="size-28" />,
        cutStyles: [
            {
                id: "doro-kit",
                name: "12-Piece Doro Kit",
                spec: "Complete wot kit",
                description: "Onion reduction is already simmered for you.",
                surchargePerKg: 0,
                cartoonType: "steaks",
            },
        ],
    },
    {
        id: "kitfo-prep-pack",
        name: "Master Kitfo Prep Kit with Niter Kibbeh",
        amName: "የክትፎ ዝግጅት ከነጠረ ቅቤ ጋር",
        category: "Ethiopian Cuisine Packs",
        categoryTag: "ETHIOPIAN PACKS",
        basePricePerKg: 1150,
        description:
            "Fresh double-ground lean beef, authentic spiced clarified butter, and fiery mitmita.",
        cutsSummary: "Beef + Niter Kibbeh + Mitmita",
        isPopular: true,
        renderCartoon: () => <EthiopianTibsCartoon className="size-28" />,
        cutStyles: [
            {
                id: "kitfo-all-in",
                name: "Kitfo Chef Kit",
                spec: "Ready to warm",
                description: "Warm butter, fold in beef and mitmita, serve.",
                surchargePerKg: 0,
                cartoonType: "minced",
            },
        ],
    },
    {
        id: "misir-wot-pack",
        name: "Misir Wot Pack",
        amName: "የምስር ወጥ ዝግጅት ኪት",
        category: "Ethiopian Cuisine Packs",
        categoryTag: "ETHIOPIAN PACKS",
        basePricePerKg: 85,
        description:
            "Red split lentils, fine-diced red onion, peeled garlic, Debrezeit berbere, and seasoned fat.",
        cutsSummary: "20 portions · Niter kibbeh · Medium heat",
        isPopular: true,
        renderCartoon: () => <EthiopianTibsCartoon className="size-28" />,
        trimmings: [
            {
                id: "niter-kibbeh",
                name: "Niter kibbeh",
                surchargePerKg: 0,
                yieldPercent: 100,
            },
            {
                id: "vegetable-oil",
                name: "Pure vegetable oil (Fasting / Vegan)",
                surchargePerKg: 0,
                yieldPercent: 100,
            },
        ],
        cutStyles: [
            {
                id: "medium-heat",
                name: "Medium (10 g berbere)",
                spec: "Per-ingredient bags",
                description: "Balanced traditional red lentil wot.",
                surchargePerKg: 0,
                cartoonType: "cubes",
            },
            {
                id: "spicy-heat",
                name: "Hot & Spicy (18 g berbere)",
                spec: "Per-ingredient bags",
                description: "Rich fiery wot profile.",
                surchargePerKg: 0,
                cartoonType: "cubes",
            },
            {
                id: "mild-alicha",
                name: "Mild Alicha (Turmeric / Erd)",
                spec: "Per-ingredient bags",
                description: "Zero-chili golden alicha misir.",
                surchargePerKg: 0,
                cartoonType: "cubes",
            },
        ],
    },

    // ── 11. SAUCES AND CONDIMENTS ──
    {
        id: "burger-sauce",
        name: "Signature Secret Burger Sauce",
        amName: "የበርገር ልዩ ሶስ",
        category: "Sauces and Condiments",
        categoryTag: "SAUCES",
        basePricePerKg: 280,
        description:
            "Creamy tangy secret sauce with relish, smoked paprika, roasted garlic and dijon.",
        cutsSummary: "1L Squeeze bottle ready",
        isPopular: true,
        renderCartoon: () => <SauceJarCartoon className="size-28" />,
        cutStyles: [
            {
                id: "1l-bottle",
                name: "1L Dispenser Bottle",
                spec: "1000 ml",
                description: "Clean kitchen line squeeze bottle.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "5l-bulk-tub",
                name: "5L Bulk Kitchen Tub",
                spec: "5000 ml",
                description: "Economical refill bucket for high volume.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "house-awaze",
        name: "Spicy House Awaze Paste",
        amName: "ልዩ የአዋዜ ድልህ",
        category: "Sauces and Condiments",
        categoryTag: "SAUCES",
        basePricePerKg: 220,
        description:
            "Stone-ground berbere folded with tej honey wine, garlic, and korarima.",
        cutsSummary: "Rich dipping & marinade paste",
        isPopular: true,
        renderCartoon: () => <SauceJarCartoon className="size-28" />,
        cutStyles: [
            {
                id: "glass-jar",
                name: "Glass Preservation Jar",
                spec: "750 g jar",
                description: "Seals in essential spice oils.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "garlic-aioli",
        name: "Garlic Herb Aioli Mayo",
        amName: "የነጭ ሽንኩርት ማዮኔዝ",
        category: "Sauces and Condiments",
        categoryTag: "SAUCES",
        basePricePerKg: 310,
        description:
            "Rich whole-egg mayonnaise emulsified with roasted garlic and fine chives.",
        cutsSummary: "Thick dipping emulsion",
        renderCartoon: () => <SauceJarCartoon className="size-28" />,
        cutStyles: [
            {
                id: "squeeze-pack",
                name: "Sauce Dispenser Pack",
                spec: "1000 ml",
                description: "Perfect topping for wraps and fries.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "marinara-sils",
        name: "Slow-Cooked Marinara Sils",
        amName: "የቲማቲም ሲልስ",
        category: "Sauces and Condiments",
        categoryTag: "SAUCES",
        basePricePerKg: 240,
        description:
            "Slow-reduced ripe plum tomatoes with olive oil, basil, and sweet shallots.",
        cutsSummary: "Smooth red pizza & pasta sauce",
        renderCartoon: () => <SauceJarCartoon className="size-28" />,
        cutStyles: [
            {
                id: "pasta-base",
                name: "Simmered Sauce Tub",
                spec: "2 kg tub",
                description: "Base for pasta, pizza, and fish sils.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },

    // ── 12. OTHER KITCHEN INGREDIENTS ──
    {
        id: "farm-eggs",
        name: "Fresh Farm Grade-A Eggs",
        amName: "የጓሮ እንቁላል",
        category: "Other Kitchen Ingredients",
        categoryTag: "KITCHEN ESSENTIALS",
        basePricePerKg: 35,
        description:
            "Daily fresh eggs from pasture-raised hens in Bishoftu. Clean, candled and graded.",
        cutsSummary: "Tray of 30 · Pack of 12",
        isPopular: true,
        renderCartoon: () => <EggsCartoon className="size-28" />,
        cutStyles: [
            {
                id: "tray-30",
                name: "Crate Tray (30 Eggs)",
                spec: "30 eggs",
                description: "Standard commercial kitchen stack tray.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "niter-kibbeh",
        name: "Spiced Clarified Butter (Niter Kibbeh)",
        amName: "የተነጠረ ለጋ ቅቤ",
        category: "Other Kitchen Ingredients",
        categoryTag: "KITCHEN ESSENTIALS",
        basePricePerKg: 1200,
        description:
            "Pure cow's milk butter infused with korarima, kosseret, ginger, and turmeric.",
        cutsSummary: "Golden clarified aromatic ghee",
        isPopular: true,
        renderCartoon: () => <ButterPotCartoon className="size-28" />,
        cutStyles: [
            {
                id: "1kg-tub",
                name: "1kg Gourmet Tub",
                spec: "1000 g",
                description: "Pours golden and clear over kitfo and tibs.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "5kg-bucket",
                name: "5kg Commercial Bucket",
                spec: "5000 g",
                description: "Bulk kitchen batch cooking tub.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "cooking-oil",
        name: "Pure Sunflower Cooking Oil",
        amName: "የሱፍ ምግብ ዘይት",
        category: "Other Kitchen Ingredients",
        categoryTag: "KITCHEN ESSENTIALS",
        basePricePerKg: 210,
        description:
            "Triple-refined high-smoke-point sunflower oil for deep fryers and saute stations.",
        cutsSummary: "5L Jug · 20L Jerrycan",
        renderCartoon: () => <CookingOilCartoon className="size-28" />,
        cutStyles: [
            {
                id: "5l-jug",
                name: "5L Handle Jug",
                spec: "5 Liters",
                description: "Easy pouring kitchen jug.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "20l-drum",
                name: "20L Fryer Jerrycan",
                spec: "20 Liters",
                description: "Long life commercial fryer oil.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
    {
        id: "wheat-flour",
        name: "Premium White Wheat Flour",
        amName: "የዳቦና ኬክ ዱቄት",
        category: "Other Kitchen Ingredients",
        categoryTag: "KITCHEN ESSENTIALS",
        basePricePerKg: 110,
        description:
            "Enriched fine wheat flour for pizza dough, burger buns, sauces and pastries.",
        cutsSummary: "5kg Bag · 25kg Commercial Sack",
        renderCartoon: () => <SpicesCartoon className="size-28" />,
        cutStyles: [
            {
                id: "5kg-bag",
                name: "5kg Paper Bag",
                spec: "5 kg",
                description: "Fine pastry & roux flour.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
            {
                id: "25kg-sack",
                name: "25kg Baker Sack",
                spec: "25 kg",
                description: "High-volume bakery sack.",
                surchargePerKg: 0,
                cartoonType: "whole",
            },
        ],
    },
];

// Helper to compute category count dynamically
function getCategoryCount(categoryId: string) {
    const count = PRODUCTS.filter(p => p.category === categoryId).length;
    const isPack = categoryId.includes("Packs");
    return `${count} ${isPack ? "packs" : "items"}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 12 CATEGORIES (Matches Screenshot 1 "SHOP BY AISLE")
// ─────────────────────────────────────────────────────────────────────────────
const AISLE_CATEGORIES = [
    {
        id: "Vegetables",
        label: "Vegetables",
        count: getCategoryCount("Vegetables"),
        renderCartoon: () => <TomatoCartoon className="size-20" />,
    },
    {
        id: "Fruits",
        label: "Fruits",
        count: getCategoryCount("Fruits"),
        renderCartoon: () => <OrangeCartoon className="size-20" />,
    },
    {
        id: "Herbs and Aromatics",
        label: "Herbs and Aromatics",
        count: getCategoryCount("Herbs and Aromatics"),
        renderCartoon: () => <HerbsCartoon className="size-20" />,
    },
    {
        id: "Potatoes and Root Vegetables",
        label: "Potatoes and Root Vegetables",
        count: getCategoryCount("Potatoes and Root Vegetables"),
        renderCartoon: () => <PotatoesCartoon className="size-20" />,
    },
    {
        id: "Meat and Poultry",
        label: "Meat and Poultry",
        count: getCategoryCount("Meat and Poultry"),
        renderCartoon: () => <MeatCartoon className="size-20" />,
    },
    {
        id: "Fish and Seafood",
        label: "Fish and Seafood",
        count: getCategoryCount("Fish and Seafood"),
        renderCartoon: () => <FishCartoon className="size-20" />,
    },
    {
        id: "Spices and Seasonings",
        label: "Spices and Seasonings",
        count: getCategoryCount("Spices and Seasonings"),
        renderCartoon: () => <SpicesCartoon className="size-20" />,
    },
    {
        id: "Ready-to-Cook Packs",
        label: "Ready-to-Cook Packs",
        count: getCategoryCount("Ready-to-Cook Packs"),
        renderCartoon: () => <ReadyToCookCartoon className="size-20" />,
    },
    {
        id: "Burger and Sandwich Ingredients",
        label: "Burger and Sandwich Ingredients",
        count: getCategoryCount("Burger and Sandwich Ingredients"),
        renderCartoon: () => <BurgerCartoon className="size-20" />,
    },
    {
        id: "Ethiopian Cuisine Packs",
        label: "Ethiopian Cuisine Packs",
        count: getCategoryCount("Ethiopian Cuisine Packs"),
        renderCartoon: () => <EthiopianTibsCartoon className="size-20" />,
    },
    {
        id: "Sauces and Condiments",
        label: "Sauces and Condiments",
        count: getCategoryCount("Sauces and Condiments"),
        renderCartoon: () => <SauceJarCartoon className="size-20" />,
    },
    {
        id: "Other Kitchen Ingredients",
        label: "Other Kitchen Ingredients",
        count: getCategoryCount("Other Kitchen Ingredients"),
        renderCartoon: () => <EggsCartoon className="size-20" />,
    },
];

// Sample historical orders from screenshot
const SAMPLE_ORDERS: CompletedOrder[] = [
    {
        id: "FP-SAMPLE-1042",
        createdAt: "2026-10-19T06:00:00.000Z",
        deliveryShift:
            "Delivery Monday, 19 October 2026 · Sample: Habesha Grill",
        destinationStation: "Habesha Grill (Main Kitchen)",
        totalAmount: 7837.32,
        status: "DELIVERED",
        isSample: true,
        items: [
            {
                id: "s1-red-onion",
                productId: "red-onion",
                productName: "Red onion",
                productAmName: "ቀይ ሽንኩርት",
                weightGrams: 15000,
                cutName: "Fine Dice (4 mm)",
                pricePerKg: 100,
                lineTotal: 1500,
                renderCartoon: () => <RedOnionCartoon className="size-20" />,
            },
            {
                id: "s1-beef",
                productId: "beef",
                productName: "Beef",
                productAmName: "የበሬ ስጋ",
                weightGrams: 5000,
                trimmingName: "Trim excess visible fat",
                cutName: "Tender Strips (1 × 5 cm)",
                pricePerKg: 1020,
                lineTotal: 5100,
                renderCartoon: () => <MeatCartoon className="size-20" />,
            },
            {
                id: "s1-tomato",
                productId: "tomato",
                productName: "Tomato",
                productAmName: "ቲማቲም",
                weightGrams: 14000,
                cutName: "Crushed Puree (De-seeded)",
                pricePerKg: 88,
                lineTotal: 1237.32,
                renderCartoon: () => <TomatoCartoon className="size-20" />,
            },
        ],
    },
    {
        id: "FP-SAMPLE-1017",
        createdAt: "2026-10-12T06:00:00.000Z",
        deliveryShift:
            "Delivery Monday, 12 October 2026 · Sample: Habesha Grill",
        destinationStation: "Habesha Grill (Prep Station)",
        totalAmount: 2041.94,
        status: "DELIVERED",
        isSample: true,
        items: [
            {
                id: "s2-potato",
                productId: "potato",
                productName: "White potato",
                productAmName: "ድንች",
                weightGrams: 12000,
                cutName: "French Fry Cut (9 mm)",
                pricePerKg: 73,
                lineTotal: 876,
                renderCartoon: () => <PotatoesCartoon className="size-20" />,
            },
            {
                id: "s2-garlic",
                productId: "garlic",
                productName: "Garlic",
                productAmName: "የተላጠ ነጭ ሽንኩርት",
                weightGrams: 3000,
                cutName: "Puree Paste (Smooth)",
                pricePerKg: 210,
                lineTotal: 630,
                renderCartoon: () => <GarlicCartoon className="size-20" />,
            },
            {
                id: "s2-green-pepper",
                productId: "green-pepper",
                productName: "Green pepper",
                productAmName: "ቃሪያ",
                weightGrams: 4200,
                cutName: "Sliced Rings (4 mm)",
                pricePerKg: 128,
                lineTotal: 535.94,
                renderCartoon: () => <GreenPepperCartoon className="size-20" />,
            },
        ],
    },
];

export function FreshPrepEmbedBoard() {
    const t = useTranslations("freshPrep");
    const { resolved, setMode } = useTheme();

    // View switcher: "catalog" (categories & items) vs "orders" (My Orders page)
    const [activeView, setActiveView] = useState<"catalog" | "orders">(
        "catalog",
    );
    const [howItWorksOpen, setHowItWorksOpen] = useState(false);
    const [expandedOrderSpecs, setExpandedOrderSpecs] = useState<
        Record<string, boolean>
    >({});

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPrepFilter, setSelectedPrepFilter] =
        useState("Any preparation");
    const [selectedPriceFilter, setSelectedPriceFilter] = useState("Any price");
    const [selectedSort, setSelectedSort] = useState("Sort: Popular first");

    // Customizer Side Sheet states
    const [customizingProduct, setCustomizingProduct] =
        useState<StorefrontProduct | null>(null);
    const [selectedWeightGrams, setSelectedWeightGrams] =
        useState<number>(1000); // 1kg default
    const [selectedTrimmingId, setSelectedTrimmingId] =
        useState<string>("as-butchered");
    const [selectedCutId, setSelectedCutId] = useState<string>("");
    const [itemNotes, setItemNotes] = useState<string>("");

    // Cart Sheet states
    const [cart, setCart] = useState<CartLineItem[]>([
        // Initial item demonstrating the Cart UI from screenshot
        {
            id: "initial-misir-wot-pack",
            productId: "misir-wot-pack",
            productName: "Misir Wot Pack",
            productAmName: "የምስር ወጥ ዝግጅት ኪት",
            weightGrams: 2000,
            quantityPcs: 20,
            portionUnit: "pcs",
            unitPrice: 85,
            fatType: "Niter kibbeh",
            heatLevel: "Medium (10 g berbere)",
            packagingType: "Per-ingredient bags",
            prepPackingCost: 0,
            cutName: "Medium (10 g berbere)",
            pricePerKg: 85,
            lineTotal: 1700,
            renderCartoon: () => <EthiopianTibsCartoon className="size-16" />,
        },
    ]);
    const [cartOpen, setCartOpen] = useState(false);
    const [pastOrders, setPastOrders] = useState<CompletedOrder[]>([]);

    // Combined orders: placed orders + sample orders
    const allOrders = useMemo(() => {
        return [...pastOrders, ...SAMPLE_ORDERS];
    }, [pastOrders]);

    // Load past orders
    useEffect(() => {
        try {
            const raw = localStorage.getItem("fanaye_freshprep_orders");
            if (raw) setPastOrders(JSON.parse(raw));
        } catch {}
    }, []);

    // Save past orders
    function savePastOrders(orders: CompletedOrder[]) {
        setPastOrders(orders);
        try {
            localStorage.setItem(
                "fanaye_freshprep_orders",
                JSON.stringify(orders),
            );
        } catch {}
    }

    // Toggle Order Specs Accordion
    function toggleOrderSpecs(orderId: string) {
        setExpandedOrderSpecs(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    }

    // Reorder from past order
    function handleReorder(order: CompletedOrder) {
        const newLines = order.items.map(it => ({
            ...it,
            id: `${it.productId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        }));
        setCart(prev => [...prev, ...newLines]);
        setCartOpen(true);
        toast.success(
            `Loaded ${order.items.length} items from ${order.id} into cart`,
        );
    }

    // Open Customizer
    function handleOpenCustomizer(product: StorefrontProduct) {
        setCustomizingProduct(product);
        const isPack =
            product.categoryTag.includes("PACKS") ||
            product.name.includes("Pack");
        setSelectedWeightGrams(isPack ? 2000 : 1000);
        setSelectedTrimmingId(product.trimmings?.[0]?.id || "as-butchered");
        setSelectedCutId(product.cutStyles[0]?.id || "");
        setItemNotes("");
    }

    // Customizer Live Price Calculations
    const customizerCalc = useMemo(() => {
        if (!customizingProduct)
            return {
                pricePerKg: 0,
                lineTotal: 0,
                selectedCut: null,
                selectedTrim: null,
                weightKg: 1,
            };

        const selectedCut =
            customizingProduct.cutStyles.find(c => c.id === selectedCutId) ||
            customizingProduct.cutStyles[0];

        const selectedTrim =
            customizingProduct.trimmings?.find(
                tr => tr.id === selectedTrimmingId,
            ) || null;

        const trimSurcharge = selectedTrim ? selectedTrim.surchargePerKg : 0;
        const cutSurcharge = selectedCut ? selectedCut.surchargePerKg : 0;
        const pricePerKg =
            customizingProduct.basePricePerKg + trimSurcharge + cutSurcharge;

        const isPack =
            customizingProduct.categoryTag.includes("PACKS") ||
            customizingProduct.name.includes("Pack");
        const weightKg = selectedWeightGrams / 1000;
        const lineTotal = isPack
            ? pricePerKg * Math.round(selectedWeightGrams / 100)
            : pricePerKg * weightKg;

        return {
            pricePerKg,
            lineTotal,
            selectedCut,
            selectedTrim,
            weightKg,
            isPack,
        };
    }, [
        customizingProduct,
        selectedCutId,
        selectedTrimmingId,
        selectedWeightGrams,
    ]);

    // Add to cart
    function handleAddToCart() {
        if (!customizingProduct || !customizerCalc.selectedCut) return;

        const isPack =
            customizingProduct.categoryTag.includes("PACKS") ||
            customizingProduct.name.includes("Pack");
        const lineItem: CartLineItem = {
            id: `${customizingProduct.id}-${customizerCalc.selectedCut.id}-${selectedWeightGrams}g-${Date.now()}`,
            productId: customizingProduct.id,
            productName: customizingProduct.name,
            productAmName: customizingProduct.amName,
            weightGrams: selectedWeightGrams,
            quantityPcs: isPack
                ? Math.round(selectedWeightGrams / 100) || 20
                : undefined,
            portionUnit: isPack ? "pcs" : "kg",
            unitPrice: customizerCalc.pricePerKg,
            fatType: customizerCalc.selectedTrim?.name,
            heatLevel: customizerCalc.selectedCut.name,
            packagingType:
                customizerCalc.selectedCut.spec || "Per-ingredient bags",
            prepPackingCost: 0,
            trimmingName: customizerCalc.selectedTrim?.name,
            cutName: customizerCalc.selectedCut.name,
            pricePerKg: customizerCalc.pricePerKg,
            lineTotal: customizerCalc.lineTotal,
            renderCartoon: customizingProduct.renderCartoon,
        };

        setCart([...cart, lineItem]);
        toast.success(
            `${customizingProduct.name} (${customizerCalc.selectedCut.name}) added to cart`,
        );
        setCustomizingProduct(null);
    }

    // Update Cart Qty (increment/decrement with [-] and [+])
    function handleUpdateCartQty(itemId: string, delta: number) {
        setCart(prev =>
            prev.map(item => {
                if (item.id !== itemId) return item;
                const isPack =
                    !!item.quantityPcs || item.productName.includes("Pack");
                if (isPack) {
                    const currentPcs = item.quantityPcs || 20;
                    const nextPcs = Math.max(1, currentPcs + delta);
                    const unitRate =
                        item.unitPrice || item.lineTotal / currentPcs;
                    return {
                        ...item,
                        quantityPcs: nextPcs,
                        lineTotal: unitRate * nextPcs,
                    };
                } else {
                    const currentKg = item.weightGrams / 1000;
                    const nextKg = Math.max(0.5, currentKg + delta * 0.5);
                    return {
                        ...item,
                        weightGrams: Math.round(nextKg * 1000),
                        lineTotal: item.pricePerKg * nextKg,
                    };
                }
            }),
        );
    }

    // Edit Cart Item
    function handleEditCartItem(item: CartLineItem) {
        const product = PRODUCTS.find(p => p.id === item.productId);
        if (product) {
            handleOpenCustomizer(product);
            setSelectedWeightGrams(item.weightGrams || 1000);
            const foundCut = product.cutStyles.find(
                c => c.name === item.cutName,
            );
            if (foundCut) setSelectedCutId(foundCut.id);
            const foundTrim = product.trimmings?.find(
                t => t.name === item.trimmingName,
            );
            if (foundTrim) setSelectedTrimmingId(foundTrim.id);
            setCart(prev => prev.filter(i => i.id !== item.id));
            setCartOpen(false);
        }
    }

    // Clear cart
    function handleClearCart() {
        setCart([]);
        toast.info("Cart cleared");
    }

    // Remove from cart
    function handleRemoveCartItem(id: string) {
        setCart(cart.filter(item => item.id !== id));
    }

    // Cart Total
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.lineTotal, 0);
    }, [cart]);

    // Estimated delivery: Free from ETB 15,000, otherwise ETB 350
    const deliveryFee = cartTotal >= 15000 || cartTotal === 0 ? 0 : 350;
    const grandTotal = cartTotal + deliveryFee;

    // Checkout
    function handlePlaceOrder() {
        if (cart.length === 0) return;

        const newOrder: CompletedOrder = {
            id: `FP-${Math.floor(100000 + Math.random() * 900000)}`,
            createdAt: new Date().toISOString(),
            deliveryShift: `Delivery Tomorrow, 06:00 AM · Central Kitchen`,
            destinationStation: "Main Kitchen",
            items: [...cart],
            totalAmount: grandTotal,
            status: "CONFIRMED",
        };

        const updated = [newOrder, ...pastOrders];
        savePastOrders(updated);
        setCart([]);
        setCartOpen(false);
        setActiveView("orders");
        toast.success("Prep order confirmed! View in My Orders.");
    }

    // Filtered Products
    const filteredProducts = useMemo(() => {
        let list = PRODUCTS.filter(p => {
            const matchesCat =
                selectedCategory === "ALL" || p.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesQ =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.amName.toLowerCase().includes(q) ||
                p.categoryTag.toLowerCase().includes(q);
            return matchesCat && matchesQ;
        });

        // Prep filter
        if (selectedPrepFilter === "Diced & Chopped") {
            list = list.filter(p =>
                p.cutStyles.some(
                    c =>
                        c.name.toLowerCase().includes("dice") ||
                        c.name.toLowerCase().includes("chop") ||
                        c.name.toLowerCase().includes("cube"),
                ),
            );
        } else if (selectedPrepFilter === "Sliced & Strips") {
            list = list.filter(p =>
                p.cutStyles.some(
                    c =>
                        c.name.toLowerCase().includes("slice") ||
                        c.name.toLowerCase().includes("strip"),
                ),
            );
        } else if (selectedPrepFilter === "Peeled & Cleaned") {
            list = list.filter(p =>
                p.cutStyles.some(
                    c =>
                        c.name.toLowerCase().includes("peel") ||
                        c.name.toLowerCase().includes("clean"),
                ),
            );
        }

        // Price filter
        if (selectedPriceFilter === "Under ETB 100") {
            list = list.filter(p => p.basePricePerKg < 100);
        } else if (selectedPriceFilter === "ETB 100 - ETB 300") {
            list = list.filter(
                p => p.basePricePerKg >= 100 && p.basePricePerKg <= 300,
            );
        } else if (selectedPriceFilter === "Over ETB 300") {
            list = list.filter(p => p.basePricePerKg > 300);
        }

        // Sorting
        if (selectedSort === "Price: Low to high") {
            list.sort((a, b) => a.basePricePerKg - b.basePricePerKg);
        } else if (selectedSort === "Price: High to low") {
            list.sort((a, b) => b.basePricePerKg - a.basePricePerKg);
        } else if (selectedSort === "Name: A to Z") {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // Popular first
            list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
        }

        return list;
    }, [
        selectedCategory,
        searchQuery,
        selectedPrepFilter,
        selectedPriceFilter,
        selectedSort,
    ]);

    return (
        <div className="w-full font-sans transition-colors duration-200 pb-12 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            {/* Top Prototype Alert Banner */}
            <div className="w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] -mx-4 sm:-mx-6 lg:-mx-8 bg-slate-100 dark:bg-[#07130b] text-slate-700 dark:text-[#86efac] text-center py-2 px-4 text-[12px] font-medium border-b border-slate-200 dark:border-white/5 transition-colors">
                Demo prototype · prices are illustrative · no real orders or
                payments are processed
            </div>

            {/* Sticky Top Navbar */}
            <header className="sticky top-0 z-30 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] -mx-4 sm:-mx-6 lg:-mx-8 bg-white/95 dark:bg-[#060c09]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-3.5 px-4 sm:px-8 mb-8 transition-colors shadow-xs">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    {/* Left: FreshPrep Logo */}
                    <div
                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                        onClick={() => setActiveView("catalog")}
                    >
                        <div className="size-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                            <Leaf className="size-4.5 fill-emerald-400/30 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[20px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                            FreshPrep
                        </span>
                    </div>

                    {/* Center: Search input in navbar */}
                    <div className="hidden md:flex flex-1 max-w-md mx-4">
                        <div className="relative w-full">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search vegetables, fruits, meat, or ingredients..."
                                className="w-full rounded-full bg-slate-100 dark:bg-[#142018] border border-slate-200 dark:border-white/10 pl-10 pr-4 py-2 text-[12.5px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500/60 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Right: Nav Links & Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveView("catalog")}
                            className={cn(
                                "px-3 py-1.5 text-[13px] font-medium transition-colors rounded-lg",
                                activeView === "catalog"
                                    ? "text-emerald-600 dark:text-[#4ade80] font-bold"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                            )}
                        >
                            Categories
                        </button>

                        <button
                            type="button"
                            onClick={() => setHowItWorksOpen(true)}
                            className="px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors rounded-lg"
                        >
                            How It Works
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveView("orders")}
                            className={cn(
                                "px-3 py-1.5 text-[13px] font-medium transition-colors rounded-lg flex items-center gap-1.5",
                                activeView === "orders"
                                    ? "text-emerald-600 dark:text-[#4ade80] font-bold"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                            )}
                        >
                            <span>My Orders</span>
                            {pastOrders.length > 0 && (
                                <span className="size-2 rounded-full bg-emerald-500 dark:bg-[#4ade80]" />
                            )}
                        </button>

                        {/* Cart Button with Orange Count Badge */}
                        <button
                            type="button"
                            onClick={() => setCartOpen(true)}
                            className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                            title="Open cart"
                        >
                            <ShoppingBag className="size-5" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#ea580c] text-white text-[10px] font-black shadow">
                                    {cart.length}
                                </span>
                            )}
                        </button>

                        {/* Order Ingredients Pill CTA */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveView("catalog");
                            }}
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4ade80] dark:hover:bg-[#3ce474] dark:text-[#062412] px-4 py-2 text-[13px] font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Order Ingredients
                        </button>

                        {/* Theme Toggle */}
                        <button
                            type="button"
                            onClick={() =>
                                setMode(resolved === "dark" ? "light" : "dark")
                            }
                            aria-label={
                                resolved === "dark"
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }
                            title={
                                resolved === "dark"
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }
                            className="size-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors ml-1"
                        >
                            {resolved === "dark" ? (
                                <Sun className="size-4 text-amber-400" />
                            ) : (
                                <Moon className="size-4 text-slate-700" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* CONDITIONAL MAIN VIEW: MY ORDERS VS CATALOG */}
            {activeView === "orders" ? (
                /* ================= MY ORDERS VIEW (Screenshot 2) ================= */
                <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black tracking-widest text-emerald-700 dark:text-[#4ade80] uppercase">
                                SIMULATED ACCOUNT
                            </p>
                            <h1 className="text-[34px] sm:text-[38px] font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                My Orders
                            </h1>
                            <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                                Demo orders you place are saved in this browser.
                                Sample orders are included to show reordering.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveView("catalog")}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-[#141f17] hover:bg-slate-200 dark:hover:bg-[#1a281e] border border-slate-300 dark:border-white/10 px-5 py-2.5 text-[12.5px] font-semibold text-slate-800 dark:text-slate-200 transition-colors shadow-sm self-start sm:self-auto"
                        >
                            <RefreshCw className="size-3.5 text-emerald-600 dark:text-[#4ade80]" />
                            <span>Browse items ordered before</span>
                        </button>
                    </div>

                    {/* Orders List Stack */}
                    <div className="space-y-4">
                        {allOrders.map(order => {
                            const isExpanded = !!expandedOrderSpecs[order.id];
                            const avatars = order.items
                                .slice(0, 3)
                                .map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="size-10 sm:size-11 rounded-full bg-slate-100 border-2 border-white dark:bg-[#202f25] dark:border-[#121c15] flex items-center justify-center p-1 overflow-hidden shadow-xs"
                                        style={{
                                            marginLeft: idx > 0 ? "-12px" : "0",
                                            zIndex: 10 - idx,
                                        }}
                                    >
                                        <div className="size-7 sm:size-8 scale-90 flex items-center justify-center">
                                            {item.renderCartoon ? (
                                                item.renderCartoon()
                                            ) : (
                                                <ReadyToCookCartoon className="size-7" />
                                            )}
                                        </div>
                                    </div>
                                ));

                            const itemsSummary = order.items
                                .map(it => it.productName.replace(" Pack", ""))
                                .join(", ");

                            return (
                                <div
                                    key={order.id}
                                    className="rounded-2xl bg-white dark:bg-[#121a15] border border-slate-200 dark:border-white/5 p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-md space-y-4"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Left: Avatars & Info */}
                                        <div className="flex items-start sm:items-center gap-4">
                                            <div className="flex items-center shrink-0">
                                                {avatars}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <span className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight">
                                                        {order.id}
                                                    </span>
                                                    <span className="rounded-full bg-emerald-50 dark:bg-[#1e2e23] border border-emerald-500/20 text-emerald-800 dark:text-[#86efac] px-2.5 py-0.5 text-[11px] font-medium">
                                                        {order.isSample
                                                            ? "Sample order"
                                                            : order.status ||
                                                              "Completed"}
                                                    </span>
                                                </div>

                                                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                                                    {order.deliveryShift}
                                                </p>
                                                <p className="text-[12.5px] font-medium text-slate-700 dark:text-slate-300">
                                                    {itemsSummary}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: Total Price */}
                                        <div className="text-left md:text-right shrink-0">
                                            <span className="text-[18px] font-black text-slate-900 dark:text-white">
                                                ETB{" "}
                                                {order.totalAmount.toLocaleString(
                                                    "en-US",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    },
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleReorder(order)
                                                }
                                                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4ade80] dark:hover:bg-[#3ce474] dark:text-[#062412] px-5 py-2 text-[12.5px] font-bold shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <RefreshCw className="size-3.5 stroke-[2.5]" />
                                                <span>Order again</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleOrderSpecs(order.id)
                                                }
                                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            >
                                                <span>View specs</span>
                                                <ChevronDown
                                                    className={cn(
                                                        "size-3.5 transition-transform",
                                                        isExpanded &&
                                                            "rotate-180",
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collapsible Order Specs Accordion */}
                                    {isExpanded && (
                                        <div className="mt-4 rounded-xl bg-slate-50 dark:bg-[#0d1410] border border-slate-200 dark:border-white/5 p-4 space-y-3 animate-in fade-in duration-150">
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200 dark:border-white/5">
                                                Order Line Specifications (
                                                {order.items.length} items)
                                            </div>
                                            <div className="divide-y divide-slate-200 dark:divide-white/5">
                                                {order.items.map(
                                                    (line, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]"
                                                        >
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                    <span>
                                                                        {
                                                                            line.productName
                                                                        }
                                                                    </span>
                                                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-[#4ade80]">
                                                                        (
                                                                        {line.cutName ||
                                                                            "Standard"}
                                                                        )
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                    {line.quantityPcs
                                                                        ? `${line.quantityPcs} pcs`
                                                                        : `${line.weightGrams >= 1000 ? `${line.weightGrams / 1000} kg` : `${line.weightGrams} g`}`}
                                                                    {line.fatType
                                                                        ? ` · Fat: ${line.fatType}`
                                                                        : ""}
                                                                    {line.packagingType
                                                                        ? ` · Packaging: ${line.packagingType}`
                                                                        : ""}
                                                                </div>
                                                            </div>
                                                            <div className="font-bold text-slate-900 dark:text-white text-right">
                                                                ETB{" "}
                                                                {line.lineTotal.toLocaleString(
                                                                    "en-US",
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ================= CATALOG VIEW (Screenshot 1-3) ================= */
                <div className="w-full space-y-8 animate-in fade-in duration-200">
                    {/* AISLE CATEGORIES HEADER */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-bold tracking-widest text-emerald-700 dark:text-[#4ade80] uppercase">
                                    SHOP BY AISLE
                                </p>
                                <h1 className="text-[32px] font-black text-slate-900 dark:text-white tracking-tight">
                                    Categories
                                </h1>
                            </div>
                        </div>

                        {/* Categories Grid (2 rows of 6 cards) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {AISLE_CATEGORIES.map(cat => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedCategory(
                                                isSelected ? "ALL" : cat.id,
                                            )
                                        }
                                        className={cn(
                                            "group flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 border",
                                            isSelected
                                                ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-950 dark:bg-[#223528] dark:border-[#4ade80] dark:ring-[#4ade80]/40 dark:text-white shadow-md"
                                                : "bg-white hover:bg-slate-50/80 border-slate-200/90 text-slate-800 dark:bg-[#1c2420] dark:border-white/5 dark:text-white dark:hover:bg-[#222d26] shadow-sm hover:shadow",
                                        )}
                                    >
                                        <div className="flex justify-center items-center py-2 h-24">
                                            <div className="flex size-20 items-center justify-center rounded-2xl bg-slate-50/80 dark:bg-black/25 transition-transform duration-300 group-hover:scale-110">
                                                {cat.renderCartoon()}
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-0.5">
                                            <h3 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                                                {cat.label}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                {cat.count}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. FILTERS & SEARCH ROW (Screenshot 2) */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Preparation Dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedPrepFilter}
                                    onChange={e =>
                                        setSelectedPrepFilter(e.target.value)
                                    }
                                    className="appearance-none cursor-pointer rounded-xl bg-white dark:bg-[#1c2420] border border-slate-200 dark:border-white/10 pl-8 pr-8 py-2 text-[12px] text-slate-700 dark:text-slate-300 font-medium shadow-sm hover:border-emerald-500/50 dark:hover:border-[#4ade80]/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="Any preparation">
                                        Any preparation
                                    </option>
                                    <option value="Diced & Chopped">
                                        Diced & Chopped
                                    </option>
                                    <option value="Sliced & Strips">
                                        Sliced & Strips
                                    </option>
                                    <option value="Peeled & Cleaned">
                                        Peeled & Cleaned
                                    </option>
                                </select>
                                <Filter className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                            </div>

                            {/* Price Dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedPriceFilter}
                                    onChange={e =>
                                        setSelectedPriceFilter(e.target.value)
                                    }
                                    className="appearance-none cursor-pointer rounded-xl bg-white dark:bg-[#1c2420] border border-slate-200 dark:border-white/10 px-3 pr-8 py-2 text-[12px] text-slate-700 dark:text-slate-300 font-medium shadow-sm hover:border-emerald-500/50 dark:hover:border-[#4ade80]/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="Any price">Any price</option>
                                    <option value="Under ETB 100">
                                        Under ETB 100
                                    </option>
                                    <option value="ETB 100 - ETB 300">
                                        ETB 100 - ETB 300
                                    </option>
                                    <option value="Over ETB 300">
                                        Over ETB 300
                                    </option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedSort}
                                    onChange={e =>
                                        setSelectedSort(e.target.value)
                                    }
                                    className="appearance-none cursor-pointer rounded-xl bg-white dark:bg-[#1c2420] border border-slate-200 dark:border-white/10 px-3 pr-8 py-2 text-[12px] text-slate-700 dark:text-slate-300 font-medium shadow-sm hover:border-emerald-500/50 dark:hover:border-[#4ade80]/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="Sort: Popular first">
                                        Sort: Popular first
                                    </option>
                                    <option value="Price: Low to high">
                                        Price: Low to high
                                    </option>
                                    <option value="Price: High to low">
                                        Price: High to low
                                    </option>
                                    <option value="Name: A to Z">
                                        Name: A to Z
                                    </option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                            </div>

                            {(selectedCategory !== "ALL" ||
                                selectedPrepFilter !== "Any preparation" ||
                                selectedPriceFilter !== "Any price") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory("ALL");
                                        setSelectedPrepFilter(
                                            "Any preparation",
                                        );
                                        setSelectedPriceFilter("Any price");
                                    }}
                                    className="text-[11px] font-bold text-emerald-700 dark:text-[#4ade80] hover:underline px-2"
                                >
                                    Reset filters
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search items..."
                                className="h-10 w-full rounded-xl bg-white dark:bg-[#1c2420] border border-slate-200 dark:border-white/10 pl-9 pr-3 text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-[#4ade80] shadow-sm"
                            />
                        </div>
                    </div>

                    {/* 3. PRODUCTS GRID (Matching Screenshot 2 card layout) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#1a251e] border border-slate-200/90 dark:border-white/5 p-4 transition-all duration-200 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:bg-slate-50/80 dark:hover:bg-[#1f2d24] shadow-xs hover:shadow-md"
                            >
                                <div>
                                    {/* Graphic Area (matching screenshot: clean large graphic directly on card canvas) */}
                                    <div className="flex justify-center items-center h-40 py-2 transition-transform duration-300 group-hover:scale-105">
                                        {product.renderCartoon()}
                                    </div>

                                    {/* Content Arrangement (matching screenshot) */}
                                    <div className="space-y-1 pt-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {product.categoryTag}
                                        </p>
                                        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight flex items-baseline flex-wrap gap-1.5">
                                            <span>{product.name}</span>
                                            {product.amName && (
                                                <span className="text-[13px] font-normal text-slate-500 dark:text-slate-400">
                                                    {product.amName}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2 min-h-[32px]">
                                            {product.description}
                                        </p>

                                        {/* Cut spec line with pen icon (matching screenshot: ✎ Peel · Mince · 4 cuts) */}
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-[#4ade80] pt-1">
                                            <PenLine className="size-3 shrink-0 stroke-[2.2]" />
                                            <span>{product.cutsSummary}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Action Button (matching screenshot) */}
                                <div className="flex items-center justify-between pt-4 mt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                                            from
                                        </span>
                                        <span className="text-[16px] sm:text-[17px] font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                            ETB {product.basePricePerKg}
                                            {product.categoryTag.includes(
                                                "PACKS",
                                            ) || product.name.includes("Pack")
                                                ? "/portion"
                                                : "/kg"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOpenCustomizer(product)
                                        }
                                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4ade80] dark:hover:bg-[#3ce474] dark:text-[#062412] px-4 py-2 text-[12.5px] font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Customize & Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. CUSTOMIZER SLIDE-OVER SIDE SHEET (Screenshot 4 & 5) */}
            {customizingProduct && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 dark:bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div
                        className="flex-1"
                        onClick={() => setCustomizingProduct(null)}
                    />

                    <aside className="relative flex h-full w-full max-w-xl flex-col bg-white dark:bg-[#121814] border-l border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                        {/* Side Sheet Header */}
                        <div className="border-b border-slate-200 dark:border-white/10 px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#1c2420] border border-slate-200 dark:border-white/10 p-2">
                                        {customizingProduct.renderCartoon()}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {customizingProduct.categoryTag}
                                        </p>
                                        <h2 className="text-[20px] font-extrabold text-slate-900 dark:text-white">
                                            {customizingProduct.name}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                                                from ETB{" "}
                                                {
                                                    customizingProduct.basePricePerKg
                                                }
                                                /kg
                                            </span>
                                            {customizingProduct.isRawMeat && (
                                                <span className="flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 dark:bg-[#3b1c14] dark:border-[#7c2d12]/40 px-2 py-0.5 text-[10px] font-bold dark:text-[#fb923c]">
                                                    <Snowflake className="size-2.5" />
                                                    Raw meat & poultry
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCustomizingProduct(null)}
                                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                                {customizingProduct.description}
                            </p>

                            {/* Raw Meat Warning Banner */}
                            {customizingProduct.isRawMeat && (
                                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-[#2d1712] dark:border-[#7c2d12]/60 p-3 text-[11px] dark:text-[#fdba74]">
                                    <Snowflake className="size-4 shrink-0 text-amber-600 dark:text-[#fb923c] mt-0.5" />
                                    <span>
                                        <strong className="text-slate-900 dark:text-white">
                                            Raw meat.
                                        </strong>{" "}
                                        Sealed and chilled at 0–4 °C. Always
                                        packed and delivered separately from
                                        produce.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Scrollable Configuration Body */}
                        <div className="app-scroll flex-1 space-y-7 overflow-y-auto px-6 py-5 text-[13px]">
                            {/* 1. QUANTITY SECTION */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-black text-[11px] font-bold">
                                            1
                                        </span>
                                        <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white">
                                            Quantity
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Net weight you receive, after prep
                                    </span>
                                </div>

                                {/* Weight Pill Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    {[500, 1000, 2000, 5000, 10000].map(
                                        weight => {
                                            const isSelected =
                                                selectedWeightGrams === weight;
                                            const label =
                                                weight >= 1000
                                                    ? `${weight / 1000} kg`
                                                    : `${weight} g`;
                                            return (
                                                <button
                                                    key={weight}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedWeightGrams(
                                                            weight,
                                                        )
                                                    }
                                                    className={cn(
                                                        "rounded-full px-5 py-2 text-[12px] font-bold transition-all",
                                                        isSelected
                                                            ? "bg-emerald-500 text-white dark:bg-[#4ade80] dark:text-[#0a1a10] shadow-md"
                                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-[#1c2420] dark:text-slate-300 dark:hover:bg-[#25322b] dark:border-white/10",
                                                    )}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        },
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const val = prompt(
                                                "Enter custom weight in kg:",
                                                "3",
                                            );
                                            const num = parseFloat(val || "0");
                                            if (num > 0)
                                                setSelectedWeightGrams(
                                                    Math.round(num * 1000),
                                                );
                                        }}
                                        className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-[#1c2420] dark:text-slate-300 dark:hover:bg-[#25322b] dark:border-white/10 px-5 py-2 text-[12px] font-bold transition-all"
                                    >
                                        Custom
                                    </button>
                                </div>

                                {/* Yield Weight Box */}
                                <div className="rounded-xl bg-slate-50 dark:bg-[#1c2420] border border-slate-200/80 dark:border-white/5 p-4 space-y-1.5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                                You receive (net)
                                            </span>
                                            <span className="text-[16px] font-extrabold text-slate-900 dark:text-white">
                                                {selectedWeightGrams >= 1000
                                                    ? `${selectedWeightGrams / 1000} kg`
                                                    : `${selectedWeightGrams} g`}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                                We source (raw)
                                            </span>
                                            <span className="text-[16px] font-extrabold text-slate-700 dark:text-slate-200">
                                                ≈{" "}
                                                {selectedWeightGrams >= 1000
                                                    ? `${selectedWeightGrams / 1000} kg`
                                                    : `${selectedWeightGrams} g`}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                        No weight is lost in this preparation.
                                        Net and raw weight are the same.
                                    </p>
                                </div>
                            </div>

                            {/* 2. TRIMMING SECTION (If applicable) */}
                            {customizingProduct.trimmings &&
                                customizingProduct.trimmings.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-black text-[11px] font-bold">
                                                    2
                                                </span>
                                                <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white">
                                                    Trimming
                                                </h3>
                                            </div>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Yield shown per option
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {customizingProduct.trimmings.map(
                                                trim => {
                                                    const isSelected =
                                                        selectedTrimmingId ===
                                                        trim.id;
                                                    return (
                                                        <button
                                                            key={trim.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedTrimmingId(
                                                                    trim.id,
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex items-center justify-between w-full rounded-xl p-3.5 text-left transition-all border",
                                                                isSelected
                                                                    ? "bg-emerald-50 border-emerald-500 text-slate-900 dark:bg-[#182a1e] dark:border-[#4ade80] dark:text-white shadow-sm"
                                                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-[#1c2420] dark:border-white/5 dark:text-slate-300 dark:hover:bg-[#222d26]",
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={cn(
                                                                        "flex size-5 items-center justify-center rounded-full border-2",
                                                                        isSelected
                                                                            ? "border-emerald-600 dark:border-[#4ade80] bg-emerald-600 dark:bg-[#4ade80]"
                                                                            : "border-slate-400 dark:border-slate-500",
                                                                    )}
                                                                >
                                                                    {isSelected && (
                                                                        <div className="size-2 rounded-full bg-white dark:bg-[#0a1a10]" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-[13px]">
                                                                        {
                                                                            trim.name
                                                                        }
                                                                    </span>
                                                                    {trim.note && (
                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                            {
                                                                                trim.note
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <span className="text-[12px] font-semibold block text-slate-900 dark:text-slate-200">
                                                                    {trim.surchargePerKg >
                                                                    0
                                                                        ? `+ETB ${trim.surchargePerKg}/kg`
                                                                        : "Included"}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                    {
                                                                        trim.yieldPercent
                                                                    }
                                                                    % yield
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* 3. CUTTING STYLE SECTION (Screenshot 5 with cartoons) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-black text-[11px] font-bold">
                                            {customizingProduct.trimmings
                                                ? 3
                                                : 2}
                                        </span>
                                        <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white">
                                            Cutting style
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {customizingProduct.cutStyles.length}{" "}
                                        options for this item
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {customizingProduct.cutStyles.map(cut => {
                                        const isSelected =
                                            selectedCutId === cut.id;

                                        let CartoonComponent = (
                                            <SteaksCutCartoon className="size-16" />
                                        );
                                        if (cut.cartoonType === "cubes")
                                            CartoonComponent = (
                                                <CubesCutCartoon className="size-16" />
                                            );
                                        if (cut.cartoonType === "strips")
                                            CartoonComponent = (
                                                <StripsCutCartoon className="size-16" />
                                            );
                                        if (cut.cartoonType === "minced")
                                            CartoonComponent = (
                                                <MincedCutCartoon className="size-16" />
                                            );
                                        if (cut.cartoonType === "slices")
                                            CartoonComponent = (
                                                <SlicesCutCartoon className="size-16" />
                                            );
                                        if (cut.cartoonType === "julienne")
                                            CartoonComponent = (
                                                <JulienneCutCartoon className="size-16" />
                                            );
                                        if (cut.cartoonType === "whole")
                                            CartoonComponent = (
                                                <WholeCutCartoon className="size-16" />
                                            );

                                        return (
                                            <button
                                                key={cut.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedCutId(cut.id)
                                                }
                                                className={cn(
                                                    "relative flex flex-col justify-between rounded-2xl p-3.5 text-left transition-all border",
                                                    isSelected
                                                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 text-slate-900 dark:bg-[#182a1e] dark:border-[#4ade80] dark:ring-[#4ade80]/30 dark:text-white shadow-sm"
                                                        : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:bg-[#1c2420] dark:border-white/5 dark:text-slate-300 dark:hover:bg-[#222d26]",
                                                )}
                                            >
                                                {/* Top checkmark */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex size-14 items-center justify-center rounded-xl bg-white dark:bg-black/25 p-1">
                                                        {CartoonComponent}
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="size-4 text-emerald-600 dark:text-[#4ade80] stroke-[3]" />
                                                    )}
                                                </div>

                                                <div className="mt-2 space-y-1">
                                                    <h4 className="font-bold text-[13px] text-slate-900 dark:text-white">
                                                        {cut.name}
                                                    </h4>
                                                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                        {cut.spec}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                                        {cut.description}
                                                    </p>
                                                    <span className="text-[11px] font-bold text-emerald-700 dark:text-[#4ade80] block pt-1">
                                                        {cut.surchargePerKg > 0
                                                            ? `+ETB ${cut.surchargePerKg}/kg`
                                                            : "Standard"}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 4. SPECIAL INSTRUCTIONS */}
                            <div className="space-y-1.5 pt-2">
                                <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                                    Special kitchen instructions (optional)
                                </label>
                                <input
                                    type="text"
                                    value={itemNotes}
                                    onChange={e => setItemNotes(e.target.value)}
                                    placeholder="e.g. Keep chilled with ice packs, double vacuum sealed..."
                                    className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#1c2420] dark:border-white/10 px-3 text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-[#4ade80]"
                                />
                            </div>
                        </div>

                        {/* Sticky Bottom Actions */}
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#121814] px-6 py-4 shadow-lg">
                            <div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                                    Estimated subtotal
                                </span>
                                <span className="text-[20px] font-black text-slate-900 dark:text-white">
                                    ETB {Math.round(customizerCalc.lineTotal)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCustomizingProduct(null)}
                                    className="rounded-full px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4ade80] dark:hover:bg-[#34d399] dark:text-[#062412] px-6 py-2.5 text-[13px] font-bold transition-all shadow-md"
                                >
                                    Add to Order
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* 5. CART SLIDE-OVER SHEET (Screenshot 1) */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 dark:bg-black/70 backdrop-blur-[3px] animate-in fade-in duration-200">
                    <div
                        className="flex-1"
                        onClick={() => setCartOpen(false)}
                    />
                    <aside className="relative flex h-full w-full max-w-md flex-col bg-white border-l border-slate-200 text-slate-900 dark:bg-[#0c130f] dark:border-white/5 dark:text-slate-200 shadow-2xl animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-200 dark:border-white/5">
                            <div>
                                <h2 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                                    Your cart
                                </h2>
                                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {cart.length}{" "}
                                    {cart.length === 1 ? "line" : "lines"}, each
                                    with its own preparation spec
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCartOpen(false)}
                                className="rounded-full p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Cart Items List */}
                        <div className="app-scroll flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 dark:text-slate-400">
                                    <ShoppingBag className="size-12 stroke-[1.2] mb-3 opacity-30 text-emerald-600 dark:text-[#4ade80]" />
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[16px]">
                                        Cart is empty
                                    </h4>
                                    <p className="text-[12.5px] max-w-xs mt-1 text-slate-500 dark:text-slate-400">
                                        Browse categories and add prepped
                                        ingredients or ready-to-cook packs.
                                    </p>
                                </div>
                            ) : (
                                cart.map(item => {
                                    const isPack =
                                        !!item.quantityPcs ||
                                        item.productName.includes("Pack");
                                    const portionText = isPack
                                        ? `${item.quantityPcs || 20} × 1 serving`
                                        : `${item.weightGrams >= 1000 ? `${item.weightGrams / 1000} kg` : `${item.weightGrams} g`}`;

                                    const unitRate =
                                        item.unitPrice ||
                                        (isPack ? 85 : item.pricePerKg);

                                    return (
                                        <div
                                            key={item.id}
                                            className="rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#16201a] dark:border-white/5 p-5 space-y-4 shadow-xs"
                                        >
                                            {/* Top Row: Cartoon Avatar + Title + Price */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="size-14 rounded-xl bg-white border border-slate-200 dark:bg-[#233128] dark:border-white/5 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                                                        {item.renderCartoon ? (
                                                            item.renderCartoon()
                                                        ) : (
                                                            <EthiopianTibsCartoon className="size-12" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[15px] text-slate-900 dark:text-white leading-snug">
                                                            {item.productName}
                                                        </h4>
                                                        <p className="text-[12px] text-slate-500 dark:text-slate-400">
                                                            ETB {unitRate}/
                                                            {isPack
                                                                ? "portion"
                                                                : "kg"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="font-extrabold text-[15px] text-slate-900 dark:text-white">
                                                        ETB{" "}
                                                        {item.lineTotal.toLocaleString(
                                                            "en-US",
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Preparation Spec Grid Table */}
                                            <div className="space-y-1.5 text-[12px] border-t border-slate-200 dark:border-white/5 pt-3">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                        Portions
                                                    </span>
                                                    <span className="text-slate-900 dark:text-white font-medium">
                                                        {portionText}
                                                    </span>
                                                </div>
                                                {item.fatType && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                            Fat
                                                        </span>
                                                        <span className="text-slate-900 dark:text-white font-medium">
                                                            {item.fatType}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.heatLevel && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                            Heat
                                                        </span>
                                                        <span className="text-slate-900 dark:text-white font-medium">
                                                            {item.heatLevel}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.cutName &&
                                                    !item.heatLevel && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                                Cut / Spec
                                                            </span>
                                                            <span className="text-slate-900 dark:text-white font-medium">
                                                                {item.cutName}
                                                            </span>
                                                        </div>
                                                    )}
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                        Packaging
                                                    </span>
                                                    <span className="text-slate-900 dark:text-white font-medium">
                                                        {item.packagingType ||
                                                            "Per-ingredient bags"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                        Prep & packing
                                                    </span>
                                                    <span className="text-slate-900 dark:text-white font-medium">
                                                        ETB 0.00
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom Row: Quantity pill [-] 20 pcs [+] + Edit / Remove */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5">
                                                {/* Quantity selector pill */}
                                                <div className="flex items-center rounded-full bg-white border border-slate-300 dark:bg-[#0c130f] dark:border-white/10 px-3 py-1 gap-3 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateCartQty(
                                                                item.id,
                                                                -1,
                                                            )
                                                        }
                                                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                                        title="Decrease"
                                                    >
                                                        <Minus className="size-3.5" />
                                                    </button>
                                                    <span className="text-[12px] font-bold text-slate-900 dark:text-white min-w-[44px] text-center">
                                                        {isPack
                                                            ? `${item.quantityPcs || 20} pcs`
                                                            : `${(item.weightGrams / 1000).toFixed(1)} kg`}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateCartQty(
                                                                item.id,
                                                                1,
                                                            )
                                                        }
                                                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                                        title="Increase"
                                                    >
                                                        <Plus className="size-3.5" />
                                                    </button>
                                                </div>

                                                {/* Actions: Edit & Remove */}
                                                <div className="flex items-center gap-3 text-[12px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEditCartItem(
                                                                item,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                                                    >
                                                        <PenLine className="size-3.5" />
                                                        <span>Edit</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveCartItem(
                                                                item.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        <span>Remove</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Action Links: + Add more ingredients & Clear cart */}
                            {cart.length > 0 && (
                                <div className="flex items-center justify-between text-[12.5px] pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCartOpen(false);
                                            setActiveView("catalog");
                                        }}
                                        className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-white font-medium transition-colors"
                                    >
                                        <span>+ Add more ingredients</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleClearCart}
                                        className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition-colors"
                                    >
                                        Clear cart
                                    </button>
                                </div>
                            )}

                            {/* Disclaimer Info Callout */}
                            <div className="flex items-start gap-2 pt-2 text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                <Info className="size-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
                                <p>
                                    Illustrative prices for demonstration only,
                                    not market quotations. Real prices depend on
                                    sourcing, preparation labour, packaging and
                                    delivery.
                                </p>
                            </div>
                        </div>

                        {/* Cart Footer */}
                        {cart.length > 0 && (
                            <div className="border-t border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-[#0a100d] p-6 space-y-4">
                                <div className="space-y-2 text-[13px]">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            ETB{" "}
                                            {cartTotal.toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                        <span>Estimated delivery</span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {deliveryFee === 0
                                                ? "FREE"
                                                : `ETB ${deliveryFee.toFixed(2)}`}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-baseline pt-2">
                                        <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                                            Grand total
                                        </span>
                                        <span className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                                            ETB{" "}
                                            {grandTotal.toLocaleString(
                                                "en-US",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </span>
                                    </div>

                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                                        Free scheduled delivery from ETB
                                        15,000.00.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCartOpen(false);
                                            setActiveView("catalog");
                                        }}
                                        className="rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-800 dark:border-white/10 dark:hover:border-white/20 dark:bg-[#141e17] dark:hover:bg-[#1b281f] dark:text-white py-3 text-[13px] font-bold transition-all text-center shadow-xs"
                                    >
                                        Add more
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handlePlaceOrder}
                                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4ade80] dark:hover:bg-[#3ce474] dark:text-[#062412] py-3 text-[13px] font-black transition-all shadow-md flex items-center justify-center gap-1.5"
                                    >
                                        <span>Checkout</span>
                                        <ArrowRight className="size-4 stroke-[2.5]" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {/* 6. HOW IT WORKS MODAL DIALOG */}
            {howItWorksOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-[3px] p-4 animate-in fade-in duration-200">
                    <div
                        className="flex-1 absolute inset-0"
                        onClick={() => setHowItWorksOpen(false)}
                    />
                    <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 text-slate-900 dark:bg-[#0e1611] dark:border-white/10 dark:text-slate-200 shadow-2xl space-y-6 p-6 sm:p-8">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <Leaf className="size-4.5 fill-emerald-400/30" />
                                </div>
                                <h3 className="text-[20px] font-black text-slate-900 dark:text-white">
                                    How FreshPrep Works
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHowItWorksOpen(false)}
                                className="rounded-full p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-[13px]">
                            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#142018] dark:border-white/5">
                                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-[#4ade80] dark:text-[#062412] font-black text-[12px] shrink-0">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[14px]">
                                        Select Kitchen Ingredients
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed text-[12.5px]">
                                        Choose from 12 aisle categories
                                        including fresh produce, root
                                        vegetables, butchered meats, aromatics,
                                        and ready-to-cook pack recipes.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#142018] dark:border-white/5">
                                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-[#4ade80] dark:text-[#062412] font-black text-[12px] shrink-0">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[14px]">
                                        Customize Preparation & Cut Styles
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed text-[12.5px]">
                                        Specify exact cuts (diced, julienne,
                                        steaks, minced, slices), trimming
                                        yields, fats, and packaging requirements
                                        per item.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#142018] dark:border-white/5">
                                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-[#4ade80] dark:text-[#062412] font-black text-[12px] shrink-0">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[14px]">
                                        Hygienic Prep & Cold-Chain Packing
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed text-[12.5px]">
                                        Every order is prepped in food-grade
                                        prep kitchens, vacuum sealed or packed
                                        in per-ingredient containers, and
                                        chilled at 0–4 °C.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#142018] dark:border-white/5">
                                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-[#4ade80] dark:text-[#062412] font-black text-[12px] shrink-0">
                                    4
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[14px]">
                                        Morning Kitchen Delivery
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed text-[12.5px]">
                                        Delivered directly to your central or
                                        branch kitchen before 06:00 AM so chefs
                                        and prep staff can immediately begin
                                        cooking.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setHowItWorksOpen(false)}
                                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4ade80] dark:hover:bg-[#3ce474] dark:text-[#062412] px-6 py-2.5 text-[13px] font-bold shadow transition-all"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
