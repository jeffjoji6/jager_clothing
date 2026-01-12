import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import { useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SizeChartModal } from "@/components/SizeChartModal";
import { subscribeToNewsletter } from "@/lib/notificationService";
import { toast } from "sonner";

export const Footer = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLoading(true);
        try {
            const result = await subscribeToNewsletter(email);
            if (result.success) {
                toast.success(result.message);
                setEmail("");
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Subscription error:", error);
            toast.error("Failed to subscribe. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer className="bg-background border-t border-foreground pt-12 md:pt-20 pb-8 md:pb-10">
            <div className="container mx-auto px-4">
                {/* Mobile: Accordion Layout - Redesigned */}
                <div className="md:hidden mb-8">
                    {/* Logo Section */}
                    <div className="mb-6 text-center">
                        <Link to="/" className="inline-flex items-center">
                            <img src="/jager_logo_v2.png" alt="Jager" className="h-9 w-auto" />
                        </Link>
                        <p className="text-sm text-muted-foreground mt-2">Premium Streetwear</p>
                    </div>

                    {/* Accordion Navigation */}
                    <Accordion type="single" collapsible className="w-full mb-10 space-y-2">
                        <AccordionItem value="shop" className="border-b-0 bg-secondary/30 rounded-xl px-4">
                            <AccordionTrigger className="font-heading font-bold uppercase tracking-widest text-base py-4">SHOP</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-base font-body text-muted-foreground pb-4">
                                    <li><Link to="/collection" className="block hover:text-foreground transition-colors py-1">Collection</Link></li>
                                    <li><Link to="/custom-design" className="block hover:text-foreground transition-colors py-1">Custom Design</Link></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="support" className="border-b-0 bg-secondary/30 rounded-xl px-4">
                            <AccordionTrigger className="font-heading font-bold uppercase tracking-widest text-base py-4">SUPPORT</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-base font-body text-muted-foreground pb-4">
                                    <li><Link to="/contact" className="block hover:text-foreground transition-colors py-1">Contact Us</Link></li>
                                    <li><Link to="/shipping-policy" className="block hover:text-foreground transition-colors py-1">Shipping Policy</Link></li>
                                    <li><Link to="/refund-policy" className="block hover:text-foreground transition-colors py-1">Returns & Exchange</Link></li>
                                    <li>
                                        <SizeChartModal>
                                            <button className="block hover:text-foreground transition-colors text-left w-full py-1">Size Guide</button>
                                        </SizeChartModal>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="legal" className="border-b-0 bg-secondary/30 rounded-xl px-4">
                            <AccordionTrigger className="font-heading font-bold uppercase tracking-widest text-base py-4">LEGAL</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-base font-body text-muted-foreground pb-4">
                                    <li><Link to="/terms-of-service" className="block hover:text-foreground transition-colors py-1">Terms of Service</Link></li>
                                    <li><Link to="/privacy-policy" className="block hover:text-foreground transition-colors py-1">Privacy Policy</Link></li>
                                    <li><Link to="/cookie-policy" className="block hover:text-foreground transition-colors py-1">Cookie Policy</Link></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Stay Connected Section */}
                    <div className="space-y-6 text-center bg-secondary/20 rounded-2xl p-6">
                        <h3 className="text-lg font-heading font-bold uppercase tracking-widest">STAY CONNECTED</h3>
                        <div className="flex justify-center gap-4">
                            <a href="https://www.instagram.com/jagerclothing.store" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-background border border-border hover:bg-jager-red hover:border-jager-red hover:text-white transition-all">
                                <Instagram className="h-6 w-6" />
                            </a>
                        </div>

                        <div className="pt-4">
                            <p className="text-base text-muted-foreground mb-4">Subscribe for exclusive drops & updates</p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Your email"
                                    className="h-12 bg-background text-base rounded-xl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                                <Button
                                    size="lg"
                                    className="h-12 px-6 rounded-xl font-bold bg-jager-red hover:bg-black text-white hover:text-white border-none"
                                    onClick={handleSubscribe}
                                    disabled={loading}
                                >
                                    <Mail className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden md:grid grid-cols-4 gap-12 mb-16">
                    <div>
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-6">SHOP</h3>
                        <ul className="space-y-4 text-sm font-body text-muted-foreground">
                            <li><Link to="/collection" className="hover:text-foreground transition-colors">Collection</Link></li>
                            <li><Link to="/custom-design" className="hover:text-foreground transition-colors">Custom Design</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-6">SUPPORT</h3>
                        <ul className="space-y-4 text-sm font-body text-muted-foreground">
                            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                            <li><Link to="/shipping-policy" className="hover:text-foreground transition-colors">Shipping Policy</Link></li>
                            <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Returns & Exchange</Link></li>
                            <li>
                                <SizeChartModal>
                                    <button className="hover:text-foreground transition-colors text-left">Size Guide</button>
                                </SizeChartModal>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-6">LEGAL</h3>
                        <ul className="space-y-4 text-sm font-body text-muted-foreground">
                            <li><Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-6">STAY CONNECTED</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Join the movement. Follow us on social media for the latest drops.
                        </p>
                        <div className="flex gap-4 mb-6">
                            <a href="https://www.instagram.com/jagerclothing.store" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-jager-red transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Email address"
                                className="h-10 bg-background"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                size="sm"
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="bg-jager-red hover:bg-black text-white"
                            >
                                {loading ? "..." : "SUBSCRIBE"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
                    <p className="text-xs font-body text-muted-foreground uppercase tracking-wider text-center md:text-left">
                        © 2025 Jager Clothing. All rights reserved.
                    </p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <img src="/jager_logo_v2.png" alt="Jager" className="h-6 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
                    </div>
                </div>
            </div>
        </footer>
    );
};
