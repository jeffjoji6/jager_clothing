import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, MessageCircle, Sparkles, PencilRuler, Shirt, Image as ImageIcon } from "lucide-react";

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
                // We still proceed to WhatsApp so the lead isn't lost, but user knows DB failed.
            } else {
                console.log("DB INSERT SUCCESS:", insertedData);
                setSubmitStatus({ type: 'success', message: "Request saved securely to database!" });
                toast.success("Request saved to database!");
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

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            {/* Hero Section */}
            <section className="relative py-12 px-4 md:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-jager-red/5 -z-10" />
                <div className="container mx-auto max-w-6xl text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-jager-red/10 text-jager-red mb-6 border border-jager-red/20">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Premium Custom Lab</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-heading font-bold uppercase tracking-tighter mb-4 md:mb-6">
                        Create Your <span className="text-stroke-red text-transparent bg-clip-text bg-gradient-to-r from-jager-red to-red-600 block md:inline">Masterpiece</span>
                    </h1>
                    <p className="text-base md:text-xl text-grey-text max-w-2xl mx-auto mb-8 font-light">
                        From bulk orders to unique one-offs. Bring your vision to life with our premium custom clothing service.
                        Direct consultation. No limits.
                    </p>
                    <Button
                        className="rounded-full px-8 py-6 text-lg bg-jager-red hover:bg-red-700 hover:scale-105 transition-all shadow-lg hover:shadow-red-500/25 w-full md:w-auto"
                        onClick={() => document.getElementById('brief-form')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Start Your Design
                    </Button>
                </div>
            </section>

            {/* Process Steps */}
            <section className="py-12 md:py-20 bg-background border-y border-foreground/5">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-foreground/5 rounded-2xl flex items-center justify-center mb-4">
                                <PencilRuler className="w-8 h-8 text-jager-red" />
                            </div>
                            <h3 className="font-heading text-xl md:text-2xl font-bold uppercase">1. Brief</h3>
                            <p className="text-sm md:text-base text-grey-text">Share your idea, quantity, and budget. Simple form, instant connection.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-foreground/5 rounded-2xl flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-jager-red" />
                            </div>
                            <h3 className="font-heading text-xl md:text-2xl font-bold uppercase">2. Consult</h3>
                            <p className="text-sm md:text-base text-grey-text">Chat directly with our design team on WhatsApp to finalize details.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-foreground/5 rounded-2xl flex items-center justify-center mb-4">
                                <Shirt className="w-8 h-8 text-jager-red" />
                            </div>
                            <h3 className="font-heading text-xl md:text-2xl font-bold uppercase">3. Create</h3>
                            <p className="text-sm md:text-base text-grey-text">We produce your premium custom gear and ship it to your door.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Form Section */}
            <section id="brief-form" className="py-12 md:py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-background border border-foreground/10 shadow-2xl rounded-3xl p-6 md:p-12">
                        <div className="text-center mb-8 md:mb-10">
                            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Project Brief</h2>
                            <p className="text-grey-text text-sm md:text-base">Tell us about your project to start the conversation.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                            {submitStatus && (
                                <div className={`p-4 rounded-lg text-sm font-bold ${submitStatus.type === 'success'
                                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                    }`}>
                                    {submitStatus.message}
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Your Name</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 bg-foreground/5 border-transparent focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone (WhatsApp)</Label>
                                    <Input
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="h-12 bg-foreground/5 border-transparent focus:bg-background transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 bg-foreground/5 border-transparent focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Est. Quantity</Label>
                                    <Input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        className="h-12 bg-foreground/5 border-transparent focus:bg-background transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Budget Range (Optional)</Label>
                                <Input
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    className="h-12 bg-foreground/5 border-transparent focus:bg-background transition-colors"
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
                                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${formData.image_url
                                            ? "border-green-500 bg-green-500/5"
                                            : "border-foreground/20 hover:border-jager-red hover:bg-foreground/5"
                                            }`}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {uploading ? (
                                                <Loader2 className="w-8 h-8 text-grey-text animate-spin mb-2" />
                                            ) : formData.image_url ? (
                                                <>
                                                    <div className="w-10 h-10 mb-2 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                                                        <Sparkles className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-sm font-bold text-green-600">Image Attached!</p>
                                                    <p className="text-xs text-grey-text mt-1">Click to change</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 mb-2 rounded-full bg-foreground/5 flex items-center justify-center text-grey-text group-hover:text-jager-red transition-colors">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-sm text-grey-text"><span className="font-semibold text-foreground">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-grey-text mt-1">Accepts any valid image file</p>
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
                                    rows={6}
                                    value={formData.brief}
                                    onChange={e => setFormData({ ...formData, brief: e.target.value })}
                                    className="bg-foreground/5 border-transparent focus:bg-background transition-colors resize-none p-4"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || uploading}
                                className="w-full text-lg h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/20 transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                )}
                                {loading ? "Saving..." : "Start Chat on WhatsApp"}
                            </Button>

                            <p className="text-center text-xs text-grey-text">
                                By clicking "Start Chat", you agree to be contacted via WhatsApp regarding your request.
                            </p>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
