"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Camera,
    Image as ImageIcon,
    RotateCcw,
    Check,
    X,
    Loader2,
} from "lucide-react";

export default function CameraCapture({
    title,
    onCapture,
    onCancel,
    isProcessing = false,
}: {
    title: string;
    onCapture: (dataUrl: string) => void;
    onCancel: () => void;
    isProcessing?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    // Attempt WebRTC camera stream (works on HTTPS / desktop webcam)
    useEffect(() => {
        let cancelled = false;
        async function startWebcam() {
            if (
                typeof navigator === "undefined" ||
                !navigator.mediaDevices?.getUserMedia
            ) {
                return;
            }
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
                    setCameraActive(true);
                }
            } catch {
                // On mobile HTTP or blocked permissions, fallback smoothly to native inputs
                setCameraActive(false);
            }
        }
        void startWebcam();
        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    function stopCamera() {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setCameraActive(false);
    }

    function handleSnap() {
        const video = videoRef.current;
        if (!video || !cameraActive || video.videoWidth === 0) {
            // Trigger native camera shutter directly
            cameraInputRef.current?.click();
            return;
        }
        const canvas = document.createElement("canvas");
        const max = 1280;
        const scale = Math.min(1, max / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        stopCamera();
        setPreview(dataUrl);
    }

    function onFileSelected(file: File | undefined) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
                stopCamera();
                setPreview(result);
            }
        };
        reader.readAsDataURL(file);
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[24px] border border-hairline bg-card shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.08em] text-steel-gray uppercase">
                            Receipt Verification
                        </p>
                        <h2 className="text-[17px] font-semibold text-foreground">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            stopCamera();
                            onCancel();
                        }}
                        className="rounded-full p-2 text-slate-gray hover:bg-accent hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Viewfinder / Preview / Fallback Box */}
                <div className="relative flex min-h-[260px] max-h-[50vh] w-full items-center justify-center bg-black">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Receipt preview"
                            className="max-h-[50vh] w-full object-contain"
                        />
                    ) : cameraActive ? (
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="max-h-[50vh] w-full bg-black object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30 text-white">
                                <Camera className="h-8 w-8 text-white/80" />
                            </div>
                            <p className="text-[14px] font-medium text-white/90">
                                Snap or attach payment receipt
                            </p>
                            <p className="max-w-xs text-[12px] text-white/60">
                                The transaction number will be scanned and
                                verified with the bank automatically.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 p-4">
                    {preview ? (
                        <>
                            <Button
                                className="h-12 w-full gap-2 text-[15px] font-medium"
                                disabled={isProcessing}
                                onClick={() => onCapture(preview)}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Scanning & Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Scan & Verify Payment
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="h-11 w-full gap-2 text-[14px]"
                                disabled={isProcessing}
                                onClick={() => {
                                    setPreview(null);
                                    handleSnap();
                                }}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Retake photo
                            </Button>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                            <Button
                                className="h-12 w-full gap-2 text-[14px] font-medium"
                                onClick={() => {
                                    if (cameraActive) {
                                        handleSnap();
                                    } else {
                                        cameraInputRef.current?.click();
                                    }
                                }}
                            >
                                <Camera className="h-4 w-4" />
                                Take photo
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 w-full gap-2 text-[14px] font-medium"
                                onClick={() => galleryInputRef.current?.click()}
                            >
                                <ImageIcon className="h-4 w-4" />
                                From gallery
                            </Button>
                        </div>
                    )}

                    <button
                        type="button"
                        disabled={isProcessing}
                        className="pt-1 text-center text-[13px] text-slate-gray hover:text-foreground"
                        onClick={() => {
                            stopCamera();
                            onCancel();
                        }}
                    >
                        Cancel
                    </button>

                    {/* Native Camera Capture (works directly on mobile phones over HTTP & HTTPS) */}
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={event => {
                            onFileSelected(event.target.files?.[0]);
                            event.target.value = "";
                        }}
                    />

                    {/* Native Gallery Picker (opens photo album on mobile phones) */}
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={event => {
                            onFileSelected(event.target.files?.[0]);
                            event.target.value = "";
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
