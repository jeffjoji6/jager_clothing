import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const JagerPro = () => {
  const [showThankYou, setShowThankYou] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    quantity: "",
    brief: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.whatsapp || !formData.quantity || !formData.brief) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Show thank you modal
    setShowThankYou(true);
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      whatsapp: "",
      quantity: "",
      brief: "",
    });
  };

  // Mock masonry grid images
  const portfolioImages = [
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1622445275576-721325763afe?w=600&h=500&fit=crop",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=700&fit=crop",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-heading mb-6">JÄGER PRO</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Professional design services for teams, brands, and events. From concept to creation.
          </p>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading mb-12 text-center">OUR WORK</h2>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {portfolioImages.map((image, index) => (
              <div key={index} className="break-inside-avoid">
                <img
                  src={image}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Queue Form */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-heading mb-4 text-center">GET IN THE QUEUE</h2>
          <p className="text-center text-muted-foreground mb-12">
            Tell us about your project. A designer will WhatsApp you within 24 hours.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                placeholder="NAME"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-0 border-b border-foreground focus-visible:ring-0 focus-visible:border-accent px-0"
                required
              />
            </div>

            <div>
              <Input
                type="email"
                placeholder="EMAIL"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-0 border-b border-foreground focus-visible:ring-0 focus-visible:border-accent px-0"
                required
              />
            </div>

            <div>
              <Input
                type="tel"
                placeholder="WHATSAPP NUMBER (MANDATORY)"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="border-0 border-b border-foreground focus-visible:ring-0 focus-visible:border-accent px-0"
                required
              />
            </div>

            <div>
              <Input
                type="number"
                placeholder="QUANTITY"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="border-0 border-b border-foreground focus-visible:ring-0 focus-visible:border-accent px-0"
                min="1"
                required
              />
            </div>

            <div>
              <Textarea
                placeholder="DESIGN BRIEF - Tell us your vision"
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                className="border-0 border-b border-foreground focus-visible:ring-0 focus-visible:border-accent px-0 min-h-32 resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-foreground text-background hover:bg-foreground/90 btn-press text-lg py-6"
            >
              SUBMIT REQUEST
            </Button>
          </form>
        </div>
      </section>

      {/* Thank You Modal */}
      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">THANK YOU!</DialogTitle>
            <DialogDescription className="text-base pt-4">
              Your request has been received. A designer will WhatsApp you within 24 hours to
              discuss your project.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowThankYou(false)}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
          >
            CLOSE
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default JagerPro;
