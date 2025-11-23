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
  const imageSrc = Array.isArray(image) ? (image[0] || '/placeholder.svg') : (image || '/placeholder.svg');

  return (
    <Link to={`/product/${id}`} className="group block">
      <div className="relative bg-grey-bg overflow-hidden product-card-hover">
        {isNew && (
          <div className="absolute top-4 left-4 bg-jager-red text-background px-3 py-1 z-10">
            <span className="text-xs font-heading font-bold uppercase tracking-wide">NEW</span>
          </div>
        )}
        <img 
          src={imageSrc} 
          alt={name} 
          className="w-full aspect-[4/5] object-cover"
        />
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
