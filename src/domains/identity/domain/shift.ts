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

export type ShiftTableSummary = {
    tableId: string;
    displayName: string;
    displayNumber: string | null;
    locationName: string;
};

export type WeeklyShiftPlanItem = {
    dayCode: string;
    definitionName: string;
    startLocalTime: string;
    endLocalTime: string;
    shiftDefinitionId: string;
    tables?: ShiftTableSummary[];
};

export type CurrentShiftResponse = {
    clockedIn: boolean;
    shiftSession: ShiftSession | null;
    upcomingAssignment: ShiftAssignmentSummary | null;
    weeklyPlan?: WeeklyShiftPlanItem[];
    upcomingAssignments?: ShiftAssignmentSummary[];
    assignedTables?: ShiftTableSummary[];
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
    if (!session) {
        return { isPast: false, endTime: "", minutesOverdue: 0 };
    }
    const now = currentTimeMs ? new Date(currentTimeMs) : new Date();

    if (session.scheduledEndAt) {
        const end = new Date(session.scheduledEndAt);
        if (!isNaN(end.getTime())) {
            const diffMs = now.getTime() - end.getTime();
            if (diffMs > 0) {
                const minutesOverdue = Math.floor(diffMs / 60000);
                const endTime = end.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
                return { isPast: true, endTime, minutesOverdue };
            }
        }
    }

    // Safety guard: Any continuous shift open for more than 14 hours is overdue/stale
    if (session.clockInAt) {
        const clockIn = new Date(session.clockInAt);
        if (!isNaN(clockIn.getTime())) {
            const elapsedMs = now.getTime() - clockIn.getTime();
            const MAX_SHIFT_MS = 14 * 60 * 60 * 1000;
            if (elapsedMs > MAX_SHIFT_MS) {
                const minutesOverdue = Math.floor(
                    (elapsedMs - MAX_SHIFT_MS) / 60000,
                );
                return {
                    isPast: true,
                    endTime: ">14h",
                    minutesOverdue,
                };
            }
        }
    }

    return { isPast: false, endTime: "", minutesOverdue: 0 };
}

export const DAY_ORDER = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
] as const;

export const DAY_ETHIOPIAN: Record<
    (typeof DAY_ORDER)[number],
    { en: string; am: string; shortAm: string }
> = {
    Mon: { en: "Monday", am: "ሰኞ", shortAm: "ሰኞ" },
    Tue: { en: "Tuesday", am: "ማክሰኞ", shortAm: "ማክ" },
    Wed: { en: "Wednesday", am: "ረቡዕ", shortAm: "ረቡ" },
    Thu: { en: "Thursday", am: "ሐሙስ", shortAm: "ሐሙ" },
    Fri: { en: "Friday", am: "ዓርብ", shortAm: "ዓር" },
    Sat: { en: "Saturday", am: "ቅዳሜ", shortAm: "ቅዳ" },
    Sun: { en: "Sunday", am: "እሑድ", shortAm: "እሑ" },
};

export function format12HourTime(time24?: string | null): string {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mm} ${period}`;
}

export function formatEthiopianShiftRange(
    start24?: string | null,
    end24?: string | null,
    isAmharic = true,
): string {
    if (!start24 || !end24) return "";
    const parseEth = (t: string) => {
        const parts = t.split(":");
        const hour = parseInt(parts[0], 10) || 0;
        const minute = parseInt(parts[1], 10) || 0;
        const minStr = minute < 10 ? `0${minute}` : `${minute}`;

        let ethHour: number;
        let periodAm: string;
        let periodEn: string;

        if (hour >= 6 && hour < 12) {
            ethHour = hour - 6 === 0 ? 12 : hour - 6;
            periodAm = "ጠዋት";
            periodEn = "Morning";
        } else if (hour === 12) {
            ethHour = 6;
            periodAm = "ቀትር";
            periodEn = "Noon";
        } else if (hour > 12 && hour < 18) {
            ethHour = hour - 6;
            periodAm = "ከሰዓት";
            periodEn = "Afternoon";
        } else if (hour >= 18 && hour < 24) {
            ethHour = hour - 18 === 0 ? 12 : hour - 18;
            periodAm = "ማታ";
            periodEn = "Night";
        } else {
            ethHour = hour + 6;
            periodAm = "ሌሊት";
            periodEn = "Night";
        }

        return {
            ethHour,
            minStr,
            periodAm,
            periodEn,
            formattedAm: `${ethHour}:${minStr} ${periodAm}`,
            formattedEn: `${ethHour}:${minStr} (${periodEn})`,
        };
    };

    const s = parseEth(start24);
    const e = parseEth(end24);

    if (isAmharic) {
        return `${s.formattedAm} – ${e.formattedAm}`;
    }
    return `${s.formattedEn} – ${e.formattedEn}`;
}
