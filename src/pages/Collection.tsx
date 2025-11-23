import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";

const Collection = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("FEATURED");
  const { data: products, isLoading, error } = useProducts();

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((p) => p.category?.toUpperCase() === selectedCategory);
    }

    // Filter by sizes (if variants have selected sizes)
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => selectedSizes.includes(v.size))
      );
    }

    // Filter by colors (if variants have selected colors)
    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => selectedColors.includes(v.color.toUpperCase()))
      );
    }

    // Sort products
    switch (sortBy) {
      case "PRICE: LOW TO HIGH":
        filtered.sort((a, b) => Number(a.base_price) - Number(b.base_price));
        break;
      case "PRICE: HIGH TO LOW":
        filtered.sort((a, b) => Number(b.base_price) - Number(a.base_price));
        break;
      case "NEWEST":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default: // FEATURED
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    return filtered;
  }, [products, selectedCategory, selectedSizes, selectedColors, sortBy]);

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
                  <FilterContent 
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    selectedSizes={selectedSizes}
                    setSelectedSizes={setSelectedSizes}
                    selectedColors={selectedColors}
                    setSelectedColors={setSelectedColors}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Desktop: Sidebar Filters */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              <FilterContent 
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
              />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-grey-text font-body">
                {isLoading ? "Loading..." : `Showing ${filteredProducts.length} products`}
              </p>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-heading uppercase border-b border-foreground bg-transparent py-1 focus:outline-none"
              >
                <option>FEATURED</option>
                <option>PRICE: LOW TO HIGH</option>
                <option>PRICE: HIGH TO LOW</option>
                <option>NEWEST</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-grey-text">Failed to load products. Please try again later.</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-grey-text">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    id={product.id}
                    name={product.name}
                    price={Number(product.base_price)}
                    image={product.images}
                    isNew={product.is_new}
                  />
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  </div>
  );
};

const FilterContent = ({
  selectedCategory,
  setSelectedCategory,
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
}: {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[] | ((prev: string[]) => string[])) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[] | ((prev: string[]) => string[])) => void;
}) => {
  const hasActiveFilters = selectedCategory !== "ALL" || selectedSizes.length > 0 || selectedColors.length > 0;
  
  const clearFilters = () => {
    setSelectedCategory("ALL");
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  return (
  <div className="space-y-8">
    {hasActiveFilters && (
      <div>
        <button
          onClick={clearFilters}
          className="text-sm font-heading font-bold uppercase text-jager-red hover:underline"
        >
          CLEAR ALL FILTERS
        </button>
      </div>
    )}
    <div>
      <h4 className="text-sm font-heading font-bold uppercase mb-4">CATEGORY</h4>
      <div className="space-y-2">
        {["ALL", "HOODIES", "TEES", "BOTTOMS"].map((cat) => (
          <label key={cat} className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="category"
              checked={selectedCategory === cat}
              onChange={() => setSelectedCategory(cat)}
              className="w-4 h-4 border-2 border-foreground" 
            />
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
            <input 
              type="checkbox" 
              checked={selectedSizes.includes(size)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSizes([...selectedSizes, size]);
                } else {
                  setSelectedSizes(selectedSizes.filter(s => s !== size));
                }
              }}
              className="w-4 h-4 border-2 border-foreground" 
            />
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
            onClick={() => {
              if (selectedColors.includes(color.name)) {
                setSelectedColors(selectedColors.filter(c => c !== color.name));
              } else {
                setSelectedColors([...selectedColors, color.name]);
              }
            }}
            className={`w-8 h-8 ${color.bg} hover:ring-2 hover:ring-jager-red transition-all ${
              selectedColors.includes(color.name) ? 'ring-2 ring-jager-red' : ''
            }`}
            title={color.name}
          />
        ))}
      </div>
    </div>
  </div>
  );
};

export default Collection;
