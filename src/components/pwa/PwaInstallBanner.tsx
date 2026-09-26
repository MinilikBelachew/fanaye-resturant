"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SNOOZE_KEY = "fanaye.pwa.installSnoozeUntil";
const SESSION_SHOWN_KEY = "fanaye.pwa.installShownSession";
const PERMANENT_KEY = "fanaye.pwa.installNever";
/** Re-show at most every 7 days after "Not now" / dismiss */
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
/** Wait before first show so it doesn't pop on every navigation/action */
const SHOW_DELAY_MS = 12_000;

export default function PwaInstallBanner() {
    const t = useTranslations("pwa");
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
        null,
    );
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.matchMedia("(display-mode: standalone)").matches) return;
        if (localStorage.getItem(PERMANENT_KEY) === "1") return;

        const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || "0");
        if (snoozeUntil && Date.now() < snoozeUntil) return;
        if (sessionStorage.getItem(SESSION_SHOWN_KEY) === "1") return;

        let showTimer: ReturnType<typeof setTimeout> | null = null;
        let cancelled = false;

        function scheduleShow(event: BeforeInstallPromptEvent) {
            if (cancelled) return;
            setDeferred(event);
            showTimer = setTimeout(() => {
                if (cancelled) return;
                if (sessionStorage.getItem(SESSION_SHOWN_KEY) === "1") return;
                sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
                setVisible(true);
            }, SHOW_DELAY_MS);
        }

        function onBeforeInstall(event: Event) {
            event.preventDefault();
            scheduleShow(event as BeforeInstallPromptEvent);
        }

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        return () => {
            cancelled = true;
            if (showTimer) clearTimeout(showTimer);
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        };
    }, []);

    function snooze() {
        localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
        sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
        setVisible(false);
    }

    if (!visible || !deferred) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 md:p-4">
            <div className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-xl dark:bg-card">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Download className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tracking-tight">
                        {t("installTitle")}
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-gray">
                        {t("installBody")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            className="h-8"
                            onClick={async () => {
                                await deferred.prompt();
                                const choice = await deferred.userChoice;
                                if (choice.outcome === "accepted") {
                                    localStorage.setItem(PERMANENT_KEY, "1");
                                } else {
                                    localStorage.setItem(
                                        SNOOZE_KEY,
                                        String(Date.now() + SNOOZE_MS),
                                    );
                                }
                                sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
                                setVisible(false);
                                setDeferred(null);
                            }}
                        >
                            {t("install")}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={snooze}
                        >
                            {t("notNow")}
                        </Button>
                    </div>
                </div>
                <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-md text-slate-gray hover:bg-secondary"
                    aria-label={t("dismiss")}
                    onClick={snooze}
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
