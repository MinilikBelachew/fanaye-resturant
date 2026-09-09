"use client";

import { useEffect, useState } from "react";

export type CarouselVariant =
    | "fade"
    | "slide"
    | "cards"
    | "filmstrip"
    | "captions"
    | "coverflow";

interface CarouselProps {
    images: string[];
    captions?: string[];
    intervalMs?: number;
    heightClass?: string;
    variant?: CarouselVariant;
    showArrows?: boolean;
    showDots?: boolean;
    accentColor?: string;
}

export function SiteCarousel({
    images,
    captions = [],
    intervalMs = 4500,
    heightClass = "h-[420px]",
    variant = "fade",
    showArrows = true,
    showDots = true,
    accentColor = "#e85d04",
}: CarouselProps) {
    const [index, setIndex] = useState(0);
    const slides = images.filter(Boolean);

    useEffect(() => {
        if (slides.length <= 1) return;
        if (variant === "filmstrip") return;
        const id = window.setInterval(() => {
            setIndex(current => (current + 1) % slides.length);
        }, Math.max(intervalMs, 2000));
        return () => window.clearInterval(id);
    }, [slides.length, intervalMs, variant]);

    if (slides.length === 0) {
        return (
            <div
                className={`flex ${heightClass} items-center justify-center rounded-2xl bg-black/5 text-sm opacity-60`}
            >
                Upload carousel images to preview slides.
            </div>
        );
    }

    const go = (next: number) =>
        setIndex(((next % slides.length) + slides.length) % slides.length);

    const arrows =
        showArrows && slides.length > 1 ? (
            <>
                <button
                    type="button"
                    aria-label="Previous slide"
                    onClick={() => go(index - 1)}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-lg leading-none text-white backdrop-blur-sm"
                >
                    ‹
                </button>
                <button
                    type="button"
                    aria-label="Next slide"
                    onClick={() => go(index + 1)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-lg leading-none text-white backdrop-blur-sm"
                >
                    ›
                </button>
            </>
        ) : null;

    const dots =
        showDots && slides.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => setIndex(i)}
                        className="h-2.5 w-2.5 rounded-full transition"
                        style={{
                            background:
                                i === index ? accentColor : "rgba(255,255,255,.55)",
                        }}
                    />
                ))}
            </div>
        ) : null;

    if (variant === "cards") {
        return (
            <div className="relative">
                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {slides.map((src, i) => (
                        <button
                            key={`${src}-${i}`}
                            type="button"
                            onClick={() => setIndex(i)}
                            className={`relative shrink-0 snap-center overflow-hidden rounded-2xl transition ${
                                i === index
                                    ? "w-[min(78%,520px)] ring-2"
                                    : "w-[min(58%,360px)] opacity-80"
                            } ${heightClass}`}
                            style={
                                i === index
                                    ? ({
                                          ["--tw-ring-color" as string]:
                                              accentColor,
                                      } as React.CSSProperties)
                                    : undefined
                            }
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={src}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                            {captions[i] ? (
                                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 text-left text-sm text-white">
                                    {captions[i]}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === "filmstrip") {
        return (
            <div className="space-y-3">
                <div
                    className={`relative overflow-hidden rounded-2xl ${heightClass}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={slides[index]}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                    {captions[index] ? (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-12 text-white">
                            <p className="text-sm font-medium sm:text-base">
                                {captions[index]}
                            </p>
                        </div>
                    ) : null}
                    {arrows}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {slides.map((src, i) => (
                        <button
                            key={`${src}-thumb-${i}`}
                            type="button"
                            onClick={() => setIndex(i)}
                            className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2"
                            style={{
                                borderColor:
                                    i === index ? accentColor : "transparent",
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={src}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === "coverflow") {
        const prev = (index - 1 + slides.length) % slides.length;
        const next = (index + 1) % slides.length;
        return (
            <div className={`relative ${heightClass}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    {[prev, index, next].map((slideIndex, slot) => {
                        const isCenter = slot === 1;
                        return (
                            <button
                                key={`${slides[slideIndex]}-${slot}`}
                                type="button"
                                onClick={() => setIndex(slideIndex)}
                                className={`absolute overflow-hidden rounded-2xl shadow-lg transition-all duration-500 ${
                                    isCenter
                                        ? "z-20 h-[92%] w-[58%] scale-100"
                                        : slot === 0
                                          ? "z-10 h-[72%] w-[42%] -translate-x-[62%] scale-95 opacity-60"
                                          : "z-10 h-[72%] w-[42%] translate-x-[62%] scale-95 opacity-60"
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={slides[slideIndex]}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
                {arrows}
                {dots}
            </div>
        );
    }

    if (variant === "slide") {
        return (
            <div
                className={`relative overflow-hidden rounded-2xl ${heightClass}`}
            >
                <div
                    className="flex h-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                >
                    {slides.map((src, i) => (
                        <div key={`${src}-${i}`} className="relative h-full w-full shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={src}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                            {captions[i] ? (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-10 pt-12 text-white">
                                    <p className="text-sm font-medium sm:text-base">
                                        {captions[i]}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
                {arrows}
                {dots}
            </div>
        );
    }

    // fade + captions (captions uses fade with stronger caption panel)
    return (
        <div className={`relative overflow-hidden rounded-2xl ${heightClass}`}>
            {slides.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={`${src}-${i}`}
                    src={src}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                        i === index ? "opacity-100" : "opacity-0"
                    }`}
                />
            ))}
            {(variant === "captions" || captions[index]) && captions[index] ? (
                <div
                    className={`absolute z-10 text-white ${
                        variant === "captions"
                            ? "bottom-6 left-6 right-6 rounded-2xl bg-black/55 px-5 py-4 backdrop-blur-md sm:right-auto sm:max-w-md"
                            : "inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-10 pt-12"
                    }`}
                >
                    <p className="text-sm font-medium sm:text-base">
                        {captions[index]}
                    </p>
                </div>
            ) : null}
            {arrows}
            {dots}
        </div>
    );
}
