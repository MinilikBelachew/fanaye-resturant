"use client";
import { store } from "@/context/store";
import { IndexType } from "@/interfaces/index.interface";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import SessionHydrator from "@/domains/identity/ui/SessionHydrator";
import { Provider } from "react-redux";

const Providers = ({ children }: IndexType) => {
    return (
        <Provider store={store}>
            <ThemeProvider>
                <SessionHydrator>{children}</SessionHydrator>
                <Toaster />
            </ThemeProvider>
        </Provider>
    );
};

export default Providers;
