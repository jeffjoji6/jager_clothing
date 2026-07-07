import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Ticker } from "@/components/Ticker";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { Loader2, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-jager.jpg";
import customLabTeaser from "@/assets/custom-lab-teaser.jpg";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { motion } from "framer-motion";

const Home = () => {
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Helmet>
        <title>Jager Clothing | Custom Team Jerseys, Uniforms & Streetwear</title>
        <meta name="description" content="Jager - Chase, Conquer, Create. Custom team jerseys, uniforms & bulk apparel from 10 pieces. Free design mockup, quote on WhatsApp. Plus exclusive streetwear drops." />
        <meta property="og:title" content="Jager Clothing | Custom Team Jerseys, Uniforms & Streetwear" />
        <meta property="og:description" content="Chase, Conquer, Create. Custom team jerseys and bulk uniforms from 10 pieces. Free mockup, instant WhatsApp quote." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.jagerclothing.in/" />
        <link rel="canonical" href="https://www.jagerclothing.in/" />
      </Helmet>
      <Ticker />

      {/* Hero Section - Mobile Optimized */}
      <section className="relative h-[75vh] md:h-[95vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Jager Hero"
            fetchPriority="high"
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full max-w-4xl">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-heading font-bold uppercase tracking-tighter text-white leading-[0.9] md:leading-[0.85]">
              CHASE.<br />CONQUER.<br />CREATE.
            </h1>
            <p className="text-white/90 text-base md:text-xl font-body max-w-md mx-auto tracking-wide leading-relaxed">
              Custom jerseys & uniforms for your whole squad. Bulk orders from 10 pieces.
            </p>
            <div className="flex flex-col gap-3 w-full justify-center items-center pt-4 md:pt-8 px-4 max-w-md mx-auto">
              <Button asChild variant="hero" size="xl" className="w-full h-12 md:h-14 text-base tracking-widest group rounded-xl md:rounded-full">
                <Link to="/bulk-orders">
                  BULK & TEAM ORDERS
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="xl" className="w-full h-12 md:h-14 text-base tracking-widest bg-black/20 backdrop-blur-sm border-white text-white hover:bg-white hover:text-black rounded-xl md:rounded-full">
                <Link to="/collection">SHOP THE DROP</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection Grid - Mobile Optimized */}
      <section className="container mx-auto px-4 py-16 md:py-32">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 text-center md:text-left">
            <div className="w-full text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight">
                LATEST DROP
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-2">Fresh styles, limited quantities</p>
            </div>
            <Button asChild variant="link" className="text-foreground hidden md:flex group">
              <Link to="/collection">
                VIEW ALL
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.slice(0, 4).map((product, index) => (
              <ScrollReveal
                key={product.id}
                delay={index * 0.1}
                variant="fade-up"
              >
                <div className="h-full">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    basePrice={Number(product.base_price)}
                    variants={product.variants}
                    image={product.images}
                    isNew={product.is_new}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <p className="text-grey-text">No featured products available yet.</p>
          </div>
        )}

        <div className="mt-8 md:mt-8 text-center">
          <Button asChild variant="outline" className="w-full md:w-auto rounded-xl px-8 h-12 text-base font-bold">
            <Link to="/collection">VIEW ALL PRODUCTS</Link>
          </Button>
        </div>
      </section>

      {/* Custom Lab Teaser - Mobile Optimized */}
      <section className="relative bg-foreground text-background py-12 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-20 items-center">
            <ScrollReveal variant="slide-in" className="order-2 md:order-1 relative group">
              <div className="absolute -inset-4 bg-jager-red/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src={customLabTeaser}
                alt="Custom Lab"
                className="w-full aspect-[4/5] md:aspect-[4/3] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 relative z-10 rounded-xl md:rounded-none"
              />
            </ScrollReveal>
            <ScrollReveal className="text-center md:text-left space-y-4 md:space-y-8 order-1 md:order-2">
              <span className="text-sm font-bold text-jager-red uppercase tracking-widest">Jäger Bulk & Team Orders</span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold uppercase tracking-tighter leading-[0.95]">
                YOUR TEAM.<br />OUR QUALITY.
              </h2>
              <p className="text-base md:text-xl font-body text-background/80 max-w-md mx-auto md:mx-0 leading-relaxed">
                Custom jerseys, uniforms & merch for teams, colleges, corporates and events. Free design mockup, names & numbers included, delivered in 5–10 days.
              </p>
              <Button asChild variant="jagerRed" size="xl" className="w-full md:w-auto min-w-[200px] h-12 md:h-14 text-base tracking-widest rounded-xl md:rounded-full">
                <Link to="/bulk-orders">GET A QUOTE</Link>
              </Button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
