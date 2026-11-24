"use client";

import {
    Plus_Jakarta_Sans,
    Instrument_Serif,
    JetBrains_Mono,
} from "next/font/google";
import LandingNavbar from "./LandingNavbar";
import { usePublicFeedSocket } from "@/hooks/usePublicFeedSocket";
import LandingHero from "./LandingHero";
import LandingMarquee from "./LandingMarquee";
import LandingConnectedPlatform from "./LandingConnectedPlatform";
import LandingBentoFeatures from "./LandingBentoFeatures";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingComparison from "./LandingComparison";
import LandingHardwareCompatibility from "./LandingHardwareCompatibility";
import LandingRoleMatrix from "./LandingRoleMatrix";
import LandingRoiCalculator from "./LandingRoiCalculator";
import LandingArchitecture from "./LandingArchitecture";
import LandingPricing from "./LandingPricing";
import LandingTestimonialsFaq from "./LandingTestimonialsFaq";
import LandingFinalCta from "./LandingFinalCta";
import LandingFooter from "./LandingFooter";

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-landing-sans",
    display: "swap",
});

const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    weight: "400",
    style: ["normal", "italic"],
    variable: "--font-landing-serif",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-landing-mono",
    display: "swap",
});

export default function LandingPage() {
    usePublicFeedSocket();

    return (
        <div
            className={`${plusJakarta.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} landing-theme relative min-h-screen w-full overflow-x-clip no-scrollbar bg-background text-foreground scroll-smooth selection:bg-foreground/10`}
        >
            <LandingNavbar />
            <main className="flex flex-col">
                <LandingHero />
                <LandingMarquee />
                <LandingConnectedPlatform />
                <LandingBentoFeatures />
                <LandingHowItWorks />
                {/* <LandingComparison />
                <LandingHardwareCompatibility />
                <LandingRoleMatrix />
                <LandingRoiCalculator />
                <LandingArchitecture />
                <LandingPricing /> */}
                <LandingTestimonialsFaq />
                <LandingFinalCta />
            </main>
            <LandingFooter />
        </div>
    );
}
