"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Daily close moved under Finance → Closes. */
export default function OwnerDailyCloseRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/owner/finance/closes");
    }, [router]);
    return null;
}
