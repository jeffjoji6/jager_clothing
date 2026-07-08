import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
    Loader2,
    MessageCircle,
    Trophy,
    GraduationCap,
    Building2,
    Flag,
    PencilRuler,
    Shirt,
    Truck,
    UploadCloud,
    X,
    Users,
    BadgeCheck,
    Layers,
    MapPin,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { uploadImage } from "@/lib/imageUpload";

const GARMENT_TYPES = [
    { value: "Sports Jersey (Sublimation)", label: "Sports Jersey (Sublimation)" },
    { value: "Full Team Kit (Jersey + Shorts)", label: "Full Team Kit (Jersey + Shorts)" },
    { value: "T-Shirts", label: "T-Shirts" },
    { value: "Hoodies", label: "Hoodies" },
    { value: "Corporate / Event Wear", label: "Corporate / Event Wear" },
    { value: "Other", label: "Other" },
];

const SEGMENTS = [
    {
        icon: Trophy,
        title: "Sports Teams",
        desc: "Cricket, football, esports & more. Sublimation jerseys with player names & numbers.",
    },
    {
        icon: GraduationCap,
        title: "Colleges & Fests",
        desc: "Department tees, fest merch, farewell & batch jerseys that your batch will keep forever.",
    },
    {
        icon: Building2,
        title: "Corporate",
        desc: "Branded uniforms, event tees and onboarding kits for your whole team.",
    },
    {
        icon: Flag,
        title: "Events & Tournaments",
        desc: "Match-day kits, volunteer tees and merch for tournaments of any size.",
    },
];

const FAQS = [
    {
        q: "What is the minimum order quantity?",
        a: "Bulk orders start at just 10 pieces. The bigger the order, the better the per-piece rate — share your quantity on WhatsApp and we'll quote instantly.",
    },
    {
        q: "How long does delivery take?",
        a: "Standard production and delivery is 5–10 days after design approval and advance payment. Need it faster? Ask about rush options on WhatsApp.",
    },
    {
        q: "Can we add player names and numbers?",
        a: "Yes. Individual names, numbers and sizes for every player are included — just share your roster after we finalize the design.",
    },
    {
        q: "How does pricing work?",
        a: "Pricing depends on quantity, fabric and print type, so we quote per project on WhatsApp. Tiered rates apply — 25+, 50+ and 100+ pieces unlock better prices.",
    },
    {
        q: "Do you make the design for us?",
        a: "Yes. Send us your logo, colours and any references — our designers create a free digital mockup and revise it until your team approves.",
    },
    {
        q: "How do payments work?",
        a: "50% advance to start production, balance before dispatch. We share live production updates on WhatsApp throughout.",
    },
];

export default function CustomDesign() {
    const [loading, setLoading] = useState(false);
    // Hardcoded WhatsApp Number as requested
    const adminPhone = "919633088122";
    const [uploading, setUploading] = useState(false);
    // Store multiple image URLs
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        organization: "",
        garmentType: "",
        quantity: "",
        brief: "",
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        setUploading(true);
        const files = Array.from(e.target.files);

        try {
            const uploadPromises = files.map(file => uploadImage(file, 'custom-designs'));
            const results = await Promise.all(uploadPromises);

            // Filter out failures
            const successfulUrls = results.filter((url): url is string => !!url);

            if (successfulUrls.length > 0) {
                setImageUrls(prev => [...prev, ...successfulUrls]);
                toast.success(`${successfulUrls.length} image(s) uploaded successfully`);
            } else {
                throw new Error("Upload failed for all images");
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Error uploading images: ' + error.message);
        } finally {
            setUploading(false);
            // Reset input so same files can be selected again if needed
            e.target.value = '';
        }
    };

    // Remove image handler
    const removeImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSubmitStatus(null);

        // Join URLs for DB storage (comma separated)
        const combinedImageUrls = imageUrls.join(',');

        // Compose structured brief so garment/org survive in the existing schema
        const composedBrief =
            `Garment: ${formData.garmentType}\n` +
            (formData.organization ? `Team/Organization: ${formData.organization}\n` : '') +
            `\n${formData.brief}`;

        try {
            // Generate IDs client-side to ensure consistency and avoid DB read 401s
            const requestId = crypto.randomUUID();
            // Simple Ref for User (e.g., BLK-849201)
            const requestRef = `BLK-${Math.floor(100000 + Math.random() * 900000)}`;
            const trackingToken = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 1. Save Request to Database
            const { error } = await supabase
                .from('custom_design_requests')
                .insert({
                    id: requestId, // Explicitly set ID
                    request_ref: requestRef,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    whatsapp_number: formData.phone,
                    brief: composedBrief,
                    quantity: parseInt(formData.quantity) || 0,
                    budget_range: formData.organization,
                    image_url: combinedImageUrls,
                    tracking_token: trackingToken,
                });

            if (error) {
                console.error("DB INSERT ERROR:", error);
                // Check specifically for RLS policy error to give better feedback
                if (error.code === '42501') {
                    setSubmitStatus({ type: 'error', message: `Database Error: Permission denied (RLS). Please contact support.` });
                } else {
                    setSubmitStatus({ type: 'error', message: `Database Error: ${error.message}` });
                }
                toast.error(`Database error: ${error.message}`);
            } else {
                setSubmitStatus({ type: 'success', message: `Request Saved!` });

                toast.success("Inquiry Submitted Successfully", {
                    description: (
                        <div className="flex flex-col gap-1 mt-2">
                            <p><strong>Ref:</strong> <span className="font-mono text-xs font-bold bg-muted px-1 rounded">{requestRef}</span></p>
                            <p className="text-xs opacity-70">Save this Reference ID to track your status!</p>
                        </div>
                    ),
                    duration: null,
                    action: {
                        label: "Copy Ref",
                        onClick: () => navigator.clipboard.writeText(requestRef)
                    }
                });

                // Send email notification to admin
                try {
                    const { sendCustomDesignNotificationEmail } = await import('@/lib/emailService');
                    await sendCustomDesignNotificationEmail({
                        customerName: formData.name,
                        customerEmail: formData.email,
                        brief: composedBrief,
                        quantity: formData.quantity,
                        budget: formData.organization || '',
                        imageUrls: imageUrls,
                    });
                } catch (emailError) {
                    console.error("Error sending email notification:", emailError);
                }

                // 2. Format WhatsApp Message (Unify ID)
                let imageLinks = "";
                if (imageUrls.length > 0) {
                    imageLinks = "\n*Reference Images:*\n" + imageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n') + "\n";
                }

                const message = encodeURIComponent(
                    `*NEW BULK ORDER INQUIRY*\n\n` +
                    `*Ref:* ${requestRef}\n` +
                    `*Name:* ${formData.name}\n` +
                    (formData.organization ? `*Team/Org:* ${formData.organization}\n` : '') +
                    `*Phone:* ${formData.phone}\n` +
                    (formData.email ? `*Email:* ${formData.email}\n` : '') +
                    `\n*Order Details*\n` +
                    `------------------\n` +
                    `*Garment:* ${formData.garmentType}\n` +
                    `*Qty:* ${formData.quantity} pcs\n` +
                    `*Notes:* ${formData.brief}\n` +
                    imageLinks +
                    `\n*Track Status:*\n` +
                    `https://www.jagerclothing.in/track-request`
                );

                // 3. Redirect to WhatsApp (New Tab to preserve logs)
                const whatsappUrl = `https://wa.me/${adminPhone}?text=${message}`;

                toast.success("Opening WhatsApp...", {
                    duration: 3000,
                });

                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');
                    // Only stop loading after redirect initiated
                    setLoading(false);
                }, 1000);
            }

            // If error, stop loading immediately
            if (error) {
                setLoading(false);
            }

        } catch (err: any) {
            console.error(err);
            setSubmitStatus({ type: 'error', message: `System Error: ${err.message}` });
            toast.error("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-foreground relative overflow-hidden bg-background">

            <Helmet>
                <title>Custom Team Jerseys & Bulk Uniform Orders India | Jager Clothing</title>
                <meta name="description" content="Order custom team jerseys, sports uniforms & bulk apparel from 10 pieces. Sublimation printing, player names & numbers, free design mockup, 5-10 day delivery across India. Instant WhatsApp quote." />
                <meta name="keywords" content="custom team jersey India, bulk jersey order, sports uniform manufacturer, sublimation jersey, custom cricket jersey, custom football jersey, college fest t-shirts bulk, corporate uniform order, jersey with name and number" />
                <meta property="og:title" content="Custom Team Jerseys & Bulk Uniform Orders India | Jager Clothing" />
                <meta property="og:description" content="Custom jerseys and uniforms for sports teams, colleges, corporates & events. Bulk orders from 10 pieces. Free mockup, instant quote on WhatsApp." />
                <meta property="og:url" content="https://www.jagerclothing.in/bulk-orders" />
                <link rel="canonical" href="https://www.jagerclothing.in/bulk-orders" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": FAQS.map(faq => ({
                            "@type": "Question",
                            "name": faq.q,
                            "acceptedAnswer": { "@type": "Answer", "text": faq.a },
                        })),
                    })}
                </script>
            </Helmet>

            {/* Hero Section - Mobile Optimized */}
            <ScrollReveal
                className="relative py-12 md:py-24 px-4 overflow-hidden bg-secondary/5"
            >
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-jager-red/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-foreground/5 rounded-full blur-[80px]" />
                </div>

                <div className="container mx-auto max-w-4xl text-center relative z-10">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-background border border-border shadow-sm text-jager-red mb-5 md:mb-10">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-sm font-bold uppercase tracking-[0.2em]">Bulk & Team Orders</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-heading font-bold uppercase tracking-tighter mb-4 md:mb-8 leading-[0.9]">
                        <span className="text-foreground">Gear Up</span><br />
                        <span className="text-jager-red">Your Team</span>
                    </h1>

                    <p className="text-sm md:text-xl text-muted-foreground max-w-xs md:max-w-xl mx-auto mb-6 md:mb-8 font-medium leading-relaxed text-balance">
                        Custom jerseys, uniforms & merch for teams, colleges, corporates and events — quoted in minutes on WhatsApp.
                    </p>

                    <Button
                        className="rounded-xl md:rounded-full h-12 md:h-14 px-8 md:px-12 text-base md:text-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-heading font-bold uppercase tracking-widest shadow-xl shadow-green-900/20 transition-all hover:scale-105 active:scale-95 w-full max-w-sm md:max-w-none md:w-auto mb-7 md:mb-0 md:mt-2"
                        onClick={() => document.getElementById('brief-form')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Get a Quote
                    </Button>

                    {/* Trust checklist (2x2 on mobile, pill row on desktop) */}
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto md:max-w-2xl md:flex md:flex-wrap md:items-center md:justify-center md:gap-3 md:mt-8">
                        {[
                            { icon: Layers, label: "Bulk from 10 pcs" },
                            { icon: BadgeCheck, label: "Free Mockup" },
                            { icon: Shirt, label: "Custom Everything" },
                            { icon: MapPin, label: "Pan-India Delivery" },
                        ].map(({ icon: Icon, label }) => (
                            <span key={label} className="inline-flex items-center gap-2 md:gap-1.5 px-3 py-2 md:px-3.5 md:py-1.5 rounded-lg md:rounded-full bg-background border border-border text-[11px] md:text-sm font-bold uppercase tracking-wide text-left">
                                <Icon className="w-3.5 h-3.5 text-jager-red shrink-0" />
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </ScrollReveal>

            {/* Who It's For - Segments */}
            <section className="py-10 md:py-20 relative z-10 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight">Who We Gear Up</h2>
                        <p className="text-sm md:text-base text-muted-foreground mt-2">One supplier for every squad</p>
                    </div>

                    <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {SEGMENTS.map((segment) => {
                            const Icon = segment.icon;
                            return (
                                <div key={segment.title} className="bg-background rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md border border-border/50 transition-all flex items-start gap-3.5 lg:block">
                                    <div className="w-11 h-11 md:w-12 md:h-12 bg-jager-red/10 rounded-xl flex items-center justify-center shrink-0 lg:mb-4">
                                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-jager-red" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading text-base md:text-lg font-bold uppercase mb-1 md:mb-2">{segment.title}</h3>
                                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{segment.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </ScrollReveal>
                </div>
            </section>

            {/* Process Steps */}
            <section className="py-10 md:py-20 relative z-10 px-4 bg-secondary/5">
                <div className="container mx-auto max-w-6xl">

                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight">How It Works</h2>
                        <p className="text-sm md:text-base text-muted-foreground mt-2">From inquiry to delivery in 4 steps</p>
                    </div>

                    {/* Mobile: connected vertical timeline */}
                    <ScrollReveal className="md:hidden relative pl-4">
                        <div className="absolute left-[35px] top-2 bottom-2 w-px bg-gradient-to-b from-jager-red via-jager-red/40 to-transparent" />
                        {[
                            { icon: MessageCircle, title: "Inquire", desc: "Send your requirement — we reply on WhatsApp within hours." },
                            { icon: PencilRuler, title: "Design", desc: "Free digital mockup with your logo, colours and sponsors." },
                            { icon: Shirt, title: "Produce", desc: "Approve the design, pay 50% advance and production starts." },
                            { icon: Truck, title: "Deliver", desc: "Full kit delivered in 5–10 days, anywhere in India." },
                        ].map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
                                    <div className="relative z-10 w-11 h-11 rounded-full bg-jager-red flex items-center justify-center shrink-0 shadow-md shadow-red-900/20 ring-4 ring-background">
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="pt-1.5">
                                        <span className="text-[10px] font-bold text-jager-red uppercase tracking-widest">Step {i + 1}</span>
                                        <h3 className="font-heading text-lg font-bold uppercase leading-tight mb-1">{step.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </ScrollReveal>

                    {/* Desktop: card grid */}
                    <ScrollReveal
                        className="hidden md:grid md:grid-cols-4 gap-3 md:gap-8"
                    >
                        {/* Step 1 - Inquire */}
                        <div className="bg-background rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md border border-border/50 transition-all">
                            <div className="flex items-center gap-4 md:flex-col md:text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-jager-red/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                                    <MessageCircle className="w-5 h-5 md:w-8 md:h-8 text-jager-red" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-base md:text-xl font-bold uppercase mb-1">1. Inquire</h3>
                                    <p className="text-sm md:text-base text-muted-foreground">Send your requirement — we reply on WhatsApp within hours.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 - Design */}
                        <div className="bg-background rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md border border-border/50 transition-all">
                            <div className="flex items-center gap-4 md:flex-col md:text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-jager-red/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                                    <PencilRuler className="w-5 h-5 md:w-8 md:h-8 text-jager-red" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-base md:text-xl font-bold uppercase mb-1">2. Design</h3>
                                    <p className="text-sm md:text-base text-muted-foreground">Free digital mockup with your logo, colours and sponsors.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 - Produce */}
                        <div className="bg-background rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md border border-border/50 transition-all">
                            <div className="flex items-center gap-4 md:flex-col md:text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-jager-red/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                                    <Shirt className="w-5 h-5 md:w-8 md:h-8 text-jager-red" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-base md:text-xl font-bold uppercase mb-1">3. Produce</h3>
                                    <p className="text-sm md:text-base text-muted-foreground">Approve the design, pay 50% advance and production starts.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 - Deliver */}
                        <div className="bg-background rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md border border-border/50 transition-all">
                            <div className="flex items-center gap-4 md:flex-col md:text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-jager-red/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                                    <Truck className="w-5 h-5 md:w-8 md:h-8 text-jager-red" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-base md:text-xl font-bold uppercase mb-1">4. Deliver</h3>
                                    <p className="text-sm md:text-base text-muted-foreground">Full kit delivered in 5–10 days, anywhere in India.</p>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Main Form Section - Liquid Glass UI */}
            <section id="brief-form" className="py-10 md:py-20 px-2 md:px-4 relative z-10 transition-colors duration-500">
                {/* Ambient Background Glow for Glass Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl max-h-[800px] bg-jager-red/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

                <div className="container mx-auto max-w-4xl p-0 md:p-4">
                    <ScrollReveal
                        className="bg-background border border-border/60 rounded-xl md:rounded-3xl p-5 md:p-12 relative overflow-hidden shadow-xl"
                    >
                        <div className="text-center mb-6 md:mb-8 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Get Your Quote</h2>
                            <p className="text-muted-foreground text-sm md:text-base">Tell us about your team's order — we quote on WhatsApp within hours.</p>
                        </div>

                        {/* Risk-free reassurance */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mb-8 md:mb-10 relative z-10">
                            <div className="flex items-center gap-2.5 bg-green-500/5 border border-green-500/20 rounded-lg px-3.5 py-2.5">
                                <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-xs md:text-sm font-medium">Pay only after you approve the design</span>
                            </div>
                            <div className="flex items-center gap-2.5 bg-green-500/5 border border-green-500/20 rounded-lg px-3.5 py-2.5">
                                <PencilRuler className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-xs md:text-sm font-medium">Free mockup & revisions included</span>
                            </div>
                            <Link to="/track-request" className="flex items-center gap-2.5 bg-green-500/5 border border-green-500/20 rounded-lg px-3.5 py-2.5 hover:border-jager-red/40 transition-colors">
                                <Truck className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-xs md:text-sm font-medium">Track your order anytime with your Ref ID</span>
                            </Link>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-8 relative z-10">
                            {submitStatus && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className={`p-4 rounded-lg text-sm font-bold ${submitStatus.type === 'success'
                                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                        }`}>
                                    {submitStatus.message}
                                </motion.div>
                            )}
                            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-2">
                                    <Label>Your Name</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 md:h-14 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base px-4"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone (WhatsApp)</Label>
                                    <Input
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="h-12 md:h-14 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base px-4"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-2">
                                    <Label>Team / Organization</Label>
                                    <Input
                                        value={formData.organization}
                                        onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                        className="h-12 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base"
                                        placeholder="e.g. Thunder FC, ABC College"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (Optional)</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base"
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-2">
                                    <Label>What do you need?</Label>
                                    <Select
                                        required
                                        value={formData.garmentType}
                                        onValueChange={value => setFormData({ ...formData, garmentType: value })}
                                    >
                                        <SelectTrigger className="h-12 bg-background/50 border-input focus:border-jager-red/50 text-base">
                                            <SelectValue placeholder="Select garment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GARMENT_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Quantity (Min. 10)</Label>
                                    <Input
                                        required
                                        type="number"
                                        min={1}
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        className="h-12 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base"
                                        placeholder="How many pieces?"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Logo / Design References</Label>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                        <Label
                                            htmlFor="image-upload"
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all relative overflow-hidden group hover:scale-[1.01] ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500/50 hover:bg-green-500/5'
                                                } border-input`}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3 py-4">
                                                {uploading ? (
                                                    <>
                                                        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                                                        <p className="text-sm text-muted-foreground font-medium">Uploading...</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0 mb-2">
                                                            <motion.div
                                                                className="absolute inset-0 bg-green-500/20"
                                                                animate={{
                                                                    borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "60% 40% 30% 70% / 60% 30% 70% 40%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
                                                                }}
                                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                            />
                                                            <UploadCloud className="w-6 h-6 text-green-600 relative z-10" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-bold text-foreground">Upload Logo or References</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Team logo, old jersey, design ideas</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </Label>
                                    </div>

                                    {/* Thumbnail Grid */}
                                    {imageUrls.length > 0 && (
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                            {imageUrls.map((url, index) => (
                                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-background group shadow-sm">
                                                    <img src={url} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            removeImage(index);
                                                        }}
                                                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 scale-90 active:scale-95"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Order Details</Label>
                                <Textarea
                                    required
                                    placeholder="Tell us about your order — colours, design style, deadline, names & numbers, sizes..."
                                    rows={5}
                                    value={formData.brief}
                                    onChange={e => setFormData({ ...formData, brief: e.target.value })}
                                    className="bg-background/50 border-input focus:border-jager-red/50 transition-all resize-none p-4 text-base min-h-[120px]"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || uploading}
                                className="w-full text-lg h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/20 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                )}
                                {loading ? "Saving..." : "Get Quote on WhatsApp"}
                            </Button>

                            <p className="text-center text-[10px] md:text-xs text-muted-foreground px-4">
                                By clicking "Get Quote", you agree to be contacted via WhatsApp regarding your inquiry.
                            </p>
                        </form>
                    </ScrollReveal>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-10 md:py-20 px-4 relative z-10 bg-secondary/5">
                <div className="container mx-auto max-w-3xl">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight">Bulk Order FAQs</h2>
                        <p className="text-sm md:text-base text-muted-foreground mt-2">Everything teams usually ask us</p>
                    </div>

                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {FAQS.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`faq-${index}`}
                                className="border-b-0 bg-background shadow-sm border border-border/50 rounded-xl px-4 md:px-6"
                            >
                                <AccordionTrigger className="font-heading font-bold uppercase tracking-wide text-sm md:text-base py-4 text-left hover:no-underline">
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-4">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="text-center mt-8 space-y-4">
                        <Button
                            className="rounded-xl md:rounded-full h-12 px-8 bg-[#25D366] hover:bg-[#20bd5a] text-white font-heading font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            onClick={() => document.getElementById('brief-form')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Start Your Order
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Want to see our work first?{" "}
                            <a
                                href="https://www.instagram.com/jagerclothing.store/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-jager-red hover:underline"
                            >
                                Check us out on Instagram
                            </a>
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div >
    );
}
