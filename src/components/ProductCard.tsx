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
          <div className="absolute top-4 left-4 bg-jager-red text-background px-3 py-1 z-10">
            <span className="text-xs font-heading font-bold uppercase tracking-wide">NEW</span>
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
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-heading font-bold uppercase tracking-wide group-hover:text-jager-red transition-colors">
          {name}
        </h3>
        <p className="text-base font-body font-bold">₹{price.toLocaleString()}</p>
      </div>
    </Link>
  );
};
