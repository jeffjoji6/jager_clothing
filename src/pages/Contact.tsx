import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Mail, Phone } from "lucide-react";

export default function Contact() {
    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <Helmet>
                <title>Contact Us | Jager Clothing</title>
                <meta name="description" content="Get in touch with Jager Clothing. We are here to help with your queries." />
            </Helmet>



            <main className="container mx-auto px-4 py-20 md:py-32">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20 md:mb-28">
                        <h1 className="text-5xl md:text-8xl font-heading font-black uppercase tracking-tighter mb-6">
                            GET IN TOUCH
                        </h1>
                        <p className="text-lg md:text-xl font-light text-gray-500 max-w-xl mx-auto leading-relaxed">
                            We are here to assist you with your order, product questions, or any other inquiries.
                        </p>
                    </div>

                    {/* Contact Grid */}
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-20">
                        {/* Email Section */}
                        <a
                            href="mailto:support@jagerclothing.in"
                            className="group block p-8 md:p-12 border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-xl bg-white text-center"
                        >
                            <div className="mb-6 inline-flex p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                <Mail className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-heading font-bold uppercase mb-2">Email Us</h3>
                            <p className="text-gray-500 mb-4 group-hover:text-black transition-colors">For general inquiries & support</p>
                            <span className="text-lg md:text-xl font-bold border-b-2 border-transparent group-hover:border-black transition-all">
                                support@jagerclothing.in
                            </span>
                        </a>

                        {/* Phone Section */}
                        <a
                            href="https://wa.me/919633088122"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block p-8 md:p-12 border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-xl bg-white text-center"
                        >
                            <div className="mb-6 inline-flex p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                <Phone className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-heading font-bold uppercase mb-2">WhatsApp Us</h3>
                            <p className="text-gray-500 mb-4 group-hover:text-black transition-colors">Instant messaging support</p>
                            <span className="text-lg md:text-xl font-bold border-b-2 border-transparent group-hover:border-black transition-all">
                                +91 96330 88122
                            </span>
                        </a>
                    </div>


                </div>
            </main>

            <Footer />
        </div >
    );
}
