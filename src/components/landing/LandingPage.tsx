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
        <div className="relative min-h-screen w-full overflow-x-hidden no-scrollbar bg-background text-foreground scroll-smooth selection:bg-orange-500/30 selection:text-orange-900 dark:selection:text-orange-200">
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
