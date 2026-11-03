"use client";

import { useState } from "react";
import { RestorchLoader } from "@/components/common/RestorchLoader";
import { RestorchLogo } from "@/components/common/RestorchLogo";
import { RestorchBrandVideo } from "@/components/common/RestorchBrandVideo";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Play, Maximize2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function BrandingShowcasePage() {
    const [fullscreenLoading, setFullscreenLoading] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);

    const triggerFullscreen = () => {
        setFullscreenLoading(true);
        setTimeout(() => setFullscreenLoading(false), 3500);
    };

    const triggerButtonLoading = () => {
        setButtonLoading(true);
        setTimeout(() => setButtonLoading(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors p-6 sm:p-10 max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="space-y-1">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <RestorchLogo variant="mark" height={32} />
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Restorch Branding & Loader Test Lab
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Interactive test suite for logos, transparent video
                        loaders, and reveal showcases.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium">
                        <span>Toggle Theme:</span>
                        <ThemeToggleButton />
                    </div>
                </div>
            </div>

            {/* SECTION 1: Fullscreen Loader Trigger */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">
                            1. Fullscreen Overlay Loader
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Test the full-page route transition and initial app
                            loading screen.
                        </p>
                    </div>
                    <Button
                        onClick={triggerFullscreen}
                        className="gap-2 rounded-xl bg-primary text-primary-foreground font-semibold"
                    >
                        <Maximize2 className="size-4" />
                        <span>Launch Fullscreen Loader (3.5s)</span>
                    </Button>
                </div>

                {fullscreenLoading && (
                    <RestorchLoader
                        fullscreen
                        size="xl"
                        label="Restorch OS"
                        subLabel="Synchronizing table orders and live mesh..."
                    />
                )}
            </section>

            {/* SECTION 2: Short Transparent Video Loader (All Sizes) */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-bold">
                        2. Short Video Loader (2.5s Alpha Loop)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Transparent WebM loop with MP4 fallback. No background
                        box, automatically adapts to dark & light mode.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {/* Size XS */}
                    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                            Size XS (20px)
                        </span>
                        <div className="h-14 flex items-center justify-center">
                            <RestorchLoader size="xs" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Inline badge
                        </span>
                    </div>

                    {/* Size SM */}
                    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                            Size SM (28px)
                        </span>
                        <div className="h-14 flex items-center justify-center">
                            <RestorchLoader size="sm" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Table & dropdown
                        </span>
                    </div>

                    {/* Size MD */}
                    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                            Size MD (48px)
                        </span>
                        <div className="h-14 flex items-center justify-center">
                            <RestorchLoader size="md" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Card / Panel
                        </span>
                    </div>

                    {/* Size LG */}
                    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                            Size LG (76px)
                        </span>
                        <div className="h-14 flex items-center justify-center">
                            <RestorchLoader size="lg" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            QR Table Page
                        </span>
                    </div>

                    {/* Size XL */}
                    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-[11px] font-mono font-semibold uppercase text-muted-foreground">
                            Size XL (112px)
                        </span>
                        <div className="h-14 flex items-center justify-center">
                            <RestorchLoader size="xl" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            App Bootstrap
                        </span>
                    </div>
                </div>

                {/* With Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center">
                        <RestorchLoader
                            size="md"
                            label="Connecting to Dining Floor…"
                            subLabel="Table #14 Active Session"
                        />
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center">
                        <RestorchLoader
                            size="md"
                            label="Reconciling Daily Shift Close…"
                            subLabel="Verified Cash Custody: 100%"
                        />
                    </div>
                </div>
            </section>

            {/* SECTION 3: Long Reveal Videos (Light vs Navy) */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-bold">
                        3. Long Brand Reveal Videos (6.0s 16:9)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Used on Sign-In & Sign-Up desktop split-screens, kiosk
                        displays, and onboarding.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Light Video */}
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Light Theme Reveal (6s)
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                                restorch-logo-light.mp4
                            </span>
                        </div>
                        <RestorchBrandVideo
                            mode="light"
                            className="aspect-video w-full rounded-xl"
                            badgeText="Day Shift Mode"
                        />
                    </div>

                    {/* Navy Video */}
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Deep Navy / Dark Reveal (6s)
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                                restorch-logo-navy.mp4
                            </span>
                        </div>
                        <RestorchBrandVideo
                            mode="navy"
                            className="aspect-video w-full rounded-xl"
                            badgeText="Night Shift Mode"
                        />
                    </div>
                </div>
            </section>

            {/* SECTION 4: Logo System (Auto Dark/Light) */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-bold">
                        4. Logo Variants & Theme Switching
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Toggle the theme at top-right to watch both the logo
                        text and videos respond instantly.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                            Full Lockup (Auto Theme)
                        </span>
                        <div className="h-12 flex items-center justify-center">
                            <RestorchLogo variant="full" height={32} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Used in navbars and headers
                        </span>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                            Swirl Torch Mark Alone
                        </span>
                        <div className="h-12 flex items-center justify-center">
                            <RestorchLogo variant="mark" height={36} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Used in collapsed sidebars and mobile
                        </span>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                            Inline Button Spinner
                        </span>
                        <div className="h-12 flex items-center justify-center">
                            <Button
                                onClick={triggerButtonLoading}
                                disabled={buttonLoading}
                                className="gap-2 rounded-xl"
                            >
                                {buttonLoading ? (
                                    <RestorchSpinner className="size-4" />
                                ) : (
                                    <Sparkles className="size-4" />
                                )}
                                <span>
                                    {buttonLoading
                                        ? "Processing…"
                                        : "Click To Spin"}
                                </span>
                            </Button>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Active button loading
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}
