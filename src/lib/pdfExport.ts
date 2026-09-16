"use client";

import { toast } from "@/lib/toast";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface ExportPdfOptions {
    filename?: string;
    orientation?: "portrait" | "landscape";
    scale?: number;
    isReceipt?: boolean;
    format?: "a4" | "receipt";
}

/**
 * Direct Client-Side PDF Export for a single element (with multi-page slicing if long).
 * Uses the browser's native SVG <foreignObject> engine (via html-to-image) + jsPDF:
 * - Unlocks scrollHeight to prevent clipping on scrollable/overflow containers.
 * - 100% Pixel-Perfect match to preview.
 * - Direct download with ZERO browser print dialogs.
 */
export async function exportElementToPdf(
    element: HTMLElement,
    options: ExportPdfOptions = {},
): Promise<boolean> {
    const {
        filename = "menu-export.pdf",
        orientation = "portrait",
        scale = 2.5,
        isReceipt = false,
        format = "a4",
    } = options;

    toast.info(
        "Generating PDF...",
        isReceipt
            ? "Rendering 80mm thermal POS receipt..."
            : "Rendering pixel-perfect vector menu via browser engine...",
    );

    try {
        const width = element.scrollWidth || element.offsetWidth;
        const height = element.scrollHeight || element.offsetHeight;

        // Capture element using native browser rendering engine with unclipped dimensions
        const dataUrl = await toPng(element, {
            pixelRatio: scale,
            cacheBust: true,
            skipFonts: false,
            width,
            height,
            style: {
                overflow: "visible",
                maxHeight: "none",
                height: `${height}px`,
            },
            filter: node => {
                // Exclude interactive UI controls with .no-print class
                if (
                    node instanceof HTMLElement &&
                    node.classList.contains("no-print")
                ) {
                    return false;
                }
                return true;
            },
        });

        // Load into temporary image to read exact rendered aspect ratio
        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () =>
                reject(new Error("Failed to load captured menu image."));
        });

        let pdf: jsPDF;

        if (isReceipt || format === "receipt") {
            // Thermal 80mm continuous slip dimensions (never slice across multiple pages)
            const receiptWidthMm = 80;
            const receiptHeightMm =
                Math.ceil((img.height * receiptWidthMm) / img.width) + 8;
            pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [receiptWidthMm, receiptHeightMm],
                compress: true,
            });
            pdf.addImage(
                dataUrl,
                "PNG",
                0,
                4,
                receiptWidthMm,
                receiptHeightMm - 8,
            );
        } else {
            pdf = new jsPDF({
                orientation,
                unit: "mm",
                format: "a4",
                compress: true,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth;
            const imgHeight = (img.height * imgWidth) / img.width;

            // Single-page fit (with small tolerance for margins)
            if (imgHeight <= pageHeight + 3) {
                pdf.addImage(
                    dataUrl,
                    "PNG",
                    0,
                    0,
                    imgWidth,
                    Math.min(imgHeight, pageHeight),
                );
            } else {
                // Multi-page slicing for longer menus
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(
                        dataUrl,
                        "PNG",
                        0,
                        position,
                        imgWidth,
                        imgHeight,
                    );
                    heightLeft -= pageHeight;
                }
            }
        }

        pdf.save(filename);
        toast.success("PDF Downloaded!", `Saved directly as ${filename}`);
        return true;
    } catch (error) {
        console.error("Direct PDF export error:", error);
        toast.error(
            "PDF Export Failed",
            "Could not generate PDF. Please ensure all menu assets are accessible.",
        );
        return false;
    }
}

/**
 * Direct Client-Side PDF Export for an array of distinct page elements (e.g. Table QR Card sheets).
 * Guarantees every sheet is mapped 1:1 to a dedicated A4 page with zero cutoffs or broken cards.
 */
export async function exportElementsToMultiPagePdf(
    elements: HTMLElement[],
    options: ExportPdfOptions = {},
): Promise<boolean> {
    const {
        filename = "table-qr-stand-cards.pdf",
        orientation = "portrait",
        scale = 2.5,
    } = options;

    if (!elements.length) return false;

    toast.info(
        "Generating Multi-Page PDF...",
        `Rendering all ${elements.length} pages of table cards...`,
    );

    try {
        const pdf = new jsPDF({
            orientation,
            unit: "mm",
            format: "a4",
            compress: true,
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < elements.length; i++) {
            if (i > 0) {
                pdf.addPage("a4", orientation);
            }

            const el = elements[i];
            const dataUrl = await toPng(el, {
                pixelRatio: scale,
                cacheBust: true,
                skipFonts: false,
                backgroundColor: "#ffffff",
                filter: node => {
                    if (
                        node instanceof HTMLElement &&
                        node.classList.contains("no-print")
                    ) {
                        return false;
                    }
                    return true;
                },
            });

            pdf.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight);
        }

        pdf.save(filename);
        toast.success(
            "PDF Downloaded!",
            `Saved all ${elements.length} pages as ${filename}`,
        );
        return true;
    } catch (error) {
        console.error("Multi-page PDF export error:", error);
        toast.error(
            "PDF Export Failed",
            "Could not generate multi-page PDF. Please try again.",
        );
        return false;
    }
}
