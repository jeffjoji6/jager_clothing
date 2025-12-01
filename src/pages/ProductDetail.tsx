import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Loader2, Minus, Plus, Heart, Truck, ShieldCheck, Zap, Eye, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(id || "");
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);

  // Mock data for social proof
  const viewersCount = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
  const stockLeft = Math.floor(Math.random() * (5 - 1 + 1)) + 1;

  // Get unique sizes and colors
  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    const sizes = new Set(product.variants.map(v => v.size));
    const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    return Array.from(sizes).sort((a, b) => {
      return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    });
  }, [product?.variants]);

  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    const colors = new Set(product.variants.map(v => v.color));
    return Array.from(colors).sort();
  }, [product?.variants]);

  // Get available variants
  const availableVariants = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants.filter(v => {
      if (selectedSize && v.size !== selectedSize) return false;
      if (selectedColor && v.color !== selectedColor) return false;
      return v.stock > 0;
    });
  }, [product?.variants, selectedSize, selectedColor]);

  // Auto-select variant
  useEffect(() => {
    if (availableVariants.length > 0) {
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

  // Fake original price for discount display
  const originalPrice = finalPrice * 1.4;

  const images = product?.images || [];
  const mainImage = Array.isArray(images) ? images[selectedImageIndex] || images[0] : images || "/placeholder.svg";

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize || !selectedColor) {
      setSizeError(true);
      toast.error("Please select a size and color");
      return;
    }

    if (!currentVariant || currentVariant.stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }

    const imageUrl = Array.isArray(images) ? images[0] : images || "/placeholder.svg";

    addItem({
      id: currentVariant.id,
      variant_id: currentVariant.id,
      name: `${product.name} - ${selectedSize} - ${selectedColor}`,
      price: finalPrice,
      image: imageUrl,
      size: selectedSize,
      quantity: quantity
    });

    toast.success("Added to cart!");
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!selectedSize || !selectedColor) {
      setSizeError(true);
      toast.error("Please select a size and color");
      return;
    }

    if (!currentVariant || currentVariant.stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }

    const imageUrl = Array.isArray(images) ? images[0] : images || "/placeholder.svg";

    await addItem({
      id: currentVariant.id,
      variant_id: currentVariant.id,
      name: `${product.name} - ${selectedSize} - ${selectedColor}`,
      price: finalPrice,
      image: imageUrl,
      size: selectedSize,
      quantity: quantity
    });

    navigate("/checkout");
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
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-grey-text">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16">

          {/* Left Column: Gallery */}
          <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            {Array.isArray(images) && images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:h-[600px] scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative flex-shrink-0 w-20 h-24 md:w-20 md:h-24 border transition-all ${selectedImageIndex === i ? 'border-foreground' : 'border-transparent hover:border-gray-300'
                      }`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 bg-grey-bg aspect-[3/4] md:aspect-[4/5] md:h-[700px] relative group overflow-hidden">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="md:col-span-5 space-y-6 md:space-y-8 md:sticky md:top-24 md:h-fit">

            {/* Title & Price */}
            <div className="space-y-3 md:space-y-4 border-b border-foreground/10 pb-6 md:pb-8">
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-heading font-black uppercase tracking-tighter leading-tight md:leading-[0.9]">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <span className="text-xl md:text-2xl font-bold font-heading">₹{finalPrice.toLocaleString()}</span>
                <span className="text-base md:text-lg text-muted-foreground line-through font-body">₹{originalPrice.toLocaleString()}</span>
                <span className="bg-jager-red text-white text-xs font-bold px-2 py-1 uppercase tracking-wider">
                  Save 30%
                </span>
              </div>
            </div>

            {/* Urgency & Social Proof - Refined */}
            {/* <div className="space-y-4">
              <div className="flex items-center gap-2 text-jager-red font-bold uppercase text-xs tracking-widest animate-pulse">
                <Zap className="w-4 h-4 fill-current" />
                Selling Fast • Only {stockLeft} left
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Eye className="w-4 h-4" />
                <span>{viewersCount} people viewing</span>
              </div>
            </div> */}

            {/* Selectors */}
            <div className="space-y-6 md:space-y-8">

              {/* Color */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color: <span className="text-foreground">{selectedColor || 'Select'}</span></span>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 border transition-all ${selectedColor === color ? 'border-foreground ring-1 ring-foreground ring-offset-2' : 'border-border hover:border-foreground'
                          }`}
                        style={{ backgroundColor: color.toLowerCase() === 'white' ? '#fff' : color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Size: <span className="text-foreground">{selectedSize || 'Select'}</span></span>
                  <button className="text-xs underline text-muted-foreground hover:text-foreground uppercase tracking-wide">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={`w-12 h-12 flex items-center justify-center text-sm font-bold transition-all border ${selectedSize === size
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background text-foreground border-border hover:border-foreground'
                        } ${sizeError ? 'border-jager-red animate-shake' : ''}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quantity</span>
                <div className="flex items-center border border-foreground/20 h-12 px-4 gap-4 w-32 justify-between">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="hover:text-jager-red transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold font-heading">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="hover:text-jager-red transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-row gap-3 pt-4 border-t border-foreground/10">
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1 h-12 md:h-14 text-xs md:text-base tracking-widest px-2"
                  onClick={handleAddToCart}
                >
                  ADD TO CART
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 md:h-14 text-xs md:text-base font-bold uppercase tracking-widest border-foreground hover:bg-foreground hover:text-background transition-colors px-2"
                  onClick={handleBuyNow}
                >
                  BUY IT NOW
                </Button>
              </div>
            </div>

            {/* Features - Minimalist */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 py-4 md:py-6 border-t border-foreground/10">
              <div className="flex items-start gap-2 md:gap-3">
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-foreground shrink-0" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-muted-foreground leading-tight">Premium Quality</span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <Truck className="w-4 h-4 md:w-5 md:h-5 text-foreground shrink-0" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-muted-foreground leading-tight">Express Shipping</span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-foreground shrink-0" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-muted-foreground leading-tight">Secure Checkout</span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-foreground shrink-0" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-muted-foreground leading-tight">Made with Love</span>
              </div>
            </div>

            {/* Accordions - Clean */}
            <Accordion type="single" collapsible className="w-full border-t border-foreground/10">
              <AccordionItem value="description" className="border-b border-foreground/10">
                <AccordionTrigger className="font-heading font-bold uppercase tracking-wider text-sm hover:text-jager-red">
                  Description
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body leading-relaxed">
                  {product.description || "Premium quality product from Jager Clothing. Designed for the modern streetwear enthusiast."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-b border-foreground/10">
                <AccordionTrigger className="font-heading font-bold uppercase tracking-wider text-sm hover:text-jager-red">
                  Shipping & Returns
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body leading-relaxed">
                  <ul className="list-disc pl-4 space-y-2 text-sm">
                    <li>Free shipping across India  </li>

                    <li>Delivery in 3-5 business days across India</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="care" className="border-b border-foreground/10">
                <AccordionTrigger className="font-heading font-bold uppercase tracking-wider text-sm hover:text-jager-red">
                  Fabric Care
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body leading-relaxed">
                  <ul className="list-disc pl-4 space-y-2 text-sm">
                    <li>Cold wash only with similar colors</li>
                    <li>Do not iron directly on prints</li>
                    <li>Tumble dry low or hang dry</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
