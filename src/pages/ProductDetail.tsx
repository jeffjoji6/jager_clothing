import { useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import productHoodie from "@/assets/product-hoodie-black.jpg";

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeError, setSizeError] = useState(false);

  const SIZES = ["S", "M", "L", "XL", "XXL"];

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    // Add to cart logic
    console.log("Added to cart:", { id, size: selectedSize });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="bg-grey-bg aspect-[4/5] overflow-hidden">
              <img 
                src={productHoodie} 
                alt="Product" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-grey-bg aspect-square cursor-pointer hover:ring-2 hover:ring-jager-red transition-all">
                  <img src={productHoodie} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6 md:sticky md:top-24 md:h-fit">
            <div>
              <h1 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-4">
                JÄGER OVERSIZED HOODIE - BLACK
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">₹1,999</span>
                <span className="text-lg text-grey-text line-through">₹2,999</span>
                <span className="bg-jager-red text-background px-3 py-1 text-xs font-heading font-bold uppercase">
                  SAVE 30%
                </span>
              </div>
            </div>

            {/* Low Stock Warning */}
            <div className="bg-jager-red/10 border border-jager-red px-4 py-3">
              <p className="text-sm font-body text-jager-red">
                🔥 Low Stock: Only 3 items left
              </p>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-heading font-bold uppercase">SELECT SIZE</label>
                <button className="text-sm font-body text-grey-text hover:text-foreground underline">
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`
                      h-12 border-2 font-heading font-bold uppercase text-sm transition-all
                      ${selectedSize === size 
                        ? 'bg-foreground text-background border-foreground' 
                        : 'bg-background text-foreground border-foreground hover:bg-foreground hover:text-background'
                      }
                      ${sizeError ? 'animate-pulse border-jager-red' : ''}
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="text-sm text-jager-red mt-2 font-body">Please select a size</p>
              )}
            </div>

            {/* Add to Cart - Mobile Sticky */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground z-50">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
              >
                ADD TO CART
              </Button>
            </div>

            {/* Add to Cart - Desktop */}
            <div className="hidden md:block">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
              >
                ADD TO CART
              </Button>
            </div>

            {/* Details Accordion */}
            <Accordion type="single" collapsible className="border-t border-foreground">
              <AccordionItem value="description" className="border-b border-foreground">
                <AccordionTrigger className="text-sm font-heading font-bold uppercase hover:text-jager-red">
                  Description
                </AccordionTrigger>
                <AccordionContent className="text-sm font-body text-grey-text">
                  Premium 400 GSM heavyweight cotton blend. Oversized fit with dropped shoulders. 
                  Reinforced stitching. Pre-washed for minimal shrinkage.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-b border-foreground">
                <AccordionTrigger className="text-sm font-heading font-bold uppercase hover:text-jager-red">
                  Shipping & Returns
                </AccordionTrigger>
                <AccordionContent className="text-sm font-body text-grey-text">
                  Free shipping on orders above ₹2,499. 7-day easy returns. 
                  Delivery in 3-5 business days.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
      
      {/* Mobile padding for sticky button */}
      <div className="md:hidden h-24" />
    </div>
  );
};

export default ProductDetail;
