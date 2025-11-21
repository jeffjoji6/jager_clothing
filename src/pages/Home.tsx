import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Ticker } from "@/components/Ticker";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-jager.jpg";
import productHoodie from "@/assets/product-hoodie-black.jpg";
import productTee from "@/assets/product-tee-white.jpg";
import productCargo from "@/assets/product-cargo-black.jpg";
import customLabTeaser from "@/assets/custom-lab-teaser.jpg";

const FEATURED_PRODUCTS = [
  { id: "1", name: "OVERSIZED HOODIE - BLACK", price: 1999, image: productHoodie, isNew: true },
  { id: "2", name: "ESSENTIAL TEE - WHITE", price: 799, image: productTee, isNew: false },
  { id: "3", name: "CARGO PANTS - BLACK", price: 2499, image: productCargo, isNew: true },
  { id: "4", name: "OVERSIZED HOODIE - BLACK", price: 1999, image: productHoodie, isNew: false },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[85vh] overflow-hidden">
        <img 
          src={heroImage} 
          alt="JÄGER Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 animate-fade-in-up">
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-heading font-bold uppercase tracking-tighter text-background mb-8 md:mb-12">
            CHASE.<br />CONQUER.<br />CREATE.
          </h1>
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-none">
            <Button asChild variant="hero" size="xl" className="w-full md:w-auto">
              <Link to="/collection">SHOP THE DROP</Link>
            </Button>
            <Button asChild variant="heroOutline" size="xl" className="w-full md:w-auto">
              <Link to="/custom-lab">ENTER CUSTOM LAB</Link>
            </Button>
          </div>
        </div>
      </section>

      <Ticker />

      {/* Collection Grid */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight">
            NEW DROP
          </h2>
          <Button asChild variant="link" className="text-foreground">
            <Link to="/collection">VIEW ALL →</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Custom Lab Teaser */}
      <section className="bg-grey-bg py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <img 
              src={customLabTeaser} 
              alt="Custom Lab" 
              className="w-full aspect-video object-cover"
            />
            <div className="text-center md:text-left space-y-6">
              <h2 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight">
                YOUR VISION.<br />OUR QUALITY.
              </h2>
              <p className="text-base md:text-lg font-body text-grey-text">
                Create custom designs or let our pros handle it. From single pieces to team orders.
              </p>
              <Button asChild variant="jagerRed" size="lg">
                <Link to="/custom-lab">START CREATING</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-heading font-bold uppercase tracking-wide mb-4">SHOP</h3>
              <ul className="space-y-2 text-sm font-body">
                <li><Link to="/collection" className="hover:text-jager-red transition-colors">Collection</Link></li>
                <li><Link to="/custom-lab" className="hover:text-jager-red transition-colors">Custom Lab</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold uppercase tracking-wide mb-4">SUPPORT</h3>
              <ul className="space-y-2 text-sm font-body">
                <li><a href="#" className="hover:text-jager-red transition-colors">Shipping</a></li>
                <li><a href="#" className="hover:text-jager-red transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-jager-red transition-colors">Size Guide</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold uppercase tracking-wide mb-4">COMPANY</h3>
              <ul className="space-y-2 text-sm font-body">
                <li><a href="#" className="hover:text-jager-red transition-colors">About</a></li>
                <li><a href="#" className="hover:text-jager-red transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold uppercase tracking-wide mb-4">CONNECT</h3>
              <ul className="space-y-2 text-sm font-body">
                <li><a href="#" className="hover:text-jager-red transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-jager-red transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center">
            <p className="text-xs font-body text-background/60">
              © 2024 JÄGER CLOTHING. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
