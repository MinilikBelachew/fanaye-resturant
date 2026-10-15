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

export type HandoverCandidate = {
    membershipId: string;
    displayName: string;
    roleCode: string;
    photoUrl?: string | null;
};

export type ShiftHandoverRequest = {
    expectedVersion: number;
    countedAmount: number;
    floatForNextCashier: number;
    incomingCashierMembershipId: string;
    incomingCashierPin: string;
    notes?: string;
};

export type ShiftHandoverResponse = {
    outgoingCashierName: string;
    incomingCashierName: string;
    countedAmountFormatted: string;
    expectedAmountFormatted: string;
    varianceAmountFormatted: string;
    floatTransferredFormatted: string;
    safeDropAmountFormatted: string;
    handedOverAt: string;
    status: string;
};

export type WaiterShiftHandoverRequest = {
    expectedVersion: number;
    transferredCashAmount: number;
    incomingWaiterMembershipId: string;
    incomingWaiterPin: string;
    notes?: string;
};

export type WaiterShiftHandoverResponse = {
    outgoingWaiterName: string;
    incomingWaiterName: string;
    tablesTransferredCount: number;
    tablesTransferredNames: string[];
    cashTransferredFormatted: string;
    handedOverAt: string;
    status: string;
};

export type ShiftDefinition = {
    id: string;
    name: string;
    startLocalTime: string;
    endLocalTime: string;
    graceMinutes: number;
    status: string;
};

export type CreateShiftDefinitionRequest = {
    name: string;
    startLocalTime: string;
    endLocalTime: string;
    graceMinutes?: number;
};

export type UpdateShiftDefinitionRequest = {
    name?: string;
    startLocalTime?: string;
    endLocalTime?: string;
    graceMinutes?: number;
};

export type ShiftExpiryInfo = {
    isPast: boolean;
    endTime: string;
    minutesOverdue: number;
};

export function checkShiftExpiry(
    session: ShiftSession | null | undefined,
    currentTimeMs?: number,
): ShiftExpiryInfo {
    if (!session || !session.scheduledEndAt) {
        return { isPast: false, endTime: "", minutesOverdue: 0 };
    }
    const end = new Date(session.scheduledEndAt);
    if (isNaN(end.getTime())) {
        return { isPast: false, endTime: "", minutesOverdue: 0 };
    }
    const now = currentTimeMs ? new Date(currentTimeMs) : new Date();
    const diffMs = now.getTime() - end.getTime();
    if (diffMs > 0) {
        const minutesOverdue = Math.floor(diffMs / 60000);
        const endTime = end.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        return { isPast: true, endTime, minutesOverdue };
    }
    return { isPast: false, endTime: "", minutesOverdue: 0 };
}
