import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(id || "");
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Get unique sizes and colors from variants
  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    const sizes = new Set(product.variants.map(v => v.size));
    return Array.from(sizes).sort();
  }, [product?.variants]);

  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    const colors = new Set(product.variants.map(v => v.color));
    return Array.from(colors).sort();
  }, [product?.variants]);

  // Get available variants for selected size/color
  const availableVariants = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants.filter(v => {
      if (selectedSize && v.size !== selectedSize) return false;
      if (selectedColor && v.color !== selectedColor) return false;
      return v.stock > 0;
    });
  }, [product?.variants, selectedSize, selectedColor]);

  // Update selected variant when size/color changes
  useEffect(() => {
    if (availableVariants.length > 0) {
      // If no variant selected or current variant not available, select first available
      const isCurrentVariantAvailable = selectedVariant && availableVariants.find(v => v.id === selectedVariant);
      if (!isCurrentVariantAvailable) {
        setSelectedVariant(availableVariants[0].id);
      }
    }
  }, [availableVariants, selectedVariant]);

  const currentVariant = product?.variants.find(v => v.id === selectedVariant);
  const finalPrice = currentVariant 
    ? Number(product?.base_price) + Number(currentVariant.price_modifier)
    : Number(product?.base_price || 0);

  const images = product?.images || [];
  const mainImage = Array.isArray(images) ? images[selectedImageIndex] || images[0] : images || "/placeholder.svg";

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!selectedSize || !selectedColor) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }

    if (!currentVariant || currentVariant.stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }
    
    const imageUrl = Array.isArray(images) ? images[0] : images || "/placeholder.svg";
    
    addItem({
      id: currentVariant.id, // Use variant ID for unique cart items
      variant_id: currentVariant.id, // Include variant_id for Supabase sync
      name: `${product.name} - ${selectedSize} - ${selectedColor}`,
      price: finalPrice,
      image: imageUrl,
      size: selectedSize,
    });
    
    toast.success("Added to cart!", {
      description: `${product.name} - ${selectedSize} - ${selectedColor}`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-grey-text">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="bg-grey-bg aspect-[4/5] overflow-hidden">
              <img 
                src={mainImage} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
                {Array.isArray(images) && images.slice(0, 4).map((img, i) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`bg-grey-bg aspect-square cursor-pointer hover:ring-2 hover:ring-jager-red transition-all ${
                      selectedImageIndex === i ? 'ring-2 ring-jager-red' : ''
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 md:sticky md:top-24 md:h-fit">
            <div>
              <h1 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">₹{finalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Low Stock Warning */}
            {currentVariant && currentVariant.stock > 0 && currentVariant.stock <= 5 && (
            <div className="bg-jager-red/10 border border-jager-red px-4 py-3">
              <p className="text-sm font-body text-jager-red">
                  🔥 Low Stock: Only {currentVariant.stock} items left
              </p>
            </div>
            )}

            {/* Color Selector */}
            {availableColors.length > 0 && (
              <div>
                <label className="text-sm font-heading font-bold uppercase mb-3 block">SELECT COLOR</label>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => {
                    const colorMap: Record<string, string> = {
                      BLACK: "bg-foreground",
                      WHITE: "bg-background border-2 border-foreground",
                      GREY: "bg-grey-bg",
                    };
                    const bgClass = colorMap[color.toUpperCase()] || "bg-foreground";
                    return (
                      <button
                        key={color}
                onClick={() => {
                  setSelectedColor(color);
                  setSizeError(false);
                  // Find variant with this color and current size (or first available)
                  const variant = product.variants.find(v => 
                    v.color === color && v.stock > 0 && (!selectedSize || v.size === selectedSize)
                  ) || product.variants.find(v => v.color === color && v.stock > 0);
                  if (variant) {
                    setSelectedVariant(variant.id);
                    if (!selectedSize) setSelectedSize(variant.size);
                  }
                }}
                        className={`w-10 h-10 ${bgClass} hover:ring-2 hover:ring-jager-red transition-all ${
                          selectedColor === color ? 'ring-2 ring-jager-red' : ''
                        }`}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-heading font-bold uppercase">SELECT SIZE</label>
                <button className="text-sm font-body text-grey-text hover:text-foreground underline">
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {availableSizes.map((size) => {
                  const variantForSize = product.variants.find(v => 
                    v.size === size && (!selectedColor || v.color === selectedColor)
                  );
                  const isInStock = variantForSize && variantForSize.stock > 0;
                  
                  return (
                  <button
                    key={size}
                    onClick={() => {
                        if (!isInStock) return;
                      setSelectedSize(size);
                      setSizeError(false);
                        if (variantForSize) setSelectedVariant(variantForSize.id);
                    }}
                      disabled={!isInStock}
                    className={`
                      h-12 border-2 font-heading font-bold uppercase text-sm transition-all
                        ${!isInStock 
                          ? 'opacity-50 cursor-not-allowed'
                          : selectedSize === size
                        ? 'bg-foreground text-background border-foreground' 
                        : 'bg-background text-foreground border-foreground hover:bg-foreground hover:text-background'
                      }
                        ${sizeError && !selectedSize ? 'animate-pulse border-jager-red' : ''}
                    `}
                  >
                    {size}
                  </button>
                  );
                })}
              </div>
              {sizeError && (
                <p className="text-sm text-jager-red mt-2 font-body">Please select a size and color</p>
              )}
              {!currentVariant && selectedSize && selectedColor && (
                <p className="text-sm text-jager-red mt-2 font-body">This combination is out of stock</p>
              )}
            </div>

            {/* Add to Cart - Mobile Sticky */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground z-50">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
                disabled={!currentVariant || currentVariant.stock <= 0}
              >
                {!currentVariant || currentVariant.stock <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
              </Button>
            </div>

            {/* Add to Cart - Desktop */}
            <div className="hidden md:block">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
                disabled={!currentVariant || currentVariant.stock <= 0}
              >
                {!currentVariant || currentVariant.stock <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
              </Button>
            </div>

            {/* Details Accordion */}
            <Accordion type="single" collapsible className="border-t border-foreground">
              <AccordionItem value="description" className="border-b border-foreground">
                <AccordionTrigger className="text-sm font-heading font-bold uppercase hover:text-jager-red">
                  Description
                </AccordionTrigger>
                <AccordionContent className="text-sm font-body text-grey-text">
                  {product.description || "Premium quality product from Jager Clothing."}
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
