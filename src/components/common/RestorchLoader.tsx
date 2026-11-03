"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

export interface RestorchLoaderProps {
    size?: LoaderSize;
    variant?: "auto" | "loop" | "reveal" | "mark" | "video";
    fullscreen?: boolean;
    label?: string;
    subLabel?: string;
    className?: string;
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
}: RestorchLoaderProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoFailed, setVideoFailed] = useState(false);

    const pixelSize =
        typeof size === "number"
            ? size
            : (SIZE_MAP[size] ?? (fullscreen ? 96 : 48));

    const isReveal = variant === "reveal";
    // For tiny sizes (< 32px), the video overhead is unnecessary; use mark variant
    const useVideo =
        (variant === "video" ||
            variant === "loop" ||
            variant === "reveal" ||
            (variant === "auto" && pixelSize >= 32)) &&
        !videoFailed;

    useEffect(() => {
        if (!useVideo || !videoRef.current) return;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay may be restricted or paused by power saver
                setVideoFailed(true);
            });
        }
    }, [useVideo]);

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
                {useVideo ? (
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
                                <source
                                    src="/images/branding/Restorch_Reveal_8s_4K_Alpha.webm"
                                    type="video/webm"
                                />
                                <source
                                    src="/images/branding/Restorch_Reveal_8s_4K.mp4"
                                    type="video/mp4"
                                />
                            </>
                        ) : (
                            <>
                                {/* Short 2.5s Alpha channel WebM for seamless transparent looping */}
                                <source
                                    src="/images/branding/Restorch_Pictogram_Loop_1080_Alpha.webm"
                                    type="video/webm"
                                />
                                {/* Short 2.5s High-compatibility MP4 fallback */}
                                <source
                                    src="/images/branding/Restorch_Pictogram_Loop_1080.mp4"
                                    type="video/mp4"
                                />
                            </>
                        )}
                        {/* Nested fallback for older clients */}
                        <Image
                            src="/images/branding/restorch-mark-square.png"
                            alt="Loading..."
                            width={pixelSize}
                            height={pixelSize}
                            className="size-full object-contain animate-pulse"
                            priority
                        />
                    </video>
                ) : (
                    <div
                        className="relative flex items-center justify-center animate-pulse"
                        style={{ width: pixelSize, height: pixelSize }}
                    >
                        <Image
                            src="/images/branding/restorch-mark-square.png"
                            alt="Loading..."
                            width={pixelSize}
                            height={pixelSize}
                            className="size-full object-contain drop-shadow-sm"
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
            <div
                role="status"
                aria-live="polite"
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-300"
            >
                <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-border/40 bg-card/50 shadow-2xl backdrop-blur-2xl max-w-sm mx-4 text-center">
                    {content}
                </div>
            </div>
        );
    }

    return content;
}

export default RestorchLoader;
