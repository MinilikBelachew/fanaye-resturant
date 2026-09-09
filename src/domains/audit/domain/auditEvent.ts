export type AuditCategory =
    | "orders"
    | "fulfillment"
    | "payments"
    | "system";

export interface AuditEvent {
    id: string;
    occurredAt: string;
    timestampLabel: string;
    actorName: string;
    actorRole: string;
    action: string;
    actionLabel: string;
    category: AuditCategory;
    badgeLabel: string;
    badgeVariant: "default" | "success" | "warning" | "secondary";
    details?: string | null;
}
