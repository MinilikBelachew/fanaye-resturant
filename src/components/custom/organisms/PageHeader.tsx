import type { ReactNode } from "react";

export default function PageHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                {eyebrow ? (
                    <p className="mb-1 text-[12px] font-medium tracking-[0.08em] text-steel-gray uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="text-[32px] leading-[1.2] font-semibold tracking-tight">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-1 max-w-2xl text-[15px] text-slate-gray">
                        {description}
                    </p>
                ) : null}
            </div>
            {action}
        </div>
    );
}
