"use client";

import { useEffect } from "react";

export default function PwaRegister() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const register = () => {
            void navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .catch(() => {
                    // Manifest install can still work without SW in some browsers.
                });
        };

        if (document.readyState === "complete") {
            register();
        } else {
            window.addEventListener("load", register, { once: true });
        }
    }, []);

    return null;
}
