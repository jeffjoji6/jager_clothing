import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category: string | null;
  images: string[] | null;
  featured: boolean;
  is_new: boolean;
}

const Products = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    base_price: "",
    category: "",
    images: [] as string[],
    featured: false,
    is_new: false,
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

  const createProduct = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('products')
        .insert({
          name: productForm.name,
          description: productForm.description || null,
          base_price: Number(productForm.base_price),
          category: productForm.category || null,
          images: productForm.images.length > 0 ? productForm.images : null,
          featured: productForm.featured,
          is_new: productForm.is_new,
        });

      if (error) throw error;
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
      const { error } = await supabase
        .from('products')
        .update({
          name: productForm.name,
          description: productForm.description || null,
          base_price: Number(productForm.base_price),
          category: productForm.category || null,
          images: productForm.images.length > 0 ? productForm.images : null,
          featured: productForm.featured,
          is_new: productForm.is_new,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product updated successfully");
      setDialogOpen(false);
      resetForm();
      setEditingProduct(null);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
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
      category: "",
      images: [],
      featured: false,
      is_new: false,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      base_price: product.base_price.toString(),
      category: product.category || "",
      images: product.images || [],
      featured: product.featured,
      is_new: product.is_new,
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Products</h1>
          <p className="text-grey-text mt-1">Manage your product catalog</p>
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold uppercase">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label className="text-sm font-heading font-bold uppercase">Base Price (₹) *</Label>
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
                  <Label className="text-sm font-heading font-bold uppercase">Category</Label>
                  <Input
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g., HOODIES, TEES"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-heading font-bold uppercase">Image URLs (one per line)</Label>
                <Textarea
                  value={productForm.images.join('\n')}
                  onChange={(e) => setProductForm({ ...productForm, images: e.target.value.split('\n').filter(url => url.trim()) })}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  rows={3}
                  className="mt-1"
                />
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
              <div className="flex gap-2 pt-4">
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
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={Array.isArray(product.images) ? product.images[0] : product.images}
                        alt={product.name}
                        className="w-24 h-24 object-cover bg-grey-bg"
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
                      </div>
                      <p className="text-sm text-grey-text mb-2">
                        {product.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-heading font-bold">₹{Number(product.base_price).toLocaleString()}</span>
                        {product.category && (
                          <span className="text-grey-text">Category: {product.category}</span>
                        )}
                      </div>
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
          ))}
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

