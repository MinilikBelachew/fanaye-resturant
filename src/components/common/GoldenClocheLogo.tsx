import React from "react";

interface GoldenClocheLogoProps {
    className?: string;
    size?: number;
}

export function GoldenClocheLogo({
    className = "size-11",
    size = 44,
}: GoldenClocheLogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 120 120"
            fill="none"
            width={size}
            height={size}
            className={className}
        >
            <defs>
                <linearGradient
                    id="clocheGrad"
                    x1="24"
                    y1="36"
                    x2="96"
                    y2="88"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
            </defs>
            <rect width="120" height="120" rx="32" fill="#18181B" />
            <rect
                x="1"
                y="1"
                width="118"
                height="118"
                rx="31"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
            />
            {/* Cloche Handle Spark */}
            <path
                d="M60 22L63 30L71 33L63 36L60 44L57 36L49 33L57 30L60 22Z"
                fill="#FDE047"
            />
            {/* Cloche Dome */}
            <path
                d="M26 76C26 52 41 42 60 42C79 42 94 52 94 76H26Z"
                fill="url(#clocheGrad)"
            />
            {/* Serving Platter Line */}
            <rect x="22" y="80" width="76" height="6" rx="3" fill="#E85D04" />
            <circle cx="60" cy="62" r="3" fill="#18181B" />
        </svg>
    );
}
