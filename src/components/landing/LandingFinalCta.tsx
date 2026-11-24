"use client";

import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { RestorchLogo } from "@/components/common/RestorchLogo";

export default function LandingFinalCta() {
    const params = useParams();
    const isAm = params?.locale === "am";

    return (
        <section className="relative py-8 md:py-12 bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Minimalist Flat Capsule CTA Bar */}
                <div className="relative overflow-hidden rounded-[26px] border border-orange-500/25 bg-gradient-to-r from-[#9a3412] via-[#c2410c] to-[#ea580c] px-4 py-3.5 sm:px-6 sm:py-4 md:px-8 md:py-4.5 text-white">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                        {/* Left Group: Logo Box + Text */}
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                            {/* Flat White Rounded Logo Badge */}
                            <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2">
                                <RestorchLogo
                                    variant="mark"
                                    height={36}
                                    width={36}
                                    priority
                                />
                            </div>

                            {/* Headline & Concise Subtitle */}
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white leading-tight">
                                    {isAm
                                        ? "እያንዳንዱን ፈረቃ በቅንጅት ለማስኬድ ዝግጁ ነዎት?"
                                        : "Ready to run every shift in calm sync?"}
                                </h2>
                                <p className="mt-0.5 text-xs sm:text-[13px] text-white/85 leading-snug truncate sm:whitespace-normal">
                                    {isAm
                                        ? "የአዳራሽ POS፣ የኩሽና KDS፣ የስቶር ክምችት እና የቴሌብር Z-Report በአንድ ወጥ ስርዓት።"
                                        : "Bring your floor POS, kitchen KDS, store inventory, and Telebirr Z-Reports into one system."}
                                </p>
                            </div>
                        </div>

                        {/* Right Group: Flat White Pill Button */}
                        <div className="shrink-0 self-end sm:self-center">
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-[#c2410c] transition-all duration-200 hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>{isAm ? "ይጀምሩ" : "Get Started"}</span>
                                <ArrowRight className="size-4 stroke-[2.25]" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
