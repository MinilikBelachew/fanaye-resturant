export type AuthWorkspace = {
    workspace: string;
    roleCode: string;
    tenantId: string | null;
    branchId: string | null;
    staffMembershipId: string | null;
};

export type AuthContext = {
    userId: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    tenantId: string | null;
    branchId: string | null;
    branchName: string | null;
    staffMembershipId: string | null;
    roleCode: string;
    stationId: string | null;
    stationCode: string | null;
    stationName: string | null;
    shiftSessionId: string | null;
    permissions: string[];
    workspaces: AuthWorkspace[];
};

export type AuthUserSummary = {
    id: string | number;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
};

export type LoginResponse = {
    token: string;
    tokenExpires: number;
    user: AuthUserSummary;
    context: AuthContext;
};

export type AuthMeResponse = {
    user: AuthUserSummary;
    context: AuthContext;
};
