import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const LiquidGlassSlider = ({ className }: { className?: string }) => {
    const location = useLocation();

    // Determine active state - expanded logic to keep "Collection" active for product pages too
    const isCustom = location.pathname.includes('/custom-design');
    // Default to collection active unless specifically in custom section
    const activeTab = isCustom ? "custom" : "collection";

    const tabs = [
        { id: "collection", label: "COLLECTION", path: "/collection" },
        { id: "custom", label: "CUSTOM LAB", path: "/custom-design" },
    ];

    return (
        <div className={cn(
            "relative flex items-center bg-black/5 rounded-full p-1 border border-black/5",
            className
        )}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        className={cn(
                            "relative px-6 py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-300 z-10 rounded-full",
                            isActive ? "text-black" : "text-gray-500 hover:text-black/70"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTabBackground"
                                className="absolute inset-0 bg-white rounded-full shadow-sm border border-black/5"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                initial={false}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
};
