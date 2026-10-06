"use client";

import StaffDirectory from "@/domains/identity/ui/StaffDirectory";

export default function OwnerStaffPage() {
    return (
        <StaffDirectory
            basePath="/owner/staff"
            multiBranch={true}
            eyebrow="Business"
        />
    );
}
