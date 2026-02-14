import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { optimizeCloudinaryUrl } from "@/lib/utils";

interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  actual_price?: number | null;
  discounted_price?: number | null;
  color_code?: string;
  is_default?: boolean;
  images?: string[];
  image_url?: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  basePrice: number;
  variants: ProductVariant[];
  image: string | string[] | null;
  isNew?: boolean;
  isOutOfStock?: boolean;
}

export const ProductCard = ({ id, name, basePrice, variants = [], image, isNew, isOutOfStock }: ProductCardProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Find explicitly set default variant
  const defaultVariant = useMemo(() => {
    if (!variants) return null;
    return variants.find(v => v.is_default === true);
  }, [variants]);

  // Determine display price: prioritize default variant, fallback to basePrice
  const displayPrice = useMemo(() => {
    if (defaultVariant) {
      if (defaultVariant.discounted_price) return Number(defaultVariant.discounted_price);
      if (defaultVariant.actual_price) return Number(defaultVariant.actual_price);
    }
    return basePrice;
  }, [defaultVariant, basePrice]);

  // Count unique colors for "Available in X more colors" text
  const uniqueColorCount = useMemo(() => {
    if (!variants) return 0;
    const colors = new Set(variants.map(v => v.color));
    return colors.size;
  }, [variants]);

  const additionalColorCount = uniqueColorCount - 1;

  // Handle image - can be string (local import) or array (Supabase) or null
  const images = Array.isArray(image) ? image : (image ? [image] : []);
  const mainImage = previewImage || images[0] || '/placeholder.svg';
  const hoverImage = images[1] || mainImage;

  return (
    <div className="group block space-y-2">
      <div className="relative aspect-[3/4] bg-white overflow-hidden">
        <Link to={`/product/${id}`} className={isOutOfStock ? "pointer-events-none" : ""}>
          {/* Main Image */}
          <div className={`w-full h-full transition-all duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
            <img
              src={optimizeCloudinaryUrl(mainImage, 600)}
              alt={name}
              loading="lazy"
              className={`w-full h-full object-contain transition-opacity duration-700 ${!previewImage && images.length > 1 && !isOutOfStock ? 'group-hover:opacity-0' : ''}`}
            />
            {/* Hover Image - Only show if not out of stock and NOT previewing a specific color */}
            {!previewImage && images.length > 1 && !isOutOfStock && (
              <img
                src={optimizeCloudinaryUrl(hoverImage, 600)}
                alt={`${name} hover`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              />
            )}
          </div>
        </Link>

        {/* ... (OOS and New badges remain same) ... */}
        {/* Out of Stock Overlay/Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-black/70 px-4 py-2 transform -rotate-12">
              <span className="text-white font-heading font-bold uppercase tracking-widest text-sm">
                SOLD OUT
              </span>
            </div>
          </div>
        )}

        {/* Badges */}
        {isNew && !isOutOfStock && (
          <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm px-2 py-1 z-10">
            <span className="text-[10px] font-heading font-bold uppercase tracking-widest">NEW</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <Link to={`/product/${id}`} className="block">
          <h3 className={`text-xs font-heading font-bold uppercase tracking-wide text-foreground truncate ${isOutOfStock ? 'text-muted-foreground' : ''}`}>
            {name}
          </h3>


          {/* Color availability - Visual Circles */}
          {!isOutOfStock && uniqueColorCount > 1 && (
            <div className="flex items-center mt-2 -space-x-2 overflow-hidden pl-1 py-1" onMouseLeave={() => setPreviewImage(null)}>
              {Array.from(new Set(variants.filter(v => v.stock > 0).map(v => JSON.stringify({ color: v.color, code: v.color_code }))))
                .map(s => JSON.parse(s))
                .slice(0, 4) // Show up to 4 colors
                .map((variantColor: any, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-white ring-1 ring-black/10 flex-shrink-0 cursor-pointer hover:scale-125 hover:z-10 transition-transform duration-200"
                    style={{
                      backgroundColor: variantColor.code || (variantColor.color.toUpperCase() === 'WHITE' ? '#ffffff' : (variantColor.color.toUpperCase() === 'BLACK' ? '#000000' : variantColor.color.toLowerCase()))
                    }}
                    title={variantColor.color}
                    onMouseEnter={() => {
                      // Find variant with this color and get its image
                      const variant = variants.find(v => v.color === variantColor.color && v.stock > 0);
                      if (variant) {
                        const vImage = variant.images?.[0] || variant.image_url;
                        if (vImage) setPreviewImage(vImage);
                      }
                    }}
                  />
                ))}
              {uniqueColorCount > 4 && (
                <div className="w-4 h-4 rounded-full border border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 ring-1 ring-black/10 z-10">
                  +{uniqueColorCount - 4}
                </div>
              )}
            </div>
          )}

          <p className={`text-xs font-body font-bold mt-1 ${isOutOfStock ? 'text-muted-foreground' : 'text-foreground'}`}>
            ₹{(displayPrice || 0).toLocaleString()}
          </p>
        </Link>
      </div>
    </div>
  );
};


