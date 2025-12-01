import { Link } from "react-router-dom";
import { Plus, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string | string[] | null;
  isNew?: boolean;
}

export const ProductCard = ({ id, name, price, image, isNew }: ProductCardProps) => {
  // Handle image - can be string (local import) or array (Supabase) or null
  const images = Array.isArray(image) ? image : (image ? [image] : []);
  const mainImage = images[0] || '/placeholder.svg';
  const hoverImage = images[1] || mainImage;

  return (
    <div className="group block space-y-3">
      <div className="relative aspect-[3/4] bg-grey-bg overflow-hidden">
        <Link to={`/product/${id}`}>
          {/* Main Image */}
          <img
            src={mainImage}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-700 ${images.length > 1 ? 'group-hover:opacity-0' : ''}`}
          />
          {/* Hover Image */}
          {images.length > 1 && (
            <img
              src={hoverImage}
              alt={`${name} hover`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            />
          )}
        </Link>

        {/* Badges */}
        {isNew && (
          <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm px-2 py-1 z-10">
            <span className="text-[10px] font-heading font-bold uppercase tracking-widest">NEW</span>
          </div>
        )}

        {/* Quick Add Button (Bottom Left) */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-2 left-2 h-8 w-8 rounded-none bg-white/90 hover:bg-white text-black shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={(e) => {
            e.preventDefault();
            // Add to cart logic would go here
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <Link to={`/product/${id}`} className="block">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wide text-foreground truncate">
            {name}
          </h3>
          <p className="text-xs font-body font-bold text-foreground">₹{price.toLocaleString()}</p>
        </Link>
      </div>
    </div>
  );
};
