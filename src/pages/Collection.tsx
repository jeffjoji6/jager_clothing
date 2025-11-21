import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import productHoodie from "@/assets/product-hoodie-black.jpg";
import productTee from "@/assets/product-tee-white.jpg";
import productCargo from "@/assets/product-cargo-black.jpg";

const ALL_PRODUCTS = [
  { id: "1", name: "OVERSIZED HOODIE - BLACK", price: 1999, image: productHoodie, isNew: true },
  { id: "2", name: "ESSENTIAL TEE - WHITE", price: 799, image: productTee, isNew: false },
  { id: "3", name: "CARGO PANTS - BLACK", price: 2499, image: productCargo, isNew: true },
  { id: "4", name: "OVERSIZED HOODIE - WHITE", price: 1999, image: productHoodie, isNew: false },
  { id: "5", name: "ESSENTIAL TEE - BLACK", price: 799, image: productTee, isNew: false },
  { id: "6", name: "CARGO PANTS - GREY", price: 2499, image: productCargo, isNew: false },
  { id: "7", name: "OVERSIZED HOODIE - GREY", price: 1999, image: productHoodie, isNew: true },
  { id: "8", name: "ESSENTIAL TEE - GREY", price: 799, image: productTee, isNew: false },
];

const Collection = () => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight">
            COLLECTION
          </h1>
          
          {/* Mobile: Filter Button */}
          <div className="md:hidden">
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  FILTER
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <div className="py-6">
                  <h3 className="text-lg font-heading font-bold uppercase mb-6">FILTERS</h3>
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Desktop: Sidebar Filters */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              <FilterContent />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-grey-text font-body">
                Showing {ALL_PRODUCTS.length} products
              </p>
              <select className="text-sm font-heading uppercase border-b border-foreground bg-transparent py-1 focus:outline-none">
                <option>FEATURED</option>
                <option>PRICE: LOW TO HIGH</option>
                <option>PRICE: HIGH TO LOW</option>
                <option>NEWEST</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {ALL_PRODUCTS.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterContent = () => (
  <div className="space-y-8">
    <div>
      <h4 className="text-sm font-heading font-bold uppercase mb-4">CATEGORY</h4>
      <div className="space-y-2">
        {["ALL", "HOODIES", "TEES", "BOTTOMS"].map((cat) => (
          <label key={cat} className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 border-2 border-foreground" />
            <span className="text-sm font-body group-hover:text-jager-red transition-colors">{cat}</span>
          </label>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-sm font-heading font-bold uppercase mb-4">SIZE</h4>
      <div className="space-y-2">
        {["S", "M", "L", "XL", "XXL"].map((size) => (
          <label key={size} className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 border-2 border-foreground" />
            <span className="text-sm font-body group-hover:text-jager-red transition-colors">{size}</span>
          </label>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-sm font-heading font-bold uppercase mb-4">COLOR</h4>
      <div className="flex flex-wrap gap-3">
        {[
          { name: "BLACK", bg: "bg-foreground" },
          { name: "WHITE", bg: "bg-background border-2 border-foreground" },
          { name: "GREY", bg: "bg-grey-bg" },
        ].map((color) => (
          <button
            key={color.name}
            className={`w-8 h-8 ${color.bg} hover:ring-2 hover:ring-jager-red transition-all`}
            title={color.name}
          />
        ))}
      </div>
    </div>
  </div>
);

export default Collection;
