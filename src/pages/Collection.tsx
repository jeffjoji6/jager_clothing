import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";

const Collection = () => {
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
    {
      id: "5",
      name: "GRAPHIC TEE",
      price: 50,
      originalPrice: 65,
      image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=1000&fit=crop",
      isNew: false,
    },
    {
      id: "6",
      name: "ZIP HOODIE",
      price: 95,
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop",
      isNew: true,
    },
    {
      id: "7",
      name: "BOMBER JACKET",
      price: 145,
      originalPrice: 200,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop",
      isNew: false,
      lowStock: true,
    },
    {
      id: "8",
      name: "TRACK PANTS",
      price: 85,
      image: "https://images.unsplash.com/photo-1622445275576-721325763afe?w=800&h=1000&fit=crop",
      isNew: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-heading mb-4 text-center">THE COLLECTION</h1>
          <p className="text-center text-muted-foreground mb-12">
            Aggressive minimalism meets street culture
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Collection;
