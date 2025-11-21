import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CustomLabPro = () => {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    quantity: "",
    brief: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.whatsapp || !formData.brief) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Simulate WhatsApp redirect
    const message = encodeURIComponent(
      `Hi! I'm ${formData.name}.\n\nProject Brief:\n${formData.brief}\n\nQuantity: ${formData.quantity || "Not specified"}\nEmail: ${formData.email || "Not provided"}`
    );
    
    toast.success("Redirecting to WhatsApp...", {
      description: "Our team will respond within 24 hours.",
    });
    
    // In production, this would open WhatsApp
    console.log(`https://wa.me/YOUR_NUMBER?text=${message}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tight mb-4">
              JÄGER PRO
            </h1>
            <p className="text-lg font-body text-grey-text mb-6">
              Let our professional designers bring your vision to life. Perfect for teams, businesses, and bulk orders.
            </p>
            <div className="bg-jager-red/10 border border-jager-red p-4">
              <p className="font-heading text-sm uppercase">
                ⚡ FREE DESIGN CONSULTATION • UNLIMITED REVISIONS • BULK DISCOUNTS
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-heading uppercase mb-2 block">
                Your Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <Label htmlFor="whatsapp" className="text-sm font-heading uppercase mb-2 block">
                WhatsApp Number *
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+91 98765 43210"
                required
                className="border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-heading uppercase mb-2 block">
                Email (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity" className="text-sm font-heading uppercase mb-2 block">
                Estimated Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="50"
                className="border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
              <p className="text-xs text-grey-text mt-1 font-body">
                Bulk orders (50+) get special discounts
              </p>
            </div>

            {/* Brief */}
            <div>
              <Label htmlFor="brief" className="text-sm font-heading uppercase mb-2 block">
                Project Brief *
              </Label>
              <Textarea
                id="brief"
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                placeholder="Tell us about your project: What do you want to create? Any specific colors, styles, or themes? Any reference images?"
                required
                rows={6}
                className="border-2 border-foreground resize-none"
              />
            </div>

            {/* Trust Indicators */}
            <div className="bg-grey-bg p-6 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-jager-red font-bold">✓</span>
                <p className="text-sm font-body">
                  <strong>Free Mockups:</strong> We'll send you design options within 48 hours
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-jager-red font-bold">✓</span>
                <p className="text-sm font-body">
                  <strong>Unlimited Revisions:</strong> We work until you're 100% satisfied
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-jager-red font-bold">✓</span>
                <p className="text-sm font-body">
                  <strong>No Upfront Payment:</strong> Pay only when you approve the final design
                </p>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" variant="jagerRed" size="lg" className="w-full">
              SEND TO WHATSAPP
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomLabPro;
