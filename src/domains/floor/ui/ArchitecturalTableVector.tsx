"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ArchitecturalTableVectorProps {
    tableNumber: string;
    shape?: "round" | "rectangle";
    capacity?: number;
    status: "assigned" | "open";
    isVip?: boolean;
    className?: string;
}

export function ArchitecturalTableVector({
    tableNumber,
    shape: _shape = "round",
    capacity = 4,
    isVip = false,
    className,
}: ArchitecturalTableVectorProps) {
    const [imgError, setImgError] = useState(false);

    return (
        <div
            className={cn(
                "relative flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-hairline/80 select-none",
                "bg-[#131417] shadow-inner group-hover:border-primary/40 transition-colors",
                className,
            )}
        >
            {!imgError ? (
                /* ================= 3D PERSPECTIVE DINING TABLE (WITH VISIBLE LEGS) ================= */
                <div className="relative h-full w-full">
                    <Image
                        src="/images/dining_table_round.jpg"
                        alt={`Table ${tableNumber}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        onError={() => setImgError(true)}
                        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Natural dark vignette to blend with card */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

                    {/* Floating Center Table Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                        <Utensils className="size-3 text-amber-400" />
                        <span className="text-[12px] font-bold tracking-wide text-white">
                            #{tableNumber}
                        </span>
                        {isVip ? (
                            <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider ml-0.5">
                                VIP
                            </span>
                        ) : null}
                    </div>

                    {/* Capacity badge */}
                    <div className="absolute bottom-2 right-2.5 z-10 rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
                        {capacity} Seats
                    </div>
                </div>
            ) : (
                /* ================= 3D ISOMETRIC VECTOR TABLE WITH VISIBLE LEGS (FALLBACK) ================= */
                <div className="relative h-full w-full flex items-center justify-center">
                    <svg
                        viewBox="0 0 320 160"
                        className="h-full w-full"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <defs>
                            <linearGradient
                                id="isoTableTopGrad"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#4a3322" />
                                <stop offset="100%" stopColor="#2c1d13" />
                            </linearGradient>
                            <linearGradient
                                id="isoTableEdgeGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#2c1d13" />
                                <stop offset="100%" stopColor="#19100a" />
                            </linearGradient>
                            <linearGradient
                                id="isoTableLegGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#3d2719" />
                                <stop offset="100%" stopColor="#1e120a" />
                            </linearGradient>
                            <linearGradient
                                id="isoChairGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#30343d" />
                                <stop offset="100%" stopColor="#1d1e22" />
                            </linearGradient>
                        </defs>

                        {/* Floor shadow under legs */}
                        <ellipse
                            cx="160"
                            cy="135"
                            rx="85"
                            ry="16"
                            fill="#000000"
                            opacity="0.4"
                        />

                        {/* Back Chairs (2 chairs) */}
                        <g transform="translate(120, 48)">
                            {/* Chair backrest */}
                            <path
                                d="M -12 -28 C -12 -38 12 -38 12 -28 L 12 0 L -12 0 Z"
                                fill="url(#isoChairGrad)"
                                stroke="#3d424e"
                                strokeWidth="0.8"
                            />
                        </g>
                        <g transform="translate(200, 48)">
                            <path
                                d="M -12 -28 C -12 -38 12 -38 12 -28 L 12 0 L -12 0 Z"
                                fill="url(#isoChairGrad)"
                                stroke="#3d424e"
                                strokeWidth="0.8"
                            />
                        </g>

                        {/* 4 SOLID WOODEN TABLE LEGS */}
                        {/* Back Left Leg */}
                        <polygon
                            points="95,78 101,78 98,122 93,122"
                            fill="url(#isoTableLegGrad)"
                            opacity="0.9"
                        />
                        {/* Back Right Leg */}
                        <polygon
                            points="219,78 225,78 227,122 222,122"
                            fill="url(#isoTableLegGrad)"
                            opacity="0.9"
                        />
                        {/* Front Left Leg */}
                        <polygon
                            points="84,88 91,88 88,135 82,135"
                            fill="url(#isoTableLegGrad)"
                            stroke="#1a0f07"
                            strokeWidth="0.5"
                        />
                        {/* Front Right Leg */}
                        <polygon
                            points="229,88 236,88 238,135 231,135"
                            fill="url(#isoTableLegGrad)"
                            stroke="#1a0f07"
                            strokeWidth="0.5"
                        />

                        {/* TABLE UNDER-APRON */}
                        <polygon
                            points="84,82 236,82 236,88 84,88"
                            fill="#1e120a"
                        />

                        {/* TABLE BEVEL EDGE (THICKNESS) */}
                        <polygon
                            points="78,74 242,74 236,83 84,83"
                            fill="url(#isoTableEdgeGrad)"
                            stroke="#1e120a"
                            strokeWidth="0.5"
                        />

                        {/* 3D PERSPECTIVE TABLETOP (SOLID WALNUT) */}
                        <polygon
                            points="96,52 224,52 242,74 78,74"
                            fill="url(#isoTableTopGrad)"
                            stroke="#5c3f2b"
                            strokeWidth="1"
                        />

                        {/* Tabletop Plates and Wine Glasses */}
                        <ellipse
                            cx="125"
                            cy="64"
                            rx="8"
                            ry="4.5"
                            fill="#fcfaf6"
                            stroke="#ded8ce"
                            strokeWidth="0.5"
                        />
                        <ellipse
                            cx="195"
                            cy="64"
                            rx="8"
                            ry="4.5"
                            fill="#fcfaf6"
                            stroke="#ded8ce"
                            strokeWidth="0.5"
                        />

                        {/* Front Left Chair (with 4 visible legs) */}
                        <g transform="translate(130, 95)">
                            {/* Chair Legs */}
                            <line
                                x1="-10"
                                y1="12"
                                x2="-12"
                                y2="38"
                                stroke="#1e2025"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <line
                                x1="10"
                                y1="12"
                                x2="12"
                                y2="38"
                                stroke="#1e2025"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            {/* Chair Seat Cushion */}
                            <polygon
                                points="-14,4 14,4 12,14 -12,14"
                                fill="url(#isoChairGrad)"
                                stroke="#3d424e"
                                strokeWidth="0.8"
                            />
                            {/* Chair Backrest */}
                            <path
                                d="M -12 4 C -12 -14 12 -14 12 4 Z"
                                fill="url(#isoChairGrad)"
                                stroke="#4a505e"
                                strokeWidth="1"
                            />
                        </g>

                        {/* Front Right Chair (with 4 visible legs) */}
                        <g transform="translate(190, 95)">
                            <line
                                x1="-10"
                                y1="12"
                                x2="-12"
                                y2="38"
                                stroke="#1e2025"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <line
                                x1="10"
                                y1="12"
                                x2="12"
                                y2="38"
                                stroke="#1e2025"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <polygon
                                points="-14,4 14,4 12,14 -12,14"
                                fill="url(#isoChairGrad)"
                                stroke="#3d424e"
                                strokeWidth="0.8"
                            />
                            <path
                                d="M -12 4 C -12 -14 12 -14 12 4 Z"
                                fill="url(#isoChairGrad)"
                                stroke="#4a505e"
                                strokeWidth="1"
                            />
                        </g>

                        {/* Center Table Stand / Badge */}
                        <g transform="translate(160, 63)">
                            <ellipse
                                cx="0"
                                cy="0"
                                rx="16"
                                ry="9"
                                fill="#19100a"
                                stroke="#5c3f2b"
                                strokeWidth="1"
                            />
                            <text
                                x="0"
                                y="3"
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="system-ui, -apple-system, sans-serif"
                            >
                                #{tableNumber}
                            </text>
                        </g>
                    </svg>
                </div>
            )}
        </div>
    );
}

export default ArchitecturalTableVector;
