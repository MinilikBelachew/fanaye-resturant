"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RestorchSpinnerProps {
    className?: string;
    size?: number;
    pulseOnly?: boolean;
}

/**
 * High-performance, lightweight inline brand spinner for buttons, badges, and small controls.
 * Uses the official Restorch Swirl Torch mark.
 */
export function RestorchSpinner({
    className = "size-4",
    size,
    pulseOnly = false,
}: RestorchSpinnerProps) {
    const style = size ? { width: size, height: size } : undefined;

    return (
        <span
            role="status"
            aria-label="Loading"
            style={style}
            className={cn(
                "inline-flex shrink-0 items-center justify-center select-none pointer-events-none",
                pulseOnly ? "animate-pulse" : "animate-spin",
                className,
            )}
        >
            <img
                src="/images/branding/restorch-mark-square.png"
                alt=""
                className="size-full object-contain drop-shadow-xs"
                crossOrigin="anonymous"
            />
        </span>
    );
}

export default RestorchSpinner;
