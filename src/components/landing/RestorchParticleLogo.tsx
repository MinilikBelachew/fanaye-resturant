"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    ox: number;
    oy: number;
    homeX: number;
    homeY: number;
    scatterX: number;
    scatterY: number;
    lineX: number;
    lineY: number;
    stagger: number;
    vx: number;
    vy: number;
    size: number;
    phase: number;
    speed: number;
    r: number;
    g: number;
    b: number;
    alpha: number;
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

function smoothstep(t: number) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export default function RestorchParticleLogo({
    sectionRef,
}: {
    sectionRef: React.RefObject<HTMLElement | null>;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const section = sectionRef.current;
        if (!canvas || !section) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId = 0;
        let particles: Particle[] = [];
        let width = 1200;
        let height = 700;
        let scrollProgress = 0;
        const pointer = { x: -9999, y: -9999, active: false };
        let isDisposed = false;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "/images/branding/restorch-mark-square.png";

        const updateScroll = () => {
            if (!section) return;
            const rect = section.getBoundingClientRect();
            const travel = Math.max(rect.height * 0.62, 280);
            scrollProgress = clamp(-rect.top / travel, 0, 1);
        };

        const buildParticles = () => {
            if (!img.complete || img.naturalWidth === 0 || !section) return;

            const rect = section.getBoundingClientRect();
            width = Math.max(320, rect.width || window.innerWidth);
            height = Math.max(520, rect.height || 700);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const isDesktop = width >= 1024;
            const logoSize = isDesktop
                ? Math.min(390, width * 0.31)
                : Math.min(280, width * 0.62);
            const logoCenterX = isDesktop ? width * 0.74 : width * 0.5;
            const logoCenterY = isDesktop ? height * 0.43 : height * 0.68;
            const logoLeft = logoCenterX - logoSize / 2;
            const logoTop = logoCenterY - logoSize / 2;

            const sampleSize = 180;
            const offscreen = document.createElement("canvas");
            offscreen.width = sampleSize;
            offscreen.height = sampleSize;
            const offCtx = offscreen.getContext("2d");
            if (!offCtx) return;

            offCtx.clearRect(0, 0, sampleSize, sampleSize);
            offCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
            const data = offCtx.getImageData(0, 0, sampleSize, sampleSize).data;

            const step = 2;
            const nextParticles: Particle[] = [];

            for (let sy = 0; sy < sampleSize; sy += step) {
                for (let sx = 0; sx < sampleSize; sx += step) {
                    const idx = (sy * sampleSize + sx) * 4;
                    const a = data[idx + 3];
                    if (a < 60) continue;

                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    if (r > 240 && g > 240 && b > 240) continue;

                    const t = sx / sampleSize;
                    if (t < 0.35 && Math.random() > 0.72 + t * 0.8) {
                        continue;
                    }

                    const copies =
                        t > 0.65 ? 8 : t > 0.45 ? 6 : t > 0.32 ? 4 : 3;
                    const jitter = t < 0.45 ? 3.8 : 1.6;

                    for (let c = 0; c < copies; c++) {
                        const hx =
                            logoLeft +
                            t * logoSize +
                            (Math.random() - 0.5) * jitter;
                        const hy =
                            logoTop +
                            (sy / sampleSize) * logoSize +
                            (Math.random() - 0.5) * jitter;

                        // Stage 2: Right-to-left stardust sweep (denser on right, trailing left)
                        const rtlBias = Math.pow(Math.random(), 0.65);
                        const sxPos = clamp(
                            width * 0.04 +
                                rtlBias * (width * 0.92) +
                                (Math.random() - 0.5) * 90,
                            8,
                            width - 8,
                        );
                        const syPos = clamp(
                            height * 0.12 +
                                Math.pow(Math.random(), 0.85) * (height * 0.82),
                            12,
                            height - 20,
                        );

                        // Stage 3: Straight horizontal particle line at the bottom of the hero
                        const nx = Math.random();
                        const lx = nx * width;
                        const bandJitter = (Math.random() - 0.5) * 5;
                        const ly = height - 16 + bandJitter;

                        const angle = Math.random() * Math.PI * 2;
                        const spread = 20 + Math.random() * 45;

                        const sizeRoll = Math.random();
                        const size =
                            sizeRoll < 0.66
                                ? 0.35 + Math.random() * 0.38
                                : sizeRoll < 0.91
                                  ? 0.73 + Math.random() * 0.35
                                  : 1.08 + Math.random() * 0.44;

                        nextParticles.push({
                            x: hx + Math.cos(angle) * spread,
                            y: hy + Math.sin(angle) * spread,
                            ox: Math.cos(angle) * spread,
                            oy: Math.sin(angle) * spread,
                            homeX: hx,
                            homeY: hy,
                            scatterX: sxPos,
                            scatterY: syPos,
                            lineX: lx,
                            lineY: ly,
                            stagger: Math.random() * 0.65 + (1 - t) * 0.35,
                            vx: 0,
                            vy: 0,
                            size,
                            phase: Math.random() * Math.PI * 2,
                            speed: 0.012 + Math.random() * 0.02,
                            r,
                            g,
                            b,
                            alpha:
                                t < 0.45
                                    ? 0.48 + Math.random() * 0.36
                                    : 0.76 + Math.random() * 0.24,
                        });
                    }
                }
            }

            particles = nextParticles;
        };

        const render = () => {
            if (isDisposed) return;

            const isDark = document.documentElement.classList.contains("dark");
            ctx.clearRect(0, 0, width, height);

            const hoverRadius = 115;
            const hoverRadiusSq = hoverRadius * hoverRadius;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.phase += p.speed;

                const driftAmp = scrollProgress > 0.08 ? 0.3 : 1.0;
                const driftX = Math.cos(p.phase) * driftAmp;
                const driftY = Math.sin(p.phase * 1.1) * driftAmp;

                const localScroll = clamp(
                    (scrollProgress - p.stagger * 0.14) / 0.86,
                    0,
                    1,
                );
                let baseX: number;
                let baseY: number;
                if (localScroll <= 0.5) {
                    const lp1 = smoothstep(localScroll / 0.5);
                    baseX = lerp(p.homeX, p.scatterX, lp1);
                    baseY = lerp(p.homeY, p.scatterY, lp1);
                } else {
                    const lp2 = smoothstep((localScroll - 0.5) / 0.5);
                    baseX = lerp(p.scatterX, p.lineX, lp2);
                    baseY = lerp(p.scatterY, p.lineY, lp2);
                }

                let boost = 0;
                if (pointer.active) {
                    const dx = p.x - pointer.x;
                    const dy = p.y - pointer.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < hoverRadiusSq && distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        const falloff = 1 - dist / hoverRadius;
                        const force = falloff * falloff * 7.2 + falloff * 1.8;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const snap = falloff * 5.2;
                        p.ox += nx * snap;
                        p.oy += ny * snap;
                        p.vx += nx * force - ny * force * 0.15;
                        p.vy += ny * force + nx * force * 0.15;
                        boost = falloff;
                    }
                }

                p.vx += -p.ox * 0.11;
                p.vy += -p.oy * 0.11;
                p.vx *= 0.78;
                p.vy *= 0.78;

                p.ox += p.vx;
                p.oy += p.vy;

                p.x = baseX + driftX + p.ox;
                p.y = baseY + driftY + p.oy;

                const drawSize = p.size + boost * 0.7;
                const rr = Math.min(255, Math.round(p.r + boost * 35));
                const gg = Math.min(
                    255,
                    Math.round(p.g + boost * (isDark ? 65 : 20)),
                );
                const bb = Math.min(
                    255,
                    Math.round(p.b + boost * (isDark ? 90 : 10)),
                );
                const alpha = Math.min(1, p.alpha + boost * 0.25);

                ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
                ctx.fill();
            }

            animId = window.requestAnimationFrame(render);
        };

        const handlePointerMove = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                pointer.x = x;
                pointer.y = y;
                pointer.active = true;
            } else {
                pointer.active = false;
            }
        };

        const handlePointerLeave = () => {
            pointer.active = false;
        };

        const handleResize = () => {
            buildParticles();
            updateScroll();
        };

        img.onload = () => {
            if (isDisposed) return;
            buildParticles();
            updateScroll();
            animId = window.requestAnimationFrame(render);
        };

        if (img.complete && img.naturalWidth > 0) {
            buildParticles();
            updateScroll();
            animId = window.requestAnimationFrame(render);
        }

        window.addEventListener("scroll", updateScroll, { passive: true });
        window.addEventListener("resize", handleResize);
        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        });
        window.addEventListener("pointerleave", handlePointerLeave);

        return () => {
            isDisposed = true;
            window.cancelAnimationFrame(animId);
            window.removeEventListener("scroll", updateScroll);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerleave", handlePointerLeave);
        };
    }, [sectionRef]);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-10"
        />
    );
}
