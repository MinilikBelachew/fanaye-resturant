"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<
    string,
    {
        label?: React.ReactNode;
        icon?: React.ComponentType;
        color?: string;
        theme?: Record<keyof typeof THEMES, string>;
    }
>;

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }
    return context;
}

function ChartContainer({
    id,
    className,
    children,
    config,
    ...props
}: React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
        typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
}) {
    const uniqueId = React.useId();
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-slot="chart"
                data-chart={chartId}
                className={cn(
                    "flex aspect-video w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-layer]:outline-hidden",
                    className,
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

const ChartStyle = ({
    id,
    config,
}: {
    id: string;
    config: ChartConfig;
}) => {
    const colorConfig = Object.entries(config).filter(
        ([, item]) => item.theme ?? item.color,
    );
    if (!colorConfig.length) return null;

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
    .map(([key, itemConfig]) => {
        const color =
            itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
            itemConfig.color;
        return color ? `  --color-${key}: ${color};` : null;
    })
    .join("\n")}
}
`,
                    )
                    .join("\n"),
            }}
        />
    );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
    active,
    payload,
    className,
    indicator = "dot",
    hideLabel = false,
    label,
    nameKey,
}: {
    active?: boolean;
    payload?: Array<{
        name?: string;
        dataKey?: string;
        value?: number | string;
        color?: string;
        payload?: Record<string, unknown>;
    }>;
    className?: string;
    indicator?: "line" | "dot" | "dashed";
    hideLabel?: boolean;
    label?: string;
    nameKey?: string;
}) {
    const { config } = useChart();
    if (!active || !payload?.length) return null;

    return (
        <div
            className={cn(
                "grid min-w-[8rem] gap-1.5 rounded-[12px] border border-hairline bg-popover px-2.5 py-1.5 text-xs shadow-subtle",
                className,
            )}
        >
            {!hideLabel && label ? (
                <div className="font-medium text-ink-charcoal">{label}</div>
            ) : null}
            {payload.map(item => {
                const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
                const itemConfig = config[key];
                return (
                    <div
                        key={key}
                        className="flex items-center justify-between gap-4"
                    >
                        <span className="flex items-center gap-1.5 text-slate-gray">
                            <span
                                className={cn(
                                    "size-2 rounded-full",
                                    indicator === "dashed" && "rounded-none",
                                )}
                                style={{
                                    backgroundColor:
                                        item.color ??
                                        itemConfig?.color ??
                                        "var(--color-brand)",
                                }}
                            />
                            {itemConfig?.label ?? item.name}
                        </span>
                        <span className="font-medium tabular-nums">
                            {typeof item.value === "number"
                                ? item.value.toLocaleString()
                                : String(item.value ?? "")}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
    className,
    payload,
    nameKey,
}: {
    className?: string;
    payload?: Array<{ value?: string; dataKey?: string; color?: string }>;
    nameKey?: string;
}) {
    const { config } = useChart();
    if (!payload?.length) return null;

    return (
        <div
            className={cn(
                "flex flex-wrap items-center justify-center gap-4 pt-3",
                className,
            )}
        >
            {payload.map(item => {
                const key = `${nameKey ?? item.dataKey ?? item.value}`;
                const itemConfig = config[key];
                return (
                    <div
                        key={key}
                        className="flex items-center gap-1.5 text-[12px] text-slate-gray"
                    >
                        <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        {itemConfig?.label ?? item.value}
                    </div>
                );
            })}
        </div>
    );
}

export {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    ChartStyle,
};
