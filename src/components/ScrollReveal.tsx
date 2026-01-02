import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    variant?: "fade-up" | "fade-in" | "slide-in";
    delay?: number;
}

export const ScrollReveal = ({
    children,
    className,
    variant = "fade-up",
    delay = 0
}: ScrollRevealProps) => {

    const variants = {
        "fade-up": {
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
        },
        "fade-in": {
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
        },
        "slide-in": {
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 }
        }
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={variants[variant]}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
};
