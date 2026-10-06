"use client";

import StaffDetailBoard from "@/domains/identity/ui/StaffDetailBoard";

export default function OwnerStaffDetailPage({
    params,
}: {
    params: Promise<{ membershipId: string }>;
}) {
    return <StaffDetailBoard params={params} basePath="/owner/staff" />;
}
