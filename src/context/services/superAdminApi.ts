import { api } from "./index";

export interface SuperAdminKpis {
    liveTenantsCount: number;
    provisionedTenantsCount: number;
    tenantGrowthRate: string;
    networkGmvTodayFormatted: string;
    networkGmvTodayValue: number;
    networkGmvTrend: string;
    networkGmvTrendLabel: string;
    activeBranchesCount: number;
    citiesCount: number;
    branchesLocationSummary: string;
    digitalSettlementPercentage: string;
    digitalSettlementValue: number;
    digitalSettlementTrend: string;
    platformMrrFormatted: string;
    platformMrrValue: number;
    systemUptimePercentage: string;
}

export interface NetworkGmvTrendPoint {
    period: string;
    networkGmv: number;
    digitalVolume: number;
    subscriptionInflow: number;
}

export interface PlatformHealthRadarPoint {
    dimension: string;
    score: number;
    benchmark: number;
}

export interface PlanDistributionItem {
    planCode: string;
    name: string;
    tenantCount: number;
    percentage: number;
    color: string;
}

export interface CityDistributionItem {
    city: string;
    branchCount: number;
    percentage: number;
}

export interface TenantFleetItem {
    id: string;
    name: string;
    slug: string;
    plan: string;
    city: string;
    branchCount: number;
    gmvTodayValue: number;
    gmvTodayFormatted: string;
    activeTablesCount: number;
    status: string;
    active: boolean;
}

export interface PlatformAuditEvent {
    id: string;
    action: string;
    entityName: string;
    description: string;
    occurredAt: string;
    severity: string;
}

export interface SuperAdminDashboardData {
    kpis: SuperAdminKpis;
    gmvTrend: NetworkGmvTrendPoint[];
    healthRadar: PlatformHealthRadarPoint[];
    planDistribution: PlanDistributionItem[];
    cityDistribution: CityDistributionItem[];
    tenants: TenantFleetItem[];
    recentAuditEvents: PlatformAuditEvent[];
    businessDate: string;
}

export interface SuperAdminDashboardResponse {
    data: SuperAdminDashboardData;
}

export interface TenantBranchSummary {
    id: string;
    name: string;
    displayCode: string;
    status: string;
    timezone: string;
    tablesCount: number;
    staffCount: number;
}

export interface TenantDetail {
    id: string;
    name: string;
    legalName?: string;
    slug: string;
    plan: string;
    city: string;
    area: string;
    address: string;
    phone: string;
    email: string;
    manager: string;
    hours: string;
    concept: string;
    branches: number;
    tableCount: number;
    staffCount: number;
    gmvToday: number;
    gmvTodayFormatted: string;
    status: string;
    active: boolean;
    provisionedAt: string;
    branchesList?: TenantBranchSummary[];
}

export interface TenantListResponse {
    data: TenantDetail[];
}

export interface TenantDetailResponse {
    data: TenantDetail;
}

export interface CreateTenantPayload {
    name: string;
    legalName?: string;
    concept?: string;
    planCode?: string;
    city: string;
    area: string;
    address: string;
    phone: string;
    email: string;
    managerName: string;
    managerPhone?: string;
    managerEmail?: string;
    managerPassword?: string;
    branchName: string;
    branchCode?: string;
    hours?: string;
    tableCount?: number;
    activeStations?: string[];
}

export const superAdminApi = api.injectEndpoints({
    endpoints: builder => ({
        getSuperAdminDashboard: builder.query<
            SuperAdminDashboardResponse,
            { businessDate?: string } | void
        >({
            query: params => ({
                url: "/super-admin/dashboard",
                method: "GET",
                params: params || undefined,
            }),
            providesTags: ["Auth", "DailyClose", "Floor", "Shift"],
        }),

        getSuperAdminTenants: builder.query<TenantListResponse, void>({
            query: () => ({
                url: "/super-admin/tenants",
                method: "GET",
            }),
            providesTags: ["Auth", "Floor"],
        }),

        getSuperAdminTenantById: builder.query<TenantDetailResponse, string>({
            query: id => ({
                url: `/super-admin/tenants/${id}`,
                method: "GET",
            }),
            providesTags: ["Auth", "Floor"],
        }),

        createSuperAdminTenant: builder.mutation<
            TenantDetailResponse,
            CreateTenantPayload
        >({
            query: body => ({
                url: "/super-admin/tenants",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Auth", "Floor", "DailyClose", "Shift"],
        }),
    }),
});

export const {
    useGetSuperAdminDashboardQuery,
    useGetSuperAdminTenantsQuery,
    useGetSuperAdminTenantByIdQuery,
    useCreateSuperAdminTenantMutation,
} = superAdminApi;

