export type AdminModifierOption = {
    id: string;
    name: string;
    priceDelta: string;
    currencyCode: string;
};

export type AdminModifierGroup = {
    id: string;
    name: string;
    kind: "included" | "extra" | "choice";
    minSelections: number;
    maxSelections: number;
    required: boolean;
    options: AdminModifierOption[];
};

export type AdminMenuItem = {
    id: string;
    menuId: string;
    name: string;
    description: string | null;
    price: string;
    currencyCode: string;
    soldOut: boolean;
    available: boolean;
    categoryId: string | null;
    categoryName: string;
    preparationStationId: string;
    stationName: string;
    expectedPrepMinutes: number | null;
    status: string;
    version: number;
    imageKey: string | null;
    imageFileId: string | null;
    imageUrl: string | null;
    badge?: string | null;
    showOnQrMenu?: boolean;
    modifierGroups: AdminModifierGroup[];
};

export type AdminMenuMeta = {
    menuId: string;
    defaultPeriodId: string | null;
    stations: Array<{
        id: string;
        name: string;
        code: string | null;
        status: string;
    }>;
    categories: Array<{
        id: string;
        name: string;
        sortOrder: number;
    }>;
};

export type CreateAdminMenuItemBody = {
    name: string;
    description?: string;
    price: string;
    preparationStationId: string;
    categoryName?: string;
    categoryId?: string;
    expectedPrepMinutes?: number;
    available?: boolean;
    imageKey?: string | null;
    imageFileId?: string | null;
    modifierGroupIds?: string[];
    modifierGroups?: Array<{
        name: string;
        kind?: "included" | "extra" | "choice";
        options: Array<{ name: string; priceDelta?: string }>;
    }>;
};

export type UpdateAdminMenuItemBody = CreateAdminMenuItemBody & {
    expectedVersion?: number;
};

export type CreateAdminModifierGroupBody = {
    name: string;
    kind?: "included" | "extra" | "choice";
    options: Array<{ name: string; priceDelta?: string }>;
};
