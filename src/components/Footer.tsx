import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
    return (
        <footer className="bg-background border-t border-foreground pt-12 md:pt-20 pb-8 md:pb-10">
            <div className="container mx-auto px-4">
                {/* Mobile: Accordion Layout */}
                <div className="md:hidden mb-12">
                    <div className="mb-8 text-center">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <img src="/jager_logo.png" alt="Jager" className="h-8 w-auto" />
                            <span className="text-2xl font-heading font-bold uppercase tracking-tighter">JÄGER</span>
                        </Link>
                    </div>

                    <Accordion type="single" collapsible className="w-full mb-8">
                        <AccordionItem value="shop">
                            <AccordionTrigger className="font-heading font-bold uppercase tracking-widest text-sm">SHOP</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-sm font-body text-muted-foreground pt-2 pb-4">
                                    <li><Link to="/collection" className="block hover:text-foreground transition-colors">Collection</Link></li>
                                    <li><Link to="/custom-lab" className="block hover:text-foreground transition-colors">Custom Lab</Link></li>
                                    <li><Link to="/new-arrivals" className="block hover:text-foreground transition-colors">New Arrivals</Link></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="support">
                            <AccordionTrigger className="font-heading font-bold uppercase tracking-widest text-sm">SUPPORT</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-sm font-body text-muted-foreground pt-2 pb-4">
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">Shipping Info</Link></li>
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">Returns & Exchange</Link></li>
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">Size Guide</Link></li>
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">FAQ</Link></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="company">
                            <AccordionTrigger className="font-heading font-bold uppercase tracking-widest text-sm">COMPANY</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-4 text-sm font-body text-muted-foreground pt-2 pb-4">
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">About Us</Link></li>
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">Contact</Link></li>
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">Terms of Service</Link></li>
                                    <li><Link to="#" className="block hover:text-foreground transition-colors">Privacy Policy</Link></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <div className="space-y-6 text-center">
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest">STAY CONNECTED</h3>
                        <div className="flex justify-center gap-6">
                            <a href="#" className="p-2 rounded-full bg-secondary hover:bg-jager-red hover:text-white transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-secondary hover:bg-jager-red hover:text-white transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-secondary hover:bg-jager-red hover:text-white transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>

                        <div className="pt-6 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-4">Subscribe for exclusive drops.</p>
                            <div className="flex gap-2 max-w-xs mx-auto">
                                <Input placeholder="Enter your email" className="h-10 bg-background" />
                                <Button size="sm" variant="default" className="h-10 px-4">
                                    <Mail className="h-4 w-4" />
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
                            <li><Link to="/custom-lab" className="hover:text-foreground transition-colors">Custom Lab</Link></li>
                            <li><Link to="/new-arrivals" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-6">SUPPORT</h3>
                        <ul className="space-y-4 text-sm font-body text-muted-foreground">
                            <li><Link to="#" className="hover:text-foreground transition-colors">Shipping Info</Link></li>
                            <li><Link to="#" className="hover:text-foreground transition-colors">Returns & Exchange</Link></li>
                            <li><Link to="#" className="hover:text-foreground transition-colors">Size Guide</Link></li>
                            <li><Link to="#" className="hover:text-foreground transition-colors">FAQ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-6">COMPANY</h3>
                        <ul className="space-y-4 text-sm font-body text-muted-foreground">
                            <li><Link to="#" className="hover:text-foreground transition-colors">About Us</Link></li>
                            <li><Link to="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                            <li><Link to="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link to="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-6">STAY CONNECTED</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Join the movement. Follow us on social media for the latest drops.
                        </p>
                        <div className="flex gap-4 mb-6">
                            <a href="#" className="text-foreground hover:text-jager-red transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-foreground hover:text-jager-red transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-foreground hover:text-jager-red transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Email address" className="h-10 bg-background" />
                            <Button size="sm">SUBSCRIBE</Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
                    <p className="text-xs font-body text-muted-foreground uppercase tracking-wider text-center md:text-left">
                        © 2025 Jager Clothing. All rights reserved.
                    </p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <img src="/jager_logo.png" alt="Jager" className="h-6 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
                    </div>
                </div>
            </div>
        </footer>
    );
};
