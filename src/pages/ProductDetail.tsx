import { useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImage, setMainImage] = useState(0);

  // Mock product data
  const product = {
    id,
    name: "URBAN HOODIE",
    price: 89,
    originalPrice: 120,
    description:
      "Premium heavyweight cotton hoodie with aggressive minimalist design. Perfect for urban environments.",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&h=1600&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&h=1600&fit=crop",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&h=1600&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    lowStock: true,
    stockCount: 3,
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    toast.success(`Added ${product.name} (${selectedSize}) to cart`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-[3/4] bg-secondary">
                <img
                  src={product.images[mainImage]}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setMainImage(index)}
                    className={`aspect-square bg-secondary border-2 transition-colors ${
                      mainImage === index ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-heading mb-4">{product.name}</h1>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold">${product.price}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                      <span className="bg-accent text-accent-foreground px-2 py-1 text-sm font-bold">
                        SAVE{" "}
                        {Math.round(
                          ((product.originalPrice - product.price) / product.originalPrice) * 100
                        )}
                        %
                      </span>
                    </>
                  )}
                </div>
                {product.lowStock && (
                  <p className="text-accent text-sm font-bold">
                    🔥 Low Stock: Only {product.stockCount} items left
                  </p>
                )}
              </div>

              {/* Size Selector */}
              <div>
                <h3 className="font-heading text-sm mb-3">SELECT SIZE</h3>
                <div className="grid grid-cols-4 gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`aspect-square flex items-center justify-center font-bold border-2 transition-colors btn-press ${
                        selectedSize === size
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart Button - Desktop */}
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full bg-foreground text-background hover:bg-foreground/90 btn-press text-lg py-6 hidden md:flex"
              >
                ADD TO CART
              </Button>

              {/* Accordions */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="description">
                  <AccordionTrigger className="font-heading text-sm">
                    DESCRIPTION
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {product.description}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                  <AccordionTrigger className="font-heading text-sm">SHIPPING</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Worldwide shipping available. Orders processed within 1-2 business days.
                    Delivery times vary by location.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Add to Cart - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40">
        <Button
          onClick={handleAddToCart}
          size="lg"
          className="w-full bg-foreground text-background hover:bg-foreground/90 btn-press text-lg"
        >
          ADD TO CART
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
