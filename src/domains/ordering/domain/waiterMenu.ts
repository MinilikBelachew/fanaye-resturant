export type WaiterMenuCategory = {
    id: string;
    name: string;
    sortOrder: number;
};

export type WaiterModifierOption = {
    id: string;
    name: string;
    priceDelta: string;
    currencyCode: string;
};

export type WaiterModifierGroup = {
    id: string;
    name: string;
    required: boolean;
    minSelections: number;
    maxSelections: number;
    options: WaiterModifierOption[];
};

export type WaiterMenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: string;
    currencyCode: string;
    soldOut: boolean;
    categoryId: string | null;
    categoryName: string;
    station: { id: string; name: string };
    expectedPrepMinutes: number | null;
    imageKey?: string | null;
    imageFileId?: string | null;
    imageUrl?: string | null;
    modifierGroups: WaiterModifierGroup[];
};

export type WaiterMenuResponse = {
    menuId: string;
    activePeriod: { id: string; name: string } | null;
    categories: WaiterMenuCategory[];
    items: WaiterMenuItem[];
};

export type OrderModifier = {
    name: string;
    priceDelta: string;
};

export type SessionOrderItem = {
    orderItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: string;
    currencyCode: string;
    state: string;
    version: number;
    servedAt?: string | null;
    stationId: string;
    stationName: string;
    specialInstruction: string | null;
    modifiers: OrderModifier[];
};

export type SessionOrder = {
    orderId: string;
    status: string;
    confirmedAt: string;
    items: SessionOrderItem[];
};

export type SessionOrdersResponse = {
    tableSessionId: string;
    sessionStatus: string;
    version: number;
    data: SessionOrder[];
};

export type ConfirmOrderRequest = {
    tableSessionId: string;
    expectedTableSessionVersion: number;
    items: Array<{
        menuItemId: string;
        quantity: number;
        modifierOptionIds?: string[];
        specialInstruction?: string;
    }>;
};

export type ConfirmOrderResponse = {
    orderId: string;
    tableSessionId: string;
    status: string;
    confirmedAt: string;
    businessDate: string;
    createdByWaiterMembershipId: string;
    items: SessionOrderItem[];
    tableSession: { status: string; version: number };
};
