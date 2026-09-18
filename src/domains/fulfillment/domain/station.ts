export const STATION_IDS = {
    kitchen: "station-kitchen",
    barista: "station-barista",
    cakes: "station-cakes",
    soft_drinks: "station-soft-drinks",
} as const;

export type StationId = string;

export interface PreparationStation {
    id: string;
    name: string;
    code?: string | null;
    description?: string;
    status?: string;
    enabled: boolean;
    color?: string;
    category?: string;
    avgPrepMin?: number;
    defaultDelayThresholdMinutes?: number | null;
    sortOrder?: number;
    ticketCount?: number;
    menuItemCount?: number;
}

export const DEFAULT_STATIONS: PreparationStation[] = [
    {
        id: STATION_IDS.kitchen,
        name: "Kitchen",
        code: "kitchen",
        description: "Hot meals, main dishes, tibs, kitfo, pasta & fire pizzas",
        enabled: true,
        status: "ACTIVE",
        color: "#e85d04",
        category: "Hot Food",
        avgPrepMin: 11,
        defaultDelayThresholdMinutes: 11,
        ticketCount: 86,
    },
    {
        id: STATION_IDS.barista,
        name: "Barista",
        code: "barista",
        description:
            "Specialty coffee, Ethiopian buna, tea, iced lattes & macchiato",
        enabled: true,
        status: "ACTIVE",
        color: "#d97706",
        category: "Beverages",
        avgPrepMin: 4,
        defaultDelayThresholdMinutes: 4,
        ticketCount: 64,
    },
    {
        id: STATION_IDS.cakes,
        name: "Cakes",
        code: "cakes",
        description: "Fresh bakery, pastries, cheesecakes & desserts",
        enabled: true,
        status: "ACTIVE",
        color: "#db2777",
        category: "Pastry",
        avgPrepMin: 3,
        defaultDelayThresholdMinutes: 3,
        ticketCount: 28,
    },
    {
        id: STATION_IDS.soft_drinks,
        name: "Soft Drinks",
        code: "soft-drinks",
        description: "Bottled water, sodas, juices & cold canned refreshments",
        enabled: true,
        status: "ACTIVE",
        color: "#0284c7",
        category: "Cold Bar",
        avgPrepMin: 2,
        defaultDelayThresholdMinutes: 2,
        ticketCount: 41,
    },
];
