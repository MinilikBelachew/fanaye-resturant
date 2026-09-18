"use client";

import React, { useMemo } from "react";
import QRCode from "qrcode";

interface QrCodeSvgProps {
    value: string;
    size?: number;
    fgColor?: string;
    bgColor?: string;
    id?: string;
    className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
    value,
    size = 180,
    fgColor = "#0f172a",
    bgColor = "#ffffff",
    id,
    className = "",
}) => {
    const { pathData, viewBoxSize } = useMemo(() => {
        try {
            const qr = QRCode.create(value || "https://example.com", {
                errorCorrectionLevel: "M",
            });
            const moduleCount = qr.modules.size;
            const margin = 2;
            const totalSize = moduleCount + margin * 2;

            let d = "";
            for (let r = 0; r < moduleCount; r++) {
                for (let c = 0; c < moduleCount; c++) {
                    if (qr.modules.get(r, c)) {
                        d += `M${c + margin},${r + margin}h1v1h-1z `;
                    }
                }
            }

            return { pathData: d, viewBoxSize: totalSize };
        } catch {
            return { pathData: "", viewBoxSize: 33 };
        }
    }, [value]);

    return (
        <svg
            id={id}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            width={size}
            height={size}
            shapeRendering="crispEdges"
            className={className}
            style={{ display: "block" }}
        >
            <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
            <path d={pathData} fill={fgColor} />
        </svg>
    );
};
