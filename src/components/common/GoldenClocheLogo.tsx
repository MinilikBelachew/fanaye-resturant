import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GoldenClocheLogoProps {
    className?: string;
    size?: number;
}

/**
 * Legacy compatibility wrapper: Now renders the official Restorch Swirl Torch mark.
 */
export function GoldenClocheLogo({
    className = "size-11",
    size = 44,
}: GoldenClocheLogoProps) {
    return (
        <div
            className={cn(
                "relative inline-flex items-center justify-center shrink-0",
                className,
            )}
            style={{ width: size, height: size }}
        >
            <Image
                src="/images/branding/restorch-mark-square.png"
                alt="Restorch Logo"
                width={size}
                height={size}
                className="size-full object-contain drop-shadow-sm"
            />
        </div>
    );
}

export default GoldenClocheLogo;
