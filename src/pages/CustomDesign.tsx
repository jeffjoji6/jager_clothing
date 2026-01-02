import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, MessageCircle, Sparkles, PencilRuler, Shirt, Image as ImageIcon, UploadCloud } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ThreeDTiltCard } from "@/components/ThreeDTiltCard";

export default function CustomDesign() {
    const [loading, setLoading] = useState(false);
    // Hardcoded WhatsApp Number as requested
    const adminPhone = "919633088122";
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        quantity: "",
        budget: "",
        brief: "",
        image_url: "",
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }
        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('custom-designs')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('custom-designs')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: data.publicUrl });
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };


    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSubmitStatus(null);

        try {
            // 1. Save Request to Database
            console.log("Attempting to save to custom_design_requests...");
            const { data: insertedData, error } = await supabase
                .from('custom_design_requests')
                .insert({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    whatsapp_number: formData.phone,
                    brief: formData.brief,
                    quantity: parseInt(formData.quantity) || 0,
                    budget_range: formData.budget,
                    image_url: formData.image_url,
                })
                .select(); // Add .select() to get the inserted data back

            if (error) {
                console.error("DB INSERT ERROR:", error);
                setSubmitStatus({ type: 'error', message: `Database Error: ${error.message}. Please screenshot this and send to support.` });
                toast.error(`Database error: ${error.message}`);
            } else {
                console.log("DB INSERT SUCCESS:", insertedData);
                setSubmitStatus({ type: 'success', message: "Request saved securely to database!" });
                toast.success("Request saved to database!");

                // Send email notification to admin
                try {
                    const { sendCustomDesignNotificationEmail } = await import('@/lib/emailService');
                    await sendCustomDesignNotificationEmail({
                        customerName: formData.name,
                        customerEmail: formData.email,
                        brief: formData.brief,
                        quantity: formData.quantity,
                        budget: formData.budget || '',
                        imageUrl: formData.image_url,
                    });
                    console.log("Email notification sent successfully");
                } catch (emailError) {
                    console.error("Error sending email notification:", emailError);
                    // Don't fail the submission, just log
                }
            }

            // 2. Format WhatsApp Message
            const message = encodeURIComponent(
                `*New Custom Design Request*\n\n` +
                `*Name:* ${formData.name}\n` +
                `*Brief:* ${formData.brief}\n` +
                `*Qty:* ${formData.quantity}\n` +
                `*Budget:* ${formData.budget}\n` +
                `*Email:* ${formData.email}\n` +
                (formData.image_url ? `*Ref Image:* ${formData.image_url}\n` : '') +
                `----------------\n` +
                `ID: ${new Date().getTime().toString().slice(-6)}`
            );

            // 3. Redirect to WhatsApp (New Tab to preserve logs)
            const whatsappUrl = `https://wa.me/${adminPhone}?text=${message}`;

            toast.success("Opening WhatsApp...", {
                duration: 3000,
            });

            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                setLoading(false);
            }, 1000);

        } catch (err: any) {
            console.error(err);
            setSubmitStatus({ type: 'error', message: `System Error: ${err.message}` });
            toast.error("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100
            }
        }
    };

    return (
        <div className="min-h-screen text-foreground relative overflow-hidden bg-background">

            <Helmet>
                <title>Custom Design | Jager Clothing - Premium Streetwear</title>
                <meta name="description" content="Bring your vision to life with Jager Custom Lab. From bulk orders to unique one-offs. Direct design consultation and premium manufacturing." />
                <meta property="og:title" content="Create Your Masterpiece | Jager Custom Lab" />
                <meta property="og:description" content="Premium custom apparel service. No limits. Direct consultation. Start your design today." />
                <link rel="canonical" href="https://jagerclothing.com/custom-design" />
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
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-background border border-border shadow-sm text-jager-red mb-8 md:mb-10">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span className="text-xs md:text-sm font-bold uppercase tracking-[0.2em]">Premium Custom Lab</span>
                    </div>

                    {/* Heading - Larger on mobile */}
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-heading font-black uppercase tracking-tighter mb-6 md:mb-8 leading-[0.9]">
                        <span className="text-foreground">Create Your</span><br />
                        <span className="text-jager-red">Masterpiece</span>
                    </h1>

                    <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 md:mb-12 font-medium leading-relaxed px-4">
                        From bulk orders to unique one-offs. Direct consultation. <br className="hidden md:block" />
                        Using the finest fabrics and premium prints.
                    </p>

                    <div className="pb-8">
                        <Button
                            className="rounded-xl md:rounded-full h-14 px-8 md:px-12 text-base md:text-lg bg-jager-red hover:bg-red-700 text-white font-heading font-bold uppercase tracking-widest shadow-xl shadow-red-900/20 transition-all hover:scale-105 active:scale-95 w-full md:w-auto"
                            onClick={() => document.getElementById('brief-form')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Start Your Design
                        </Button>
                    </div>
                </div>
            </ScrollReveal>

            {/* Process Steps - Footer-Style Cards */}
            <section className="py-8 md:py-20 relative z-10 px-4">
                <div className="container mx-auto max-w-6xl">

                    {/* Section Header for Mobile */}
                    <div className="text-center mb-8 md:hidden">
                        <h2 className="text-lg font-heading font-bold uppercase tracking-widest">How It Works</h2>
                    </div>

                    <ScrollReveal
                        className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-12"
                    >
                        {/* Step 1 - Brief */}
                        <div className="bg-secondary/30 rounded-xl p-5 md:p-6 border border-white/5 hover:bg-secondary/40 transition-colors">
                            <div className="flex items-center gap-4 md:flex-col md:text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-background rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                                    <PencilRuler className="w-5 h-5 md:w-8 md:h-8 text-jager-red" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-base md:text-2xl font-bold uppercase mb-1">1. Brief</h3>
                                    <p className="text-sm md:text-base text-muted-foreground">Share your idea, quantity, and budget.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 - Consult */}
                        <div className="bg-secondary/30 rounded-xl p-5 md:p-6 border border-white/5 hover:bg-secondary/40 transition-colors">
                            <div className="flex items-center gap-4 md:flex-col md:text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-background rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                                    <MessageCircle className="w-5 h-5 md:w-8 md:h-8 text-jager-red" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-base md:text-2xl font-bold uppercase mb-1">2. Consult</h3>
                                    <p className="text-sm md:text-base text-muted-foreground">Chat directly on WhatsApp to finalize details.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 - Create */}
                        <div className="bg-secondary/30 rounded-xl p-5 md:p-6 border border-white/5 hover:bg-secondary/40 transition-colors">
                            <div className="flex items-center gap-4 md:flex-col md:text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-background rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                                    <Shirt className="w-5 h-5 md:w-8 md:h-8 text-jager-red" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-heading text-base md:text-2xl font-bold uppercase mb-1">3. Create</h3>
                                    <p className="text-sm md:text-base text-muted-foreground">We produce and ship your custom gear.</p>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Main Form Section - Liquid Glass UI */}
            <section id="brief-form" className="py-4 md:py-20 px-2 md:px-4 relative z-10 transition-colors duration-500">
                {/* Ambient Background Glow for Glass Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl max-h-[800px] bg-jager-red/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

                <div className="container mx-auto max-w-4xl p-0 md:p-4">
                    <ScrollReveal
                        className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-3xl p-5 md:p-12 relative overflow-hidden shadow-2xl"
                    >
                        <div className="text-center mb-8 md:mb-10 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Project Brief</h2>
                            <p className="text-muted-foreground text-sm md:text-base">Tell us about your project to start the conversation.</p>
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
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base"
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Est. Quantity</Label>
                                    <Input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        className="h-12 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base"
                                        placeholder="How many pieces?"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Budget Range (Optional)</Label>
                                <Input
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    className="h-12 bg-background/50 border-input focus:border-jager-red/50 transition-all text-base"
                                    placeholder="e.g. ₹5,000 - ₹10,000"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Reference Image (Optional)</Label>
                                <div className="relative">
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    <Label
                                        htmlFor="image-upload"
                                        className={`flex flex-col items-center justify-center w-full h-20 md:h-32 border-2 border-dashed rounded-lg md:rounded-xl cursor-pointer transition-all relative overflow-hidden group hover:scale-[1.02] ${formData.image_url
                                            ? "border-green-500 bg-green-500/10"
                                            : "border-input"
                                            }`}
                                    >
                                        <div className="flex flex-row md:flex-col items-center justify-center gap-3 pt-2 pb-2 md:pt-5 md:pb-6 pointer-events-none relative z-10">
                                            {uploading ? (
                                                <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground animate-spin" />
                                            ) : formData.image_url ? (
                                                <>
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shrink-0">
                                                        <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                                                    </div>
                                                    <div className="text-left md:text-center">
                                                        <p className="text-sm font-bold text-green-500">Image Attached!</p>
                                                        <p className="text-xs text-muted-foreground">Click to change</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Liquid Blob Icon Background - PRESERVED */}
                                                    <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                                                        <motion.div
                                                            className="absolute inset-0 bg-accent/80 opacity-50"
                                                            animate={{
                                                                borderRadius: [
                                                                    "60% 40% 30% 70% / 60% 30% 70% 40%",
                                                                    "30% 60% 70% 40% / 50% 60% 30% 60%",
                                                                    "60% 40% 30% 70% / 60% 30% 70% 40%"
                                                                ]
                                                            }}
                                                            transition={{
                                                                duration: 4,
                                                                repeat: Infinity,
                                                                ease: "easeInOut"
                                                            }}
                                                        />
                                                        <motion.div
                                                            className="absolute inset-0 bg-accent/50"
                                                            animate={{
                                                                borderRadius: [
                                                                    "40% 60% 70% 30% / 40% 50% 60% 50%",
                                                                    "60% 30% 50% 70% / 60% 40% 50% 60%",
                                                                    "40% 60% 70% 30% / 40% 50% 60% 50%"
                                                                ],
                                                                rotate: [0, 180, 360]
                                                            }}
                                                            transition={{
                                                                duration: 7,
                                                                repeat: Infinity,
                                                                ease: "linear"
                                                            }}
                                                        />
                                                        <UploadCloud className="w-5 h-5 md:w-6 md:h-6 text-foreground/80 relative z-10" />
                                                    </div>

                                                    <div className="text-left md:text-center">
                                                        <p className="text-sm font-medium">Upload Reference</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">Click or drag image</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Project Details</Label>
                                <Textarea
                                    required
                                    placeholder="Describe your vision. What kind of apparel? Any specific colors, prints, or fabric requirements?"
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
                                {loading ? "Saving..." : "Start Chat on WhatsApp"}
                            </Button>

                            <p className="text-center text-[10px] md:text-xs text-muted-foreground px-4">
                                By clicking "Start Chat", you agree to be contacted via WhatsApp regarding your request.
                            </p>
                        </form>
                    </ScrollReveal>
                </div>
            </section >

            <Footer />
        </div >
    );
}
