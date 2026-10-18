"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Daily close moved under Finance → Closes. */
export default function ManagerDailyCloseRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/manager/finance/closes");
    }, [router]);
    return null;
}
