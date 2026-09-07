"use client";
import { store } from "@/context/store";
import { IndexType } from "@/interfaces/index.interface";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import DemoHydrator from "@/domains/identity/ui/DemoHydrator";
import { Provider } from "react-redux";

const Providers = ({ children }: IndexType) => {
    return (
        <Provider store={store}>
            <ThemeProvider>
                <DemoHydrator>{children}</DemoHydrator>
            </ThemeProvider>
        </Provider>
    );
};

export default Providers;
