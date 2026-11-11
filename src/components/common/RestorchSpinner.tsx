"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface RestorchSpinnerProps {
    className?: string;
    size?: number;
    pulseOnly?: boolean;
}

/**
 * Ultra-fast, lightweight inline brand spinner replacing generic Loader2.
 * Uses the official Restorch Intro video animation (transparent alpha WebM + MP4),
 * adapting seamlessly across light and dark mode with zero layout shift.
 */
export function RestorchSpinner({
    className = "size-4",
    size,
    pulseOnly = false,
}: RestorchSpinnerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoFailed, setVideoFailed] = useState(false);

    useEffect(() => {
        if (!videoRef.current || videoFailed) return;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay may be restricted in some low-power modes
                setVideoFailed(true);
            });
        }
    }, [videoFailed]);

    const style = size ? { width: size, height: size } : undefined;

    return (
        <span
            role="status"
            aria-label="Loading"
            style={style}
            className={cn(
                "relative inline-flex shrink-0 items-center justify-center select-none pointer-events-none overflow-hidden",
                className,
            )}
        >
            {!videoFailed ? (
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setVideoFailed(true)}
                    className="size-full object-contain pointer-events-none drop-shadow-xs"
                >
                    <source
                        src="/images/branding/Restorch_Pictogram_Intro_4K_Alpha.webm"
                        type="video/webm"
                    />
                    <source
                        src="/images/branding/Restorch_Pictogram_Intro_4K.mp4"
                        type="video/mp4"
                    />
                </video>
            ) : (
                <>
                    {/* Light Mode Fallback */}
                    <img
                        src="/images/branding/restorch-mark.png"
                        alt=""
                        className={cn(
                            "size-full object-contain drop-shadow-xs dark:hidden",
                            pulseOnly ? "animate-pulse" : "animate-spin",
                        )}
                        crossOrigin="anonymous"
                    />
                    {/* Dark Mode Fallback */}
                    <img
                        src="/images/branding/restorch-mark-square.png"
                        alt=""
                        className={cn(
                            "size-full object-contain drop-shadow-xs hidden dark:block",
                            pulseOnly ? "animate-pulse" : "animate-spin",
                        )}
                        crossOrigin="anonymous"
                    />
                </>
            )}
        </span>
    );
}

export default RestorchSpinner;
