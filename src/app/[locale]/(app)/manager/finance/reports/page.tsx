"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function ManagerFinanceReportsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/manager/reports");
    }, [router]);
    return null;
}
