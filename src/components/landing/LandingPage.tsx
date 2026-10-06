"use client";

import LandingNavbar from "./LandingNavbar";
import LandingHero from "./LandingHero";
import LandingMarquee from "./LandingMarquee";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingLiveDemoSimulation from "./LandingLiveDemoSimulation";
import LandingBentoFeatures from "./LandingBentoFeatures";
import LandingComparison from "./LandingComparison";
import LandingHardwareCompatibility from "./LandingHardwareCompatibility";
import LandingRoleMatrix from "./LandingRoleMatrix";
import LandingRoiCalculator from "./LandingRoiCalculator";
import LandingArchitecture from "./LandingArchitecture";
import LandingPricing from "./LandingPricing";
import LandingTestimonialsFaq from "./LandingTestimonialsFaq";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden no-scrollbar bg-background text-foreground scroll-smooth selection:bg-foreground/10">
            <LandingNavbar />
            <main className="flex flex-col">
                <LandingHero />
                <LandingMarquee />
                <LandingHowItWorks />
                <LandingLiveDemoSimulation />
                <LandingBentoFeatures />
                <LandingComparison />
                <LandingHardwareCompatibility />
                <LandingRoleMatrix />
                <LandingRoiCalculator />
                <LandingArchitecture />
                <LandingPricing />
                <LandingTestimonialsFaq />
            </main>
            <LandingFooter />
        </div>
    );
}
