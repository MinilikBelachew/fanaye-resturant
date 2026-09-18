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

export interface OpsHealth {
    dailyCloseCompliancePct: number;
    branchesClosedToday: number;
    activeBranches: number;
    offlineStations: number;
    totalStations: number;
    stationAvailabilityPct: number;
    pendingCashDrops: number;
    openProductionExceptions: number;
    unpaidBills: number;
    openSessions: number;
    cashVarianceAbsTotal: number;
    cashVarianceBranches: number;
    cashHealthPct: number;
    digitalSettlementPct: number;
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
    opsHealth: OpsHealth;
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

export interface UpdateTenantPayload {
    name?: string;
    legalName?: string;
    concept?: string;
    planCode?: string;
    city?: string;
    area?: string;
    address?: string;
    phone?: string;
    email?: string;
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;
    managerPassword?: string;
    branchName?: string;
    branchCode?: string;
    hours?: string;
}

export interface PlatformAuditEvent {
    id: string;
    action: string;
    category?: string;
    entityName: string;
    entityType?: string;
    entityId?: string;
    tenantId?: string | null;
    tenantName?: string;
    actorName?: string;
    actorRole?: string;
    description: string;
    occurredAt: string;
    severity: string;
    metadataJson?: Record<string, unknown> | null;
}

export interface PlatformAuditSummary {
    totalToday: number;
    securityToday: number;
    operationsToday: number;
    systemToday: number;
}

export interface PlatformAuditQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    tenantId?: string;
    category?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
}

export interface PlatformAuditListResponse {
    data: PlatformAuditEvent[];
    meta?: PaginationMeta;
    summary?: PlatformAuditSummary;
}

export interface LiveOpsBranch {
    branchId: string;
    branchName: string;
    branchCode: string;
    tenantId: string;
    tenantName: string;
    status: string;
    openSessions: number;
    openOrders: number;
    unpaidBills: number;
    tableCount: number;
}

export interface LiveOpsResponse {
    summary: {
        openSessions: number;
        openOrders: number;
        unpaidBills: number;
        activeBranches: number;
        liveTenants: number;
    };
    branches: LiveOpsBranch[];
}

export interface PlatformStaffMember {
    membershipId: string;
    userId: string;
    displayName: string;
    email?: string;
    phone?: string;
    tenantId: string;
    tenantName: string;
    roles: string[];
    accountStatus: string;
    membershipStatus: string;
    lastLoginAt?: string | null;
    hasPassword: boolean;
    hasPin?: boolean;
    photoUrl?: string | null;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PlatformStaffQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    tenantId?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface PlatformStaffListResponse {
    data: PlatformStaffMember[];
    meta?: PaginationMeta;
}

export interface CreatePlatformStaffPayload {
    tenantId: string;
    name: string;
    role: string;
    pin: string;
    email?: string;
    phone?: string;
    stationCode?: string;
}

export interface ResetPlatformStaffPinPayload {
    membershipId: string;
    pin: string;
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

        updateSuperAdminTenant: builder.mutation<
            TenantDetailResponse,
            { id: string; body: UpdateTenantPayload }
        >({
            query: ({ id, body }) => ({
                url: `/super-admin/tenants/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Auth", "Floor", "DailyClose", "Shift"],
        }),

        getSuperAdminAudit: builder.query<
            PlatformAuditListResponse,
            PlatformAuditQueryParams | void
        >({
            query: params => ({
                url: "/super-admin/audit",
                method: "GET",
                params: params || undefined,
            }),
            providesTags: ["Auth"],
        }),

        getSuperAdminLiveOps: builder.query<LiveOpsResponse, void>({
            query: () => ({
                url: "/super-admin/live-ops",
                method: "GET",
            }),
            providesTags: ["Auth", "Floor", "Shift", "DailyClose"],
        }),

        getSuperAdminStaff: builder.query<
            PlatformStaffListResponse,
            PlatformStaffQueryParams | void
        >({
            query: params => ({
                url: "/super-admin/staff",
                method: "GET",
                params: params || undefined,
            }),
            providesTags: ["Auth"],
        }),

        createSuperAdminStaff: builder.mutation<
            PlatformStaffMember,
            CreatePlatformStaffPayload
        >({
            query: body => ({
                url: "/super-admin/staff",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Auth"],
        }),

        resetSuperAdminStaffPin: builder.mutation<
            PlatformStaffMember,
            ResetPlatformStaffPinPayload
        >({
            query: ({ membershipId, pin }) => ({
                url: `/super-admin/staff/${membershipId}/pin`,
                method: "PATCH",
                body: { pin },
            }),
            invalidatesTags: ["Auth"],
        }),

        suspendSuperAdminStaff: builder.mutation<
            PlatformStaffMember,
            { membershipId: string; suspended: boolean }
        >({
            query: ({ membershipId, suspended }) => ({
                url: `/super-admin/staff/${membershipId}/suspend`,
                method: "PATCH",
                body: { suspended },
            }),
            invalidatesTags: ["Auth"],
        }),

        resetSuperAdminStaffPassword: builder.mutation<
            PlatformStaffMember,
            { membershipId: string; password: string }
        >({
            query: ({ membershipId, password }) => ({
                url: `/super-admin/staff/${membershipId}/password`,
                method: "PATCH",
                body: { password },
            }),
            invalidatesTags: ["Auth"],
        }),
    }),
});

export const {
    useGetSuperAdminDashboardQuery,
    useGetSuperAdminTenantsQuery,
    useGetSuperAdminTenantByIdQuery,
    useCreateSuperAdminTenantMutation,
    useUpdateSuperAdminTenantMutation,
    useGetSuperAdminAuditQuery,
    useGetSuperAdminLiveOpsQuery,
    useGetSuperAdminStaffQuery,
    useCreateSuperAdminStaffMutation,
    useResetSuperAdminStaffPinMutation,
    useSuspendSuperAdminStaffMutation,
    useResetSuperAdminStaffPasswordMutation,
} = superAdminApi;
