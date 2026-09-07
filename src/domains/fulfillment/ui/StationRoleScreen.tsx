"use client";

import StationQueueBoard from "@/domains/fulfillment/ui/StationQueueBoard";
import type { StationRole } from "@/domains/identity/domain/role";

export default function StationRoleScreen({
    role,
}: {
    role: StationRole;
}) {
    return <StationQueueBoard role={role} />;
}
