"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useUploadMenuImageMutation } from "@/context/services/menuApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";

interface ImageUploadFieldProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export function ImageUploadField({
    value,
    onChange,
    label = "Image",
}: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [upload, { isLoading }] = useUploadMenuImageMutation();
    const [error, setError] = useState<string | null>(null);
    const preview = filePublicUrl(value) || value || "";

    async function onPick(file: File | undefined) {
        if (!file) return;
        setError(null);
        try {
            const result = await upload(file).unwrap();
            onChange(result.file.path);
        } catch {
            setError("Upload failed. Try a JPG or PNG under 5MB.");
        }
    }

    return (
        <div className="space-y-2">
            <p className="text-[12px] font-medium text-slate-600">{label}</p>
            {preview ? (
                <div className="relative overflow-hidden rounded-xl border border-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={preview}
                        alt=""
                        className="h-28 w-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                        aria-label="Remove image"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            ) : null}
            <button
                type="button"
                disabled={isLoading}
                onClick={() => inputRef.current?.click()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hairline px-3 py-2.5 text-[12px] font-medium hover:bg-surface-ivory disabled:opacity-60"
            >
                {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <Upload className="size-3.5" />
                )}
                {isLoading ? "Uploading…" : "Upload local image"}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => void onPick(e.target.files?.[0])}
            />
            {error ? (
                <p className="text-[11px] text-destructive">{error}</p>
            ) : null}
        </div>
    );
}

interface GalleryUploadFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function GalleryUploadField({ value, onChange }: GalleryUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [upload, { isLoading }] = useUploadMenuImageMutation();
    const urls = String(value || "")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

    async function onPick(files: FileList | null) {
        if (!files?.length) return;
        const next = [...urls];
        for (const file of Array.from(files)) {
            try {
                const result = await upload(file).unwrap();
                next.push(result.file.path);
            } catch {
                // skip failed file
            }
        }
        onChange(next.join("\n"));
    }

    function removeAt(index: number) {
        onChange(urls.filter((_, i) => i !== index).join("\n"));
    }

    return (
        <div className="space-y-2">
            <p className="text-[12px] font-medium text-slate-600">Gallery images</p>
            <div className="grid grid-cols-2 gap-2">
                {urls.map((url, index) => {
                    const src = filePublicUrl(url) || url;
                    return (
                        <div
                            key={`${url}-${index}`}
                            className="relative overflow-hidden rounded-lg border border-hairline"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="aspect-square w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeAt(index)}
                                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                disabled={isLoading}
                onClick={() => inputRef.current?.click()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hairline px-3 py-2.5 text-[12px] font-medium hover:bg-surface-ivory disabled:opacity-60"
            >
                {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <Upload className="size-3.5" />
                )}
                {isLoading ? "Uploading…" : "Add local images"}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => void onPick(e.target.files)}
            />
        </div>
    );
}
