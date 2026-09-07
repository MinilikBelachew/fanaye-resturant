"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/context/hooks";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { useRouter } from "@/i18n/navigation";

export default function HomePage() {
    const staff = useAppSelector(selectCurrentStaff);
    const hydrated = useAppSelector(state => state.identity.hydrated);
    const router = useRouter();

    useEffect(() => {
        if (!hydrated) return;
        if (!staff) {
            router.replace("/sign-in");
            return;
        }
        router.replace(homePathForRole(staff.role));
    }, [hydrated, staff, router]);

    return (
        <div className="flex h-svh items-center justify-center text-slate-gray">
            Opening Fanaye…
        </div>
    );
}
