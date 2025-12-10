import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Package, Upload, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadImage, deleteImage } from "@/lib/imageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  discounted_price: number | null;
  category: string | null;
  images: string[] | null;
  featured: boolean;
  is_new: boolean;
  amazon_url: string | null;
  amazon_asin: string | null;
  sku: string | null;
  brand: string | null;
  material: string | null;
  care_instructions: string | null;
}

interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
  price_modifier: number;
  actual_price: number | null;
  discounted_price: number | null;
  barcode: string | null;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Navy', 'Olive', 'Brown', 'Beige', 'Cream', 'Charcoal'];
const CATEGORIES = ['TEES', 'HOODIES', 'BOTTOMS', 'Custom'];


interface ProductWithStock extends Product {
  product_variants: { stock: number; is_archived?: boolean }[];
}

const Products = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    base_price: "",
    discounted_price: "",
    category: "",
    images: [] as string[],
    featured: false,
    is_new: false,
    amazon_url: "",
    amazon_asin: "",
    sku: "",
    brand: "",
    material: "",
    care_instructions: "",
  });
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({
    size: "",
    color: "",
    stock: "",
    actual_price: "",
    discounted_price: "",
    price_modifier: "0",
  });
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(stock, is_archived)')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductWithStock[];
    },
  });

  // Calculate total stock for a product
  const getTotalStock = (product: ProductWithStock) => {
    return product.product_variants?.reduce((sum, variant) => {
      // Only count non-archived variants
      if (variant.is_archived) return sum;
      return sum + Number(variant.stock || 0);
    }, 0) || 0;
  };

  // Fetch variants when editing
  const { data: productVariants, isLoading: isLoadingVariants } = useQuery({
    queryKey: ['admin', 'product', editingProduct?.id, 'variants'],
    queryFn: async () => {
      if (!editingProduct) return [];
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', editingProduct.id)
        .order('size', { ascending: true });

      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!editingProduct,
    // Ensure we don't cache stale data when switching products
    staleTime: 0,
    gcTime: 0,
  });

  // Update variants when fetched
  useEffect(() => {
    if (editingProduct && productVariants) {
      setVariants(productVariants);
    }
  }, [productVariants, editingProduct]);

  // Handle image upload
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPrimary: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      let newImages = [...productForm.images];

      if (isPrimary) {
        // If uploading primary, put it at index 0 (replace if exists or unshift)
        // Actually, user might want to replace just the primary. 
        // Let's say if isPrimary, we take the first uploaded image and set it as index 0
        if (uploadedUrls.length > 0) {
          if (newImages.length === 0) {
            newImages = [uploadedUrls[0]];
          } else {
            newImages[0] = uploadedUrls[0];
          }
          // If multiple were uploaded for primary (unlikely via UI but possible), append others? 
          // For now, assume single file upload for primary replacement
        }
      } else {
        // Append to end
        newImages = [...newImages, ...uploadedUrls];
      }

      setProductForm({
        ...productForm,
        images: newImages,
      });
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      toast.error(`Failed to upload images: ${error.message}`);
    } finally {
      setUploadingImages(false);
      e.target.value = ''; // Reset input
    }
  };

  // Set image as primary
  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    const newImages = [...productForm.images];
    const [imageToMove] = newImages.splice(index, 1);
    newImages.unshift(imageToMove);
    setProductForm({ ...productForm, images: newImages });
  };

  // Remove image
  const handleRemoveImage = async (index: number, imageUrl: string) => {
    try {
      await deleteImage(imageUrl);
      const newImages = productForm.images.filter((_, i) => i !== index);
      setProductForm({ ...productForm, images: newImages });
      toast.success("Image removed");
    } catch (error: any) {
      // Even if delete fails, remove from form
      const newImages = productForm.images.filter((_, i) => i !== index);
      setProductForm({ ...productForm, images: newImages });
    }
  };

  // Add variant
  const handleAddVariant = () => {
    if (!newVariant.size || !newVariant.color) {
      toast.error("Please select size and color");
      return;
    }

    // Check if variant already exists
    const exists = variants.some(
      v => v.size === newVariant.size && v.color === newVariant.color
    );

    if (exists) {
      toast.error("This size/color combination already exists");
      return;
    }

    const variant: ProductVariant = {
      id: `temp-${Date.now()}`,
      product_id: editingProduct?.id || '',
      size: newVariant.size,
      color: newVariant.color,
      stock: Number(newVariant.stock) || 0,
      price_modifier: Number(newVariant.price_modifier) || 0,
      // Inherit from main product if not specified
      actual_price: newVariant.actual_price
        ? Number(newVariant.actual_price)
        : Number(productForm.base_price),
      discounted_price: newVariant.discounted_price
        ? Number(newVariant.discounted_price)
        : (productForm.discounted_price ? Number(productForm.discounted_price) : null),
      barcode: null,
    };

    setVariants([...variants, variant]);
    setNewVariant({
      size: "",
      color: "",
      stock: "",
      actual_price: "",
      discounted_price: "",
      price_modifier: "0",
    });
  };

  // Remove variant
  const handleRemoveVariant = (variantId: string) => {
    setVariants(variants.filter(v => v.id !== variantId));
  };

  // Update variant
  const handleUpdateVariant = (variantId: string, field: string, value: any) => {
    setVariants(
      variants.map(v =>
        v.id === variantId ? { ...v, [field]: value } : v
      )
    );
  };

  const createProduct = useMutation({
    mutationFn: async () => {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productForm.name,
          description: productForm.description || null,
          // Derive base price from the first variant if available, else 0.
          base_price: variants.length > 0 ? Number(variants[0].actual_price || 0) : 0,
          discounted_price: variants.length > 0 ? (variants[0].discounted_price ? Number(variants[0].discounted_price) : null) : null,
          category: productForm.category || null,
          images: productForm.images.length > 0 ? productForm.images : null,
          featured: productForm.featured,
          is_new: productForm.is_new,
          amazon_url: productForm.amazon_url || null,
          amazon_asin: productForm.amazon_asin || null,
          sku: productForm.sku || null,
          brand: null, // Brand removed
          material: productForm.material || null,
          care_instructions: productForm.care_instructions || null,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create variants
      if (variants.length > 0 && product) {
        const variantData = variants.map(v => ({
          product_id: product.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          price_modifier: v.price_modifier,
          actual_price: v.actual_price,
          discounted_price: v.discounted_price,
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantData);

        if (variantsError) throw variantsError;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product created successfully");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    }
  });

  const updateProduct = useMutation({
    mutationFn: async () => {
      if (!editingProduct) return;

      // 1. Update product details
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: productForm.name,
          description: productForm.description || null,
          // Derive base price from the first variant if available
          base_price: variants.length > 0 ? Number(variants[0].actual_price || 0) : 0,
          discounted_price: variants.length > 0 ? (variants[0].discounted_price ? Number(variants[0].discounted_price) : null) : null,
          category: productForm.category || null,
          images: productForm.images.length > 0 ? productForm.images : null,
          featured: productForm.featured,
          is_new: productForm.is_new,
          amazon_url: productForm.amazon_url || null,
          amazon_asin: productForm.amazon_asin || null,
          sku: productForm.sku || null,
          brand: null,
          material: productForm.material || null,
          care_instructions: productForm.care_instructions || null,
        })
        .eq('id', editingProduct.id);

      if (productError) throw productError;

      // 2. Upsert variants (Update existing, Insert new)
      // We collect all IDs that should be KEPT (active).
      // Start with the existing IDs that are not temp.
      let protectedIds = variants.filter(v => !v.id.startsWith('temp-')).map(v => v.id);

      const variantsToInsert = variants.filter(v => v.id.startsWith('temp-')).map(v => ({
        product_id: editingProduct.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
        price_modifier: v.price_modifier,
        actual_price: v.actual_price,
        discounted_price: v.discounted_price,
        is_archived: false, // Ensure resurrected variants are active
      }));

      const variantsToUpdate = variants.filter(v => !v.id.startsWith('temp-')).map(v => ({
        id: v.id,
        product_id: editingProduct.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
        price_modifier: v.price_modifier,
        actual_price: v.actual_price,
        discounted_price: v.discounted_price,
        is_archived: false,
      }));

      // Handle "New" Variants (which might actually be archived existing ones)
      if (variantsToInsert.length > 0) {
        // Use UPSERT checking for conflict on (product_id, size, color)
        const { data: insertedVariants, error: insertError } = await supabase
          .from('product_variants')
          .upsert(variantsToInsert, { onConflict: 'product_id, size, color' })
          .select('id');

        if (insertError) throw insertError;

        // Add the IDs of these upserted variants to the protected list
        if (insertedVariants) {
          protectedIds = [...protectedIds, ...insertedVariants.map(v => v.id)];
        }
      }

      // Handle Existing Variants
      if (variantsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('product_variants')
          .upsert(variantsToUpdate);
        if (updateError) throw updateError;
      }

      // 3. Soft delete removed variants (archive anything NOT in protectedIds)
      // Note: We use protectedIds (which covers both preserved existing AND newly added/resurrected)
      let deleteQuery = supabase
        .from('product_variants')
        .update({ is_archived: true })
        .eq('product_id', editingProduct.id);

      if (protectedIds.length > 0) {
        deleteQuery = deleteQuery.not('id', 'in', `(${protectedIds.join(',')})`);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error("Error archiving removed variants:", deleteError);
        toast.error("Failed to archive some variants.");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'product', editingProduct?.id, 'variants'] });
      toast.success("Product updated successfully");
      setDialogOpen(false);
      resetForm();
      setEditingProduct(null);
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast.error(`Failed to update product: ${error.message}`);
    }
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      // Soft delete: Just set is_archived to true
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product archived successfully");
    },
    onError: (error) => {
      toast.error(`Failed to archive product: ${error.message}`);
    }
  });

  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      base_price: "",
      discounted_price: "",
      category: "",
      images: [],
      featured: false,
      is_new: false,
      amazon_url: "",
      amazon_asin: "",
      sku: "",
      brand: "",
      material: "",
      care_instructions: "",
    });
    setVariants([]);
    setNewVariant({
      size: "",
      color: "",
      stock: "",
      actual_price: "",
      discounted_price: "",
      price_modifier: "0",
    });
    setActiveTab("basic");
  };

  const handleEdit = (product: Product) => {
    try {
      console.log("Editing product:", product);
      setEditingProduct(product);
      setProductForm({
        name: product.name || "",
        description: product.description || "",
        base_price: product.base_price?.toString() || "0",
        discounted_price: product.discounted_price?.toString() || "",
        category: product.category || "",
        images: product.images || [],
        featured: !!product.featured,
        is_new: !!product.is_new,
        amazon_url: product.amazon_url || "",
        amazon_asin: product.amazon_asin || "",
        sku: product.sku || "",
        brand: product.brand || "",
        material: product.material || "",
        care_instructions: product.care_instructions || "",
      });
      // Variants will be loaded by the query
      setDialogOpen(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
      toast.error("Failed to open edit dialog. Check console for details.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Validation
    if (!productForm.name.trim()) {
      toast.error("Product Name is required");
      return;
    }
    // Base price is now derived from variants, so we just check if variants exist
    // if (!productForm.base_price || Number(productForm.base_price) <= 0) {
    //   toast.error("Valid Base Price is required");
    //   return;
    // }
    if (!productForm.category) {
      toast.error("Category is required");
      return;
    }
    if (productForm.images.length === 0) {
      toast.error("At least one product image is required");
      return;
    }
    if (variants.length === 0) {
      toast.error("At least one product variant (Size/Color) is required");
      return;
    }

    if (editingProduct) {
      updateProduct.mutate();
    } else {
      createProduct.mutate();
    }
  };

  const calculateDiscount = () => {
    if (!productForm.base_price || !productForm.discounted_price) return 0;
    const discount = ((Number(productForm.base_price) - Number(productForm.discounted_price)) / Number(productForm.base_price)) * 100;
    return Math.round(discount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Products</h1>
          <p className="text-grey-text mt-1">Manage your product catalog with detailed information</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingProduct(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold uppercase">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="variants">Variants (Pricing)</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase">Product Name *</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase">Description</Label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  {/* Category Selection with Custom Option */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-heading font-bold uppercase">Category</Label>
                      <Select
                        value={CATEGORIES.includes(productForm.category) ? productForm.category : (productForm.category ? "Custom" : "")}
                        onValueChange={(value) => setProductForm({ ...productForm, category: value === "Custom" ? "" : value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Show input if Custom is selected or if current category is not in list but exists */}
                      {(productForm.category && !CATEGORIES.includes(productForm.category)) || (!CATEGORIES.includes(productForm.category) && productForm.category === "") ? (
                        <div className="mt-2">
                          <Input
                            placeholder="Enter custom category"
                            value={productForm.category}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <Label className="text-sm font-heading font-bold uppercase">SKU</Label>
                      <Input
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        placeholder="Product SKU"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {/* Brand Removed */}

                  {/* Image Upload */}
                  {/* Image Upload */}
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase mb-2 block">Product Images</Label>
                    <div className="space-y-4">
                      {/* Primary Image */}
                      <div className="border border-foreground/20 rounded-lg p-4 bg-grey-bg/10">
                        <Label className="text-xs font-bold uppercase mb-2 block text-jager-red">Primary Image (Required)</Label>
                        <div className="flex items-start gap-4">
                          {productForm.images[0] ? (
                            <div className="relative group w-32 h-40">
                              <img
                                src={productForm.images[0]}
                                alt="Primary"
                                className="w-full h-full object-cover rounded border border-jager-red"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={() => handleRemoveImage(0, productForm.images[0])}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Badge className="absolute bottom-1 left-1 bg-jager-red text-[10px]">MAIN</Badge>
                            </div>
                          ) : (
                            <div className="w-32 h-40 border-2 border-dashed border-foreground/30 rounded flex items-center justify-center bg-background">
                              <span className="text-xs text-grey-text text-center px-2">No Main Image</span>
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="text-xs text-grey-text mb-2">
                              This image will be shown on the collection page and as the main product image.
                            </p>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, true)}
                                disabled={uploadingImages}
                                className="hidden"
                                id="primary-upload"
                              />
                              <Label htmlFor="primary-upload" className="cursor-pointer">
                                <Button type="button" variant="outline" size="sm" disabled={uploadingImages}>
                                  {uploadingImages ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                                  {productForm.images[0] ? "Change Primary" : "Upload Primary"}
                                </Button>
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gallery Images */}
                      <div className="border border-foreground/20 rounded-lg p-4">
                        <Label className="text-xs font-bold uppercase mb-2 block">Gallery Images</Label>

                        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-4">
                          {productForm.images.slice(1).map((url, idx) => {
                            const realIndex = idx + 1;
                            return (
                              <div key={realIndex} className="relative group aspect-[3/4]">
                                <img
                                  src={url}
                                  alt={`Gallery ${idx + 1}`}
                                  className="w-full h-full object-cover rounded border"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-6 text-[10px] px-2"
                                    onClick={() => setAsPrimary(realIndex)}
                                  >
                                    Make Main
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleRemoveImage(realIndex, url)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          <div className="aspect-[3/4] flex items-center justify-center">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleImageUpload(e, false)}
                              disabled={uploadingImages}
                              className="hidden"
                              id="gallery-upload"
                            />
                            <Label htmlFor="gallery-upload" className="cursor-pointer w-full h-full">
                              <div className="w-full h-full border-2 border-dashed border-foreground/30 rounded flex flex-col items-center justify-center hover:bg-grey-bg/10 transition-colors">
                                <Plus className="h-6 w-6 text-grey-text mb-1" />
                                <span className="text-[10px] uppercase font-bold text-grey-text">Add More</span>
                              </div>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={productForm.featured}
                        onCheckedChange={(checked) => setProductForm({ ...productForm, featured: checked as boolean })}
                      />
                      <Label htmlFor="featured" className="text-sm font-heading font-bold uppercase cursor-pointer">
                        Featured
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_new"
                        checked={productForm.is_new}
                        onCheckedChange={(checked) => setProductForm({ ...productForm, is_new: checked as boolean })}
                      />
                      <Label htmlFor="is_new" className="text-sm font-heading font-bold uppercase cursor-pointer">
                        New Arrival
                      </Label>
                    </div>
                  </div>
                </TabsContent>

                {/* Pricing Tab */}


                {/* Variants Tab */}
                <TabsContent value="variants" className="space-y-4">
                  <div className="border border-foreground p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-heading font-bold uppercase text-sm">Add Variant</h3>
                      <div className="text-sm">
                        <span className="text-grey-text">Total Stock: </span>
                        <span className="font-heading font-bold">
                          {variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      <Select value={newVariant.size} onValueChange={(value) => setNewVariant({ ...newVariant, size: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.map(size => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={newVariant.color} onValueChange={(value) => setNewVariant({ ...newVariant, color: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Color" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLORS.map(color => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                        placeholder="Stock"
                        min="0"
                      />
                      <Input
                        type="number"
                        value={newVariant.actual_price}
                        onChange={(e) => setNewVariant({ ...newVariant, actual_price: e.target.value })}
                        placeholder="Price"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        value={newVariant.discounted_price}
                        onChange={(e) => setNewVariant({ ...newVariant, discounted_price: e.target.value })}
                        placeholder="Disc. Price"
                        step="0.01"
                      />
                      <Button type="button" onClick={handleAddVariant}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Variants List */}
                  {variants.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-heading font-bold uppercase text-sm">Product Variants</h3>
                      <div className="border border-foreground rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-grey-bg">
                            <tr>
                              <th className="p-2 text-left">Size</th>
                              <th className="p-2 text-left">Color</th>
                              <th className="p-2 text-right">Stock</th>
                              <th className="p-2 text-right">Price</th>
                              <th className="p-2 text-right">Disc. Price</th>
                              <th className="p-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((variant) => (
                              <tr key={variant.id} className="border-t border-foreground">
                                <td className="p-2">{variant.size}</td>
                                <td className="p-2">{variant.color}</td>
                                <td className="p-2 text-right">
                                  <Input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) => handleUpdateVariant(variant.id, 'stock', Number(e.target.value))}
                                    className="w-20 inline-block"
                                    min="0"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  ₹{variant.actual_price?.toLocaleString() || '-'}
                                </td>
                                <td className="p-2 text-right">
                                  ₹{variant.discounted_price?.toLocaleString() || '-'}
                                </td>
                                <td className="p-2 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveVariant(variant.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase">Material</Label>
                    <Input
                      value={productForm.material}
                      onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                      placeholder="e.g., 100% Cotton"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase">Care Instructions</Label>
                    <Textarea
                      value={productForm.care_instructions}
                      onChange={(e) => setProductForm({ ...productForm, care_instructions: e.target.value })}
                      placeholder="e.g., Machine wash cold, hang dry"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="flex-1"
                >
                  {createProduct.isPending || updateProduct.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingProduct ? "Update Product" : "Create Product"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      {
        isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((product) => {
              const discount = product.discounted_price
                ? Math.round(((product.base_price - product.discounted_price) / product.base_price) * 100)
                : 0;

              return (
                <Card key={product.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1 w-full">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={Array.isArray(product.images) ? product.images[0] : product.images}
                            alt={product.name}
                            className="w-24 h-24 object-cover bg-grey-bg rounded hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-heading font-bold uppercase text-lg truncate">{product.name}</h3>
                            {product.featured && (
                              <Badge className="bg-jager-red text-white text-xs whitespace-nowrap">FEATURED</Badge>
                            )}
                            {product.is_new && (
                              <Badge className="bg-blue-500 text-white text-xs whitespace-nowrap">NEW</Badge>
                            )}
                            {discount > 0 && (
                              <Badge className="bg-green-500 text-white text-xs whitespace-nowrap">{discount}% OFF</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm mb-1 flex-wrap">
                            <div className="font-mono">
                              {product.discounted_price ? (
                                <>
                                  <span className="font-heading font-bold text-jager-red mr-2">
                                    ₹{product.discounted_price.toLocaleString()}
                                  </span>
                                  <span className="line-through text-grey-text">
                                    ₹{product.base_price.toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span className="font-heading font-bold">
                                  ₹{product.base_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {product.category && (
                              <span className="text-grey-text border-l border-gray-300 pl-2">Category: {product.category}</span>
                            )}
                            {product.sku && (
                              <span className="text-grey-text border-l border-gray-300 pl-2">SKU: {product.sku}</span>
                            )}
                          </div>
                          {product.amazon_url && (
                            <a
                              href={product.amazon_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-jager-red underline flex items-center gap-1 mb-2"
                            >
                              <LinkIcon className="h-3 w-3" />
                              View on Amazon
                            </a>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className={getTotalStock(product) === 0 ? "text-red-500 border-red-500" : getTotalStock(product) <= 1 ? "text-yellow-500 border-yellow-500" : "text-green-500 border-green-500"}>
                              Stock: {getTotalStock(product)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this product?")) {
                              deleteProduct.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-grey-text mx-auto mb-4" />
              <p className="text-grey-text">No products yet. Add your first product!</p>
            </CardContent>
          </Card>
        )
      }
    </div >
  );
};

export default Products;
