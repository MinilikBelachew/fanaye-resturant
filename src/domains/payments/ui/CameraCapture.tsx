"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function CameraCapture({
    title,
    onCapture,
    onCancel,
}: {
    title: string;
    onCapture: (dataUrl: string) => void;
    onCancel: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
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
                setError(
                    "Camera blocked. Use the file picker to attach the receipt.",
                );
            }
        }
        void start();
        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    function stopCamera() {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    function snap() {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;
        const canvas = document.createElement("canvas");
        const max = 720;
        const scale = Math.min(1, max / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        stopCamera();
        setPreview(dataUrl);
    }

    function onFile(file: File | undefined) {
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[20px] bg-card">
                <div className="border-b border-hairline px-5 py-4">
                    <p className="text-[12px] tracking-[0.08em] text-steel-gray uppercase">
                        Receipt
                    </p>
                    <h2 className="text-[18px] font-semibold">{title}</h2>
                    <p className="mt-1 text-[13px] text-slate-gray">
                        Photograph the bank or Telebirr slip. Payment is
                        recorded when you confirm — cashier only sees the log.
                    </p>
                </div>
                <div className="bg-black">
                    {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={preview}
                            alt="Receipt"
                            className="max-h-[50vh] w-full object-contain"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="max-h-[50vh] w-full bg-black object-cover"
                        />
                    )}
                </div>
                {error ? (
                    <p className="px-5 pt-3 text-[13px] text-slate-gray">
                        {error}
                    </p>
                ) : null}
                <div className="flex flex-col gap-2 p-4">
                    {preview ? (
                        <>
                            <Button
                                className="h-11"
                                onClick={() => onCapture(preview)}
                            >
                                Use this photo
                            </Button>
                            <Button
                                variant="outline"
                                className="h-11"
                                onClick={() => {
                                    setPreview(null);
                                    setError("");
                                    void navigator.mediaDevices
                                        .getUserMedia({
                                            video: {
                                                facingMode: {
                                                    ideal: "environment",
                                                },
                                            },
                                            audio: false,
                                        })
                                        .then(stream => {
                                            streamRef.current = stream;
                                            if (videoRef.current) {
                                                videoRef.current.srcObject =
                                                    stream;
                                                void videoRef.current.play();
                                            }
                                        })
                                        .catch(() =>
                                            setError(
                                                "Camera blocked. Use the file picker.",
                                            ),
                                        );
                                }}
                            >
                                Retake
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button className="h-11" onClick={snap}>
                                Take photo
                            </Button>
                            <Button
                                variant="outline"
                                className="h-11"
                                onClick={() => fileRef.current?.click()}
                            >
                                Choose from gallery
                            </Button>
                        </>
                    )}
                    <button
                        type="button"
                        className="py-2 text-[14px] text-slate-gray"
                        onClick={() => {
                            stopCamera();
                            onCancel();
                        }}
                    >
                        Cancel
                    </button>
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
            </div>
        </div>
    );
}
