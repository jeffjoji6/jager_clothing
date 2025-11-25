import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Upload, Users } from "lucide-react";

const CustomLab = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tight mb-4">
            CUSTOM LAB
          </h1>
          <p className="text-lg md:text-xl font-body text-grey-text max-w-2xl mx-auto">
            Choose your path. Design it yourself or let our pros create your vision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Jager Basic */}
          <div className="border-2 border-foreground bg-background p-8 md:p-12 flex flex-col">
            <div className="flex-1">
              <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center mb-6">
                <Upload className="w-8 h-8" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-4">
                JÄGER BASIC
              </h2>
              
              <h3 className="text-xl md:text-2xl font-heading font-bold uppercase mb-4 text-jager-red">
                I DESIGN.
              </h3>
              
              <p className="text-base md:text-lg font-body text-grey-text mb-6">
                Upload your artwork and see it printed on premium quality blanks. 
                Instant mockups. No minimum order. Perfect for personal projects.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Upload your design",
                  "Choose product & size",
                  "Instant digital mockup",
                  "Order from 1 piece",
                  "Delivered in 5-7 days"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-body">
                    <span className="text-jager-red font-bold">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button asChild variant="hero" size="lg" className="w-full">
              <Link to="/custom-lab/basic">START NOW</Link>
            </Button>
          </div>

          {/* Jager Pro */}
          <div className="border-2 border-jager-red bg-background p-8 md:p-12 flex flex-col">
            <div className="flex-1">
              <div className="w-16 h-16 bg-jager-red text-background flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-4">
                JÄGER PRO
              </h2>
              
              <h3 className="text-xl md:text-2xl font-heading font-bold uppercase mb-4 text-jager-red">
                WE DESIGN.
              </h3>
              
              <p className="text-base md:text-lg font-body text-grey-text mb-6">
                Professional design service for teams, businesses, and bulk orders. 
                Our designers bring your vision to life. Perfect for team jerseys and corporate merch.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Share your brief via WhatsApp",
                  "Professional designer assigned",
                  "Unlimited revisions",
                  "Bulk order discounts",
                  "Priority production & delivery"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-body">
                    <span className="text-jager-red font-bold">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button asChild variant="jagerRed" size="lg" className="w-full">
              <Link to="/custom-lab/pro">HIRE A PRO</Link>
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 md:mt-24 grid grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <h4 className="text-3xl md:text-4xl font-heading font-bold mb-2">5000+</h4>
            <p className="text-sm font-body text-grey-text uppercase">Custom Orders</p>
          </div>
          <div>
            <h4 className="text-3xl md:text-4xl font-heading font-bold mb-2">24/7</h4>
            <p className="text-sm font-body text-grey-text uppercase">Support</p>
          </div>
          <div>
            <h4 className="text-3xl md:text-4xl font-heading font-bold mb-2">100%</h4>
            <p className="text-sm font-body text-grey-text uppercase">Quality Check</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomLab;
