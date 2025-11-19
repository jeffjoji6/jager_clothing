import { useState } from "react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  secondaryImage?: string;
  isNew?: boolean;
  lowStock?: boolean;
}

export const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  secondaryImage,
  isNew,
  lowStock,
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={`/product/${id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative bg-secondary aspect-[3/4] overflow-hidden mb-4">
        {isNew && (
          <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 text-xs font-bold z-10">
            NEW
          </div>
        )}
        <img
          src={isHovered && secondaryImage ? secondaryImage : image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-heading text-sm">{name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-bold">${price}</span>
          {originalPrice && (
            <>
              <span className="text-muted-foreground line-through text-sm">${originalPrice}</span>
              <span className="text-accent text-xs font-bold">
                SAVE {Math.round(((originalPrice - price) / originalPrice) * 100)}%
              </span>
            </>
          )}
        </div>
        {lowStock && (
          <p className="text-accent text-xs font-medium">🔥 Low Stock: Only 3 items left</p>
        )}
      </div>
    </Link>
  );
};
