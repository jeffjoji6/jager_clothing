import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

const Collection = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("FEATURED");
  const { data: products, isLoading, error } = useProducts();

  // Derive unique categories from products
  const availableCategories = useMemo(() => {
    if (!products || products.length === 0) return ["ALL"];

    const categories = new Set<string>();
    categories.add("ALL");

    // Add dynamic categories from products ONLY
    products.forEach(p => {
      if (p.category) {
        categories.add(p.category.trim().replace('_', ' ').toUpperCase());
      }
    });

    // If we want default categories to show up regardless of products, we'd add them here.
    // But user requested: "if the category not found in the list dont show in the main page"
    // So we ONLY add what's in the products.

    return Array.from(categories);
  }, [products]);

  // Derive unique colors from products
  const availableColors = useMemo(() => {
    if (!products || products.length === 0) return [];

    const colorMap = new Map<string, string>(); // name -> code

    // Add default colors just in case? Or rely on products.
    // Let's rely on products to show only what's available.

    products.forEach(p => {
      p.variants.forEach(v => {
        if (!colorMap.has(v.color.toUpperCase())) {
          colorMap.set(v.color.toUpperCase(), v.color_code || '');
        } else if (v.color_code && !colorMap.get(v.color.toUpperCase())) {
          colorMap.set(v.color.toUpperCase(), v.color_code);
        }
      });
    });

    return Array.from(colorMap.keys()).sort().map(name => ({
      name,
      code: colorMap.get(name)
    }));
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((p) => p.category?.trim().toUpperCase() === selectedCategory);
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
      <Helmet>
        <title>Shop Collection | Jager Clothing - Premium Streetwear</title>
        <meta name="description" content="Browse the full Jager Clothing collection. Premium streetwear tees, hoodies, and custom apparel. Filter by category, size, and color." />
        <link rel="canonical" href="https://www.jagerclothing.in/collection" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-5xl font-heading font-bold uppercase tracking-tight">
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
                <SheetContent side="left" className="w-[85vw] sm:w-[400px] overflow-y-auto bg-background/80 backdrop-blur-xl border-r border-white/10">
                  <div className="py-6">
                    <h3 className="text-xl font-heading font-bold uppercase mb-8">FILTERS</h3>
                    <FilterContent
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      selectedSizes={selectedSizes}
                      setSelectedSizes={setSelectedSizes}
                      selectedColors={selectedColors}
                      setSelectedColors={setSelectedColors}

                      availableCategories={availableCategories}
                      availableColors={availableColors}
                    />
                    <div className="mt-8 pt-6 border-t border-border">
                      <Button className="w-full" onClick={() => setFilterOpen(false)}>
                        SHOW RESULTS
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Desktop: Sidebar Filters */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              <div className="p-6 rounded-lg bg-black/5 backdrop-blur-sm border border-black/5">
                <FilterContent
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedSizes={selectedSizes}
                  setSelectedSizes={setSelectedSizes}
                  selectedColors={selectedColors}
                  setSelectedColors={setSelectedColors}

                  availableCategories={availableCategories}
                  availableColors={availableColors}
                />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="md:col-span-3">
            <ScrollReveal>
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
            </ScrollReveal>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
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
                {filteredProducts.map((product, index) => {
                  // Calculate if product is out of stock based on active filters
                  const isOutOfStock = product.variants
                    .filter(v => {
                      const matchesColor = selectedColors.length === 0 || selectedColors.includes(v.color.toUpperCase());
                      const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(v.size);
                      return matchesColor && matchesSize;
                    })
                    .every(v => v.stock <= 0);

                  return (
                    <ScrollReveal key={product.id} delay={index * 0.05} variant="fade-up">
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        basePrice={Number(product.base_price || 0)}
                        variants={product.variants}
                        image={product.images}
                        isNew={product.is_new}
                        isOutOfStock={isOutOfStock}
                      />
                    </ScrollReveal>
                  );
                })}
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
  availableCategories,
  availableColors,
}: {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[] | ((prev: string[]) => string[])) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[] | ((prev: string[]) => string[])) => void;
  availableCategories: string[];
  availableColors: { name: string; code?: string }[];
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
          {availableCategories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat}
                onChange={() => setSelectedCategory(cat)}
                className="w-4 h-4 border-2 border-foreground accent-jager-red"
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
                className="w-4 h-4 border-2 border-foreground accent-jager-red"
              />
              <span className="text-sm font-body group-hover:text-jager-red transition-colors">{size}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-heading font-bold uppercase mb-4">COLOR</h4>
        <div className="flex flex-wrap gap-3">
          {availableColors.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                if (selectedColors.includes(color.name)) {
                  setSelectedColors(selectedColors.filter(c => c !== color.name));
                } else {
                  setSelectedColors([...selectedColors, color.name]);
                }
              }}
              className={`w-8 h-8 rounded-full border border-jager-red transition-all hover:scale-110 ${selectedColors.includes(color.name) ? 'ring-2 ring-jager-red ring-offset-2' : ''
                }`}
              style={{ backgroundColor: color.code || (color.name === 'WHITE' ? '#fff' : (color.name === 'BLACK' ? '#000' : color.name.toLowerCase())) }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collection;
