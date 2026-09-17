"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "fanaye.pwa.installDismissed";

export default function PwaInstallBanner() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
        null,
    );
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.matchMedia("(display-mode: standalone)").matches) return;
        if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

        function onBeforeInstall(event: Event) {
            event.preventDefault();
            setDeferred(event as BeforeInstallPromptEvent);
            setVisible(true);
        }

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        return () =>
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    }, []);

    if (!visible || !deferred) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 md:p-4">
            <div className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-xl dark:bg-card">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Download className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tracking-tight">
                        Install Fanaye
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-gray">
                        Add to your home screen for faster staff access — works
                        like an app.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            className="h-8"
                            onClick={async () => {
                                await deferred.prompt();
                                await deferred.userChoice;
                                setVisible(false);
                                setDeferred(null);
                            }}
                        >
                            Install
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => {
                                sessionStorage.setItem(DISMISS_KEY, "1");
                                setVisible(false);
                            }}
                        >
                            Not now
                        </Button>
                    </div>
                </div>
                <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-md text-slate-gray hover:bg-secondary"
                    aria-label="Dismiss"
                    onClick={() => {
                        sessionStorage.setItem(DISMISS_KEY, "1");
                        setVisible(false);
                    }}
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
