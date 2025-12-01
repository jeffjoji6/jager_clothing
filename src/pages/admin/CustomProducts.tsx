import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Package, Upload, X } from "lucide-react";
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
import { CustomProduct, CustomProductVariant } from "@/hooks/useCustomProducts";

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']; // Only sizes for custom products
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Grey', 'Navy', 'Olive'];

const CustomProducts = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CustomProduct | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    base_price: "",
    discounted_price: "",
    category: "OVERSIZED_TEE",
    images: [] as string[],
    is_active: true,
    featured: false,
    sku: "",
    material: "",
    care_instructions: "",
  });
  const [variants, setVariants] = useState<CustomProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({
    size: "",
    color: "",
    stock: "",
    actual_price: "",
    discounted_price: "",
  });
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'custom-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomProduct[];
    },
  });

  // Fetch variants when editing
  useEffect(() => {
    if (editingProduct) {
      fetchVariants(editingProduct.id);
      setProductForm({
        name: editingProduct.name,
        description: editingProduct.description || "",
        base_price: editingProduct.base_price.toString(),
        discounted_price: editingProduct.discounted_price?.toString() || "",
        category: editingProduct.category,
        images: editingProduct.images || [],
        is_active: editingProduct.is_active,
        featured: editingProduct.featured,
        sku: editingProduct.sku || "",
        material: editingProduct.material || "",
        care_instructions: editingProduct.care_instructions || "",
      });
    }
  }, [editingProduct]);

  const fetchVariants = async (productId: string) => {
    const { data, error } = await supabase
      .from('custom_product_variants')
      .select('*')
      .eq('custom_product_id', productId)
      .order('size', { ascending: true })
      .order('color', { ascending: true });

    if (error) {
      toast.error("Failed to fetch variants");
      return;
    }
    setVariants(data || []);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImages(true);
      const url = await uploadImage(file, 'custom-products', 'product-images');
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, url],
      }));
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await deleteImage(imageUrl);
      setProductForm(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageUrl),
      }));
      toast.success("Image removed");
    } catch (error: any) {
      toast.error(`Failed to remove image: ${error.message}`);
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.size || !newVariant.color || !newVariant.stock) {
      toast.error("Please fill all variant fields");
      return;
    }

    const variant: Partial<CustomProductVariant> = {
      size: newVariant.size,
      color: newVariant.color,
      stock: parseInt(newVariant.stock),
      actual_price: newVariant.actual_price ? parseFloat(newVariant.actual_price) : null,
      discounted_price: newVariant.discounted_price ? parseFloat(newVariant.discounted_price) : null,
    };

    setVariants(prev => [...prev, variant as CustomProductVariant]);
    setNewVariant({
      size: "",
      color: "",
      stock: "",
      actual_price: "",
      discounted_price: "",
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const createProductMutation = useMutation({
    mutationFn: async () => {
      if (!productForm.name || !productForm.base_price) {
        throw new Error("Name and base price are required");
      }

      // Create product
      const { data: product, error: productError } = await supabase
        .from('custom_products')
        .insert({
          name: productForm.name,
          description: productForm.description || null,
          base_price: parseFloat(productForm.base_price),
          discounted_price: productForm.discounted_price ? parseFloat(productForm.discounted_price) : null,
          category: productForm.category,
          images: productForm.images.length > 0 ? productForm.images : null,
          is_active: productForm.is_active,
          featured: productForm.featured,
          sku: productForm.sku || null,
          material: productForm.material || null,
          care_instructions: productForm.care_instructions || null,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map(v => ({
          custom_product_id: product.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          actual_price: v.actual_price,
          discounted_price: v.discounted_price,
        }));

        const { error: variantsError } = await supabase
          .from('custom_product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-products'] });
      queryClient.invalidateQueries({ queryKey: ['custom-products'] });
      toast.success("Custom product created");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async () => {
      if (!editingProduct) return;

      // Update product
      const { error: productError } = await supabase
        .from('custom_products')
        .update({
          name: productForm.name,
          description: productForm.description || null,
          base_price: parseFloat(productForm.base_price),
          discounted_price: productForm.discounted_price ? parseFloat(productForm.discounted_price) : null,
          category: productForm.category,
          images: productForm.images.length > 0 ? productForm.images : null,
          is_active: productForm.is_active,
          featured: productForm.featured,
          sku: productForm.sku || null,
          material: productForm.material || null,
          care_instructions: productForm.care_instructions || null,
        })
        .eq('id', editingProduct.id);

      if (productError) throw productError;

      // Delete existing variants
      await supabase
        .from('custom_product_variants')
        .delete()
        .eq('custom_product_id', editingProduct.id);

      // Insert new variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map(v => ({
          custom_product_id: editingProduct.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          actual_price: v.actual_price,
          discounted_price: v.discounted_price,
        }));

        const { error: variantsError } = await supabase
          .from('custom_product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      return editingProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-products'] });
      queryClient.invalidateQueries({ queryKey: ['custom-products'] });
      toast.success("Custom product updated");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('custom_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-products'] });
      queryClient.invalidateQueries({ queryKey: ['custom-products'] });
      toast.success("Custom product deleted");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setActiveTab("basic");
    setProductForm({
      name: "",
      description: "",
      base_price: "",
      discounted_price: "",
      category: "OVERSIZED_TEE",
      images: [],
      is_active: true,
      featured: false,
      sku: "",
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
    });
  };

  const handleEdit = (product: CustomProduct) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Are you sure you want to delete this custom product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase">Custom Products</h1>
          <p className="text-grey-text mt-1">Manage custom products for Jager Basic (separate from collection)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase">
                {editingProduct ? "Edit Custom Product" : "New Custom Product"}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Oversized Tee"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OVERSIZED_TEE">Oversized Tee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Images</Label>
                  <div className="border-2 border-dashed border-foreground p-4 rounded mt-2">
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                        disabled={uploadingImages}
                      />
                      <Upload className="h-8 w-8 mb-2 text-grey-text" />
                      <span className="text-sm font-heading uppercase">
                        {uploadingImages ? "Uploading..." : "Click to upload"}
                      </span>
                    </label>
                  </div>
                  {productForm.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {productForm.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img src={url} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded" />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                            onClick={() => handleRemoveImage(url)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={productForm.is_active}
                      onCheckedChange={(checked) =>
                        setProductForm(prev => ({ ...prev, is_active: checked as boolean }))
                      }
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={productForm.featured}
                      onCheckedChange={(checked) =>
                        setProductForm(prev => ({ ...prev, featured: checked as boolean }))
                      }
                    />
                    <Label htmlFor="featured">Featured</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Price (₹) *</Label>
                    <Input
                      type="number"
                      value={productForm.base_price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, base_price: e.target.value }))}
                      placeholder="799"
                    />
                  </div>
                  <div>
                    <Label>Discounted Price (₹)</Label>
                    <Input
                      type="number"
                      value={productForm.discounted_price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, discounted_price: e.target.value }))}
                      placeholder="699"
                    />
                  </div>
                </div>
                {productForm.base_price && productForm.discounted_price && (
                  <div className="p-3 bg-grey-bg rounded">
                    <span className="text-sm">
                      Discount: {Math.round((1 - parseFloat(productForm.discounted_price) / parseFloat(productForm.base_price)) * 100)}%
                    </span>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="variants" className="space-y-4 mt-4">
                <div className="border-2 border-foreground p-4 rounded space-y-4">
                  <h3 className="font-heading font-bold uppercase">Add Variant</h3>
                  <div className="grid grid-cols-5 gap-2">
                    <Select value={newVariant.size} onValueChange={(value) => setNewVariant(prev => ({ ...prev, size: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZES.map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newVariant.color} onValueChange={(value) => setNewVariant(prev => ({ ...prev, color: value }))}>
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
                      placeholder="Stock"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, stock: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Actual Price"
                      value={newVariant.actual_price}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, actual_price: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Discounted Price"
                      value={newVariant.discounted_price}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, discounted_price: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddVariant} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variant
                  </Button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold uppercase">Variants ({variants.length})</h3>
                    <div className="space-y-2">
                      {variants.map((variant, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-grey-bg rounded">
                          <div className="flex gap-4">
                            <span className="font-heading uppercase">{variant.size}</span>
                            <span>{variant.color}</span>
                            <span>Stock: {variant.stock}</span>
                            {variant.actual_price && <span>₹{variant.actual_price}</span>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveVariant(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={productForm.sku}
                      onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="SKU-001"
                    />
                  </div>
                  <div>
                    <Label>Material</Label>
                    <Input
                      value={productForm.material}
                      onChange={(e) => setProductForm(prev => ({ ...prev, material: e.target.value }))}
                      placeholder="100% Cotton"
                    />
                  </div>
                </div>
                <div>
                  <Label>Care Instructions</Label>
                  <Textarea
                    value={productForm.care_instructions}
                    onChange={(e) => setProductForm(prev => ({ ...prev, care_instructions: e.target.value }))}
                    placeholder="Machine wash cold..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={() => editingProduct ? updateProductMutation.mutate() : createProductMutation.mutate()}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingProduct ? "Update" : "Create"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products && products.length > 0 ? (
          products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="font-heading uppercase">{product.name}</CardTitle>
                      {!product.is_active && <Badge variant="secondary">Inactive</Badge>}
                      {product.featured && <Badge>Featured</Badge>}
                    </div>
                    <p className="text-sm text-grey-text">{product.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-grey-text">Base Price</p>
                    <p className="font-heading font-bold">₹{product.base_price}</p>
                  </div>
                  {product.discounted_price && (
                    <div>
                      <p className="text-sm text-grey-text">Discounted</p>
                      <p className="font-heading font-bold text-jager-red">₹{product.discounted_price}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-grey-text">SKU</p>
                    <p className="font-heading">{product.sku || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-grey-text">Images</p>
                    <p className="font-heading">{(product.images?.length || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-grey-text" />
              <p className="text-grey-text">No custom products yet</p>
              <p className="text-sm text-grey-text mt-1">Create your first custom product</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomProducts;

