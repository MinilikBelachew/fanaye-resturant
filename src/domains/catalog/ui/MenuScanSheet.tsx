"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Camera,
    Check,
    ImagePlus,
    Loader2,
    ScanLine,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import {
    useAdminMenuMetaQuery,
    useImportScannedMenuMutation,
    useScanMenuFromImageMutation,
} from "@/context/services/menuApi";
import type { ScannedMenuItem } from "@/domains/catalog/domain/menuApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Step = "capture" | "preview";

function dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, data] = dataUrl.split(",");
    const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "image/jpeg";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
}

export default function MenuScanSheet({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { data: metaData } = useAdminMenuMetaQuery();
    const stations = metaData?.data.stations ?? [];
    const [scanMenu, { isLoading: scanning }] = useScanMenuFromImageMutation();
    const [importMenu, { isLoading: importing }] =
        useImportScannedMenuMutation();

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>("capture");
    const [cameraError, setCameraError] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [items, setItems] = useState<ScannedMenuItem[]>([]);

    const selectedCount = useMemo(
        () => items.filter(item => item.selected !== false).length,
        [items],
    );

    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setStep("capture");
            setPreviewUrl(null);
            setItems([]);
            setCameraError("");
            return;
        }

        let cancelled = false;
        async function start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch {
                setCameraError(
                    "Camera unavailable. Upload a menu photo instead.",
                );
            }
        }
        void start();
        return () => {
            cancelled = true;
            stopCamera();
        };
    }, [isOpen]);

    function stopCamera() {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    async function runScan(file: File) {
        try {
            const result = await scanMenu(file).unwrap();
            setItems(
                (result.data ?? []).map(item => ({
                    ...item,
                    selected: item.selected !== false,
                    preparationStationId:
                        item.preparationStationId || stations[0]?.id,
                })),
            );
            setStep("preview");
            toast.success(
                `Found ${result.itemCount} item${result.itemCount === 1 ? "" : "s"}`,
                "Review the preview, then create the menu.",
            );
        } catch (err) {
            toast.fromUnknown(
                err,
                "Could not read this menu image. Try a clearer photo.",
            );
        }
    }

    function snap() {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;
        const canvas = document.createElement("canvas");
        const max = 1400;
        const scale = Math.min(1, max / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        stopCamera();
        setPreviewUrl(dataUrl);
        void runScan(dataUrlToFile(dataUrl, "menu-scan.jpg"));
    }

    function onFile(file: File | undefined) {
        if (!file) return;
        stopCamera();
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        void runScan(file);
    }

    function updateItem(index: number, patch: Partial<ScannedMenuItem>) {
        setItems(current =>
            current.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
            ),
        );
    }

    function removeItem(index: number) {
        setItems(current => current.filter((_, i) => i !== index));
    }

    async function handleCreate() {
        const payload = items.filter(item => item.selected !== false);
        if (payload.length === 0) {
            toast.error("Select at least one item to create.");
            return;
        }
        const missingStation = payload.find(item => !item.preparationStationId);
        if (missingStation) {
            toast.error(`Pick a station for “${missingStation.name}”.`);
            return;
        }
        try {
            const result = await importMenu({ items: payload }).unwrap();
            toast.success(
                `Created ${result.createdCount} menu item${result.createdCount === 1 ? "" : "s"}`,
                result.errors?.length
                    ? `${result.errors.length} skipped with errors`
                    : undefined,
            );
            onClose();
        } catch (err) {
            toast.fromUnknown(err, "Could not create menu items.");
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6">
            <div className="flex max-h-[94svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-xl dark:bg-card sm:rounded-[24px]">
                <div className="flex items-center justify-between border-b border-hairline px-4 py-3 sm:px-5">
                    <div>
                        <p className="text-[15px] font-semibold tracking-tight">
                            Build menu from photo
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            Scan or upload a printed menu, preview items, then
                            create them.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-md hover:bg-secondary"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                    {step === "capture" ? (
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-[18px] border border-hairline bg-black">
                                {previewUrl && scanning ? (
                                    <img
                                        src={previewUrl}
                                        alt="Menu preview"
                                        className="max-h-[420px] w-full object-contain"
                                    />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        playsInline
                                        muted
                                        className="max-h-[420px] w-full object-cover"
                                    />
                                )}
                            </div>
                            {cameraError ? (
                                <p className="text-[13px] text-amber-700">
                                    {cameraError}
                                </p>
                            ) : null}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={snap}
                                    disabled={scanning || Boolean(cameraError)}
                                    className="gap-2"
                                >
                                    {scanning ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Camera className="size-4" />
                                    )}
                                    Capture menu
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    disabled={scanning}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <Upload className="size-4" />
                                    Upload image
                                </Button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={event =>
                                        onFile(event.target.files?.[0])
                                    }
                                />
                            </div>
                            {scanning ? (
                                <p className="flex items-center gap-2 text-[13px] text-slate-gray">
                                    <ScanLine className="size-4 animate-pulse text-brand" />
                                    Reading menu with AI…
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {previewUrl ? (
                                <div className="overflow-hidden rounded-[16px] border border-hairline">
                                    <img
                                        src={previewUrl}
                                        alt="Scanned menu"
                                        className="max-h-40 w-full object-cover object-top"
                                    />
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[13px] text-slate-gray">
                                    {selectedCount} selected · {items.length}{" "}
                                    found
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStep("capture");
                                        setItems([]);
                                        setPreviewUrl(null);
                                    }}
                                >
                                    <ImagePlus className="size-3.5" />
                                    Rescan
                                </Button>
                            </div>

                            <ul className="space-y-3">
                                {items.map((item, index) => (
                                    <li
                                        key={`${item.name}-${index}`}
                                        className={cn(
                                            "rounded-[16px] border border-hairline p-3",
                                            item.selected === false &&
                                                "opacity-50",
                                        )}
                                    >
                                        <div className="mb-2 flex items-start gap-2">
                                            <button
                                                type="button"
                                                className={cn(
                                                    "mt-1 flex size-5 items-center justify-center rounded border",
                                                    item.selected !== false
                                                        ? "border-brand bg-brand text-white"
                                                        : "border-hairline",
                                                )}
                                                onClick={() =>
                                                    updateItem(index, {
                                                        selected:
                                                            item.selected ===
                                                            false,
                                                    })
                                                }
                                                aria-label="Toggle item"
                                            >
                                                {item.selected !== false ? (
                                                    <Check className="size-3" />
                                                ) : null}
                                            </button>
                                            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                                                <Input
                                                    value={item.name}
                                                    onChange={event =>
                                                        updateItem(index, {
                                                            name: event.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Item name"
                                                />
                                                <Input
                                                    value={item.price}
                                                    onChange={event =>
                                                        updateItem(index, {
                                                            price: event.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Price"
                                                />
                                                <Input
                                                    value={
                                                        item.categoryName ?? ""
                                                    }
                                                    onChange={event =>
                                                        updateItem(index, {
                                                            categoryName:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    placeholder="Category"
                                                />
                                                <select
                                                    className="h-9 rounded-md border border-hairline bg-transparent px-3 text-sm"
                                                    value={
                                                        item.preparationStationId ??
                                                        ""
                                                    }
                                                    onChange={event =>
                                                        updateItem(index, {
                                                            preparationStationId:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                >
                                                    <option value="" disabled>
                                                        Station
                                                    </option>
                                                    {stations.map(station => (
                                                        <option
                                                            key={station.id}
                                                            value={station.id}
                                                        >
                                                            {station.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                className="mt-1 flex size-8 items-center justify-center rounded-md text-slate-gray hover:bg-secondary hover:text-red-600"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                        <Input
                                            value={item.description ?? ""}
                                            onChange={event =>
                                                updateItem(index, {
                                                    description:
                                                        event.target.value,
                                                })
                                            }
                                            placeholder="Description (optional)"
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {step === "preview" ? (
                    <div className="flex items-center justify-end gap-2 border-t border-hairline px-4 py-3 sm:px-5">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void handleCreate()}
                            disabled={importing || selectedCount === 0}
                            className="gap-2"
                        >
                            {importing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Check className="size-4" />
                            )}
                            Create {selectedCount} item
                            {selectedCount === 1 ? "" : "s"}
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
