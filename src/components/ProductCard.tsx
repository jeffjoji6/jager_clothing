import { Link } from "react-router-dom";

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
    <Link to={`/product/${id}`} className="group block">
      <div className="relative bg-grey-bg overflow-hidden product-card-hover aspect-[4/5]">
        {isNew && (
          <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-jager-red text-background px-2 py-0.5 md:px-3 md:py-1 z-10">
            <span className="text-[10px] md:text-xs font-heading font-bold uppercase tracking-wide">NEW</span>
          </div>
        )}
        {/* Main Image */}
        <img
          src={mainImage}
          alt={name}
          className={`w-full h-full object-cover transition-opacity duration-500 ${images.length > 1 ? 'group-hover:opacity-0' : ''}`}
        />
        {/* Hover Image */}
        {images.length > 1 && (
          <img
            src={hoverImage}
            alt={`${name} hover`}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}
      </div>
      <div className="mt-2 md:mt-4 space-y-1">
        <h3 className="text-xs md:text-sm font-heading font-bold uppercase tracking-wide group-hover:text-jager-red transition-colors line-clamp-2">
          {name}
        </h3>
        <p className="text-sm md:text-base font-body font-bold">₹{price.toLocaleString()}</p>
      </div>
    </Link>
  );
};
