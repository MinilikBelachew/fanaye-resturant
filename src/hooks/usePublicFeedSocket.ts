"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "@/context/env";
import { useAppDispatch } from "@/context/hooks";
import { api } from "@/context/services";

export function usePublicFeedSocket() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const base = SOCKET_BASE_URL.replace(/\/$/, "");
        const socket = io(`${base}/public`, {
            transports: ["websocket", "polling"],
            withCredentials: true,
        });

        const handleMarketPrices = () => {
            dispatch(api.util.invalidateTags(["MarketPrices"]));
        };

        const handleTestimonials = () => {
            dispatch(api.util.invalidateTags(["Marketing"]));
        };

        socket.on("market.prices.updated", handleMarketPrices);
        socket.on("testimonials.updated", handleTestimonials);

        return () => {
            socket.off("market.prices.updated", handleMarketPrices);
            socket.off("testimonials.updated", handleTestimonials);
            socket.disconnect();
        };
    }, [dispatch]);
}
