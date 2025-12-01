import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Ticker } from "@/components/Ticker";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { Loader2, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-jager.jpg";
import customLabTeaser from "@/assets/custom-lab-teaser.jpg";

const Home = () => {
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <Ticker />

      {/* Hero Section */}
      <section className="relative h-[85vh] md:h-[95vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Jager Hero"
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full max-w-4xl">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-heading font-black uppercase tracking-tighter text-white leading-[0.9] md:leading-[0.85]">
              CHASE.<br />CONQUER.<br />CREATE.
            </h1>
            <p className="text-white/90 text-base sm:text-lg md:text-xl font-body max-w-xs sm:max-w-xl mx-auto tracking-wide leading-relaxed">
              Premium streetwear for the relentless.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center items-center pt-6 md:pt-8 px-4 sm:px-0">
              <Button asChild variant="hero" size="xl" className="w-full sm:w-auto min-w-[200px] h-14 text-base tracking-widest group">
                <Link to="/collection">
                  SHOP THE DROP
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="xl" className="w-full sm:w-auto min-w-[200px] h-14 text-base tracking-widest bg-black/20 backdrop-blur-sm border-white text-white hover:bg-white hover:text-black">
                <Link to="/custom-lab">ENTER CUSTOM LAB</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Grid */}
      <section className="container mx-auto px-4 py-16 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 view-transition-name:section-title text-center md:text-left">
          <div>
            <span className="text-xs md:text-sm font-bold text-jager-red uppercase tracking-widest mb-2 block">Fresh Arrivals</span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight">
              LATEST DROP
            </h2>
          </div>
          <Button asChild variant="link" className="text-foreground hidden md:flex group">
            <Link to="/collection">
              VIEW ALL
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.slice(0, 4).map((product, index) => (
              <div
                key={product.id}
                className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={Number(product.base_price)}
                  image={product.images}
                  isNew={product.is_new}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <p className="text-grey-text">No featured products available yet.</p>
          </div>
        )}

        <div className="mt-8 md:hidden text-center">
          <Button asChild variant="outline" className="w-full">
            <Link to="/collection">VIEW ALL PRODUCTS</Link>
          </Button>
        </div>
      </section>

      {/* Custom Lab Teaser */}
      <section className="relative bg-foreground text-background py-16 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center">
            <div className="order-2 md:order-1 relative group">
              <div className="absolute -inset-4 bg-jager-red/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src={customLabTeaser}
                alt="Custom Lab"
                className="w-full aspect-[4/5] md:aspect-[4/3] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 relative z-10"
              />
            </div>
            <div className="text-center md:text-left space-y-6 md:space-y-8 order-1 md:order-2">
              <span className="text-xs md:text-sm font-bold text-jager-red uppercase tracking-widest">Jäger Custom Lab</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold uppercase tracking-tighter leading-[0.9]">
                YOUR VISION.<br />OUR QUALITY.
              </h2>
              <p className="text-base md:text-xl font-body text-background/80 max-w-md mx-auto md:mx-0 leading-relaxed">
                Create custom designs or let our pros handle it. From single pieces to team orders, we bring your ideas to life.
              </p>
              <Button asChild variant="jagerRed" size="xl" className="w-full sm:w-auto min-w-[200px] h-14 text-base tracking-widest">
                <Link to="/custom-lab">START CREATING</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-foreground pt-12 md:pt-20 pb-8 md:pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            <div>
              <h3 className="text-xs md:text-sm font-heading font-bold uppercase tracking-widest mb-4 md:mb-6">SHOP</h3>
              <ul className="space-y-3 md:space-y-4 text-sm font-body text-muted-foreground">
                <li><Link to="/collection" className="hover:text-foreground transition-colors">Collection</Link></li>
                <li><Link to="/custom-lab" className="hover:text-foreground transition-colors">Custom Lab</Link></li>
                <li><Link to="/new-arrivals" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-heading font-bold uppercase tracking-widest mb-4 md:mb-6">SUPPORT</h3>
              <ul className="space-y-3 md:space-y-4 text-sm font-body text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Returns & Exchange</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-heading font-bold uppercase tracking-widest mb-4 md:mb-6">COMPANY</h3>
              <ul className="space-y-3 md:space-y-4 text-sm font-body text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xs md:text-sm font-heading font-bold uppercase tracking-widest mb-4 md:mb-6">STAY CONNECTED</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join the movement. Follow us on social media for the latest drops.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-foreground hover:text-jager-red transition-colors font-bold uppercase text-sm">Instagram</a>
                <a href="#" className="text-foreground hover:text-jager-red transition-colors font-bold uppercase text-sm">Facebook</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">
              © 2024 Jager Clothing. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <img src="/jager_logo.png" alt="Jager" className="h-6 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
