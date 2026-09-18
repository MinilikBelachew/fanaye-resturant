export interface Tenant {
    id: string;
    name: string;
    plan: "starter" | "pro" | "enterprise";
    active: boolean;
}

export const DEMO_TENANT: Tenant = {
    id: "tenant-fanaye",
    name: "Demo Restaurant",
    plan: "pro",
    active: true,
};
