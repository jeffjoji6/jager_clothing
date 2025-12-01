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
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Navy', 'Olive', 'Brown'];

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch variants when editing
  const { data: productVariants } = useQuery({
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
  });

  // Update variants when fetched
  useEffect(() => {
    if (productVariants) {
      setVariants(productVariants);
    }
  }, [productVariants]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      setProductForm({
        ...productForm,
        images: [...productForm.images, ...uploadedUrls],
      });
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error: any) {
      toast.error(`Failed to upload images: ${error.message}`);
    } finally {
      setUploadingImages(false);
      e.target.value = ''; // Reset input
    }
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
      actual_price: newVariant.actual_price ? Number(newVariant.actual_price) : null,
      discounted_price: newVariant.discounted_price ? Number(newVariant.discounted_price) : null,
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
          base_price: Number(productForm.base_price),
          discounted_price: productForm.discounted_price ? Number(productForm.discounted_price) : null,
          category: productForm.category || null,
          images: productForm.images.length > 0 ? productForm.images : null,
          featured: productForm.featured,
          is_new: productForm.is_new,
          amazon_url: productForm.amazon_url || null,
          amazon_asin: productForm.amazon_asin || null,
          sku: productForm.sku || null,
          brand: productForm.brand || null,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product created successfully");
      setDialogOpen(false);
      resetForm();
    },
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
          base_price: Number(productForm.base_price),
          discounted_price: productForm.discounted_price ? Number(productForm.discounted_price) : null,
          category: productForm.category || null,
          images: productForm.images.length > 0 ? productForm.images : null,
          featured: productForm.featured,
          is_new: productForm.is_new,
          amazon_url: productForm.amazon_url || null,
          amazon_asin: productForm.amazon_asin || null,
          sku: productForm.sku || null,
          brand: productForm.brand || null,
          material: productForm.material || null,
          care_instructions: productForm.care_instructions || null,
        })
        .eq('id', editingProduct.id);

      if (productError) throw productError;

      // 2. Upsert variants (Update existing, Insert new)
      if (variants.length > 0) {
        const variantsToUpsert = variants.map(v => {
          const isNew = v.id.startsWith('temp-');
          return {
            id: isNew ? undefined : v.id, // Undefined ID triggers insert
            product_id: editingProduct.id,
            size: v.size,
            color: v.color,
            stock: v.stock,
            price_modifier: v.price_modifier,
            actual_price: v.actual_price,
            discounted_price: v.discounted_price,
          };
        });

        const { error: upsertError } = await supabase
          .from('product_variants')
          .upsert(variantsToUpsert);

        if (upsertError) throw upsertError;
      }

      // 3. Delete removed variants
      // Get IDs of variants currently in the form (excluding new temp ones)
      const currentIds = variants
        .map(v => v.id)
        .filter(id => !id.startsWith('temp-'));

      // Delete variants that are in DB but not in currentIds
      // If currentIds is empty, it means delete all (except we might hit FK constraints)
      let deleteQuery = supabase
        .from('product_variants')
        .delete()
        .eq('product_id', editingProduct.id);

      if (currentIds.length > 0) {
        deleteQuery = deleteQuery.not('id', 'in', `(${currentIds.join(',')})`);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error("Error deleting removed variants (likely FK constraint):", deleteError);
        // We don't throw here to allow the update to succeed even if cleanup fails
        toast.error("Some variants could not be deleted as they are part of existing orders.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', editingProduct?.id, 'variants'] });
      toast.success("Product updated successfully");
      setDialogOpen(false);
      resetForm();
      setEditingProduct(null);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      // Delete images from storage
      const product = products?.find(p => p.id === productId);
      if (product?.images) {
        await Promise.all(product.images.map(img => deleteImage(img)));
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product deleted successfully");
    },
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
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      base_price: product.base_price.toString(),
      discounted_price: product.discounted_price?.toString() || "",
      category: product.category || "",
      images: product.images || [],
      featured: product.featured,
      is_new: product.is_new,
      amazon_url: product.amazon_url || "",
      amazon_asin: product.amazon_asin || "",
      sku: product.sku || "",
      brand: product.brand || "",
      material: product.material || "",
      care_instructions: product.care_instructions || "",
    });
    // Variants will be loaded by the query
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="flex items-center justify-between">
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="variants">Variants</TabsTrigger>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-heading font-bold uppercase">Category</Label>
                      <Input
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        placeholder="e.g., HOODIES, TEES"
                        className="mt-1"
                      />
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
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase">Brand</Label>
                    <Input
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      placeholder="Brand name"
                      className="mt-1"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase mb-2 block">Product Images</Label>
                    <div className="border-2 border-dashed border-foreground rounded-lg p-4">
                      <div className="flex items-center justify-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          disabled={uploadingImages}
                          className="hidden"
                          id="image-upload"
                        />
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" disabled={uploadingImages}>
                            {uploadingImages ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Images
                              </>
                            )}
                          </Button>
                        </Label>
                      </div>

                      {/* Image Preview */}
                      {productForm.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          {productForm.images.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveImage(index, url)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
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
                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-heading font-bold uppercase">Actual Price (₹) *</Label>
                      <Input
                        type="number"
                        value={productForm.base_price}
                        onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-heading font-bold uppercase">Discounted Price (₹)</Label>
                      <Input
                        type="number"
                        value={productForm.discounted_price}
                        onChange={(e) => setProductForm({ ...productForm, discounted_price: e.target.value })}
                        min="0"
                        step="0.01"
                        className="mt-1"
                      />
                      {productForm.discounted_price && productForm.base_price && (
                        <p className="text-xs text-jager-red mt-1 font-bold">
                          {calculateDiscount()}% OFF
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Amazon URL
                    </Label>
                    <Input
                      value={productForm.amazon_url}
                      onChange={(e) => setProductForm({ ...productForm, amazon_url: e.target.value })}
                      placeholder="https://amazon.in/dp/..."
                      type="url"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase">Amazon ASIN</Label>
                    <Input
                      value={productForm.amazon_asin}
                      onChange={(e) => setProductForm({ ...productForm, amazon_asin: e.target.value })}
                      placeholder="B08XXXXXXX"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                {/* Variants Tab */}
                <TabsContent value="variants" className="space-y-4">
                  <div className="border border-foreground p-4 rounded-lg space-y-4">
                    <h3 className="font-heading font-bold uppercase text-sm">Add Variant</h3>
                    <div className="grid grid-cols-6 gap-2">
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
      {isLoading ? (
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {product.images && product.images.length > 0 && (
                        <img
                          src={Array.isArray(product.images) ? product.images[0] : product.images}
                          alt={product.name}
                          className="w-24 h-24 object-cover bg-grey-bg rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-heading font-bold uppercase text-lg">{product.name}</h3>
                          {product.featured && (
                            <Badge className="bg-jager-red text-white text-xs">FEATURED</Badge>
                          )}
                          {product.is_new && (
                            <Badge className="bg-blue-500 text-white text-xs">NEW</Badge>
                          )}
                          {discount > 0 && (
                            <Badge className="bg-green-500 text-white text-xs">{discount}% OFF</Badge>
                          )}
                        </div>
                        <p className="text-sm text-grey-text mb-2">
                          {product.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm mb-2">
                          <div className="flex items-center gap-2">
                            {product.discounted_price ? (
                              <>
                                <span className="font-heading font-bold text-jager-red">
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
                            <span className="text-grey-text">Category: {product.category}</span>
                          )}
                          {product.sku && (
                            <span className="text-grey-text">SKU: {product.sku}</span>
                          )}
                        </div>
                        {product.amazon_url && (
                          <a
                            href={product.amazon_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-jager-red underline flex items-center gap-1"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View on Amazon
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
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
      )}
    </div>
  );
};

export default Products;
