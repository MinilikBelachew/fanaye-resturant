export interface StaffNotification {
    id: string;
    waiterId: string;
    tableId: string;
    tableNumber: string;
    itemId: string;
    type: "item_ready";
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
}
