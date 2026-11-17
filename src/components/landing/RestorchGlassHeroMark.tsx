"use client";

export default function RestorchGlassHeroMark() {
    return (
        <div className="relative mx-auto flex w-full max-w-[540px] sm:max-w-[620px] lg:w-[640px] lg:max-w-none items-center justify-center select-none">
            {/* Light mode looping video (borderless, no card) */}
            <video
                src="/images/branding/restorch-logo-light%20(2).mp4"
                autoPlay
                loop
                muted
                playsInline
                className="block dark:hidden w-full h-auto object-contain [mask-image:radial-gradient(closest-side,black_76%,transparent_100%)]"
            />

            {/* Dark mode looping video (borderless, no card) */}
            <video
                src="/images/branding/restorch-logo-navy%20(2).mp4"
                autoPlay
                loop
                muted
                playsInline
                className="hidden dark:block w-full h-auto object-contain [mask-image:radial-gradient(closest-side,black_76%,transparent_100%)]"
            />
        </div>
    );
}
