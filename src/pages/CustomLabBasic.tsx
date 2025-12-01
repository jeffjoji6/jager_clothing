import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/imageUpload";
import { generateMockup, getProductMockupImage } from "@/lib/mockupGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomProductsForBasic, CustomProduct, CustomProductVariant } from "@/hooks/useCustomProducts";
import { MockupEditor, DesignPosition } from "@/components/mockup/MockupEditor";
import { getTShirtMockupImage } from "@/lib/tshirtMockups";

const SIZES = ["S", "M", "L", "XL", "XXL"];

const CustomLabBasic = () => {
  const { user } = useAuth();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string>("");
  const [backPreviewUrl, setBackPreviewUrl] = useState<string>("");
  const [frontImageUrl, setFrontImageUrl] = useState<string>(""); // Supabase URL
  const [backImageUrl, setBackImageUrl] = useState<string>(""); // Supabase URL
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [frontMockupUrl, setFrontMockupUrl] = useState<string>("");
  const [backMockupUrl, setBackMockupUrl] = useState<string>("");
  const [generatingMockup, setGeneratingMockup] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [frontDesignPosition, setFrontDesignPosition] = useState<DesignPosition | null>(null);
  const [backDesignPosition, setBackDesignPosition] = useState<DesignPosition | null>(null);
  const [activeMockupTab, setActiveMockupTab] = useState<"front" | "back">("front");

  // Fetch custom products (oversized tees) - Separate from collection
  const { data: products, isLoading: productsLoading } = useCustomProductsForBasic();

  // Fetch variants for selected custom product
  const { data: variants } = useQuery({
    queryKey: ['custom-product', selectedProduct, 'variants'],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const { data, error } = await supabase
        .from('custom_product_variants')
        .select('*')
        .eq('custom_product_id', selectedProduct);

      if (error) throw error;
      return data as CustomProductVariant[];
    },
    enabled: !!selectedProduct,
  });

  // Get all colors for the product (including out of stock)
  const allColors = useMemo(() => {
    if (!variants) return [];
    const colors = new Set<string>();
    variants.forEach(variant => {
      colors.add(variant.color);
    });
    return Array.from(colors).sort();
  }, [variants]);

  // Get color availability for selected size
  const colorAvailability = useMemo(() => {
    if (!variants || !selectedSize) return new Map<string, number>();

    const colorMap = new Map<string, number>();
    variants.forEach(variant => {
      if (variant.size === selectedSize) {
        colorMap.set(variant.color, variant.stock);
      }
    });
    return colorMap;
  }, [variants, selectedSize]);

  // Get all sizes for the product (including out of stock)
  const allSizes = useMemo(() => {
    if (!variants) return [];
    const sizes = new Set<string>();
    variants.forEach(variant => {
      sizes.add(variant.size);
    });
    return Array.from(sizes).sort((a, b) => {
      const order = ['S', 'M', 'L', 'XL', 'XXL'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [variants]);

  // Get size availability (check if ANY color has stock for that size)
  const sizeAvailability = useMemo(() => {
    if (!variants) return new Map<string, boolean>();

    const sizeMap = new Map<string, boolean>();
    allSizes.forEach(size => {
      const hasStock = variants.some(v => v.size === size && v.stock > 0);
      sizeMap.set(size, hasStock);
    });
    return sizeMap;
  }, [variants, allSizes]);

  // Get available colors based on selected size (only for filtering in UI)
  const availableColors = useMemo(() => {
    if (!selectedSize) return [];
    return allColors.filter(color => {
      const stock = colorAvailability.get(color) || 0;
      return stock > 0;
    });
  }, [allColors, colorAvailability, selectedSize]);

  // Get available colors with stock info (for compatibility)
  const availableColorsWithStock = useMemo(() => {
    if (!selectedSize) return [];
    return allColors
      .filter(color => {
        const stock = colorAvailability.get(color) || 0;
        return stock > 0;
      })
      .map(color => ({
        color,
        stock: colorAvailability.get(color) || 0,
      }));
  }, [allColors, colorAvailability, selectedSize]);

  // Auto-select first product and color when data loads
  useEffect(() => {
    if (products && products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].id);
    }
  }, [products, selectedProduct]);

  // Auto-select first available color when size changes
  useEffect(() => {
    if (selectedSize && availableColors.length > 0) {
      // Check if current color is available for selected size
      const currentColorStock = colorAvailability.get(selectedColor) || 0;
      if (currentColorStock === 0) {
        // Current color not available, select first available
        setSelectedColor(availableColors[0]);
      }
    } else if (selectedSize && availableColors.length === 0) {
      // No colors available for this size
      setSelectedColor("");
    }
  }, [selectedSize, availableColors, selectedColor, colorAvailability]);

  // Handle front design upload
  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is authenticated
    if (!user) {
      toast.error("Please login to upload designs");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingFront(true);
    try {
      const localUrl = URL.createObjectURL(file);
      setFrontPreviewUrl(localUrl);
      setFrontFile(file);

      const supabaseUrl = await uploadImage(file, 'custom-designs/front', 'product-images');
      setFrontImageUrl(supabaseUrl);
      toast.success("Front design uploaded!");
    } catch (error: any) {
      console.error("Upload error details:", error);
      toast.error(`Upload failed: ${error.message}`);
      setFrontFile(null);
      setFrontPreviewUrl("");
    } finally {
      setUploadingFront(false);
      e.target.value = '';
    }
  };

  // Handle back design upload
  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is authenticated
    if (!user) {
      toast.error("Please login to upload designs");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingBack(true);
    try {
      const localUrl = URL.createObjectURL(file);
      setBackPreviewUrl(localUrl);
      setBackFile(file);

      const supabaseUrl = await uploadImage(file, 'custom-designs/back', 'product-images');
      setBackImageUrl(supabaseUrl);
      toast.success("Back design uploaded!");
    } catch (error: any) {
      console.error("Upload error details:", error);
      toast.error(`Upload failed: ${error.message}`);
      setBackFile(null);
      setBackPreviewUrl("");
    } finally {
      setUploadingBack(false);
      e.target.value = '';
    }
  };

  // Generate front mockup when product, color, or front design changes
  useEffect(() => {
    if (frontImageUrl && selectedProduct && selectedColor) {
      generateFrontMockup();
    } else {
      setFrontMockupUrl("");
    }
  }, [frontImageUrl, selectedProduct, selectedColor]);

  // Generate back mockup when product, color, or back design changes
  useEffect(() => {
    if (backImageUrl && selectedProduct && selectedColor) {
      generateBackMockup();
    } else {
      setBackMockupUrl("");
    }
  }, [backImageUrl, selectedProduct, selectedColor]);

  // Generate mockup from editor position data
  const generateMockupFromPosition = async (position: DesignPosition, side: "front" | "back") => {
    if (!position || !selectedProduct || !selectedColor) return;

    const imageUrl = side === "front" ? frontImageUrl : backImageUrl;
    if (!imageUrl) return;

    setGeneratingMockup(true);
    try {
      const product = products?.find(p => p.id === selectedProduct);
      const baseImageUrl = product?.images?.[0] || getProductMockupImage(selectedProduct, selectedColor);

      // Use position data from editor
      const mockup = await generateMockup(imageUrl, baseImageUrl, {
        position: side === "front" ? "chest" : "back",
        scale: position.scale,
        rotation: position.rotation,
      });

      if (side === "front") {
        setFrontMockupUrl(mockup);
      } else {
        setBackMockupUrl(mockup);
      }
    } catch (error: any) {
      console.error(`${side} mockup generation error:`, error);
    } finally {
      setGeneratingMockup(false);
    }
  };

  const generateFrontMockup = async () => {
    if (frontDesignPosition) {
      await generateMockupFromPosition(frontDesignPosition, "front");
    } else if (frontImageUrl && selectedProduct && selectedColor) {
      // Fallback to default generation
      setGeneratingMockup(true);
      try {
        const product = products?.find(p => p.id === selectedProduct);
        const baseImageUrl = product?.images?.[0] || getProductMockupImage(selectedProduct, selectedColor);
        const mockup = await generateMockup(frontImageUrl, baseImageUrl, {
          position: 'chest',
          scale: 0.35,
        });
        setFrontMockupUrl(mockup);
      } catch (error: any) {
        console.error("Front mockup generation error:", error);
      } finally {
        setGeneratingMockup(false);
      }
    }
  };

  const generateBackMockup = async () => {
    if (backDesignPosition) {
      await generateMockupFromPosition(backDesignPosition, "back");
    } else if (backImageUrl && selectedProduct && selectedColor) {
      // Fallback to default generation
      setGeneratingMockup(true);
      try {
        const product = products?.find(p => p.id === selectedProduct);
        const baseImageUrl = product?.images?.[0] || getProductMockupImage(selectedProduct, selectedColor);
        const mockup = await generateMockup(backImageUrl, baseImageUrl, {
          position: 'back',
          scale: 0.35,
        });
        setBackMockupUrl(mockup);
      } catch (error: any) {
        console.error("Back mockup generation error:", error);
      } finally {
        setGeneratingMockup(false);
      }
    }
  };

  // Create custom order submission
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please login to place an order");
      }

      // Find selected variant (from custom_product_variants)
      const variant = variants?.find(
        v => v.size === selectedSize && v.color === selectedColor
      );

      if (!variant || variant.stock < quantity) {
        throw new Error("Selected variant is out of stock");
      }

      // Create basic custom request with front and back images
      const { data, error } = await supabase
        .from('jager_basic_requests')
        .insert({
          user_id: user.id,
          name: user.email?.split('@')[0] || 'Customer',
          quantity: quantity,
          uploaded_image_url: frontImageUrl || backImageUrl, // Primary image
          notes: JSON.stringify({
            front_image: frontImageUrl,
            back_image: backImageUrl,
            front_position: frontDesignPosition,
            back_position: backDesignPosition,
            custom_product_id: selectedProduct,
            size: selectedSize,
            color: selectedColor,
            variant_id: variant?.id,
          }),
          status: 'new',
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      toast.success("Order submitted!", {
        description: "You'll receive a mockup confirmation within 24 hours.",
      });
      // Reset form
      setFrontFile(null);
      setBackFile(null);
      setFrontPreviewUrl("");
      setBackPreviewUrl("");
      setFrontImageUrl("");
      setBackImageUrl("");
      setSelectedProduct("");
      setSelectedSize("");
      setSelectedColor("");
      setQuantity(1);
      setFrontMockupUrl("");
      setBackMockupUrl("");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontImageUrl && !backImageUrl) {
      toast.error("Please upload at least one design (front or back)");
      return;
    }

    if (!selectedProduct || !selectedSize || !selectedColor) {
      toast.error("Please select product, size, and color");
      return;
    }

    if (!user) {
      toast.error("Please login to place an order");
      return;
    }

    createOrderMutation.mutate();
  };

  const selectedProductData = products?.find(p => p.id === selectedProduct);
  const selectedVariant = variants?.find(
    v => v.size === selectedSize && v.color === selectedColor
  );

  const finalPrice = selectedVariant?.actual_price || selectedVariant?.discounted_price || selectedProductData?.discounted_price || selectedProductData?.base_price || 0;
  const totalPrice = finalPrice * quantity;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tight mb-4">
              JÄGER BASIC
            </h1>
            <p className="text-lg font-body text-grey-text">
              Upload your design and see instant mockups. Choose from available colors based on stock.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Upload & Mockup */}
            <div className="space-y-6">
              {/* Front Design Upload */}
              <div>
                <Label className="text-lg font-heading uppercase mb-4 block">
                  Front Design (Optional)
                </Label>
                <div className="border-2 border-dashed border-foreground p-6 text-center">
                  {frontPreviewUrl ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={frontPreviewUrl}
                          alt="Front Design"
                          className="max-h-40 mx-auto rounded"
                        />
                        {uploadingFront && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Loader2 className="h-6 w-6 animate-spin text-jager-red" />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFrontFile(null);
                          setFrontPreviewUrl("");
                          setFrontImageUrl("");
                          setFrontMockupUrl("");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFrontUpload}
                        className="hidden"
                        disabled={uploadingFront}
                      />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-grey-text" />
                      <p className="font-heading uppercase text-sm font-bold mb-1">
                        {uploadingFront ? "Uploading..." : "Upload Front"}
                      </p>
                      <p className="text-xs font-body text-grey-text">
                        PNG, JPG, SVG (Max 10MB)
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Back Design Upload */}
              <div>
                <Label className="text-lg font-heading uppercase mb-4 block">
                  Back Design (Optional)
                </Label>
                <div className="border-2 border-dashed border-foreground p-6 text-center">
                  {backPreviewUrl ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={backPreviewUrl}
                          alt="Back Design"
                          className="max-h-40 mx-auto rounded"
                        />
                        {uploadingBack && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Loader2 className="h-6 w-6 animate-spin text-jager-red" />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBackFile(null);
                          setBackPreviewUrl("");
                          setBackImageUrl("");
                          setBackMockupUrl("");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackUpload}
                        className="hidden"
                        disabled={uploadingBack}
                      />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-grey-text" />
                      <p className="font-heading uppercase text-sm font-bold mb-1">
                        {uploadingBack ? "Uploading..." : "Upload Back"}
                      </p>
                      <p className="text-xs font-body text-grey-text">
                        PNG, JPG, SVG (Max 10MB)
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Advanced Mockup Editor */}
              {(frontImageUrl || backImageUrl) && selectedProduct && selectedColor && selectedProductData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-heading uppercase">
                      Interactive Mockup Editor
                    </Label>
                    <p className="text-xs text-grey-text font-body">
                      Drag, resize & position your design
                    </p>
                  </div>

                  <Tabs
                    value={activeMockupTab}
                    onValueChange={(value) => setActiveMockupTab(value as "front" | "back")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="front" disabled={!frontImageUrl}>
                        FRONT {frontImageUrl ? "✓" : ""}
                      </TabsTrigger>
                      <TabsTrigger value="back" disabled={!backImageUrl}>
                        BACK {backImageUrl ? "✓" : ""}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="front" className="mt-4">
                      {frontImageUrl && selectedColor ? (
                        <MockupEditor
                          productImageUrl={getTShirtMockupImage(selectedColor, "front")}
                          designImageUrl={frontImageUrl}
                          side="front"
                          onDesignChange={(position) => {
                            setFrontDesignPosition(position);
                            if (position) {
                              // Auto-generate mockup when position changes
                              generateMockupFromPosition(position, "front");
                            }
                          }}
                          onExport={(imageUrl) => {
                            setFrontMockupUrl(imageUrl);
                          }}
                        />
                      ) : (
                        <div className="border-2 border-dashed border-foreground p-12 text-center rounded">
                          <p className="text-grey-text font-body">
                            {!selectedColor ? "Select a color to see mockup" : "Upload a front design to start"}
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="back" className="mt-4">
                      {backImageUrl && selectedColor ? (
                        <MockupEditor
                          productImageUrl={getTShirtMockupImage(selectedColor, "back")}
                          designImageUrl={backImageUrl}
                          side="back"
                          onDesignChange={(position) => {
                            setBackDesignPosition(position);
                            if (position) {
                              // Auto-generate mockup when position changes
                              generateMockupFromPosition(position, "back");
                            }
                          }}
                          onExport={(imageUrl) => {
                            setBackMockupUrl(imageUrl);
                          }}
                        />
                      ) : (
                        <div className="border-2 border-dashed border-foreground p-12 text-center rounded">
                          <p className="text-grey-text font-body">
                            {!selectedColor ? "Select a color to see mockup" : "Upload a back design to start"}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Right Column - Product Selection */}
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Selection */}
                <div>
                  <Label className="text-lg font-heading uppercase mb-4 block">
                    Choose Product
                  </Label>
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Select value={selectedProduct} onValueChange={(value) => {
                      setSelectedProduct(value);
                      setSelectedSize("");
                      setSelectedColor("");
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₹{product.discounted_price || product.base_price}
                          </SelectItem>
                        ))}
                        {(!products || products.length === 0) && (
                          <div className="p-4 text-sm text-grey-text">
                            No products available for customization
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Size Selection - Show all sizes, cross out unavailable */}
                {selectedProduct && (
                  <div>
                    <Label className="text-lg font-heading uppercase mb-4 block">
                      Size
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      {allSizes.map((size) => {
                        const isAvailable = sizeAvailability.get(size) || false;
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedSize(size);
                                setSelectedColor(""); // Reset color when size changes
                              }
                            }}
                            className={`w-12 h-12 border-2 font-heading font-bold uppercase transition-colors relative ${!isAvailable
                              ? "border-grey-text text-grey-text opacity-50 cursor-not-allowed line-through"
                              : isSelected
                                ? "bg-foreground text-background border-foreground"
                                : "bg-background text-foreground border-foreground hover:bg-grey-bg"
                              }`}
                            title={!isAvailable ? "Out of stock" : size}
                          >
                            {size}
                          </button>
                        );
                      })}
                      {allSizes.length === 0 && (
                        <p className="text-sm text-grey-text">No sizes available for this product</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Color Selection - Show all colors, cross out unavailable */}
                {selectedProduct && selectedSize && (
                  <div>
                    <Label className="text-lg font-heading uppercase mb-4 block">
                      Color
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {allColors.map((color) => {
                        const stock = colorAvailability.get(color) || 0;
                        const isAvailable = stock > 0;
                        const isSelected = selectedColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedColor(color);
                              }
                            }}
                            className={`p-4 border-2 font-heading font-bold uppercase transition-all relative ${!isAvailable
                              ? "border-grey-text text-grey-text opacity-50 cursor-not-allowed"
                              : isSelected
                                ? "border-jager-red bg-jager-red/10"
                                : "border-foreground hover:border-jager-red/50"
                              }`}
                            title={!isAvailable ? "Out of stock" : `${color} - ${stock} in stock`}
                          >
                            <div className={`text-sm ${!isAvailable ? "line-through" : ""}`}>
                              {color}
                            </div>
                            {isAvailable && (
                              <div className="text-xs text-grey-text mt-1">
                                {stock} in stock
                              </div>
                            )}
                            {!isAvailable && (
                              <div className="text-xs text-grey-text mt-1">
                                Out of stock
                              </div>
                            )}
                          </button>
                        );
                      })}
                      {allColors.length === 0 && (
                        <p className="col-span-3 text-sm text-grey-text">
                          No colors available for size {selectedSize}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {selectedProduct && selectedSize && selectedColor && (
                  <div>
                    <Label className="text-lg font-heading uppercase mb-4 block">
                      Quantity (Max: {selectedVariant?.stock || 0})
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedVariant?.stock || 1}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const max = selectedVariant?.stock || 1;
                        setQuantity(Math.min(Math.max(1, val), max));
                      }}
                      className="text-lg font-heading"
                    />
                  </div>
                )}

                {/* Price Summary */}
                {selectedProductData && selectedVariant && (
                  <div className="bg-grey-bg p-6 space-y-4 rounded-lg">
                    <div className="space-y-2 border-b border-gray-200 pb-4">
                      <div className="flex justify-between font-body">
                        <span>Product:</span>
                        <span className="font-medium">{selectedProductData.name}</span>
                      </div>
                      <div className="flex justify-between font-body text-sm text-grey-text">
                        <span>Details:</span>
                        <span>{selectedSize} / {selectedColor}</span>
                      </div>
                      <div className="flex justify-between font-body">
                        <span>Unit Price:</span>
                        <div className="text-right">
                          {selectedVariant.discounted_price || selectedProductData.discounted_price ? (
                            <>
                              <span className="line-through text-grey-text text-sm mr-2">
                                ₹{(selectedVariant.actual_price || selectedProductData.base_price).toLocaleString()}
                              </span>
                              <span className="text-jager-red font-bold">
                                ₹{(selectedVariant.discounted_price || selectedProductData.discounted_price).toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span>₹{(selectedVariant.actual_price || selectedProductData.base_price).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between font-body">
                        <span>Quantity:</span>
                        <span>{quantity}</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-heading font-bold text-xl pt-2">
                      <span>Total:</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>

                    {selectedVariant.stock < 10 && (
                      <div className="text-sm text-jager-red font-body">
                        ⚠️ Only {selectedVariant.stock} left in stock
                      </div>
                    )}
                    <div className="flex justify-between font-heading text-xl font-bold pt-2 border-t border-foreground/20">
                      <span>TOTAL:</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={
                    (!frontImageUrl && !backImageUrl) ||
                    !selectedProduct ||
                    !selectedSize ||
                    !selectedColor ||
                    createOrderMutation.isPending ||
                    quantity > (selectedVariant?.stock || 0)
                  }
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "PROCEED TO ORDER"
                  )}
                </Button>

                {/* Product Details Section */}
                {selectedProductData && (
                  <div className="mt-8 space-y-6 border-t pt-6">
                    {selectedProductData.description && (
                      <div>
                        <h3 className="font-heading font-bold uppercase text-sm mb-2">Description</h3>
                        <p className="text-sm text-grey-text leading-relaxed">{selectedProductData.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {selectedProductData.material && (
                        <div>
                          <h3 className="font-heading font-bold uppercase text-sm mb-2">Material</h3>
                          <p className="text-sm text-grey-text">{selectedProductData.material}</p>
                        </div>
                      )}
                      {selectedProductData.care_instructions && (
                        <div>
                          <h3 className="font-heading font-bold uppercase text-sm mb-2">Care</h3>
                          <p className="text-sm text-grey-text">{selectedProductData.care_instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomLabBasic;
