"use client";

import StaffDetailBoard from "@/domains/identity/ui/StaffDetailBoard";

export default function ManagerStaffDetailPage({
    params,
}: {
    params: Promise<{ membershipId: string }>;
}) {
    return <StaffDetailBoard params={params} basePath="/manager/staff" />;
}
