"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "fanaye.theme";

type ThemeContextValue = {
    mode: ThemeMode;
    resolved: "light" | "dark";
    setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
    const dark =
        mode === "dark" || (mode === "system" && systemPrefersDark());
    document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>("system");
    const [resolved, setResolved] = useState<"light" | "dark">("light");

    useEffect(() => {
        const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
        const next =
            stored === "light" || stored === "dark" || stored === "system"
                ? stored
                : "system";
        setModeState(next);
        applyTheme(next);
        setResolved(
            next === "dark" || (next === "system" && systemPrefersDark())
                ? "dark"
                : "light",
        );
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            if (mode !== "system") return;
            applyTheme("system");
            setResolved(media.matches ? "dark" : "light");
        };
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [mode]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
        setResolved(
            next === "dark" || (next === "system" && systemPrefersDark())
                ? "dark"
                : "light",
        );
    }, []);

    const value = useMemo(
        () => ({ mode, resolved, setMode }),
        [mode, resolved, setMode],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
