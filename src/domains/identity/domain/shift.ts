export type ShiftAssignmentSummary = {
    id: string;
    definitionName: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    roleCode: string | null;
};

export type ShiftSession = {
    id: string;
    state: string;
    version: number;
    clockInAt: string;
    clockOutAt: string | null;
    scheduledStartAt: string | null;
    scheduledEndAt: string | null;
    definitionName: string | null;
    roleCode: string | null;
    branchId: string;
    assignmentId: string | null;
};

export type CurrentShiftResponse = {
    clockedIn: boolean;
    shiftSession: ShiftSession | null;
    upcomingAssignment: ShiftAssignmentSummary | null;
};

export type ClockInRequest = {
    shiftAssignmentId?: string;
    roleId?: number;
};

export type ClockOutRequest = {
    shiftSessionId: string;
    expectedVersion: number;
};
