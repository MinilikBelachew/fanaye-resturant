import type { ReactNode } from "react";

export default function DashboardFrame({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-6xl min-w-0 space-y-4 sm:space-y-6">
            {children}
        </div>
    );
}
