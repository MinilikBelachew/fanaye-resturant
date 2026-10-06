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
    /** Enterprise-style filled primary card (first KPI). */
    accent?: boolean;
    /** Tighter padding and smaller value text for dense dashboards. */
    compact?: boolean;
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
    accent = false,
    compact = false,
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

    if (accent) {
        return (
            <div
                className={cn(
                    "relative overflow-hidden rounded-xl border border-primary bg-primary text-primary-foreground",
                    compact ? "p-3" : "rounded-2xl p-5",
                    className,
                )}
            >
                <div className="flex items-start justify-between gap-2">
                    <p
                        className={cn(
                            "font-medium text-primary-foreground/75",
                            compact ? "text-[11px]" : "text-[12px]",
                        )}
                    >
                        {label}
                    </p>
                    {icon ? (
                        <span
                            className={cn(
                                "flex items-center justify-center rounded-full bg-primary-foreground/15",
                                compact ? "size-6" : "size-8",
                            )}
                        >
                            {icon}
                        </span>
                    ) : null}
                </div>
                <p
                    className={cn(
                        "leading-none font-semibold tracking-tight tabular-nums",
                        compact ? "mt-2 text-[20px]" : "mt-4 text-[28px]",
                    )}
                >
                    {value}
                </p>
                <div
                    className={cn(
                        "flex flex-wrap items-center gap-2",
                        compact ? "mt-1.5" : "mt-3",
                    )}
                >
                    {hint ? (
                        <p
                            className={cn(
                                "text-primary-foreground/70",
                                compact ? "text-[10px]" : "text-[12px]",
                            )}
                        >
                            {hint}
                        </p>
                    ) : null}
                    {trend ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                            {isDown ? (
                                <ArrowDownRight className="size-3" />
                            ) : (
                                <ArrowUpRight className="size-3" />
                            )}
                            {trend.value}
                            {trend.label ? ` ${trend.label}` : ""}
                        </span>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative flex flex-col justify-between overflow-hidden border border-border bg-background",
                compact
                    ? "rounded-[12px] px-2.5 py-2"
                    : "rounded-2xl px-4 py-4 sm:p-5",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p
                    className={cn(
                        "font-medium text-muted-foreground",
                        compact ? "text-[10px]" : "text-[12px]",
                    )}
                >
                    {label}
                </p>
                {icon ? (
                    <div
                        className={cn(
                            "flex items-center justify-center rounded-full bg-primary/10 text-primary",
                            compact ? "size-6" : "size-8",
                        )}
                    >
                        {icon}
                    </div>
                ) : null}
            </div>

            <div
                className={cn(
                    "flex items-end justify-between gap-1.5",
                    compact ? "mt-1.5" : "mt-4",
                )}
            >
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            "truncate font-semibold leading-none tracking-tight tabular-nums",
                            compact
                                ? "text-[14px] sm:text-[15px]"
                                : "text-[28px]",
                            tone === "brand" ? "text-brand" : "text-foreground",
                        )}
                        title={value}
                    >
                        {value}
                    </p>
                    <div
                        className={cn(
                            "flex flex-wrap items-center gap-2",
                            compact ? "mt-1" : "mt-3",
                        )}
                    >
                        {hint ? (
                            <p
                                className={cn(
                                    "truncate text-muted-foreground",
                                    compact ? "text-[10px]" : "text-[12px]",
                                )}
                            >
                                {hint}
                            </p>
                        ) : null}
                        {trend ? (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                    isDown
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-primary/10 text-primary",
                                )}
                            >
                                {isDown ? (
                                    <ArrowDownRight className="size-3" />
                                ) : (
                                    <ArrowUpRight className="size-3" />
                                )}
                                {trend.value}
                                {trend.label ? ` ${trend.label}` : ""}
                            </span>
                        ) : null}
                    </div>
                </div>

                {sparkline && !icon ? (
                    <div className="relative shrink-0">
                        <svg
                            className={cn(
                                "overflow-visible",
                                compact ? "h-5 w-[3.25rem]" : "h-7 w-[4.5rem]",
                            )}
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
