import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Package, Upload, X, Link as LinkIcon, History, AlertTriangle, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadImage, deleteImage } from "@/lib/imageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// --- Types ---
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
    is_archived?: boolean;
}

interface ProductWithStock extends Product {
    product_variants: { stock: number; is_archived?: boolean }[];
}

interface StockHistory {
    id: string;
    change_amount: number;
    previous_stock: number;
    new_stock: number;
    reason: string;
    notes: string | null;
    created_at: string;
    performed_by: string | null;
}

const STOCK_REASONS = [
    { value: 'restock', label: 'Restock' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'lost', label: 'Lost' },
    { value: 'returned', label: 'Customer Return' },
    { value: 'manual_adjustment', label: 'Manual Adjustment' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Navy', 'Olive', 'Brown', 'Beige', 'Cream', 'Charcoal'];
const CATEGORIES = ['TEES', 'HOODIES', 'BOTTOMS', 'Custom'];


const Inventory = () => {
    // --- State ---
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState("basic");
    const [uploadingImages, setUploadingImages] = useState(false);

    // Manage Variants / Stock Dialog
    const [manageVariantsOpen, setManageVariantsOpen] = useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);

    // Adjust Stock Dialog
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [selectedVariantForAdjust, setSelectedVariantForAdjust] = useState<ProductVariant | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [adjustmentNotes, setAdjustmentNotes] = useState("");

    // History Dialog
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedVariantForHistory, setSelectedVariantForHistory] = useState<ProductVariant | null>(null);

    // Forms
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
    const [variantsToDelete, setVariantsToDelete] = useState<string[]>([]);
    const [newVariant, setNewVariant] = useState({
        size: "",
        color: "",
        stock: "",
        actual_price: "",
        discounted_price: "",
        price_modifier: "0",
    });

    const queryClient = useQueryClient();

    // --- Queries ---
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

    // Fetch variants for selected product (Edit or Manage)
    const { data: productVariants } = useQuery({
        queryKey: ['admin', 'product', editingProduct?.id || selectedProductForVariants?.id, 'variants'],
        queryFn: async () => {
            const id = editingProduct?.id || selectedProductForVariants?.id;
            if (!id) return [];
            const { data, error } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', id)
                .eq('is_archived', false) // Only active
                .order('size', { ascending: true });

            if (error) throw error;
            return data as ProductVariant[];
        },
        enabled: !!editingProduct || !!selectedProductForVariants,
    });

    // Fetch stock history
    const { data: stockHistory } = useQuery({
        queryKey: ['stock_history', selectedVariantForHistory?.id],
        queryFn: async () => {
            if (!selectedVariantForHistory) return [];
            const { data, error } = await supabase
                .from('stock_history')
                .select('*')
                .eq('product_variant_id', selectedVariantForHistory.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as StockHistory[];
        },
        enabled: !!selectedVariantForHistory && historyDialogOpen,
    });


    // --- Effects ---
    useEffect(() => {
        if ((editingProduct || selectedProductForVariants) && productVariants) {
            const product = editingProduct || selectedProductForVariants;
            const basePrice = Number(product?.base_price || 0);

            const mappedVariants = productVariants.map(v => ({
                ...v,
                // If actual_price comes from DB, use it. Otherwise calculate from modifier.
                actual_price: v.actual_price || (v.price_modifier ? basePrice + Number(v.price_modifier) : basePrice),
                // Ensure stock is number
                stock: Number(v.stock || 0)
            }));
            setVariants(mappedVariants);
        }
    }, [productVariants, editingProduct, selectedProductForVariants]);


    // --- Helper Functions ---
    const getTotalStock = (product: ProductWithStock) => {
        return product.product_variants?.reduce((sum, variant) => {
            if (variant.is_archived) return sum;
            return sum + Number(variant.stock || 0);
        }, 0) || 0;
    };


    // --- Mutation Logic (Product CRUD) ---
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
                if (uploadedUrls.length > 0) {
                    if (newImages.length === 0) newImages = [uploadedUrls[0]];
                    else newImages[0] = uploadedUrls[0];
                }
            } else {
                newImages = [...newImages, ...uploadedUrls];
            }

            setProductForm({ ...productForm, images: newImages });
            toast.success("Image uploaded successfully!");
        } catch (error: any) {
            toast.error(`Failed to upload images: ${error.message}`);
        } finally {
            setUploadingImages(false);
            e.target.value = '';
        }
    };

    const handleRemoveImage = async (index: number, imageUrl: string) => {
        try {
            await deleteImage(imageUrl);
            const newImages = productForm.images.filter((_, i) => i !== index);
            setProductForm({ ...productForm, images: newImages });
            toast.success("Image removed");
        } catch (error: any) {
            const newImages = productForm.images.filter((_, i) => i !== index);
            setProductForm({ ...productForm, images: newImages });
        }
    };

    const setAsPrimary = (index: number) => {
        if (index === 0) return;
        const newImages = [...productForm.images];
        const [imageToMove] = newImages.splice(index, 1);
        newImages.unshift(imageToMove);
        setProductForm({ ...productForm, images: newImages });
    };

    // Variant Logic (Frontend)
    const handleAddVariant = () => {
        if (!newVariant.size || !newVariant.color) {
            toast.error("Please select size and color");
            return;
        }
        const exists = variants.some(v => v.size === newVariant.size && v.color === newVariant.color);
        if (exists) {
            toast.error("This size/color combination already exists");
            return;
        }

        const variant: ProductVariant = {
            id: `temp-${Date.now()}`,
            product_id: editingProduct?.id || selectedProductForVariants?.id || '',
            size: newVariant.size,
            color: newVariant.color,
            stock: Number(newVariant.stock) || 0,
            price_modifier: Number(newVariant.price_modifier) || 0,
            actual_price: newVariant.actual_price ? Number(newVariant.actual_price) : Number(productForm.base_price),
            discounted_price: newVariant.discounted_price ? Number(newVariant.discounted_price) : (productForm.discounted_price ? Number(productForm.discounted_price) : null),
            barcode: null,
        };

        setVariants([...variants, variant]);
        setNewVariant({ size: "", color: "", stock: "", actual_price: "", discounted_price: "", price_modifier: "0" });
    };

    const handleRemoveVariant = (variantId: string) => {
        if (!variantId.startsWith('temp-')) {
            setVariantsToDelete([...variantsToDelete, variantId]);
        }
        setVariants(variants.filter(v => v.id !== variantId));
    };

    const handleUpdateVariant = (variantId: string, field: string, value: any) => {
        setVariants(variants.map(v => v.id === variantId ? { ...v, [field]: value } : v));
    };


    // Create/Update Product
    const createProduct = useMutation({
        mutationFn: async () => {
            // Create product
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    name: productForm.name,
                    description: productForm.description || null,
                    base_price: variants.length > 0 ? Number(variants[0].actual_price || 0) : Number(productForm.base_price || 0),
                    discounted_price: variants.length > 0 ? (variants[0].discounted_price ? Number(variants[0].discounted_price) : null) : (productForm.discounted_price ? Number(productForm.discounted_price) : null),
                    category: productForm.category || null,
                    images: productForm.images.length > 0 ? productForm.images : null,
                    featured: productForm.featured,
                    is_new: productForm.is_new,
                    amazon_url: productForm.amazon_url || null,
                    amazon_asin: productForm.amazon_asin || null,
                    sku: productForm.sku || null,
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

                const { error: variantsError } = await supabase.from('product_variants').insert(variantData);
                if (variantsError) throw variantsError;
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success("Product created successfully");
            setDialogOpen(false);
            resetForm();
        },
        onError: (error) => toast.error(`Failed to create product: ${error.message}`)
    });

    const updateProduct = useMutation({
        mutationFn: async () => {
            if (!editingProduct && !selectedProductForVariants) return;
            const productId = editingProduct?.id || selectedProductForVariants?.id;
            if (!productId) return;

            // Update Metadata only if editing via Edit Dialog
            if (editingProduct) {
                const { error: productError } = await supabase
                    .from('products')
                    .update({
                        name: productForm.name,
                        description: productForm.description || null,
                        base_price: variants.length > 0 ? Number(variants[0].actual_price || 0) : 0,
                        discounted_price: variants.length > 0 ? (variants[0].discounted_price ? Number(variants[0].discounted_price) : null) : null,
                        category: productForm.category || null,
                        images: productForm.images.length > 0 ? productForm.images : null,
                        featured: productForm.featured,
                        is_new: productForm.is_new,
                        amazon_url: productForm.amazon_url || null,
                        amazon_asin: productForm.amazon_asin || null,
                        sku: productForm.sku || null,
                        material: productForm.material || null,
                        care_instructions: productForm.care_instructions || null,
                    })
                    .eq('id', productId);

                if (productError) throw productError;
            }

            // Sync Variants (Upsert/Delete)
            const productBasePrice = Number(productForm.base_price || 0);

            const variantsToUpsert = variants.map(v => {
                // Calculate modifier: (Desired Price - Base Price)
                // If actual_price is set, use it. If not, modifier is 0 (or previous modifier).
                // Safest: If user input actual_price, recalculate modifier.

                let modifier = Number(v.price_modifier || 0);
                if (v.actual_price) {
                    modifier = Number(v.actual_price) - productBasePrice;
                }

                const baseVariant = {
                    product_id: productId,
                    size: v.size,
                    color: v.color,
                    stock: Number(v.stock),
                    price_modifier: modifier,
                    // We still send actual_price/discounted_price if DB has them, but modifier is key for Storefront
                    actual_price: v.actual_price ? Number(v.actual_price) : null,
                    discounted_price: v.discounted_price ? Number(v.discounted_price) : null,
                    is_archived: false
                };

                // Only include ID for existing variants (not temp ones)
                // This allows upsert to work correctly with onConflict
                if (!v.id.startsWith('temp-')) {
                    return { ...baseVariant, id: v.id };
                }

                return baseVariant;
            });

            // Delete removed variants (Soft Delete)
            if (variantsToDelete.length > 0) {
                // We use soft delete because order_items may reference these variants
                const { error: deleteError } = await supabase
                    .from('product_variants')
                    .update({ is_archived: true })
                    .in('id', variantsToDelete);

                if (deleteError) throw deleteError;
            }
            // Split variants into new (temp IDs) and existing (real IDs)
            const newVariants = variantsToUpsert.filter(v => !('id' in v));
            const existingVariants = variantsToUpsert.filter(v => 'id' in v);

            // Insert or Upsert new variants (handles re-adding archived ones)
            if (newVariants.length > 0) {
                // We use upsert here because if we re-add a variant that was soft-deleted,
                // it still exists in the DB (is_archived=true).
                // Upsert with onConflict matches it and updates is_archived=false.
                const { error: insertError } = await supabase
                    .from('product_variants')
                    .upsert(newVariants, {
                        onConflict: 'product_id,size,color',
                        ignoreDuplicates: false
                    });

                if (insertError) throw insertError;
            }

            // Update existing variants (including un-archiving)
            if (existingVariants.length > 0) {
                for (const variant of existingVariants) {
                    const { error: updateError } = await supabase
                        .from('product_variants')
                        .update(variant)
                        .eq('id', variant.id);

                    if (updateError) throw updateError;
                }
            }

            // Archive removed
            // (Logic simplified: we rely on upsert updating existing. For deletions, we need to track IDs)
            // For now, let's just handle addition/updates. Deletions in "Manage" are instant?
            // Let's implement handleRemoveVariant to actually mark as archived if we save?
            // For simplicity, handleRemoveVariant just removes from UI list. 
            // Ideally we should track deletions.
        },
        onSuccess: async () => {
            const id = editingProduct?.id || selectedProductForVariants?.id;
            await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'product', id, 'variants'] });
            toast.success("Changes saved successfully");
            setDialogOpen(false);
            setManageVariantsOpen(false); // Close manage list if open
            if (editingProduct) resetForm();
            setEditingProduct(null);
            setSelectedProductForVariants(null);
            setVariantsToDelete([]); // Clear deletion list
        },
        onError: (error) => toast.error(`Failed to update: ${error.message}`)
    });

    const deleteProduct = useMutation({
        mutationFn: async (productId: string) => {
            const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', productId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success("Product archived");
        },
        onError: (error) => toast.error(error.message)
    });

    // --- Mutation Logic (Stock Adjustment) ---
    const adjustStock = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-stock`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'adjust',
                    variant_id: selectedVariantForAdjust?.id,
                    amount: Number(adjustmentAmount),
                    reason: adjustmentReason,
                    notes: adjustmentNotes,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to adjust stock');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'product', selectedProductForVariants?.id, 'variants'] }); // Refresh variants list
            queryClient.invalidateQueries({ queryKey: ['stock_history', selectedVariantForAdjust?.id] });
            toast.success('Stock adjusted successfully');
            setAdjustDialogOpen(false);
            setAdjustmentAmount("");
            setAdjustmentReason("");
            setAdjustmentNotes("");
        },
        onError: (error) => toast.error(error.message)
    });


    // --- UI Actions ---
    const resetForm = () => {
        setProductForm({
            name: "", description: "", base_price: "", discounted_price: "", category: "",
            images: [], featured: false, is_new: false, amazon_url: "", amazon_asin: "",
            sku: "", brand: "", material: "", care_instructions: "",
        });
        setVariants([]);
        setVariantsToDelete([]);
        setNewVariant({ size: "", color: "", stock: "", actual_price: "", discounted_price: "", price_modifier: "0" });
        setActiveTab("basic");
    };

    const handleOpenEdit = (product: Product) => {
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
        setDialogOpen(true);
    };

    const handleOpenManageVariants = (product: Product) => {
        setSelectedProductForVariants(product);
        // Reset local query-bound variants? They update via effect.
        setManageVariantsOpen(true);
    };

    const handleOpenAdjustStock = (variant: ProductVariant) => {
        setSelectedVariantForAdjust(variant);
        setAdjustDialogOpen(true);
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Inventory</h1>
                    <p className="text-grey-text mt-1">Manage products, variants, and stock levels</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => { resetForm(); setEditingProduct(null); setDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Products Table (Unified View) */}
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products?.map((product) => {
                                    const totalStock = getTotalStock(product);
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                {product.images?.[0] && (
                                                    <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded bg-muted" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">{product.sku}</div>
                                            </TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell>
                                                {product.discounted_price ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-red-500 font-bold">₹{product.discounted_price}</span>
                                                        <span className="line-through text-xs text-muted-foreground">₹{product.base_price}</span>
                                                    </div>
                                                ) : `₹${product.base_price}`}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={totalStock === 0 ? "text-red-500 border-red-500" : totalStock < 10 ? "text-yellow-500 border-yellow-500" : "text-green-500 border-green-500"}>
                                                    {totalStock}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenManageVariants(product)}>
                                                        <Package className="h-4 w-4 mr-1" /> Variants
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(product)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => { if (confirm("Delete product?")) deleteProduct.mutate(product.id) }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Dialog: Add/Edit Product (Metadata only mostly, but can add variants initially) */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold uppercase">{editingProduct ? "Edit Product Details" : "Add New Product"}</DialogTitle>
                    </DialogHeader>
                    {/* Render Form Logic Here (Simplified/Merged from Products.tsx) */}
                    <form onSubmit={(e) => { e.preventDefault(); editingProduct ? updateProduct.mutate() : createProduct.mutate() }} className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="variants">Variants</TabsTrigger>
                                <TabsTrigger value="details">Details</TabsTrigger>
                            </TabsList>
                            <TabsContent value="basic" className="space-y-4">
                                <div><Label>Name *</Label><Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required /></div>
                                <div><Label>Description</Label><Textarea value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Category</Label>
                                        <Select value={CATEGORIES.includes(productForm.category || '') ? productForm.category || '' : (productForm.category ? "Custom" : "")} onValueChange={(val) => setProductForm({ ...productForm, category: val === "Custom" ? "" : val })}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {((productForm.category && !CATEGORIES.includes(productForm.category)) || (!CATEGORIES.includes(productForm.category || '') && productForm.category === "")) && (
                                            <Input className="mt-2" placeholder="Custom Category" value={productForm.category || ''} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
                                        )}
                                    </div>
                                    <div><Label>SKU</Label><Input value={productForm.sku || ''} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} /></div>
                                </div>
                                <div>
                                    <Label>Images</Label>
                                    <div className="flex gap-4 mt-2 overflow-x-auto pb-2">
                                        {productForm.images.map((url, i) => (
                                            <div key={i} className="relative w-20 h-20 flex-shrink-0 group">
                                                <img src={url} className="w-full h-full object-cover rounded border" />
                                                <button type="button" onClick={() => handleRemoveImage(i, url)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                                                {i === 0 && <Badge className="absolute bottom-0 left-0 text-[8px] px-1">Main</Badge>}
                                                {i > 0 && <button type="button" onClick={() => setAsPrimary(i)} className="absolute bottom-0 left-0 bg-black/50 text-white text-[8px] px-1 opacity-0 group-hover:opacity-100">Set Main</button>}
                                            </div>
                                        ))}
                                        <label className="w-20 h-20 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
                                            {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleImageUpload(e)} disabled={uploadingImages} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex items-center space-x-2"><Checkbox id="feat" checked={productForm.featured} onCheckedChange={c => setProductForm({ ...productForm, featured: c as boolean })} /><Label htmlFor="feat">Featured</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="new" checked={productForm.is_new} onCheckedChange={c => setProductForm({ ...productForm, is_new: c as boolean })} /><Label htmlFor="new">New</Label></div>
                                </div>
                            </TabsContent>

                            <TabsContent value="variants" className="space-y-4">
                                <AlertTriangle className="h-4 w-4 inline mr-2 text-yellow-500" />
                                <span className="text-sm text-muted-foreground">Use "Manage Variants" from the main list for advanced stock control later.</span>

                                <div className="flex flex-wrap gap-2 items-end border p-2 rounded">
                                    <div><Label className="text-xs">Size</Label><Select value={newVariant.size} onValueChange={v => setNewVariant({ ...newVariant, size: v })}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                                    <div><Label className="text-xs">Color</Label><Select value={newVariant.color} onValueChange={v => setNewVariant({ ...newVariant, color: v })}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                                    <div><Label className="text-xs">Stock</Label><Input type="number" className="w-20" value={newVariant.stock} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} /></div>
                                    <div><Label className="text-xs">Price</Label><Input type="number" className="w-24" value={newVariant.actual_price} onChange={e => setNewVariant({ ...newVariant, actual_price: e.target.value })} placeholder={productForm.base_price?.toString()} /></div>
                                    <Button type="button" size="sm" onClick={handleAddVariant}><Plus className="h-4 w-4" /></Button>
                                </div>
                                <div className="max-h-60 overflow-y-auto border rounded">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Size</TableHead><TableHead>Color</TableHead><TableHead>Stock</TableHead><TableHead>Price</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {variants.map((v, idx) => (
                                                <TableRow key={v.id || idx}>
                                                    <TableCell>{v.size}</TableCell>
                                                    <TableCell>{v.color}</TableCell>
                                                    <TableCell>{v.stock}</TableCell>
                                                    <TableCell>{v.actual_price}</TableCell>
                                                    <TableCell><Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveVariant(v.id)}><X className="h-4 w-4" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="details" className="space-y-4">
                                <div><Label>Material</Label><Input value={productForm.material || ''} onChange={e => setProductForm({ ...productForm, material: e.target.value })} /></div>
                                <div><Label>Care Instructions</Label><Textarea value={productForm.care_instructions || ''} onChange={e => setProductForm({ ...productForm, care_instructions: e.target.value })} /></div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Save Product</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Manage Variants (Unified Stock & Price Management) */}
            <Dialog open={manageVariantsOpen} onOpenChange={setManageVariantsOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold uppercase">Manage Variants: {selectedProductForVariants?.name}</DialogTitle>
                        <DialogDescription>Adjust stock levels and update pricing for each variant.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Quick Add Variant */}
                        <div className="flex flex-wrap gap-2 items-end bg-muted p-4 rounded-lg">
                            <div><Label className="text-xs uppercase font-bold">Size</Label><Select value={newVariant.size} onValueChange={v => setNewVariant({ ...newVariant, size: v })}><SelectTrigger className="w-24 bg-background"><SelectValue /></SelectTrigger><SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label className="text-xs uppercase font-bold">Color</Label><Select value={newVariant.color} onValueChange={v => setNewVariant({ ...newVariant, color: v })}><SelectTrigger className="w-32 bg-background"><SelectValue /></SelectTrigger><SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label className="text-xs uppercase font-bold">Initial Stock</Label><Input type="number" className="w-24 bg-background" value={newVariant.stock} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} /></div>
                            <div><Label className="text-xs uppercase font-bold">Price Override</Label><Input type="number" className="w-28 bg-background" value={newVariant.actual_price} onChange={e => setNewVariant({ ...newVariant, actual_price: e.target.value })} placeholder="Inherit" /></div>
                            <div><Label className="text-xs uppercase font-bold">Discount Price</Label><Input type="number" className="w-28 bg-background" value={newVariant.discounted_price} onChange={e => setNewVariant({ ...newVariant, discounted_price: e.target.value })} placeholder="Optional" /></div>
                            <Button onClick={handleAddVariant} disabled={!newVariant.size || !newVariant.color}><Plus className="h-4 w-4 mr-2" /> Add Variant</Button>
                        </div>

                        {/* Variants List with Actions */}
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Color</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Discount</TableHead>
                                        <TableHead className="text-center">Stock Level</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {variants.map((variant) => (
                                        <TableRow key={variant.id}>
                                            <TableCell className="font-bold">{variant.size}</TableCell>
                                            <TableCell>{variant.color}</TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    className="w-24 text-right inline-block h-8"
                                                    value={variant.actual_price || ''}
                                                    onChange={e => handleUpdateVariant(variant.id, 'actual_price', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    className="w-24 text-right inline-block h-8"
                                                    value={variant.discounted_price || ''}
                                                    onChange={e => handleUpdateVariant(variant.id, 'discounted_price', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`font-mono font-bold ${variant.stock < 5 ? 'text-red-500' : 'text-green-600'}`}>{variant.stock}</span>
                                                    {!variant.id.startsWith('temp-') && (
                                                        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleOpenAdjustStock(variant)}>Adjust</Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!variant.id.startsWith('temp-') && (
                                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedVariantForHistory(variant); setHistoryDialogOpen(true); }}>
                                                            <History className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if (confirm("Remove variant?")) handleRemoveVariant(variant.id); }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {variants.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No variants found.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setManageVariantsOpen(false); setVariants([]); setSelectedProductForVariants(null); setVariantsToDelete([]); }}>Close</Button>
                            <Button onClick={() => updateProduct.mutate()}>Save Changes</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog: Adjust Stock (History Logged) */}
            <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-heading uppercase">Adjust Stock</DialogTitle>
                        <DialogDescription>{selectedVariantForAdjust?.size} / {selectedVariantForAdjust?.color}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-4 justify-center">
                            <Button variant="outline" size="icon" onClick={() => setAdjustmentAmount(s => String(Number(s || 0) - 1))}><Minus className="h-4 w-4" /></Button>
                            <Input type="number" className="text-center w-24 text-lg font-bold" value={adjustmentAmount} onChange={e => setAdjustmentAmount(e.target.value)} placeholder="0" />
                            <Button variant="outline" size="icon" onClick={() => setAdjustmentAmount(s => String(Number(s || 0) + 1))}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                            Current: {selectedVariantForAdjust?.stock} → New: {(selectedVariantForAdjust?.stock || 0) + Number(adjustmentAmount)}
                        </div>
                        <div>
                            <Label>Reason</Label>
                            <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                                <SelectTrigger><SelectValue placeholder="Select Reason" /></SelectTrigger>
                                <SelectContent>{STOCK_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Input value={adjustmentNotes} onChange={e => setAdjustmentNotes(e.target.value)} placeholder="Optional notes" />
                        </div>
                        <Button onClick={() => adjustStock.mutate()} className="w-full" disabled={adjustStock.isPending || !adjustmentAmount || !adjustmentReason}>
                            {adjustStock.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirm Adjustment"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog: Stock History */}
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle className="font-heading uppercase">Stock History</DialogTitle></DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-2">
                        {stockHistory?.map(entry => (
                            <div key={entry.id} className="border p-3 rounded flex justify-between items-center text-sm">
                                <div>
                                    <div className="font-bold uppercase flex items-center gap-2">
                                        <Badge variant={entry.change_amount > 0 ? "default" : "destructive"}>{entry.change_amount > 0 ? '+' : ''}{entry.change_amount}</Badge>
                                        {entry.reason.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-muted-foreground mt-1">{entry.previous_stock} → {entry.new_stock}</div>
                                    {entry.notes && <div className="text-xs italic mt-1">{entry.notes}</div>}
                                </div>
                                <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</div>
                            </div>
                        ))}
                        {stockHistory?.length === 0 && <div className="text-center text-muted-foreground py-4">No history found.</div>}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default Inventory;
