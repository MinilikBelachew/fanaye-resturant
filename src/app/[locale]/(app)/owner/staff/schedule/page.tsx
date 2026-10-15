"use client";

import StaffScheduleMatrix from "@/domains/identity/ui/StaffScheduleMatrix";

export default function OwnerStaffSchedulePage() {
    return (
        <StaffScheduleMatrix
            basePath="/owner/staff"
            multiBranch={true}
            eyebrow="Business"
        />
    );
}
