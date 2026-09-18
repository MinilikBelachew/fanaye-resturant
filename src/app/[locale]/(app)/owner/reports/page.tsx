"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Reports moved into Branches with period filters. */
export default function OwnerReportsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/owner/branches");
    }, [router]);
    return null;
}
