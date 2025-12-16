import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Mail, Phone } from "lucide-react";

export default function Contact() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>Contact Us | Jager Clothing</title>
                <meta name="description" content="Get in touch with Jager Clothing. We are here to help with your queries." />
            </Helmet>

            <Header />

            <main className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-heading font-black uppercase mb-12 tracking-tight">Contact Information</h1>

                    <div className="bg-gray-500 p-10 md:p-14 rounded-sm shadow-xl">
                        <div className="space-y-8 text-lg md:text-xl font-body text-gray-100">
                            <p className="flex items-center justify-center gap-3">
                                <Mail className="h-6 w-6 text-red-600" />
                                <span className="font-light">Email us at <a href="mailto:support@jagerclothing.in" className="text-white hover:text-white font-bold">support@jagerclothing.in</a></span>
                            </p>

                            <p className="flex items-center justify-center gap-3">
                                <Phone className="h-6 w-6 text-red-600" />
                                <span className="font-light">or WhatsApp us <a href="https://wa.me/919633088122" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white font-bold">9633088122</a></span>
                            </p>

                            <div className="pt-8 border-t border-gray-400 mt-8">
                                <p className="text-base md:text-lg italic text-gray-200/90 leading-relaxed font-light">
                                    "We'll make sure our team gets back to you as soon as possible to clear any queries."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
