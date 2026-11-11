"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

export interface RestorchLoaderProps {
    size?: LoaderSize;
    variant?: "auto" | "intro" | "loop" | "reveal" | "mark" | "video";
    fullscreen?: boolean;
    label?: string;
    subLabel?: string;
    className?: string;
    mode?: "auto" | "light" | "dark";
}

const SIZE_MAP: Record<string, number> = {
    xs: 20,
    sm: 28,
    md: 48,
    lg: 76,
    xl: 112,
};

export function RestorchLoader({
    size = "md",
    variant = "auto",
    fullscreen = false,
    label,
    subLabel,
    className,
    mode = "auto",
}: RestorchLoaderProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoFailed, setVideoFailed] = useState(false);

    const pixelSize =
        typeof size === "number"
            ? size
            : (SIZE_MAP[size] ?? (fullscreen ? 112 : 48));

    // Resolve active animation variant
    const activeVariant =
        variant !== "auto"
            ? variant
            : fullscreen || size === "xl"
              ? "reveal"
              : pixelSize < 32 || size === "xs" || size === "sm"
                ? "intro"
                : "loop";

    const isReveal = activeVariant === "reveal";
    const isIntro = activeVariant === "intro";

    useEffect(() => {
        if (!videoRef.current || videoFailed) return;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay may be restricted in power-save mode
                setVideoFailed(true);
            });
        }
    }, [activeVariant, videoFailed]);

    const content = (
        <div
            className={cn(
                "inline-flex flex-col items-center justify-center select-none",
                className,
            )}
        >
            <div
                className="relative inline-flex items-center justify-center shrink-0"
                style={{ width: pixelSize, height: pixelSize }}
            >
                {!videoFailed ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={() => setVideoFailed(true)}
                        className="size-full object-contain pointer-events-none drop-shadow-md"
                        style={{ width: pixelSize, height: pixelSize }}
                    >
                        {isReveal ? (
                            <>
                                {/* 8s High-End Reveal with Alpha Transparency */}
                                <source
                                    src="/images/branding/Restorch_Reveal_8s_4K_Alpha.webm"
                                    type="video/webm"
                                />
                                {mode === "light" && (
                                    <source
                                        src="/images/branding/restorch-logo-light (2).mp4"
                                        type="video/mp4"
                                    />
                                )}
                                {mode === "dark" && (
                                    <source
                                        src="/images/branding/restorch-logo-navy (2).mp4"
                                        type="video/mp4"
                                    />
                                )}
                                <source
                                    src="/images/branding/Restorch_Reveal_8s_4K.mp4"
                                    type="video/mp4"
                                />
                            </>
                        ) : isIntro ? (
                            <>
                                {/* 4K Intro Animation with Alpha Transparency for small / compact spaces */}
                                <source
                                    src="/images/branding/Restorch_Pictogram_Intro_4K_Alpha.webm"
                                    type="video/webm"
                                />
                                <source
                                    src="/images/branding/Restorch_Pictogram_Intro_4K.mp4"
                                    type="video/mp4"
                                />
                            </>
                        ) : (
                            <>
                                {/* 1080p Continuous Looping Animation for Cards & Tables */}
                                <source
                                    src="/images/branding/Restorch_Pictogram_Loop_1080_Alpha.webm"
                                    type="video/webm"
                                />
                                <source
                                    src="/images/branding/Restorch_Pictogram_Loop_1080.mp4"
                                    type="video/mp4"
                                />
                            </>
                        )}
                        {/* Nested fallback image for older browsers */}
                        <Image
                            src="/images/branding/restorch-mark.png"
                            alt="Loading..."
                            width={pixelSize}
                            height={pixelSize}
                            className="size-full object-contain animate-pulse dark:hidden"
                            priority
                        />
                        <Image
                            src="/images/branding/restorch-mark-square.png"
                            alt="Loading..."
                            width={pixelSize}
                            height={pixelSize}
                            className="size-full object-contain animate-pulse hidden dark:block"
                            priority
                        />
                    </video>
                ) : (
                    <div
                        className="relative flex items-center justify-center animate-pulse"
                        style={{ width: pixelSize, height: pixelSize }}
                    >
                        {/* Light Mode Fallback Image */}
                        <Image
                            src="/images/branding/restorch-mark.png"
                            alt="Loading..."
                            width={pixelSize}
                            height={pixelSize}
                            className="size-full object-contain drop-shadow-sm dark:hidden"
                            priority
                        />
                        {/* Dark Mode Fallback Image */}
                        <Image
                            src="/images/branding/restorch-mark-square.png"
                            alt="Loading..."
                            width={pixelSize}
                            height={pixelSize}
                            className="size-full object-contain drop-shadow-sm hidden dark:block"
                            priority
                        />
                    </div>
                )}
            </div>

            {label && (
                <p
                    className={cn(
                        "mt-3 font-medium tracking-tight text-foreground/90 animate-pulse text-center",
                        pixelSize <= 32 ? "text-xs" : "text-sm",
                    )}
                >
                    {label}
                </p>
            )}

            {subLabel && (
                <p className="mt-0.5 text-xs text-muted-foreground text-center">
                    {subLabel}
                </p>
            )}
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
                {content}
            </div>
        );
    }

    return content;
}

export default RestorchLoader;
