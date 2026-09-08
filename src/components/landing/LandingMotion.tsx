"use client";

import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    duration?: number;
}

export function ScrollReveal({
    children,
    className,
    delay = 0,
    direction = "up",
    duration = 0.5,
    ...props
}: ScrollRevealProps) {
    const getInitialOffset = () => {
        switch (direction) {
            case "up":
                return { y: 28, x: 0 };
            case "down":
                return { y: -28, x: 0 };
            case "left":
                return { x: 28, y: 0 };
            case "right":
                return { x: -28, y: 0 };
            default:
                return { x: 0, y: 0 };
        }
    };

    const offset = getInitialOffset();

    return (
        <motion.div
            initial={{ opacity: 0, ...offset }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
                duration,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1,
    ...props
}: {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
} & HTMLMotionProps<"div">) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({
    children,
    className,
    ...props
}: {
    children: ReactNode;
    className?: string;
} & HTMLMotionProps<"div">) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.45,
                        ease: [0.21, 0.47, 0.32, 0.98],
                    },
                },
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}
