import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('jager_cookie_consent');
        if (!consent) {
            // Show after a small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('jager_cookie_consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
                >
                    <div className="container mx-auto max-w-7xl">
                        <div className="bg-zinc-950/90 backdrop-blur-md border border-white/10 text-white p-4 md:p-5 rounded-lg shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-sm md:text-base font-body text-gray-300 text-center md:text-left pr-8">
                                <p>
                                    Our site uses cookies. Learn more about our use of cookies:{" "}
                                    <Link to="/cookie-policy" className="text-white underline hover:text-jager-red transition-colors font-semibold">
                                        cookie policy
                                    </Link>
                                </p>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Button
                                    onClick={handleAccept}
                                    className="w-full md:w-auto bg-white text-black hover:bg-gray-200 font-heading font-bold uppercase tracking-wider text-xs md:text-sm h-10 px-8"
                                >
                                    I Accept
                                </Button>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="p-2 text-gray-400 hover:text-white md:hidden absolute top-2 right-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
