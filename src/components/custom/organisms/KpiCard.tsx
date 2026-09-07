import { type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
    label: string;
    value: string;
    hint?: string;
    trend?: {
        value: string;
        direction?: "up" | "down" | "neutral";
        label?: string;
    };
    sparkline?: {
        color?: string;
        badge?: string;
        variant?: "wave1" | "wave2" | "wave3" | "wave4";
    } | null;
    icon?: ReactNode;
    tone?: "default" | "brand" | "emerald" | "amber" | "violet";
    className?: string;
}

const SPARKLINE_PATHS = {
    wave1: {
        area: "M0,35 C15,30 25,18 40,24 C55,30 65,8 80,14 C90,18 95,10 100,12 L100,40 L0,40 Z",
        line: "M0,35 C15,30 25,18 40,24 C55,30 65,8 80,14 C90,18 95,10 100,12",
        dotX: 80,
        dotY: 14,
    },
    wave2: {
        area: "M0,32 C20,34 30,12 50,18 C70,24 80,6 100,10 L100,40 L0,40 Z",
        line: "M0,32 C20,34 30,12 50,18 C70,24 80,6 100,10",
        dotX: 80,
        dotY: 6,
    },
    wave3: {
        area: "M0,36 C18,36 32,22 48,22 C64,22 76,10 100,16 L100,40 L0,40 Z",
        line: "M0,36 C18,36 32,22 48,22 C64,22 76,10 100,16",
        dotX: 76,
        dotY: 10,
    },
    wave4: {
        area: "M0,30 C15,22 35,32 55,16 C75,8 88,20 100,8 L100,40 L0,40 Z",
        line: "M0,30 C15,22 35,32 55,16 C75,8 88,20 100,8",
        dotX: 75,
        dotY: 8,
    },
};

export default function KpiCard({
    label,
    value,
    hint,
    trend,
    sparkline = { color: "#e85d04", variant: "wave1" },
    icon,
    tone = "default",
    className,
}: KpiCardProps) {
    const isUp =
        trend?.direction === "up" ||
        (trend?.direction !== "down" && !trend?.value.startsWith("-"));
    const isDown =
        trend?.direction === "down" || Boolean(trend?.value.startsWith("-"));

    const strokeColor =
        tone === "brand" || tone === "default"
            ? "#e85d04"
            : tone === "emerald"
              ? "#046645"
              : tone === "amber"
                ? "#d97706"
                : tone === "violet"
                  ? "#6736eb"
                  : sparkline?.color || "#e85d04";

    const waveVariant = sparkline?.variant || "wave1";
    const pathConfig = SPARKLINE_PATHS[waveVariant] || SPARKLINE_PATHS.wave1;
    const gradId = `sparkGrad-${label.replace(/[^a-zA-Z0-9]/g, "")}-${waveVariant}`;

    return (
        <div
            className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-[12px] border border-hairline bg-card px-3.5 py-3",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium tracking-wide text-slate-gray">
                    {label}
                </p>
                {icon ? (
                    <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-slate-gray">
                        {icon}
                    </div>
                ) : null}
            </div>

            <div className="mt-1.5 flex items-end justify-between gap-2">
                <div className="min-w-0">
                    <p
                        className={cn(
                            "truncate text-[18px] font-semibold leading-none tracking-tight",
                            tone === "brand" ? "text-brand" : "text-foreground",
                        )}
                    >
                        {value}
                    </p>
                    {trend ? (
                        <div className="mt-1.5 flex items-center gap-1">
                            <span
                                className={cn(
                                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-medium",
                                    isDown
                                        ? "bg-rose-50 text-rose-600"
                                        : "bg-emerald-50 text-emerald-700",
                                )}
                            >
                                {isDown ? (
                                    <ArrowDownRight className="size-2.5" />
                                ) : (
                                    <ArrowUpRight className="size-2.5" />
                                )}
                                {trend.value}
                            </span>
                            {trend.label ? (
                                <span className="text-[10px] text-slate-gray">
                                    {trend.label}
                                </span>
                            ) : null}
                        </div>
                    ) : hint ? (
                        <p className="mt-1 truncate text-[10px] text-slate-gray">
                            {hint}
                        </p>
                    ) : null}
                </div>

                {sparkline ? (
                    <div className="relative shrink-0">
                        <svg
                            className="h-7 w-[4.5rem] overflow-visible"
                            viewBox="0 0 100 40"
                            fill="none"
                        >
                            <defs>
                                <linearGradient
                                    id={gradId}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={strokeColor}
                                        stopOpacity="0.22"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={strokeColor}
                                        stopOpacity="0.0"
                                    />
                                </linearGradient>
                            </defs>
                            <path
                                d={pathConfig.area}
                                fill={`url(#${gradId})`}
                            />
                            <path
                                d={pathConfig.line}
                                stroke={strokeColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle
                                cx={pathConfig.dotX}
                                cy={pathConfig.dotY}
                                r="2.25"
                                fill={strokeColor}
                                stroke="#ffffff"
                                strokeWidth="1.25"
                            />
                        </svg>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
