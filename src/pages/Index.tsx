import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  // Mock product data
  const products = [
    {
      id: "1",
      name: "URBAN HOODIE",
      price: 89,
      originalPrice: 120,
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop",
      secondaryImage: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1000&fit=crop",
      isNew: true,
      lowStock: true,
    },
    {
      id: "2",
      name: "STREET TSHIRT",
      price: 45,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop",
      secondaryImage: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop",
      isNew: true,
    },
    {
      id: "3",
      name: "OVERSIZED TEE",
      price: 55,
      originalPrice: 75,
      image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=1000&fit=crop",
      isNew: false,
    },
    {
      id: "4",
      name: "CARGO PANTS",
      price: 110,
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop",
      isNew: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&h=1080&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative z-10 text-center text-white space-y-8">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading tracking-wider">
            CHASE. CONQUER. CREATE.
          </h1>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 btn-press text-base px-8"
            >
              <Link to="/collection">SHOP THE DROP</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-background text-background bg-transparent hover:bg-background hover:text-foreground btn-press text-base px-8"
            >
              <Link to="/custom-lab">ENTER CUSTOM LAB</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading mb-12 text-center">NEW ARRIVALS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* The Lab Teaser */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="aspect-square bg-muted">
              <img
                src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=800&fit=crop"
                alt="Blank Hoodie"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-6 p-8">
              <h2 className="text-4xl md:text-5xl font-heading">YOUR VISION. OUR QUALITY.</h2>
              <p className="text-lg">
                Upload your art and instantly print it on premium streetwear. Or let our designers
                bring your ideas to life.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 btn-press"
              >
                <Link to="/custom-lab">START CREATING</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
