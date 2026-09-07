export interface Tenant {
    id: string;
    name: string;
    plan: "starter" | "pro" | "enterprise";
    active: boolean;
}

export const DEMO_TENANT: Tenant = {
    id: "tenant-fanaye",
    name: "Fanaye Restaurant",
    plan: "pro",
    active: true,
};
