import { Link } from "react-router-dom";
import { Plus, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { optimizeCloudinaryUrl } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string | string[] | null;
  isNew?: boolean;
  isOutOfStock?: boolean;
}

export const ProductCard = ({ id, name, price, image, isNew, isOutOfStock }: ProductCardProps) => {
  // Handle image - can be string (local import) or array (Supabase) or null
  const images = Array.isArray(image) ? image : (image ? [image] : []);
  const mainImage = images[0] || '/placeholder.svg';
  const hoverImage = images[1] || mainImage;

  return (
    <div className="group block space-y-3">
      <div className="relative aspect-[3/4] bg-white overflow-hidden">
        <Link to={`/product/${id}`} className={isOutOfStock ? "pointer-events-none" : ""}>
          {/* Main Image */}
          <div className={`w-full h-full transition-all duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
            <img
              src={optimizeCloudinaryUrl(mainImage, 600)}
              alt={name}
              loading="lazy"
              className={`w-full h-full object-cover transition-opacity duration-700 ${images.length > 1 && !isOutOfStock ? 'group-hover:opacity-0' : ''}`}
            />
            {/* Hover Image - Only show if not out of stock */}
            {images.length > 1 && !isOutOfStock && (
              <img
                src={optimizeCloudinaryUrl(hoverImage, 600)}
                alt={`${name} hover`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              />
            )}
          </div>
        </Link>

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

        {/* Badges - Hide New badge if out of stock to reduce clutter, or keep it. Keeping it above OOS overlay could work too. */}
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
          <p className={`text-xs font-body font-bold ${isOutOfStock ? 'text-muted-foreground decoration-slate-400' : 'text-foreground'}`}>
            ₹{price.toLocaleString()}
          </p>
        </Link>
      </div>
    </div>
  );
};
