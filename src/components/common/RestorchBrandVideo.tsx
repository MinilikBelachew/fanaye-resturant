"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface RestorchBrandVideoProps {
    mode?: "auto" | "light" | "navy";
    className?: string;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    rounded?: string;
    showBadge?: boolean;
    badgeText?: string;
}

/**
 * High-definition (1080p 16:9, 6.0s) official Restorch brand animation video.
 * In "auto" mode, switches between:
 * - restorch-logo-light (2).mp4 on light backgrounds
 * - restorch-logo-navy (2).mp4 on dark backgrounds
 */
export function RestorchBrandVideo({
    mode = "auto",
    className,
    autoPlay = true,
    loop = true,
    muted = true,
    controls = false,
    rounded = "rounded-3xl",
    showBadge = true,
    badgeText = "Live Operations OS",
}: RestorchBrandVideoProps) {
    const lightVideoRef = useRef<HTMLVideoElement>(null);
    const navyVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!autoPlay) return;
        lightVideoRef.current?.play().catch(() => {});
        navyVideoRef.current?.play().catch(() => {});
    }, [autoPlay]);

    if (mode === "light") {
        return (
            <div
                className={cn(
                    "relative overflow-hidden border border-black/10 bg-white shadow-xl",
                    rounded,
                    className,
                )}
            >
                <video
                    ref={lightVideoRef}
                    autoPlay={autoPlay}
                    loop={loop}
                    muted={muted}
                    playsInline
                    controls={controls}
                    className="size-full object-cover"
                >
                    <source
                        src="/images/branding/restorch-logo-light (2).mp4"
                        type="video/mp4"
                    />
                </video>
                {showBadge && (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-md">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{badgeText}</span>
                    </div>
                )}
            </div>
        );
    }

    if (mode === "navy") {
        return (
            <div
                className={cn(
                    "relative overflow-hidden border border-white/10 bg-[#051225] shadow-2xl",
                    rounded,
                    className,
                )}
            >
                <video
                    ref={navyVideoRef}
                    autoPlay={autoPlay}
                    loop={loop}
                    muted={muted}
                    playsInline
                    controls={controls}
                    className="size-full object-cover"
                >
                    <source
                        src="/images/branding/restorch-logo-navy (2).mp4"
                        type="video/mp4"
                    />
                </video>
                {showBadge && (
                    <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#051225]/85 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                        <span className="size-2 rounded-full bg-orange-400 animate-pulse" />
                        <span>{badgeText}</span>
                    </div>
                )}
            </div>
        );
    }

    // Auto mode: Renders light video in light mode, navy video in dark mode
    return (
        <div
            className={cn(
                "relative overflow-hidden border border-hairline shadow-2xl transition-all",
                rounded,
                className,
            )}
        >
            {/* Light Mode Video */}
            <div className="size-full dark:hidden">
                <video
                    ref={lightVideoRef}
                    autoPlay={autoPlay}
                    loop={loop}
                    muted={muted}
                    playsInline
                    controls={controls}
                    className="size-full object-cover"
                >
                    <source
                        src="/images/branding/restorch-logo-light (2).mp4"
                        type="video/mp4"
                    />
                </video>
            </div>

            {/* Dark Mode Video */}
            <div className="hidden size-full dark:block bg-[#051225]">
                <video
                    ref={navyVideoRef}
                    autoPlay={autoPlay}
                    loop={loop}
                    muted={muted}
                    playsInline
                    controls={controls}
                    className="size-full object-cover"
                >
                    <source
                        src="/images/branding/restorch-logo-navy (2).mp4"
                        type="video/mp4"
                    />
                </video>
            </div>

            {showBadge && (
                <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full border border-hairline bg-background/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md">
                    <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
                    <span>{badgeText}</span>
                </div>
            )}
        </div>
    );
}

export default RestorchBrandVideo;
