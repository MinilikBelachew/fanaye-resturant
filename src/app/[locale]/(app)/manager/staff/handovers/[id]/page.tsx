"use client";

import { use } from "react";
import ShiftHandoverDetailBoard from "@/domains/identity/ui/ShiftHandoverDetailBoard";

export default function ManagerHandoverDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    return (
        <ShiftHandoverDetailBoard handoverId={id} basePath="/manager/staff" />
    );
}
