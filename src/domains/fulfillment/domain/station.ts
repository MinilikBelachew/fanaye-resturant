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
    description?: string;
    enabled: boolean;
    color?: string;
    category?: string;
    avgPrepMin?: number;
    printerIp?: string;
    ticketCount?: number;
}

export const DEFAULT_STATIONS: PreparationStation[] = [
    {
        id: STATION_IDS.kitchen,
        name: "Kitchen",
        description: "Hot meals, main dishes, tibs, kitfo, pasta & fire pizzas",
        enabled: true,
        color: "#e85d04",
        category: "Hot Food",
        avgPrepMin: 11,
        printerIp: "192.168.1.101",
        ticketCount: 86,
    },
    {
        id: STATION_IDS.barista,
        name: "Barista",
        description: "Specialty coffee, Ethiopian buna, tea, iced lattes & macchiato",
        enabled: true,
        color: "#d97706",
        category: "Beverages",
        avgPrepMin: 4,
        printerIp: "192.168.1.102",
        ticketCount: 64,
    },
    {
        id: STATION_IDS.cakes,
        name: "Cakes",
        description: "Fresh bakery, pastries, cheesecakes & desserts",
        enabled: true,
        color: "#db2777",
        category: "Pastry",
        avgPrepMin: 3,
        printerIp: "192.168.1.103",
        ticketCount: 28,
    },
    {
        id: STATION_IDS.soft_drinks,
        name: "Soft Drinks",
        description: "Bottled water, sodas, juices & cold canned refreshments",
        enabled: true,
        color: "#0284c7",
        category: "Cold Bar",
        avgPrepMin: 2,
        printerIp: "192.168.1.104",
        ticketCount: 41,
    },
];
