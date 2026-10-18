export type AdminShiftDefinition = {
    id: string;
    name: string;
    startLocalTime: string;
    endLocalTime: string;
    graceMinutes: number;
    status: string;
};

export type AdminStaffCoverageTable = {
    tableId: string;
    displayName: string;
    displayNumber: string | null;
    locationName: string;
};

export type AdminStaffShiftCoverage = {
    shiftDefinitionId: string;
    shiftName: string;
    startLocalTime: string;
    endLocalTime: string;
    tables: AdminStaffCoverageTable[];
};

export type AdminStaffDayShift = {
    dayCode: string;
    shiftDefinitionId: string;
    shiftName: string;
    startLocalTime: string;
    endLocalTime: string;
};

export type AdminStaffMember = {
    id: string;
    name: string;
    roleCode: string;
    roleLabel: string;
    active: boolean;
    workingDays: string[];
    dayShifts?: AdminStaffDayShift[];
    phone: string | null;
    email: string | null;
    hasPin?: boolean;
    hasPassword?: boolean;
    stationId?: string | null;
    stationName?: string | null;
    branchId?: string | null;
    branchName?: string | null;
    shiftCoverages: AdminStaffShiftCoverage[];
    employeeCode?: string | null;
    jobTitle?: string | null;
    employmentType?: string | null;
    payType?: string | null;
    basePay?: number | null;
    hireDate?: string | null;
    probationEndDate?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    hrNotes?: string | null;
    annualLeaveBalanceDays?: number | null;
    photoId?: string | null;
    photoPath?: string | null;
};

export type AdminStaffListResponse = {
    data: AdminStaffMember[];
    shifts: AdminShiftDefinition[];
};

export type AdminShiftFloorTable = {
    tableId: string;
    displayName: string;
    displayNumber: string | null;
    locationId: string;
    locationName: string;
    assignedWaiterMembershipId: string | null;
    assignedWaiterName: string | null;
};

export type AdminShiftFloorLocation = {
    id: string;
    name: string;
    sortOrder: number;
    tables: AdminShiftFloorTable[];
};

export type AdminShiftFloorResponse = {
    shiftDefinitionId: string;
    shiftName: string;
    startLocalTime: string;
    endLocalTime: string;
    locations: AdminShiftFloorLocation[];
};
