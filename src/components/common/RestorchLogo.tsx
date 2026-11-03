"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface RestorchLogoProps {
    variant?: "full" | "mark";
    mode?: "auto" | "light" | "dark";
    height?: number;
    width?: number;
    className?: string;
    priority?: boolean;
    alt?: string;
}

/**
 * Restorch Official Brand Logo Component.
 * Supports:
 * - variant: "full" (mark + "Restorch" typography, 3156x690 ~4.57:1) or "mark" (torch swirl mark alone, 844x844 1:1)
 * - mode: "auto" (CSS dark/light adaptation, zero flash), "light", or "dark"
 */
export function RestorchLogo({
    variant = "full",
    mode = "auto",
    height = 32,
    width,
    className,
    priority = false,
    alt = "Restorch",
}: RestorchLogoProps) {
    if (variant === "mark") {
        const markSize = width ?? height;
        return (
            <div
                className={cn(
                    "relative inline-flex items-center justify-center shrink-0 select-none",
                    className,
                )}
                style={{ width: markSize, height: markSize }}
            >
                <Image
                    src="/images/branding/restorch-mark-square.png"
                    alt={alt}
                    width={markSize}
                    height={markSize}
                    priority={priority}
                    className="size-full object-contain drop-shadow-sm"
                />
            </div>
        );
    }

    // Full Lockup: Aspect ratio is ~4.57 (3156 / 690)
    const lockupHeight = height;
    const lockupWidth = width ?? Math.round(lockupHeight * 4.57);

    if (mode === "light") {
        return (
            <div
                className={cn(
                    "relative inline-flex items-center shrink-0 select-none",
                    className,
                )}
                style={{ width: lockupWidth, height: lockupHeight }}
            >
                <Image
                    src="/images/branding/restorch-lockup-light.png"
                    alt={alt}
                    width={lockupWidth}
                    height={lockupHeight}
                    priority={priority}
                    className="size-full object-contain"
                />
            </div>
        );
    }

    if (mode === "dark") {
        return (
            <div
                className={cn(
                    "relative inline-flex items-center shrink-0 select-none",
                    className,
                )}
                style={{ width: lockupWidth, height: lockupHeight }}
            >
                <Image
                    src="/images/branding/restorch-lockup-dark.png"
                    alt={alt}
                    width={lockupWidth}
                    height={lockupHeight}
                    priority={priority}
                    className="size-full object-contain"
                />
            </div>
        );
    }

    // Auto mode: Renders both light & dark versions, toggled via Tailwind's dark class
    // This is 100% SSR-safe and never causes hydration mismatch or flash
    return (
        <div
            className={cn(
                "relative inline-flex items-center shrink-0 select-none",
                className,
            )}
            style={{ width: lockupWidth, height: lockupHeight }}
        >
            {/* Light Mode Lockup (Navy text + Radiant Orange Mark) */}
            <Image
                src="/images/branding/restorch-lockup-light.png"
                alt={alt}
                width={lockupWidth}
                height={lockupHeight}
                priority={priority}
                className="size-full object-contain dark:hidden"
            />
            {/* Dark Mode Lockup (Crisp White text + Radiant Orange Mark) */}
            <Image
                src="/images/branding/restorch-lockup-dark.png"
                alt={alt}
                width={lockupWidth}
                height={lockupHeight}
                priority={priority}
                className="hidden size-full object-contain dark:block"
            />
        </div>
    );
}

export default RestorchLogo;
