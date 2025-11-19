import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const CustomLab = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Split Screen Options */}
      <section className="flex-1 grid md:grid-cols-2">
        {/* Option A - I Design */}
        <div className="relative min-h-[50vh] md:min-h-screen flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-border">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1558769132-cb1aea9c75b3?w=1000&h=1000&fit=crop')",
            }}
          />
          <div className="relative z-10 text-center space-y-6 max-w-md">
            <h2 className="text-4xl md:text-6xl font-heading">I DESIGN.</h2>
            <p className="text-xl">Upload art. Instant Print.</p>
            <p className="text-muted-foreground">
              Choose your product, upload your design, and we'll handle the rest. Perfect for
              personal projects and small orders.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 btn-press"
            >
              <Link to="/custom-lab/create">START CREATING</Link>
            </Button>
          </div>
        </div>

        {/* Option B - We Design (Jager Pro) */}
        <div className="relative min-h-[50vh] md:min-h-screen flex items-center justify-center p-8">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1000&h=1000&fit=crop')",
            }}
          />
          <div className="relative z-10 text-center space-y-6 max-w-md">
            <h2 className="text-4xl md:text-6xl font-heading">WE DESIGN.</h2>
            <p className="text-xl">Bulk Orders. Complex Graphics. Teams.</p>
            <p className="text-muted-foreground">
              Need professional design work? Our team will create custom graphics for your brand,
              team, or event. Bulk discounts available.
            </p>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground btn-press"
            >
              <Link to="/jager-pro">HIRE A PRO</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CustomLab;
