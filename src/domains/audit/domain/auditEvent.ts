export interface AuditEvent {
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    at: string;
}
