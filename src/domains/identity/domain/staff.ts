import type { Role, StationRole } from "./role";

export type ShiftScheduleType = "morning" | "evening" | "full_day" | "custom";

export interface Staff {
    id: string;
    name: string;
    role: Role;
    pinHint: string;
    phone?: string;
    email?: string;
    stationId?: string;
    stationRole?: StationRole;
    active: boolean;
    assignedTableIds?: string[];
    shiftStatus?: "on_duty" | "on_break" | "off_duty";
    shiftSchedule?: ShiftScheduleType;
    shiftHours?: string;
    workingDays?: string[];
    joinedDate?: string;
}
