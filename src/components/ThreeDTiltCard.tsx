
import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThreeDTiltCardProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}

export const ThreeDTiltCard = ({
    children,
    className,
    intensity = 15,
}: ThreeDTiltCardProps) => {
    const ref = useRef<HTMLDivElement>(null);

    // Motion values for x and y rotation
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for rotation
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    // Transform mouse position into rotation degrees
    const rotateX = useTransform(
        mouseYSpring,
        [-0.5, 0.5],
        [`${intensity}deg`, `-${intensity}deg`]
    );
    const rotateY = useTransform(
        mouseXSpring,
        [-0.5, 0.5],
        [`-${intensity}deg`, `${intensity}deg`]
    );

    // Transform for the glare effect opacity
    const glareOpacity = useTransform(mouseYSpring, [-0.5, 0.5], [0, 0.4]);
    // Transform for the glare position
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate position as a normalized value between -0.5 and 0.5
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={cn("relative group transition-all duration-200 ease-out", className)}
        >
            <div
                style={{
                    transform: "translateZ(75px)",
                    transformStyle: "preserve-3d",
                }}
                className="w-full h-full relative"
            >
                {children}
            </div>

            {/* Dynamic Glare Effect */}
            <motion.div
                style={{
                    opacity: glareOpacity,
                    background: `radial-gradient(circle at ${Number(glareX.get()) * 100}% ${Number(glareY.get()) * 100}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)`,
                    pointerEvents: "none",
                }}
                className="absolute inset-0 z-50 mix-blend-overlay rounded-[inherit]"
                aria-hidden="true"
            />
        </motion.div>
    );
};
