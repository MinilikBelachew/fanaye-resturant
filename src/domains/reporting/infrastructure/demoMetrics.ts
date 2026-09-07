import { DISH_IMAGES } from "@/lib/media";

export const WEEKLY_SALES = [
    { day: "Mon", sales: 18400, orders: 62 },
    { day: "Tue", sales: 21200, orders: 71 },
    { day: "Wed", sales: 19850, orders: 66 },
    { day: "Thu", sales: 24600, orders: 84 },
    { day: "Fri", sales: 31240, orders: 108 },
    { day: "Sat", sales: 38720, orders: 132 },
    { day: "Sun", sales: 27410, orders: 97 },
];

export const REVENUE_VS_FULFILLMENT = [
    { month: "Sep", revenue: 38.4, cost: 24.2, collections: 36.8 },
    { month: "Oct", revenue: 35.2, cost: 22.1, collections: 33.5 },
    { month: "Nov", revenue: 39.8, cost: 25.0, collections: 38.2 },
    { month: "Dec", revenue: 44.5, cost: 28.3, collections: 43.1 },
    { month: "Jan", revenue: 41.2, cost: 26.4, collections: 39.9 },
    { month: "Feb", revenue: 38.6, cost: 24.8, collections: 37.4 },
    { month: "Mar", revenue: 42.1, cost: 27.2, collections: 41.0 },
    { month: "Apr", revenue: 45.8, cost: 29.5, collections: 44.2 },
    { month: "May", revenue: 43.4, cost: 28.1, collections: 42.0 },
    { month: "Jun", revenue: 47.9, cost: 30.6, collections: 46.5 },
    { month: "Jul", revenue: 52.3, cost: 33.8, collections: 51.0 },
    { month: "Aug", revenue: 49.6, cost: 31.9, collections: 48.2 },
];

export const ETHIOPIAN_PAYMENT_CHANNELS = [
    {
        id: "telebirr",
        name: "Telebirr",
        share: 38,
        amount: "ETB 18.8k",
        color: "#e85d04",
    },
    {
        id: "cbe",
        name: "CBE Birr",
        share: 29,
        amount: "ETB 14.3k",
        color: "#ea580c",
    },
    {
        id: "transfer",
        name: "Bank transfer (Awash/Dashen)",
        share: 19,
        amount: "ETB 9.4k",
        color: "#f97316",
    },
    {
        id: "cash",
        name: "Cash",
        share: 11,
        amount: "ETB 5.4k",
        color: "#fb923c",
    },
    {
        id: "other",
        name: "Partner / Card",
        share: 3,
        amount: "ETB 1.5k",
        color: "#fdba74",
    },
];

export const PREPARATION_DURATION_BUCKETS = [
    { bucket: "< 5m", tickets: 68, label: "Instant & Drinks" },
    { bucket: "5–10m", tickets: 42, label: "Fast Kitchen" },
    { bucket: "10–15m", tickets: 28, label: "Standard Mains" },
    { bucket: "15–20m", tickets: 14, label: "Oven & Grills" },
    { bucket: "20m+", tickets: 6, label: "Special Orders" },
];

export const WEEKLY_CASH_MOVEMENT = [
    { day: "Mon", digitalInflow: 6.2, cashDrop: 4.8 },
    { day: "Tue", digitalInflow: 7.1, cashDrop: 5.2 },
    { day: "Wed", digitalInflow: 5.8, cashDrop: 6.4 },
    { day: "Thu", digitalInflow: 8.4, cashDrop: 5.9 },
    { day: "Fri", digitalInflow: 9.8, cashDrop: 7.6 },
    { day: "Sat", digitalInflow: 12.4, cashDrop: 9.1 },
    { day: "Sun", digitalInflow: 8.6, cashDrop: 6.8 },
];

export const TOP_SELLING_DISHES = [
    {
        name: "Special Kitfo",
        category: "Kitchen",
        revenue: 18400,
        orders: 68,
        percent: 92,
        image: DISH_IMAGES.salad,
    },
    {
        name: "Fire Pizza",
        category: "Kitchen",
        revenue: 12800,
        orders: 40,
        percent: 64,
        image: DISH_IMAGES.pizza,
    },
    {
        name: "Cheeseburger",
        category: "Kitchen",
        revenue: 11200,
        orders: 40,
        percent: 56,
        image: DISH_IMAGES.burger,
    },
    {
        name: "Iced Spanish Latte",
        category: "Barista",
        revenue: 6800,
        orders: 62,
        percent: 34,
        image: DISH_IMAGES.latte,
    },
    {
        name: "Cheesecake",
        category: "Cakes",
        revenue: 4200,
        orders: 28,
        percent: 21,
        image: DISH_IMAGES.cheesecake,
    },
];

export const STATION_THROUGHPUT = [
    { station: "Kitchen", tickets: 86, avgMin: 11 },
    { station: "Barista", tickets: 64, avgMin: 4 },
    { station: "Cakes", tickets: 28, avgMin: 3 },
    { station: "Soft Drinks", tickets: 41, avgMin: 2 },
];

export const PAYMENT_MIX = [
    { method: "cash", label: "Cash", value: 58 },
    { method: "transfer", label: "Transfer", value: 42 },
];

export const PLATFORM_GROWTH = [
    { month: "Mar", tenants: 12, gmv: 420 },
    { month: "Apr", tenants: 18, gmv: 610 },
    { month: "May", tenants: 24, gmv: 880 },
    { month: "Jun", tenants: 31, gmv: 1120 },
    { month: "Jul", tenants: 38, gmv: 1410 },
    { month: "Aug", tenants: 47, gmv: 1860 },
    { month: "Sep", tenants: 54, gmv: 2140 },
];

export const FEATURED_DISHES = [
    {
        name: "Cheeseburger",
        caption: "Top seller · Kitchen",
        image: DISH_IMAGES.burger,
        price: 280,
        sold: 146,
    },
    {
        name: "Fire pizza",
        caption: "Weekend special · Kitchen",
        image: DISH_IMAGES.pizza,
        price: 320,
        sold: 91,
    },
    {
        name: "Spaghetti pomodoro",
        caption: "Dish of the day · Kitchen",
        image: DISH_IMAGES.pasta,
        price: 240,
        sold: 73,
    },
];
